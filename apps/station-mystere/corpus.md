

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

---

## Structure minimale d'une fiche

Chaque fiche doit contenir au minimum :

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

Le corpus technique contient déjà les 36 stations du tramway et doit maintenant être enrichi éditorialement.

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

---

## Réutilisation future

Le corpus doit être conçu pour pouvoir être réutilisé dans d'autres jeux de La Baraque à Jeux.

Aucune information ne doit être stockée uniquement pour Station Mystère lorsqu'elle peut également être utile à un autre jeu.

La mutualisation des données est un objectif central du projet.
