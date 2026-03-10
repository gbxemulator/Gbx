/**
 * ============================================================
 *  GBX v1 — Script principal
 *  Gère : émulateur, contrôles, sidebar, auth, couleurs,
 *         save-states Supabase, vitesse, mapping clavier AZERTY
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
    setupSaveStateUI();       // Boutons CHARGER / SAUVEGARDER
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

    showToast('⚠️ EJECT d\'abord ton jeu !', 'error');
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
    // KeyG (touche G AZERTY) → charger save-state
    // KeyH (touche H AZERTY) → sauvegarder save-state
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
            const btn = document.getElementById('btn-load-state');
            if (btn && btn.style.display !== 'none') {
                addPressEffect(btn);
                openLoadStateModal();
            }
        },
        'KeyH': () => {
            const btn = document.getElementById('btn-save-state');
            if (btn && btn.style.display !== 'none') {
                addPressEffect(btn);
                openSaveStateModal();
            }
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
            title.innerHTML = 'MEI ♥';
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
    const btnLoad        = document.getElementById('btn-load-state');
    const btnSave        = document.getElementById('btn-save-state');

    if (GBX.user) {
        if (splitBtn) splitBtn.style.display = 'none';
        profileSection.style.display = 'flex';
        logoutBtn.style.display      = 'flex';
        avatarImg.src                = GBX.user.avatar || 'assets/avatar-default.png';
        nameEl.textContent           = GBX.user.pseudo;
        statusEl.textContent         = '🟢 Connecté';
        if (GBX.user.color) applyColor(GBX.user.color);
        if (btnLoad) btnLoad.style.display = '';
        if (btnSave) btnSave.style.display = '';
        if (saveHint) saveHint.style.display = 'none';
    } else {
        if (splitBtn) splitBtn.style.display = 'flex';
        profileSection.style.display = 'none';
        logoutBtn.style.display      = 'none';
        if (btnLoad) btnLoad.style.display = 'none';
        if (btnSave) btnSave.style.display = 'none';
        if (saveHint) saveHint.style.display = 'block';
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
   11. SAVE-STATES — SUPABASE
   ============================================================
   3 slots par utilisateur + jeu, stockés dans la table
   `save_states` (Supabase). Les données de state sont base64.

   Table SQL à créer :
   CREATE TABLE save_states (
     id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     game_id    text NOT NULL,
     slot       int  NOT NULL CHECK (slot BETWEEN 1 AND 3),
     data       text NOT NULL,
     saved_at   timestamptz DEFAULT now(),
     UNIQUE (user_id, game_id, slot)
   );
   ALTER TABLE save_states ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users manage own saves" ON save_states
     FOR ALL USING (auth.uid() = user_id);
   ============================================================ */

// ── Rappel de sauvegarde toutes les 20 minutes ───────────────
let _saveReminderTimer = null;

function startSaveReminder() {
    clearInterval(_saveReminderTimer);
    _saveReminderTimer = setInterval(() => {
        if (!GBX.user || !GBX.isRunning) return;
        const btn = document.getElementById('btn-save-state');
        if (!btn || btn.style.display === 'none') return;
        btn.classList.remove('save-remind');
        void btn.offsetWidth;
        btn.classList.add('save-remind');
        btn.addEventListener('animationend', () => btn.classList.remove('save-remind'), { once: true });
    }, 20 * 60 * 1000);
}

// ── Sérialisation du state EmulatorJS en base64 ──────────────
function _getStateBase64() {
    try {
        const gm = GBX.emulator?.gameManager || window.EJS_emulator?.gameManager;
        if (!gm) return null;

        // EmulatorJS v4 expose saveState sur gameManager.functions
        let data = null;
        if (typeof gm.functions?.saveState === 'function') {
            data = gm.functions.saveState();
        } else if (typeof gm.saveState === 'function') {
            data = gm.saveState();
        } else {
            return null;
        }

        if (!data) return null;
        const arr = data instanceof Uint8Array ? data : new Uint8Array(data);
        let binary = '';
        for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
        return btoa(binary);
    } catch(e) {
        console.warn('[GBX] getStateBase64:', e);
        return null;
    }
}

function _base64ToUint8Array(b64) {
    const binary = atob(b64);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return arr;
}

function _applyStateUint8(arr) {
    const gm = GBX.emulator?.gameManager || window.EJS_emulator?.gameManager;
    if (!gm) throw new Error('gameManager non disponible');

    if (typeof gm.functions?.loadState === 'function') {
        gm.functions.loadState(arr);
    } else if (typeof gm.loadState === 'function') {
        gm.loadState(arr);
    } else {
        throw new Error('loadState non disponible');
    }
}

// ── Charger les slots depuis Supabase ────────────────────────
async function _fetchSlots(gameId) {
    if (!GBX.user) return [];
    const { data, error } = await _supa
        .from('save_states')
        .select('slot, saved_at')
        .eq('user_id', GBX.user.id)
        .eq('game_id', gameId)
        .order('slot');
    if (error) { console.warn('[GBX] fetchSlots:', error); return []; }
    return data || [];
}

// ── Sauvegarder dans un slot ─────────────────────────────────
async function _saveToSlot(gameId, slot) {
    const base64 = _getStateBase64();
    if (!base64) {
        showToast('⚠️ Lance un jeu d\'abord !', 'error');
        return false;
    }
    const { error } = await _supa
        .from('save_states')
        .upsert({
            user_id:  GBX.user.id,
            game_id:  gameId,
            slot,
            data:     base64,
            saved_at: new Date().toISOString(),
        }, { onConflict: 'user_id,game_id,slot' });

    if (error) {
        console.error('[GBX] saveToSlot:', error);
        showToast('❌ Erreur lors de la sauvegarde.', 'error');
        return false;
    }
    return true;
}

// ── Charger depuis un slot ───────────────────────────────────
async function _loadFromSlot(gameId, slot) {
    const { data, error } = await _supa
        .from('save_states')
        .select('data')
        .eq('user_id', GBX.user.id)
        .eq('game_id', gameId)
        .eq('slot', slot)
        .single();

    if (error || !data) {
        showToast('❌ Aucune sauvegarde dans ce slot.', 'error');
        return false;
    }

    try {
        const gm = GBX.emulator?.gameManager || window.EJS_emulator?.gameManager;
        if (!gm) { showToast('⚠️ Lance un jeu d\'abord !', 'error'); return false; }
        const arr = _base64ToUint8Array(data.data);
        _applyStateUint8(arr);
        return true;
    } catch(e) {
        console.error('[GBX] loadFromSlot:', e);
        showToast('❌ Impossible de charger la sauvegarde.', 'error');
        return false;
    }
}

// ── Construire la grille des slots ───────────────────────────
function _buildSlotsGrid(containerId, filledSlots, onSlotClick) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    grid.innerHTML = '';

    for (let slot = 1; slot <= 3; slot++) {
        const filled = filledSlots.find(s => s.slot === slot);
        const btn = document.createElement('button');
        btn.className = 'slot-btn' + (filled ? ' slot-btn--filled' : ' slot-btn--empty');
        btn.dataset.slot = slot;

        const label = document.createElement('div');
        label.className = 'slot-label';
        label.textContent = 'Slot ' + slot;

        const info = document.createElement('div');
        info.className = 'slot-info';
        if (filled) {
            const d = new Date(filled.saved_at);
            info.textContent = d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        } else {
            info.textContent = '— vide —';
        }

        btn.appendChild(label);
        btn.appendChild(info);
        btn.addEventListener('click', () => onSlotClick(slot, filled));
        grid.appendChild(btn);
    }
}

// ── Ouvrir la modale SAUVEGARDER ────────────────────────────
async function openSaveStateModal() {
    if (!GBX.user) { showToast('🔒 Connecte toi pour sauvegarder !', 'error'); return; }
    if (!GBX.isRunning) { showToast('⚠️ Lance un jeu d\'abord !', 'error'); return; }

    const gameId = GBX.currentGame?.id;
    if (!gameId) return;

    const slots = await _fetchSlots(gameId);

    _buildSlotsGrid('save-slots-grid', slots, async (slot) => {
        const ok = await _saveToSlot(gameId, slot);
        if (ok) {
            closeModal();
            showToast('✅ Sauvegardé dans le slot ' + slot + ' !', 'success');
        }
    });

    openModal('save-state');
}

// ── Ouvrir la modale CHARGER ─────────────────────────────────
async function openLoadStateModal() {
    if (!GBX.user) { showToast('🔒 Connecte toi pour charger !', 'error'); return; }
    if (!GBX.isRunning) { showToast('⚠️ Lance un jeu d\'abord !', 'error'); return; }

    const gameId = GBX.currentGame?.id;
    if (!gameId) return;

    const slots = await _fetchSlots(gameId);

    _buildSlotsGrid('load-slots-grid', slots, async (slot, filled) => {
        if (!filled) { showToast('⚠️ Ce slot est vide !', 'error'); return; }
        const ok = await _loadFromSlot(gameId, slot);
        if (ok) {
            closeModal();
            showToast('📂 Slot ' + slot + ' chargé !', 'success');
        }
    });

    openModal('load-state');
}

// ── Initialiser les boutons CHARGER / SAUVEGARDER ────────────
function setupSaveStateUI() {
    const btnLoad = document.getElementById('btn-load-state');
    const btnSave = document.getElementById('btn-save-state');

    btnLoad?.addEventListener('click', () => {
        addPressEffect(btnLoad);
        openLoadStateModal();
    });

    btnSave?.addEventListener('click', () => {
        addPressEffect(btnSave);
        openSaveStateModal();
    });

    // Fermeture des modales en cliquant en dehors
    document.querySelectorAll('#modal-save-state, #modal-load-state').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeModal();
        });
    });

    // Démarrer le rappel de sauvegarde
    startSaveReminder();
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
