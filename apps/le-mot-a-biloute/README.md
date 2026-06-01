# Le mot à Biloute

**Le mot à Biloute** est un jeu web mobile-first où l'on devine chaque jour un mot lié à Lille, au Nord ou au parler ch'ti.

Le projet est volontairement simple à déployer : une webapp statique, sans compte, sans backend, maintenant intégrée au monorepo **La baraque à jeux Lille**.

## Accès public

Le jeu est accessible depuis le portail **La baraque à jeux**. Il est conçu comme une webapp statique jouable directement dans un navigateur mobile.

## Fonctionnalités

- mot quotidien déterministe ;
- 6 essais officiels, puis Rab de Biloute possible sans série ;
- premier Ch’ti coup d'pouce gratuit à la demande et volontairement vague ;
- coups d'pouce supplémentaires avec pénalité de points ;
- score basé sur les essais et les coups d'pouce, y compris dans le Rab de Biloute ;
- clavier virtuel AZERTY ;
- saisie au clavier physique ;
- validation stricte des propositions avec une liste locale séparée des réponses ;
- retour correcte / présente / absente ;
- animation de révélation lettre par lettre ;
- mode archive pour rejouer d'anciens mots ;
- bonus final ;
- sauvegarde, statistiques, graphique de performance et historique local dans `localStorage` ;
- import/export du calepin local ;
- partage texte avec score et lien public.

## Structure

```text
.
├── index.html
├── app.js
├── styles.css
├── manifest.webmanifest
├── CHANGELOG.md
├── CONTRIBUTING.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── AUDIT.md
│   ├── CONTENT_GUIDE.md
│   ├── DEPLOYMENT.md
│   ├── EDITORIAL_CORPUS_REQUEST.md
│   ├── FAQ.md
│   ├── PRIVACY.md
│   ├── ROADMAP.md
│   ├── SPECIFICATIONS.md
│   └── TESTING.md
└── LICENSE*.md
```

Le corpus et la politique de validation vivent dans `../../packages/corpus/le-mot-a-biloute/`.

## Documentation

- [Règles et FAQ](docs/FAQ.md)
- [Audit complet](docs/AUDIT.md)
- [Demande de corpus éditorial](docs/EDITORIAL_CORPUS_REQUEST.md)
- [Spécifications produit](docs/SPECIFICATIONS.md)
- [Architecture technique](docs/ARCHITECTURE.md)
- [Guide éditorial](docs/CONTENT_GUIDE.md)
- [Déploiement](docs/DEPLOYMENT.md)
- [Confidentialité](docs/PRIVACY.md)
- [Roadmap](docs/ROADMAP.md)
- [Tests](docs/TESTING.md)
- [Contribution](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## Licences

Le projet utilise une double licence :

- le code technique est sous licence MIT ;
- les contenus, mots du jour, indices, textes, identité et assets originaux sont protégés tous droits réservés.

Voir [LICENSE.md](LICENSE.md).
