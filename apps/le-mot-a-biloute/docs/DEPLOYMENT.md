# Déploiement

## Cible

Le jeu est maintenant intégré au monorepo **La baraque à jeux Lille**.

Déploiement cible recommandé :

```text
/apps/le-mot-a-biloute/
```

## Déploiement statique

Aucun build n'est nécessaire.

Fichiers requis côté jeu :

- `index.html`
- `app.js`
- `styles.css`
- `manifest.webmanifest`

Fichiers requis côté monorepo :

- `packages/ui/`
- `packages/game-utils/`
- `packages/corpus/le-mot-a-biloute/words.json`

## Avant publication

Vérifier :

- `npm run check` depuis la racine ;
- le lien de partage ;
- le mot du jour ;
- le score ;
- le rendu mobile ;
- l'absence d'erreur console.

## GitHub Pages

Paramétrage recommandé :

- source : branche principale ;
- racine du dépôt ;
- HTTPS activé.
