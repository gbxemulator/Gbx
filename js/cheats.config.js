/**
 * ============================================================
 *  GBX v1 — Configuration des codes de triche
 * ============================================================
 *  Fichier dédié aux codes Action Replay / GameShark.
 *
 *  STRUCTURE :
 *  GBX_CHEATS = {
 *      "game_id": [
 *          { name: "Nom affiché", code: "XXXXXXXX YYYYYYYY\nZZZZZZZZ WWWWWWWW", note: "Message optionnel" },
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
 *  - Le champ "note" est OPTIONNEL — si absent, rien ne s'affiche
 *
 *  SOURCES RECOMMANDÉES pour trouver des codes vérifiés :
 *  - https://gamehacking.org
 *  - https://gamefaqs.gamespot.com (onglet "Cheats")
 *  - https://www.codejunkies.com
 * ============================================================
 */

const GBX_CHEATS = {

    // ─── Pokémon Rouge Feu (GBA) ─────────────────────────────
    pokemon_rf: [
        {
            name: "Masterball x99 - PC Slot 1",
            code: "5E0EC136 8674EBD2 78DA95DF 44018CB4 02ED8A35 994B4F87",
            note: "Mets un objet à échanger dans le PC.",
        },
        {
            name: "Super Bonbon x99 - Plot Slot 1",
            code: "5E0EC136 8674EBD2 78DA95DF 44018CB4 C12BBBE1 D1ED426C",
            note: "Mets un objet à échanger dans le PC.",
        },
        {
            name: "Pokémon Sauvages Shiny",
            code: "E6CB7A29 8033F7D7 18452A7D DDE55BCC",
            note: "Redémarre pour retirer le code.",
        },
        {
            name: "Rencontrer Mew",
            code: "1DEA3B67 6E985E0E B751BDF4 95CEF4CC",
            note: "Redémarre pour retirer le code.",
        },
        {
            name: "Rencontrer Célébi",
            code: "1DEA3B67 6E985E0E 4AEC27E8 A5FF1540",
            note: "Redémarre pour retirer le code.",
        },
        {
            name: "Rencontrer Jirachi",
            code: "FDEADA14 17B8FD2F D2BF38B5 7E300C38 1DEA3B67 6E985E0E FFF032FD FAF9AFD2",
            note: "Redémarre pour retirer le code.",
        },
        {
            name: "Rencontrer Deoxys",
            code: "FDEADA14 17B8FD2F D2BF38B5 7E300C38 1DEA3B67 6E985E0E 27C35F73 A8E9E879",
            note: "Redémarre pour retirer le code.",
        },
        {
            name: "Argent Infini",
            code: "29C78059 96542194",
            note: "Ouvre 2x de suite la carte dresseur",
        },
        {
            name: "Tous les badges",
            code: "EFCE867D 5403D40D",
            note: "Ouvre 2x de suite la carte dresseur",
        },
        {
            name: "Ticketmystik - PC Slot 1",
            code: "5E0EC136 8674EBD2 78DA95DF 44018CB4 9F0C50A8 DCCF880B",
            note: "Permet d'accéder à Roc Nombri (Ho-Oh & Lugia).",
        },
        {
            name: "Ticketaurora - PC Slot 1",
            code: "5E0EC136 8674EBD2 78DA95DF 44018CB4 C07596A3 FD8C4AEC",
            note: "Permet d'accéder à l'île Aurore (Deoxys).",
        },
        {
            name: "Activer Roc Nombri & l'île Aurore",
            code: "5E0EC136 8674EBD2 78DA95DF 44018CB4 07CF2578 E43B4EBF",
            note: "Puis direction le port de Carmin sur Mer.",
        },
    ],

    // ─── Pokémon Vert Feuille (GBA) ──────────────────────────
    pokemon_vf: [
        {
            name: "Masterball x99 - PC Slot 1",
            code: "A3C83A98 A166180D 1C7B3231 B494738C 02ED8A35 994B4F87",
            note: "Mets un objet à échanger dans le PC.",
        },
        {
            name: "Super Bonbon x99 - Plot Slot 1",
            code: "A3C83A98 A166180D 1C7B3231 B494738C C12BBBE1 D1ED426C",
            note: "Mets un objet à échanger dans le PC.",
        },
        {
            name: "Pokémon Sauvages Shiny",
            code: "E6CB7A29 8033F7D7 18452A7D DDE55BCC",
            note: "Redémarre pour retirer le code.",
        },
        {
            name: "Rencontrer Mew",
            code: "1DEA3B67 6E985E0E B751BDF4 95CEF4CC",
            note: "Redémarre pour retirer le code.",
        },
        {
            name: "Rencontrer Célébi",
            code: "1DEA3B67 6E985E0E 4AEC27E8 A5FF1540",
            note: "Redémarre pour retirer le code.",
        },
        {
            name: "Rencontrer Jirachi",
            code: "FDEADA14 17B8FD2F D2BF38B5 7E300C38 1DEA3B67 6E985E0E FFF032FD FAF9AFD2",
            note: "Redémarre pour retirer le code.",
        },
        {
            name: "Rencontrer Deoxys",
            code: "FDEADA14 17B8FD2F D2BF38B5 7E300C38 1DEA3B67 6E985E0E 27C35F73 A8E9E879",
            note: "Redémarre pour retirer le code.",
        },
        {
            name: "Argent Infini",
            code: "29C78059 96542194",
            note: "Ouvre 2x de suite la carte dresseur",
        },
        {
            name: "Tous les badges",
            code: "EFCE867D 5403D40D",
            note: "Ouvre 2x de suite la carte dresseur",
        },
        {
            name: "Ticketmystik - PC Slot 1",
            code: "A3C83A98 A166180D 1C7B3231 B494738C 9F0C50A8 DCCF880B",
            note: "Permet d'accéder à Roc Nombri (Ho-Oh & Lugia).",
        },
        {
            name: "Ticketaurora - PC Slot 1",
            code: "A3C83A98 A166180D 1C7B3231 B494738C C07596A3 FD8C4AEC",
            note: "Permet d'accéder à l'île Aurore (Deoxys).",
        },
        {
            name: "Activer Roc Nombri & l'île Aurore",
            code: "A3C83A98 A166180D 1C7B3231 B494738C 07CF2578 E43B4EBF",
            note: "Puis direction le port de Carmin sur Mer.",
        },
    ],

    // ─── Pokémon Rubis (GBA) ─────────────────────────────────
    pokemon_rubis: [
        {
            name: "Masterball x99 - Sac Slot 1",
            code: "C674B60F B309F994",
        },
        {
            name: "Super Bonbon x99 - Sac Slot 1",
            code: "32A914E6 B46D0A8E",
        },
        {
            name: "Argent Infini",
            code: "EF6BB9F3 A0BDF629",
        },
        {
            name: "Tous les badges",
            code: "BC33578D 82482A93",
        },
        {
            name: "Passe Éon - PC Slot 1",
            code: "E5FC3327 7766DEE9",
            note: "Permet d'accéder à l'île du Sud (Latias & Latios).",
        },
        {
            name: "Activer l'île du Sud",
            code: "0332305F 41A5F851",
            note: "Puis direction le port de Nénucrique.",
        },
    ],

    // ─── Pokémon Saphir (GBA) ────────────────────────────────
    pokemon_saphir: [
        {
            name: "Masterball x99 - Sac Slot 1",
            code: "C674B60F B309F994",
        },
        {
            name: "Super Bonbon x99 - Sac Slot 1",
            code: "32A914E6 B46D0A8E",
        },
        {
            name: "Argent Infini",
            code: "EF6BB9F3 A0BDF629",
        },
        {
            name: "Tous les badges",
            code: "BC33578D 82482A93",
        },
        {
            name: "Passe Éon - PC Slot 1",
            code: "E5FC3327 7766DEE9",
            note: "Permet d'accéder à l'île du Sud (Latias & Latios).",
        },
        {
            name: "Activer l'île du Sud",
            code: "0332305F 41A5F851",
            note: "Puis direction le port de Nénucrique.",
        },
    ],

    // ─── Pokémon Émeraude (GBA) ──────────────────────────────
    pokemon_emeraude: [
        {
            name: "Masterball Illimitée - PC Slot 1",
            code: "128898B6 EDA43037",
            note: "Dépose x0 Masterball, mais tu peux en retirer autant que tu veux.",
        },
        {
            name: "Super Bonbon Illimité - PC Slot 1",
            code: "BFF956FA 2F9EC50D",
            note: "Dépose x0 Super Bonbon, mais tu peux en retirer autant que tu veux.",
        },
        {
            name: "Pokémon Sauvages Shiny",
            code: "A2A4317B 9817FF81 093ECE84 CE99DAF5 9045E027 05EA1143 A6A74710 82BD7E29",
            note: "Redémarre pour retirer le code.",
        },
        {
            name: "Rencontrer Mew",
            code: "4448CD24 101661A6\nB751BDF4 95CEF4CC",
            note: "Redémarre pour retirer le code.",
        },
        {
            name: "Rencontrer Célébi",
            code: "4448CD24 101661A6\n4AEC27E8 A5FF1540",
            note: "Redémarre pour retirer le code.",
        },
        {
            name: "Rencontrer Jirachi",
            code: "262511E7 A31EE06A\nD2BF38B5 7E300C38\nC5919E11 2AA62BDC\nFFF032FD FAF9AFD2",
            note: "Redémarre pour retirer le code.",
        },
        {
            name: "Rencontrer Deoxys",
            code: "262511E7 A31EE06A\nD2BF38B5 7E300C38\nC5919E11 2AA62BDC\n27C35F73 A8E9E879",
            note: "Redémarre pour retirer le code.",
        },
        {
            name: "Passe Éon - PC Slot 1",
            code: "0A6626D3 648DA17A",
            note: "Permet d'accéder à l'île du Sud (Latias & Latios).",
        },
        {
            name: "Vieillecarte - PC Slot 1",
            code: "5B1CB4D7 10FA9D05",
            note: "Permet d'accéder à l'île Lointaine (Mew).",
        },
        {
            name: "Ticketmystik - PC Slot 1",
            code: "FBC62957 45B46F37",
            note: "Permet d'accéder à Roc Nombri (Ho-Oh & Lugia).",
        },
        {
            name: "Ticketaurora - PC Slot 1",
            code: "486511F5 E6C8E537",
            note: "Permet d'accéder à l'île Aurore (Deoxys).",
        },
        {
            name: "Activer l'Île Lointaine & Aurore",
            code: "66170A7B BA1B4D7B",
            note: "Puis direction le port de Nénucrique.",
        },
        {
            name: "Activer l'Île Lointaine & Aurore (Autre ..)",
            code: "653C743B 4B626426",
            note: "Si t'as le symbole Bravoure (vaincre la Pyramide de Combat) alors tu dois activer celui-ci.",
        },
        {
            name: "Activer l'Île du Sud",
            code: "181690CB 4E53CB05",
            note: "Puis direction le port de Nénucrique.",
        },
        {
            name: "Activer Roc Nombri",
            code: "E961B0C7 750B1250",
            note: "Puis direction le port de Nénucrique.",
        },
    ],

    // ─── Pokémon Or (GBC) ────────────────────────────────────
    pokemon_or: [
        {
            name: "Masterball - Slot 1 Sac",
            code: "0101FDD5",
			note: "Par contre il laisse des traces ..",
        },
        {
            name: "Super Bonbon - Slot 1 Sac",
            code: "0120B7D5",
        },
        {
            name: "Objet Infini - Slot 1 Sac",
            code: "0163B9D5",
        },
        {
            name: "Pokémon Sauvages Shiny",
            code: "010719D1",
        },
        {
            name: "Rencontrer Mew",
            code: "0197EDD0",
        },
        {
            name: "Rencontrer Célébi",
            code: "01FBEDD0",
        },
        {
            name: "Argent Infini",
            code: "019973D5 019974D5 019975D5",
        },
        {
            name: "Tous les badges de Johto",
            code: "01FF7CD5",
        },
        {
            name: "Tous les badges de Kanto",
            code: "01FF7DD5",
        },
    ],

    // ─── Pokémon Argent (GBC) ────────────────────────────────
    pokemon_argent: [
        {
            name: "Masterball - Slot 1 Sac",
            code: "0101FDD5",
			note: "Par contre il laisse des traces ..",
        },
        {
            name: "Super Bonbon - Slot 1 Sac",
            code: "0120B7D5",
        },
        {
            name: "Objet Infini - Slot 1 Sac",
            code: "0163B9D5",
        },
        {
            name: "Pokémon Sauvages Shiny",
            code: "010719D1",
        },
        {
            name: "Rencontrer Mew",
            code: "0197EDD0",
        },
        {
            name: "Rencontrer Célébi",
            code: "01FBEDD0",
        },
        {
            name: "Argent Infini",
            code: "019973D5 019974D5 019975D5",
        },
        {
            name: "Tous les badges de Johto",
            code: "01FF7CD5",
        },
        {
            name: "Tous les badges de Kanto",
            code: "01FF7DD5",
        },
    ],

    // ─── Pokémon Cristal (GBC) ───────────────────────────────
    pokemon_cristal: [
	    {
            name: "Masterball x99 - Slot 1 Sac",
            code: "010193D8",
			note: "Elles apparaissent dans le slot objets, mets les dans le PC pour les récupérer dans le bon slot.",
        },
        {
            name: "Bonbon x99 - Slot 1 Sac",
            code: "012093D8",
        },
        {
            name: "Objet Infini - Slot 1 Sac",
            code: "016394D8",
        },
        {
            name: "Pokémon Sauvages Shiny",
            code: "010730D2",
        },
        {
            name: "Rencontrer Mew",
            code: "919704D2",
        },
        {
            name: "Rencontrer Célébi",
            code: "91FB04D2",
        },
        {
            name: "Argent Infini",
            code: "010F4ED8 01424FD8 013F50D8",
        },
        {
            name: "Tous les badges de Johto",
            code: "01FF57D8",
        },
        {
            name: "Tous les badges de Kanto",
            code: "01FF58D8",
        },
    ],

    // ─── Pokémon Rouge (GB) ──────────────────────────────────
    pokemon_rouge: [
        {
            name: "Masterball gratuite au shop !",
            code: "010181CF",
        },
        {
            name: "Super Bonbon au shop",
            code: "012881CF",
        },
        {
            name: "Argent Infini",
            code: "01994CD3",
        },
        {
            name: "Rencontrer Mew",
            code: "0115DDCF",
            note: "Peut faire freeze ou être un peu long à apparaitre.",
        },
        {
            name: "Tous les badges",
            code: "01FF5BD3",
        },
    ],

    // ─── Pokémon Bleu (GB) ───────────────────────────────────
    pokemon_bleu: [
        {
            name: "Masterball gratuite au shop !",
            code: "010181CF",
        },
        {
            name: "Super Bonbon au shop",
            code: "012881CF",
        },
        {
            name: "Argent Infini",
            code: "01994CD3",
        },
        {
            name: "Rencontrer Mew",
            code: "0115DDCF",
            note: "Peut faire freeze ou être un peu long à apparaitre.",
        },
        {
            name: "Tous les badges",
            code: "01FF5BD3",
        },
    ],

    // ─── Pokémon Vert (GB) ───────────────────────────────────
    pokemon_vert: [
        {
            name: "Masterball gratuite au shop !",
            code: "010181CF",
        },
        {
            name: "Super Bonbon au shop",
            code: "012881CF",
        },
        {
            name: "Argent Infini",
            code: "01994CD3",
        },
        {
            name: "Rencontrer Mew",
            code: "0115DDCF",
            note: "Peut faire freeze ou être un peu long à apparaitre.",
        },
        {
            name: "Tous les badges",
            code: "01FF5BD3",
        },
    ],

    // ─── Pokémon Jaune (GB) ──────────────────────────────────
    pokemon_jaune: [
        {
            name: "Masterball gratuite au shop !",
            code: "010181CF",
        },
        {
            name: "Super Bonbon au shop",
            code: "012881CF",
        },
        {
            name: "Argent Infini",
            code: "01994BD3 01994CD3 01994DD3",
        },
        {
            name: "Rencontrer Mew",
            code: "0115DCCF",
            note: "Peut faire freeze ou être un peu long à apparaitre.",
        },
        {
            name: "Tous les badges",
            code: "01FF5AD3",
        },
    ],

};
