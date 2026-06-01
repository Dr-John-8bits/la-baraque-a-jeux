# Lille-Mêle

Lille-Mêle est un micro-jeu quotidien mobile-first : 16 cartes, 4 familles cachées, une grille lilloise à démêler avant la prochaine station.

Version courante : `26.05.31.5`

## Jouer en local

Le prototype actuel est autonome et ne nécessite aucune dépendance. Dans le monorepo, servir la racine puis ouvrir :

```text
http://127.0.0.1:48391/apps/lille-mele/
```

Depuis ce dossier, il peut aussi être ouvert directement :

```text
index.html
```

Ou lancer un petit serveur local :

```bash
python3 -m http.server 48391
```

Puis ouvrir :

```text
http://127.0.0.1:48391/index.html
```

## État du projet

Prototype jouable en fichier unique :

- grille 4x4 ;
- sélection de 4 cartes ;
- validation des groupes ;
- compteur d'erreurs ;
- feedback "trois sur quatre" ;
- victoire et défaite ;
- sauvegarde locale ;
- streak local ;
- partage sans spoiler ;
- aide intégrée ;
- sources intégrées ;
- bonus "P'tit Vrai ou Bidon ?" ;
- responsive mobile avec ajustement dynamique des libellés.

## Structure

```text
.
├── index.html
├── AUDIT.md
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── EDITORIAL_CORPUS_REQUEST.md
├── FAQ.md
├── PRIVACY.md
├── SOURCES.md
├── ROADMAP.md
├── LICENSE.md
├── LICENSE-CODE.md
├── LICENSE-CONTENT.md
├── docs/
│   ├── CONTENT_GUIDELINES.md
│   ├── PROJECT_STRUCTURE.md
│   ├── RELEASE_CHECKLIST.md
│   ├── TECHNICAL_NOTES.md
│   └── VERSIONING.md
└── progress.md
```

## Documentation

- [Audit complet du jeu](AUDIT.md)
- [Demande de corpus editorial](EDITORIAL_CORPUS_REQUEST.md)
- [FAQ et règles du jeu](FAQ.md)
- [Changelog](CHANGELOG.md)
- [Contribution et workflow](CONTRIBUTING.md)
- [Confidentialité](PRIVACY.md)
- [Sources et crédits de données](SOURCES.md)
- [Roadmap](ROADMAP.md)
- [Conventions éditoriales](docs/CONTENT_GUIDELINES.md)
- [Notes techniques](docs/TECHNICAL_NOTES.md)
- [Versioning](docs/VERSIONING.md)
- [Checklist de release](docs/RELEASE_CHECKLIST.md)
- [Structure du projet](docs/PROJECT_STRUCTURE.md)

## Licence

Le projet utilise un régime de licence double :

- code source technique : MIT, voir [LICENSE-CODE.md](LICENSE-CODE.md) ;
- contenus, grilles, textes, identité et assets originaux : droits réservés, voir [LICENSE-CONTENT.md](LICENSE-CONTENT.md).

La vue d'ensemble se trouve dans [LICENSE.md](LICENSE.md).

## Règle éditoriale importante

Le jeu ne doit contenir aucune référence religieuse dans les grilles, textes, anecdotes, questions, réponses ou microcopies.

## Crédit

Lille-Mêle par Dr. John et Lady Em.
