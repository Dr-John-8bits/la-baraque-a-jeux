

# Spécifications fonctionnelles

## Objectif

Le joueur doit identifier des stations ou lignes liées aux transports de la métropole lilloise à partir d'indices progressifs.

Chaque jour, trois énigmes sont proposées.

- 🥉 Métro Mystère
- 🥈 Vélo Mystère
- 🥇 Bus Mystère

Les trois énigmes sont indépendantes mais partagent le même moteur de jeu.

---

## Périmètre fonctionnel des réponses

Le moteur doit gérer plusieurs types de réponses.

### Métro Mystère

- Type de réponse : station de métro.
- Source technique : `packages/corpus/station-mystere/metro-stations.json`.
- Périmètre initial : stations des lignes M1 et M2.

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
4. S'il échoue, un nouvel indice est révélé.
5. Le joueur continue jusqu'à trouver la bonne réponse ou épuiser tous les indices.
6. Une fiche documentaire est affichée après la résolution.

---

## Système d'indices

Les indices sont révélés un par un.

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

Une liste de suggestions est affichée lors de la saisie afin d'éviter les fautes d'orthographe.

---

## Attribution des coupes

🥉 Coupe de Bronze

- Métro Mystère réussi.

🥈 Coupe d'Argent

- Métro Mystère réussi.
- Vélo Mystère réussi.

🥇 Coupe d'Or

- Métro Mystère réussi.
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

Chaque réponse jouable est représentée par une fiche JSON.

Exemple de fiche station :

```json
{
  "id": "montebello",
  "type": "metro",
  "nom": "Montebello",
  "commune": "Lille",
  "ligne": "1",
  "origine": "Nom du duc de Montebello",
  "particularites": [
    "Aquariums dans la station"
  ],
  "indices": [
    "Je suis sur la ligne 1",
    "Je suis située à Lille",
    "Mon nom est celui d'un maréchal de Napoléon",
    "Des aquariums sont visibles dans la station"
  ]
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
