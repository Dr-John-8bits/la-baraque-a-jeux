# Notes techniques

## Prototype actuel

Le prototype est une webapp statique decoupee :

```text
index.html
styles.css
app.js
../../packages/corpus/lille-mele/puzzles.json
../../packages/corpus/sources.json
```

Elle separe :

- la structure HTML ;
- les styles CSS propres au jeu ;
- les données de corpus ;
- la logique de jeu JavaScript ;
- la sauvegarde locale ;
- le partage ;
- l'aide ;
- les sources.

Ce choix garde le jeu jouable sur GitHub Pages sans build ni backend.

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

Les prochaines étapes techniques :

1. enrichir le validateur de grilles ;
2. relier chaque item a une source structuree ;
3. isoler davantage les fonctions de resolution ;
4. ajouter des tests navigateur automatises ;
5. envisager TypeScript seulement si le corpus devient difficile a maintenir en JavaScript statique.
