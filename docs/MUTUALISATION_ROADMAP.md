# Roadmap de mutualisation

## Objectif

Construire un monorepo propre pour **La baraque a jeux**, **Le mot a Biloute** et **Lille-Mele**, afin de pouvoir faire evoluer chaque jeu separement sans dupliquer les fondations communes.

La mutualisation doit servir trois besoins :

- garder un portail public simple a publier sur GitHub Pages ;
- partager la charte graphique, le corpus documentaire et les conventions ;
- laisser chaque jeu libre dans son gameplay, son rythme et son ergonomie.

## Statut au 1er juin 2026

- Portail public unique conserve a la racine avec `index.html`.
- Dossier `apps/portail` retire.
- Assets de marque deplaces dans `assets/brand`.
- UI commune initialisee dans `packages/ui`.
- Corpus des deux jeux extrait dans `packages/corpus`.
- Helpers communs initialises dans `packages/game-utils`.
- Lille-Mele decoupe en HTML, CSS, JavaScript et donnees.
- Blog genere depuis des entrees Markdown atomiques dans `docs/blog/entries`.
- Schemas et validateur de corpus renforces avec identifiants stables, sources, tags, statuts et controles de doublons.
- Scripts de verification ajoutes pour JavaScript, corpus, blog et pages statiques.
- Documentation principale alignee sur l'architecture monorepo statique.

## Principes directeurs

- Le site reste statique et jouable directement dans un navigateur.
- La racine du depot reste le point d'entree public avec `index.html`.
- Les jeux restent dans `apps/`.
- Les briques communes vivent dans `packages/`.
- Le contenu editorial source et les nouveautes vivent dans `docs/`.
- Les scripts de verification et de generation vivent dans `scripts/`.
- La mutualisation doit reduire la duplication, pas imposer un moteur de jeu unique.

## Etat cible

```text
.
├── index.html
├── blog.html
├── assets/
│   └── brand/
├── apps/
│   ├── le-mot-a-biloute/
│   │   ├── index.html
│   │   ├── app.js
│   │   ├── styles.css
│   │   └── manifest.webmanifest
│   └── lille-mele/
│       ├── index.html
│       ├── app.js
│       ├── styles.css
│       └── manifest.webmanifest
├── packages/
│   ├── corpus/
│   │   ├── README.md
│   │   ├── sources.json
│   │   ├── le-mot-a-biloute/
│   │   ├── lille-mele/
│   │   └── schema/
│   ├── game-utils/
│   │   ├── daily.js
│   │   ├── storage.js
│   │   ├── share.js
│   │   ├── markdown.js
│   │   └── text-render.js
│   └── ui/
│       ├── tokens.css
│       ├── base.css
│       ├── site-nav.css
│       └── components.css
├── docs/
│   ├── blog/
│   │   ├── entries/
│   │   ├── README.md
│   │   └── NEWS.md
│   ├── editorial/
│   └── MUTUALISATION_ROADMAP.md
└── scripts/
    ├── build-news.mjs
    ├── validate-corpus.mjs
    ├── check-js.mjs
    └── check-static-pages.mjs
```

## Phase 0 - Stabiliser l'existant

Objectif : partir d'une base nette avant d'ajouter de nouvelles fonctionnalites.

### Actions

- Corriger les references obsoletes apres le retrait des footers de jeux.
- Verifier que chaque page publique charge sans erreur console.
- Verifier que le menu sticky fonctionne sur le portail, le blog et les jeux.
- Verifier que les liens relatifs GitHub Pages sont corrects.
- Nettoyer les mentions documentaires devenues fausses apres la migration monorepo.

### Livrables

- Pages publiques stables :
  - `index.html`
  - `blog.html`
  - `apps/le-mot-a-biloute/index.html`
  - `apps/lille-mele/index.html`
- Documentation alignee sur l'organisation monorepo.

### Critere de validation

- Les deux jeux restent jouables sur mobile.
- Le portail permet d'atteindre chaque jeu et le blog.
- Aucune erreur JavaScript bloquante au chargement.

## Phase 1 - Supprimer les doublons structurels

Objectif : eviter que deux fichiers representent la meme experience publique.

### Actions

- Faire de `index.html` la seule source publique du portail.
- Retirer ou requalifier `apps/portail/index.html` si le fichier n'a plus de role clair.
- Deplacer les assets de marque vers `assets/brand/`.
- Mettre a jour les chemins du portail, du blog et du menu.

### Livrables

- Une seule page portail de reference.
- Un dossier d'assets de marque commun.
- Une convention claire pour les chemins relatifs.

### Critere de validation

- Modifier le portail ne demande plus de synchroniser deux fichiers HTML.

## Phase 2 - Mutualiser la charte graphique

Objectif : harmoniser visuellement le portail et les jeux sans bloquer les specificites de gameplay.

### Actions

- Creer `packages/ui/tokens.css`.
- Creer `packages/ui/base.css`.
- Creer `packages/ui/components.css`.
- Garder `packages/ui/site-nav.css` pour la navigation globale.
- Remplacer les variables locales redondantes par les tokens communs.
- Centraliser les styles recurrents :
  - boutons ;
  - cartes ;
  - panneaux ;
  - badges ;
  - messages ;
  - toasts ;
  - etats focus/hover/disabled.

### Livrables

- Une charte commune importee par le portail, le blog et les deux jeux.
- Des CSS de jeux plus courts, concentres sur le gameplay.

### Critere de validation

- Changer une couleur de marque se fait dans un seul fichier.
- Les jeux gardent leur lisibilite et leur personnalite.

## Phase 3 - Decouper Lille-Mele

Objectif : sortir Lille-Mele de son fichier HTML monolithique.

### Actions

- Extraire le CSS inline vers `apps/lille-mele/styles.css`.
- Extraire le JavaScript inline vers `apps/lille-mele/app.js`.
- Extraire les puzzles vers `packages/corpus/lille-mele/puzzles.json`.
- Extraire les sources vers `packages/corpus/sources.json`.
- Garder `apps/lille-mele/` concentre sur l'interface et la logique du jeu.

### Livrables

- `apps/lille-mele/index.html` redevenu un squelette HTML lisible.
- Donnees editoriales separees du moteur de jeu.
- Jeu toujours autonome et jouable en statique.

### Critere de validation

- Ajouter une grille Lille-Mele ne demande plus de modifier le HTML principal.

## Phase 4 - Construire le corpus commun

Objectif : faire de `packages/corpus` la source de verite editoriale.

### Actions

- Definir un format commun pour les sources :
  - identifiant ;
  - titre ;
  - URL ;
  - editeur ;
  - licence ;
  - date de consultation ;
  - notes de vigilance.
- Definir le format des mots du Mot a Biloute.
- Definir le format des items et familles de Lille-Mele.
- Relier chaque contenu editorial a une ou plusieurs sources.
- Documenter les regles editoriales communes.
- Garder les interdits, contraintes et exceptions propres a chaque jeu dans leur dossier.

### Livrables

- `packages/corpus/sources.json`
- `packages/corpus/le-mot-a-biloute/words.json`
- `packages/corpus/lille-mele/puzzles.json`
- `packages/corpus/schema/`
- `docs/editorial/README.md` enrichi

### Critere de validation

- Le corpus peut etre relu, valide et enrichi sans ouvrir le code des jeux.

## Phase 5 - Ajouter les validateurs

Objectif : detecter tot les erreurs de contenu et de publication.

### Actions

- Creer `scripts/validate-corpus.mjs`.
- Verifier les champs obligatoires.
- Verifier les doublons d'identifiants.
- Verifier les sources manquantes.
- Verifier les longueurs de mots et de libelles.
- Verifier les contraintes propres a chaque jeu.
- Creer `scripts/check-static-pages.mjs` pour les liens, assets et pages principales.

### Livrables

- Une commande de validation du corpus.
- Une commande de verification statique du site.
- Une section `Verification` mise a jour dans le README.

### Critere de validation

- Une erreur editoriale evidente est detectee avant publication.

## Phase 6 - Mutualiser les utilitaires de jeu

Objectif : reduire la duplication technique sans melanger les gameplays.

### Actions

- Creer des helpers communs dans `packages/game-utils`.
- Mutualiser :
  - calcul d'identifiant quotidien ;
  - lecture/ecriture `localStorage` namespaced ;
  - partage Web Share API avec fallback presse-papiers ;
  - rendu texte pour tests ;
  - echappement HTML ;
  - mini rendu Markdown si conserve ;
  - shuffle seedable si utile aux deux jeux.
- Garder les fonctions de scoring et de resolution dans chaque jeu tant que les regles divergent.

### Livrables

- Utilitaires communs importes par les jeux.
- Code applicatif plus lisible.

### Critere de validation

- Une evolution du partage ou du stockage local se fait une seule fois.

## Phase 7 - Centraliser versioning et blog

Objectif : faire du blog public la vitrine des nouveautes, sans multiplier les changelogs contradictoires.

Statut : socle realise. Les entrees sources vivent dans `docs/blog/entries/`, puis `scripts/build-news.mjs` genere `docs/blog/NEWS.md`.

### Actions

- Faire de `docs/blog/NEWS.md` la sortie Markdown publique des nouveautes.
- Garder `docs/blog/entries/` comme source editoriale versionnee.
- Garder les changelogs de jeux seulement s'ils apportent un niveau de detail utile.
- Ajouter une convention d'entree :
  - date ;
  - version ;
  - perimetre ;
  - changements joueur ;
  - changements techniques ;
  - fichiers principaux.
- Creer `scripts/build-news.mjs` pour agreger plusieurs fichiers Markdown.

### Livrables

- Une convention de versioning commune.
- Un blog lisible par un utilisateur externe.
- Moins de versions dupliquees dans le code.

### Critere de validation

- Une release peut etre documentee une seule fois sans perdre l'information importante.

## Phase 8 - Nettoyer la documentation

Objectif : distinguer la documentation commune de la documentation specifique aux jeux.

Statut : nettoyage de maturite engage. Les docs principales de monorepo, corpus, scripts et blog refletent l'architecture actuelle ; les journaux historiques restent conserves comme archives de travail.

### Actions

- Centraliser les documents communs :
  - contribution ;
  - licence code ;
  - licence contenu ;
  - confidentialite ;
  - checklist de release ;
  - deploiement GitHub Pages.
- Garder par jeu :
  - regles ;
  - FAQ ;
  - roadmap produit ;
  - contraintes editoriales specifiques ;
  - notes de gameplay.
- Retirer les anciennes references aux depots separes.

### Livrables

- Documentation racine plus utile.
- Documentation de jeux plus courte et plus precise.

### Critere de validation

- Un contributeur comprend ou modifier le portail, un jeu, le corpus ou la charte sans lire toute l'histoire du projet.

## Phase 9 - Tests navigateur

Objectif : securiser les regressions visibles sur mobile.

### Actions

- Ajouter un test de chargement des pages principales.
- Verifier les erreurs console.
- Verifier les boutons du menu sticky.
- Verifier les fonctions `window.render_game_to_text()`.
- Verifier au moins un viewport mobile et un viewport desktop.

### Livrables

- Un script de smoke test navigateur.
- Une checklist de validation avant publication.

### Critere de validation

- Les regressions majeures de navigation, rendu ou JavaScript sont detectees avant mise en ligne.

## Hors perimetre a court terme

- Reecrire les jeux en framework lourd.
- Creer un backend.
- Imposer un moteur commun aux deux jeux.
- Automatiser tout le pipeline de publication avant que le corpus soit stabilise.
- Transformer le projet en package npm publie.

## Ordre recommande

1. Stabiliser les erreurs et references obsoletes.
2. Supprimer le doublon du portail.
3. Mutualiser la charte graphique.
4. Decouper Lille-Mele.
5. Construire le corpus commun.
6. Ajouter les validateurs.
7. Mutualiser les utilitaires.
8. Centraliser versioning et blog.
9. Nettoyer la documentation.
10. Ajouter les tests navigateur.

## Definition d'une base propre

La base sera consideree propre quand :

- le portail n'existe qu'a un seul endroit ;
- chaque jeu est jouable sans serveur applicatif ;
- les styles communs sont dans `packages/ui` ;
- les donnees editoriales sont hors du code applicatif ;
- le corpus a un schema et un validateur ;
- les nouveautes publiques sont centralisees ;
- les docs ne se contredisent plus ;
- une verification simple permet de controler le site avant publication.
