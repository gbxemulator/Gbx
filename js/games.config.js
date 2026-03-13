/**
 * ============================================================
 *  GBX v1 — Configuration des jeux
 * ============================================================
 *  Modifiez ce fichier pour ajouter, supprimer ou réordonner
 *  les jeux dans le menu déroulant de la Gameboy.
 *
 *  Champs disponibles :
 *  - id        : Identifiant unique du jeu (sans espaces)
 *  - name      : Nom affiché dans le menu déroulant
 *  - file      : URL de la ROM (Internet Archive)
 *  - type      : "gb" | "gbc" | "gba"
 *  - priority  : Ordre d'affichage (1 = premier, plus c'est grand = plus c'est bas)
 *  - saveName  : Nom EXACT que doit avoir le fichier .sav de l'utilisateur
 *                (le site refusera tout autre nom)
 *  - cover     : (optionnel) Chemin vers une image de couverture
 * ============================================================
 */

const GBX_GAMES = [

    // ─── Game Boy Advance (.gba) ─────────────────────────────
    {
        id: "pokemon_rf",
        name: "Pokémon Rouge Feu",
        file: "https://archive.org/download/pokemon-gbx-1/Pokemon_Gbx_1.zip/pokemon_rouge_feu.gba",
        type: "gba",
        priority: 1,
        saveName: "pokemon_rf.sav",
        cover: ""
    },
    {
        id: "pokemon_vf",
        name: "Pokémon Vert Feuille",
        file: "https://archive.org/download/pokemon-gbx-1/Pokemon_Gbx_1.zip/pokemon_vert_feuille.gba",
        type: "gba",
        priority: 2,
        saveName: "pokemon_vf.sav",
        cover: ""
    },
    {
        id: "pokemon_rubis",
        name: "Pokémon Rubis",
        file: "https://archive.org/download/pokemon-gbx-2/Pokemon_Gbx_2.zip/pokemon_rubis.gba",
        type: "gba",
        priority: 3,
        saveName: "pokemon_rubis.sav",
        cover: ""
    },
    {
        id: "pokemon_saphir",
        name: "Pokémon Saphir",
        file: "https://archive.org/download/pokemon-gbx-3/Pokemon_Gbx_3.zip/pokemon_saphir.gba",
        type: "gba",
        priority: 4,
        saveName: "pokemon_saphir.sav",
        cover: ""
    },
    {
        id: "pokemon_emeraude",
        name: "Pokémon Émeraude",
        file: "https://archive.org/download/pokemon-gbx-3/Pokemon_Gbx_3.zip/pokemon_emeraude.gba",
        type: "gba",
        priority: 5,
        saveName: "pokemon_emeraude.sav",
        cover: ""
    },
    {
        id: "urbz",
        name: "Les Urbz",
        file: "https://archive.org/download/mei_20260309/Mei.zip/urbz.gba",
        type: "gba",
        priority: 6,
        saveName: "urbz.sav",
        cover: ""
    },
	{
        id: "sims_permis_sortir",
        name: "Les Sims : Permis de sortir",
        file: "https://archive.org/download/mei_20260309/Mei.zip/sims_permis_sortir.gba",
        type: "gba",
        priority: 7,
        saveName: "sims_permis_sortir.sav",
        cover: ""
    },
	{
        id: "wario_land_4",
        name: "Wario Land 4",
        file: "https://archive.org/download/wario-land-4_20260311/Wario_Land_4.zip/Wario_Land_4.gba",
        type: "gba",
        priority: 8,
        saveName: "wario_land_4.sav",
        cover: ""
    },

    // ─── Game Boy Color (.gbc) ───────────────────────────────
    {
        id: "pokemon_or",
        name: "Pokémon Or",
        file: "https://archive.org/download/pokemon-gbx-2/Pokemon_Gbx_2.zip/pokemon_or.gbc",
        type: "gbc",
        priority: 10,
        saveName: "pokemon_or.sav",
        cover: ""
    },
    {
        id: "pokemon_argent",
        name: "Pokémon Argent",
        file: "https://archive.org/download/pokemon-gbx-2/Pokemon_Gbx_2.zip/pokemon_argent.gbc",
        type: "gbc",
        priority: 11,
        saveName: "pokemon_argent.sav",
        cover: ""
    },
    {
        id: "pokemon_cristal",
        name: "Pokémon Cristal",
        file: "https://archive.org/download/pokemon-gbx-2/Pokemon_Gbx_2.zip/pokemon_cristal.gbc",
        type: "gbc",
        priority: 12,
        saveName: "pokemon_cristal.sav",
        cover: ""
    },

    // ─── Game Boy Classic (.gb) ──────────────────────────────
    {
        id: "pokemon_rouge",
        name: "Pokémon Rouge",
        file: "https://archive.org/download/pokemon-gbx-1/Pokemon_Gbx_1.zip/pokemon_rouge.gb",
        type: "gb",
        priority: 20,
        saveName: "pokemon_rouge.sav",
        cover: ""
    },
    {
        id: "pokemon_bleu",
        name: "Pokémon Bleu",
        file: "https://archive.org/download/pokemon-gbx-1/Pokemon_Gbx_1.zip/pokemon_bleu.gb",
        type: "gb",
        priority: 21,
        saveName: "pokemon_bleu.sav",
        cover: ""
    },
    {
        id: "pokemon_vert",
        name: "Pokémon Vert",
        file: "https://archive.org/download/pokemon-vert/Pokemon_vert.zip/Pokemon_vert.gb",
        type: "gb",
        priority: 22,
        saveName: "pokemon_vert.sav",
        cover: ""
    },
    {
        id: "pokemon_jaune",
        name: "Pokémon Jaune",
        file: "https://archive.org/download/pokemon-gbx-1/Pokemon_Gbx_1.zip/pokemon_jaune.gb",
        type: "gb",
        priority: 23,
        saveName: "pokemon_jaune.sav",
        cover: ""
    },

];

// ─── Tri automatique par priorité ────────────────────────────
GBX_GAMES.sort((a, b) => a.priority - b.priority);
