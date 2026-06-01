# Spécifications produit

## Titre

**Le mot à Biloute**

## Promesse

Un mot du Nord à deviner chaque jour.

## Concept

Le jeu propose chaque jour un mot lié à Lille, à la métropole lilloise, au Nord ou au parler ch'ti. Le nouveau mot arrive à 12 h, heure de Paris, et reste jouable jusqu'au lendemain à midi. Le joueur dispose de 6 essais officiels et reçoit un retour visuel après chaque proposition. S'il échoue au bout de ces 6 essais, sa série est perdue, mais il passe au Rab de Biloute et peut continuer jusqu'à trouver le mot.

Le jeu se joue directement dans le navigateur, sur mobile en priorité, sans compte et sans backend.

## Boucle de jeu

1. Le joueur ouvre le jeu.
2. Il peut ouvrir le premier Ch’ti coup d'pouce, gratuit mais difficile.
3. Il propose un mot de la bonne longueur.
4. Le jeu vérifie que la proposition est plausible selon la politique de validation active.
5. Les lettres sont évaluées.
6. Il ajuste ses propositions.
7. Il peut demander des coups d'pouce supplémentaires dans la modale dédiée, avec pénalité.
8. Il gagne officiellement en trouvant le mot dans les 6 essais.
9. S'il échoue après 6 essais, la série est perdue et le Rab de Biloute commence.
10. Dans le Rab de Biloute, il peut continuer à proposer des mots jusqu'à trouver.
11. Il découvre le bonus local et le détail du score.
12. Il peut partager son résultat.

## Validation des propositions

La version actuelle utilise un **mode découverte** défini dans `packages/corpus/le-mot-a-biloute/guess-policy.json`.

- Le jeu accepte les propositions plausibles de la bonne longueur.
- Il refuse les suites manifestement non jouables, par exemple une même lettre répétée partout ou une proposition sans voyelle ni `Y`.
- Les réponses acceptées du mot du jour restent toujours valides.
- Le mode pourra passer en `strict` quand un dictionnaire ou une liste de propositions validées sera fourni avec le corpus éditorial.

## Scoring

Score de base : 1000 points.

- Essai 1 : aucune pénalité.
- Chaque essai supplémentaire : -120 points.
- Chaque coup d'pouce supplémentaire : -180 points.
- Victoire minimale : 50 points.
- Rab de Biloute : les pénalités continuent après le 6e essai et le score peut devenir négatif.
- Série : elle progresse uniquement en cas de victoire dans les 6 essais officiels ; elle est perdue dès l'entrée dans le Rab de Biloute.

Le temps ne fait pas partie du score principal.

## Partage

Format attendu :

```text
Le mot à Biloute 2026-05-31
820 points · 1/6 · 1 coup d'pouce payant
🟩🟩🟩🟩🟩🟩
https://exemple.fr/le-mot-a-biloute/
```

Dans le Rab de Biloute, le résumé doit mentionner explicitement le mode :

```text
Le mot à Biloute 2026-05-31
-200 points · Rab de Biloute · 11 essais · 0 coups d'pouce payants
⬛⬛⬛⬛⬛⬛
...
🟩🟩🟩🟩🟩🟩
https://exemple.fr/le-mot-a-biloute/
```

## Version

Version courante : `26.06.01.2`.

Le format est `AA.MM.JJ.i`.
