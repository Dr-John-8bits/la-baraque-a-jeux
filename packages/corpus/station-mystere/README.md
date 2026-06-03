# Corpus Station Mystere

Ce dossier contient les donnees versionnables propres a Station Mystere.

## Decision de gameplay

- Niveau 1 - Metro Mystere : la reponse est une station de metro.
- Niveau 2 - Tramway Mystere : la reponse est une station de tramway.
- Niveau 3 - Velo Mystere : la reponse est une station V'Lille candidate.
- Niveau 4 - Bus Mystere : la reponse est une ligne de bus.

Pour le niveau Bus, les arrets, poles, terminus et communes desservies restent
des donnees documentaires importantes, mais ils servent d'indices et ne sont pas
les reponses du MVP.

## Niveau 1 - Metro Mystere

- `metro-stations.json` : premier socle technique des stations des lignes M1 et M2.
- `tools/build-metro-corpus.mjs` : generateur local derive du GTFS Ilévia et du GeoJSON dataMEL des arrets.

Le fichier genere contient :

- 60 stations jouables ;
- 18 stations sur M1 ;
- 44 stations sur M2 ;
- 2 correspondances metro : Gare Lille Flandres et Porte Des Postes ;
- 1 homonymie a traiter editorialement : Hotel De Ville.

## Regeneration

Depuis la racine du depot :

```bash
npm run build:station-metro
```

Le generateur lit les sources brutes conservees localement dans
`packages/corpus/documentation/raw/`, ignorees par Git.

## Limites editoriales

Ce corpus est un socle technique. Les libelles viennent du GTFS et doivent encore
etre relus pour les accents, abbreviations et noms publics. Les champs de fiche
decouverte restent vides tant que les informations culturelles, historiques ou
patrimoniales ne sont pas sourcees.

## Niveau 2 - Tramway Mystere

- `tram-stations.json` : premier socle technique des stations du tramway Ilévia.
- `tools/build-tram-corpus.mjs` : generateur local derive du GTFS Ilévia et du
  GeoJSON dataMEL des arrets.

Le fichier genere contient :

- 1 ligne tramway ;
- 2 branches principales ;
- 36 stations jouables ;
- 23 stations sur la branche Roubaix ;
- 22 stations sur la branche Tourcoing ;
- 9 stations sur le tronc commun ;
- 3 terminus : Gare Lille Flandres, Euroteleport et Tourcoing Centre.

### Regeneration Tramway

Depuis la racine du depot :

```bash
npm run build:station-tram
```

Le tramway est expose comme une seule route GTFS. Le generateur reconstruit les
branches Roubaix et Tourcoing a partir des parcours representatifs.

## Niveau 3 - Velo Mystere

- `vlille-stations.json` : premier socle technique des stations V'Lille.
- `tools/build-vlille-corpus.mjs` : generateur local derive du GBFS V'Lille et
  des limites communales de la MEL.

Le fichier genere contient :

- 268 stations GBFS ;
- 255 candidates jouables ;
- 13 stations a verifier ;
- 21 communes detectees ;
- 5 146 places de capacite technique cumulee.

### Regeneration V'Lille

Depuis la racine du depot :

```bash
npm run build:station-vlille
```

Les statuts GBFS sont une photographie au moment de l'extraction. Pour le jeu,
il faudra privilegier les stations candidates et relire les stations marquees
`a-verifier` avant de les utiliser dans une enigme quotidienne.

## Niveau 4 - Bus Mystere

- `bus-network.json` : inventaire technique complet du reseau bus Ilévia.
- `tools/build-bus-corpus.mjs` : generateur local derive du GTFS Ilévia et du
  GeoJSON dataMEL des arrets.

Le fichier genere contient :

- 143 lignes bus ;
- 626 parcours distincts ;
- 1 507 arrets regroupes ;
- 3 089 points d'arret GTFS bruts utilises ;
- 217 poles candidats ;
- 407 candidats a etudier ;
- 883 arrets gardes en inventaire ;
- 103 communes ou libelles de communes detectes.

### Regeneration Bus

Depuis la racine du depot :

```bash
npm run build:station-bus
```

Ce fichier est volontairement large afin de ne pas perdre d'information au
debut du travail documentaire. Il ne devra probablement pas etre charge tel quel
par le jeu. La prochaine etape consistera a produire un export reduit avec les
lignes bus vraiment jouables, en utilisant les poles et arrets comme indices.
