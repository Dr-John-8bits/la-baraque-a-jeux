# Audit Lille-Mêle

Version auditee : `26.05.31.4`  
Version de livraison de cet audit : `26.05.31.5`  
Date : 2026-05-31

## Synthese

Lille-Mêle a deja un socle jouable solide : une grille 4x4, des groupes detectes correctement, un retour "trois sur quatre", une sauvegarde locale, une aide integree, des sources visibles, un partage sans spoiler et une adaptation mobile deja testee sur iPhone.

Le prochain vrai palier n'est pas seulement graphique. Il faut separer proprement la technique et l'editorial, car la valeur du projet sera dans la qualite du corpus : grilles justes, locales, sourcees, rejouables, protegees juridiquement et faciles a produire sur la duree.

## Etat actuel

- Application autonome dans `index.html`.
- Pas de build, pas de dependance et pas de backend.
- Version visible dans le footer.
- Donnees prototype embarquees dans le JavaScript.
- Sauvegarde dans `localStorage`.
- Documentation projet deja structuree avec README, FAQ, sources, roadmap, licences, confidentialite et guides internes.
- Regle editoriale stricte : aucune reference religieuse dans le jeu.

## Ce qui fonctionne bien

- La boucle de jeu est claire : selectionner 4 cartes, valider, trouver 4 familles.
- Le feedback d'erreur est visible et differencie le cas "trois sur quatre".
- Les cartes sont des boutons, donc la base d'accessibilite est meilleure qu'une grille purement visuelle.
- Le rendu mobile est prioritaire, avec ajustement dynamique de la taille des libelles.
- La logique expose `window.render_game_to_text`, ce qui facilite les tests Playwright.
- Les licences distinguent correctement le code technique sous MIT et les contenus en droits reserves.
- Le projet a deja une base documentaire assez nette pour travailler en parallele.

## Points de vigilance produit

### Rituel quotidien

Le jeu affiche la date, ce qui est bon pour l'habitude quotidienne. En revanche, le numero de grille reste utile pour les archives, le partage, les tests et le support. Recommandation : garder la date dans l'interface principale, et conserver le numero dans les metadonnees, l'URL d'archive et le partage.

### Premiere comprehension

L'aide existe, mais elle est encore cachee derriere un bouton `?`. Pour une V1 publique, il faudra probablement ajouter un petit ecran d'aide au premier lancement, stocke localement, puis ne plus le montrer.

### Identite

Le nom `Lille-Mêle` est court, local, memorisable et assez distinctif. Je recommande de le garder. `Lille-Mêle-Tout` est plus descriptif mais moins elegant, plus long sur mobile, et donne une sensation plus gadget.

### Ton

La voix est deja dans la bonne zone : locale, complice, un peu joueuse. Il faudra cadrer la repetition des blagues de metro, de pluie, de braderie et de nourriture pour eviter l'effet carte postale automatique.

## Audit UX et mobile

### Points forts

- Layout compact et lisible.
- Actions principales visibles.
- Panneaux d'aide et de sources simples.
- Les longues etiquettes comme `Maroilles` sont mieux protegees contre les retours a la ligne disgracieux.

### A ameliorer

- Ajouter `aria-label` explicites aux boutons `?` et `i`, car `title` ne suffit pas pour tous les lecteurs d'ecran.
- Ajouter une marge avec `env(safe-area-inset-bottom)` pour la barre d'actions sticky sur iPhone.
- Tester les largeurs 320 px, 360 px, 375 px, 390 px et 430 px.
- Prevoir des icones plus propres quand le systeme visuel sera stabilise.
- Ajouter un etat "grille terminee aujourd'hui" plus ritualise, avec invitation a revenir demain.

## Audit accessibilite

### Deja present

- Boutons natifs pour les cartes.
- `aria-pressed` sur les cartes selectionnees.
- Zone `aria-live` pour les messages.
- Respect de `prefers-reduced-motion`.
- Focus visible sur les boutons.

### A faire

- Auditer le parcours clavier complet.
- Ajouter des libelles accessibles aux boutons d'aide, de sources, de partage et de bonus si besoin.
- Tester VoiceOver sur iOS.
- Verifier les contrastes exacts en mode clair et sombre.
- Ajouter un texte non visuel ou une structure claire pour les groupes trouves.

## Audit logique de jeu

### Fonctionnel

- Detection d'un groupe correct.
- Detection du "trois sur quatre".
- Defaite apres 4 erreurs.
- Victoire apres 4 groupes.
- Reinitialisation de la grille.
- Melange des cartes actives.
- Sauvegarde de l'etat courant.
- Bonus vrai/faux apres victoire.

### Risques techniques

- Le streak actuel ne verifie pas encore la consecutivite reelle des jours. Il doit stocker une cle de date ou un index de grille, puis incrementer uniquement si la grille precedente a ete jouee.
- Le choix de grille repose sur `dayIndex % puzzles.length`, pratique pour le prototype, mais insuffisant pour un calendrier editorial public.
- Les donnees sont dans `index.html`, ce qui va devenir difficile a maintenir des que le corpus grossira.
- Il n'existe pas encore de validateur automatique pour detecter doublons, categories incompletes, items ambigus ou contenus interdits.
- Les sources sont listees globalement, mais pas encore reliees a chaque item, groupe ou anecdote.

## Audit editorial

### Etat actuel

Les 4 grilles prototype sont utiles pour tester la sensation du jeu. Elles ne doivent pas etre considerees comme prêtes au lancement public sans validation documentaire.

### Risques editoriaux

- Certaines affirmations precises doivent etre reverifiees avant publication.
- Certains items peuvent appartenir a plusieurs familles selon la grille.
- Les noms de lieux, quartiers, stations et communes doivent etre normalises.
- Les categories doivent etre justes apres revelation, pas seulement devinables.
- Les anecdotes doivent etre reformulees originalement, pas copiees depuis des sources.

### Priorite editoriale

Construire un corpus brut beaucoup plus large que les grilles finales. Pour 30 grilles de 16 cartes, il faut au moins 500 occurrences jouables, plus des doublons candidats et des variantes, afin de pouvoir retirer les elements trop ambigus.

## Audit juridique et licence

### Ce qui est bon

- Double licence claire : code MIT, contenus et identite en droits reserves.
- Les contenus editoriaux, grilles, textes, questions, noms et assets sont reserves.
- Les donnees publiques brutes ne sont pas revendiquees, seule leur selection et editorialisation originale le sont.

### A corriger ou surveiller

- Eviter les mentions visibles ou trop appuyees de jeux tiers dans l'experience, la marque et le discours public.
- Ne pas copier l'habillage, les textes, le nommage de niveaux, les couleurs ou les formulations caracteristiques d'un jeu existant.
- Faire valider la strategie de licence par un juriste avant revente, surtout si des contributeurs externes participent au corpus.
- Exiger un accord ecrit pour toute contribution editoriale externe.

## Audit technique

### Court terme

Le fichier unique est acceptable pour iterer vite. Il deviendra vite limite pour :

- tester la logique de jeu ;
- valider les grilles ;
- maintenir le calendrier ;
- relire le corpus ;
- isoler le contenu proprietaire du code MIT.

### Architecture cible recommandee

- `src/lib/gameLogic.ts` : validation des selections, erreurs, victoire, defaite.
- `src/lib/datePuzzle.ts` : resolution de la grille du jour.
- `src/lib/storage.ts` : sauvegarde, streak, migration.
- `src/data/puzzles.json` : grilles publiees ou candidates.
- `src/data/sources.json` : sources structurees.
- `src/data/corpus.json` : banque d'items editoriaux.
- `scripts/validate-puzzles.ts` : validation automatique du corpus.
- `scripts/audit-content.ts` : detection de doublons, mots interdits et categories fragiles.

## Plan de travail parallele

### Piste technique Codex

1. Stabiliser le MVP actuel dans `index.html`.
2. Corriger les points d'accessibilite simples.
3. Ajouter une vraie cle de date pour les stats et streaks.
4. Creer un validateur de grilles.
5. Extraire les donnees prototype dans un fichier dedie.
6. Convertir ensuite vers Vite + TypeScript quand le modele de donnees est stable.
7. Ajouter des tests unitaires sur la logique et des tests Playwright mobile.

### Piste editoriale Jean

1. Constituer le corpus source selon `EDITORIAL_CORPUS_REQUEST.md`.
2. Distinguer faits bruts, formulations originales, anecdotes et questions.
3. Noter les sources et dates de consultation.
4. Identifier les items interdits, sensibles ou ambigus.
5. Proposer des familles candidates de 4 items.
6. Valider 30 grilles MVP, puis 45 a 60 pour tenir le rythme apres lancement.

## Priorites recommandees

### Priorite 1

- Creer le corpus documentaire structure.
- Ajouter un validateur de grilles.
- Corriger le calcul du streak.
- Renforcer accessibilite des boutons et safe area mobile.

### Priorite 2

- Separarer donnees et logique.
- Ajouter un calendrier editorial.
- Creer une page sources plus riche.
- Formaliser le schema `Puzzle`.

### Priorite 3

- Migrer vers Vite + TypeScript.
- Ajouter archives, PWA et statistiques locales enrichies.
- Ajouter un outil interne de creation et verification de grilles.

## Definition de "jeu complet"

Pour considerer Lille-Mêle complet en V1, il faut :

- 30 a 45 grilles validees et sourcees ;
- un schema de donnees stable ;
- un validateur automatique ;
- une experience mobile impeccable ;
- un partage sans spoiler ;
- une aide claire ;
- une page sources et credits ;
- une protection juridique claire ;
- aucune reference religieuse dans l'experience ;
- une strategie de contenu pour produire les grilles suivantes.

