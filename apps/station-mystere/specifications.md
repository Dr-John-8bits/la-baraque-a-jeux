

# Spécifications fonctionnelles

## Objectif

Le joueur doit identifier des stations ou lignes liées aux transports de la métropole lilloise à partir d'indices progressifs.

Chaque jour, quatre énigmes sont proposées.

- 🥉 Métro Mystère
- 🥈 Tramway Mystère
- 🥇 Vélo Mystère
- 💎 Bus Mystère

Les quatre énigmes sont indépendantes mais partagent le même moteur de jeu.

Note de version :

- le moteur doit être pensé pour accueillir plusieurs niveaux à terme ;
- la première version jouable doit implémenter uniquement Métro Mystère ;
- le périmètre métro permet de valider la recherche de station, les indices, le score, le calepin, les statistiques et la fiche découverte avant d'élargir le jeu.

---

## Périmètre fonctionnel des réponses

Le moteur doit gérer plusieurs types de réponses.

### Métro Mystère

- Type de réponse : station de métro.
- Source technique : `packages/corpus/station-mystere/metro-stations.json`.
- Périmètre initial : stations des lignes M1 et M2.

### Tramway Mystère

- Type de réponse : station de tramway.
- Source technique : `packages/corpus/station-mystere/tram-stations.json`.
- Périmètre initial : 36 stations de la ligne de tramway Ilévia, branches Roubaix et Tourcoing incluses.

### Vélo Mystère

- Type de réponse : station V'Lille.
- Source technique : `packages/corpus/station-mystere/vlille-stations.json`.
- Périmètre initial : stations candidates, avec exclusion ou relecture préalable des stations marquées `a-verifier`.

### Bus Mystère

- Type de réponse : ligne de bus.
- Source technique initiale : `packages/corpus/station-mystere/bus-network.json`.
- Périmètre initial : sélection éditoriale de lignes jouables à produire dans un export réduit.
- Les arrêts, pôles, terminus et communes desservies alimentent les indices, mais ne sont pas les réponses du MVP.

---

## Boucle de jeu

Pour chaque épreuve :

1. Le joueur découvre le titre de l'épreuve.
2. Un premier indice est affiché.
3. Le joueur peut proposer une réponse.
4. S'il échoue, une pénalité est appliquée.
5. Le joueur peut demander un nouvel indice payant.
6. Le joueur continue jusqu'à trouver la bonne réponse ou atteindre un score de 0.
7. Une fiche documentaire est affichée après la résolution ou la défaite.

---

## Score et défaite

Chaque niveau commence à 1000 points.

Barème :

- indice 1 : gratuit ;
- indice 2 : -150 points ;
- indice 3 : -200 points ;
- indice 4 : -250 points ;
- indice 5 : -300 points ;
- mauvaise réponse : -100 points ;
- score minimum : 0.

La défaite survient dès que le score du niveau atteint 0.

Une défaite arrête la progression quotidienne au niveau en cours.

La bonne réponse est alors révélée immédiatement avec sa fiche documentaire.

---

## Système d'indices

Les indices sont révélés un par un.

Chaque énigme possède cinq indices maximum.

Le premier indice est gratuit et affiché automatiquement.

Les indices 2 à 5 sont payants.

Types d'indices possibles :

- ligne de métro ;
- code ou nom public d'une ligne ;
- commune ;
- communes desservies ;
- quartier ;
- réseau de transport ;
- terminus ;
- arrêts ou pôles desservis ;
- origine du nom ;
- personnalité associée ;
- œuvre d'art ;
- particularité architecturale ;
- anecdote historique ;
- proximité d'un lieu remarquable ;
- nombre de lignes desservies ;
- correspondance.

L'ordre des indices doit aller du plus général au plus précis.

---

## Tentatives

Le joueur peut effectuer autant de propositions qu'il le souhaite.

Les propositions sont vérifiées localement.

Chaque mauvaise proposition retire 100 points.

Une liste de suggestions est affichée lors de la saisie afin d'éviter les fautes d'orthographe.

---

## Attribution des coupes

🥉 Coupe de Bronze

- Métro Mystère réussi.

🥈 Coupe d'Argent

- Métro Mystère réussi.
- Tramway Mystère réussi.

🥇 Coupe d'Or

- Métro Mystère réussi.
- Tramway Mystère réussi.
- Vélo Mystère réussi.

💎 Coupe de Platine

- Métro Mystère réussi.
- Tramway Mystère réussi.
- Vélo Mystère réussi.
- Bus Mystère réussi.

---

## Fiche découverte

Après chaque résolution, le jeu affiche :

- le nom de la station ou de la ligne ;
- une courte description ;
- l'origine du nom, lorsque l'information est disponible ;
- les particularités notables ;
- les lieux ou communes desservis, lorsque c'est pertinent ;
- une anecdote éventuelle.

L'objectif est d'ajouter une dimension culturelle et patrimoniale au jeu.

Après une défaite, la même fiche découverte est affichée avec la bonne réponse.

---

## Énigme quotidienne

Les énigmes du jour sont identiques pour tous les joueurs.

Le choix des énigmes dépend uniquement de la date du jour.

Aucun serveur n'est nécessaire.

---

## Sauvegarde locale

Le navigateur conserve :

- les énigmes déjà résolues ;
- les coupes obtenues ;
- les statistiques globales ;
- la dernière session en cours.

Utilisation exclusive de LocalStorage.

---

## Accessibilité

Le jeu doit être entièrement utilisable :

- au doigt ;
- à la souris ;
- au clavier.

Le contraste doit être suffisant pour une utilisation mobile en extérieur.

---

## Architecture des données

Chaque réponse jouable est représentée par une fiche éditoriale JSON séparée des corpus techniques.

Les corpus techniques servent à vérifier les lignes, branches, communes, terminus et identifiants.

Le fichier `packages/corpus/documentation/processed/transport/transport-places-notes.json` sert de réserve documentaire mutualisable. Il reçoit les notes sourcées, les anecdotes, les origines de noms et les repères de quartier avant sélection éditoriale.

Le fichier `packages/corpus/station-mystere/editorial-entries.json` contient les réponses réellement utilisables par le jeu : réponse canonique, réponses acceptées, cinq indices, fiche découverte et sources.

Exemple de fiche station :

```json
{
  "id": "metro-gare-lille-flandres",
  "niveau": "metro",
  "typeReponse": "station",
  "technicalId": "gare-lille-flandres",
  "reponse": "Gare Lille Flandres",
  "reponsesAcceptees": [
    "Gare Lille Flandres",
    "Lille Flandres"
  ],
  "indices": [
    {
      "ordre": 1,
      "type": "transport",
      "texte": "Je suis une station du métro Ilévia."
    }
  ],
  "ficheDecouverte": {
    "titre": "Gare Lille Flandres",
    "texte": "Courte fiche affichée après résolution.",
    "faits": [],
    "sourceIds": []
  },
  "sourceIds": []
}
```

Exemple de fiche ligne bus :

```json
{
  "id": "bus-l5",
  "type": "bus-line",
  "niveau": "bus",
  "nom": "L5",
  "description": "Ligne de bus du réseau Ilévia.",
  "terminus": [],
  "communes": [],
  "polesIndices": [],
  "indices": [
    "Je suis une ligne de bus",
    "Je dessers plusieurs communes de la métropole",
    "Mes terminus peuvent aider à m'identifier"
  ]
}
```

---

## Hors périmètre MVP

- comptes utilisateurs ;
- classement en ligne ;
- multijoueur ;
- géolocalisation ;
- cartes interactives ;
- backend ;
- API temps réel ;
- utilisation de tous les arrêts bus comme réponses jouables.
