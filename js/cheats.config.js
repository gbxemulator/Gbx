/**
 * ============================================================
 *  GBX v1 — Configuration des codes de triche
 * ============================================================
 *  Fichier dédié aux codes Action Replay / GameShark.
 *
 *  STRUCTURE :
 *  GBX_CHEATS = {
 *      "game_id": [
 *          { name: "Nom affiché", code: "XXXXXXXX YYYYYYYY\nZZZZZZZZ WWWWWWWW" },
 *          ...
 *      ],
 *      ...
 *  }
 *
 *  RÈGLES :
 *  - L'id du jeu doit correspondre exactement à celui dans games.config.js
 *  - Un code sur plusieurs lignes → sépare les lignes avec \n
 *  - Plusieurs codes qui fonctionnent ensemble → un seul objet, toutes les
 *    lignes dans "code" séparées par \n
 *  - Les codes "Master" ou "must be on" doivent être en premier
 *
 *  SOURCES RECOMMANDÉES pour trouver des codes vérifiés :
 *  - https://gamehacking.org
 *  - https://gamefaqs.gamespot.com (onglet "Cheats")
 *  - https://www.codejunkies.com
 * ============================================================
 */

const GBX_CHEATS = {

    // ─── Pokémon Rouge Feu (GBA) ─────────────────────────────
    // Source : brandon-kun (forum GBX — à vérifier)
    pokemon_rf: [
        {
            name: "Code Master (activer en premier)",
            code: "D8BAE4D9 4864DCE5\nA86CDBA5 19BA49B3"
        },
        {
            name: "99x Super Bonbon",
            code: "9F9F78D1 2353E624\n828EDE7F CAF50CD3\n3AC07795 7BA250E5\nCBAC8999 25557DC9"
        },
        {
            name: "Rencontrer Mewtwo",
            code: "B6C5368A 08BE8FF4\n9A01F880 D1946F28"
        },
        // ── Ajoute tes codes ici ──
        // { name: "...", code: "..." },
    ],

    // ─── Pokémon Vert Feuille (GBA) ──────────────────────────
    pokemon_vf: [
        // ── Ajoute tes codes ici ──
        // { name: "...", code: "..." },
    ],

    // ─── Pokémon Rubis (GBA) ─────────────────────────────────
    pokemon_rubis: [
        // ── Ajoute tes codes ici ──
    ],

    // ─── Pokémon Saphir (GBA) ────────────────────────────────
    pokemon_saphir: [
        // ── Ajoute tes codes ici ──
    ],

    // ─── Pokémon Émeraude (GBA) ──────────────────────────────
    pokemon_emeraude: [
        // ── Ajoute tes codes ici ──
    ],

    // ─── Pokémon Or (GBC) ────────────────────────────────────
    pokemon_or: [
        // ── Ajoute tes codes ici ──
    ],

    // ─── Pokémon Argent (GBC) ────────────────────────────────
    pokemon_argent: [
        // ── Ajoute tes codes ici ──
    ],

    // ─── Pokémon Cristal (GBC) ───────────────────────────────
    pokemon_cristal: [
        // ── Ajoute tes codes ici ──
    ],

    // ─── Pokémon Rouge (GB) ──────────────────────────────────
    pokemon_rouge: [
        {
            name: "Masterball",
            code: "010181CF"
        },
    ],

    // ─── Pokémon Bleu (GB) ───────────────────────────────────
    pokemon_bleu: [
        // ── Ajoute tes codes ici ──
    ],

    // ─── Pokémon Vert (GB) ───────────────────────────────────
    pokemon_vert: [
        // ── Ajoute tes codes ici ──
    ],

    // ─── Pokémon Jaune (GB) ──────────────────────────────────
    pokemon_jaune: [
        // ── Ajoute tes codes ici ──
    ],

};
