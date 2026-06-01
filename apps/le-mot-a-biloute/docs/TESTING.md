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
- Vérifier que le premier indice est visible gratuitement.
- Cliquer sur un indice payant et vérifier la perte de points.
- Taper une réponse trop courte.
- Taper une mauvaise réponse.
- Taper la bonne réponse.
- Vérifier le bonus final.
- Vérifier le partage.
- Vérifier les statistiques.

## Points de contrôle visuel

- Le clavier doit être utilisable au doigt.
- Les textes ne doivent pas sortir de leurs conteneurs.
- Les couleurs correcte / présente / absente doivent être distinguables.
- Le jeu doit rester confortable sur un écran mobile vertical.

## État textuel de test

L'application expose :

```js
window.render_game_to_text()
```

Cette fonction retourne un JSON compact contenant l'état courant du jeu, utile pour les tests automatisés.
