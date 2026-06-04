

# Sources de données

## Objectif du document

Ce document référence l'ensemble des sources de données utilisées pour construire le corpus documentaire de Station Mystère.

Il sert également de carnet de bord technique afin de conserver :

- les URLs des jeux de données ;
- les API utilisées ;
- les commandes terminal employées ;
- les traitements réalisés ;
- les limites identifiées ;
- les choix techniques effectués.

Ce document doit être mis à jour au fur et à mesure de l'avancement du projet.

---

## Principe directeur

Comme le reste du projet, les données de Station Mystère doivent s'intégrer dans l'écosystème documentaire de La Baraque à Jeux.

Les informations collectées ne doivent pas être pensées uniquement pour Station Mystère.

L'objectif est de constituer progressivement une base documentaire mutualisée pouvant être réutilisée dans :

- Station Mystère ;
- Le Mot à Biloute ;
- Lille-Mêle ;
- Vrai ou Bidon ;
- de futurs jeux du portail.

Les données doivent donc être conservées dans un format réutilisable et documenté.

---

# Niveau 1 — Métro Mystère

## Source principale

GTFS Ilévia.

Le GTFS constitue la source de référence pour les données de transport du réseau Ilévia.

Il permet notamment d'obtenir :

- les stations ;
- les lignes ;
- les identifiants techniques ;
- les coordonnées géographiques ;
- les correspondances ;
- la structure du réseau.

## Jeux de données attendus

### stops.txt

Contient notamment :

- identifiant ;
- nom de station ;
- latitude ;
- longitude.

### routes.txt

Contient les lignes du réseau.

### trips.txt

Permet d'associer les lignes aux trajets.

### stop_times.txt

Permet de reconstruire les dessertes et l'ordre des stations.

## Objectif

Construire une première base documentaire complète des stations de métro des lignes 1 et 2.

## État d'avancement

Socle technique généré le 2 juin 2026.

Livrable créé :

- `packages/corpus/station-mystere/metro-stations.json`

Résultat :

- 2 lignes de métro ;
- 60 stations jouables ;
- 18 stations sur M1 ;
- 44 stations sur M2 ;
- 2 correspondances métro identifiées : Gare Lille Flandres et Porte des Postes ;
- 1 homonymie réelle à traiter éditorialement : Hôtel de Ville.

Limites identifiées :

- les libellés viennent du GTFS et doivent être relus pour les accents, la casse et les abréviations ;
- certaines stations sont à cheval sur deux communes selon les points techniques GTFS/dataMEL ;
- les champs culturels, historiques et patrimoniaux restent à enrichir avec des sources éditoriales.

---

# Niveau 2 — Tramway Mystère

## Source principale

GTFS Ilévia.

Même source que pour le métro.

## Objectif

Construire une première base documentaire complète des stations du tramway lillois.

La réponse attendue dans Tramway Mystère est une station de tramway.

Le tramway Ilévia est exposé dans le GTFS comme une seule route `TRAM`, avec deux branches principales :

- branche Roubaix, terminus Eurotéléport ;
- branche Tourcoing, terminus Tourcoing Centre.

## État d'avancement

Socle technique généré le 3 juin 2026.

Livrable créé :

- `packages/corpus/station-mystere/tram-stations.json`

Résultat :

- 1 ligne tramway ;
- 2 branches principales ;
- 36 stations jouables ;
- 23 stations sur la branche Roubaix ;
- 22 stations sur la branche Tourcoing ;
- 9 stations sur le tronc commun ;
- 3 terminus identifiés : Gare Lille Flandres, Eurotéléport et Tourcoing Centre ;
- 26 parcours GTFS distincts détectés, dont 4 parcours représentatifs retenus pour structurer les branches.

Limites identifiées :

- le GTFS contient des variantes de service et des terminus partiels, notamment Brossolette, Buisson, Croisé Laroche et Victoire ;
- Gare Lille Flandres apparaît deux fois dans certains parcours GTFS et doit rester une seule station jouable ;
- les libellés viennent du GTFS et doivent être relus pour les accents, la casse et les abréviations ;
- les champs culturels, historiques et patrimoniaux restent à enrichir avec des sources éditoriales.

---

# Niveau 3 — Vélo Mystère

## Source principale

GBFS V'Lille.

### Index GBFS

https://media.ilevia.fr/opendata/gbfs.json

## Principe

Le flux GBFS fournit les données des stations V'Lille.

Les données sont obtenues en récupérant dynamiquement les URLs des flux disponibles via l'index GBFS.

## Flux utilisés

### station_information

Contient notamment :

- identifiant ;
- nom ;
- adresse ;
- coordonnées géographiques.

### station_status

Contient notamment :

- vélos disponibles ;
- places disponibles ;
- état de la station.

## Méthode retenue

1. Télécharger l'index GBFS.
2. Identifier les flux disponibles.
3. Télécharger station_information.
4. Télécharger station_status.
5. Fusionner les données via station_id.

## Objectif

Constituer une base documentaire des stations V'Lille.

## État d'avancement

Socle technique généré le 2 juin 2026.

Livrable créé :

- `packages/corpus/station-mystere/vlille-stations.json`

Résultat :

- 268 stations GBFS ;
- 255 stations candidates jouables ;
- 13 stations à vérifier avant usage en énigme ;
- 21 communes détectées par croisement géographique avec les limites communales de la MEL ;
- 5 146 places de capacité technique cumulée.

Stations à vérifier :

- stations temporairement sans location ou retour au moment de l'extraction ;
- stations à capacité nulle ;
- entrée `Metropole Europeenne de Lille (CB)`, présente dans `station_information` mais absente de `station_status`.

Limites identifiées :

- `station_status` est une photographie temps réel et ne doit pas déterminer seul le corpus quotidien ;
- `station_information` ne fournit pas directement la commune ;
- la commune est donc détectée par intersection géographique avec les limites de communes associées de la MEL ;
- les noms de stations viennent du flux technique et doivent être relus éditorialement.

---

# Niveau 4 — Bus Mystère

## Source principale

GTFS Ilévia.

Même source que pour le métro.

## Objectif

Constituer un inventaire complet du réseau bus Ilévia, puis en dériver un corpus réduit de lignes bus jouables.

Les arrêts, pôles d'échanges, terminus et communes desservies servent de matière documentaire pour les indices.

La réponse attendue dans le niveau Bus Mystère est une ligne de bus, pas un arrêt.

Exemples :

- lianes ;
- corolles ;
- citadines ;
- lignes régulières identifiables ;
- lignes desservant des pôles connus.

## État d'avancement

Socle technique généré le 2 juin 2026.

Livrable créé :

- `packages/corpus/station-mystere/bus-network.json`

Résultat :

- 143 lignes bus ;
- 626 parcours distincts ;
- 1 507 arrêts regroupés ;
- 3 089 points d'arrêt GTFS bruts utilisés ;
- 217 pôles candidats ;
- 407 candidats à étudier ;
- 883 arrêts conservés en inventaire ;
- 103 communes ou libellés de communes détectés.

Catégories de lignes détectées :

- 44 lignes régulières ;
- 13 lianes ;
- 3 corolles ;
- 5 citadines ;
- 22 lignes à la demande ou Résa ;
- 47 lignes scolaires ;
- 1 ligne de nuit ;
- 8 lignes spéciales.

Limites identifiées :

- le corpus complet est volumineux et ne devra probablement pas être chargé tel quel par le jeu ;
- les lignes scolaires, Résa et spéciales doivent être conservées dans l'inventaire mais pas forcément utilisées en énigme ;
- les pôles candidats sont détectés par heuristique et doivent être relus éditorialement ;
- certains libellés de commune issus du GTFS/dataMEL peuvent sortir du périmètre strict MEL ou nécessiter une normalisation manuelle ;
- les arrêts sont regroupés par nom et proximité géographique afin de réduire les doublons de quais ou de sens.

---

# Sources éditoriales

Ces sources servent à enrichir les données techniques avec du contenu culturel, historique et patrimonial.

## Sources prioritaires

- Ilévia ;
- MEL ;
- Ville de Lille ;
- Open Data MEL.

## Sources secondaires

- Wikipédia ;
- Wikidata ;
- presse locale ;
- archives ;
- publications patrimoniales.

---

# Types d'informations recherchées

Pour chaque station, ligne ou lieu, rechercher lorsque c'est possible :

- origine du nom ;
- personnalité associée ;
- événement historique ;
- œuvre d'art ;
- particularité architecturale ;
- anecdote locale ;
- élément remarquable ;
- spécificité du quartier.

Ces informations serviront directement à produire les indices du jeu.

---

# Commandes terminal

Section réservée aux commandes utilisées pour récupérer ou transformer les données.

## Niveau 1 — Métro Mystère

Vérifier la disponibilité du GTFS Ilévia :

```bash
curl -sI https://media.ilevia.fr/opendata/gtfs.zip
```

Télécharger le GTFS Ilévia :

```bash
curl -sSL https://media.ilevia.fr/opendata/gtfs.zip -o packages/corpus/documentation/raw/transport/ilevia-gtfs.zip
```

Décompresser le GTFS :

```bash
unzip -o packages/corpus/documentation/raw/transport/ilevia-gtfs.zip -d packages/corpus/documentation/raw/transport/ilevia-gtfs
```

Vérifier la disponibilité du GeoJSON des arrêts dataMEL :

```bash
curl -sI "https://data.lillemetropole.fr/geoserver/ogc/features/v1/collections/dsp_ilevia:arret_point/items?limit=10000&f=json"
```

Télécharger le GeoJSON des arrêts dataMEL :

```bash
curl -sSL "https://data.lillemetropole.fr/geoserver/ogc/features/v1/collections/dsp_ilevia:arret_point/items?limit=10000&f=json" -o packages/corpus/documentation/raw/transport/ilevia-arret-point.geojson
```

Générer le corpus technique Métro Mystère :

```bash
npm run build:station-metro
```

## Niveau 2 — Tramway Mystère

Le corpus tramway réutilise le GTFS Ilévia et le GeoJSON dataMEL déjà téléchargés pour le niveau Métro.

Générer le corpus technique Tramway Mystère :

```bash
npm run build:station-tram
```

## Niveau 3 — Vélo Mystère

Vérifier la disponibilité de l'index GBFS V'Lille :

```bash
curl -sI https://media.ilevia.fr/opendata/gbfs.json
```

Télécharger l'index GBFS :

```bash
curl -sSL https://media.ilevia.fr/opendata/gbfs.json -o packages/corpus/documentation/raw/transport/ilevia-gbfs/gbfs.json
```

Télécharger les informations stables des stations :

```bash
curl -sSL https://media.ilevia.fr/opendata/station_information.json -o packages/corpus/documentation/raw/transport/ilevia-gbfs/station_information.json
```

Télécharger la photographie des statuts :

```bash
curl -sSL https://media.ilevia.fr/opendata/station_status.json -o packages/corpus/documentation/raw/transport/ilevia-gbfs/station_status.json
```

Télécharger les informations système :

```bash
curl -sSL https://media.ilevia.fr/opendata/system_information.json -o packages/corpus/documentation/raw/transport/ilevia-gbfs/system_information.json
```

Télécharger les types de véhicules :

```bash
curl -sSL https://media.ilevia.fr/opendata/vehicle_types.json -o packages/corpus/documentation/raw/transport/ilevia-gbfs/vehicle_types.json
```

Générer le corpus technique Vélo Mystère :

```bash
npm run build:station-vlille
```

## Niveau 4 — Bus Mystère

Le corpus bus réutilise le GTFS Ilévia et le GeoJSON dataMEL déjà téléchargés pour le niveau Métro.

Générer le corpus technique Bus Mystère :

```bash
npm run build:station-bus
```

---

# Journal de recherche

Section destinée à consigner les découvertes, difficultés et décisions prises lors de la constitution du corpus.

## 2 juin 2026 — Première base technique métro

Le GTFS Ilévia public a été récupéré depuis `https://media.ilevia.fr/opendata/gtfs.zip`.

L'en-tête HTTP indiquait :

- `Last-Modified: Mon, 01 Jun 2026 23:19:15 GMT`
- `Content-Length: 7398492`

Le GeoJSON `dsp_ilevia:arret_point` a été récupéré depuis l'API OGC dataMEL avec `limit=10000`.

Constats :

- le GTFS contient des points techniques séparés par direction ;
- il faut regrouper les points par nom et proximité géographique pour obtenir des stations jouables ;
- le regroupement par nom et commune seul crée de faux doublons pour des stations limitrophes comme Square Flandres, Marbrerie, Canteleu ou Bois Blancs ;
- les correspondances métro détectées dans le corpus technique sont Gare Lille Flandres et Porte des Postes ;
- les deux stations nommées Hôtel de Ville sont bien distinctes et doivent rester différenciées dans le jeu.

Décision :

- conserver les données brutes dans `packages/corpus/documentation/raw/`, ignoré par Git ;
- versionner le corpus propre dans `packages/corpus/station-mystere/metro-stations.json` ;
- laisser les fiches découverte en statut `a-enrichir` tant que les informations éditoriales ne sont pas sourcées.

## 2 juin 2026 — Première base technique V'Lille

L'index GBFS V'Lille a été récupéré depuis `https://media.ilevia.fr/opendata/gbfs.json`.

L'en-tête HTTP indiquait :

- `Last-Modified: Tue, 02 Jun 2026 13:17:05 GMT`
- `Content-Length: 655`

Flux disponibles :

- `vehicle_types`
- `station_status`
- `system_information`
- `station_information`

Constats :

- `station_information` expose 268 stations ;
- `station_status` expose 267 statuts au moment de l'extraction ;
- l'entrée `Metropole Europeenne de Lille (CB)` est absente du statut temps réel ;
- les communes ne sont pas fournies par le GBFS ;
- la détection par polygone MEL associe les stations à 21 communes ;
- 13 stations doivent être relues avant d'être utilisées comme réponses d'énigme.

Décision :

- utiliser `station_information` comme source stable principale ;
- conserver `station_status` comme information technique datée, mais ne pas l'utiliser seule pour exclure définitivement une station ;
- marquer les stations douteuses avec `eligibiliteJeu.statut: "a-verifier"` ;
- conserver les fiches découverte en statut `a-enrichir` jusqu'au travail éditorial.

## 3 juin 2026 — Première base technique tramway

Le tramway a été extrait depuis le GTFS Ilévia.

Avant extraction, la disponibilité du GTFS a été revérifiée le 3 juin 2026.

L'en-tête HTTP indiquait :

- `Last-Modified: Tue, 02 Jun 2026 23:18:48 GMT`
- `Content-Length: 7391679`

Constats :

- le GTFS expose le tramway comme une seule route de type tramway (`route_type=0`) ;
- la route porte l'identifiant `71`, le nom court `TRAM` et la description `LILLE <> ROUBAIX / TOURCOING` ;
- les deux branches principales doivent être reconstruites à partir des parcours et des terminus ;
- les parcours représentatifs principaux sont Gare Lille Flandres → Eurotéléport et Gare Lille Flandres → Tourcoing Centre, avec leurs retours vers Gare Lille Flandres ;
- le corpus technique contient 36 stations jouables ;
- 9 stations appartiennent au tronc commun des deux branches ;
- Gare Lille Flandres est présente comme doublon technique dans certains parcours, mais doit être regroupée en une seule réponse jouable.

Décision :

- versionner le corpus propre dans `packages/corpus/station-mystere/tram-stations.json` ;
- représenter le tramway comme une ligne avec deux branches principales ;
- utiliser les branches, terminus et stations du tronc commun comme indices techniques ;
- laisser les fiches découverte en statut `a-enrichir` tant que les informations éditoriales ne sont pas sourcées.

## 4 juin 2026 — Premier format éditorial jouable

Le fichier `packages/corpus/station-mystere/editorial-entries.json` a été créé pour séparer le travail éditorial des corpus techniques générés.

Constats :

- les fichiers techniques doivent rester régénérables depuis les sources brutes ;
- les fiches jouables doivent donc vivre dans un fichier éditorial stable ;
- chaque fiche référence une réponse technique avec `technicalId` ;
- chaque fiche contient exactement cinq indices ;
- la fiche découverte reste sobre tant que les enrichissements patrimoniaux ne sont pas sourcés.

Premier lot créé :

- 5 fiches Métro Mystère ;
- 5 fiches Tramway Mystère.

Décision :

- utiliser `editorial-entries.json` comme source jouable du futur moteur ;
- valider les `technicalId` contre les corpus techniques ;
- étendre progressivement ce fichier avant de coder le jeu.

## 4 juin 2026 — Base documentaire transport mutualisable

Le fichier `packages/corpus/documentation/processed/transport/transport-places-notes.json` a été créé pour recevoir les informations documentaires collectées station par station.

Constats :

- les pages externes comme Wikipédia peuvent contenir des anecdotes utiles, mais leur contenu ne doit pas être recopié tel quel dans les fiches jouables ;
- certaines stations existent dans plusieurs niveaux, notamment Gare Lille Flandres qui concerne le métro et le tramway ;
- les corpus techniques sont régénérables, alors que les notes sourcées et reformulées doivent rester stables ;
- les fiches jouables doivent rester courtes, ce qui impose une réserve documentaire plus large en amont.

Première base créée puis synchronisée :

- 91 lieux mutualisés pour couvrir les stations Métro et Tramway ;
- 60 stations de métro ;
- 36 stations de tramway ;
- 5 stations communes aux deux réseaux, fusionnées dans une seule entrée documentaire ;
- champs prévus pour l'origine du nom, l'histoire, les anecdotes, les lieux proches et les atomes d'indices ;
- références techniques vers les niveaux métro et tramway ;
- emplacement pour les sources externes locales, par exemple une page Wikipédia précise ;
- validation des IDs, sources, URLs externes et références techniques.

Décision :

- utiliser `transport-places-notes.json` comme sas documentaire entre les sources collectées et `editorial-entries.json` ;
- mutualiser les lieux communs à plusieurs niveaux au lieu de dupliquer les notes ;
- conserver dans `editorial-entries.json` uniquement les formulations prêtes à être affichées au joueur.

Commande de synchronisation :

```bash
npm run sync:station-transport-notes
```

Cette commande est additive : elle complète le squelette depuis les corpus techniques, fusionne les IDs canoniques et conserve les notes éditoriales déjà saisies.

## 4 juin 2026 — Récupération locale des pages Wikipédia métro

Les pages Wikipédia des 60 stations de métro du corpus technique ont été récupérées via l'API MediaWiki de Wikipédia en français.

Commande :

```bash
npm run fetch:wikipedia-metro
```

Livrable local non versionné :

- `packages/corpus/documentation/raw/wikipedia/station-mystere/metro/`

Résultat :

- 60 pages trouvées sur 60 stations ;
- 60 fichiers `.wiki` avec le wikitexte intégral ;
- 60 fichiers `.html` avec le rendu HTML intégral fourni par l'API ;
- 60 fichiers `.json` avec les métadonnées, la révision, les liens et les sections ;
- 1 manifeste local `manifest.json` ;
- environ 4,5 Mo de données locales.

Décision :

- conserver ces fichiers dans `raw/`, donc hors Git et hors GitHub ;
- les utiliser comme matière documentaire pour l'analyse et la sélection d'informations ;
- reformuler les contenus retenus avant de les intégrer dans `transport-places-notes.json` ou `editorial-entries.json`.

## 4 juin 2026 — Récupération locale des pages Wikipédia tramway

Les pages Wikipédia disponibles pour les 36 stations de tramway du corpus technique ont été recherchées via la même API MediaWiki.

Commande :

```bash
npm run fetch:wikipedia-tram
```

Livrable local non versionné :

- `packages/corpus/documentation/raw/wikipedia/station-mystere/tramway/`

Résultat :

- 5 pages trouvées sur 36 stations ;
- 5 fichiers `.wiki` avec le wikitexte intégral ;
- 5 fichiers `.html` avec le rendu HTML intégral fourni par l'API ;
- 5 fichiers `.json` avec les métadonnées, la révision, les liens et les sections ;
- 1 manifeste local `manifest.json` ;
- 31 stations listées comme manquantes ou incertaines ;
- environ 428 Ko de données locales.

Pages récupérées :

- Eurotéléport ;
- Wasquehal - Pavé de Lille ;
- Gare Lille-Europe ;
- Gare Lille-Flandres ;
- Tourcoing - Centre.

Constat :

- la majorité des stations de tramway ne semble pas disposer d'une page Wikipédia dédiée ;
- les pages trouvées correspondent aux stations mixtes métro/tramway ;
- les pages de lieux proches, communes ou monuments n'ont pas été associées automatiquement aux stations afin d'éviter les faux positifs.

Décision :

- conserver les pages trouvées dans `raw/`, donc hors Git et hors GitHub ;
- garder les stations sans page dédiée dans le manifeste local ;
- traiter plus tard les lieux proches, monuments et communes comme sources complémentaires séparées.

## 2 juin 2026 — Première base technique bus

Le réseau bus a été extrait depuis le GTFS Ilévia rafraîchi le 2 juin 2026.

Constats :

- le GTFS expose 143 lignes de type bus (`route_type=3`) ;
- le réseau bus est nettement plus dense que les niveaux Métro, Tramway et V'Lille ;
- les 143 lignes incluent les lignes régulières, lianes, corolles, citadines, Résa, scolaires, nuit et spéciales ;
- 626 parcours distincts sont présents dans les horaires, certaines lignes ayant de nombreuses variantes ;
- les arrêts techniques GTFS doivent être regroupés pour éviter de traiter séparément les quais, sens ou variantes très proches ;
- un inventaire complet produit un fichier d'environ 11 Mo, trop lourd pour une utilisation directe dans le futur jeu quotidien.

Décision :

- conserver toutes les données dans `bus-network.json` pour le travail documentaire initial ;
- ajouter un statut heuristique `usageJeu` afin d'isoler des pôles candidats sans supprimer les autres arrêts ;
- utiliser les pôles candidats comme indices et matière documentaire ;
- préparer plus tard un export réduit consacré aux lignes bus réellement jouables ;
- ne pas figer maintenant le périmètre exact des lignes du niveau Bus Mystère.

Décision de gameplay :

- le niveau 1 demande de deviner une station de métro ;
- le niveau 2 demande de deviner une station de tramway ;
- le niveau 3 demande de deviner une station V'Lille ;
- le niveau 4 demande de deviner une ligne de bus.
