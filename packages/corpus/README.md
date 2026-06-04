# Corpus

Source de verite editoriale commune au portail et aux jeux.

## Fichiers

- `sources.json` : registre commun des sources documentaires.
- `le-mot-a-biloute/words.json` : mots, indices et bonus du Mot a Biloute.
- `le-mot-a-biloute/accepted-guesses.json` : propositions acceptees pour le Mot a Biloute, separees des reponses du jour.
- `le-mot-a-biloute/french-guesses.json` : dictionnaire francais large pour accepter les propositions courantes, sans alimenter les reponses du jour.
- `lille-mele/puzzles.json` : grilles, familles et bonus de Lille-Mele.
- `station-mystere/metro-stations.json` : socle technique des stations du niveau Metro Mystere.
- `station-mystere/tram-stations.json` : socle technique des stations du niveau Tramway Mystere.
- `station-mystere/vlille-stations.json` : socle technique des stations du niveau Velo Mystere.
- `station-mystere/bus-network.json` : inventaire technique complet du niveau Bus Mystere.
- `station-mystere/editorial-entries.json` : fiches jouables, indices et reponses acceptees de Station Mystere.
- `documentation/processed/transport/transport-places-notes.json` : reserve documentaire mutualisable des lieux, stations et lignes de transport.
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

Le validateur controle les formats, les doublons, les references de sources, les references techniques Station Mystere et les contraintes propres a chaque jeu. Les jeux chargent ces fichiers directement en statique depuis GitHub Pages.

## Synchronisation Station Mystere

```bash
npm run sync:station-transport-notes
```

Cette commande complete `transport-places-notes.json` depuis les corpus techniques Metro et Tramway. Elle ajoute les lieux manquants, fusionne les stations communes aux deux reseaux et preserve les notes editoriales deja saisies.
