Original prompt: Tu vas créer un nouveau mini jeux web, un chifoumi mais lillois, pas de papier pierre ciseau, mais va s'appeler "Biloute · Bière · Braderie"

Règle du triangle
Biloute bat Bière
Parce que biloute tient mieux la pinte que toi.
Bière bat Braderie
Parce qu’après trois pintes, tu oublies ce que tu voulais chiner.
Braderie bat Biloute
Parce que même le plus malin des biloutes finit perdu entre deux tas de vaisselle.

Biloute Bière Braderie

Sous-titre :

Le chifoumi lillois où tout finit dans la foule, la mousse ou la mauvaise foi.

-
Le principe on joue tout seul et on joue contre l'ordinateur. Inspire toi du dossier temporaire rock-paper-scissors-main, et après je vais le supprimer. Créé l'app dans "apps"

## Journal

- 2026-06-01 : création de l'app statique `apps/biloute-biere-braderie`.
- 2026-06-01 : ajout d'un moteur de chifoumi lillois, score premier à 5, historique, règles, partage et rendu canvas.
- 2026-06-01 : reprise CSS mobile-first explicite, avec choix empilés par défaut et layout desktop seulement au-dessus de 820px.
- 2026-06-01 : ajustement après capture mobile : nav compacte dans l'app et canvas au ratio natif pour faire remonter les boutons tactiles.
- 2026-06-01 : suppression du texte clavier dans le canvas pour privilégier l'usage tactile mobile.
- 2026-06-01 : allègement des ombres des boutons de choix sur mobile pour éviter une bande sombre sous le dernier bouton.
- 2026-06-01 : compression légère des boutons tactiles mobiles pour que les trois choix restent visibles sur des écrans plus courts.
- 2026-06-01 : marge supplémentaire sur smartphone court : boutons à 60px et espacement réduit.
- 2026-06-01 : validations OK : `npm run check`, smoke Playwright complet, client `develop-web-game`, captures mobiles 390x844 et 390x812.
- 2026-06-01 : remplacement des libellés éditoriaux visibles par `Ch’tifoumi lillois`.
- 2026-06-01 : remplacement de la grande illustration canvas par un bandeau de duel compact en emojis.
- 2026-06-01 : validations OK après bandeau emoji : capture mobile 390x812, client `develop-web-game`, `npm run test:browser`, `npm run check`.
- 2026-06-01 : ajout de la mécanique chronométrée `CH'TI FOU MI` avec 3 secondes pour choisir, sinon l'ordinateur marque.
- 2026-06-01 : validations OK après chrono : choix pendant le compte à rebours, timeout automatique, `npm run test:browser`, `npm run check`.

## TODO

- Prévoir un test dédié de fin de partie si le jeu grandit au-delà du prototype statique.
