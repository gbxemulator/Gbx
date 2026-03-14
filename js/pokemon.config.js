/**
 * ============================================================
 *  GBX v1 — Liste des jeux Pokémon (inscription + jeu favori)
 * ============================================================
 *  Modifiez ce tableau pour ajouter ou supprimer des jeux
 *  dans la question "Ton jeu Pokémon préféré" du formulaire
 *  d'inscription. L'ordre d'affichage respecte l'ordre du tableau.
 *
 * ──────────────────────────────────────────────────────────────
 *  SYSTÈME DE PLATEFORMES
 * ──────────────────────────────────────────────────────────────
 *  Chaque jeu peut avoir une plateforme associée.
 *  Elle s'affiche comme un petit badge à gauche du titre
 *  dans la fiche profil (jeu favori).
 *
 *  FORMAT :
 *    { name: "Nom du jeu", platform: "clé_plateforme" }
 *    ou simplement une string "Nom du jeu" (aucun badge)
 *
 *  PLATEFORMES DISPONIBLES (définies dans GBX_PLATFORMS ci-dessous) :
 *    "gb"       → Game Boy
 *    "gbc"      → Game Boy Color
 *    "gba"      → Game Boy Advance
 *    "ds"       → Nintendo DS
 *    "3ds"      → Nintendo 3DS
 *    "n64"      → Nintendo 64
 *    "gcn"      → GameCube
 *    "wii"      → Wii
 *    "wiiu"     → Wii U
 *    "switch"   → Nintendo Switch
 *    "switch2"  → Nintendo Switch 2
 *    "mobile"   → Mobile
 *    "pc"       → PC
 *    "arcade"   → Arcade
 *
 *  AJOUTER UNE NOUVELLE PLATEFORME :
 *  1. Dans GBX_PLATFORMS ci-dessous, ajoute une ligne :
 *        clé: "LABEL"
 *     Exemple : "ps5": "PS5"
 *  2. Dans le tableau GBX_POKEMON_GAMES, utilise cette clé :
 *        { name: "Mon Jeu PS5", platform: "ps5" }
 *  C'est tout !
 * ============================================================
 */

/* ── Référentiel des plateformes ── */
const GBX_PLATFORMS = {
    gb:      "GB",
    gbc:     "GBC",
    gba:     "GBA",
    ds:      "DS",
    "3ds":   "3DS",
    n64:     "N64",
    gcn:     "GCN",
    wii:     "WII",
    wiiu:    "WII U",
    switch:  "SWITCH",
    switch2: "SWITCH 2",
    mobile:  "MOBILE",
    pc:      "PC",
    arcade:  "ARCADE",
};

const GBX_POKEMON_GAMES = [
    // ── Génération 1 ──────────────────────────────────────────
    { name: "Pokémon Rouge",                              platform: "gb"      },
    { name: "Pokémon Bleu",                               platform: "gb"      },
    { name: "Pokémon Jaune : Édition Spéciale Pikachu",  platform: "gb"      },
    { name: "Pokémon Vert",                               platform: "gb"      },

    // ── Génération 2 ──────────────────────────────────────────
    { name: "Pokémon Or",                                 platform: "gbc"     },
    { name: "Pokémon Argent",                             platform: "gbc"     },
    { name: "Pokémon Cristal",                            platform: "gbc"     },

    // ── Génération 3 ──────────────────────────────────────────
    { name: "Pokémon Rubis",                              platform: "gba"     },
    { name: "Pokémon Saphir",                             platform: "gba"     },
    { name: "Pokémon Émeraude",                           platform: "gba"     },
    { name: "Pokémon Rouge Feu",                          platform: "gba"     },
    { name: "Pokémon Vert Feuille",                       platform: "gba"     },

    // ── Génération 4 ──────────────────────────────────────────
    { name: "Pokémon Diamant",                            platform: "ds"      },
    { name: "Pokémon Perle",                              platform: "ds"      },
    { name: "Pokémon Platine",                            platform: "ds"      },
    { name: "Pokémon Or HeartGold",                       platform: "ds"      },
    { name: "Pokémon Argent SoulSilver",                  platform: "ds"      },

    // ── Génération 5 ──────────────────────────────────────────
    { name: "Pokémon Noir",                               platform: "ds"      },
    { name: "Pokémon Blanc",                              platform: "ds"      },
    { name: "Pokémon Noir 2",                             platform: "ds"      },
    { name: "Pokémon Blanc 2",                            platform: "ds"      },

    // ── Génération 6 ──────────────────────────────────────────
    { name: "Pokémon X",                                  platform: "3ds"     },
    { name: "Pokémon Y",                                  platform: "3ds"     },
    { name: "Pokémon Rubis Oméga",                        platform: "3ds"     },
    { name: "Pokémon Saphir Alpha",                       platform: "3ds"     },

    // ── Génération 7 ──────────────────────────────────────────
    { name: "Pokémon Soleil",                             platform: "3ds"     },
    { name: "Pokémon Lune",                               platform: "3ds"     },
    { name: "Pokémon Ultra-Soleil",                       platform: "3ds"     },
    { name: "Pokémon Ultra-Lune",                         platform: "3ds"     },
    { name: "Pokémon Let's Go Pikachu !",                 platform: "switch"  },
    { name: "Pokémon Let's Go Évoli !",                   platform: "switch"  },

    // ── Génération 8 ──────────────────────────────────────────
    { name: "Pokémon Épée",                               platform: "switch"  },
    { name: "Pokémon Bouclier",                           platform: "switch"  },
    { name: "Pokémon Diamant Étincelant",                 platform: "switch"  },
    { name: "Pokémon Perle Scintillante",                 platform: "switch"  },
    { name: "Légendes Pokémon : Arceus",                  platform: "switch"  },

    // ── Génération 9 ──────────────────────────────────────────
    { name: "Pokémon Écarlate",                           platform: "switch"  },
    { name: "Pokémon Violet",                             platform: "switch"  },
    { name: "Légendes Pokémon : Z-A",                     platform: "switch2" },

    // ── Spin-offs ─────────────────────────────────────────────
    { name: "Pokémon Trading Card Game",                  platform: "gb"      },
    { name: "Pokémon Trading Card Game 2",                platform: "gbc"     },
    { name: "Pokémon Stadium",                            platform: "n64"     },
    { name: "Pokémon Stadium 2",                          platform: "n64"     },
    { name: "Pokémon Colosseum",                          platform: "gcn"     },
    { name: "Pokémon XD : Le Souffle des Ténèbres",       platform: "gcn"     },
    { name: "Pokémon Battle Revolution",                  platform: "wii"     },
    { name: "Pokémon Ranger",                             platform: "ds"      },
    { name: "Pokémon Ranger : Nuit sur Almia",            platform: "ds"      },
    { name: "Pokémon Ranger : Sillages de Lumière",       platform: "ds"      },
    { name: "Pokémon Donjon : Équipe de Secours Rouge",   platform: "gba"     },
    { name: "Pokémon Donjon : Équipe de Secours Bleue",   platform: "ds"      },
    { name: "Pokémon Donjon : Explorateurs du Temps",     platform: "ds"      },
    { name: "Pokémon Donjon : Explorateurs de l'Ombre",   platform: "ds"      },
    { name: "Pokémon Donjon : Explorateurs du Ciel",      platform: "ds"      },
    { name: "Pokémon Donjon : Les Portes de l'Infini",    platform: "3ds"     },
    { name: "Pokémon Donjon Mystère Wii",                 platform: "wii"     },
    { name: "Pokémon Méga Donjon Mystère",                platform: "3ds"     },
    { name: "Pokémon Donjon : Équipe de Secours DX",      platform: "switch"  },
    { name: "PokéPark : La Grande Aventure de Pikachu",   platform: "wii"     },
    { name: "PokéPark 2 : Le Monde des Voeux",            platform: "wii"     },
    { name: "Détective Pikachu",                          platform: "3ds"     },
    { name: "Le Retour de Détective Pikachu",             platform: "switch"  },
    { name: "Pokémon Pinball",                            platform: "gb"      },
    { name: "Pokémon Pinball : Rubis et Saphir",          platform: "gba"     },
    { name: "Pokémon Snap",                               platform: "n64"     },
    { name: "New Pokémon Snap",                           platform: "switch"  },
    { name: "Pokémon Dash",                               platform: "ds"      },
    { name: "Pokkén Tournament",                          platform: "wiiu"    },
    { name: "Pokémon Go",                                 platform: "mobile"  },
    { name: "Pokémon Unite",                              platform: "switch"  },
    { name: "Pokémon TCG Pocket",                         platform: "mobile"  },

    // ── Autre ─────────────────────────────────────────────────
    "Une Rom Hack",
];
