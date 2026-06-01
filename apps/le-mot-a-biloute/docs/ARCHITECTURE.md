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
- `app.js` : données des mots, moteur de jeu, score, stockage local et partage.
- `manifest.webmanifest` : manifeste PWA minimal.

## Stockage local

Le jeu utilise `localStorage` avec le préfixe `mot-a-biloute`.

Contenus stockés :

- progression du mot du jour ;
- essais ;
- indices utilisés ;
- statut victoire/défaite ;
- statistiques locales.

## Moteur de jeu

Le moteur :

- sélectionne un mot quotidien déterministe ;
- normalise les entrées ;
- compare les lettres avec gestion des doublons ;
- calcule le score ;
- construit le texte de partage ;
- expose `window.render_game_to_text()` pour les tests Playwright.

## Évolution possible

Quand la liste de mots grandira, il sera préférable de sortir les données de `app.js` vers :

```text
data/words.json
data/archive.json
```

Pour le moment, garder les mots dans `app.js` simplifie le prototype.

## Prochaine refonte technique

La prochaine étape recommandée est de séparer :

- `src/game` ou `lib/game` pour le moteur ;
- `data/words.json` pour le corpus ;
- `scripts/validate-content.mjs` pour contrôler les données ;
- `tests/` pour les scénarios Playwright.

Cette séparation permettra d'intégrer le corpus éditorial sans modifier le moteur à chaque nouveau mot.
