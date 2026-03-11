/**
 * ============================================================
 *  GBX v1 — Script principal
 *  Gère : émulateur, contrôles, sidebar, auth, couleurs,
 *         sauvegardes Supabase, vitesse, mapping clavier AZERTY
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
    playtimeTimer: null,  // timer compteur temps de jeu
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
    setupSaveButton();        // Bouton SAVE (envoi manuel Supabase)
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
    // Fix double-tap mobile : on utilise un flag pour éviter le double déclenchement
    let _touchSelectBlocked = false;
    select.addEventListener('touchstart', (e) => {
        if (GBX.isRunning) {
            e.preventDefault();
            if (!_touchSelectBlocked) {
                _touchSelectBlocked = true;
                showEjectBubble();
                setTimeout(() => { _touchSelectBlocked = false; }, 800);
            }
        }
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
        stopAutoSave();
        stopPlaytimeTracker();
        setTimeout(() => window.location.reload(), 120);
    });
}

/* ============================================================
   BULLE "EJECT D'ABORD" → TOAST + SHAKE
   ============================================================ */
function showEjectBubble() {
    const eject = document.getElementById('btn-eject');

    // Shake du bouton EJECT
    if (eject) {
        eject.classList.remove('shake');
        void eject.offsetWidth;
        eject.classList.add('shake');
        eject.addEventListener('animationend', () => eject.classList.remove('shake'), { once: true });
    }

    showToast('⚠️ EJECT ton jeu d\'abord !', 'error');
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

    // Force EmulatorJS a flusher la SRAM toutes les 30s nativement
    window.EJS_fixedSaveInterval = 30_000;

    // Masquer le menu intégré d'EmulatorJS (on a le nôtre)
    window.EJS_hideSettings = true;

    // Désactiver les contrôles tactiles natifs d'EmulatorJS (on a les nôtres)
    window.EJS_VirtualGamepad   = false;
    window.EJS_noVirtualGamepad = true;

    // Mapping clavier (voir emulator.config.js)
    window.EJS_defaultControls = buildDefaultControls();

    // Callback prêt — injection save + démarrage auto-save
    window.EJS_ready = () => {
        GBX.isRunning   = true;
        GBX.emulator    = window.EJS_emulator;
        GBX.speedActive = false;
        GBX.speedReady  = false;  // Bloqué pendant 1.5s
        setTimeout(() => { GBX.speedReady = true; }, 1500);
        updateSpeedButton();
        showToast('🎮 ' + game.name + ' lancé !', 'success');

        // Réappliquer les cheats actifs pour ce jeu
        setTimeout(() => _reapplyActiveCheatForGame(game.id), 2000);

        // Injection FS WASM avec retry (EJS_ready est appele trop tot)
        if (GBX.user && GBX._pendingSaveArr) {
            _injectSaveWithRetry(GBX._pendingSaveArr);
            GBX._pendingSaveArr = null;
        }

        setTimeout(() => startAutoSave(), 10_000);
        startPlaytimeTracker(game.id);

    };

    // Colorisation GB uniquement — après EJS_ready pour ne pas reset le core
    window.EJS_onGameStart = () => {
        if (game.type === 'gb' && window.EJS_emulator) {
            window.EJS_emulator.changeSettingOption('gambatte_gb_colorization', 'GBC');
        }
    };

    // Pré-charger la save dans IndexedDB AVANT loader.js
    // syncfs() copie IDB → FS WASM au boot — la save doit être là avant
    if (GBX.user) {
        _restoreIngameSave(game.id).then(() => {
            const oldLoader = document.getElementById('ejs-loader');
            if (oldLoader) oldLoader.remove();
            const script = document.createElement('script');
            script.id  = 'ejs-loader';
            script.src = GBX_EMULATOR_CONFIG.dataPath + 'loader.js';
            document.head.appendChild(script);
        });
    } else {
        // Pas connecté — lancer directement
        const oldLoader = document.getElementById('ejs-loader');
        if (oldLoader) oldLoader.remove();
        const script = document.createElement('script');
        script.id  = 'ejs-loader';
        script.src = GBX_EMULATOR_CONFIG.dataPath + 'loader.js';
        document.head.appendChild(script);
    }
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
    const cheatBtn = document.getElementById('btn-cheat');

    speedBtn.addEventListener('click', () => {
        addPressEffect(speedBtn);
        toggleSpeed();
    });

    menuBtn.addEventListener('click', () => {
        addPressEffect(menuBtn);
        toggleSidebar(true);
    });

    cheatBtn?.addEventListener('click', () => {
        addPressEffect(cheatBtn);
        openCheatModal();
    });
}

function toggleSpeed() {
    if (!GBX.isRunning || !GBX.emulator || !GBX.speedReady) {
        // Pas de jeu en cours → shake + toast
        const btn = document.getElementById('btn-speed');
        if (btn) {
            btn.classList.remove('shake');
            void btn.offsetWidth;
            btn.classList.add('shake');
            btn.addEventListener('animationend', () => btn.classList.remove('shake'), { once: true });
        }
        showToast(GBX.isRunning ? '⏳ Attends un peu ..' : '⚠️ Lance un jeu d\'abord !', 'error');
        return;
    }

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
    document.querySelectorAll('.sidebar-btn, .modal-btn, .contact-submit').forEach(btn => {
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
    // KeyG (touche G AZERTY) → ouvrir modale save rapide
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
        'KeyG': () => {
            const btn = document.getElementById('btn-save');
            if (btn && btn.style.display !== 'none') {
                addPressEffect(btn);
                _handleSaveKeyG();
            }
        },
        'KeyF': () => {
            const btn = document.getElementById('btn-cheat');
            if (btn && btn.style.display !== 'none') {
                addPressEffect(btn);
                const cheatModal = document.getElementById('modal-cheat');
                if (cheatModal?.classList.contains('open')) {
                    closeModal();
                } else {
                    openCheatModal();
                }
            }
        },
    };

    document.addEventListener('keydown', (e) => {
        // Cas spécial : touche G quand la modal de confirmation save est ouverte = confirmer
        if (e.code === 'KeyG' && !e.repeat) {
            const modalEl = document.getElementById('modal-save-confirm');
            if (modalEl?.classList.contains('open')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                _doSave();
                return;
            }
        }

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
            title.innerHTML = 'MEI <span style="font-size:0.5em;margin-left:-6px">\'s Edition</span>';
        } else {
            title.innerHTML = 'GBX <span style="font-size:0.5em;margin-left:-6px">v<span style="font-size:1.15em">1</span></span>';
        }
    }

    document.querySelectorAll('.color-swatch').forEach(s => {
        s.classList.toggle('active', s.dataset.id === colorId);
    });

    // Classe gameboy-light pour les couleurs claires (textes sombres)
    const lightColors = ['blanc'];
    gb.classList.toggle('gameboy-light', lightColors.includes(colorId));

    localStorage.setItem('gbx-color', colorId);
    if (GBX.user) saveUserColorToServer(colorId);
}

function restoreColor() {
    // La couleur localStorage n'est restaurée qu'après vérification auth
    // Au init, on applique juste le défaut — updateAuthUI restaurera la couleur serveur
    applyColor(GBX_STYLE_CONFIG.defaultColor);
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
    updateAuthUI(); // applique GBX.user.color via applyColor()
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
    const logoutBtn      = document.getElementById('btn-logout');
    const avatarImg      = document.getElementById('profile-avatar');
    const nameEl         = document.getElementById('profile-name');
    const statusEl       = document.getElementById('profile-status');
    const saveHint       = document.getElementById('save-login-hint');
    const btnSave        = document.getElementById('btn-save');
    const btnCheat       = document.getElementById('btn-cheat');

    const saveLoggedHint = document.getElementById('save-logged-hint');

    if (GBX.user) {
        if (splitBtn) splitBtn.style.display = 'none';
        profileSection.style.display = 'flex';
        logoutBtn.style.display      = 'flex';
        avatarImg.src                = GBX.user.avatar || 'assets/avatar-default.png';
        nameEl.textContent           = GBX.user.pseudo;
        statusEl.textContent         = 'En ligne';
        if (GBX.user.color) applyColor(GBX.user.color);
        if (btnSave)        btnSave.style.display        = '';
        if (btnCheat)       btnCheat.style.display       = '';
        if (saveHint)       saveHint.style.display       = 'none';
        if (saveLoggedHint) saveLoggedHint.style.display = 'block';
    } else {
        if (splitBtn) splitBtn.style.display = 'flex';
        profileSection.style.display = 'none';
        logoutBtn.style.display      = 'none';
        if (btnSave)        btnSave.style.display        = 'none';
        if (btnCheat)       btnCheat.style.display       = 'none';
        if (saveHint)       saveHint.style.display       = 'block';
        if (saveLoggedHint) saveLoggedHint.style.display = 'none';
        // Reset couleur vers défaut quand déconnecté
        localStorage.removeItem('gbx-color');
        applyColor(GBX_STYLE_CONFIG.defaultColor);
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
   11. SAUVEGARDES — SUPABASE
   ============================================================
   • Save ingame (.srm) → table "saves" (historique 3 slots)
     Envoi manuel via bouton SAVE avec confirmation.
     L'auto-save surveille les changements toutes les 3s
     mais N'envoie plus automatiquement — sert juste à détecter
     si le jeu a progressé.
   ============================================================ */

// ── Helpers bas niveau : .srm ────────────────────────────────

function _getSrmData() {
    try {
        const gm = GBX.emulator?.gameManager || window.EJS_emulator?.gameManager;
        if (!gm) return null;
        try { if (typeof gm.functions?.saveSaveFiles === 'function') gm.functions.saveSaveFiles(); } catch(_) {}
        const path = gm.functions?.getSaveFilePath?.();
        if (!path) return null;
        const data = gm.FS.readFile(path);
        if (!data || data.length === 0) return null;
        // Propager WASM -> IndexedDB en arriere-plan
        try { gm.FS.syncfs(false, () => {}); } catch(_) {}
        return data;
    } catch(e) { console.warn('[GBX] getSrmData:', e); return null; }
}

function _srmToBase64(data) {
    let binary = '';
    for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i]);
    return btoa(binary);
}



// ── Hash rapide pour détecter les changements du .srm ────────

function _quickHash(arr) {
    let h = arr.length;
    const check = Math.min(64, arr.length);
    for (let i = 0; i < check; i++) h = (h * 31 + arr[i]) >>> 0;
    for (let i = Math.max(0, arr.length - check); i < arr.length; i++) h = (h * 31 + arr[i]) >>> 0;
    return h;
}

// -- INJECTION save dans le FS WASM avec retry --
// EJS_ready est appele trop tot - le FS WASM n'accepte pas encore writeFile.
// On retry toutes les 500ms jusqu'a 20s max.
function _injectSaveWithRetry(saveArr) {
    const MAX_ATTEMPTS = 240;
    let attempts = 0;

    const tryInject = () => {
        attempts++;
        const gm = window.EJS_emulator?.gameManager;
        if (!gm) { if (attempts < MAX_ATTEMPTS) setTimeout(tryInject, 500); return; }
        const path = gm.functions?.getSaveFilePath?.();
        if (!path) { if (attempts < MAX_ATTEMPTS) setTimeout(tryInject, 500); return; }
        try {
            gm.FS.writeFile(path, saveArr);
            try { gm.FS.syncfs(false, () => {}); } catch(_) {}
            gm.functions.loadSaveFiles();
            console.info('[GBX] Save restauree dans FS WASM (tentative ' + attempts + ')');
        } catch(e) {
            console.warn('[GBX] FS pas pret (tentative ' + attempts + '), retry...', e.message);
            if (attempts < MAX_ATTEMPTS) setTimeout(tryInject, 500);
        }
    };

    setTimeout(tryInject, 500);
}

// -- RESTAURATION save ingame au lancement --
// Stratégie double :
//   1. Écrire dans IndexedDB (/data/saves) AVANT loader.js
//      → Gambatte (GBC/GB) lit IDB au boot via syncfs — c'est la voie principale
//   2. Stocker aussi dans _pendingSaveArr pour _injectSaveWithRetry
//      → Double sécurité post-EJS_ready (FS WASM write + loadSaveFiles)
async function _restoreIngameSave(gameId) {
    GBX._pendingSaveArr = null;
    try {
        const { data: saves } = await _supa
            .from('saves')
            .select('data, saved_at')
            .eq('user_id', GBX.user.id)
            .eq('game_id', gameId)
            .order('saved_at', { ascending: false })
            .limit(1);
        const saveRow = saves?.[0];
        if (!saveRow?.data) return;

        const binary = atob(saveRow.data);
        const arr = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
        GBX._pendingSaveArr = arr;
        console.info('[GBX] Save Supabase chargee (' + new Date(saveRow.saved_at).toLocaleString('fr-FR') + '), ecriture IDB...');

        // Écrire dans IndexedDB avant loader.js
        // EmulatorJS utilise la DB "/data/saves" version 21, store "FILE_DATA"
        // Clé = chemin absolu du fichier save (ex: /data/saves/Gambatte/pokemon_cristal.sav)
        // On écrit dans tous les chemins possibles pour couvrir GB/GBC/GBA
        await _writeIDB(gameId, arr);

    } catch(e) { console.warn('[GBX] fetch save:', e); }
}

// Écrit la save dans IndexedDB sous tous les chemins que Gambatte/mGBA peuvent utiliser
function _writeIDB(gameId, arr) {
    return new Promise((resolve) => {
        try {
            const req = indexedDB.open('/data/saves', 21);
            req.onupgradeneeded = () => {};
            req.onerror = () => { resolve(); };
            req.onsuccess = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('FILE_DATA')) { db.close(); resolve(); return; }

                const tx = db.transaction('FILE_DATA', 'readwrite');
                const store = tx.objectStore('FILE_DATA');
                const now = new Date();

                // Chemins possibles selon le core et le nom du jeu
                const paths = [
                    // Gambatte GBC/GB — utilise le nom du fichier ROM sans extension
                    '/data/saves/Gambatte/' + gameId + '.sav',
                    '/data/saves/Gambatte/' + gameId + '.srm',
                    // mGBA GBA
                    '/data/saves/mGBA/' + gameId + '.sav',
                    '/data/saves/mGBA/' + gameId + '.srm',
                    // Dossiers parents (Gambatte les crée s'ils n'existent pas)
                ];

                // S'assurer que les dossiers existent dans IDB
                const dirs = [
                    '/data/saves/Gambatte',
                    '/data/saves/mGBA',
                    '/data/saves',
                    '/data',
                ];
                dirs.forEach(dir => {
                    store.put({ timestamp: now, mode: 16877 }, dir);
                });

                // Écrire le fichier save dans tous les chemins
                paths.forEach(path => {
                    store.put({ timestamp: now, mode: 33206, contents: arr }, path);
                });

                tx.oncomplete = () => {
                    db.close();
                    console.info('[GBX] Save ecrite dans IDB (' + paths.length + ' chemins)');
                    resolve();
                };
                tx.onerror = () => { db.close(); resolve(); };
            };
        } catch(e) {
            console.warn('[GBX] IDB write error:', e);
            resolve();
        }
    });
}

// ── AUTO-SAVE ingame (.srm → table "saves") ──────────────────

let _autoSaveTimer    = null;
let _autoSaveReminder = null;
let _autoSaveLastHash = null;
let _autoSaveDirty    = false;

function startAutoSave() {
    stopAutoSave();
    _autoSaveLastHash = null;
    _autoSaveDirty    = false;

    // Rappel vibration toutes les 20min
    _autoSaveReminder = setInterval(() => {
        if (!GBX.isRunning) return;
        const btn = document.getElementById('btn-save');
        if (btn && btn.style.display !== 'none') {
            btn.classList.remove('shake');
            void btn.offsetWidth;
            btn.classList.add('shake');
            btn.addEventListener('animationend', () => btn.classList.remove('shake'), { once: true });
        }
    }, 20 * 60 * 1000);

    // Détection de changement du .srm toutes les 3s (pas d'envoi auto)
    _autoSaveTimer = setInterval(() => {
        if (!GBX.isRunning || !GBX.currentGame) return;
        try {
            const data = _getSrmData();
            if (!data) return;
            const nonFF = Array.from(data).filter(b => b !== 0xFF).length;
            if (nonFF < data.length * 0.10) return;
            const hash = _quickHash(data);
            if (hash !== _autoSaveLastHash) {
                _autoSaveLastHash = hash;
                _autoSaveDirty    = true;
            }
        } catch(e) { /* silencieux */ }
    }, 3_000);
}

function stopAutoSave() {
    clearInterval(_autoSaveTimer);
    clearInterval(_autoSaveReminder);
    _autoSaveTimer    = null;
    _autoSaveReminder = null;
    _autoSaveLastHash = null;
    _autoSaveDirty    = false;
}
// ── ENVOI MANUEL DE LA SAVE → Supabase (historique 3 slots) ──

async function _sendSaveToServer(gameId) {
    const data = _getSrmData();
    if (!data) throw new Error('Impossible de lire la sauvegarde');

    const nonFF = Array.from(data).filter(b => b !== 0xFF).length;
    if (nonFF < data.length * 0.10) throw new Error('Sauvegarde vide');

    const b64 = _srmToBase64(data);
    const now  = new Date().toISOString();

    // Récupérer les saves existantes pour ce jeu (triées par date, plus récentes d'abord)
    const { data: existing } = await _supa
        .from('saves')
        .select('id, saved_at')
        .eq('user_id', GBX.user.id)
        .eq('game_id', gameId)
        .order('saved_at', { ascending: false });

    const MAX_SLOTS = 3;

    if (!existing || existing.length < MAX_SLOTS) {
        // Insérer un nouveau slot
        const { error } = await _supa.from('saves').insert({
            user_id:  GBX.user.id,
            game_id:  gameId,
            data:     b64,
            saved_at: now,
        });
        if (error) throw error;
    } else {
        // Écraser le plus ancien (dernier dans la liste triée desc)
        const oldest = existing[existing.length - 1];
        const { error } = await _supa.from('saves')
            .update({ data: b64, saved_at: now })
            .eq('id', oldest.id);
        if (error) throw error;
    }

    _autoSaveDirty = false;
    console.info('[GBX] 💾 Save envoyée sur le serveur');
}

// ── Gestion de la touche G (double-presse = confirmation) ────

function _handleSaveKeyG() {
    const modalEl = document.getElementById('modal-save-confirm');
    const isOpen  = modalEl?.classList.contains('open');

    if (isOpen) {
        // Deuxième appui sur G = confirmer
        _doSave();
        return;
    }

    // Premier appui = ouvrir la confirmation
    _openSaveConfirm();
}

function _openSaveConfirm() {
    if (!GBX.user) {
        const btn = document.getElementById('btn-save');
        if (btn) { btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake'); btn.addEventListener('animationend', () => btn.classList.remove('shake'), { once: true }); }
        showToast('🔒 Connecte toi pour sauvegarder !', 'error');
        return;
    }
    if (!GBX.isRunning) {
        const btn = document.getElementById('btn-save');
        if (btn) { btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake'); btn.addEventListener('animationend', () => btn.classList.remove('shake'), { once: true }); }
        showToast("⚠️ Lance un jeu d'abord !", 'error');
        return;
    }
    openModal('save-confirm');
}

async function _doSave() {
    closeModal();
    if (!GBX.user || !GBX.currentGame) return;
    try {
        await _sendSaveToServer(GBX.currentGame.id);
        showToast('✅ Sauvegarde envoyée sur le serveur !', 'success');
    } catch(e) {
        console.error('[GBX] save:', e);
        showToast('❌ Erreur lors de la sauvegarde.', 'error');
    }
}

// ── Initialiser le bouton SAVE ────────────────────────────────

function setupSaveButton() {
    const btnSave = document.getElementById('btn-save');
    btnSave?.addEventListener('click', () => {
        addPressEffect(btnSave);
        _openSaveConfirm();
    });

    // Boutons Oui / Non dans la modale
    document.getElementById('btn-save-confirm-yes')?.addEventListener('click', () => _doSave());
    document.getElementById('btn-save-confirm-no')?.addEventListener('click',  () => closeModal());

    // Fermer la modale si clic sur le backdrop
    document.getElementById('modal-save-confirm')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('modal-save-confirm')) closeModal();
    });
}


/* ============================================================
   11b. COMPTEUR DE TEMPS DE JEU
   ============================================================
   • Table "playtime" : 1 ligne par (user_id, game_id)
   • Flush toutes les 60s vers Supabase (durée cumulée en secondes)
   • Pour ajouter un jeu : il suffit que son game_id existe dans GBX_GAMES
     — le compteur démarre automatiquement à chaque lancement
   ============================================================ */

let _playtimeStart    = null;   // timestamp Date.now() au lancement
let _playtimeFlushTimer = null; // setInterval flush 60s

function startPlaytimeTracker(gameId) {
    stopPlaytimeTracker();
    if (!GBX.user) return;
    _playtimeStart = Date.now();

    // Flush toutes les 60s
    _playtimeFlushTimer = setInterval(() => {
        _flushPlaytime(gameId);
    }, 60_000);
}

function stopPlaytimeTracker() {
    clearInterval(_playtimeFlushTimer);
    _playtimeFlushTimer = null;
    // Flush final au stop (si jeu en cours)
    if (_playtimeStart !== null && GBX.currentGame && GBX.user) {
        _flushPlaytime(GBX.currentGame.id);
    }
    _playtimeStart = null;
}

async function _flushPlaytime(gameId) {
    if (!GBX.user || !_playtimeStart) return;
    const elapsed = Math.floor((Date.now() - _playtimeStart) / 1000); // secondes
    if (elapsed < 5) return; // trop court pour être significatif
    _playtimeStart = Date.now(); // reset pour la prochaine période

    try {
        // Récupérer le temps existant
        const { data: existing } = await _supa
            .from('playtime')
            .select('seconds')
            .eq('user_id', GBX.user.id)
            .eq('game_id', gameId)
            .maybeSingle();

        const total = (existing?.seconds || 0) + elapsed;

        await _supa.from('playtime').upsert({
            user_id:    GBX.user.id,
            game_id:    gameId,
            seconds:    total,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,game_id' });

        console.info('[GBX] ⏱️ Playtime flush: +' + elapsed + 's → total ' + Math.floor(total/60) + 'min');
    } catch(e) { console.warn('[GBX] playtime flush:', e); }
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
    // Forcer une taille indépendante — évite l'héritage de taille du toast précédent
    toast.style.width = 'max-content';
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

/* ============================================================
   17. SYSTÈME CHEAT (codes triche)
   ============================================================ */

// Codes prédéfinis par jeu (Action Replay / GameShark)
// Codes prédéfinis par jeu — définis dans js/cheats.config.js
// GBX_CHEATS est chargé avant main.js via <script src="js/cheats.config.js">

// État des cheats (actifs) par jeu — clé = gameId, valeur = Set d'index actifs
const GBX_CHEAT_ACTIVE = {};

// Codes custom ajoutés par l'utilisateur (session uniquement, pas de persistance)
const GBX_CHEAT_CUSTOM = {}; // gameId → [{name, code}]

let _cheatCurrentGame = null;

// ── Ouvrir la modale cheat ────────────────────────────────────
function openCheatModal() {
    // Construire la liste des jeux
    _buildCheatGameList();
    // Afficher la vue 1 (sélection jeu)
    document.getElementById('cheat-view-games').style.display = '';
    document.getElementById('cheat-view-codes').style.display = 'none';
    openModal('cheat');
}

// ── Construire la liste des jeux ──────────────────────────────
function _buildCheatGameList() {
    const list = document.getElementById('cheat-game-list');
    if (!list) return;
    list.innerHTML = '';

    const typeLabels = { gba: 'GBA', gbc: 'GBC', gb: 'GB' };

    GBX_GAMES.forEach(game => {
        const btn = document.createElement('button');
        btn.className = 'cheat-game-btn';

        const badge = document.createElement('span');
        badge.className = 'cheat-game-type-badge';
        badge.textContent = typeLabels[game.type] || game.type.toUpperCase();

        const name = document.createElement('span');
        name.style.flex = '1';
        name.textContent = game.name;

        // Indicateur de codes actifs
        const activeCount = (GBX_CHEAT_ACTIVE[game.id]?.size || 0);
        if (activeCount > 0) {
            const ind = document.createElement('span');
            ind.style.cssText = 'background:#22c55e;color:#fff;font-size:10px;font-weight:700;padding:1px 7px;border-radius:20px;font-family:var(--font-display)';
            ind.textContent = activeCount + ' actif' + (activeCount > 1 ? 's' : '');
            btn.appendChild(badge);
            btn.appendChild(name);
            btn.appendChild(ind);
        } else {
            btn.appendChild(badge);
            btn.appendChild(name);
        }

        btn.addEventListener('click', () => {
            _cheatCurrentGame = game;
            _buildCheatCodeList(game);
            document.getElementById('cheat-view-games').style.display = 'none';
            document.getElementById('cheat-view-codes').style.display = 'flex';
            document.getElementById('cheat-game-title').textContent = game.name;
        });

        list.appendChild(btn);
    });
}

// ── Construire la liste des codes pour un jeu ─────────────────
function _buildCheatCodeList(game) {
    const list = document.getElementById('cheat-codes-list');
    if (!list) return;
    list.innerHTML = '';

    if (!GBX_CHEAT_ACTIVE[game.id]) GBX_CHEAT_ACTIVE[game.id] = new Set();
    if (!GBX_CHEAT_CUSTOM[game.id]) GBX_CHEAT_CUSTOM[game.id] = [];

    const presets = GBX_CHEATS[game.id] || [];

    // Label codes prédéfinis
    if (presets.length > 0) {
        const lbl = document.createElement('div');
        lbl.className = 'cheat-section-label';
        lbl.textContent = 'Codes prédéfinis';
        list.appendChild(lbl);
    }

    presets.forEach((cheat, idx) => {
        list.appendChild(_buildCheatItem(cheat, 'preset_' + idx, game, false));
    });

    const customs = GBX_CHEAT_CUSTOM[game.id];
    if (customs.length > 0) {
        const lbl = document.createElement('div');
        lbl.className = 'cheat-section-label';
        lbl.textContent = 'Mes codes';
        list.appendChild(lbl);

        customs.forEach((cheat, idx) => {
            list.appendChild(_buildCheatItem(cheat, 'custom_' + idx, game, true));
        });
    }

    if (presets.length === 0 && customs.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'text-align:center;color:rgba(255,255,255,0.3);font-size:12px;padding:16px 0';
        empty.textContent = 'Aucun code disponible pour ce jeu.\nAjoute le tien ci-dessous !';
        list.appendChild(empty);
    }

    // Lier le bouton retour
    document.getElementById('cheat-back-btn').onclick = () => {
        document.getElementById('cheat-view-games').style.display = '';
        document.getElementById('cheat-view-codes').style.display = 'none';
        _buildCheatGameList(); // rafraîchir les compteurs
    };

    // Lier le bouton ajouter
    document.getElementById('cheat-add-btn').onclick = () => {
        const nameVal = document.getElementById('cheat-custom-name').value.trim();
        const codeVal = document.getElementById('cheat-custom-code').value.trim();
        if (!nameVal || !codeVal) {
            showToast('⚠️ Remplis le nom et le code !', 'error');
            return;
        }
        GBX_CHEAT_CUSTOM[game.id].push({ name: nameVal, code: codeVal });
        document.getElementById('cheat-custom-name').value = '';
        document.getElementById('cheat-custom-code').value = '';
        _buildCheatCodeList(game);
        showToast('✅ Code ajouté !', 'success');
    };
}

// ── Construire un item de code ────────────────────────────────
function _buildCheatItem(cheat, key, game, isCustom) {
    const item = document.createElement('div');
    item.className = 'cheat-code-item' + (isCustom ? ' custom' : '');

    const isActive = GBX_CHEAT_ACTIVE[game.id]?.has(key);
    if (isActive) item.classList.add('active');

    const dot  = document.createElement('div');
    dot.className = 'cheat-code-dot';

    const info = document.createElement('div');
    info.className = 'cheat-code-info';

    const name = document.createElement('div');
    name.className   = 'cheat-code-name';
    name.textContent = cheat.name;

    const val = document.createElement('div');
    val.className   = 'cheat-code-val';
    val.textContent = cheat.code;

    info.appendChild(name);
    info.appendChild(val);

    item.appendChild(dot);
    item.appendChild(info);

    // Bouton supprimer (custom uniquement)
    if (isCustom) {
        const delBtn = document.createElement('button');
        delBtn.className   = 'cheat-code-del';
        delBtn.textContent = '✕';
        delBtn.title       = 'Supprimer ce code';
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Désactiver d'abord si actif
            if (GBX_CHEAT_ACTIVE[game.id]?.has(key)) {
                _deactivateCheat(game, key, cheat);
            }
            // Trouver l'index custom
            const customIdx = parseInt(key.replace('custom_', ''));
            GBX_CHEAT_CUSTOM[game.id].splice(customIdx, 1);
            _buildCheatCodeList(game);
            showToast('🗑️ Code supprimé', 'info');
        });
        item.appendChild(delBtn);
    }

    // Clic : toggle actif/inactif
    item.addEventListener('click', (e) => {
        if (e.target.classList.contains('cheat-code-del')) return;
        if (GBX_CHEAT_ACTIVE[game.id]?.has(key)) {
            _deactivateCheat(game, key, cheat);
            item.classList.remove('active');
            dot.classList.remove('active');
            showToast('🔴 ' + cheat.name + ' désactivé', 'info');
        } else {
            _activateCheat(game, key, cheat);
            item.classList.add('active');
            dot.classList.add('active');
            showToast('✅ ' + cheat.name + ' activé !', 'success');
        }
        _updateCheatButton();
    });

    return item;
}

// ── Activer un code cheat ─────────────────────────────────────
function _activateCheat(game, key, cheat) {
    if (!GBX_CHEAT_ACTIVE[game.id]) GBX_CHEAT_ACTIVE[game.id] = new Set();
    GBX_CHEAT_ACTIVE[game.id].add(key);

    // Appliquer dans l'émulateur si en cours
    if (GBX.isRunning && GBX.emulator && GBX.currentGame?.id === game.id) {
        _applyCheatToEmulator(cheat, true);
    }
}

// ── Désactiver un code cheat ──────────────────────────────────
function _deactivateCheat(game, key, cheat) {
    GBX_CHEAT_ACTIVE[game.id]?.delete(key);

    if (GBX.isRunning && GBX.emulator && GBX.currentGame?.id === game.id) {
        _applyCheatToEmulator(cheat, false);
    }
}

// ── Appliquer / retirer un code dans EmulatorJS ───────────────
function _applyCheatToEmulator(cheat, enable) {
    try {
        const gm = GBX.emulator?.gameManager || window.EJS_emulator?.gameManager;
        if (!gm) return;

        // EmulatorJS expose addCheat / removeCheat ou cheats manager
        // Format unifié : on passe chaque ligne séparément
        const lines = cheat.code.split('\n').map(l => l.trim()).filter(Boolean);

        lines.forEach(line => {
            if (enable) {
                // Tentative API EmulatorJS
                if (typeof gm.functions?.addCheat === 'function') {
                    gm.functions.addCheat(line);
                } else if (gm.cheats && typeof gm.cheats.addCode === 'function') {
                    gm.cheats.addCode(line);
                }
            } else {
                if (typeof gm.functions?.removeCheat === 'function') {
                    gm.functions.removeCheat(line);
                } else if (gm.cheats && typeof gm.cheats.removeCode === 'function') {
                    gm.cheats.removeCode(line);
                }
            }
        });
    } catch(e) {
        console.warn('[GBX] Cheat apply error:', e);
    }
}

// ── Mettre à jour l'aspect du bouton CHEAT ───────────────────
function _updateCheatButton() {
    const btn = document.getElementById('btn-cheat');
    if (!btn) return;

    const hasActive = Object.values(GBX_CHEAT_ACTIVE).some(s => s.size > 0);
    btn.classList.toggle('cheat-active', hasActive);
}

// ── Rejouer tous les cheats actifs lors d'un lancement de jeu ─
function _reapplyActiveCheatForGame(gameId) {
    const active = GBX_CHEAT_ACTIVE[gameId];
    if (!active || active.size === 0) return;

    const presets = GBX_CHEATS[gameId] || [];
    const customs = GBX_CHEAT_CUSTOM[gameId]  || [];

    active.forEach(key => {
        let cheat = null;
        if (key.startsWith('preset_')) {
            cheat = presets[parseInt(key.replace('preset_', ''))];
        } else if (key.startsWith('custom_')) {
            cheat = customs[parseInt(key.replace('custom_', ''))];
        }
        if (cheat) _applyCheatToEmulator(cheat, true);
    });
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
