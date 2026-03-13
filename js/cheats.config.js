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
            code: "02ED8A35 994B4F87",
            note: "Met un objet à échanger dans le PC.",
        },
        {
            name: "Super Bonbon x99 - Plot Slot 1",
            code: "C12BBBE1 D1ED426C",
            note: "Met un objet à échanger dans le PC.",
        },
        {
            name: "Pokémon Sauvages Shiny",
            code: "E6CB7A29 8033F7D7\n18452A7D DDE55BCC",
            note: "Redémarre pour retirer le code.",
        },
        {
            name: "Rencontrer Mew",
            code: "1DEA3B67 6E985E0E\nB751BDF4 95CEF4CC",
        },
        {
            name: "Rencontrer Célébi",
            code: "1DEA3B67 6E985E0E\n4AEC27E8 A5FF1540",
        },
        {
            name: "Rencontrer Jirachi",
            code: "FDEADA14 17B8FD2F\nD2BF38B5 7E300C38\n1DEA3B67 6E985E0E\nFFF032FD FAF9AFD2",
        },
        {
            name: "Rencontrer Deoxys",
            code: "FDEADA14 17B8FD2F\nD2BF38B5 7E300C38\n1DEA3B67 6E985E0E\n27C35F73 A8E9E879",
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
            code: "9F0C50A8 DCCF880B",
            note: "Active le au lancement du jeu, permet d'accéder à Roc Nombri (Ho-Oh & Lugia).",
        },
        {
            name: "Ticketaurora - PC Slot 1",
            code: "C07596A3 FD8C4AEC",
            note: "Active le au lancement du jeu, permet d'accéder à l'île Aurore (Deoxys).",
        },
        {
            name: "Activation des îles Events",
            code: "07CF2578 E43B4EBF",
            note: "Puis direction le port de Carmin sur Mer.",
        },
    ],

    // ─── Pokémon Vert Feuille (GBA) ──────────────────────────
    pokemon_vf: [
        {
            name: "Masterball",
            code: "02ED8A35 994B4F87"
        },
        {
            name: "Bonbon",
            code: "C12BBBE1 D1ED426C"
        },
        {
            name: "Pokémon Shiny",
            code: "E6CB7A29 8033F7D7\n18452A7D DDE55BCC",
            note: "Active avant une rencontre pour obtenir un Pokémon Shiny."
        },
        {
            name: "Rencontrer Mew",
            code: "21CDC699 7EAB3C0D\nB751BDF4 95CEF4CC",
            note: "Déclenche une rencontre avec Mew dans les hautes herbes."
        },
        {
            name: "Rencontrer Célébice",
            code: "21CDC699 7EAB3C0D\n4AEC27E8 A5FF1540",
            note: "Déclenche une rencontre avec Célébice dans les hautes herbes."
        },
        {
            name: "Rencontrer Jirachi",
            code: "BB55B910 E2A8DC6D\nD2BF38B5 7E300C38\n21CDC699 7EAB3C0D\nFFF032FD FAF9AFD2",
            note: "Déclenche une rencontre avec Jirachi dans les hautes herbes."
        },
        {
            name: "Rencontrer Deoxys",
            code: "BB55B910 E2A8DC6D\nD2BF38B5 7E300C38\n21CDC699 7EAB3C0D\n27C35F73 A8E9E879",
            note: "Déclenche une rencontre avec Deoxys dans les hautes herbes."
        },
        {
            name: "Argent Infini",
            code: "29C78059 96542194"
        },
        {
            name: "Tous les badges",
            code: "EFCE867D 5403D40D"
        },
        {
            name: "Ticket Mystik (Ho-Oh & Lugia)",
            code: "9F0C50A8 DCCF880B",
            note: "Permet d'accéder aux îles de Ho-Oh et Lugia."
        },
        {
            name: "Ticket Aurora (Deoxys)",
            code: "C07596A3 FD8C4AEC",
            note: "Permet d'accéder à l'île de Deoxys."
        },
        {
            name: "Activation des îles",
            code: "07CF2578 E43B4EBF",
            note: "Débloque l'accès aux îles spéciales."
        },
    ],

    // ─── Pokémon Rubis (GBA) ─────────────────────────────────
    pokemon_rubis: [
        {
            name: "Masterball x99",
            code: "C674B60F B309F994"
        },
        {
            name: "Bonbon",
            code: "32A914E6 B46D0A8E"
        },
        {
            name: "Pokémon Shiny",
            code: "CD9A8B2C 402EA528"
        },
        {
            name: "Rencontrer Mew",
            code: "71E09BD1 17FDFD02",
            note: "Déclenche une rencontre avec Mew dans les hautes herbes."
        },
        {
            name: "Rencontrer Célébice",
            code: "A3AFC93B CAE30FEC",
            note: "Déclenche une rencontre avec Célébice dans les hautes herbes."
        },
        {
            name: "Rencontrer Deoxys (Route 101)",
            code: "27C35F73 A8E9E879",
            note: "Déclenche une rencontre avec Deoxys sur la Route 101."
        },
        {
            name: "Rencontrer Jirachi (Route 101)",
            code: "FFF032FD FAF9AFD2",
            note: "Déclenche une rencontre avec Jirachi sur la Route 101."
        },
        {
            name: "Argent Infini",
            code: "EF6BB9F3 A0BDF629"
        },
        {
            name: "Tous les badges",
            code: "BC33578D 82482A93"
        },
        {
            name: "Passe Éon — PC Slot 1 (Latias/Latios)",
            code: "E5FC3327 7766DEE9",
            note: "Dépose le Passe Éon dans le slot 1 de votre PC."
        },
        {
            name: "Activer le Passe Éon",
            code: "0332305F 41A5F851",
            note: "À activer avec le code Passe Éon pour accéder à Latias ou Latios."
        },
    ],

    // ─── Pokémon Saphir (GBA) ────────────────────────────────
    pokemon_saphir: [
        {
            name: "Masterball x99",
            code: "C674B60F B309F994"
        },
        {
            name: "Bonbon",
            code: "32A914E6 B46D0A8E"
        },
        {
            name: "Pokémon Shiny",
            code: "CD9A8B2C 402EA528"
        },
        {
            name: "Rencontrer Mew",
            code: "71E09BD1 17FDFD02",
            note: "Déclenche une rencontre avec Mew dans les hautes herbes."
        },
        {
            name: "Rencontrer Célébice",
            code: "A3AFC93B CAE30FEC",
            note: "Déclenche une rencontre avec Célébice dans les hautes herbes."
        },
        {
            name: "Rencontrer Jirachi (Route 101)",
            code: "FFF032FD FAF9AFD2",
            note: "Déclenche une rencontre avec Jirachi sur la Route 101."
        },
        {
            name: "Rencontrer Deoxys (Route 101)",
            code: "27C35F73 A8E9E879",
            note: "Déclenche une rencontre avec Deoxys sur la Route 101."
        },
        {
            name: "Argent Infini",
            code: "EF6BB9F3 A0BDF629"
        },
        {
            name: "Tous les badges",
            code: "BC33578D 82482A93"
        },
        {
            name: "Passe Éon — PC Slot 1 (Latias/Latios)",
            code: "E5FC3327 7766DEE9",
            note: "Dépose le Passe Éon dans le slot 1 de votre PC."
        },
        {
            name: "Activer le Passe Éon",
            code: "0332305F 41A5F851",
            note: "À activer avec le code Passe Éon pour accéder à Latias ou Latios."
        },
    ],

    // ─── Pokémon Émeraude (GBA) ──────────────────────────────
    pokemon_emeraude: [
        {
            name: "Anti-DMA (À activer en premier)",
            code: "EC207E60 766DBF73\n1C7B3231 B494738C",
            note: "Doit être activé AVANT tous les autres codes, sinon ils ne fonctionneront pas."
        },
        {
            name: "Masterball — PC Slot 1",
            code: "D935946C D758DF54",
            note: "Dépose une Masterball dans le slot 1 de votre PC."
        },
        {
            name: "Bonbon — PC Slot 1",
            code: "4B053F6A D785DEE2",
            note: "Dépose un Bonbon dans le slot 1 de votre PC."
        },
        {
            name: "Pokémon Shiny",
            code: "77BFC010 FE8DCA24\n093ECE84 CE99DAF5",
            note: "Active avant une rencontre pour obtenir un Pokémon Shiny."
        },
        {
            name: "Rencontrer Mew",
            code: "4448CD24 101661A6\nB751BDF4 95CEF4CC",
            note: "Déclenche une rencontre avec Mew. Activer l'Anti-DMA d'abord."
        },
        {
            name: "Rencontrer Célébice",
            code: "4448CD24 101661A6\n4AEC27E8 A5FF1540",
            note: "Déclenche une rencontre avec Célébice. Activer l'Anti-DMA d'abord."
        },
        {
            name: "Rencontrer Jirachi",
            code: "262511E7 A31EE06A\nD2BF38B5 7E300C38\nC5919E11 2AA62BDC\nFFF032FD FAF9AFD2",
            note: "Déclenche une rencontre avec Jirachi. Activer l'Anti-DMA d'abord."
        },
        {
            name: "Rencontrer Deoxys",
            code: "262511E7 A31EE06A\nD2BF38B5 7E300C38\nC5919E11 2AA62BDC\n27C35F73 A8E9E879",
            note: "Déclenche une rencontre avec Deoxys. Activer l'Anti-DMA d'abord."
        },
        {
            name: "Argent Infini",
            code: "C051CCF6 975E8DA1"
        },
        {
            name: "Passe Éon — PC Slot 1 (Latias & Latios)",
            code: "D4A41118 1703BBDD",
            note: "Dépose le Passe Éon dans le slot 1 de votre PC."
        },
        {
            name: "Vieillecarte (Mew) — PC Slot 1",
            code: "B44F17D0 B0A13201",
            note: "Dépose la Vieillecarte dans le slot 1 de votre PC."
        },
        {
            name: "Ticket Mystik (Ho-Oh & Lugia) — PC Slot 1",
            code: "FBC62957 45B46F37",
            note: "Dépose le Ticket Mystik dans le slot 1 de votre PC."
        },
        {
            name: "Ticket Aurora (Deoxys) — PC Slot 1",
            code: "35A8A0DA B41DB189",
            note: "Dépose le Ticket Aurora dans le slot 1 de votre PC."
        },
        {
            name: "Activer Île Mew & Deoxys (sans Symbole Bravoure)",
            code: "66170A7B BA1B4D7B",
            note: "Débloque les îles de Mew et Deoxys sans avoir le Symbole Bravoure."
        },
        {
            name: "Activer Île Mew & Deoxys (avec Symbole Bravoure)",
            code: "653C743B 4B626426",
            note: "Débloque les îles de Mew et Deoxys si vous avez le Symbole Bravoure."
        },
        {
            name: "Activer l'Île du Sud",
            code: "181690CB 4E53CB05",
            note: "Débloque l'accès à l'Île du Sud."
        },
        {
            name: "Activer le Roc Nombri",
            code: "E961B0C7 750B1250",
            note: "Débloque l'accès au Roc Nombri."
        },
    ],

    // ─── Pokémon Or (GBC) ────────────────────────────────────
    pokemon_or: [
        {
            name: "Rencontrer Mew",
            code: "0197EDD0",
            note: "Déclenche une rencontre avec Mew dans les hautes herbes."
        },
        {
            name: "Rencontrer Célébice",
            code: "01FBEDD0",
            note: "Déclenche une rencontre avec Célébice dans les hautes herbes."
        },
        {
            name: "Pokémon Shiny",
            code: "010719D1"
        },
        {
            name: "Argent Infini",
            code: "019973D5\n019974D5\n019975D5"
        },
        {
            name: "Masterball — Slot 1 (1er code)",
            code: "0101FCD5"
        },
        {
            name: "Masterball — Slot 1 (2ème code)",
            code: "0101FDD5",
            note: "Activer les deux codes Masterball ensemble."
        },
        {
            name: "Ball Max — Slot 1",
            code: "0163FED5"
        },
        {
            name: "Bonbon — Slot 1 (1er code)",
            code: "0120B7D5"
        },
        {
            name: "Bonbon — Slot 1 (2ème code)",
            code: "0120B8D5",
            note: "Activer les deux codes Bonbon ensemble."
        },
        {
            name: "Objet Infini — Slot 1",
            code: "0163B9D5"
        },
        {
            name: "Tous les badges Johto",
            code: "01FF7CD5"
        },
        {
            name: "Tous les badges Kanto",
            code: "01FF7DD5"
        },
    ],

    // ─── Pokémon Argent (GBC) ────────────────────────────────
    pokemon_argent: [
        {
            name: "Rencontrer Mew",
            code: "0197EDD0",
            note: "Déclenche une rencontre avec Mew dans les hautes herbes."
        },
        {
            name: "Rencontrer Célébice",
            code: "01FBEDD0",
            note: "Déclenche une rencontre avec Célébice dans les hautes herbes."
        },
        {
            name: "Pokémon Shiny",
            code: "010719D1"
        },
        {
            name: "Argent Infini",
            code: "019973D5\n019974D5\n019975D5"
        },
        {
            name: "Masterball — Slot 1 (1er code)",
            code: "0101FCD5"
        },
        {
            name: "Masterball — Slot 1 (2ème code)",
            code: "0101FDD5",
            note: "Activer les deux codes Masterball ensemble."
        },
        {
            name: "Ball Max — Slot 1",
            code: "0163FED5"
        },
        {
            name: "Bonbon — Slot 1 (1er code)",
            code: "0120B7D5"
        },
        {
            name: "Bonbon — Slot 1 (2ème code)",
            code: "0120B8D5",
            note: "Activer les deux codes Bonbon ensemble."
        },
        {
            name: "Objet Infini — Slot 1",
            code: "0163B9D5"
        },
        {
            name: "Tous les badges Johto",
            code: "01FF7CD5"
        },
        {
            name: "Tous les badges Kanto",
            code: "01FF7DD5"
        },
    ],

    // ─── Pokémon Cristal (GBC) ───────────────────────────────
    pokemon_cristal: [
        {
            name: "Rencontrer Mew",
            code: "919704D2",
            note: "Déclenche une rencontre avec Mew dans les hautes herbes."
        },
        {
            name: "Rencontrer Célébice",
            code: "91FB04D2",
            note: "Déclenche une rencontre avec Célébice dans les hautes herbes."
        },
        {
            name: "Pokémon Shiny",
            code: "910730D2"
        },
        {
            name: "Masterball — Slot 1 (1er code)",
            code: "9101D7D8"
        },
        {
            name: "Masterball — Slot 1 (2ème code)",
            code: "9101D8D8",
            note: "Activer les deux codes Masterball ensemble."
        },
        {
            name: "Ball Max — Slot 1",
            code: "9163D9D8"
        },
        {
            name: "Bonbon — Slot 1 (1er code)",
            code: "912092D8"
        },
        {
            name: "Bonbon — Slot 1 (2ème code)",
            code: "912093D8",
            note: "Activer les deux codes Bonbon ensemble."
        },
        {
            name: "Objet Infini — Slot 1",
            code: "016394D8"
        },
        {
            name: "Tous les badges Johto",
            code: "01FF57D8"
        },
        {
            name: "Tous les badges Kanto",
            code: "01FF58D8"
        },
        {
            name: "Argent Infini",
            code: "010F4ED8\n01424FD8\n013F50D8"
        },
    ],

    // ─── Pokémon Rouge (GB) ──────────────────────────────────
    pokemon_rouge: [
        {
            name: "Acheter Masterball",
            code: "010181CF"
        },
        {
            name: "Acheter Bonbon",
            code: "012881CF"
        },
        {
            name: "Argent Infini",
            code: "01994CD3"
        },
        {
            name: "Rencontrer Mew",
            code: "0115DDCF",
            note: "Déclenche une rencontre avec Mew dans les hautes herbes."
        },
        {
            name: "Tous les badges",
            code: "01FF5BD3"
        },
        {
            name: "Traverser les murs",
            code: "010A19D7",
            note: "Permet de marcher à travers les obstacles. Désactiver dans les bâtiments."
        },
    ],

    // ─── Pokémon Bleu (GB) ───────────────────────────────────
    pokemon_bleu: [
        {
            name: "Acheter Masterball",
            code: "010181CF"
        },
        {
            name: "Acheter Bonbon",
            code: "012881CF"
        },
        {
            name: "Argent Infini",
            code: "01994CD3"
        },
        {
            name: "Rencontrer Mew",
            code: "0115DDCF",
            note: "Déclenche une rencontre avec Mew dans les hautes herbes."
        },
        {
            name: "Tous les badges",
            code: "01FF5BD3"
        },
        {
            name: "Traverser les murs",
            code: "010A19D7",
            note: "Permet de marcher à travers les obstacles. Désactiver dans les bâtiments."
        },
    ],

    // ─── Pokémon Vert (GB) ───────────────────────────────────
    pokemon_vert: [
        {
            name: "Acheter Masterball",
            code: "010181CF"
        },
        {
            name: "Acheter Bonbon",
            code: "012881CF"
        },
        {
            name: "Argent Infini",
            code: "01994CD3"
        },
        {
            name: "Rencontrer Mew",
            code: "0115DDCF",
            note: "Déclenche une rencontre avec Mew dans les hautes herbes."
        },
        {
            name: "Tous les badges",
            code: "01FF5BD3"
        },
        {
            name: "Traverser les murs",
            code: "010A19D7",
            note: "Permet de marcher à travers les obstacles. Désactiver dans les bâtiments."
        },
    ],

    // ─── Pokémon Jaune (GB) ──────────────────────────────────
    pokemon_jaune: [
        {
            name: "Acheter Masterball",
            code: "010181CF"
        },
        {
            name: "Acheter Bonbon",
            code: "012881CF"
        },
        {
            name: "Argent Infini",
            code: "01994CD3"
        },
        {
            name: "Rencontrer Mew",
            code: "0115DDCF",
            note: "Déclenche une rencontre avec Mew dans les hautes herbes."
        },
        {
            name: "Tous les badges",
            code: "01FF5BD3"
        },
        {
            name: "Traverser les murs",
            code: "010A19D7",
            note: "Permet de marcher à travers les obstacles. Désactiver dans les bâtiments."
        },
    ],

};
