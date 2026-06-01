# Tests et validation

## Objectif

Le jeu doit rester jouable, lisible et sans erreur sur mobile.

## Vérifications rapides

```bash
npm run check
```

Puis vérifier dans le navigateur :

```text
index.html
apps/le-mot-a-biloute/
```

## Parcours à tester

- Charger la page.
- Vérifier le mot du jour et la catégorie.
- Vérifier que le premier coup d'pouce est accessible gratuitement depuis le bouton `Ch’ti coup d'pouce`.
- Cliquer sur un coup d'pouce payant et vérifier la perte de points.
- Taper une réponse trop courte.
- Taper une proposition manifestement invalide, par exemple une seule lettre répétée.
- Taper une mauvaise réponse.
- Vérifier qu'au 6e échec la modale `Rab de Biloute` apparaît, que la série passe à 0 et que le jeu reste jouable.
- Continuer dans le Rab de Biloute et vérifier que le score peut devenir négatif.
- Taper la bonne réponse.
- Vérifier le bonus final.
- Vérifier le détail du score dans la modale de fin.
- Vérifier le partage.
- Vérifier les statistiques et l'historique local.

## Points de contrôle visuel

- Le clavier doit être utilisable au doigt.
- Les textes ne doivent pas sortir de leurs conteneurs.
- Les couleurs correcte / présente / absente doivent être distinguables.
- Les marqueurs de cases et les labels accessibles doivent compléter les couleurs.
- Le jeu doit rester confortable sur un écran mobile vertical.

## État textuel de test

L'application expose :

```js
window.render_game_to_text()
```

Cette fonction retourne un JSON compact contenant l'état courant du jeu, utile pour les tests automatisés.
