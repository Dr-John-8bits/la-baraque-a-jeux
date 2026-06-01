# Audit complet du jeu

Version auditee : `26.05.31.5`

## Résumé

**Le mot à Biloute** dispose déjà d'une base solide : le jeu est jouable, mobile-first, sans backend, avec score, indices, sauvegarde locale, partage et documentation projet.

Le prochain cap consiste à sortir du prototype éditorial court pour devenir un vrai jeu quotidien durable. Cela demande deux chantiers menés en parallèle :

- **Technique** : fiabiliser le moteur, extraire les données, améliorer l'accessibilité, préparer GitHub Pages et les tests.
- **Éditorial** : construire un corpus vérifié, local, riche, équilibré et exploitable par le moteur.

## État actuel

### Fonctionnel

- Mot quotidien déterministe.
- 6 essais.
- Couleurs correcte / présente / absente.
- Premier indice gratuit et vague.
- Indices payants.
- Score basé sur essais et indices.
- Bonus final.
- Statistiques locales.
- Partage avec score et URL publique.
- Footer et versionning.

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
- Données intégrées dans `app.js`.
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
- Pas encore de séparation entre données éditoriales et moteur.
- Pas encore de validation automatique des mots.
- Pas de sources documentaires associées aux mots.
- Pas de gestion riche des variantes orthographiques.

### Gameplay

- Les essais acceptent n'importe quelle chaîne de la bonne longueur.
- Les mots de longueurs différentes changent la taille de la grille, ce qui peut compliquer l'équilibrage.
- Pas encore de mode archive.
- Pas encore de page d'aide intégrée.
- Pas encore d'expérience en cas de retour le lendemain après une série.

### Accessibilité

- Les couleurs ne suffisent pas pour tous les joueurs.
- Les cases pourraient bénéficier de labels plus riches après validation.
- Les dialogues méritent un test clavier complet.
- Aucun réglage de réduction de contraste/animations dans l'interface.

### Technique

- `app.js` mélange données, moteur et rendu.
- Le versionning est répété dans plusieurs fichiers.
- Pas de tests automatisés stockés dans le repo.
- Pas de validation de schéma pour les mots.
- Pas de service worker/offline cache.

### Déploiement

- GitHub Pages est prévu mais pas encore validé dans le dépôt.
- Pas encore d'icône PWA.
- Pas encore d'image de partage social.
- Pas encore de fichier `404.html`, utile mais optionnel pour GitHub Pages.

## Priorités recommandées

## P0 — Stabiliser le socle

Objectif : pouvoir enrichir le jeu sans casser le prototype.

- Extraire les mots vers `data/words.json`.
- Ajouter un validateur de données.
- Ajouter un petit script de test de corpus.
- Ajouter un mode de sélection de mot par date robuste.
- Ajouter des tests Playwright versionnés dans le repo.
- Centraliser la version dans un seul fichier ou une constante partagée.

## P1 — Rendre le jeu éditorialement durable

Objectif : accueillir ton corpus documentaire sans dette technique.

- Définir les champs obligatoires d'un mot.
- Gérer les variantes acceptées.
- Classer les mots par thème, difficulté, longueur et type.
- Préparer une archive de mots déjà joués.
- Ajouter une page ou un panneau de règles intégré.
- Ajouter un indicateur de difficulté.

## P2 — Améliorer l'expérience joueur

Objectif : augmenter le plaisir de retour quotidien.

- Ajouter des badges locaux.
- Améliorer l'écran de fin.
- Ajouter une vraie page stats.
- Ajouter un historique local.
- Ajouter un mode archive.
- Prévoir un mode chronométré séparé, pas dans le score principal.

## P3 — Préparer lancement public

Objectif : publication propre et partageable.

- Ajouter icône PWA.
- Ajouter image Open Graph.
- Vérifier licences et mentions.
- Finaliser GitHub Pages.
- Tester iOS Safari, Android Chrome et desktop.
- Préparer 60 à 100 mots validés.

## Décisions produit à prendre

### Longueur des mots

Recommandation : limiter le lancement à des mots de 5 à 8 lettres.

Raison : c'est confortable sur mobile et compatible avec une grille stable.

### Dictionnaire de saisie

Deux options :

- accepter tout mot de bonne longueur ;
- n'accepter que des mots présents dans un dictionnaire.

Recommandation : pour le MVP public, ajouter une liste de mots acceptés par longueur, afin d'éviter les suites de lettres absurdes.

### Indices

Recommandation :

- indice 1 gratuit : atmosphère, image ou situation ;
- indice 2 payant : contexte ;
- indice 3 payant : définition presque directe.

### Timer

Recommandation : pas de timer dans le mode quotidien principal.

Le timer peut devenir un mode séparé plus tard, par exemple **Entre deux stations**.

## Répartition du travail en parallèle

### Chantier technique

Responsable : Codex.

- Séparer moteur et données.
- Créer la structure `data/`.
- Ajouter validation de corpus.
- Ajouter tests automatisés.
- Améliorer accessibilité.
- Préparer PWA/GitHub Pages.
- Intégrer progressivement les contenus livrés.

### Chantier éditorial

Responsable : Dr. John & Lady Em.

- Fournir corpus documentaire.
- Vérifier mots et variantes.
- Rédiger indices et bonus.
- Identifier sources et notes.
- Définir exclusions et prudences.
- Prioriser les lots de mots.

Le fichier de référence pour ce chantier est [EDITORIAL_CORPUS_REQUEST.md](EDITORIAL_CORPUS_REQUEST.md).

## Risques à surveiller

- Trop de mots obscurs qui frustrent les joueurs.
- Trop d'indices directs qui rendent le score artificiel.
- Ton trop caricatural autour du ch'ti.
- Marques ou institutions citées d'une manière ambiguë.
- Corpus non sourcé ou orthographes discutables.
- Interface qui déborde quand les mots ou indices sont longs.

## Prochaine séquence recommandée

1. Créer `data/words.json`.
2. Écrire un validateur de corpus.
3. Importer les 10 mots actuels dans ce format.
4. Ajouter 20 mots fournis par le corpus éditorial.
5. Tester longueurs, variantes et indices.
6. Préparer une version `0.2` avec 30 mots propres.
