/**
 * ============================================================
 *  GBX v1 — Configuration du style de la Gameboy
 * ============================================================
 *  Modifiez ce fichier pour changer les dimensions, positions
 *  et apparences de tous les éléments de la Gameboy.
 *  Les valeurs sont injectées en CSS custom properties.
 * ============================================================
 */

const GBX_STYLE_CONFIG = {

    // ─── Dimensions générales ────────────────────────────────
    gameboy: {
        widthDesktop:   "420px",   // Largeur sur PC
        widthMobile:    "100vw",   // Largeur sur mobile
        maxWidthMobile: "420px",   // Largeur max sur mobile
        borderRadius:   "28px",    // Arrondi des coins de la Gameboy
        padding:        "18px",    // Padding interne général
    },

    // ─── Écran ───────────────────────────────────────────────
    screen: {
        // Dimensions GBA (16:9 landscape) — jeux .gba
        widthGBA:   "100%",
        heightGBA:  "240px",       // Hauteur native GBA
        // Dimensions GB/GBC (carré) — jeux .gb et .gbc
        widthGB:    "240px",
        heightGB:   "216px",
        // Style du cadre extérieur de l'écran
        frameRadius:   "12px",     // Arrondi du CADRE (doux)
        screenRadius:  "0px",      // Arrondi de l'écran lui-même (pointu = 0)
        framePadding:  "12px",     // Espace entre le cadre et l'écran
        frameBgColor:  "#1a1a2e",  // Couleur du cadre autour de l'écran
        screenBgColor: "#000000",  // Couleur de fond de l'écran (quand éteint)
        // Reflet sur l'écran (effet verre)
        glareOpacity: "0.07",
    },

    // ─── Boutons A et B ──────────────────────────────────────
    abButtons: {
        size:           "54px",    // Diamètre des boutons A et B
        gap:            "12px",    // Espace entre A et B
        color:          "#c0c0c0", // Couleur (gris clair par défaut)
        activeColor:    "#a0a0a0", // Couleur quand enfoncé
        fontSize:       "14px",
        fontWeight:     "700",
        // Position verticale relative au bas du corps de la gameboy
        marginTop:      "12px",
        // Décalage horizontal du groupe A/B
        offsetRight:    "24px",
    },

    // ─── Croix directionnelle ────────────────────────────────
    dpad: {
        size:       "130px",   // Taille totale de la croix
        armWidth:   "42px",    // Largeur de chaque bras
        color:      "#c0c0c0", // Couleur (gris clair)
        activeColor:"#a0a0a0",
        borderRadius: "4px",
        centerSize: "44px",    // Taille du centre de la croix
        offsetLeft: "12px",
        marginTop:  "12px",
    },

    // ─── Boutons Start et Select ─────────────────────────────
    startSelect: {
        width:       "58px",
        height:      "18px",
        borderRadius:"20px",
        color:        "#c0c0c0",
        activeColor:  "#a0a0a0",
        fontSize:     "9px",
        gap:          "18px",
        marginTop:    "28px",
    },

    // ─── Boutons L et R ──────────────────────────────────────
    lrButtons: {
        width:        "58px",
        height:       "22px",
        borderRadius: "12px 12px 4px 4px",
        color:        "#c0c0c0",
        activeColor:  "#a0a0a0",
        fontSize:     "12px",
        fontWeight:   "700",
        disabledOpacity: "0.35",   // Opacité quand désactivé (jeux .gb/.gbc)
    },

    // ─── Bouton Speed (orange "S") ───────────────────────────
    speedButton: {
        size:         "22px",
        bgColor:      "#FF8C00",   // Orange
        activeColor:  "#e07800",
        fontSize:     "11px",
        fontWeight:   "800",
        color:        "#fff",
    },

    // ─── Bouton Menu (rouge "M") ──────────────────────────────
    menuButton: {
        size:         "22px",
        bgColor:      "#e63946",   // Rouge
        activeColor:  "#c1121f",
        fontSize:     "11px",
        fontWeight:   "800",
        color:        "#fff",
    },

    // ─── Effet d'enfoncement au clic ─────────────────────────
    pressEffect: {
        translateY:  "2px",    // Déplacement vertical quand enfoncé
        scaleDown:   "0.94",   // Réduction de taille quand enfoncé
        duration:    "80ms",   // Durée de l'animation
    },

    // ─── Couleurs de la Gameboy ──────────────────────────────
    // Ces couleurs sont sélectionnables depuis le menu latéral
    // Format : { id, name, bodyColor, bodyColor2 (gradient), shimmer }
    colors: [
        { id: "rouge",   name: "Rouge",   body: "#dc2626", body2: "#b91c1c", shimmer: false, transparent: false },
        { id: "bleu",    name: "Bleu",    body: "#2563eb", body2: "#1d4ed8", shimmer: false, transparent: false },
        { id: "vert",    name: "Vert",    body: "#16a34a", body2: "#15803d", shimmer: false, transparent: false },
        { id: "violet",  name: "Violet",  body: "#7c3aed", body2: "#6d28d9", shimmer: false, transparent: false },
        { id: "rose",    name: "Rose",    body: "#ec4899", body2: "#db2777", shimmer: false, transparent: false },
        { id: "jaune",   name: "Jaune",   body: "#eab308", body2: "#ca8a04", shimmer: false, transparent: false },
        { id: "orange",  name: "Orange",  body: "#f97316", body2: "#ea580c", shimmer: false, transparent: false },
        { id: "blanc",   name: "Blanc",   body: "#e2e8f0", body2: "#cbd5e1", shimmer: false, transparent: false },
        { id: "noir",    name: "Noir",    body: "#1e1e1e", body2: "#111111", shimmer: false, transparent: false },
        { id: "pourpre", name: "Pourpre", body: "#9d174d", body2: "#831843", shimmer: false, transparent: false },
    ],

    // ─── Position de l'écran en mode paysage (mobile) ────────
    // Déplace le bloc écran (cadre + écran) verticalement en landscape
    // Valeur positive = vers le bas, négative = vers le haut (ex: "-10px", "20px")
    landscapeScreenOffsetY: "0px",

    // ─── Couleur par défaut au chargement ────────────────────
    defaultColor: "bleu",

};
