Original prompt: Commence à développer le jeu index.hmtl, on verra pour le contenu ensutie, vas-chercher sur le net un max d'info sur la ville de Lille, métro, lieu, etc. pour construire une première itération du jeu.

## 2026-05-31

- Décision : construire une première itération autonome dans `index.html`, sans dépendances ni build.
- Sources consultées : Ilévia ligne 1/2, GTFS Ilévia data.gouv/transport.data.gouv, Ville de Lille quartiers/patrimoine/Braderie, MEL territoire, Hello Lille, data.gouv monuments historiques.
- À faire : créer la grille interactive, localStorage, partage, sources, puis tester avec le client Playwright du skill web-game.
- `index.html` créé : jeu autonome, 4 puzzles prototype, sélection/validation, one-away, défaite/victoire, bonus, partage, sources.
- Test Playwright initial : lancement OK après installation Chromium, capture générée. Problème vu sur screenshot : actions sous la ligne de flottaison sur desktop 1280x720 ; CSS resserré.
- Tests finaux :
  - client web-game Playwright OK, capture `output/web-game/shot-0.png`, état texte exposé via `window.render_game_to_text`.
  - smoke test mobile complet OK : victoire sur les 4 groupes, `status: won`, streak affiché à 1, aucune erreur console.
  - test "trois sur quatre" OK : message `Trois sur quatre. Une carte fraude dans la rame.`, une erreur comptabilisée.
- TODO contenu : consolider les sources dans `SOURCES.md`, remplacer les grilles prototype par un vrai calendrier éditorial validé, vérifier précisément chaque anecdote avant lancement public.
- Itération 26.05.31.2 :
  - suppression du bandeau/illustration du haut ;
  - remplacement du disclaimer par `Lille-Mêle par Dr. John · v26.05.31.2` ;
  - crédit ensuite ajusté en `Lille-Mêle par Dr. John et Lady Em · v26.05.31.2` ;
  - retrait des références religieuses détectées dans les contenus prototype (`Catholique`, `Saint-André-lez-Lille`, etc.) ;
  - ajout d'un retour visuel sur erreur et "trois sur quatre" ;
  - validation Playwright : feedback visuel OK, aucune erreur console, mots longs corrigés pour éviter les débordements.
- Accroche d'intro remplacée par `Connecte les mots avant la prochaine station.`
- Itération 26.05.31.3 :
  - aide enrichie avec les règles et les types d'associations possibles ;
  - affichage de la date du jour dans le statut principal à la place du numéro de grille ;
  - ajustement responsive dynamique des libellés de tuiles sur iPhone, pour éviter les coupures disgracieuses ;
  - validation Playwright iPhone : `Maroilles` reste sur une ligne, aide visible, aucune erreur console.
- Itération 26.05.31.4 :
  - structuration complète du dépôt avec README, CHANGELOG, FAQ, SOURCES, CONTRIBUTING, PRIVACY et dossier `docs/` ;
  - ajout des conventions éditoriales, notes techniques, règles de versioning, checklist de release et structure projet ;
  - version applicative alignée sur `26.05.31.4`.
- Itération 26.05.31.5 :
  - audit complet du jeu ajouté dans `AUDIT.md` ;
  - demande de corpus éditorial ajoutée dans `EDITORIAL_CORPUS_REQUEST.md` ;
  - version applicative alignée sur `26.05.31.5` ;
  - formulation de licence nettoyée pour retirer les mentions explicites d'affiliation tierce.

## 2026-06-01

- Mutualisation monorepo : `index.html` a été découpé en `index.html`, `styles.css` et `app.js`.
- Les puzzles sont extraits dans `packages/corpus/lille-mele/puzzles.json`, les sources communes dans `packages/corpus/sources.json`.
- Le jeu utilise désormais les helpers communs pour la sélection quotidienne, le stockage local, le partage, le mélange déterministe et l'échappement HTML.
- Bug latent corrigé : la référence JavaScript à l'ancien footer `#credits` a été retirée.
- Itération 26.06.01.1 :
  - ajout de 3 puzzles `reviewed` construits à partir des exports `processed/` transport, quartiers et communes ;
  - ajout de `sourceIds` au niveau des familles, y compris sur les 4 puzzles prototype existants ;
  - schéma `Puzzle` renforcé pour rendre `status`, `tags`, `sourceIds` et les sources de familles obligatoires ;
  - validateur enrichi : refus des items exclus/sensibles et des doublons de libellés après normalisation ;
  - prochaine priorité : poursuivre l'enrichissement avec des familles relues, puis brancher les sources de groupe dans l'affichage si utile.
- Itération 26.06.01.2 :
  - feedback "3 sur 4" rendu explicite : message `Tout près : 3 cartes sont dans la même famille.` ;
  - flash jaune des cartes prolongé et rendu plus visible ;
  - aide et microcopy éditoriale alignées ;
  - smoke test enrichi avec un scénario "3 sur 4".
- Itération 26.06.01.3 :
  - passe éditoriale sur les familles `to-review` : 5 nouvelles grilles `reviewed` ajoutées ;
  - corpus Lille-Mêle à 12 grilles, dont 8 `reviewed` ;
  - cartes `reviewed` : 128 emplacements, 124 cartes uniques ;
  - nouvelles familles jouables : ligne 2, tramway, Lianes, territoires MEL, patrimoine civil, parcs et jardins ;
  - validateur renforcé avec un filtre textuel contre les références religieuses évidentes non listées dans les exclusions.
