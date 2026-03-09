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
 *  - file      : Chemin vers la ROM (relatif à la racine du site)
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
        id: "pokemon-fr",
        name: "Pokémon Rouge Feu",
        file: "roms/pokemon_rouge_feu.gba",
        type: "gba",
        priority: 1,
        saveName: "pokemon_rouge_feu.sav",
        cover: ""
    },
    {
        id: "pokemon-vf",
        name: "Pokémon Vert Feuille",
        file: "roms/pokemon_vert_feuille.gba",
        type: "gba",
        priority: 2,
        saveName: "pokemon_vert_feuille.sav",
        cover: ""
    },
    {
        id: "pokemon-rubis",
        name: "Pokémon Rubis",
        file: "roms/pokemon_rubis.gba",
        type: "gba",
        priority: 3,
        saveName: "pokemon_rubis.sav",
        cover: ""
    },
    {
        id: "pokemon-saphir",
        name: "Pokémon Saphir",
        file: "roms/pokemon_saphir.gba",
        type: "gba",
        priority: 4,
        saveName: "pokemon_saphir.sav",
        cover: ""
    },
    {
        id: "pokemon-emeraude",
        name: "Pokémon Émeraude",
        file: "roms/pokemon_emeraude.gba",
        type: "gba",
        priority: 5,
        saveName: "pokemon_emeraude.sav",
        cover: ""
    },
	    {
        id: "urbz",
        name: "Les Urbz",
        file: "roms/urbz.gba",
        type: "gba",
        priority: 6,
        saveName: "urbz.sav",
        cover: ""
    },
	    {
        id: "sims_permis_sortir",
        name: "Les Sims : Permis de sortir",
        file: "roms/sims_permis_sortir.gba",
        type: "gba",
        priority: 7,
        saveName: "sims_permis_sortir.sav",
        cover: ""
    },

    // ─── Game Boy Color (.gbc) ───────────────────────────────
    {
        id: "pokemon-or",
        name: "Pokémon Or",
        file: "roms/pokemon_or.gbc",
        type: "gbc",
        priority: 10,
        saveName: "pokemon_or.sav",
        cover: ""
    },
    {
        id: "pokemon-argent",
        name: "Pokémon Argent",
        file: "roms/pokemon_argent.gbc",
        type: "gbc",
        priority: 11,
        saveName: "pokemon_argent.sav",
        cover: ""
    },
    {
        id: "pokemon-cristal",
        name: "Pokémon Cristal",
        file: "roms/pokemon_cristal.gbc",
        type: "gbc",
        priority: 12,
        saveName: "pokemon_cristal.sav",
        cover: ""
    },

    // ─── Game Boy Classic (.gb) ──────────────────────────────
    {
        id: "pokemon-rouge",
        name: "Pokémon Rouge",
        file: "roms/pokemon_rouge.gb",
        type: "gb",
        priority: 20,
        saveName: "pokemon_rouge.sav",
        cover: ""
    },
    {
        id: "pokemon-bleu",
        name: "Pokémon Bleu",
        file: "roms/pokemon_bleu.gb",
        type: "gb",
        priority: 21,
        saveName: "pokemon_bleu.sav",
        cover: ""
    },
    {
        id: "pokemon-jaune",
        name: "Pokémon Jaune",
        file: "roms/pokemon_jaune.gb",
        type: "gb",
        priority: 22,
        saveName: "pokemon_jaune.sav",
        cover: ""
    },

];

// ─── Tri automatique par priorité ────────────────────────────
GBX_GAMES.sort((a, b) => a.priority - b.priority);
