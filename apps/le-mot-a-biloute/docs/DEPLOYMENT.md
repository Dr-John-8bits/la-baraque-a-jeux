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
- métadonnées sociales et icônes référencées depuis `assets/brand/`

Fichiers requis côté monorepo :

- `packages/ui/`
- `packages/game-utils/`
- `packages/corpus/le-mot-a-biloute/words.json`
- `packages/corpus/le-mot-a-biloute/guess-policy.json`
- `packages/corpus/le-mot-a-biloute/accepted-guesses.json`
- `404.html` à la racine pour GitHub Pages

## Avant publication

Vérifier :

- `npm run check` depuis la racine ;
- le lien de partage ;
- le mot du jour ;
- le score ;
- le rendu mobile ;
- les métadonnées Open Graph ;
- l'icône PWA ;
- l'absence d'erreur console.

## GitHub Pages

Paramétrage recommandé :

- source : branche principale ;
- racine du dépôt ;
- HTTPS activé.
