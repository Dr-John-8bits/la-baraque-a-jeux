# Roadmap

## Principe directeur

Avant toute considération technique, Station Mystère doit s'intégrer naturellement dans l'écosystème de La Baraque à Jeux.

Le jeu ne doit pas être conçu comme une application isolée.

Il doit reprendre les principes déjà présents dans les autres jeux du portail :

- même identité visuelle ;
- même ergonomie générale ;
- même philosophie mobile-first ;
- mêmes composants d'interface lorsque cela est pertinent ;
- même système de partage des résultats ;
- même logique de jeu quotidien ;
- même ton éditorial ;
- même navigation entre les jeux.

Lorsqu'un choix est possible entre une solution originale et une solution cohérente avec les autres jeux de La Baraque à Jeux, la cohérence avec l'écosystème existant doit être privilégiée.

---

## Phase 1 — Analyse de l'existant

Objectif : comprendre et réutiliser les mécanismes déjà présents dans le portail.

Travaux :

- analyser Le Mot à Biloute ;
- analyser Lille-Mêle ;
- analyser Ch'tifoumi ;
- identifier les composants réutilisables ;
- identifier les conventions visuelles ;
- identifier les mécanismes de partage ;
- identifier les mécanismes de sauvegarde locale ;
- identifier les composants communs pouvant être mutualisés.

Livrable :

- document d'inventaire des composants réutilisables.

---

## Phase 2 — Travail préparatoire sur le corpus avec assistant

Objectif : constituer une première base documentaire propre avant de lancer le développement avec Codex.

Cette phase est menée manuellement avec l'assistant, avant l'implémentation technique.

Travaux :

- identifier les sources de données ouvertes utiles ;
- écrire les commandes terminal permettant de télécharger ou questionner ces sources ;
- récupérer les données brutes utiles ;
- nettoyer les exports ;
- isoler les informations exploitables pour le jeu ;
- documenter les limites des données récupérées ;
- préparer les premières fiches candidates.

Priorité de travail :

1. niveau 1 — métro ;
2. niveau 2 — tramway ;
3. niveau 3 — V'Lille ;
4. niveau 4 — bus.

Pour le niveau 1, le premier chantier consiste à requêter les données Ilévia afin de récupérer les stations de métro, leurs lignes, leurs identifiants et leurs informations de base.

Livrable :

- premiers fichiers de données brutes et nettoyées pour les niveaux Métro, Tramway, Vélo et Bus ;
- socle technique Tramway Mystère extrait du GTFS Ilévia ;
- inventaire technique complet du bus, à réduire ensuite en corpus de lignes jouables.

---

## Phase 3 — Modèle de données

Objectif : définir le format unique des données du jeu à partir des premiers corpus récupérés.

Travaux :

- définir les structures JSON ;
- définir les types de réponses ;
- définir les types d'indices ;
- définir le système de sélection quotidienne ;
- définir les identifiants uniques ;
- distinguer les données brutes issues des API des données éditoriales enrichies à la main ;
- gérer à la fois des réponses de type station et des réponses de type ligne.

Livrable :

- schéma JSON documenté.

---

## Phase 4 — Constitution du corpus éditorial

Objectif : enrichir les données brutes avec des informations culturelles, historiques et patrimoniales.

Travaux :

### Métro

- stations ligne 1 ;
- stations ligne 2 ;
- origine des noms ;
- anecdotes ;
- œuvres d'art ;
- particularités architecturales.

### Tramway

- stations de la branche Roubaix ;
- stations de la branche Tourcoing ;
- stations du tronc commun ;
- terminus ;
- origine des noms ;
- anecdotes ;
- repères de quartier utiles aux indices.

### Vélo

- stations V'Lille ;
- relecture des stations candidates ;
- exclusion ou validation des stations marquées à vérifier ;
- lieux cyclables remarquables comme matière d'indices ;
- informations utiles à la création d'indices.

### Bus

- sélection des lignes bus jouables ;
- terminus ;
- communes desservies ;
- principaux pôles et arrêts comme indices ;
- correspondances majeures ;
- mise à l'écart éventuelle des lignes scolaires, Résa et spéciales pour le MVP.

Livrable :

- premier corpus éditorial exploitable pour les quatre niveaux.

---

## Phase 5 — Moteur de jeu

Objectif : développer la logique principale.

Travaux :

- sélection de l'énigme du jour ;
- affichage progressif des indices ;
- validation des réponses ;
- calcul du score ;
- attribution des coupes ;
- attribution des médailles ;
- sauvegarde locale.

Livrable :

- moteur jouable sans interface finalisée.

---

## Phase 6 — Interface utilisateur

Objectif : intégrer le moteur dans l'univers de La Baraque à Jeux.

Travaux :

- fil de progression Métro → Tramway → Vélo → Bus ;
- animation du niveau actif ;
- écran de victoire ;
- écran de défaite ;
- écran de statistiques ;
- adaptation mobile ;
- cohérence graphique avec les autres jeux.

Livrable :

- première version complète jouable.

---

## Phase 7 — Partage et statistiques

Objectif : harmoniser l'expérience avec les autres jeux du portail.

Travaux :

- partage des résultats ;
- format de score ;
- récapitulatif quotidien ;
- suivi des séries ;
- historique local.

Le comportement doit être cohérent avec les mécanismes déjà présents dans La Baraque à Jeux.

Livrable :

- expérience quotidienne complète.

---

## Phase 8 — Finalisation

Objectif : préparer l'intégration officielle dans le portail.

Travaux :

- optimisation mobile ;
- vérifications d'accessibilité ;
- vérifications des performances ;
- rédaction des pages d'aide ;
- rédaction de la page À propos ;
- intégration dans la page d'accueil de La Baraque à Jeux.

Livrable :

- version de production.

---

## Priorités absolues

1. Cohérence avec La Baraque à Jeux.
2. Constitution d'un corpus fiable avant développement.
3. Démarrage par le niveau Métro Mystère.
4. Jeu entièrement autonome dans le navigateur.
5. Aucune dépendance à un backend.
6. Réutilisation maximale des composants existants.
7. Découverte de Lille et de la MEL par le jeu.
8. Simplicité d'utilisation sur smartphone.
9. Maintenance minimale à long terme.
