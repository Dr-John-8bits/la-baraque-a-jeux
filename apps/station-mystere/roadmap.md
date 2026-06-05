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

## État au 5 juin 2026

Le projet est encore en phase corpus.

Le développement du jeu n'a pas commencé volontairement. La priorité actuelle est de construire une base documentaire solide, mutualisable et sourcée avant de produire le moteur de jeu.

Éléments cadrés :

- gameplay quotidien en quatre niveaux ;
- cadrage game design v1 centré sur Métro Mystère ;
- niveau 1 : Métro Mystère, réponse attendue station de métro ;
- niveau 2 : Tramway Mystère, réponse attendue station de tramway ;
- niveau 3 : Vélo Mystère, réponse attendue station V'Lille ;
- niveau 4 : Bus Mystère, réponse attendue ligne de bus ;
- barème de score et condition de défaite ;
- révélation de la réponse avec fiche découverte après victoire ou défaite ;
- séparation entre corpus technique, réserve documentaire et fiches jouables.
- principe d'interface : panneau de station mystère, recherche de station, calepin, stats et fiche découverte.

Éléments réalisés :

- page placeholder Station Mystère dans `apps/station-mystere/` ;
- tuile Station Mystère sur l'index du portail ;
- actualité de blog annonçant le projet ;
- socle technique Métro Mystère : 60 stations ;
- socle technique Tramway Mystère : 36 stations ;
- socle technique Vélo Mystère : 268 stations V'Lille, dont 255 candidates ;
- inventaire technique Bus Mystère : 143 lignes bus ;
- premier fichier `editorial-entries.json` avec 10 fiches jouables de départ ;
- corpus jouable Métro Mystère v1 : 60 fiches métro dans `editorial-entries.json` ;
- réserve documentaire mutualisée `transport-places-notes.json` ;
- squelette documentaire mutualisé Métro + Tramway : 91 lieux, dont 5 lieux communs ;
- récupération locale hors Git des pages Wikipédia métro : 60 pages sur 60 ;
- récupération locale hors Git des pages Wikipédia tramway disponibles : 5 pages sur 36 ;
- lot pilote métro analysé et intégré à la réserve documentaire : Gare Lille-Flandres, Rihour, République Beaux-Arts, Porte des Postes, 4 Cantons Stade P. Mauroy ;
- ligne M1 entièrement enrichie dans la réserve documentaire : 18 stations sur 18 ;
- ligne M2 entièrement enrichie dans la réserve documentaire : 44 stations sur 44 ;
- corpus documentaire métro complet : 60 stations enrichies sur 60.
- document de game design v1 : `apps/station-mystere/game-design.md`.
- document `game-design.md` renforcé comme référence principale pour lancer le développement de la v1.
- plan d'implémentation v1 : `apps/station-mystere/implementation-plan.md`.

Constat important :

- le métro dispose d'une couverture Wikipédia station par station complète ;
- le tramway dispose de peu de pages dédiées, il faudra donc compléter avec des sources de contexte : Grand Boulevard, communes, lieux proches, patrimoine, Ilévia, MEL et sources locales ;
- les fichiers Wikipédia complets restent dans `packages/corpus/documentation/raw/`, ignoré par Git.

Position actuelle dans la roadmap :

- phases 2 et 3 largement avancées ;
- phase 4 complète côté métro pour la réserve documentaire et les fiches jouables v1 ;
- phase 1 cadrée dans `game-design.md` pour le périmètre v1 ;
- plan technique d'exécution disponible dans `implementation-plan.md` ;
- développement du jeu prêt à démarrer pour une v1 centrée sur Métro Mystère ;
- tramway, V'Lille et bus reportés à une v2 ou à des itérations ultérieures.

---

## Phase 1 — Analyse de l'existant

Objectif : comprendre et réutiliser les mécanismes déjà présents dans le portail.

Statut : cadrage initial réalisé, à compléter si besoin avant le développement du moteur.

Travaux :

- analyser Le Mot à Biloute ;
- analyser Lille-Mêle ;
- analyser Ch'tifoumi ;
- identifier les composants réutilisables ;
- identifier les conventions visuelles ;
- identifier les mécanismes de partage ;
- identifier les mécanismes de sauvegarde locale ;
- identifier les composants communs pouvant être mutualisés.
- cadrer le flow v1, la recherche de station, le calepin, les stats et la fiche découverte.

Livrable :

- document de game design et d'inventaire des composants réutilisables : `game-design.md`.

---

## Phase 2 — Travail préparatoire sur le corpus avec assistant

Objectif : constituer une première base documentaire propre avant de lancer le développement avec Codex.

Cette phase est menée manuellement avec l'assistant, avant l'implémentation technique.

Statut : largement avancée.

Travaux :

- identifier les sources de données ouvertes utiles ;
- écrire les commandes terminal permettant de télécharger ou questionner ces sources ;
- récupérer les données brutes utiles ;
- nettoyer les exports ;
- isoler les informations exploitables pour le jeu ;
- documenter les limites des données récupérées ;
- créer une réserve documentaire transport mutualisable ;
- préparer les premières fiches candidates.
- récupérer localement les pages Wikipédia utiles, sans les versionner ;
- consigner les limites de couverture des sources.

Priorité de travail :

1. niveau 1 — métro ;
2. niveau 2 — tramway ;
3. niveau 3 — V'Lille ;
4. niveau 4 — bus.

Le premier chantier Ilévia est réalisé pour les quatre niveaux techniques. Le prochain chantier de corpus n'est plus la récupération, mais l'analyse et la sélection éditoriale.

Livrable :

- fichiers de données brutes et nettoyées pour les niveaux Métro, Tramway, Vélo et Bus ;
- socles techniques Métro, Tramway et Vélo ;
- inventaire technique complet du bus, à réduire ensuite en corpus de lignes jouables ;
- base `transport-places-notes.json` prête à recevoir les notes station par station ;
- pages Wikipédia métro et tramway disponibles stockées localement hors Git.

---

## Phase 3 — Modèle de données

Objectif : définir le format unique des données du jeu à partir des premiers corpus récupérés.

Statut : première version en place, à ajuster pendant l'analyse éditoriale.

Travaux :

- définir les structures JSON ;
- définir les types de réponses ;
- définir les types d'indices ;
- définir le système de sélection quotidienne ;
- définir les identifiants uniques ;
- distinguer les données brutes issues des API des données éditoriales enrichies à la main ;
- gérer à la fois des réponses de type station et des réponses de type ligne ;
- stabiliser `editorial-entries.json` comme fichier des fiches jouables ;
- stabiliser `transport-places-notes.json` comme réserve mutualisée des notes transport ;
- valider les références techniques et les sources.

Livrable :

- format JSON documenté et contrôlé par `npm run check:corpus`.

---

## Phase 4 — Constitution du corpus éditorial

Objectif : enrichir les données brutes avec des informations culturelles, historiques et patrimoniales.

Statut : démarrée avec un lot pilote métro.

Principe :

- analyser les sources brutes ;
- extraire seulement les faits utiles ;
- ranger les notes dans `transport-places-notes.json` ;
- reformuler avant toute publication ;
- produire ensuite les fiches jouables dans `editorial-entries.json`.

Travaux :

### Métro

- stations ligne 1 ;
- stations ligne 2 ;
- origine des noms ;
- anecdotes ;
- œuvres d'art ;
- particularités architecturales ;
- analyse des 60 pages Wikipédia récupérées localement ;
- alimentation de `transport-places-notes.json` avant rédaction des fiches jouables ;
- fiches jouables dans `editorial-entries.json`.

Priorité immédiate :

- relire le corpus documentaire métro complet ;
- relire les 60 fiches jouables métro v1 dans `editorial-entries.json` ;
- s'appuyer sur le cadrage `game-design.md` pour réutiliser les bons composants ;
- lancer ensuite le développement du moteur v1 Métro Mystère.

### Tramway

- stations de la branche Roubaix ;
- stations de la branche Tourcoing ;
- stations du tronc commun ;
- terminus ;
- origine des noms ;
- anecdotes ;
- repères de quartier utiles aux indices ;
- exploitation des 5 pages Wikipédia disponibles ;
- recherche de sources complémentaires pour les 31 stations sans page dédiée ;
- alimentation de `transport-places-notes.json` avant rédaction des fiches jouables ;
- fiches jouables dans `editorial-entries.json`.

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

- reserve documentaire transport mutualisee ;
- premier corpus éditorial exploitable pour les quatre niveaux.

---

## Phase 5 — Moteur de jeu

Objectif : développer la logique principale.

Statut : non démarrée.

Périmètre de départ : v1 Métro Mystère uniquement, avec une structure compatible avec les futurs niveaux.

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

Statut : non démarrée.

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

Statut : non démarrée.

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

Statut : non démarrée.

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

## Prochaines étapes recommandées

### Étape 1

Faire un checkpoint Git de l'état actuel.

Objectif : sécuriser tout le travail de cadrage, de corpus technique et de récupération documentaire déjà réalisé.

### Étape 2

Analyser un lot pilote métro.

Statut : réalisé dans `transport-places-notes.json`.

Lot traité :

- Gare Lille-Flandres ;
- Rihour ;
- République Beaux-Arts ;
- Porte des Postes ;
- Quatre Cantons - Stade Pierre-Mauroy.

Objectif : transformer les pages Wikipédia brutes en notes sourcées, reformulées et exploitables dans `transport-places-notes.json`.

### Étape 3

Enrichir toute la ligne M1.

Statut : réalisé dans `transport-places-notes.json`.

Objectif : obtenir un premier tronçon complet du métro pour valider la méthode au-delà du lot pilote.

### Étape 4

Dérouler la ligne M2.

Statut : réalisé dans `transport-places-notes.json`.

Objectif : rendre Métro Mystère complet côté réserve documentaire avant de produire les fiches jouables.

### Étape 5

Produire les fiches jouables métro v1.

Statut : réalisé dans `editorial-entries.json`.

Objectif : valider la qualité des indices, le ton des fiches découverte et la structure de `editorial-entries.json`.

### Étape 6

Décider du lancement du développement du jeu.

Statut : réalisé pour une v1 centrée sur le métro.

Objectif : commencer le moteur uniquement si le corpus métro est suffisamment riche, validé et jouable.

### Étape 7

Attaquer le tramway avec une stratégie de sources mixtes.

Objectif : compléter les stations sans page Wikipédia dédiée avec des sources de contexte fiables.

---

## Priorités absolues

1. Cohérence avec La Baraque à Jeux.
2. Constitution d'un corpus fiable avant développement.
3. Analyse éditoriale du métro avant développement du moteur.
4. Jeu entièrement autonome dans le navigateur.
5. Aucune dépendance à un backend.
6. Réutilisation maximale des composants existants.
7. Découverte de Lille et de la MEL par le jeu.
8. Simplicité d'utilisation sur smartphone.
9. Maintenance minimale à long terme.
