# Changelog

Toutes les modifications notables du projet sont documentées ici.

Le format de version suit `AA.MM.JJ.i`, où `i` est l'itération du jour.

## [26.06.02.4] - 2026-06-02

### Ajouté

- Page dédiée `À propos / règles / sources` hors de l'écran de jeu.
- Écran de première aide affiché au premier lancement, puis mémorisé localement.
- Chargement automatique des sources reliées aux grilles Lille-Mêle sur la page dédiée.

### Modifié

- Version courante passée à `26.06.02.4`.
- Le bouton `?` ouvre l'aide de lancement au lieu d'afficher un panneau dans le flux de jeu.

## [26.06.02.3] - 2026-06-02

### Ajouté

- Compte à rebours visible vers la prochaine grille quotidienne à midi.
- Test navigateur du format de compte à rebours.

### Modifié

- Version courante passée à `26.06.02.3`.
- Rangée d'état adaptée en 2x2 sur mobile et 4 colonnes sur écran plus large.
- Bloc vide "Aucun groupe trouvé" retiré pour donner plus de place à la grille.

## [26.06.02.2] - 2026-06-02

### Modifié

- Version courante passée à `26.06.02.2`.
- Les couleurs de familles sont désormais attribuées par rang de solution, et non par difficulté éditoriale.
- La révélation de défaite affiche systématiquement quatre couleurs distinctes.
- Le partage utilise les mêmes couleurs de rang que l'interface.
- Le bouton d'information `Sources` et le panneau associé sont retirés de l'écran de jeu.

## [26.06.02.1] - 2026-06-02

### Ajouté

- Grille officielle quotidienne calée à 12 h, heure de Paris.
- Rotation officielle limitée aux grilles `reviewed` quand le corpus en contient.
- Révélation animée des familles à la place de la grille quand la partie est perdue.
- Exposition du rollover quotidien dans `window.render_game_to_text` pour les tests.

### Modifié

- Version courante passée à `26.06.02.1`.
- Sauvegarde locale attachée à la date officielle et au puzzle.
- Statistiques et série recalculées sur les dates officielles consécutives.
- Bouton de replay immédiat retiré de l'écran de résultat en attendant l'arbitrage produit.
- Aide alignée sur la grille officielle quotidienne à midi.

## [26.06.01.4] - 2026-06-01

### Ajouté

- Deux grilles `reviewed` supplémentaires à partir des familles candidates sans doublon.
- Une famille `Douceurs et habitudes du Nord` issue des graines régionales et gastronomiques relues.
- Une grille corsée autour des premiers arrêts de Lianes.

### Modifié

- Version courante passée à `26.06.01.4`.

## [26.06.01.3] - 2026-06-01

### Ajouté

- Cinq nouvelles grilles `reviewed` issues d'une passe éditoriale sur les familles `to-review`.
- Nouvelles familles jouables autour de la ligne 2, du tramway, des Lianes, des territoires MEL, du patrimoine civil et des espaces verts.

### Modifié

- Version courante passée à `26.06.01.3`.
- Validateur enrichi avec un filtre textuel contre les références religieuses évidentes non listées explicitement dans les exclusions.

### Vérifié

- Le corpus contient désormais 8 grilles `reviewed`, soit 128 emplacements et 124 cartes uniques relues.

## [26.06.01.2] - 2026-06-01

### Modifié

- Version courante passée à `26.06.01.2`.
- Feedback "3 sur 4" rendu plus explicite avec le message `Tout près : 3 cartes sont dans la même famille.`
- Effet visuel jaune prolongé sur les cartes de la tentative presque correcte.
- Aide mise à jour pour décrire précisément le signal affiché.

### Vérifié

- Smoke test Playwright enrichi avec un cas "3 sur 4".

## [26.06.01.1] - 2026-06-01

### Ajouté

- Trois grilles Lille-Mêle relues à partir du corpus documentaire structuré.
- Sources renseignées au niveau des familles de puzzles.

### Modifié

- Version courante passée à `26.06.01.1`.
- Schéma `Puzzle` renforcé : statut, tags, sources de puzzle et sources de familles deviennent obligatoires.
- Validateur de corpus enrichi pour refuser les items exclus/sensibles et les doublons normalisés dans les grilles.

## [26.05.31.5] - 2026-05-31

### Ajouté

- Audit complet du jeu dans `AUDIT.md`.
- Fichier de demande de corpus éditorial dans `EDITORIAL_CORPUS_REQUEST.md`.

### Modifié

- Version courante passée à `26.05.31.5`.
- Documentation d'entrée mise à jour avec les nouveaux fichiers de pilotage.
- Formulation de licence nettoyée pour retirer les mentions explicites d'affiliation tierce.

## [26.05.31.4] - 2026-05-31

### Ajouté

- README complet.
- FAQ détaillée avec règles du jeu.
- Registre des sources.
- Guide de contribution.
- Politique de confidentialité.
- Documentation de structure projet.
- Conventions éditoriales.
- Notes techniques.
- Règles de versioning.
- Checklist de release.

### Modifié

- Version courante passée à `26.05.31.4`.
- Documentation organisée autour d'un point d'entrée clair.

### Nettoyé

- Les artefacts de test générés ne doivent plus être versionnés.

## [26.05.31.3] - 2026-05-31

### Ajouté

- Aide détaillée dans l'application.
- Exemples de types d'associations possibles.
- Affichage de la date du jour dans le statut principal.
- Ajustement dynamique des libellés des tuiles sur smartphone.
- Documentation projet complète : README, FAQ, sources, conventions, versioning, notes techniques et checklist de release.

### Modifié

- Le statut visible n'affiche plus `Grille #n`, mais la date du jour.
- Le crédit affiche `Lille-Mêle par Dr. John et Lady Em`.
- Les libellés de tuiles sont redimensionnés pour éviter les coupures disgracieuses.

### Vérifié

- Rendu iPhone 375 px : aide visible, date affichée, `Maroilles` tient sur une ligne.
- Aucune erreur console pendant le test Playwright.

## [26.05.31.2] - 2026-05-31

### Ajouté

- Feedback visuel renforcé lors des mauvaises réponses.
- Feedback distinct pour le cas "trois sur quatre".
- Version visible dans le footer.

### Modifié

- Suppression du visuel de tête.
- Remplacement du crédit de bas de page.
- Suppression des références religieuses détectées dans les contenus prototype.
- Accroche remplacée par `Connecte les mots avant la prochaine station.`

### Vérifié

- Mauvaise sélection : cartes colorées et message visible.
- Sélection "trois sur quatre" : message spécifique affiché.
- Aucune occurrence sensible détectée dans `index.html`.

## [26.05.31.1] - 2026-05-31

### Ajouté

- Première version jouable autonome dans `index.html`.
- Quatre puzzles prototype.
- Sélection et validation de 4 cartes.
- Détection des groupes corrects.
- Détection "trois sur quatre".
- Défaite après 4 erreurs.
- Victoire après 4 groupes.
- Streak local.
- Sauvegarde locale via `localStorage`.
- Partage sans spoiler.
- Bonus "P'tit Vrai ou Bidon ?".
- Panneau sources.
- Panneau règles initial.
- Licence double : code MIT, contenus et identité en droits réservés.

### Vérifié

- Smoke test Playwright : victoire complète, statut `won`, aucune erreur console.
- Test "trois sur quatre" : erreur comptabilisée et message attendu.
