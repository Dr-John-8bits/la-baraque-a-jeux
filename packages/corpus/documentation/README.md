# Corpus documentaire

Ce dossier rassemble les sources brutes et les exports derives qui servent a construire les corpus de **Lille-Mele** et **Le mot a Biloute**.

## Structure

- `raw/transport/` : GTFS Ilévia telecharge, extraction GTFS et GeoJSON des arrets.
- `raw/data-gouv/` : metadonnees data.gouv/dataMEL et exports tabulaires ou GeoJSON valides.
- `raw/pdf/` : documents PDF de reference telecharges.
- `processed/transport/` : lignes Ilévia structurees avec arrets ordonnes par direction.
- `processed/geography/` : communes, quartiers, lieux locaux et rues normalises.
- `processed/editorial/` : items, familles, mots regionaux et exclusions editoriales.
- `tools/build-processed-corpus.mjs` : generateur local des exports derives.
- `source-pages.json` : index des pages web publiques non recopiees en full-text.

## Exports utiles

- `processed/transport/metro-station-groups.json` : associations de stations par ligne et direction, pour fabriquer des familles de stations d'une meme ligne.
- `processed/transport/metro-lines.json` : lignes de metro avec ordre des stations, terminus, communes et coordonnees.
- `processed/transport/bus-lines.json` : lignes de bus avec arrets ordonnes, utile pour creer des familles d'arrets d'une meme ligne.
- `processed/geography/mel-communes.json` : 95 communes MEL, populations, territoires et modes Ilévia detectes.
- `processed/geography/lille-quartiers.json` : 12 quartiers officiels de Lille, Lomme et Hellemmes.
- `processed/editorial/candidate-items.json` : reserve d'items bruts sourcables.
- `processed/editorial/candidate-families.json` : 66 familles candidates deja filtrees contre les references religieuses detectables.
- `processed/editorial/excluded-sensitive-items.json` : items a eviter automatiquement, notamment cultuel/religieux ou noms a risque.
- `processed/editorial/regional-word-seeds.json` : 103 graines de mots regionaux, gastronomiques et brassicoles reformulees, a relire avant integration dans le jeu.

## Sources et droits

Les jeux de donnees ouverts ont ete telecharges localement dans `raw/`, ignore par Git. Les pages web publiques sans licence ouverte explicite sont indexees dans `source-pages.json`, mais leur texte n'est pas recopie dans le depot. Elles servent uniquement a verifier des faits, puis a reformuler les contenus originaux.

Les anciennes URL `opendata.lillemetropole.fr` exposees par certains jeux data.gouv renvoient une page HTML du portail dataMEL. Pour ces jeux, les exports utilisables ont ete recuperes via l'API tabulaire data.gouv et stockes en `*.records.json`.

## Regeneration

Depuis la racine du depot :

```bash
node packages/corpus/documentation/tools/build-processed-corpus.mjs
```

Le generateur lit les bruts telecharges et recree les fichiers `processed/`.

## Verification

Le corpus applicatif existant reste valide via :

```bash
npm run check:corpus
```

Les exports documentaires ne sont pas encore branches au validateur principal, mais ils sont en JSON structure et derives de sources tracees dans `packages/corpus/sources.json`.
