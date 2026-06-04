

# Corpus documentaire

## Principe directeur

Comme le reste du projet, le corpus de Station Mystère ne doit pas être conçu comme une ressource isolée.

Il doit s'intégrer dans l'écosystème documentaire de La Baraque à Jeux.

Lorsqu'une information existe déjà dans un corpus partagé du portail, elle doit être réutilisée plutôt que dupliquée.

L'objectif est de constituer progressivement une base documentaire commune pouvant alimenter plusieurs jeux :

- Station Mystère ;
- Le Mot à Biloute ;
- Lille-Mêle ;
- futurs jeux du portail.

Le corpus doit être pensé comme un patrimoine commun réutilisable à long terme.

---

## Objectifs du corpus

Le corpus a trois fonctions principales.

### Alimenter les énigmes

Permettre la génération des indices et des réponses du jeu.

### Alimenter les fiches découvertes

Permettre l'affichage d'informations culturelles après chaque résolution.

### Mutualiser les connaissances

Créer progressivement une base documentaire cohérente sur Lille, la MEL, les transports et le patrimoine local.

---

## Structure générale

Le corpus est organisé autour de fiches documentaires.

Chaque fiche peut représenter une réponse jouable ou une entité documentaire utilisée pour construire des indices.

Exemples :

- station de métro ;
- station de tramway ;
- station V'Lille ;
- ligne de bus ;
- arrêt de bus ;
- pôle d'échanges ;
- équipement de mobilité ;
- lieu remarquable lié aux transports.

Les données techniques et les données éditoriales sont séparées.

Les fichiers techniques comme `metro-stations.json`, `tram-stations.json`, `vlille-stations.json` et `bus-network.json` peuvent être régénérés depuis les sources brutes.

Le fichier `editorial-entries.json` contient les fiches jouables : réponse canonique, réponses acceptées, cinq indices ordonnés, fiche découverte, tags et sources. Il référence les données techniques avec `technicalId`.

---

## Base mutualisable des notes transport

Le fichier `packages/corpus/documentation/processed/transport/transport-places-notes.json` sert de réserve documentaire commune pour les stations, lignes, pôles et lieux liés aux transports.

Il ne remplace pas `editorial-entries.json`.

Son rôle est de recevoir les informations collectées station par station avant la rédaction finale des énigmes.

Chaque entrée peut contenir :

- des références vers les corpus techniques Station Mystère ;
- des sources communes issues de `sources.json` ;
- des sources externes locales, par exemple une page Wikipédia précise ;
- des notes d'origine du nom ;
- des notes historiques ;
- des anecdotes ;
- des repères de quartier ;
- des atomes d'indices.

Une même entrée peut alimenter plusieurs niveaux. Par exemple, Gare Lille Flandres est à la fois une station de métro et une station de tramway. Ses notes documentaires doivent donc être mutualisées au lieu d'être recopiées dans deux fiches.

Le squelette actuel couvre :

- 91 lieux mutualisés ;
- 60 stations de métro ;
- 36 stations de tramway ;
- 5 stations communes au métro et au tramway.

La commande de synchronisation est :

```bash
npm run sync:station-transport-notes
```

Elle ajoute les lieux manquants depuis les corpus techniques Métro et Tramway sans écraser les notes, anecdotes ou sources externes déjà ajoutées.

Le flux recommandé est :

1. Collecter ou rapatrier les informations brutes avec leurs sources.
2. Les ranger dans `transport-places-notes.json`.
3. Relire, sourcer et reformuler les notes.
4. Transformer seulement les meilleurs éléments en indices et fiches découverte dans `editorial-entries.json`.

Ce choix permet de construire une vraie base documentaire réutilisable par Station Mystère, mais aussi par de futurs jeux du portail.

---

## Sources prioritaires

### Sources officielles

À privilégier systématiquement.

- Ilévia ;
- V'Lille ;
- MEL Open Data ;
- Ville de Lille ;
- communes concernées ;
- institutions culturelles.

### Sources secondaires

Utilisables pour enrichir les fiches.

- Wikipédia ;
- Wikidata ;
- articles de presse ;
- publications patrimoniales ;
- archives locales.

Chaque information importante doit idéalement être traçable à une source.

Les pages Wikipédia complètes disponibles sont conservées localement dans `packages/corpus/documentation/raw/wikipedia/station-mystere/`.

Ce dossier est ignoré par Git. Il sert uniquement à l'analyse documentaire et à la reformulation. Les textes bruts ne doivent pas être publiés dans les fichiers jouables.

État local actuel :

- métro : 60 pages trouvées sur 60 stations ;
- tramway : 5 pages trouvées sur 36 stations, uniquement pour des stations mixtes métro/tramway avec fiche dédiée.

---

## Structure minimale d'une fiche

Chaque fiche technique doit contenir au minimum :

```json
{
  "id": "montebello",
  "type": "metro",
  "nom": "Montebello",
  "commune": "Lille",
  "description": "Station de la ligne 1 du métro de Lille.",
  "indices": [],
  "sources": []
}
```

Chaque fiche éditoriale jouable doit contenir au minimum :

```json
{
  "id": "metro-gare-lille-flandres",
  "niveau": "metro",
  "typeReponse": "station",
  "technicalId": "gare-lille-flandres",
  "reponse": "Gare Lille Flandres",
  "reponsesAcceptees": ["Gare Lille Flandres", "Lille Flandres"],
  "indices": [],
  "ficheDecouverte": {
    "titre": "Gare Lille Flandres",
    "texte": "Courte fiche affichée après résolution.",
    "faits": [],
    "sourceIds": []
  },
  "sourceIds": []
}
```

---

## Champs recommandés

### Identification

- id
- type
- nom
- réseau

### Localisation

- commune
- quartier
- coordonnées

### Culture et patrimoine

- origine du nom
- personnalité associée
- anecdote
- histoire

### Particularités

- œuvre d'art
- architecture
- spécificité technique
- équipement remarquable

### Jeu

- liste d'indices
- difficulté
- niveau concerné

---

## Types de réponses

### Métro

Réponses destinées au niveau Métro Mystère.

La réponse attendue est une station de métro.

Exemples :

- Rihour ;
- Montebello ;
- République Beaux-Arts ;
- CHR B-Calmette.

### Tramway

Réponses destinées au niveau Tramway Mystère.

La réponse attendue est une station du tramway Ilévia.

Exemples :

- Gare Lille Flandres ;
- Croisé Laroche ;
- Villa Cavrois ;
- Tourcoing Centre ;
- Eurotéléport.

Les branches Roubaix et Tourcoing, les terminus et le tronc commun servent à construire les indices.

---

### Vélo

Réponses destinées au niveau Vélo Mystère.

La réponse attendue est une station V'Lille issue du corpus candidat relu.

Exemples :

- stations V'Lille ;
- stations de quartier ;
- stations proches de lieux reconnaissables.

Les pôles vélo et équipements cyclables remarquables peuvent enrichir les indices, mais ne sont pas des réponses du MVP.

---

### Bus

Réponses destinées au niveau Bus Mystère.

La réponse attendue est une ligne de bus.

Exemples :

- lianes ;
- corolles ;
- citadines ;
- lignes régulières identifiables.

Les arrêts, pôles de correspondance, terminus et communes desservies sont conservés comme matière documentaire et comme indices.

Le corpus technique complet `bus-network.json` ne doit pas être chargé tel quel par le jeu. Il sert de base de travail pour produire ensuite un corpus réduit de lignes bus jouables.

---

## Catégories d'indices

Les indices doivent être classés afin de permettre une révélation progressive.

### Géographie

- commune ;
- quartier ;
- proximité ;
- position dans le réseau.

### Transport

- ligne ;
- correspondance ;
- terminus ;
- arrêts ou pôles desservis ;
- catégorie de ligne ;
- fréquentation.

### Histoire

- origine du nom ;
- événement historique ;
- date d'ouverture.

### Culture

- œuvre d'art ;
- artiste ;
- personnage ;
- patrimoine.

### Anecdotes

- particularités insolites ;
- faits peu connus ;
- éléments remarquables.

---

## Règles éditoriales

Les fiches doivent privilégier :

- les informations vérifiables ;
- les formulations courtes ;
- les anecdotes intéressantes ;
- les éléments utiles au jeu.

À éviter :

- les textes trop longs ;
- les informations non sourcées ;
- les opinions ;
- les contenus promotionnels.

---

## Priorités de collecte

### Priorité 1

Métro lillois.

Objectif : rendre Métro Mystère entièrement jouable.

---

### Priorité 2

Tramway lillois.

Objectif : rendre Tramway Mystère entièrement jouable.

Le corpus technique contient déjà les 36 stations du tramway. Un premier lot de fiches éditoriales existe dans `editorial-entries.json` et doit maintenant être étendu.

---

### Priorité 3

Stations V'Lille candidates.

Objectif : rendre Vélo Mystère jouable.

Les équipements cyclables restent utiles pour enrichir les indices, mais ne sont pas prioritaires comme réponses.

---

### Priorité 4

Lignes bus jouables.

Objectif : rendre Bus Mystère jouable.

Le travail doit partir de l'inventaire complet du réseau bus, puis sélectionner un périmètre raisonnable de lignes à proposer comme réponses.

Les lignes scolaires, Résa et spéciales doivent rester documentées, mais pourront être exclues du MVP si elles rendent le niveau trop arbitraire.

---

### Priorité 5

Enrichissement culturel.

Objectif : améliorer la qualité des indices et des fiches découvertes.

Les informations collectées doivent d'abord rejoindre `transport-places-notes.json`, puis être transformées en fiches jouables dans `editorial-entries.json` après relecture.

---

## Réutilisation future

Le corpus doit être conçu pour pouvoir être réutilisé dans d'autres jeux de La Baraque à Jeux.

Aucune information ne doit être stockée uniquement pour Station Mystère lorsqu'elle peut également être utile à un autre jeu.

La mutualisation des données est un objectif central du projet.
