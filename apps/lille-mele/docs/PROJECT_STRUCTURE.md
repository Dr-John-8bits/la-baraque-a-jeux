# Structure du projet

## Structure actuelle

```text
.
├── index.html
├── app.js
├── styles.css
├── manifest.webmanifest
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

## Rôle des fichiers

- `index.html` : structure HTML de l'application.
- `app.js` : logique de jeu, stockage, partage et rendu.
- `styles.css` : styles propres a Lille-Mele.
- `manifest.webmanifest` : manifeste PWA minimal.
- `AUDIT.md` : audit produit, UX, technique, éditorial et juridique.
- `README.md` : point d'entrée du projet.
- `CHANGELOG.md` : historique des versions.
- `CONTRIBUTING.md` : workflow de contribution et règles de modification.
- `EDITORIAL_CORPUS_REQUEST.md` : liste des contenus demandés pour construire le corpus.
- `FAQ.md` : règles du jeu et réponses aux questions fréquentes.
- `PRIVACY.md` : politique de confidentialité du MVP.
- `SOURCES.md` : registre des sources publiques et éditoriales.
- `ROADMAP.md` : vision produit, ressources nécessaires et trajectoire.
- `LICENSE.md` : vue d'ensemble de la licence double.
- `LICENSE-CODE.md` : licence MIT du code technique.
- `LICENSE-CONTENT.md` : protection des contenus et de l'identité.
- `progress.md` : journal de travail interne pour reprise par Codex.
- `../../packages/corpus/lille-mele/puzzles.json` : grilles du jeu.
- `../../packages/corpus/sources.json` : registre commun des sources.
- `../../packages/game-utils/` : helpers partages.
- `../../packages/ui/` : charte graphique et menu communs.

## Structure cible actuelle

Le jeu reste volontairement statique et sans build :

```text
apps/lille-mele/
  index.html
  app.js
  styles.css
packages/corpus/lille-mele/
  puzzles.json
packages/game-utils/
packages/ui/
```

## Artefacts générés

Les dossiers suivants ne doivent pas être versionnés :

- `output/`
- `node_modules/`
- captures de test ;
- exports temporaires ;
- caches locaux.

Ils sont exclus via `.gitignore`.
