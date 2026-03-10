/**
 * ============================================================
 *  GBX v1 — Script principal
 *  Gère : émulateur, contrôles, sidebar, auth, couleurs,
 *         sauvegardes locales, vitesse, mapping clavier AZERTY
 * ============================================================
 */

'use strict';

/* ============================================================
   SUPABASE — Initialisation (auth + couleur uniquement)
   ============================================================ */
const _supa = supabase.createClient(
    "https://rchghwpxazjakmjloymm.supabase.co",
    "sb_publishable_5WaSGIXTFg1atLdxvKDVTw_TJ3viZjd"
);

/* ============================================================
   0. ÉTAT GLOBAL
   ============================================================ */
const GBX = {
    emulator:     null,    // Instance EmulatorJS
    currentGame:  null,    // Objet jeu en cours { id, name, file, type, ... }
    speedActive:  false,   // Vitesse rapide activée ou non
    isRunning:    false,   // Jeu en cours de lecture
    sidebarOpen:  false,
    contactOpen:  false,
    currentModal: null,    // 'login' | 'register' | 'profile' | null
    user:         null,    // null = non connecté
};

/* ============================================================
   1. INITIALISATION AU CHARGEMENT
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
    applyStyleConfig();       // Injecter les variables CSS depuis style.config.js
    buildGameSelect();        // Remplir le menu déroulant des jeux
    buildColorGrid();         // Construire la grille de couleurs
    restoreColor();           // Restaurer la couleur de la GB
    setupSidebar();           // Événements du volet latéral
    setupTopButtons();        // Boutons S (speed) et M (menu)
    setupGameControls();      // Boutons de la gameboy (clic + tactile)
    setupKeyboard();          // Mapping clavier AZERTY
    setupAuthUI();            // Connexion / Inscription
    setupContactForm();       // Formulaire de contact
    setupGameSelector();      // Sélecteur de jeu + bouton Eject
    setupSavesUI();           // Chargement local de sauvegardes
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
    updateAuthUI();
    await restoreSaveFolder();
});

/* ============================================================
   2. STYLE CONFIG → CSS VARIABLES
   ============================================================ */
function applyStyleConfig() {
    const cfg  = GBX_STYLE_CONFIG;
    const root = document.documentElement;
    root.style.setProperty('--press-y',                   cfg.pressEffect.translateY);
    root.style.setProperty('--press-scale',               cfg.pressEffect.scaleDown);
    root.style.setProperty('--press-duration',            cfg.pressEffect.duration);
    root.style.setProperty('--glare-opacity',             cfg.screen.glareOpacity);
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
            const opt        = document.createElement('option');
            opt.value        = game.id;
            opt.dataset.file = game.file;
            opt.dataset.type = game.type;
            opt.textContent  = game.name;
            optgroup.appendChild(opt);
        });
        select.appendChild(optgroup);
    });
}

function setupGameSelector() {
    const select = document.getElementById('game-select');
    const eject  = document.getElementById('btn-eject');

    // Bloquer l'ouverture du dropdown si un jeu est en cours + afficher la bulle
    select.addEventListener('mousedown', (e) => {
        if (GBX.isRunning) { e.preventDefault(); showEjectBubble(); }
    });
    select.addEventListener('touchstart', (e) => {
        if (GBX.isRunning) { e.preventDefault(); showEjectBubble(); }
    }, { passive: false });

    select.addEventListener('change', () => {
        const gameId = select.value;
        if (!gameId) return;
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
        setTimeout(() => window.location.reload(), 120);
    });
}

/* ============================================================
   BULLE "EJECT D'ABORD" + SHAKE
   ============================================================ */
let _ejectBubbleTimer = null;
function showEjectBubble() {
    const bubble = document.getElementById('eject-bubble');
    const eject  = document.getElementById('btn-eject');
    if (!bubble) return;

    // Affichage avec fondu
    clearTimeout(_ejectBubbleTimer);
    bubble.style.display = 'block';
    bubble.style.opacity = '1';

    // Vibration du bouton EJECT
    if (eject) {
        eject.classList.remove('shake');
        void eject.offsetWidth;
        eject.classList.add('shake');
        eject.addEventListener('animationend', () => eject.classList.remove('shake'), { once: true });
    }

    // Disparition après 3s
    _ejectBubbleTimer = setTimeout(() => {
        bubble.style.opacity = '0';
        setTimeout(() => { bubble.style.display = 'none'; }, 400);
    }, 3000);
}

/* ============================================================
   4. LANCEMENT DU JEU
   ============================================================ */
async function launchGame(game) {
    GBX.currentGame = game;
    GBX.isRunning   = true;

    // Masquer l'écran d'accueil
    const welcome = document.getElementById('welcome-screen');
    if (welcome) welcome.classList.add('hidden');

    // Vider le conteneur précédent
    document.getElementById('ejs-container').innerHTML = '';

    updateScreenMode(game.type);
    updateLRButtons(game.type);

    // Variables EmulatorJS
    window.EJS_player            = '#ejs-container';
    window.EJS_gameUrl           = game.file;
    window.EJS_core              = GBX_EMULATOR_CONFIG.cores[game.type] || 'mgba';
    window.EJS_pathtodata        = GBX_EMULATOR_CONFIG.dataPath;
    window.EJS_startOnLoaded     = GBX_EMULATOR_CONFIG.startOnLoad;
    window.EJS_fullscreenOnLoaded= GBX_EMULATOR_CONFIG.fullscreenOnLoad;
    window.EJS_volume            = GBX_EMULATOR_CONFIG.volume;
    window.EJS_CacheLimit        = GBX_EMULATOR_CONFIG.cacheLimit;
    window.EJS_threads           = GBX_EMULATOR_CONFIG.threads;
    window.EJS_disableCue        = GBX_EMULATOR_CONFIG.disableCue;
    window.EJS_noAutoFocus       = GBX_EMULATOR_CONFIG.noAutoFocus;
    window.EJS_softLoad          = GBX_EMULATOR_CONFIG.softLoad;
    window.EJS_gameName          = game.name;
    window.EJS_gameID            = game.id;

    // Masquer le menu intégré d'EmulatorJS (on a le nôtre)
    window.EJS_hideSettings = true;

    // Désactiver les contrôles tactiles natifs d'EmulatorJS (on a les nôtres)
    window.EJS_VirtualGamepad   = false;
    window.EJS_noVirtualGamepad = true;

    // Mapping clavier (voir emulator.config.js)
    window.EJS_defaultControls = buildDefaultControls();

    // ── Chargement du .sav existant ──────────────────────────
    // Si un dossier est configuré, on tente de lire le .sav du jeu
    // et on l'injecte dans EJS via EJS_externalFiles avant le démarrage.
    window.EJS_externalFiles = undefined;
    if (GBX_saveFolder && game.saveName) {
        try {
            const fileHandle = await GBX_saveFolder.getFileHandle(game.saveName);
            const file       = await fileHandle.getFile();
            const buffer     = await file.arrayBuffer();
            // EJS attend un tableau d'objets { name, data (Uint8Array) }
            window.EJS_externalFiles = [{ name: game.saveName, data: new Uint8Array(buffer) }];
            showToast('💾 Sauvegarde "' + game.saveName + '" chargée !', 'success');
        } catch(e) {
            // Fichier .sav inexistant → nouvelle partie, rien à faire
            if (e.name !== 'NotFoundError') {
                console.warn('[GBX] Lecture .sav impossible :', e);
            }
        }
    }

    // ── Écriture du .sav après chaque sauvegarde ─────────────
    window.EJS_onSaveSave = async (data) => {
        if (!GBX_saveFolder || !game.saveName) {
            showToast('⚠️ Aucun dossier de sauvegarde sélectionné.', 'error');
            return;
        }
        try {
            const fileHandle   = await GBX_saveFolder.getFileHandle(game.saveName, { create: true });
            const writable     = await fileHandle.createWritable();
            await writable.write(data instanceof Uint8Array ? data : new Uint8Array(data));
            await writable.close();
            showToast('💾 Sauvegarde écrite dans "' + game.saveName + '" !', 'success');
        } catch(e) {
            console.error('[GBX] Écriture .sav impossible :', e);
            showToast('❌ Impossible d\'écrire la sauvegarde.', 'error');
        }
    };

    // ── Lecture du .sav demandée par EJS ─────────────────────
    window.EJS_onLoadSave = async () => {
        if (!GBX_saveFolder || !game.saveName) return null;
        try {
            const fileHandle = await GBX_saveFolder.getFileHandle(game.saveName);
            const file       = await fileHandle.getFile();
            const buffer     = await file.arrayBuffer();
            showToast('💾 Sauvegarde chargée !', 'success');
            return new Uint8Array(buffer);
        } catch(e) {
            if (e.name !== 'NotFoundError') console.warn('[GBX] Lecture .sav impossible :', e);
            return null;
        }
    };

    // Callback prêt
    window.EJS_ready = () => {
        GBX.isRunning   = true;
        GBX.emulator    = window.EJS_emulator;
        GBX.speedActive = false;
        updateSpeedButton();
        showToast('🎮 ' + game.name + ' lancé !', 'success');
    };

    // Colorisation GBC automatique pour les jeux Game Boy Classic
    window.EJS_onGameStart = () => {
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

    speedBtn.addEventListener('click', () => {
        addPressEffect(speedBtn);
        toggleSpeed();
    });

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
        showToast('⚡ Vitesse rapide activée !', 'info');
    } else {
        showToast('🐢 Vitesse normale', 'info');
    }
}

/* ============================================================
   6. CONTRÔLES DE LA GAMEBOY (clic + tactile)
   ============================================================ */
function setupGameControls() {
    // Mapping : [id du bouton HTML] → [index EJS réel pour simulateInput]
    const buttonMap = {
        'btn-a':       8,   // A
        'btn-b':       0,   // B
        'btn-start':   3,   // Start
        'btn-select':  2,   // Select
        'dpad-up':     4,
        'dpad-down':   5,
        'dpad-left':   6,
        'dpad-right':  7,
        'btn-l':       10,  // L
        'btn-r':       11,  // R
    };

    Object.entries(buttonMap).forEach(([btnId, ejsRealIndex]) => {
        const el = document.getElementById(btnId);
        if (!el) return;

        // Souris
        el.addEventListener('mousedown',  (e) => { e.preventDefault(); pressButton(el, ejsRealIndex, true);  });
        el.addEventListener('mouseup',    (e) => { e.preventDefault(); pressButton(el, ejsRealIndex, false); });
        el.addEventListener('mouseleave', ()  => { pressButton(el, ejsRealIndex, false); });

        // Tactile
        el.addEventListener('touchstart', (e) => { e.preventDefault(); pressButton(el, ejsRealIndex, true);  }, { passive: false });
        el.addEventListener('touchend',   (e) => { e.preventDefault(); pressButton(el, ejsRealIndex, false); }, { passive: false });
        el.addEventListener('touchcancel',(e) => { e.preventDefault(); pressButton(el, ejsRealIndex, false); }, { passive: false });
    });

    // Boutons sidebar (effet press)
    document.querySelectorAll('.sidebar-btn, .modal-btn, .save-action-btn, .contact-submit').forEach(btn => {
        btn.addEventListener('mousedown', () => addPressEffect(btn));
    });
}

/**
 * Presse ou relâche un bouton de la Gameboy (clic/tactile)
 * ejsRealIndex est l'index simulateInput direct (déjà résolu par buttonMap)
 */
function pressButton(el, ejsRealIndex, isDown) {
    if (el.disabled) return;

    if (isDown) { el.classList.add('pressed'); }
    else        { el.classList.remove('pressed'); }

    const gm = GBX.emulator?.gameManager;
    if (!gm) return;
    try {
        gm.simulateInput(0, ejsRealIndex, isDown ? 1 : 0);
    } catch(e) { /* émulateur pas encore prêt */ }
}

/* ============================================================
   7. MAPPING CLAVIER AZERTY
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


function setupKeyboard() {
    // Semicolon (touche M AZERTY) → menu sidebar
    // KeyL (touche L AZERTY, code physique KeyL) → speed
    const gbxKeys = {
        'Semicolon': () => {
            const btn = document.getElementById('btn-menu');
            if (btn) addPressEffect(btn);
            toggleSidebar(!GBX.sidebarOpen);
        },
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

            const el = document.getElementById(m.btnId);
            if (el && !el.disabled) el.classList.add('pressed');

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
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const app     = document.getElementById('app');

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
        swatch.className    = 'color-swatch';
        swatch.dataset.id   = color.id;
        swatch.dataset.name = color.name;
        swatch.title        = color.name;

        swatch.style.background = `linear-gradient(135deg, ${color.body}, ${color.body2})`;

        if (color.shimmer)     swatch.classList.add('shimmer-swatch');
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

    const gb    = document.getElementById('gameboy');
    const root  = document.documentElement;
    const title = document.getElementById('gb-title');

    root.style.setProperty('--gbody',  color.body);
    root.style.setProperty('--gbody2', color.body2);

    gb.classList.toggle('shimmer',          color.shimmer);
    gb.classList.toggle('transparent-body', color.transparent);

    // Easter egg : couleur bordeaux → "GBX v1 Mei's Edition"
    if (title) {
        if (colorId === 'bordeaux') {
            title.innerHTML = 'GBX <span style="font-size:0.7em">v</span>1 <span id="meis-edition">Mei\'s Edition</span>';
        } else {
            title.innerHTML = 'GBX <span style="font-size:0.7em">v</span>1';
        }
    }

    document.querySelectorAll('.color-swatch').forEach(s => {
        s.classList.toggle('active', s.dataset.id === colorId);
    });

    localStorage.setItem('gbx-color', colorId);
    if (GBX.user) saveUserColorToServer(colorId);
}

function restoreColor() {
    const saved = localStorage.getItem('gbx-color') || GBX_STYLE_CONFIG.defaultColor;
    applyColor(saved);
}

/* ============================================================
   10. AUTHENTIFICATION
   ============================================================ */
function setupAuthUI() {
    // Bouton gauche = Connexion, bouton droite = Inscription
    document.getElementById('btn-auth-login')?.addEventListener('click', () => {
        openModal('login');
    });
    document.getElementById('btn-auth-register')?.addEventListener('click', () => {
        openModal('register');
    });

    // Zone profil cliquable directement
    const profileSection = document.getElementById('sidebar-profile');
    profileSection?.addEventListener('click', () => {
        if (GBX.user) openProfileModal();
    });
    profileSection?.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && GBX.user) openProfileModal();
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeModal();
        });
    });

    document.getElementById('form-login').addEventListener('submit', handleLogin);
    document.getElementById('form-register').addEventListener('submit', handleRegister);

    document.getElementById('switch-to-register').addEventListener('click', (e) => {
        e.preventDefault();
        openModal('register');
    });
    document.getElementById('switch-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        openModal('login');
    });

    setupAvatarUpload();
    setupProfileAvatarUpload();
    buildPokemonSelect();

    document.getElementById('btn-logout')?.addEventListener('click', handleLogout);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function openProfileModal() {
    openModal('profile');
    document.getElementById('modal-profile-avatar').src         = GBX.user.avatar || 'assets/avatar-default.png';
    document.getElementById('modal-profile-pseudo').textContent = GBX.user.pseudo;
    document.getElementById('modal-profile-pokemon').textContent= GBX.user.pokemon || '';
    const preview = document.getElementById('avatar-profile-preview');
    const hint    = document.getElementById('avatar-profile-hint');
    const saveBtn = document.getElementById('btn-save-avatar');
    if (preview) { preview.style.display = 'none'; preview.src = ''; }
    if (hint)    hint.textContent = 'Cliquer pour choisir';
    if (saveBtn) saveBtn.style.display = 'none';
}

function openModal(type) {
    closeModal();
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

    const { data: profile } = await _supa
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

    GBX.user = { ...profile, supaId: data.user.id };
    closeModal();
    updateAuthUI();
    await restoreSaveFolder();
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

    const { data: existingPseudo } = await _supa
        .from('users')
        .select('id')
        .ilike('pseudo', pseudo)
        .maybeSingle();
    if (existingPseudo) {
        showToast('❌ Ce pseudo est déjà pris, choisis-en un autre !', 'error');
        return;
    }

    const { data, error } = await _supa.auth.signUp({ email, password: pwd });
    if (error) {
        if (error.message.includes('already registered')) {
            showToast('❌ Cet email est déjà utilisé.', 'error');
        } else {
            showToast('❌ Erreur : ' + error.message, 'error');
        }
        return;
    }

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
    await restoreSaveFolder();
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
    const splitBtn       = document.getElementById('btn-auth-split');
    const profileSection = document.getElementById('sidebar-profile');
    const savesSection   = document.getElementById('saves-section');
    const savesDivider   = document.getElementById('saves-divider');
    const logoutBtn      = document.getElementById('btn-logout');
    const avatarImg      = document.getElementById('profile-avatar');
    const nameEl         = document.getElementById('profile-name');
    const statusEl       = document.getElementById('profile-status');

    if (GBX.user) {
        if (splitBtn) splitBtn.style.display = 'none';
        profileSection.style.display = 'flex';
        savesSection.style.display   = 'block';
        if (savesDivider) savesDivider.style.display = 'block';
        logoutBtn.style.display      = 'flex';
        avatarImg.src                = GBX.user.avatar || 'assets/avatar-default.png';
        nameEl.textContent           = GBX.user.pseudo;
        statusEl.textContent         = '🟢 Connecté';
        if (GBX.user.color) applyColor(GBX.user.color);
    } else {
        if (splitBtn) splitBtn.style.display = 'flex';
        profileSection.style.display = 'none';
        savesSection.style.display   = 'none';
        if (savesDivider) savesDivider.style.display = 'none';
        logoutBtn.style.display      = 'none';
    }
}

/* ─── Upload avatar (inscription) ────────────────────────── */
function setupAvatarUpload() {
    const area    = document.getElementById('avatar-upload-area');
    const input   = document.getElementById('avatar-file-input');
    const preview = document.getElementById('avatar-preview');
    const dataEl  = document.getElementById('reg-avatar-data');

    area.addEventListener('click', () => input.click());

    input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;

        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            if (img.width > 200 || img.height > 200) {
                showToast('⚠️ Image trop grande (max 200x200px)', 'error');
                URL.revokeObjectURL(url);
                return;
            }
            const canvas = document.createElement('canvas');
            canvas.width  = Math.min(img.width, 200);
            canvas.height = Math.min(img.height, 200);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl  = canvas.toDataURL('image/png');
            preview.src    = dataUrl;
            dataEl.value   = dataUrl;
            URL.revokeObjectURL(url);
        };
        img.src = url;
    });

    // Drag & drop
    area.addEventListener('dragover',  (e) => { e.preventDefault(); area.style.borderColor = 'rgba(255,255,255,0.5)'; });
    area.addEventListener('dragleave', ()  => { area.style.borderColor = ''; });
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

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const MAX_SIZE_MB   = 1;
    const MAX_DIM       = 200;
    const MAX_GIF_KB    = 512;

    area.addEventListener('click', () => input.click());

    input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            showToast('❌ Format non autorisé (JPG, PNG, WEBP, GIF uniquement)', 'error');
            input.value = '';
            return;
        }

        const sizeMB = file.size / 1024 / 1024;
        if (sizeMB > MAX_SIZE_MB) {
            showToast('❌ Fichier trop lourd (max 1 Mo)', 'error');
            input.value = '';
            return;
        }

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
                const reader = new FileReader();
                reader.onload = (ev) => {
                    GBX.pendingAvatar     = ev.target.result;
                    preview.src           = ev.target.result;
                    preview.style.display = 'block';
                    hint.textContent      = file.name;
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
            const dataUrl         = canvas.toDataURL(file.type);
            GBX.pendingAvatar     = dataUrl;
            preview.src           = dataUrl;
            preview.style.display = 'block';
            hint.textContent      = file.name;
            saveBtn.style.display = 'block';
            URL.revokeObjectURL(url);
        };
        img.src = url;
    });

    saveBtn?.addEventListener('click', async () => {
        if (!GBX.pendingAvatar || !GBX.user) return;

        const { error } = await _supa
            .from('users')
            .update({ avatar: GBX.pendingAvatar })
            .eq('id', GBX.user.id);

        if (error) {
            showToast('❌ Erreur sauvegarde avatar.', 'error');
            return;
        }

        GBX.user.avatar = GBX.pendingAvatar;
        document.getElementById('profile-avatar').src       = GBX.pendingAvatar;
        document.getElementById('modal-profile-avatar').src = GBX.pendingAvatar;
        GBX.pendingAvatar     = null;
        saveBtn.style.display = 'none';
        showToast('✅ Photo de profil mise à jour !', 'success');
    });
}

/* ─── Liste Pokémon pour l'inscription ───────────────────── */
function buildPokemonSelect() {
    const sel = document.getElementById('reg-pokemon');
    sel.innerHTML = '<option value="">— Choisis ton favori —</option>';
    GBX_POKEMON_GAMES.forEach(game => {
        const opt       = document.createElement('option');
        opt.value       = game;
        opt.textContent = game;
        sel.appendChild(opt);
    });
}

/* ============================================================
   11. SAUVEGARDES — DOSSIER DE RÉCEPTION LOCAL
   ============================================================
   Le joueur choisit un dossier de réception. Le handle est persisté
   dans une IndexedDB dédiée (gbx-settings) par clé userId + appareil,
   ce qui permet à un même compte d'avoir un dossier différent
   sur PC et sur mobile. Au rechargement, le handle est restauré
   silencieusement si la permission est déjà accordée.
   ============================================================ */

// Dossier de réception actif (FileSystemDirectoryHandle ou null)
let GBX_saveFolder = null;

/** Clé unique par utilisateur + appareil */
function _saveFolderKey() {
    const userId = GBX.user?.id || 'anonymous';
    const device = /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    return `savefolder:${userId}:${device}`;
}

/** Ouvre (ou crée) la DB gbx-settings */
function _openSettingsDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('gbx-settings', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('settings');
        req.onsuccess = () => resolve(req.result);
        req.onerror   = () => reject(req.error);
    });
}

async function _persistFolderHandle(handle) {
    try {
        const db = await _openSettingsDB();
        const tx = db.transaction('settings', 'readwrite');
        tx.objectStore('settings').put(handle, _saveFolderKey());
        db.close();
    } catch(e) { console.warn('[GBX] persistFolderHandle:', e); }
}

async function _loadFolderHandle() {
    try {
        const db = await _openSettingsDB();
        return await new Promise((resolve) => {
            const tx  = db.transaction('settings', 'readonly');
            const req = tx.objectStore('settings').get(_saveFolderKey());
            req.onsuccess = () => { db.close(); resolve(req.result || null); };
            req.onerror   = () => { db.close(); resolve(null); };
        });
    } catch(e) { return null; }
}

/** Met à jour l'affichage selon GBX_saveFolder et l'état de permission */
function _updateFolderUI(state) {
    // state : 'granted' | 'prompt' | null
    const nameEl   = document.getElementById('saves-folder-name');
    const warnEl   = document.getElementById('saves-no-folder-warn');
    const reauthEl = document.getElementById('btn-reauth-folder');

    if (state === 'granted' && GBX_saveFolder) {
        if (nameEl)   { nameEl.textContent = '📂 ' + GBX_saveFolder.name; nameEl.style.display = 'block'; }
        if (warnEl)   warnEl.style.display   = 'none';
        if (reauthEl) reauthEl.style.display = 'none';
    } else if (state === 'prompt' && GBX_saveFolder) {
        // On connaît le dossier mais la permission est expirée (typique mobile après refresh)
        if (nameEl)   nameEl.style.display   = 'none';
        if (warnEl)   warnEl.style.display   = 'none';
        if (reauthEl) {
            reauthEl.textContent = '🔓 Réautoriser "' + GBX_saveFolder.name + '"';
            reauthEl.style.display = 'block';
        }
    } else {
        // Aucun dossier connu
        if (nameEl)   nameEl.style.display   = 'none';
        if (warnEl)   warnEl.style.display   = 'block';
        if (reauthEl) reauthEl.style.display = 'none';
    }
}

/**
 * Restaure le dossier enregistré au démarrage.
 * - Si permission 'granted' → restauration silencieuse.
 * - Si permission 'prompt' → affiche le bouton "Réautoriser" (geste utilisateur requis).
 * - showDirectoryPicker non disponible → on tente quand même de charger le handle
 *   (cas Android Chrome où l'API est présente mais pas testée au boot).
 */
async function restoreSaveFolder() {
    if (!GBX.user) return;
    const handle = await _loadFolderHandle();
    if (!handle) return;

    GBX_saveFolder = handle; // on mémorise le handle même si permission expirée

    try {
        const perm = await handle.queryPermission({ mode: 'readwrite' });
        if (perm === 'granted') {
            _updateFolderUI('granted');
        } else {
            // 'prompt' ou 'denied' → bouton de réautorisation
            _updateFolderUI('prompt');
        }
    } catch(e) {
        // L'API queryPermission peut ne pas exister dans certains navigateurs
        // On suppose 'prompt' et on affiche le bouton
        _updateFolderUI('prompt');
    }
}

/**
 * Initialise les boutons de la section sauvegardes.
 */
function setupSavesUI() {
    const btnFolder = document.getElementById('btn-choose-folder');
    const btnReauth = document.getElementById('btn-reauth-folder');
    if (!btnFolder) return;

    // Choisir un nouveau dossier
    btnFolder.addEventListener('click', async () => {
        if (window.showDirectoryPicker) {
            try {
                const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
                GBX_saveFolder = handle;
                await _persistFolderHandle(handle);
                _updateFolderUI('granted');
                showToast('✅ Dossier "' + handle.name + '" sélectionné !', 'success');
            } catch(e) {
                if (e.name !== 'AbortError') showToast('❌ Impossible d\'ouvrir le dossier.', 'error');
            }
        } else {
            showToast('⚠️ Ton navigateur ne supporte pas la sélection de dossier.', 'error');
        }
    });

    // Réautoriser un dossier connu (mobile après refresh)
    btnReauth?.addEventListener('click', async () => {
        if (!GBX_saveFolder) return;
        try {
            const perm = await GBX_saveFolder.requestPermission({ mode: 'readwrite' });
            if (perm === 'granted') {
                _updateFolderUI('granted');
                showToast('✅ Accès au dossier "' + GBX_saveFolder.name + '" rétabli !', 'success');
            } else {
                showToast('❌ Permission refusée.', 'error');
            }
        } catch(e) {
            showToast('❌ Impossible de réautoriser le dossier.', 'error');
        }
    });
}

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
        const bubble    = document.getElementById('coming-soon-bubble');
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
    const toast     = document.createElement('div');
    toast.className   = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

/* ============================================================
   16. GESTION ROTATION MOBILE
   ============================================================ */

const _landscape = {
    applied: false,
};

function applyLandscapeDOM() {
    if (_landscape.applied) return;

    const gameboy        = document.getElementById('gameboy');
    const controlsTop    = document.getElementById('controls-top');
    const btnL           = document.getElementById('btn-l');
    const btnR           = document.getElementById('btn-r');
    const dpad           = document.getElementById('dpad');
    const abButtons      = document.getElementById('ab-buttons');
    const controlsCenter = document.getElementById('controls-center');

    if (!gameboy || !btnL || !btnR) return;

    // Créer colonne gauche : L + D-PAD + Select
    const colLeft = document.createElement('div');
    colLeft.id = 'landscape-left';
    colLeft.appendChild(btnL);
    colLeft.appendChild(dpad);
    colLeft.appendChild(controlsCenter);

    // Créer colonne droite : R + A/B + Start
    const colRight = document.createElement('div');
    colRight.id = 'landscape-right';
    colRight.appendChild(btnR);
    colRight.appendChild(abButtons);

    const btnStart = document.getElementById('btn-start');
    if (btnStart) colRight.appendChild(btnStart);

    const screenFrame = document.getElementById('screen-frame');
    gameboy.insertBefore(colLeft,  screenFrame);
    gameboy.insertBefore(colRight, screenFrame.nextSibling);

    controlsTop.style.display = 'none';

    _landscape.applied = true;
}

function revertLandscapeDOM() {
    if (!_landscape.applied) return;

    const controlsTop    = document.getElementById('controls-top');
    const controlsMain   = document.getElementById('controls-main');
    const startSelect    = document.getElementById('start-select');
    const colLeft        = document.getElementById('landscape-left');
    const colRight       = document.getElementById('landscape-right');

    if (!colLeft || !colRight) return;

    const btnL             = document.getElementById('btn-l');
    const btnR             = document.getElementById('btn-r');
    const gameSelectorWrap = document.getElementById('game-selector-wrap');
    if (btnL) controlsTop.insertBefore(btnL, gameSelectorWrap);
    if (btnR) controlsTop.appendChild(btnR);

    const dpad           = document.getElementById('dpad');
    const controlsCenter = document.getElementById('controls-center');
    const abButtons      = document.getElementById('ab-buttons');
    const btnStart       = document.getElementById('btn-start');

    if (dpad)           controlsMain.appendChild(dpad);
    if (controlsCenter) controlsMain.appendChild(controlsCenter);
    if (abButtons)      controlsMain.appendChild(abButtons);

    if (btnStart && startSelect) startSelect.appendChild(btnStart);

    colLeft.remove();
    colRight.remove();

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
        setTimeout(handleOrientation, 100);
    });
    window.addEventListener('resize', handleOrientation);
    handleOrientation();
}
