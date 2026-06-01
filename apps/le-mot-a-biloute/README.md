# Le mot à Biloute

**Le mot à Biloute** est un jeu web mobile-first où l'on devine chaque jour un mot lié à Lille, au Nord ou au parler ch'ti.

Le projet est volontairement simple à déployer : une webapp statique, sans compte, sans backend, maintenant intégrée au monorepo **La baraque à jeux Lille**.

## Jouer

Dans le monorepo, servir la racine puis ouvrir :

```text
http://127.0.0.1:48391/apps/le-mot-a-biloute/
```

## Lancer localement

Depuis ce dossier, le jeu peut aussi être ouvert directement dans le navigateur ou servi avec :

```bash
python3 -m http.server 48321
```

Puis ouvrir `http://127.0.0.1:48321/`.

## Fonctionnalités

- mot quotidien déterministe ;
- 6 essais ;
- premier indice gratuit et volontairement vague ;
- indices supplémentaires avec pénalité de points ;
- score basé sur les essais et les indices ;
- clavier virtuel AZERTY ;
- saisie au clavier physique ;
- retour correcte / présente / absente ;
- bonus final ;
- sauvegarde et statistiques dans `localStorage` ;
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

## Version

Version courante : `26.05.31.5`.
