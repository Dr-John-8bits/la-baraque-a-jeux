# Corpus documentaire

Ce dossier rassemble les sources brutes et les exports derives qui servent a construire les corpus de Lille-Mele, Le mot a Biloute et Station Mystere.

## Structure

- `raw/transport/` : GTFS Ilévia telecharge, extraction GTFS et GeoJSON des arrets.
- `raw/data-gouv/` : metadonnees data.gouv/dataMEL et exports tabulaires ou GeoJSON valides.
- `raw/pdf/` : documents PDF de reference telecharges.
- `raw/wikipedia/` : copies locales integrales de pages Wikipedia, ignorees par Git.
- `processed/transport/` : lignes Ilévia structurees avec arrets ordonnes par direction et notes documentaires transport mutualisables.
- `processed/geography/` : communes, quartiers, lieux locaux et rues normalises.
- `processed/editorial/` : items, familles, mots regionaux et exclusions editoriales.
- `tools/build-processed-corpus.mjs` : generateur local des exports derives.
- `source-pages.json` : index des pages web publiques non recopiees en full-text.

## Exports utiles

- `processed/transport/metro-station-groups.json` : associations de stations par ligne et direction, pour fabriquer des familles de stations d'une meme ligne.
- `processed/transport/metro-lines.json` : lignes de metro avec ordre des stations, terminus, communes et coordonnees.
- `processed/transport/bus-lines.json` : lignes de bus avec arrets ordonnes, utile pour creer des familles d'arrets d'une meme ligne.
- `processed/transport/transport-places-notes.json` : reserve de notes sourcables sur les stations, lignes, poles et lieux de transport, reutilisable par Station Mystere et de futurs jeux.
- `processed/geography/mel-communes.json` : 95 communes MEL, populations, territoires et modes Ilévia detectes.
- `processed/geography/lille-quartiers.json` : 12 quartiers officiels de Lille, Lomme et Hellemmes.
- `processed/editorial/candidate-items.json` : reserve d'items bruts sourcables.
- `processed/editorial/candidate-families.json` : 66 familles candidates deja filtrees contre les references religieuses detectables.
- `processed/editorial/excluded-sensitive-items.json` : items a eviter automatiquement, notamment cultuel/religieux ou noms a risque.
- `processed/editorial/regional-word-seeds.json` : 103 graines de mots regionaux, gastronomiques et brassicoles reformulees, a relire avant integration dans le jeu.

## Sources et droits

Les jeux de donnees ouverts ont ete telecharges localement dans `raw/`, ignore par Git. Les pages web publiques sans licence ouverte explicite sont indexees dans `source-pages.json`, mais leur texte n'est pas recopie dans le depot. Elles servent uniquement a verifier des faits, puis a reformuler les contenus originaux.

Les pages Wikipedia recuperees pour Station Mystere sont egalement conservees dans `raw/`, donc hors Git. Elles servent de matiere documentaire locale sous licence CC BY-SA, avant analyse, selection et reformulation dans les fichiers editoriaux versionnes.

Les anciennes URL `opendata.lillemetropole.fr` exposees par certains jeux data.gouv renvoient une page HTML du portail dataMEL. Pour ces jeux, les exports utilisables ont ete recuperes via l'API tabulaire data.gouv et stockes en `*.records.json`.

## Regeneration

Depuis la racine du depot :

```bash
node packages/corpus/documentation/tools/build-processed-corpus.mjs
```

Le generateur lit les bruts telecharges et recree les fichiers `processed/`.

## Recuperation Wikipedia locale

Depuis la racine du depot :

```bash
npm run fetch:wikipedia-metro
npm run fetch:wikipedia-tram
```

Ces commandes recuperent les pages Wikipedia disponibles via l'API MediaWiki et les stockent dans `packages/corpus/documentation/raw/wikipedia/station-mystere/`. Le dossier est ignore par Git et ne doit pas etre publie tel quel.

Etat local actuel :

- `metro/` : 60 pages trouvees sur 60 stations ;
- `tramway/` : 5 pages trouvees sur 36 stations, les autres stations etant listees comme manquantes dans le manifeste local.

## Verification

Le corpus applicatif existant reste valide via :

```bash
npm run check:corpus
```

Les exports documentaires principaux et la reserve `transport-places-notes.json` sont branches au validateur principal lorsqu'ils alimentent directement les corpus applicatifs. Les autres exports restent en JSON structure et derives de sources tracees dans `packages/corpus/sources.json`.

La reserve transport peut etre resynchronisee depuis les corpus techniques Station Mystere avec :

```bash
npm run sync:station-transport-notes
```

La synchronisation est additive : elle conserve les notes, anecdotes et sources externes deja ajoutees manuellement.
