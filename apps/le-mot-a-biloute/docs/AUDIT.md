# Audit complet du jeu

Version auditée : `26.06.01.2`

## Résumé

**Le mot à Biloute** dispose déjà d'une base solide : le jeu est jouable, mobile-first, sans backend, avec score, Rab de Biloute, coups d'pouce, sauvegarde locale, partage, PWA minimale et documentation projet.

Le prochain cap consiste à sortir du prototype éditorial court pour devenir un vrai jeu quotidien durable. Cela demande deux chantiers menés en parallèle :

- **Technique** : enrichir les données extraites dans le corpus commun, préparer une validation stricte des propositions, finaliser les assets dédiés et renforcer les tests.
- **Éditorial** : construire un corpus vérifié, local, riche, équilibré et exploitable par le moteur.

## État actuel

### Fonctionnel

- Mot quotidien déterministe.
- 6 essais officiels.
- Rab de Biloute après échec officiel.
- Couleurs correcte / présente / absente.
- Premier Ch’ti coup d'pouce gratuit et vague.
- Coups d'pouce payants.
- Score basé sur essais et coups d'pouce, avec détail en fin de partie.
- Bonus final.
- Statistiques locales avec taux de réussite et historique simple.
- Partage avec score et URL publique.
- Navigation globale commune.
- Validation des propositions en mode découverte.
- Labels accessibles enrichis sur les cases validées.
- Métadonnées sociales, manifeste PWA et `404.html`.
- Versioning public centralisé dans le blog mutualisé.

### Documentation

- README.
- Changelog.
- FAQ/règles.
- Spécifications.
- Architecture.
- Guide éditorial.
- Déploiement.
- Confidentialité.
- Roadmap.
- Tests.
- Contribution.

### Technique

- Application statique.
- Pas de build.
- Pas de framework.
- Données chargées depuis `../../packages/corpus/le-mot-a-biloute/words.json`.
- Stockage dans `localStorage`.
- Tests manuels et Playwright possibles via `window.render_game_to_text()`.

## Forces

### Produit

- Concept immédiatement compréhensible.
- Identité locale forte.
- Mécanique quotidienne simple.
- Score clair.
- Indices compatibles avec un jeu grand public.
- Pas de friction : pas de compte, pas d'installation, pas de backend.

### UX

- Mobile-first.
- Clavier virtuel utilisable.
- Interface compacte.
- Résultat partageable.
- Feedback visuel immédiat.

### Technique

- Très facile à déployer.
- Peu de dépendances.
- Bonne base pour GitHub Pages.
- Surface de bug limitée.

## Fragilités

### Contenu

- Corpus actuel trop court : 10 mots.
- Séparation moteur/corpus réalisée, mais le corpus reste à enrichir.
- Validation automatique des mots en place dans le monorepo.
- Politique de validation des propositions isolée dans `guess-policy.json`, mais pas encore alimentée par un dictionnaire complet.
- Sources documentaires partiellement associées aux mots.
- Pas de gestion riche des variantes orthographiques.

### Gameplay

- Le mode découverte bloque les suites les plus absurdes, mais accepte encore des propositions qui ne sont pas de vrais mots.
- Les mots de longueurs différentes changent la taille de la grille, ce qui peut compliquer l'équilibrage.
- Pas encore de mode archive.
- Pas encore d'expérience en cas de retour le lendemain après une série.

### Accessibilité

- Les cases validées ont maintenant des labels plus riches et des marqueurs visuels, à tester avec lecteur d'écran réel.
- Les dialogues méritent un test clavier complet.
- Aucun réglage de réduction de contraste/animations dans l'interface.

### Technique

- `app.js` mélange encore moteur et rendu.
- Le versioning public est centralisé dans le blog, mais certaines constantes applicatives restent locales.
- Les tests automatisés de smoke test sont stockés dans le repo.
- Validation de schéma et de contenu en place pour les mots.
- Pas de service worker/offline cache.

### Déploiement

- GitHub Pages est prévu mais pas encore validé dans le dépôt.
- Icône PWA et image sociale branchées sur l'asset de marque mutualisé, mais pas encore dédiées au jeu.
- Fichier `404.html` ajouté pour GitHub Pages.

## Priorités recommandées

## P0 — Stabiliser le socle

Objectif : pouvoir enrichir le jeu sans casser le prototype.

- Maintenir les mots dans `../../packages/corpus/le-mot-a-biloute/words.json`.
- Garder le validateur de données commun.
- Garder le script de test de corpus commun.
- Garder le mode de sélection de mot par date robuste.
- Étendre les tests Playwright versionnés dans le repo.
- Réduire progressivement les constantes de version locales quand elles deviennent redondantes.

## P1 — Rendre le jeu éditorialement durable

Objectif : accueillir ton corpus documentaire sans dette technique.

- Définir les champs obligatoires d'un mot.
- Gérer les variantes acceptées.
- Classer les mots par thème, difficulté, longueur et type.
- Préparer une archive de mots déjà joués.
- Maintenir le panneau de règles intégré.
- Ajouter un indicateur de difficulté.

## P2 — Améliorer l'expérience joueur

Objectif : augmenter le plaisir de retour quotidien.

- Ajouter des badges locaux.
- Continuer à améliorer l'écran de fin.
- Transformer le calepin en vraie page stats si nécessaire.
- Étendre l'historique local.
- Ajouter un mode archive.
- Prévoir un mode chronométré séparé, pas dans le score principal.

## P3 — Préparer lancement public

Objectif : publication propre et partageable.

- Créer une icône PWA dédiée au jeu.
- Créer une image Open Graph dédiée au jeu.
- Vérifier licences et mentions.
- Finaliser GitHub Pages.
- Tester iOS Safari, Android Chrome et desktop.
- Préparer 60 à 100 mots validés.

## Décisions produit à prendre

### Longueur des mots

Recommandation : limiter le lancement à des mots de 5 à 8 lettres.

Raison : c'est confortable sur mobile et compatible avec une grille stable.

### Dictionnaire de saisie

Trois options :

- mode découverte permissif mais cadré ;
- liste locale de propositions acceptées ;
- dictionnaire strict.

Décision actuelle : mode découverte permissif mais cadré. Recommandation MVP public : ajouter une liste de mots acceptés par longueur, afin d'éviter les suites de lettres absurdes sans exclure les mots régionaux du corpus.

### Indices

Recommandation :

- coup d'pouce 1 gratuit : atmosphère, image ou situation ;
- coup d'pouce 2 payant : contexte ;
- coup d'pouce 3 payant : définition presque directe.

### Timer

Recommandation : pas de timer dans le mode quotidien principal.

Le timer peut devenir un mode séparé plus tard, par exemple **Entre deux stations**.

## Répartition du travail en parallèle

### Chantier technique

Responsable : Codex.

- Maintenir la séparation moteur et corpus commun.
- Enrichir `../../packages/corpus/le-mot-a-biloute/words.json`.
- Étendre la validation de corpus.
- Ajouter tests automatisés.
- Tester accessibilité clavier et lecteur d'écran.
- Finaliser PWA/GitHub Pages.
- Intégrer progressivement les contenus livrés.

### Chantier éditorial

Responsable : Dr. John & Lady Em.

- Fournir corpus documentaire.
- Vérifier mots et variantes.
- Rédiger coups d'pouce et bonus.
- Identifier sources et notes.
- Définir exclusions et prudences.
- Prioriser les lots de mots.

Le fichier de référence pour ce chantier est [EDITORIAL_CORPUS_REQUEST.md](EDITORIAL_CORPUS_REQUEST.md).

## Risques à surveiller

- Trop de mots obscurs qui frustrent les joueurs.
- Trop de coups d'pouce directs qui rendent le score artificiel.
- Ton trop caricatural autour du ch'ti.
- Marques ou institutions citées d'une manière ambiguë.
- Corpus non sourcé ou orthographes discutables.
- Interface qui déborde quand les mots ou coups d'pouce sont longs.

## Prochaine séquence recommandée

1. Ajouter 20 mots fournis par le corpus éditorial dans `../../packages/corpus/le-mot-a-biloute/words.json`.
2. Associer les mots à des sources communes quand c'est possible.
3. Alimenter une liste de propositions acceptées par longueur.
4. Tester longueurs, variantes et coups d'pouce.
5. Étendre les tests navigateur sur une partie complète.
6. Préparer une version `0.2` avec 30 mots propres.
