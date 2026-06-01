# Corpus

Source de verite editoriale commune au portail et aux jeux.

## Fichiers

- `sources.json` : registre commun des sources documentaires.
- `le-mot-a-biloute/words.json` : mots, indices et bonus du Mot a Biloute.
- `lille-mele/puzzles.json` : grilles, familles et bonus de Lille-Mele.
- `schema/` : schemas de reference pour cadrer les donnees.

## Verification

```bash
npm run check:corpus
```

Les jeux chargent ces fichiers directement en statique depuis GitHub Pages.
