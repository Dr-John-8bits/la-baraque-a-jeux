# Structure du projet

## Structure actuelle

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

## Rôle des fichiers

- `index.html` : prototype jouable autonome.
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

## Structure cible Vite / React

Quand le prototype sera converti en app moderne :

```text
src/
  components/
    GameBoard.tsx
    Tile.tsx
    FoundGroup.tsx
    ResultScreen.tsx
    Header.tsx
  data/
    puzzles.json
  hooks/
    useGameState.ts
    useTodayPuzzle.ts
  lib/
    gameLogic.ts
    storage.ts
    share.ts
    puzzleValidation.ts
  pages/
    Home.tsx
    About.tsx
    HowToPlay.tsx
  styles/
    global.css
```

## Artefacts générés

Les dossiers suivants ne doivent pas être versionnés :

- `output/`
- `node_modules/`
- captures de test ;
- exports temporaires ;
- caches locaux.

Ils sont exclus via `.gitignore`.
