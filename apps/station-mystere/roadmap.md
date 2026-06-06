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

## État au 6 juin 2026

Le projet est passé de la phase corpus à une première v1 jouable centrée sur Métro Mystère.

Le corpus métro reste le socle prioritaire. Tramway, V'Lille et Bus demeurent dans la vision globale, mais ne doivent pas ralentir la stabilisation de la v1 métro.

La v1 actuelle doit être considérée comme une alpha jouable : le moteur fonctionne, le flow principal existe, les tests passent, l'écran de jeu a été compacté, mais une passe de relecture éditoriale, de playtest et de finition mobile reste nécessaire avant de la considérer comme réellement prête pour le portail.

Éléments cadrés :

- gameplay quotidien en quatre niveaux ;
- cadrage game design v1 centré sur Métro Mystère ;
- niveau 1 : Métro Mystère, réponse attendue station de métro ;
- niveau 2 : Tramway Mystère, réponse attendue station de tramway ;
- niveau 3 : Vélo Mystère, réponse attendue station V'Lille ;
- niveau 4 : Bus Mystère, réponse attendue ligne de bus ;
- barème de score et condition de défaite ;
- révélation de la réponse avec fiche découverte après victoire ou défaite ;
- séparation entre corpus technique, réserve documentaire et fiches jouables ;
- principe d'interface : panneau de station mystère, recherche de station, calepin, stats et fiche découverte.

Éléments réalisés :

- page Station Mystère transformée en v1 jouable dans `apps/station-mystere/` ;
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
- corpus documentaire métro complet : 60 stations enrichies sur 60 ;
- document de game design v1 : `apps/station-mystere/game-design.md` ;
- document `game-design.md` renforcé comme référence principale pour lancer le développement de la v1 ;
- plan d'implémentation v1 : `apps/station-mystere/implementation-plan.md` ;
- moteur v1 métro dans `apps/station-mystere/app.js` ;
- interface v1 dans `index.html` et `styles.css` ;
- sélection quotidienne à midi, heure de Paris ;
- recherche de station avec suggestions ;
- score, indices payants, mauvaises réponses, victoire et défaite ;
- démarrage à 0 indice visible, premier indice demandé gratuitement ;
- indices consultés et débloqués dans une modale, sur le modèle du Mot à Biloute ;
- calepin, statistiques locales et partage sans spoiler ;
- aide et contexte du jeu affichés dans une modale au lancement ;
- fiche découverte affichée après victoire ou défaite ;
- sauvegarde et reprise de partie via LocalStorage ;
- hook de test `window.render_game_to_text` ;
- smoke test navigateur couvrant Station Mystère ;
- validation statique des imports `fetchJson` de Station Mystère ;
- première passe UI compacte : suppression du surtitre rouge, du sous-texte d'intro et du grand encart date ;
- vérification desktop et mobile : champ de recherche et actions visibles sans scroll initial.

Constat important :

- le métro dispose d'une couverture Wikipédia station par station complète ;
- le tramway dispose de peu de pages dédiées, il faudra donc compléter avec des sources de contexte : Grand Boulevard, communes, lieux proches, patrimoine, Ilévia, MEL et sources locales ;
- les fichiers Wikipédia complets restent dans `packages/corpus/documentation/raw/`, ignoré par Git.

Position actuelle dans la roadmap :

- phases 2 et 3 largement avancées ;
- phase 4 complète côté métro pour la réserve documentaire et les fiches jouables v1 ;
- phase 1 cadrée dans `game-design.md` pour le périmètre v1 ;
- plan technique d'exécution disponible dans `implementation-plan.md` ;
- phase 5 implémentée en alpha pour Métro Mystère ;
- phase 6 implémentée en première version jouable compacte, à valider par playtest ;
- phase 7 implémentée en socle simple, à relire ;
- phase 8 non démarrée ;
- tramway, V'Lille et bus reportés à une v2 ou à des itérations ultérieures.

Point d'arrêt avant pause :

- le jeu v1 métro est jouable dans le navigateur ;
- l'interface ne force plus le joueur à scroller avant de commencer ;
- l'aide s'ouvre automatiquement au lancement d'une partie en cours ;
- les indices ne sont plus affichés sur le plateau, ils vivent dans une modale ;
- le premier indice reste gratuit ;
- les contrôles `npm run check` et `npm run test:browser` passent ;
- la prochaine reprise doit commencer par du playtest et de la relecture, pas par l'ajout du tramway.

---

## Reste à faire pour une v1 bien jouable

### Priorité 1 — Playtest du flow complet

Objectif : vérifier que le jeu est agréable, compréhensible et sans blocage sur plusieurs parties.

Travaux :

- jouer plusieurs scénarios complets sur desktop ;
- jouer plusieurs scénarios complets sur mobile ;
- vérifier victoire parfaite ;
- vérifier victoire avec erreurs ;
- vérifier victoire avec indices payants ;
- vérifier défaite à 0 point ;
- vérifier reprise après rechargement ;
- vérifier stats non dupliquées après rechargement ;
- vérifier partage sans spoiler ;
- vérifier calepin, stats et aide en conditions réelles ;
- vérifier que l'aide au lancement n'est pas trop intrusive ;
- vérifier que la modale d'indices reste compréhensible après plusieurs indices ;
- vérifier que le joueur comprend qu'il doit demander le premier indice.

Critère de sortie :

- aucun blocage de partie ;
- le joueur comprend quoi faire sans explication extérieure ;
- le champ de recherche et le bouton Valider restent accessibles sur mobile ;
- le premier indice est demandé naturellement, sans que le joueur se sente bloqué.

### Priorité 2 — Relecture éditoriale des 60 fiches métro

Objectif : rendre les textes visibles dignes d'une v1 publique.

Travaux :

- relire les noms affichés des stations ;
- restaurer les accents et la typographie éditoriale dans les textes visibles ;
- relire les cinq indices de chaque station ;
- vérifier que les indices vont bien du plus général au plus précis ;
- éviter les indices trop évidents dès le début ;
- éviter les indices trop vagues en fin de progression ;
- vérifier les fiches découverte ;
- harmoniser les formulations ;
- repérer les stations dont les indices se ressemblent trop ;
- vérifier les réponses acceptées et variantes courantes.

Critère de sortie :

- les 60 stations sont jouables sans impression de brouillon ;
- les textes visibles ne donnent pas l'impression d'un export technique ;
- les réponses acceptées couvrent les graphies naturelles.

### Priorité 3 — Finition mobile

Objectif : rendre la v1 confortable sur smartphone.

Travaux :

- tester largeur 390 px et équivalents iPhone/Android ;
- vérifier que la recherche reste visible avec clavier ouvert ;
- vérifier que la liste de suggestions ne masque pas l'écran de manière incohérente ;
- vérifier les dialogues Indices, Calepin, Stats et Aide ;
- vérifier les très longs noms de stations ;
- vérifier les textes longs dans les fiches découverte ;
- vérifier le confort réel avec clavier mobile ouvert ;
- ajuster les espacements si nécessaire.

Critère de sortie :

- le jeu peut se jouer d'une main sans frustration ;
- aucun texte critique ne déborde ;
- l'action principale reste évidente ;
- aucun retour au grand écran avec scroll obligatoire.

### Priorité 4 — Accessibilité et robustesse

Objectif : éviter les régressions invisibles.

Travaux :

- vérifier la navigation clavier complète ;
- vérifier les suggestions avec flèches, Entrée et Échap ;
- vérifier les labels des champs et boutons ;
- vérifier les messages `aria-live` ;
- tester un LocalStorage invalide ;
- tester un corpus indisponible ;
- tester une partie déjà terminée ;
- vérifier contraste et focus visible.

Critère de sortie :

- le jeu reste utilisable au clavier ;
- une erreur de données n'entraîne pas une page cassée ;
- les états importants sont annoncés clairement.

### Priorité 5 — Préparation publication

Objectif : passer de l'alpha jouable à une v1 assumée sur le portail.

Travaux :

- mettre à jour les textes de présentation si besoin ;
- décider si la tuile d'accueil doit passer de "en construction" à "jouer" ;
- décider si l'actualité blog doit être complétée par une actualité de lancement ;
- relire le format de partage ;
- faire un dernier `npm run check` ;
- faire un dernier `npm run test:browser` ;
- faire un test navigateur manuel avant commit de release.

Critère de sortie :

- la v1 peut être montrée à un joueur sans accompagnement ;
- les textes publics ne promettent pas encore Tramway, V'Lille et Bus comme niveaux jouables ;
- les tests automatisés passent.

---

## Phase 1 — Analyse de l'existant

Objectif : comprendre et réutiliser les mécanismes déjà présents dans le portail.

Statut : réalisé pour la v1 métro.

Travaux :

- analyser Le Mot à Biloute ;
- analyser Lille-Mêle ;
- analyser Ch'tifoumi ;
- identifier les composants réutilisables ;
- identifier les conventions visuelles ;
- identifier les mécanismes de partage ;
- identifier les mécanismes de sauvegarde locale ;
- identifier les composants communs pouvant être mutualisés ;
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
- préparer les premières fiches candidates ;
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

Statut : première version en place et utilisée par la v1 métro.

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

Statut : complète côté métro, à relire éditorialement pour publication.

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

- relire les 60 fiches jouables métro v1 dans `editorial-entries.json` ;
- restaurer accents, typographie et formulations éditoriales dans les textes visibles ;
- vérifier que les variantes acceptées couvrent les usages naturels ;
- vérifier que les indices produisent une difficulté progressive ;
- valider la qualité des fiches découverte.

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

- réserve documentaire transport mutualisée ;
- premier corpus éditorial exploitable pour les quatre niveaux.

---

## Phase 5 — Moteur de jeu

Objectif : développer la logique principale.

Statut : implémentée en alpha pour la v1 métro.

Périmètre de départ : v1 Métro Mystère uniquement, avec une structure compatible avec les futurs niveaux.

Travaux réalisés :

- sélection de l'énigme du jour ;
- affichage progressif des indices sur demande ;
- validation des réponses ;
- calcul du score ;
- attribution des coupes ;
- attribution des médailles ;
- sauvegarde locale ;
- reprise de partie après rechargement ;
- défaite à 0 point ;
- révélation immédiate de la réponse ;
- hook `render_game_to_text` pour les tests.

Travaux restants :

- tester plus largement les cas limites ;
- vérifier LocalStorage invalide ;
- vérifier corpus indisponible ;
- confirmer la mécanique de série sur plusieurs jours réels ;
- vérifier les transitions entre premier indice gratuit et indices payants dans davantage de scénarios ;
- relire les intitulés de récompenses.

Livrable :

- moteur v1 métro jouable, à stabiliser par playtest.

---

## Phase 6 — Interface utilisateur

Objectif : intégrer le moteur dans l'univers de La Baraque à Jeux.

Statut : première interface jouable compactée, à polir après playtest.

Travaux réalisés :

- panneau Station Mystère ;
- score, indices et série ;
- recherche avec suggestions ;
- suppression des éléments d'intro trop hauts ;
- écran de jeu visible sans scroll initial sur desktop et mobile de test ;
- modale d'aide et de contexte au lancement ;
- modale d'indices avec premier indice gratuit puis indices payants ;
- écran de victoire ;
- écran de défaite ;
- écran de statistiques ;
- adaptation mobile ;
- cohérence graphique avec les autres jeux.

Travaux reportés ou restants :

- fil de progression Métro → Tramway → Vélo → Bus à reporter après la v1 métro ;
- animation du niveau actif à reporter ;
- finition mobile après playtest ;
- vérification des longs noms de stations ;
- vérification du confort avec clavier mobile réel ;
- ajustement éventuel du wording de l'aide et de la modale d'indices ;
- ajustements visuels après retour utilisateur.

Livrable :

- première version jouable, à rendre confortable avant publication.

---

## Phase 7 — Partage et statistiques

Objectif : harmoniser l'expérience avec les autres jeux du portail.

Statut : socle v1 implémenté.

Travaux réalisés :

- partage des résultats ;
- format de score ;
- récapitulatif quotidien ;
- suivi des séries ;
- historique local.

Travaux restants :

- relire le texte de partage ;
- vérifier le partage sur mobile réel ;
- vérifier le fallback copie sur desktop ;
- décider si les stats doivent afficher davantage d'historique ;
- vérifier que les stats ne se dupliquent jamais après rechargement.

Le comportement doit être cohérent avec les mécanismes déjà présents dans La Baraque à Jeux.

Livrable :

- expérience quotidienne complète.

---

## Phase 8 — Finalisation

Objectif : préparer l'intégration officielle dans le portail.

Statut : non démarrée côté publication.

Travaux :

- optimisation mobile ;
- vérifications d'accessibilité ;
- vérifications des performances ;
- relecture de l'aide intégrée ;
- validation finale du flow d'indices en modale ;
- rédaction de la page À propos ;
- mise à jour éventuelle de la page d'accueil de La Baraque à Jeux ;
- mise à jour éventuelle du blog pour annoncer la v1 jouable.

Livrable :

- version de production.

---

## Prochaines étapes recommandées

### Étape 1

Stabiliser le gameplay v1 métro par playtest.

Statut : à faire.

Objectif : jouer plusieurs parties complètes, vérifier les cas limites et corriger les points bloquants. Le socle automatisé passe, mais il faut maintenant une validation humaine.

### Étape 2

Relire les textes visibles du corpus métro.

Statut : à faire.

Objectif : éviter l'impression d'export technique dans les noms, indices et fiches découverte.

Points à vérifier :

- accents ;
- casse ;
- tirets ;
- noms officiels ;
- variantes acceptées ;
- ton éditorial.

### Étape 3

Finaliser l'expérience mobile réelle.

Statut : à faire.

Objectif : confirmer que la recherche, les suggestions, les modales, le calepin et la fiche découverte restent confortables sur smartphone, notamment avec le clavier ouvert.

### Étape 4

Vérifier accessibilité et robustesse.

Statut : à faire.

Objectif : couvrir clavier, focus, messages d'état, LocalStorage invalide et erreur de chargement corpus.

### Étape 5

Préparer le lancement v1.

Statut : à faire après stabilisation.

Objectif : décider du wording public, de la tuile d'accueil, du blog et du commit de release.

---

## Priorités absolues

1. Cohérence avec La Baraque à Jeux.
2. Stabilisation de la v1 métro avant ajout d'autres niveaux.
3. Relecture éditoriale des 60 fiches métro visibles dans le jeu.
4. Jeu entièrement autonome dans le navigateur.
5. Aucune dépendance à un backend.
6. Réutilisation maximale des composants existants.
7. Découverte de Lille et de la MEL par le jeu.
8. Simplicité d'utilisation sur smartphone.
9. Maintenance minimale à long terme.
