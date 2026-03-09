/**
 * ============================================================
 *  GBX v1 — Script principal
 *  Gère : émulateur, contrôles, sidebar, auth, couleurs,
 *         sauvegardes, vitesse, mapping clavier AZERTY
 * ============================================================
 */

'use strict';

/* ============================================================
   SUPABASE — Initialisation
   ============================================================ */
const _supa = supabase.createClient(
    "https://rchghwpxazjakmjloymm.supabase.co",
    "sb_publishable_5WaSGIXTFg1atLdxvKDVTw_TJ3viZjd"
);

/* ============================================================
   0. ÉTAT GLOBAL
   ============================================================ */
const GBX = {
    // Émulateur
    emulator:       null,       // Instance EmulatorJS
    currentGame:    null,       // Objet jeu en cours { id, name, file, type, ... }
    speedActive:    false,      // Vitesse rapide activée ou non
    isRunning:      false,      // Jeu en cours de lecture

    // UI
    sidebarOpen:    false,
    contactOpen:    false,
    currentModal:   null,       // 'login' | 'register' | 'profile' | null

    // Auth (simulé côté front — à connecter à votre backend)
    user:           null,       // null = non connecté

};

/* ============================================================
   1. INITIALISATION AU CHARGEMENT
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
    applyStyleConfig();       // Injecter les variables CSS depuis style.config.js
    buildGameSelect();        // Remplir le menu déroulant des jeux
    buildColorGrid();         // Construire la grille de couleurs
    restoreColor();           // Restaurer la couleur de la GB (localStorage / user)
    setupSidebar();           // Événements du volet latéral
    setupTopButtons();        // Boutons S (speed) et M (menu)
    setupGameControls();      // Boutons de la gameboy (clic + tactile)
    setupKeyboard();          // Mapping clavier AZERTY
    setupAuthUI();            // Connexion / Inscription
    setupContactForm();       // Formulaire de contact
    setupGameSelector();      // Sélecteur de jeu + bouton Eject
    checkMobileOrientation(); // Gestion rotation mobile

    // ── Restaurer la session Supabase ────────────────────────
    const { data: { session } } = await _supa.auth.getSession();
    if (session) {
        const { data: profile } = await _supa
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
        if (profile) {
            GBX.user = { ...profile, supaId: session.user.id };
        }
    }
    updateAuthUI(); // Mettre à jour l'UI selon l'état de connexion
});

/* ============================================================
   2. STYLE CONFIG → CSS VARIABLES
   ============================================================ */
function applyStyleConfig() {
    const cfg = GBX_STYLE_CONFIG;
    const root = document.documentElement;
    // Effet press
    root.style.setProperty('--press-y',        cfg.pressEffect.translateY);
    root.style.setProperty('--press-scale',    cfg.pressEffect.scaleDown);
    root.style.setProperty('--press-duration', cfg.pressEffect.duration);
    // Glare de l'écran
    root.style.setProperty('--glare-opacity',  cfg.screen.glareOpacity);
    // Position écran en landscape
    root.style.setProperty('--landscape-screen-offset-y', cfg.landscapeScreenOffsetY || '0px');
}

/* ============================================================
   3. MENU DÉROULANT — JEUX
   ============================================================ */
function buildGameSelect() {
    const select = document.getElementById('game-select');
    select.innerHTML = '<option value="">— Sélectionner un jeu —</option>';

    // Grouper par type — ordre : GBA > GBC > GB
    const groups = {
        gba: { label: '🎮 Game Boy Advance', games: [] },
        gbc: { label: '🌈 Game Boy Color',   games: [] },
        gb:  { label: '⬜ Game Boy Classic',  games: [] },
    };

    GBX_GAMES.forEach(game => {
        if (groups[game.type]) groups[game.type].games.push(game);
    });

    Object.entries(groups).forEach(([type, group]) => {
        if (group.games.length === 0) return;
        const optgroup = document.createElement('optgroup');
        optgroup.label = group.label;
        group.games.forEach(game => {
            const opt = document.createElement('option');
            opt.value   = game.id;
            opt.dataset.file = game.file;
            opt.dataset.type = game.type;
            opt.textContent  = game.name;
            optgroup.appendChild(opt);
        });
        select.appendChild(optgroup);
    });

    // Remplir aussi le sélecteur de sauvegardes
    buildSavesSelect();
}

function setupGameSelector() {
    const select = document.getElementById('game-select');
    const eject  = document.getElementById('btn-eject');

    // Bloquer l'ouverture du dropdown si un jeu est en cours
    select.addEventListener('mousedown', (e) => {
        if (GBX.isRunning) {
            e.preventDefault();
            showEjectBubble();
        }
    });
    select.addEventListener('touchstart', (e) => {
        if (GBX.isRunning) {
            e.preventDefault();
            showEjectBubble();
        }
    }, { passive: false });

    select.addEventListener('change', () => {
        const gameId = select.value;
        if (!gameId) return;

        // Bloquer si un jeu est en cours
        if (GBX.isRunning) {
            select.value = GBX.currentGame ? GBX.currentGame.id : '';
            showEjectBubble();
            return;
        }

        const game = GBX_GAMES.find(g => g.id === gameId);
        if (game) launchGame(game);
    });

    eject.addEventListener('click', () => {
        addPressEffect(eject);
        // Popup de confirmation sauvegarde uniquement pour les utilisateurs connectés
        if (GBX.user && GBX.isRunning) {
            showEjectConfirm();
        } else {
            setTimeout(() => window.location.reload(), 120);
        }
    });
}

/* ============================================================
   4. LANCEMENT DU JEU
   ============================================================ */
async function launchGame(game) {
    GBX.currentGame = game;
    GBX.isRunning   = true;
    const container = document.getElementById('ejs-container');

    // Masquer l'écran d'accueil
    const welcome = document.getElementById('welcome-screen');
    if (welcome) welcome.classList.add('hidden');

    // Vider le conteneur précédent
    container.innerHTML = '';

    // Mode écran
    updateScreenMode(game.type);

    // Activer/désactiver L et R
    updateLRButtons(game.type);

    // ── Précharger la save dans IndexedDB AVANT de lancer le core ──
    window.EJS_externalFiles = undefined;
    window.EJS_onSaveSave    = undefined;
    window.EJS_onLoadSave    = undefined;
    if (GBX.user) {
        try {
            const { data } = await _supa
                .from('saves')
                .select('save_data')
                .eq('user_id', GBX.user.id)
                .eq('game_id', game.id)
                .maybeSingle();
            if (data?.save_data) {
                // Convertir base64 → Uint8Array
                const base64 = data.save_data.split(',')[1];
                const binary = atob(base64);
                const bytes  = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                // Écrire dans IndexedDB — c'est là que gambatte lit sa SRAM au démarrage
                await writeToIndexedDB(getSavePath(game), bytes);
            }
        } catch(e) {
            console.warn('GBX: erreur préchargement save', e);
        }
    }

    // Variables EmulatorJS
    window.EJS_player     = '#ejs-container';
    window.EJS_gameUrl    = game.file;
    window.EJS_core       = GBX_EMULATOR_CONFIG.cores[game.type] || 'mgba';
    window.EJS_pathtodata = GBX_EMULATOR_CONFIG.dataPath;

    window.EJS_startOnLoaded      = false; // On démarre manuellement après injection save
    window.EJS_fullscreenOnLoaded = GBX_EMULATOR_CONFIG.fullscreenOnLoad;
    window.EJS_volume             = GBX_EMULATOR_CONFIG.volume;
    window.EJS_CacheLimit         = GBX_EMULATOR_CONFIG.cacheLimit;
    window.EJS_threads            = GBX_EMULATOR_CONFIG.threads;
    window.EJS_disableCue         = GBX_EMULATOR_CONFIG.disableCue;
    window.EJS_noAutoFocus        = GBX_EMULATOR_CONFIG.noAutoFocus;
    window.EJS_softLoad           = GBX_EMULATOR_CONFIG.softLoad;
    window.EJS_gameName           = game.name;
    window.EJS_gameID             = game.id;

    // Masquer le menu intégré d'EmulatorJS (on a le nôtre)
    window.EJS_hideSettings = true;

    // Désactiver les contrôles tactiles natifs d'EmulatorJS (on a les nôtres)
    window.EJS_VirtualGamepad    = false;
    window.EJS_noVirtualGamepad  = true;

    // Mapping clavier (voir emulator.config.js)
    window.EJS_defaultControls = buildDefaultControls();

    // Callbacks save
    window.EJS_onSaveSave = undefined;
    window.EJS_onLoadSave = undefined;

    // Callbacks EmulatorJS
    window.EJS_ready = async () => {
        GBX.emulator    = window.EJS_emulator;
        GBX.speedActive = false;
        updateSpeedButton();

        // ── Injecter la save dans IndexedDB puis démarrer le core ──
        if (GBX.user) {
            try {
                const { data } = await _supa
                    .from('saves')
                    .select('save_data')
                    .eq('user_id', GBX.user.id)
                    .eq('game_id', game.id)
                    .maybeSingle();
                if (data?.save_data) {
                    const base64 = data.save_data.split(',')[1];
                    const binary = atob(base64);
                    const bytes  = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                    await writeToIndexedDB(getSavePath(game), bytes);
                    // Attendre que IDBFS sync l'écriture vers le FS WASM
                    await new Promise(r => setTimeout(r, 300));
                }
            } catch(e) {
                console.warn('GBX: erreur injection save', e);
            }
        }

        // Démarrer le core maintenant que la save est en place
        GBX.emulator.startGame();
        GBX.isRunning = true;
        showToast('🎮 ' + game.name + ' lancé !', 'success');

        if (GBX.user) {
            // ── Autosave SRAM toutes les 10 secondes ──────────
            clearInterval(GBX.autosaveTimer);
            GBX.autosaveTimer = setInterval(async () => {
                try {
                    const saveData = readSaveFile(game);
                    if (saveData) await uploadSaveToServer(GBX.currentGame, saveData, true);
                } catch(e) {}
            }, 10000);
        }
    };

    // EJS_onGameStart — core réellement chargé
    window.EJS_onGameStart = () => {
        // Colorisation GBC automatique pour les jeux Game Boy Classic (.gb)
        if (game.type === 'gb' && window.EJS_emulator) {
            window.EJS_emulator.changeSettingOption('gambatte_gb_colorization', 'GBC');
        }
    };

    // Charger le loader EmulatorJS dynamiquement
    const oldLoader = document.getElementById('ejs-loader');
    if (oldLoader) oldLoader.remove();

    const script = document.createElement('script');
    script.id  = 'ejs-loader';
    script.src = GBX_EMULATOR_CONFIG.dataPath + 'loader.js';
    document.head.appendChild(script);
}

/**
 * Construit EJS_defaultControls au format attendu par EmulatorJS v4
 * Format : { "0": [{"value":"KeyA","player":1}], "1": [...], ... }
 */
function buildDefaultControls() {
    const mapping  = GBX_EMULATOR_CONFIG.keyboardMapping;
    const controls = {};
    Object.entries(mapping).forEach(([index, [key, player]]) => {
        controls[String(index)] = [{ value: key, player: player }];
    });
    return controls;
}

/**
 * Adapte l'écran selon le type de jeu
 */
function updateScreenMode(type) {
    const sc = document.getElementById('screen-container');
    if (type === 'gba') {
        sc.classList.remove('mode-gb');
        sc.classList.add('mode-gba');
    } else {
        sc.classList.remove('mode-gba');
        sc.classList.add('mode-gb');
    }
}

/**
 * Active/désactive les boutons L et R selon le type de jeu
 */
function updateLRButtons(type) {
    const lBtn = document.getElementById('btn-l');
    const rBtn = document.getElementById('btn-r');
    if (type === 'gba') {
        lBtn.disabled = false;
        rBtn.disabled = false;
        lBtn.classList.remove('disabled');
        rBtn.classList.remove('disabled');
    } else {
        lBtn.disabled = true;
        rBtn.disabled = true;
        lBtn.classList.add('disabled');
        rBtn.classList.add('disabled');
    }
}

/* ============================================================
   5. BOUTON SPEED (orange "S")
   ============================================================ */
function setupTopButtons() {
    const speedBtn = document.getElementById('btn-speed');
    const menuBtn  = document.getElementById('btn-menu');

    // Speed — toggle ON/OFF
    speedBtn.addEventListener('click', () => {
        addPressEffect(speedBtn);
        toggleSpeed();
    });

    // Menu — ouvre la sidebar
    menuBtn.addEventListener('click', () => {
        addPressEffect(menuBtn);
        toggleSidebar(true);
    });
}

function toggleSpeed() {
    GBX.speedActive = !GBX.speedActive;

    if (GBX.emulator && GBX.isRunning) {
        try {
            GBX.emulator.gameManager.functions.toggleFastForward(GBX.speedActive);
        } catch(e) { /* émulateur pas prêt */ }
    }

    updateSpeedButton();
}

function updateSpeedButton() {
    const btn = document.getElementById('btn-speed');

    btn.classList.remove('speed-x2', 'speed-x4');
    if (GBX.speedActive) {
        btn.classList.add('speed-x2');
        btn.textContent = 'x2';
        showToast('⚡ Vitesse rapide activée !', 'info');
    } else {
        btn.textContent = 'S';
        showToast('🐢 Vitesse normale', 'info');
    }
}

/* ============================================================
   6. CONTRÔLES DE LA GAMEBOY (clic + tactile)
   ============================================================ */
function setupGameControls() {
    // Mapping : [id du bouton HTML] → [index EmulatorJS du bouton]
    // Indices EJS : 0=A, 1=B, 2=Start, 3=Select, 4=Up, 5=Down, 6=Left, 7=Right, 8=L, 9=R
    const buttonMap = {
        'btn-a':       0,
        'btn-b':       1,
        'btn-start':   3,
        'btn-select':  2,
        'dpad-up':     4,
        'dpad-down':   5,
        'dpad-left':   6,
        'dpad-right':  7,
        'btn-l':       8,
        'btn-r':       9,
    };

    Object.entries(buttonMap).forEach(([btnId, ejsIndex]) => {
        const el = document.getElementById(btnId);
        if (!el) return;

        // Souris
        el.addEventListener('mousedown',  (e) => { e.preventDefault(); pressButton(el, ejsIndex, true);  });
        el.addEventListener('mouseup',    (e) => { e.preventDefault(); pressButton(el, ejsIndex, false); });
        el.addEventListener('mouseleave', (e) => { pressButton(el, ejsIndex, false); });

        // Tactile
        el.addEventListener('touchstart', (e) => { e.preventDefault(); pressButton(el, ejsIndex, true);  }, { passive: false });
        el.addEventListener('touchend',   (e) => { e.preventDefault(); pressButton(el, ejsIndex, false); }, { passive: false });
        el.addEventListener('touchcancel',(e) => { e.preventDefault(); pressButton(el, ejsIndex, false); }, { passive: false });
    });

    // Boutons sidebar (effet press)
    document.querySelectorAll('.sidebar-btn, .modal-btn, .save-action-btn, .contact-submit').forEach(btn => {
        btn.addEventListener('mousedown', () => addPressEffect(btn));
    });
}

/**
 * Presse ou relâche un bouton de la Gameboy (clic/tactile)
 */
function pressButton(el, ejsIndex, isDown) {
    if (el.disabled) return;

    if (isDown) { el.classList.add('pressed'); }
    else        { el.classList.remove('pressed'); }

    _ejsSimulate(ejsIndex, isDown ? 1 : 0);
}


/* ============================================================
   7. MAPPING CLAVIER AZERTY
   ============================================================ */

/* ============================================================
   MAPPING CLAVIER AZERTY → indices réels gameManager.simulateInput
   ============================================================
   Découverts empiriquement sur EmulatorJS v4.3.0-beta / gambatte :
     A=8, B=0, Start=3, Select=2
     Haut=4, Bas=5, Gauche=6, Droite=7
     L=10, R=12

   STRATÉGIE :
     On intercepte les touches AZERTY en capture=true avec
     stopImmediatePropagation() — EJS ne les voit jamais.
     On appelle directement gameManager.simulateInput(player, index, value)
     sans aucun re-dispatch clavier (isTrusted ne pose plus aucun problème).
   ============================================================ */

/**
 * Touche AZERTY (code physique QWERTY) → index simulateInput + bouton HTML
 */
const AZERTY_MAP = {
    'KeyQ':       { ejsIndex: 8,  btnId: 'btn-a'      }, // A AZERTY    → bouton A
    'KeyW':       { ejsIndex: 0,  btnId: 'btn-b'      }, // Z AZERTY    → bouton B
    'KeyA':       { ejsIndex: 2,  btnId: 'btn-select' }, // Q AZERTY    → Select
    'KeyS':       { ejsIndex: 3,  btnId: 'btn-start'  }, // S AZERTY    → Start
    'ArrowUp':    { ejsIndex: 4,  btnId: 'dpad-up'    },
    'ArrowDown':  { ejsIndex: 5,  btnId: 'dpad-down'  },
    'ArrowLeft':  { ejsIndex: 6,  btnId: 'dpad-left'  },
    'ArrowRight': { ejsIndex: 7,  btnId: 'dpad-right' },
    'KeyZ':       { ejsIndex: 10, btnId: 'btn-l'      }, // W AZERTY    → bouton L
    'KeyX':       { ejsIndex: 11, btnId: 'btn-r'      }, // X AZERTY    → bouton R
};

/**
 * Table bouton HTML (index pressButton) → index simulateInput réel
 * Utilisée par les clics souris et tactile.
 */
const BTN_TO_EJS = {
    0: 8,   // A
    1: 0,   // B
    2: 3,   // Start
    3: 2,   // Select
    4: 4,   // Haut
    5: 5,   // Bas
    6: 6,   // Gauche
    7: 7,   // Droite
    8: 10,  // L
    9: 11,  // R
};

/**
 * Envoie un input à EJS via gameManager.simulateInput.
 * player=0, index=indice réel découvert empiriquement, value=1/0
 */
function _ejsSimulate(btnIndex, value) {
    const ejsIndex = BTN_TO_EJS[btnIndex];
    if (ejsIndex === undefined) return;
    const gm = GBX.emulator?.gameManager;
    if (!gm) return;
    try {
        gm.simulateInput(0, ejsIndex, value);
    } catch(e) { /* émulateur pas encore prêt */ }
}

function setupKeyboard() {
    // Semicolon (touche M AZERTY) → menu sidebar
    // KeyL (touche L AZERTY, code physique KeyL) → speed
    const gbxKeys = {
        'Semicolon': () => toggleSidebar(!GBX.sidebarOpen), // touche M AZERTY
        'KeyL': () => {
            const btn = document.getElementById('btn-speed');
            if (btn) addPressEffect(btn);
            toggleSpeed();
        },
    };

    document.addEventListener('keydown', (e) => {
        if (isModalOpen()) return;
        if (e.repeat) return;

        if (gbxKeys[e.code]) {
            e.preventDefault();
            e.stopImmediatePropagation();
            gbxKeys[e.code]();
            return;
        }

        const m = AZERTY_MAP[e.code];
        if (m) {
            e.preventDefault();
            e.stopImmediatePropagation();

            // Effet visuel
            const el = document.getElementById(m.btnId);
            if (el && !el.disabled) el.classList.add('pressed');

            // Envoyer à EJS via simulateInput
            const gm = GBX.emulator?.gameManager;
            if (gm) {
                try { gm.simulateInput(0, m.ejsIndex, 1); } catch(e) {}
            }
        }
    }, true);

    document.addEventListener('keyup', (e) => {
        if (isModalOpen()) return;

        if (gbxKeys[e.code]) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
        }

        const m = AZERTY_MAP[e.code];
        if (m) {
            e.preventDefault();
            e.stopImmediatePropagation();

            const el = document.getElementById(m.btnId);
            if (el) el.classList.remove('pressed');

            const gm = GBX.emulator?.gameManager;
            if (gm) {
                try { gm.simulateInput(0, m.ejsIndex, 0); } catch(e) {}
            }
        }
    }, true);
}

function isModalOpen() {
    return document.querySelector('.modal-backdrop.open') !== null;
}

/* ============================================================
   BULLE "EJECT D'ABORD"
   ============================================================ */
let ejectBubbleTimer = null;
function showEjectBubble() {
    const bubble = document.getElementById('eject-bubble');
    if (!bubble) return;
    clearTimeout(ejectBubbleTimer);
    bubble.textContent = "EJECT d'abord ton jeu !";
    bubble.style.opacity = '1';
    bubble.style.display = 'block';
    // Vibration du bouton EJECT
    const btnEject = document.getElementById('btn-eject');
    if (btnEject) {
        btnEject.classList.remove('shake');
        void btnEject.offsetWidth;
        btnEject.classList.add('shake');
        btnEject.addEventListener('animationend', () => btnEject.classList.remove('shake'), { once: true });
    }
    ejectBubbleTimer = setTimeout(() => {
        bubble.style.opacity = '0';
        setTimeout(() => { bubble.style.display = 'none'; }, 400);
    }, 3000);
}

/* ============================================================
   POPUP CONFIRMATION EJECT
   ============================================================ */
function showEjectConfirm() {
    const backdrop = document.createElement('div');
    backdrop.id = 'eject-confirm-backdrop';
    backdrop.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:9999',
        'background:rgba(0,0,0,0.6)',
        'display:flex', 'align-items:center', 'justify-content:center',
    ].join(';');

    backdrop.innerHTML = `
        <div style="background:#1e1e2e;border-radius:16px;padding:28px 32px;max-width:320px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.5);">
            <div style="font-size:2rem;margin-bottom:8px">💾</div>
            <h3 style="color:#fff;margin:0 0 10px;font-size:1.1rem">T'as pensé à sauvegarder ?</h3>
            <p style="color:#aaa;font-size:0.88rem;margin:0 0 22px;line-height:1.5">
                Si tu éjectes maintenant sans avoir sauvegardé,<br>ta progression sera perdue.
            </p>
            <div style="display:flex;gap:10px;justify-content:center">
                <button id="eject-cancel" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;background:#2a2a3e;color:#ccc;font-size:0.9rem;font-weight:600">⬅️ Retour</button>
                <button id="eject-confirm" style="flex:1;padding:10px;border-radius:10px;border:none;cursor:pointer;background:#e63946;color:#fff;font-size:0.9rem;font-weight:700">Éjecter quand même</button>
            </div>
        </div>
    `;

    document.body.appendChild(backdrop);

    document.getElementById('eject-cancel').addEventListener('click', () => backdrop.remove());
    document.getElementById('eject-confirm').addEventListener('click', () => {
        backdrop.remove();
        setTimeout(() => window.location.reload(), 80);
    });
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });
}

/* ============================================================
   8. SIDEBAR
   ============================================================ */
function setupSidebar() {
    const overlay  = document.getElementById('overlay');
    const closeBtn = document.getElementById('btn-close-sidebar');

    overlay.addEventListener('click',  () => toggleSidebar(false));
    closeBtn.addEventListener('click', () => toggleSidebar(false));
}

function toggleSidebar(open) {
    GBX.sidebarOpen = open;
    const sidebar  = document.getElementById('sidebar');
    const overlay  = document.getElementById('overlay');
    const app      = document.getElementById('app');

    sidebar.classList.toggle('open', open);
    overlay.classList.toggle('visible', open);
    // Sur PC, pousser le contenu principal
    if (window.innerWidth > 480) {
        app.classList.toggle('sidebar-open', open);
    }
}

/* ============================================================
   9. COULEURS DE LA GAMEBOY
   ============================================================ */
function buildColorGrid() {
    const grid = document.getElementById('color-grid');
    grid.innerHTML = '';

    GBX_STYLE_CONFIG.colors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className   = 'color-swatch';
        swatch.dataset.id  = color.id;
        swatch.dataset.name= color.name;
        swatch.title       = color.name;

        // Couleur de fond du swatch
        swatch.style.background = `linear-gradient(135deg, ${color.body}, ${color.body2})`;

        if (color.shimmer)      swatch.classList.add('shimmer-swatch');
        if (color.transparent) {
            swatch.style.backdropFilter = 'blur(4px)';
            swatch.style.border         = '1px solid rgba(255,255,255,0.25)';
        }

        swatch.addEventListener('click', () => applyColor(color.id));
        grid.appendChild(swatch);
    });
}

function applyColor(colorId) {
    const color = GBX_STYLE_CONFIG.colors.find(c => c.id === colorId);
    if (!color) return;

    const gb   = document.getElementById('gameboy');
    const root = document.documentElement;

    // Appliquer les variables CSS
    root.style.setProperty('--gbody',  color.body);
    root.style.setProperty('--gbody2', color.body2);

    // Classes spéciales
    gb.classList.toggle('shimmer',          color.shimmer);
    gb.classList.toggle('transparent-body', color.transparent);

    // Marquer le swatch actif
    document.querySelectorAll('.color-swatch').forEach(s => {
        s.classList.toggle('active', s.dataset.id === colorId);
    });

    // Sauvegarder
    localStorage.setItem('gbx-color', colorId);
    if (GBX.user) saveUserColorToServer(colorId);
}

function restoreColor() {
    // Priorité : préférence serveur (si connecté) > localStorage > défaut
    const saved = localStorage.getItem('gbx-color') || GBX_STYLE_CONFIG.defaultColor;
    applyColor(saved);
}

/* ============================================================
   10. AUTHENTIFICATION (UI — à connecter à votre backend)
   ============================================================ */
function setupAuthUI() {
    // Bouton Connexion/Inscription dans la sidebar
    document.getElementById('btn-auth').addEventListener('click', () => {
        if (GBX.user) {
            openModal('profile');
            // Remplir les infos du profil
            document.getElementById('modal-profile-avatar').src = GBX.user.avatar || 'assets/avatar-default.png';
            document.getElementById('modal-profile-pseudo').textContent  = GBX.user.pseudo;
            document.getElementById('modal-profile-pokemon').textContent = GBX.user.pokemon || '';
            // Réinitialiser la zone d'upload
            const preview = document.getElementById('avatar-profile-preview');
            const hint    = document.getElementById('avatar-profile-hint');
            const saveBtn = document.getElementById('btn-save-avatar');
            if (preview) { preview.style.display = 'none'; preview.src = ''; }
            if (hint)    hint.textContent = 'Cliquer pour choisir';
            if (saveBtn) saveBtn.style.display = 'none';
        } else {
            openModal('login');
        }
    });

    // Fermeture des modals
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeModal();
        });
    });

    // Formulaire de connexion
    document.getElementById('form-login').addEventListener('submit', handleLogin);

    // Formulaire d'inscription
    document.getElementById('form-register').addEventListener('submit', handleRegister);

    // Switch login ↔ register
    document.getElementById('switch-to-register').addEventListener('click', (e) => {
        e.preventDefault();
        openModal('register');
    });
    document.getElementById('switch-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        openModal('login');
    });

    // Upload avatar (inscription)
    setupAvatarUpload();
    // Upload avatar (profil)
    setupProfileAvatarUpload();

    // Remplir la liste Pokémon
    buildPokemonSelect();

    // Déconnexion
    document.getElementById('btn-logout')?.addEventListener('click', handleLogout);

    // Fermer les modals avec Echap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function openModal(type) {
    closeModal(); // Fermer tout d'abord
    GBX.currentModal = type;
    const modal = document.getElementById('modal-' + type);
    if (modal) {
        modal.classList.add('open');
        toggleSidebar(false);
    }
}

function closeModal() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
    GBX.currentModal = null;
}

/* ─── Connexion ───────────────────────────────────────────── */
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pwd   = document.getElementById('login-pwd').value;

    if (!email || !pwd) {
        showToast('Remplis tous les champs !', 'error');
        return;
    }

    const { data, error } = await _supa.auth.signInWithPassword({ email, password: pwd });
    if (error) {
        showToast('❌ Email ou mot de passe incorrect.', 'error');
        return;
    }

    // Charger le profil depuis la table users
    const { data: profile } = await _supa
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

    GBX.user = { ...profile, supaId: data.user.id };
    closeModal();
    updateAuthUI();
    restoreColor();
    showToast('✅ Bienvenue ' + GBX.user.pseudo + ' !', 'success');
}

/* ─── Inscription ─────────────────────────────────────────── */
async function handleRegister(e) {
    e.preventDefault();
    const pseudo  = document.getElementById('reg-pseudo').value.trim();
    const email   = document.getElementById('reg-email').value.trim();
    const pwd     = document.getElementById('reg-pwd').value;
    const pokemon = document.getElementById('reg-pokemon').value;
    const avatar  = document.getElementById('reg-avatar-data').value || 'assets/avatar-default.png';

    if (!pseudo || !email || !pwd) {
        showToast('Remplis tous les champs obligatoires !', 'error');
        return;
    }
    if (pwd.length < 6) {
        showToast('Le mot de passe doit faire au moins 6 caractères.', 'error');
        return;
    }

    // Vérifier pseudo unique
    const { data: existingPseudo } = await _supa
        .from('users')
        .select('id')
        .ilike('pseudo', pseudo)
        .maybeSingle();
    if (existingPseudo) {
        showToast('❌ Ce pseudo est déjà pris, choisis-en un autre !', 'error');
        return;
    }

    // Créer le compte Supabase Auth
    const { data, error } = await _supa.auth.signUp({ email, password: pwd });
    if (error) {
        if (error.message.includes('already registered')) {
            showToast('❌ Cet email est déjà utilisé.', 'error');
        } else {
            showToast('❌ Erreur : ' + error.message, 'error');
        }
        return;
    }

    // Créer le profil dans la table users
    const newProfile = {
        id:      data.user.id,
        email,
        pseudo,
        pokemon,
        avatar,
        color:   GBX_STYLE_CONFIG.defaultColor,
    };
    const { error: profileError } = await _supa.from('users').insert(newProfile);
    if (profileError) {
        showToast('❌ Erreur création profil : ' + profileError.message, 'error');
        return;
    }

    GBX.user = { ...newProfile, supaId: data.user.id };
    closeModal();
    updateAuthUI();
    showToast('🎉 Compte créé ! Bienvenue ' + pseudo + ' !', 'success');
}

/* ─── Déconnexion ─────────────────────────────────────────── */
async function handleLogout() {
    await _supa.auth.signOut();
    GBX.user = null;
    closeModal();
    updateAuthUI();
    showToast('À bientôt ! 👋', 'info');
}

/* ─── Mise à jour de l'UI auth ────────────────────────────── */
function updateAuthUI() {
    const authBtn        = document.getElementById('btn-auth');
    const profileSection = document.getElementById('sidebar-profile');
    const savesSection   = document.getElementById('saves-section');
    const logoutBtn      = document.getElementById('btn-logout');
    const avatarImg      = document.getElementById('profile-avatar');
    const nameEl         = document.getElementById('profile-name');
    const statusEl       = document.getElementById('profile-status');

    if (GBX.user) {
        authBtn.innerHTML            = '<span class="btn-icon">👤</span> Mon profil';
        profileSection.style.display = 'flex';
        savesSection.style.display   = 'block';
        logoutBtn.style.display      = 'flex';
        avatarImg.src                = GBX.user.avatar || 'assets/avatar-default.png';
        nameEl.textContent           = GBX.user.pseudo;
        statusEl.textContent         = '🟢 Connecté';
        if (GBX.user.color) applyColor(GBX.user.color);
    } else {
        authBtn.innerHTML            = '<span class="btn-icon">🔑</span> Connexion / Inscription';
        profileSection.style.display = 'none';
        savesSection.style.display   = 'none';
        logoutBtn.style.display      = 'none';
    }
}

/* ─── Upload avatar ───────────────────────────────────────── */
function setupAvatarUpload() {
    const area    = document.getElementById('avatar-upload-area');
    const input   = document.getElementById('avatar-file-input');
    const preview = document.getElementById('avatar-preview');
    const dataEl  = document.getElementById('reg-avatar-data');

    area.addEventListener('click', () => input.click());

    input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;

        // Vérifier la taille (200x200 max imposé au niveau de l'image)
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            if (img.width > 200 || img.height > 200) {
                showToast('⚠️ Image trop grande (max 200x200px)', 'error');
                URL.revokeObjectURL(url);
                return;
            }
            // Convertir en base64 pour stockage
            const canvas = document.createElement('canvas');
            canvas.width  = Math.min(img.width, 200);
            canvas.height = Math.min(img.height, 200);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            preview.src    = dataUrl;
            dataEl.value   = dataUrl;
            URL.revokeObjectURL(url);
        };
        img.src = url;
    });

    // Drag & drop
    area.addEventListener('dragover', (e) => { e.preventDefault(); area.style.borderColor='rgba(255,255,255,0.5)'; });
    area.addEventListener('dragleave',()  => { area.style.borderColor=''; });
    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.style.borderColor = '';
        input.files = e.dataTransfer.files;
        input.dispatchEvent(new Event('change'));
    });
}

/* ─── Upload avatar (Modale Profil) ─────────────────────── */
function setupProfileAvatarUpload() {
    const area    = document.getElementById('avatar-upload-area-profile');
    const input   = document.getElementById('avatar-file-input-profile');
    const preview = document.getElementById('avatar-profile-preview');
    const hint    = document.getElementById('avatar-profile-hint');
    const saveBtn = document.getElementById('btn-save-avatar');

    if (!area || !input) return;

    // Formats autorisés
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const MAX_SIZE_MB   = 1;          // 1 Mo max
    const MAX_DIM       = 200;        // 200×200px max
    const MAX_GIF_KB    = 512;        // GIF max 512 Ko (évite les gros GIF animés)

    area.addEventListener('click', () => input.click());

    input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;

        // Vérif format
        if (!ALLOWED_TYPES.includes(file.type)) {
            showToast('❌ Format non autorisé (JPG, PNG, WEBP, GIF uniquement)', 'error');
            input.value = '';
            return;
        }

        // Vérif taille fichier
        const sizeMB = file.size / 1024 / 1024;
        if (sizeMB > MAX_SIZE_MB) {
            showToast('❌ Fichier trop lourd (max 1 Mo)', 'error');
            input.value = '';
            return;
        }

        // Vérif taille GIF spécifique
        if (file.type === 'image/gif' && file.size > MAX_GIF_KB * 1024) {
            showToast('❌ GIF trop lourd (max 512 Ko)', 'error');
            input.value = '';
            return;
        }

        // Pour les GIF, on affiche directement via URL (pas de canvas — ça tuerait l'animation)
        if (file.type === 'image/gif') {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                if (img.width > MAX_DIM || img.height > MAX_DIM) {
                    showToast('⚠️ GIF trop grand (max 200×200px)', 'error');
                    URL.revokeObjectURL(url);
                    input.value = '';
                    return;
                }
                // Lire en base64 pour stockage
                const reader = new FileReader();
                reader.onload = (ev) => {
                    GBX.pendingAvatar = ev.target.result;
                    preview.src = ev.target.result;
                    preview.style.display = 'block';
                    hint.textContent = file.name;
                    saveBtn.style.display = 'block';
                };
                reader.readAsDataURL(file);
                URL.revokeObjectURL(url);
            };
            img.src = url;
            return;
        }

        // Pour JPG/PNG/WEBP : vérif dimensions + conversion canvas
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            if (img.width > MAX_DIM || img.height > MAX_DIM) {
                showToast('⚠️ Image trop grande (max 200×200px)', 'error');
                URL.revokeObjectURL(url);
                input.value = '';
                return;
            }
            const canvas = document.createElement('canvas');
            canvas.width  = img.width;
            canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL(file.type);
            GBX.pendingAvatar = dataUrl;
            preview.src = dataUrl;
            preview.style.display = 'block';
            hint.textContent = file.name;
            saveBtn.style.display = 'block';
            URL.revokeObjectURL(url);
        };
        img.src = url;
    });

    // Bouton Sauvegarder
    saveBtn?.addEventListener('click', async () => {
        if (!GBX.pendingAvatar || !GBX.user) return;

        // Mettre à jour dans Supabase
        const { error } = await _supa
            .from('users')
            .update({ avatar: GBX.pendingAvatar })
            .eq('id', GBX.user.id);

        if (error) {
            showToast('❌ Erreur sauvegarde avatar.', 'error');
            return;
        }

        GBX.user.avatar = GBX.pendingAvatar;

        // Mettre à jour l'affichage
        document.getElementById('profile-avatar').src       = GBX.pendingAvatar;
        document.getElementById('modal-profile-avatar').src = GBX.pendingAvatar;
        GBX.pendingAvatar = null;
        saveBtn.style.display = 'none';
        showToast('✅ Photo de profil mise à jour !', 'success');
    });
}

/* ─── Liste Pokémon pour l'inscription ───────────────────── */
function buildPokemonSelect() {
    const sel = document.getElementById('reg-pokemon');
    sel.innerHTML = '<option value="">— Choisis ton favori —</option>';
    GBX_POKEMON_GAMES.forEach(game => {
        const opt = document.createElement('option');
        opt.value       = game;
        opt.textContent = game;
        sel.appendChild(opt);
    });
}

/* ============================================================
   11. SAUVEGARDES
   ============================================================ */
function buildSavesSelect() {
    const sel = document.getElementById('saves-game-select');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Choisir un jeu —</option>';
    GBX_GAMES.forEach(game => {
        const opt = document.createElement('option');
        opt.value       = game.id;
        opt.textContent = game.name + ' (' + game.saveName + ')';
        sel.appendChild(opt);
    });
}

/**
 * Écrit un fichier directement dans IndexedDB (base de données d'EmulatorJS)
 * EmulatorJS utilise IDBFS — la DB s'appelle "/", object store "FILE_DATA"
 * gambatte lit la SRAM depuis là au démarrage du core
 */
function writeToIndexedDB(path, bytes) {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('/data/saves');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
            const db = req.result;
            // Trouver le bon object store
            const stores = Array.from(db.objectStoreNames);
            const storeName = stores.find(s => s === 'FILE_DATA') || stores[0];
            if (!storeName) { db.close(); resolve(); return; }
            try {
                const tx      = db.transaction(storeName, 'readwrite');
                const store   = tx.objectStore(storeName);
                // Format IDBFS : { timestamp: Date, mode: 33206, contents: Uint8Array }
                const putReq  = store.put({
                    timestamp: new Date(),
                    mode:      33206,
                    contents:  bytes
                }, path);
                putReq.onsuccess = () => { db.close(); resolve(); };
                putReq.onerror   = () => { db.close(); reject(putReq.error); };
            } catch(e) { db.close(); resolve(); }
        };
        req.onupgradeneeded = () => {
            // DB pas encore créée — pas de save à injecter
            req.result.close();
            resolve();
        };
    });
}

/**
 * Retourne le chemin du fichier de save dans le FS EmulatorJS
 * selon le core utilisé et le nom de la ROM
 */
function getSavePath(game) {
    const core     = GBX_EMULATOR_CONFIG.cores[game.type] || 'mgba';
    const baseName = game.file.split('/').pop().replace(/\.[^.]+$/, '');
    const coreDir  = core === 'gambatte' ? 'Gambatte' : 'mGBA';
    return `/data/saves/${coreDir}/${baseName}.srm`;
}

/**
 * Lit le fichier de save depuis le FS EmulatorJS
 */
function readSaveFile(game) {
    try {
        // Forcer gambatte/mGBA à flusher la SRAM dans le FS
        GBX.emulator.gameManager.functions.saveSaveFiles();
        const path = getSavePath(game);
        const data = GBX.emulator.gameManager.FS.readFile(path);
        // Taille max officielle GB/GBC/GBA = 128KB
        if (!data || data.length === 0 || data.length > 131072) return null;
        return data;
    } catch(e) {
        return null;
    }
}

/**
 * Charge la sauvegarde depuis Supabase et l'injecte dans le FS EmulatorJS
 */
async function loadSaveForGame(game) {
    if (!GBX.user) return;
    const { data } = await _supa
        .from('saves')
        .select('save_data')
        .eq('user_id', GBX.user.id)
        .eq('game_id', game.id)
        .maybeSingle();

    if (data?.save_data) {
        // Convertir base64 en Uint8Array et injecter dans le FS
        const base64 = data.save_data.split(',')[1];
        const binary = atob(base64);
        const bytes  = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        try {
            const path = getSavePath(game);
            GBX.emulator.gameManager.FS.writeFile(path, bytes);
            showToast('💾 Sauvegarde chargée !', 'info');
        } catch(e) {
            // Fallback : utiliser EJS_loadStateURL
            window.EJS_loadStateURL = data.save_data;
        }
    }
}

async function uploadSaveToServer(game, saveData, silent = false) {
    if (!GBX.user) return;

    // Convertir Uint8Array en base64
    const blob   = new Blob([saveData]);
    const reader = new FileReader();
    reader.onload = async () => {
        const { error } = await _supa.from('saves').upsert({
            user_id:    GBX.user.id,
            game_id:    game.id,
            save_data:  reader.result,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,game_id' });

        if (error) {
            showToast('❌ Erreur sauvegarde.', 'error');
        } else if (!silent) {
            showToast('💾 Sauvegarde envoyée !', 'success');
        }
    };
    reader.readAsDataURL(blob);
}

async function loadSaveFromServer(game) {
    if (!GBX.user) return null;
    const { data } = await _supa
        .from('saves')
        .select('save_data')
        .eq('user_id', GBX.user.id)
        .eq('game_id', game.id)
        .maybeSingle();
    return data?.save_data || null;
}

/* Boutons télécharger / uploader sauvegarde */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-download-save')?.addEventListener('click', async () => {
        const sel  = document.getElementById('saves-game-select');
        const game = GBX_GAMES.find(g => g.id === sel.value);
        if (!game)     { showToast('Choisis un jeu d\'abord !', 'error'); return; }
        if (!GBX.user) { showToast('Connecte-toi !', 'error'); return; }

        const { data } = await _supa
            .from('saves')
            .select('save_data')
            .eq('user_id', GBX.user.id)
            .eq('game_id', game.id)
            .maybeSingle();

        if (!data?.save_data) { showToast('Aucune sauvegarde pour ce jeu.', 'error'); return; }

        const a    = document.createElement('a');
        a.href     = data.save_data;
        a.download = game.saveName;
        a.click();
    });

    document.getElementById('btn-upload-save')?.addEventListener('click', () => {
        const sel  = document.getElementById('saves-game-select');
        const game = GBX_GAMES.find(g => g.id === sel.value);
        if (!game)     { showToast('Choisis un jeu d\'abord !', 'error'); return; }
        if (!GBX.user) { showToast('Connecte-toi !', 'error'); return; }

        const input  = document.createElement('input');
        input.type   = 'file';
        input.accept = '.sav';
        input.addEventListener('change', () => {
            const file = input.files[0];
            if (!file) return;

            if (file.name !== game.saveName) {
                showToast('❌ Nom de fichier incorrect.\nAttendu : ' + game.saveName, 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = async () => {
                const { error } = await _supa.from('saves').upsert({
                    user_id:    GBX.user.id,
                    game_id:    game.id,
                    save_data:  reader.result,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id,game_id' });

                if (error) {
                    showToast('❌ Erreur import sauvegarde.', 'error');
                } else {
                    showToast('✅ Sauvegarde importée !', 'success');
                }
            };
            reader.readAsDataURL(file);
        });
        input.click();
    });
});

/* ============================================================
   12. FORMULAIRE DE CONTACT
   ============================================================ */
function setupContactForm() {
    const btn  = document.getElementById('btn-contact');
    const wrap = document.getElementById('contact-form-wrap');

    btn?.addEventListener('click', () => {
        GBX.contactOpen = !GBX.contactOpen;
        wrap.classList.toggle('open', GBX.contactOpen);
        btn.classList.toggle('pressed', GBX.contactOpen);
    });

    document.getElementById('form-contact')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const subject = document.getElementById('contact-subject').value.trim();
        const email   = document.getElementById('contact-email').value.trim();
        const message = document.getElementById('contact-message').value.trim();

        if (!subject || !email || !message) {
            showToast('Remplis tous les champs !', 'error');
            return;
        }

        // ── TODO : Remplacer par un vrai appel API / EmailJS / Formspree ──
        // Exemple avec Formspree : POST https://formspree.io/f/VOTRE_ID
        // ou EmailJS, ou votre propre backend
        // ──────────────────────────────────────────────────────────────────

        // Simulation : mailto (ouvre le client mail)
        const mailto = `mailto:GbxEmulator@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent('De : ' + email + '\n\n' + message)}`;
        window.location.href = mailto;

        showToast('✉️ Message envoyé !', 'success');
        e.target.reset();
        wrap.classList.remove('open');
        GBX.contactOpen = false;
    });
}

/* ============================================================
   13. PAGE FORUM
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-forum')?.addEventListener('click', () => {
        const page = document.getElementById('forum-page');
        page.classList.add('open');
        toggleSidebar(false);
    });

    document.getElementById('forum-back')?.addEventListener('click', () => {
        document.getElementById('forum-page').classList.remove('open');
    });

    // Bouton "Fonctionnalité à venir"
    let comingSoonTimer = null;
    document.getElementById('btn-coming-soon')?.addEventListener('click', () => {
        const bubble = document.getElementById('coming-soon-bubble');
        const isVisible = bubble.style.display !== 'none';
        clearTimeout(comingSoonTimer);
        if (isVisible) {
            bubble.style.opacity = '0';
            setTimeout(() => { bubble.style.display = 'none'; }, 400);
        } else {
            bubble.style.display = 'block';
            bubble.style.opacity = '1';
            comingSoonTimer = setTimeout(() => {
                bubble.style.opacity = '0';
                setTimeout(() => { bubble.style.display = 'none'; }, 400);
            }, 5000);
        }
    });
});

/* ============================================================
   14. COULEUR SERVEUR
   ============================================================ */
async function saveUserColorToServer(colorId) {
    if (!GBX.user) return;
    GBX.user.color = colorId;
    await _supa
        .from('users')
        .update({ color: colorId })
        .eq('id', GBX.user.id);
}

/* ============================================================
   15. UTILITAIRES UI
   ============================================================ */

/** Effet de pression visuelle sur un bouton */
function addPressEffect(el) {
    el.classList.add('pressed');
    setTimeout(() => el.classList.remove('pressed'), 150);
}

/** Affiche un toast / notification */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

/* ============================================================
   16. GESTION ROTATION MOBILE
   ============================================================ */

// Références aux éléments déplacés en paysage
const _landscape = {
    applied: false,
};

function applyLandscapeDOM() {
    if (_landscape.applied) return;

    const gameboy      = document.getElementById('gameboy');
    const controlsTop  = document.getElementById('controls-top');
    const btnL         = document.getElementById('btn-l');
    const btnR         = document.getElementById('btn-r');
    const dpad         = document.getElementById('dpad');
    const abButtons    = document.getElementById('ab-buttons');
    const controlsCenter = document.getElementById('controls-center');

    if (!gameboy || !btnL || !btnR) return;

    // Créer colonne gauche : L + D-PAD + Select
    const colLeft = document.createElement('div');
    colLeft.id = 'landscape-left';
    colLeft.appendChild(btnL);
    colLeft.appendChild(dpad);
    colLeft.appendChild(controlsCenter); // contient Select (START masqué via CSS)

    // Créer colonne droite : R + A/B + Start
    const colRight = document.createElement('div');
    colRight.id = 'landscape-right';
    colRight.appendChild(btnR);
    colRight.appendChild(abButtons);

    // Récupérer le bouton Start pour le mettre en bas de la colonne droite
    const btnStart = document.getElementById('btn-start');
    if (btnStart) colRight.appendChild(btnStart);

    // Insérer les colonnes dans la gameboy, autour de l'écran
    const screenFrame = document.getElementById('screen-frame');
    gameboy.insertBefore(colLeft,  screenFrame);
    gameboy.insertBefore(colRight, screenFrame.nextSibling);

    // Masquer controls-top (sélecteur + éject) et controls-main (vidé)
    controlsTop.style.display = 'none';

    _landscape.applied = true;
}

function revertLandscapeDOM() {
    if (!_landscape.applied) return;

    const controlsTop  = document.getElementById('controls-top');
    const controlsMain = document.getElementById('controls-main');
    const startSelect  = document.getElementById('start-select');
    const colLeft      = document.getElementById('landscape-left');
    const colRight     = document.getElementById('landscape-right');

    if (!colLeft || !colRight) return;

    // Remettre L dans controls-top
    const btnL = document.getElementById('btn-l');
    const btnR = document.getElementById('btn-r');
    const gameSelectorWrap = document.getElementById('game-selector-wrap');
    if (btnL) controlsTop.insertBefore(btnL, gameSelectorWrap);
    if (btnR) controlsTop.appendChild(btnR);

    // Remettre D-PAD, controls-center et AB dans controls-main
    const dpad         = document.getElementById('dpad');
    const controlsCenter = document.getElementById('controls-center');
    const abButtons    = document.getElementById('ab-buttons');
    const btnStart     = document.getElementById('btn-start');

    if (dpad)          controlsMain.appendChild(dpad);
    if (controlsCenter) controlsMain.appendChild(controlsCenter);
    if (abButtons)     controlsMain.appendChild(abButtons);

    // Remettre Start dans start-select
    if (btnStart && startSelect) startSelect.appendChild(btnStart);

    // Supprimer les colonnes landscape
    colLeft.remove();
    colRight.remove();

    // Réafficher controls-top
    controlsTop.style.display = '';

    _landscape.applied = false;
}

function checkMobileOrientation() {
    const handleOrientation = () => {
        const isLandscape = window.matchMedia('(orientation: landscape)').matches;
        const isMobile    = window.innerWidth <= 900 || window.innerHeight <= 500;

        if (isLandscape && isMobile) {
            applyLandscapeDOM();
        } else {
            revertLandscapeDOM();
        }
    };

    window.addEventListener('orientationchange', () => {
        // Petit délai pour laisser le navigateur finir la rotation
        setTimeout(handleOrientation, 100);
    });
    window.addEventListener('resize', handleOrientation);
    handleOrientation();
}