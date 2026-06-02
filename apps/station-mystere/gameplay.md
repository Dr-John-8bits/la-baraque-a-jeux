

# Gameplay

## Principe général

Station Mystère est un jeu quotidien en trois niveaux.

Le joueur doit identifier successivement :

1. une station de métro ;
2. une station V'Lille ;
3. une ligne de bus.

La progression est linéaire : le niveau 2 n'est accessible qu'après avoir réussi le niveau 1, et le niveau 3 n'est accessible qu'après avoir réussi le niveau 2.

---

## Périmètre des réponses par niveau

### Niveau 1 — Métro Mystère

La réponse attendue est le nom canonique d'une station de métro.

Le socle technique actuel contient les 60 stations des lignes M1 et M2, avec les correspondances et homonymies à traiter éditorialement.

### Niveau 2 — Vélo Mystère

La réponse attendue est le nom canonique d'une station V'Lille.

Le niveau doit s'appuyer sur les stations candidates du corpus V'Lille, après relecture des noms, des communes et des stations marquées `a-verifier`.

Les équipements cyclables remarquables peuvent enrichir les indices ou les fiches découverte, mais ne sont pas des réponses du MVP.

### Niveau 3 — Bus Mystère

La réponse attendue est une ligne de bus, par exemple son code public ou son nom d'usage.

Les arrêts, pôles de correspondance, terminus, communes desservies et variantes de parcours servent d'indices, mais ne sont pas des réponses du MVP.

Le corpus technique bus est volontairement complet. Une sélection de lignes jouables devra être extraite avant l'intégration au jeu, en privilégiant les lignes compréhensibles par le grand public et en mettant de côté les lignes scolaires, Résa ou spéciales tant que leur usage ludique n'est pas validé.

---

## Renouvellement quotidien

Le jeu se renouvelle tous les jours à midi, heure de Paris.

La même sélection quotidienne est proposée à tous les joueurs.

Le fonctionnement doit rester entièrement local, sans appel serveur.

---

## Score

Chaque niveau commence avec un score de 1000 points.

Le premier indice est gratuit.

Chaque indice supplémentaire fait perdre des points.

Le détail exact du barème reste à définir, mais le principe est :

- plus le joueur trouve tôt, plus le score est élevé ;
- demander un indice supplémentaire réduit le score ;
- le score ne peut pas descendre sous 0.

---

## Indices

Chaque énigme possède plusieurs indices ordonnés du plus général au plus précis.

Le premier indice est affiché automatiquement au début du niveau.

Les indices suivants sont révélés à la demande du joueur ou après une mauvaise proposition, selon une règle à préciser.

Types d'indices possibles :

- type de transport ;
- ligne, réseau ou type de ligne ;
- commune ;
- communes desservies ;
- quartier ;
- terminus ;
- arrêts ou pôles desservis ;
- proximité d'un lieu notable ;
- origine du nom ;
- signification du nom ;
- personnalité associée ;
- particularité de la station ;
- œuvre d'art ;
- architecture ;
- anecdote locale.

Exemples :

- « Je suis sur la ligne 1. »
- « Mon nom fait référence à un maréchal de Napoléon. »
- « Des aquariums sont visibles dans la station. »
- « Une œuvre d'art est intégrée à mon espace. »

---

## Propositions

Le joueur peut taper librement une réponse.

Pendant la saisie, une liste de suggestions apparaît avec les réponses correspondant aux caractères saisis.

Si le champ est vide, la liste complète des réponses possibles du niveau peut être affichée.

Cette logique permet :

- d'éviter les fautes d'orthographe bloquantes ;
- de garder une saisie rapide sur mobile ;
- de ne pas obliger le joueur à connaître exactement la graphie officielle.

La validation se fait sur l'identifiant canonique de la réponse, pas uniquement sur le texte affiché.

---

## Défaite

Le joueur peut perdre un niveau.

La condition précise de défaite reste à définir.

Pistes possibles :

- score tombé à 0 ;
- nombre maximum d'indices atteint ;
- nombre maximum de mauvaises propositions atteint.

Si le joueur perd un niveau, la progression quotidienne s'arrête à ce niveau.

---

## Révélation de la bonne réponse

Le comportement exact reste à trancher.

Deux options sont envisagées :

1. afficher immédiatement la bonne réponse après une défaite ;
2. ne révéler la réponse que le lendemain, après le renouvellement quotidien.

Cette décision devra être prise plus tard, en fonction du ton souhaité pour le jeu.

---

## Progression visuelle

En haut de l'écran, une progression visuelle indique les trois niveaux :

```txt
🚇 Métro  ───  🚲 Vélo  ───  🚌 Bus
```

Au chargement du jeu, seul le niveau Métro est actif.

Quand le niveau Métro est réussi, le niveau Vélo devient accessible et une ligne de progression s'affiche entre les deux icônes.

Quand le niveau Vélo est réussi, le niveau Bus devient accessible.

L'icône du niveau actif peut être animée afin de rendre la progression plus lisible.

Exemples :

- le métro pulse au niveau 1 ;
- le vélo s'anime au niveau 2 ;
- le bus s'anime au niveau 3.

---

## Coupes et médailles

Chaque niveau peut rapporter une coupe ou une médaille.

### Coupe

Une coupe est obtenue si le joueur réussit le niveau sans faute.

Un sans-faute signifie :

- aucune mauvaise proposition ;
- aucun indice payant utilisé ;
- résolution avec le premier indice gratuit.

### Médaille

Une médaille est obtenue si le joueur réussit le niveau, mais pas en sans-faute.

Exemples :

- le joueur a demandé un indice supplémentaire ;
- le joueur a fait une ou plusieurs mauvaises propositions ;
- le joueur a trouvé avec un score réduit.

---

## Récompenses quotidiennes

Le résultat quotidien dépend du niveau atteint.

- Réussite du niveau Métro : récompense de bronze.
- Réussite du niveau Vélo : récompense d'argent.
- Réussite du niveau Bus : récompense d'or.

La qualité de la récompense dépend de la performance :

- coupe si le niveau est réussi sans faute ;
- médaille si le niveau est réussi avec erreurs ou indices payants.

Exemple :

```txt
🚇 Métro : coupe de bronze
🚲 Vélo : médaille d'argent
🚌 Bus : échoué

Résultat du jour : médaille d'argent
```

---

## Fin de partie

La partie quotidienne se termine lorsque :

- le joueur réussit le niveau Bus ;
- ou le joueur échoue à un niveau ;
- ou le joueur abandonne.

À la fin, le jeu affiche :

- les niveaux réussis ;
- les scores obtenus ;
- les coupes ou médailles gagnées ;
- une phrase de partage éventuelle ;
- les fiches découvertes des réponses résolues.

---

## Statistiques locales

Les statistiques sont conservées dans le navigateur.

Données possibles :

- nombre de parties jouées ;
- meilleures performances ;
- nombre de coupes de bronze ;
- nombre de coupes d'argent ;
- nombre de coupes d'or ;
- nombre de médailles de bronze ;
- nombre de médailles d'argent ;
- nombre de médailles d'or ;
- série quotidienne en cours ;
- meilleure série.

---

## Points à trancher

- Barème exact des indices payants.
- Nombre maximal d'indices par niveau.
- Nombre maximal de mauvaises propositions.
- Révélation immédiate ou différée de la bonne réponse.
- Niveau de tolérance sur les réponses saisies.
- Formulation exacte du message de partage.
- Seuil de filtrage des stations V'Lille candidates.
- Périmètre exact des lignes bus jouables.
- Format de l'export réduit Bus Mystère à produire depuis `bus-network.json`.
