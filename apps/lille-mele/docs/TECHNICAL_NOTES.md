# Notes techniques

## Prototype actuel

Le prototype est un fichier HTML autonome :

```text
index.html
```

Il contient :

- le HTML ;
- les styles CSS ;
- les données prototype ;
- la logique de jeu JavaScript ;
- la sauvegarde locale ;
- le partage ;
- l'aide ;
- les sources.

Ce choix permet d'itérer vite avant de passer à une vraie architecture applicative.

## Stockage local

Le jeu utilise `localStorage`.

Préfixe actuel :

```text
lillemele.v1.
```

Données stockées :

- état de la partie ;
- erreurs ;
- groupes trouvés ;
- ordre des cartes ;
- streak ;
- statistiques locales simples ;
- état du bonus.

## Rendu responsive

Les tuiles utilisent :

- CSS Grid 4 colonnes ;
- hauteur stable ;
- ajustement dynamique de taille de texte ;
- coupure contrôlée uniquement lorsque nécessaire.

Objectif : éviter les coupures disgracieuses sur smartphone.

## Accessibilité

Déjà présent :

- cartes sous forme de boutons ;
- `aria-live` pour les messages ;
- `aria-pressed` sur les cartes sélectionnées ;
- contraste visuel pour sélection, erreur et validation ;
- respect de `prefers-reduced-motion`.

À améliorer :

- parcours clavier complet à auditer ;
- libellés des boutons icônes à renforcer ;
- test lecteur d'écran ;
- mode contraste élevé éventuel.

## Tests manuels actuels

Tests réalisés via Playwright :

- rendu iPhone 375 px ;
- ouverture de l'aide ;
- victoire complète ;
- feedback "trois sur quatre" ;
- absence d'erreurs console ;
- vérification que `Maroilles` reste sur une ligne.

## Prochaine étape technique

Quand le prototype se stabilise :

1. extraire les données dans `data/puzzles.json` ;
2. extraire la logique de jeu dans des fonctions testables ;
3. ajouter un validateur de grilles ;
4. convertir en Vite + TypeScript ;
5. ajouter des tests unitaires.
