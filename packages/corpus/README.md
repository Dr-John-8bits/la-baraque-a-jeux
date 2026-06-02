# Corpus

Source de verite editoriale commune au portail et aux jeux.

## Fichiers

- `sources.json` : registre commun des sources documentaires.
- `le-mot-a-biloute/words.json` : mots, indices et bonus du Mot a Biloute.
- `le-mot-a-biloute/accepted-guesses.json` : propositions acceptees pour le Mot a Biloute, separees des reponses du jour.
- `le-mot-a-biloute/french-guesses.json` : dictionnaire francais large pour accepter les propositions courantes, sans alimenter les reponses du jour.
- `lille-mele/puzzles.json` : grilles, familles et bonus de Lille-Mele.
- `schema/` : schemas de reference pour cadrer les donnees.

## Conventions

- Chaque source a un `id` stable en kebab-case.
- Les contenus peuvent pointer vers les sources via `sourceIds`.
- Les contenus prototypes peuvent rester marques avec `status: "prototype"` tant qu'ils n'ont pas ete relus.
- Les tags sont en kebab-case pour faciliter les filtres futurs.
- Les textes restent courts pour proteger l'affichage mobile.

## Verification

```bash
npm run check:corpus
```

Le validateur controle les formats, les doublons, les references de sources et les contraintes propres a chaque jeu. Les jeux chargent ces fichiers directement en statique depuis GitHub Pages.
