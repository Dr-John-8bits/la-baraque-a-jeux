# Game design

## Objectif du document

Ce document consigne les choix de game design, de gameplay, de flow et d'interface pour Station Mystère avant le développement du jeu.

Il sert de feuille de route fonctionnelle pour la v1. L'objectif est d'avoir une vision suffisamment claire pour développer ensuite sans réinventer les mécaniques déjà présentes dans La Baraque à Jeux Lille.

Le développement du jeu n'a pas encore commencé. Le corpus métro est prêt pour une première version centrée sur Métro Mystère.

---

## Vision du jeu

Station Mystère est un jeu quotidien d'enquête locale autour des transports de la métropole lilloise.

Le joueur doit identifier une station ou une ligne à partir d'indices progressifs. Le jeu doit être simple à comprendre, rapide à jouer, mais suffisamment éditorial pour donner envie de découvrir l'histoire des lieux.

La promesse n'est pas seulement de deviner une réponse. La promesse est de reconnaître un lieu, d'apprendre une anecdote, puis de repartir avec une petite fiche découverte.

La v1 doit se concentrer sur le métro.

---

## Périmètre v1

La première version jouable porte uniquement sur Métro Mystère.

Réponse attendue :

- nom d'une station de métro de Lille ;
- sélection parmi les 60 stations des lignes M1 et M2 ;
- validation via le fichier éditorial `packages/corpus/station-mystere/editorial-entries.json`.

Les niveaux Tramway, V'Lille et Bus restent dans la vision globale, mais ne doivent pas bloquer la v1.

Position recommandée :

- v1 : Métro Mystère seul ;
- v2 : ajout du Tramway ;
- v3 : ajout de V'Lille ;
- v4 : ajout du Bus.

Cette approche permet de valider le moteur, le rythme, la difficulté, la recherche de station et la fiche découverte sur un corpus déjà complet.

---

## Décisions fermes pour lancer le développement

Ces décisions doivent être considérées comme le point de départ de la v1.

- le jeu commence directement sur l'écran jouable, pas sur une page de présentation ;
- la v1 contient un seul niveau : Métro Mystère ;
- la réponse attendue est une station de métro ;
- le bouton principal s'appelle Valider ;
- les suggestions apparaissent à partir de 2 caractères ;
- la liste de suggestions affiche au maximum 6 stations ;
- le champ vide n'affiche pas toutes les stations ;
- le joueur peut valider une station sélectionnée ou une réponse tapée librement ;
- le score commence à 1000 ;
- la défaite survient à 0 point ;
- la réponse est révélée immédiatement après victoire ou défaite ;
- le calepin est présent dès la v1 ;
- la zone de notes personnelles n'est pas présente dans la première v1 ;
- les statistiques sont présentes dès la v1, mais restent simples ;
- le partage ne révèle jamais la station du jour ;
- la ligne M1 ou M2 ne doit pas être affichée en permanence avant résolution, sauf si elle fait partie d'un indice révélé ;
- l'interface doit réutiliser les styles et utilitaires existants du portail ;
- le jeu reste en JavaScript natif, sans framework ni moteur de jeu.

---

## MVP strict

La v1 doit inclure :

- sélection quotidienne d'une station de métro ;
- affichage du premier indice ;
- recherche de station avec suggestions ;
- validation de réponse ;
- pénalité en cas de mauvaise réponse ;
- déblocage des indices payants ;
- victoire ;
- défaite à 0 point ;
- fiche découverte ;
- statistiques locales ;
- partage du résultat ;
- sauvegarde et reprise de la partie du jour ;
- interface responsive mobile et desktop.

La v1 ne doit pas inclure :

- tramway ;
- V'Lille ;
- bus ;
- archive complète des anciennes parties ;
- carte du métro ;
- classement en ligne ;
- compte utilisateur ;
- zone de notes personnelles ;
- images ou médias station par station ;
- dépendance à un serveur.

---

## Positionnement dans La Baraque à Jeux

Station Mystère doit rester dans la même famille que les autres jeux du portail.

Principes à conserver :

- jeu quotidien ;
- interface mobile-first ;
- partie courte ;
- sauvegarde locale ;
- partage du résultat ;
- statistiques personnelles ;
- ton local, accessible et légèrement joueur ;
- cohérence visuelle avec le portail ;
- aucun backend obligatoire.

Station Mystère ne doit pas devenir une application de transport, une carte interactive ou un outil documentaire lourd. C'est un jeu de déduction avec une dimension culturelle.

---

## Inspirations internes

### Le Mot à Biloute

C'est la référence principale pour la v1.

Mécaniques à reprendre ou adapter :

- sélection quotidienne ;
- score ;
- indices progressifs ;
- calepin ;
- statistiques ;
- sauvegarde locale ;
- dialogue de résultat ;
- partage ;
- reprise d'une partie en cours ;
- logique de jeu simple, centrée sur une réponse à trouver.

Ce qu'il ne faut pas reprendre tel quel :

- la logique de lettres ;
- le clavier ou la grille de mot ;
- une interface trop centrée sur la graphie de la réponse.

### Lille-Mêle

Références utiles :

- affichage clair de l'état de partie ;
- feedback immédiat après action ;
- premier écran d'aide ;
- logique de groupe et de résultat quotidien ;
- style de cartes compactes et lisibles.

### Biloute, Bière, Braderie

Références utiles :

- ton ludique ;
- score très visible ;
- écran de résultat simple ;
- rythme rapide.

---

## Fantaisie de jeu

Le joueur est face à une station inconnue.

Il consulte progressivement des indices comme s'il feuilletait un petit carnet d'enquête. La réponse se trouve par déduction, mémoire du réseau, connaissance de Lille ou observation des indices.

Mots-clés d'ambiance :

- station ;
- quai ;
- panneau ;
- calepin ;
- enquête locale ;
- fiche découverte ;
- trajet du jour.

Le jeu ne doit pas imiter officiellement l'identité Ilévia. Il peut évoquer l'univers du transport avec ses propres codes graphiques.

---

## Écran principal recommandé

L'écran principal doit être directement jouable.

Structure recommandée :

```txt
[Navigation La Baraque à Jeux Lille]

Station Mystère                         Score 1000
Métro de Lille · énigme du jour          Indice 1/5

┌────────────────────────────────────────────┐
│              STATION MYSTÈRE               │
│                                            │
│       Panneau de station masqué            │
│                                            │
│  Indice 1                                  │
│  Texte de l'indice gratuit                 │
└────────────────────────────────────────────┘

[Débloquer un indice]  [Calepin]  [Stats]

Rechercher une station
[ champ de recherche ]

[Valider]
```

Sur mobile, le score, l'indice actif et les actions doivent rester lisibles sans créer une interface trop dense.

---

## Wireframe mobile recommandé

Le mobile est le support prioritaire.

Structure recommandée :

```txt
[Nav compacte]

Station Mystère
Métro du jour

[Score 1000] [Indice 1/5]

┌──────────────────────┐
│ STATION MYSTÈRE      │
│ Nom masqué           │
│                      │
│ Indice gratuit       │
│ Texte de l'indice    │
└──────────────────────┘

[+ Indice -150]

Rechercher une station
[ champ de recherche ]
[suggestion]
[suggestion]
[suggestion]

[Valider]

[Calepin] [Stats]
```

Principes mobile :

- une seule action principale visible : Valider ;
- le bouton d'indice doit afficher le coût du prochain indice ;
- les suggestions doivent être tapables confortablement ;
- le calepin et les stats peuvent s'ouvrir en modale ;
- la fiche découverte peut remplacer le panneau principal après la fin de partie.

---

## Wireframe desktop recommandé

Sur desktop, l'interface peut être légèrement plus respirante.

Structure recommandée :

```txt
[Nav La Baraque à Jeux Lille]

┌──────────────────────────────┐ ┌─────────────────────┐
│ Station Mystère              │ │ Calepin             │
│ Métro de Lille               │ │ Score               │
│                              │ │ Indices révélés     │
│ Panneau de station masqué    │ │ Tentatives          │
│                              │ │                     │
│ Indice en cours              │ │ [Stats]             │
│                              │ │ [Partager si fini]  │
└──────────────────────────────┘ └─────────────────────┘

Rechercher une station
[ champ de recherche + suggestions ]
[Valider] [+ Indice]
```

Le desktop ne doit pas devenir un tableau de bord. Le panneau mystère reste le centre visuel du jeu.

---

## Hiérarchie d'interface

Priorité 1 :

- nom du jeu ;
- score ;
- indice actuellement visible ;
- champ de réponse ;
- bouton Valider.

Priorité 2 :

- bouton d'indice suivant ;
- calepin ;
- tentatives précédentes ;
- message de feedback.

Priorité 3 :

- statistiques ;
- aide ;
- partage ;
- détails de fiche découverte après résolution.

Le joueur doit toujours savoir :

- ce qu'il cherche ;
- combien il a de points ;
- quoi faire maintenant ;
- ce que lui coûte le prochain indice ;
- si sa dernière action a réussi ou échoué.

---

## Boucle de jeu

Boucle v1 :

1. Le joueur arrive sur l'énigme du jour.
2. Le premier indice est affiché gratuitement.
3. Le joueur peut proposer une station via la recherche.
4. Une mauvaise réponse retire 100 points.
5. Le joueur peut débloquer un indice supplémentaire en échange de points.
6. Le joueur continue jusqu'à trouver ou atteindre 0 point.
7. Le jeu affiche la réponse et la fiche découverte.
8. Les statistiques et le partage sont proposés.

Le jeu doit toujours donner une sortie satisfaisante : victoire ou défaite, le joueur voit la bonne réponse et apprend quelque chose.

---

## Recherche et validation de réponse

Le joueur tape dans une barre de recherche.

Comportement recommandé :

- suggestions affichées à partir de 2 ou 3 caractères ;
- suggestions limitées aux stations du niveau en cours ;
- sélection d'une suggestion possible au clavier, à la souris ou au doigt ;
- validation via bouton ;
- validation possible si le joueur tape directement une réponse acceptée ;
- tolérance aux accents, apostrophes, tirets, espaces et variantes courantes ;
- utilisation des réponses acceptées du corpus éditorial.

La recherche doit aider le joueur à éviter les fautes, sans transformer le jeu en liste ouverte permanente.

Recommandation importante :

- ne pas afficher toutes les stations lorsque le champ est vide dans la v1 ;
- éviter une liste déroulante trop complète qui donne l'impression de choisir au hasard ;
- afficher quelques résultats maximum, par exemple 6 à 8 suggestions.

---

## Normalisation des réponses

La validation doit comparer des formes normalisées.

Normalisation recommandée :

- convertir en minuscules ;
- retirer les accents ;
- remplacer apostrophes et tirets par des espaces ;
- supprimer la ponctuation non utile ;
- réduire les espaces multiples ;
- ignorer les espaces en début et fin de chaîne.

Exemples :

- `République - Beaux-Arts` doit accepter `republique beaux arts` ;
- `Gare Lille-Flandres` doit accepter `gare lille flandres` ;
- `C.H.U. - Eurasanté` doit accepter `chu eurasante` ;
- `4 Cantons - Stade Pierre-Mauroy` doit accepter `4 cantons stade pierre mauroy`.

Le corpus éditorial reste prioritaire : la normalisation aide, mais les variantes importantes doivent rester explicites dans `reponsesAcceptees`.

---

## Cas limites de réponse

Réponse vide :

- ne pas pénaliser ;
- afficher un message bref invitant à saisir une station.

Réponse inconnue :

- pénaliser si le joueur valide vraiment ;
- ajouter la tentative au calepin ;
- afficher un message indiquant que ce n'est pas la bonne station.

Réponse déjà tentée :

- ne pas pénaliser une deuxième fois ;
- afficher un message indiquant que cette station a déjà été essayée.

Réponse correcte tapée sans sélectionner une suggestion :

- accepter si elle correspond à la réponse canonique ou à une réponse acceptée.

Réponse correcte après défaite :

- impossible, la partie est terminée ;
- le champ doit être désactivé ou remplacé par la fiche découverte.

---

## Calepin

Le calepin est une mécanique importante à reprendre de Le Mot à Biloute.

Rôle du calepin :

- garder les indices révélés ;
- afficher les tentatives déjà faites ;
- rappeler les pénalités appliquées ;
- servir de journal de partie ;
- accueillir la fiche découverte après victoire ou défaite.

Contenu recommandé pendant la partie :

- nom du niveau : Métro Mystère ;
- score actuel ;
- indices révélés ;
- indices encore verrouillés ;
- historique des réponses proposées ;
- indication des coûts des prochains indices.

Option possible, à garder pour plus tard :

- zone de notes personnelles locale, non partagée, permettant au joueur de noter ses hypothèses.

Cette option est séduisante, mais elle n'est pas indispensable pour le premier développement.

---

## Comportement du calepin

Sur mobile :

- le calepin s'ouvre en modale ou panneau plein écran ;
- il doit se fermer facilement ;
- il ne doit pas masquer une action critique en cours ;
- il peut être consulté après victoire ou défaite.

Sur desktop :

- le calepin peut être visible dans une colonne latérale ;
- si l'espace manque, il peut rester en panneau ouvrant.

Contenu après victoire :

- réponse trouvée ;
- score final ;
- indices utilisés ;
- tentatives ;
- fiche découverte ;
- bouton de partage.

Contenu après défaite :

- bonne réponse ;
- score à 0 ;
- indices utilisés ;
- tentatives ;
- fiche découverte.

---

## Indices

Chaque énigme possède cinq indices.

Règle :

- indice 1 : gratuit, affiché au départ ;
- indice 2 : payant ;
- indice 3 : payant ;
- indice 4 : payant ;
- indice 5 : payant.

L'ordre doit aller du plus large au plus précis.

Exemple de progression :

1. type de réseau ou ligne ;
2. commune ou quartier ;
3. correspondance, voisinage ou repère urbain ;
4. origine du nom ou particularité historique ;
5. indice très discriminant.

Le dernier indice ne doit pas être une révélation directe, mais il peut rendre la réponse très probable.

---

## Score

Score de départ par niveau :

- 1000 points.

Barème :

- indice 1 : gratuit ;
- indice 2 : -150 points ;
- indice 3 : -200 points ;
- indice 4 : -250 points ;
- indice 5 : -300 points ;
- mauvaise réponse : -100 points ;
- score minimum : 0.

Principes :

- trouver vite est récompensé ;
- demander de l'aide coûte cher mais reste assumé ;
- les mauvaises réponses sont pénalisées sans être bloquantes ;
- le joueur peut continuer tant que le score reste supérieur à 0.

---

## Cas limites de score

Le score ne descend jamais sous 0.

Si une pénalité fait passer le score sous 0 :

- fixer le score à 0 ;
- déclencher immédiatement la défaite ;
- révéler la réponse ;
- afficher la fiche découverte.

Si le joueur demande un indice dont le coût dépasse le score restant :

- autoriser l'action ;
- appliquer la pénalité jusqu'à 0 ;
- révéler l'indice ;
- déclencher la défaite juste après, avec la réponse et la fiche découverte.

Cette règle évite les états ambigus et garde le système lisible.

---

## Victoire

Le joueur gagne le niveau quand il valide la bonne station.

Après victoire, afficher :

- réponse exacte ;
- score final ;
- nombre d'indices utilisés ;
- nombre de mauvaises réponses ;
- récompense éventuelle ;
- fiche découverte ;
- bouton de partage ;
- accès aux statistiques.

La victoire doit être rapide, claire et généreuse.

---

## Défaite

La défaite survient lorsque le score atteint 0.

Après défaite, afficher immédiatement :

- bonne réponse ;
- fiche découverte ;
- score final à 0 ;
- récapitulatif des indices utilisés ;
- récapitulatif des tentatives ;
- bouton pour partager ou consulter les stats, si pertinent.

Le jeu ne doit pas cacher la réponse jusqu'au lendemain. La dimension documentaire impose de montrer la réponse et de donner la fiche découverte.

---

## Récompenses

Pour la v1 métro, les récompenses doivent rester simples.

Proposition :

- coupe de bronze si le joueur trouve sans erreur et sans indice payant ;
- médaille de bronze si le joueur trouve avec erreurs ou indices payants ;
- aucune récompense si le joueur perd, mais fiche découverte affichée.

Les coupes argent, or et platine seront utiles lorsque Tramway, V'Lille et Bus seront intégrés.

---

## Statistiques

Les statistiques doivent capitaliser sur les habitudes des autres jeux du portail.

Stats recommandées pour la v1 :

- parties jouées ;
- victoires ;
- taux de réussite ;
- série en cours ;
- meilleure série ;
- meilleur score ;
- score moyen ;
- nombre moyen d'indices utilisés ;
- répartition des victoires par nombre d'indices.

Stats à garder pour plus tard :

- historique détaillé des stations jouées ;
- archive complète ;
- performances par ligne M1 ou M2 ;
- comparaisons entre niveaux lorsque les autres modes seront ajoutés.

---

## Modèle de statistiques v1

Les statistiques locales peuvent être calculées à partir de ces champs :

```json
{
  "played": 0,
  "wins": 0,
  "losses": 0,
  "currentStreak": 0,
  "bestStreak": 0,
  "bestScore": 0,
  "totalScore": 0,
  "totalHintsUsed": 0,
  "winsByHintsUsed": {
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0
  },
  "lastPlayedDateId": null
}
```

Formules :

- taux de réussite = `wins / played` ;
- score moyen = `totalScore / wins`, si au moins une victoire ;
- moyenne d'indices = `totalHintsUsed / played`, si au moins une partie ;
- série en cours augmentée uniquement après une victoire ;
- série en cours remise à 0 après une défaite.

Une partie déjà terminée ne doit pas modifier les statistiques une deuxième fois au rechargement.

---

## Partage

Le partage doit rester court et lisible.

Exemple de format v1 :

```txt
Station Mystère #2026-06-05
Métro : trouvé en 3 indices
Score : 650
🏅 Bronze
```

Le texte partagé ne doit pas révéler la station du jour.

Le partage doit utiliser la mécanique déjà présente dans le portail lorsque c'est possible.

---

## Fiche découverte

La fiche découverte est un pilier du jeu.

Elle doit apparaître après la victoire ou après la défaite.

Contenu recommandé :

- titre de la station ;
- ligne ou lignes desservies ;
- commune ou quartier ;
- origine du nom si disponible ;
- fait historique ou patrimonial ;
- anecdote courte ;
- éventuellement une mention de correspondance ou de lieu proche.

Ton recommandé :

- court ;
- reformulé ;
- accessible ;
- local ;
- informatif sans devenir encyclopédique.

La fiche découverte ne doit pas être un copier-coller des sources. Elle doit être issue du corpus éditorial.

---

## Flow complet v1

```txt
Chargement
  -> sélection de la station du jour
  -> restauration éventuelle de la partie locale

État initial
  -> score 1000
  -> indice 1 visible
  -> champ de recherche actif

Action joueur
  -> proposition de station
  -> ou demande d'indice
  -> ou ouverture du calepin
  -> ou ouverture des stats

Mauvaise réponse
  -> -100 points
  -> message bref
  -> tentative ajoutée au calepin
  -> vérification score

Indice demandé
  -> pénalité selon indice
  -> nouvel indice révélé
  -> calepin mis à jour
  -> vérification score

Bonne réponse
  -> victoire
  -> fiche découverte
  -> stats mises à jour
  -> partage disponible

Score à 0
  -> défaite
  -> réponse révélée
  -> fiche découverte
  -> stats mises à jour
```

---

## États d'interface à prévoir

États principaux :

- chargement ;
- erreur de chargement du corpus ;
- partie du jour non commencée ;
- partie en cours ;
- suggestion ouverte ;
- mauvaise réponse ;
- indice révélé ;
- victoire ;
- défaite ;
- partie déjà terminée ;
- stats ouvertes ;
- calepin ouvert ;
- aide ouverte.

Chaque état doit être pensé mobile et clavier.

---

## Direction visuelle

Le jeu doit rester dans l'esthétique de La Baraque à Jeux Lille.

Direction recommandée :

- fond sombre ou surface chaude selon les tokens existants ;
- panneau central inspiré d'un affichage de station ;
- cartes simples et lisibles ;
- score très visible ;
- calepin comme surface secondaire ;
- contrastes forts pour usage mobile ;
- animations légères uniquement pour les changements d'état.

Éléments visuels possibles :

- panneau de quai stylisé ;
- ligne de métro abstraite ;
- pastilles M1 et M2 ;
- bandeau de station masquée ;
- pictogrammes sobres pour indice, calepin, stats et partage.

À éviter :

- carte complète du réseau ;
- imitation exacte de la signalétique Ilévia ;
- interface trop administrative ;
- empilement de cartes décoratives ;
- effets visuels qui masquent la lisibilité ;
- page d'accueil marketing avant le jeu.

---

## Mobile

Le mobile est prioritaire.

Principes :

- le joueur doit comprendre l'action principale en quelques secondes ;
- le champ de recherche doit être facile à utiliser au doigt ;
- les suggestions doivent être suffisamment grandes ;
- le score ne doit pas disparaître ;
- le bouton de validation doit rester proche du champ ;
- le calepin peut être un panneau ou une modale ;
- les dialogues doivent être courts et lisibles.

Le jeu doit être jouable dans les transports, en extérieur, avec peu de temps.

---

## Accessibilité

Exigences :

- navigation clavier complète ;
- labels explicites sur le champ de recherche ;
- messages de résultat accessibles ;
- contraste suffisant ;
- pas d'information uniquement portée par la couleur ;
- boutons avec libellés clairs ou icônes accompagnées d'un nom accessible ;
- respect de `prefers-reduced-motion`.

---

## Données nécessaires

Le développement v1 doit s'appuyer sur :

- `packages/corpus/station-mystere/editorial-entries.json` ;
- uniquement les entrées `niveau: "metro"` ;
- réponses acceptées ;
- cinq indices ;
- fiche découverte ;
- sources ;
- difficulté éditoriale si utile.

Le moteur ne doit pas lire directement les pages Wikipédia brutes.

Les données brutes et la réserve documentaire restent des outils de production du corpus, pas des données de jeu côté interface.

---

## Réutilisation technique attendue

Éléments à réutiliser en priorité :

- navigation commune du portail ;
- tokens CSS communs ;
- styles de base communs ;
- `packages/ui/about-dialog.js` ;
- `packages/game-utils/daily.js` ;
- `packages/game-utils/storage.js` ;
- `packages/game-utils/share.js` ;
- `packages/game-utils/fetch-json.js` ;
- logique de stats inspirée de Le Mot à Biloute ;
- logique de résultat inspirée de Le Mot à Biloute ;
- logique de feedback simple inspirée de Lille-Mêle.

Le développement doit rester en JavaScript natif comme les autres jeux existants, sauf décision contraire ultérieure.

---

## Inventaire de composants réutilisables

Composants et comportements à reprendre de Le Mot à Biloute :

- structure de jeu quotidien ;
- gestion d'une partie du jour ;
- sauvegarde locale ;
- statistiques ;
- partage ;
- dialogue de résultat ;
- reprise d'une partie déjà commencée ;
- logique de calepin, adaptée au contenu station.

Composants et comportements à reprendre de Lille-Mêle :

- feedback court après action ;
- messages d'état lisibles ;
- logique de première aide ;
- présentation compacte d'un résultat quotidien.

Composants et comportements à reprendre du portail :

- navigation commune ;
- bouton À propos ;
- tokens de couleur ;
- base typographique ;
- règles responsive ;
- conventions de boutons et panneaux.

À mutualiser plus tard si le besoin revient :

- composant de statistiques commun ;
- composant de partage commun enrichi ;
- composant de dialogue de résultat commun ;
- composant de calepin ou journal de partie.

Pour la v1, il est acceptable de copier-adapter certaines logiques existantes dans `apps/station-mystere/app.js`, puis de mutualiser après stabilisation.

---

## Architecture recommandée pour la v1

Fichiers probables :

- `apps/station-mystere/index.html` ;
- `apps/station-mystere/styles.css` ;
- `apps/station-mystere/app.js`.

Responsabilités de `app.js` :

- charger les fiches éditoriales ;
- filtrer le niveau métro ;
- sélectionner l'énigme du jour ;
- restaurer la partie locale ;
- gérer les indices ;
- gérer les propositions ;
- calculer le score ;
- gérer victoire et défaite ;
- écrire les stats ;
- produire le texte de partage.

Préfixe de stockage recommandé :

- `station-mystere.v1.`

---

## Contrat de données v1

Le moteur v1 attend des entrées éditoriales métro ayant au minimum :

```json
{
  "id": "metro-exemple",
  "niveau": "metro",
  "typeReponse": "station",
  "reponse": "Nom canonique",
  "reponsesAcceptees": ["Nom canonique", "Variante"],
  "indices": [
    {
      "ordre": 1,
      "type": "ligne",
      "texte": "Texte de l'indice."
    }
  ],
  "ficheDecouverte": {
    "titre": "Nom canonique",
    "texte": "Texte court de découverte.",
    "faits": []
  }
}
```

Règles :

- seules les entrées `niveau: "metro"` sont utilisées en v1 ;
- chaque entrée jouable doit avoir 5 indices ;
- les indices doivent être triés par `ordre` ;
- la réponse canonique doit être acceptée même si elle n'est pas répétée dans `reponsesAcceptees` ;
- la fiche découverte doit exister pour chaque entrée ;
- une entrée sans fiche découverte ne doit pas être proposée dans le jeu.

---

## Modèle d'état de partie

État recommandé pour la partie du jour :

```json
{
  "version": 1,
  "dateId": "2026-06-05",
  "entryId": "metro-rihour",
  "status": "playing",
  "score": 1000,
  "revealedHintCount": 1,
  "attempts": [],
  "penalties": [],
  "startedAt": "2026-06-05T12:05:00.000Z",
  "completedAt": null,
  "result": null,
  "statsApplied": false
}
```

Valeurs possibles de `status` :

- `playing` ;
- `won` ;
- `lost`.

Exemple de tentative :

```json
{
  "answer": "Rihour",
  "normalizedAnswer": "rihour",
  "isCorrect": false,
  "penalty": 100,
  "createdAt": "2026-06-05T12:07:00.000Z"
}
```

Exemple de pénalité :

```json
{
  "type": "hint",
  "hintNumber": 2,
  "points": 150
}
```

Le moteur doit pouvoir reconstruire l'écran à partir de cet état local.

---

## Stockage local

Clés recommandées :

- `station-mystere.v1.currentGame` ;
- `station-mystere.v1.stats` ;
- `station-mystere.v1.settings` ;
- `station-mystere.v1.firstHelpSeen`.

Règles :

- une partie est liée à un `dateId` ;
- si le `dateId` stocké ne correspond plus au jour courant, créer une nouvelle partie ;
- si une partie du jour est terminée, afficher l'état terminé au rechargement ;
- les stats ne doivent être appliquées qu'une seule fois par partie ;
- les données invalides doivent être ignorées proprement.

---

## Messages de feedback

Messages recommandés :

- réponse vide : `Saisis ou sélectionne une station avant de valider.`
- mauvaise réponse : `Ce n'est pas cette station. -100 points.`
- réponse déjà tentée : `Tu as déjà essayé cette station.`
- indice révélé : `Nouvel indice débloqué.`
- victoire sans faute : `Sans faute. Coupe de bronze.`
- victoire avec aide : `Station trouvée. Médaille de bronze.`
- défaite : `Score à 0. La station mystère était...`
- erreur de chargement : `Impossible de charger l'énigme du jour.`

Les messages doivent être courts et ne pas casser le rythme.

---

## Aide intégrée

Une aide courte peut être affichée au premier lancement ou via un bouton dédié.

Contenu recommandé :

- trouve la station de métro du jour ;
- le premier indice est gratuit ;
- les indices suivants coûtent des points ;
- une mauvaise réponse coûte 100 points ;
- la partie est perdue à 0 point ;
- la réponse est révélée à la fin avec une fiche découverte.

L'aide ne doit pas occuper l'écran principal à chaque partie. Après première lecture, elle reste accessible mais discrète.

---

## Plan de développement détaillé

Étape 1 : socle jouable

- créer `app.js` ;
- charger les données ;
- sélectionner la station du jour ;
- afficher le premier indice ;
- afficher score et champ de recherche.

Étape 2 : réponses

- normaliser la saisie ;
- afficher les suggestions ;
- valider la station ;
- gérer mauvaises réponses ;
- gérer réponse correcte.

Étape 3 : indices et score

- afficher le coût du prochain indice ;
- révéler les indices payants ;
- appliquer les pénalités ;
- déclencher la défaite à 0.

Étape 4 : fin de partie

- afficher victoire ;
- afficher défaite ;
- afficher fiche découverte ;
- empêcher les actions après fin de partie.

Étape 5 : persistance

- sauvegarder la partie du jour ;
- restaurer au rechargement ;
- appliquer les stats une seule fois.

Étape 6 : interfaces secondaires

- calepin ;
- statistiques ;
- aide ;
- partage.

Étape 7 : finition

- responsive mobile ;
- accessibilité ;
- feedback visuel ;
- vérification desktop ;
- vérification mobile.

---

## Checklist de livraison v1

Avant de considérer la v1 prête :

- une station différente est sélectionnée selon le jour ;
- le même jour donne la même station pour tout le monde ;
- le premier indice est visible sans action ;
- les indices 2 à 5 coûtent le bon nombre de points ;
- une mauvaise réponse coûte 100 points ;
- une réponse déjà tentée ne repénalise pas ;
- le score ne descend jamais sous 0 ;
- la défaite révèle la réponse ;
- la victoire affiche la fiche découverte ;
- le partage ne révèle pas la réponse ;
- les stats ne se dupliquent pas au rechargement ;
- la partie terminée reste terminée après rechargement ;
- le champ de recherche fonctionne au clavier ;
- les suggestions fonctionnent au doigt ;
- les textes ne débordent pas sur mobile ;
- le jeu reste cohérent avec les autres pages du portail ;
- `npm run check` passe.

---

## Décisions ouvertes

Points à trancher avant ou pendant le développement :

- format exact du texte de partage ;
- niveau de détail de l'écran de statistiques v1 ;
- présentation exacte du calepin sur desktop ;
- style visuel précis du panneau de station mystère ;
- wording final des messages de feedback.

Ces décisions ne bloquent pas le développement du moteur.

---

## Critères de réussite de la v1

La v1 est réussie si :

- le joueur comprend immédiatement qu'il doit trouver une station ;
- la recherche de station est fluide sur mobile ;
- les indices donnent une vraie sensation de progression ;
- le score est lisible ;
- le calepin apporte une valeur réelle ;
- la fiche découverte donne envie de rejouer ;
- le jeu ressemble à un jeu de La Baraque à Jeux Lille ;
- le moteur réutilise les briques existantes au lieu de repartir de zéro ;
- le jeu fonctionne sans backend ;
- la partie du jour peut être partagée sans spoiler.

---

## Prochaine étape de développement

Quand le développement pourra commencer, l'ordre recommandé est :

1. transformer la page placeholder en écran jouable v1 métro ;
2. charger `editorial-entries.json` et sélectionner la station du jour ;
3. implémenter l'état de partie local ;
4. implémenter recherche, suggestions et validation ;
5. implémenter score, indices, victoire et défaite ;
6. ajouter calepin, fiche découverte et stats ;
7. ajouter partage ;
8. tester desktop et mobile ;
9. polir l'interface dans l'esthétique du portail.

La priorité est d'obtenir rapidement une partie métro complète, même sobre, puis de l'améliorer.

Le plan d'exécution technique détaillé est consigné dans `apps/station-mystere/implementation-plan.md`.
