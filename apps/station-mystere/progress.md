# Progression

Original prompt: Ok, c'est parti. Tu peux construire la v1 du jeu.

## 2026-06-06

- Démarrage du développement de la v1 Métro Mystère.
- Documents de référence lus : `game-design.md` et `implementation-plan.md`.
- Point de données important : `editorial-entries.json` est un objet, les fiches jouables sont dans la propriété `entries`.
- Périmètre confirmé : JavaScript natif, métro uniquement, pas de moteur externe.
- Écran placeholder remplacé par une interface jouable v1.
- `app.js` ajouté : chargement corpus, sélection quotidienne, recherche, suggestions, score, indices, victoire, défaite, calepin, stats, partage et hook `render_game_to_text`.
- `scripts/check-static-pages.mjs` vérifie désormais les imports `fetchJson` de Station Mystère.
- `npm run check` passe après ce premier bloc.
- `tests/smoke.spec.mjs` couvre maintenant un vrai scénario Station Mystère : suggestions, mauvaise réponse, indice payant, victoire, fiche découverte, reload et stats non dupliquées.
- `npm run check` passe après ajout du smoke test.
- Inspection visuelle initiale : écran lisible, mais les 5 cartes d'indices poussaient la recherche sous le premier viewport.
- Correction UX : le panneau affiche les indices visibles et un seul aperçu compact du prochain indice verrouillé.
- Deuxième inspection visuelle : recherche encore trop basse à cause d'un `min-height` trop grand sur le panneau mystère.
- Correction UX : réduction de la hauteur minimale du panneau mystère pour rendre l'action principale visible plus tôt.
- Inspection des suggestions : la liste s'ouvrait sous le champ et sortait du viewport.
- Correction UX : la liste de suggestions s'ouvre maintenant au-dessus du champ.
- Inspection victoire : la logique est correcte, mais le panneau conservait le libellé "Station inconnue" et le résultat documentaire restait trop bas.
- Correction UX : le libellé passe à "Station révélée" après fin de partie et le résultat est amené en vue.
- Inspection mobile : rendu fonctionnel, mais les stats empilées consommaient trop de hauteur.
- Correction mobile : les stats restent en trois colonnes compactes sur petit écran.
- Inspection mobile complémentaire : le résumé Calepin passait avant la réponse et repoussait l'action principale.
- Correction mobile : le résumé latéral est masqué sous 820 px et un bouton Calepin rejoint les actions.
- Vérifications finales provisoires : `npm run check` passe et `npm run test:browser` passe.
- Captures vérifiées : desktop initial, suggestions, erreur + indice, victoire avec fiche découverte, mobile initial.
- Correction logique : le calcul du jour précédent pour les séries part maintenant du `dateId` actif, afin de respecter le renouvellement quotidien à midi.
- Vérifications après correction : `npm run check` passe et `npm run test:browser` passe.
