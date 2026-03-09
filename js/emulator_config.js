/**
 * ============================================================
 *  GBX v1 — Configuration de l'émulateur
 * ============================================================
 *  Modifiez ce fichier pour ajuster les paramètres d'EmulatorJS
 *  sans toucher au code principal.
 * ============================================================
 */

const GBX_EMULATOR_CONFIG = {

    // ─── Chemins ─────────────────────────────────────────────
    // Chemin vers le dossier "data/" d'EmulatorJS (relatif à index.html)
    dataPath: "data/",

    // ─── Paramètres généraux ─────────────────────────────────
    startOnLoad:        true,   // Démarre le jeu dès que la ROM est chargée
    fullscreenOnLoad:   false,  // Ne pas forcer le plein écran au démarrage
    volume:             0.8,    // Volume par défaut (0.0 à 1.0)

    // ─── Cores par type de jeu ───────────────────────────────
    cores: {
        gb:  "gambatte",   // Game Boy Classic
        gbc: "gambatte",   // Game Boy Color
        gba: "mgba",       // Game Boy Advance
    },

    // ─── Touches clavier pour EmulatorJS ─────────────────────
    // On remplace TOUS les bindings natifs d'EJS par des touches F-key
    // inutilisées, afin d'éviter tout conflit avec notre mapping AZERTY.
    // Notre setupKeyboard() intercepte les vraies touches en capture=true
    // et appelle simulateInput() directement — EJS ne reçoit jamais ces touches.
    keyboardMapping: {
        0:  ["F1",  1],   // A       → F1  (inutilisé)
        1:  ["F2",  1],   // B       → F2
        2:  ["F3",  1],   // Start   → F3
        3:  ["F4",  1],   // Select  → F4
        4:  ["F5",  1],   // Up      → F5
        5:  ["F6",  1],   // Down    → F6
        6:  ["F7",  1],   // Left    → F7
        7:  ["F8",  1],   // Right   → F8
        8:  ["F9",  1],   // L       → F9
        9:  ["F10", 1],   // R       → F10
    },

    // ─── Cache ───────────────────────────────────────────────
    // Limite du cache en MB
    cacheLimit: 0, // 0 = illimité

    // ─── Options avancées ─────────────────────────────────────
    threads:        false,  // WebAssembly threads (désactivé = plus compatible)
    disableCue:     false,  // Désactiver les fichiers .cue
    softLoad:       false,  // Soft load (rechargement sans refresh)
    noAutoFocus:    false,  // Pas d'auto-focus sur l'émulateur

};
