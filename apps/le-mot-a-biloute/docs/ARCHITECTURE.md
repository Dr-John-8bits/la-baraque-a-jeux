# Architecture technique

## Principe

Le projet est une webapp statique volontairement légère.

Il n'y a actuellement :

- aucun framework ;
- aucun build obligatoire ;
- aucun backend ;
- aucune base de données distante.

## Fichiers principaux

- `index.html` : structure HTML de l'application.
- `styles.css` : interface mobile-first.
- `app.js` : moteur de jeu, score, stockage local et partage.
- `manifest.webmanifest` : manifeste PWA minimal.
- `../../packages/corpus/le-mot-a-biloute/words.json` : corpus des mots.
- `../../packages/corpus/le-mot-a-biloute/guess-policy.json` : politique de validation des propositions.
- `../../packages/corpus/le-mot-a-biloute/accepted-guesses.json` : liste locale des propositions acceptées.
- `../../packages/corpus/le-mot-a-biloute/tools/build-accepted-guesses.mjs` : génération de la liste de propositions depuis le corpus traité.
- `../../packages/game-utils/` : helpers partagés avec les autres jeux.
- `../../packages/ui/` : tokens, base visuelle et menu commun.

## Stockage local

Le jeu utilise `localStorage` avec le préfixe `mot-a-biloute`.

Contenus stockés :

- progression du mot du jour ;
- essais ;
- indices utilisés ;
- statut victoire/défaite ;
- statistiques locales ;
- historique local simple des dernières parties.

## Moteur de jeu

Le moteur :

- sélectionne un mot quotidien déterministe ;
- permet de rejouer une date passée en mode archive, sans modifier les statistiques officielles ;
- normalise les entrées ;
- valide les propositions selon la politique active ;
- compare les lettres avec gestion des doublons ;
- calcule le score ;
- construit le texte de partage ;
- expose `window.render_game_to_text()` pour les tests Playwright.

## Corpus

Les mots ne sont plus intégrés dans `app.js`. Le jeu charge le corpus JSON depuis le paquet commun `packages/corpus`.

Cette séparation permet d'ajouter ou de relire les mots sans modifier le moteur du jeu.

## Vérifications

Les contrôles communs sont lancés depuis la racine du monorepo :

```bash
npm run check
```
