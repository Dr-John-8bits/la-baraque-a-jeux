# Déploiement

## Cible

Le jeu est maintenant intégré au monorepo **La baraque à jeux Lille**.

Déploiement cible recommandé :

```text
/le-mot-a-biloute/
```

## Déploiement statique

Aucun build n'est nécessaire.

Fichiers requis à la racine :

- `index.html`
- `app.js`
- `styles.css`
- `manifest.webmanifest`

## Test local

```bash
python3 -m http.server 48321
```

Puis ouvrir :

```text
http://127.0.0.1:48321/
```

## Avant publication

Vérifier :

- la version affichée dans le footer ;
- le lien de partage ;
- le mot du jour ;
- le score ;
- le rendu mobile ;
- l'absence d'erreur console.

## GitHub Pages

Paramétrage recommandé :

- source : branche principale ;
- dossier généré par le pipeline de déploiement du monorepo ;
- HTTPS activé.
