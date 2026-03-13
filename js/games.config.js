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
        id: "pokemon_donjon_rouge",
        name: "Pokémon Donjon : Équipe Rouge",
        file: "https://archive.org/download/gbx-emulator-plus/GBX_Emulator_Plus.rar/Pokemon_donjon_rouge.gba",
        type: "gba",
        priority: 6,
        saveName: "Pokemon_donjon_rouge.sav",
        cover: ""
    },
    {
        id: "pokemon_pinball_2",
        name: "Pokémon Pinball : Rubis & Saphir
        file: "https://archive.org/download/gbx-emulator-plus/GBX_Emulator_Plus.rar/Pokemon_pinball_2.gba",
        type: "gba",
        priority: 7,
        saveName: "Pokemon_pinball_2.sav",
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
    {
        id: "urbz",
        name: "Les Urbz",
        file: "https://archive.org/download/mei_20260309/Mei.zip/urbz.gba",
        type: "gba",
        priority: 9,
        saveName: "urbz.sav",
        cover: ""
    },
	{
        id: "sims2",
        name: "Les Sims 2",
        file: "https://archive.org/download/gbx-emulator-plus/GBX_Emulator_Plus.rar/sims2.gba",
        type: "gba",
        priority: 10,
        saveName: "sims2.sav",
        cover: ""
    },
	{
        id: "sims_permis_sortir",
        name: "Les Sims : Permis de sortir",
        file: "https://archive.org/download/mei_20260309/Mei.zip/sims_permis_sortir.gba",
        type: "gba",
        priority: 11,
        saveName: "sims_permis_sortir.sav",
        cover: ""
    },
	{
        id: "golden_sun",
        name: "Golden Sun",
        file: "https://archive.org/download/golden-sun_202603/Golden_Sun.rar/golden_sun.gba",
        type: "gba",
        priority: 12,
        saveName: "golden_sun.sav",
        cover: ""
    },
	{
        id: "golden_sun2",
        name: "Golden Sun",
        file: "https://archive.org/download/golden-sun_202603/Golden_Sun.rar/golden_sun2.gba",
        type: "gba",
        priority: 13,
        saveName: "golden_sun2.sav",
        cover: ""
    },
	{
        id: "super_mario_advance",
        name: "Super Mario Advance",
        file: "https://archive.org/download/gbx-emulator-plus/GBX_Emulator_Plus.rar/Super_mario_advance.gba",
        type: "gba",
        priority: 14,
        saveName: "Super_mario_advance.sav",
        cover: ""
    },
	{
        id: "super_mario_advance2",
        name: "Super Mario Advance 2",
        file: "https://archive.org/download/gbx-emulator-plus/GBX_Emulator_Plus.rar/Super_mario_advance2.gba",
        type: "gba",
        priority: 15,
        saveName: "Super_mario_advance2.sav",
        cover: ""
    },
	{
        id: "yoshi_island",
        name: "Yoshi's Island (Super Mario 3)",
        file: "https://archive.org/download/gbx-emulator-plus/GBX_Emulator_Plus.rar/yoshi_island.gba",
        type: "gba",
        priority: 16,
        saveName: "yoshi_island.sav",
        cover: ""
    },
	{
        id: "super_mario_advance4",
        name: "Super Mario Advance 4",
        file: "https://archive.org/download/gbx-emulator-plus/GBX_Emulator_Plus.rar/Super_mario_advance4.gba",
        type: "gba",
        priority: 17,
        saveName: "Super_mario_advance4.sav",
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
    {
        id: "pokemon_pinball",
        name: "Pokémon Pinball",
        file: "https://archive.org/download/gbx-emulator-plus/GBX_Emulator_Plus.rar/Pokemon_pinball.gbc",
        type: "gbc",
        priority: 13,
        saveName: "Pokemon_pinball.sav",
        cover: ""
    },
    {
        id: "pokemon_tcg2",
        name: "Pokémon Trading Card Game 2 (US)",
        file: "https://archive.org/download/gbx-emulator-plus/GBX_Emulator_Plus.rar/Pokemon_tcg2.gbc",
        type: "gbc",
        priority: 14,
        saveName: "Pokemon_tcg2.sav",
        cover: ""
    },
    {
        id: "pokemon_puzzle_chl",
        name: "Pokémon Puzzle Challenge",
        file: "https://archive.org/download/gbx-emulator-plus/GBX_Emulator_Plus.rar/Pokemon_puzzle_chl.gbc",
        type: "gbc",
        priority: 15,
        saveName: "Pokemon_puzzle_chl.sav",
        cover: ""
    },
    {
        id: "zelda_awakening_dx",
        name: "Zelda : Link's Awakening DX",
        file: "https://archive.org/download/gbx-emulator-plus/GBX_Emulator_Plus.rar/zelda_awakening_dx.gbc",
        type: "gbc",
        priority: 16,
        saveName: "zelda_awakening_dx.sav",
        cover: ""
    },
    {
        id: "zelda_oracle_ages",
        name: "Zelda : Oracle of Ages",
        file: "https://archive.org/download/gbx-emulator-plus/GBX_Emulator_Plus.rar/zelda_oracle_ages.gbc",
        type: "gbc",
        priority: 17,
        saveName: "zelda_oracle_ages.sav",
        cover: ""
    },
    {
        id: "zelda_oracle_seasons",
        name: "Zelda : Oracle of Seasons",
        file: "https://archive.org/download/gbx-emulator-plus/GBX_Emulator_Plus.rar/zelda_oracle_seasons.gbc",
        type: "gbc",
        priority: 18,
        saveName: "zelda_oracle_seasons.sav",
        cover: ""
    },
    {
        id: "wario_land_3",
        name: "Wario Land 3",
        file: "https://archive.org/download/gbx-emulator-plus/GBX_Emulator_Plus.rar/wario_land_3.gbc",
        type: "gbc",
        priority: 19,
        saveName: "wario_land_3.sav",
        cover: ""
    },
    {
        id: "super_mario_deluxe",
        name: "Super Mario Bros. Deluxe",
        file: "https://archive.org/download/gbx-emulator-plus/GBX_Emulator_Plus.rar/super_mario_deluxe.gbc",
        type: "gbc",
        priority: 20,
        saveName: "super_mario_deluxe.sav",
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
    {
        id: "pokemon_tcg",
        name: "Pokémon Trading Card Game",
        file: "https://archive.org/download/gbx-emulator-plus/GBX_Emulator_Plus.rar/Pokemon_tcg.gb",
        type: "gb",
        priority: 24,
        saveName: "pokemon_tcg.sav",
        cover: ""
    },
    {
        id: "zelda_awakening",
        name: "Zelda : Link's Awakening",
        file: "https://archive.org/download/gbx-emulator-plus/GBX_Emulator_Plus.rar/zelda_awakening.gb",
        type: "gb",
        priority: 25,
        saveName: "zelda_awakening.sav",
        cover: ""
    },
    {
        id: "wario_land",
        name: "Wario Land",
        file: "https://archive.org/download/gbx-emulator-plus/GBX_Emulator_Plus.rar/wario_land.gb",
        type: "gb",
        priority: 26,
        saveName: "wario_land.sav",
        cover: ""
    },
    {
        id: "wario_land_2",
        name: "Wario Land 2",
        file: "https://archive.org/download/gbx-emulator-plus/GBX_Emulator_Plus.rar/wario_land_2.gb",
        type: "gb",
        priority: 27,
        saveName: "wario_land_2.sav",
        cover: ""
    },
    {
        id: "super_mario_land",
        name: "Super Mario Land",
        file: "https://archive.org/download/gbx-emulator-plus/GBX_Emulator_Plus.rar/super_mario_land.gb",
        type: "gb",
        priority: 28,
        saveName: "super_mario_land.sav",
        cover: ""
    },
    {
        id: "super_mario_land2",
        name: "Super Mario Land 2",
        file: "https://archive.org/download/gbx-emulator-plus/GBX_Emulator_Plus.rar/super_mario_land2.gb",
        type: "gb",
        priority: 29,
        saveName: "super_mario_land2.sav",
        cover: ""
    },

];

// ─── Tri automatique par priorité ────────────────────────────
GBX_GAMES.sort((a, b) => a.priority - b.priority);
