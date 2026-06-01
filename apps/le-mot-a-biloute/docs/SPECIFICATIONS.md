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
2. Il peut ouvrir le premier indice, gratuit mais difficile.
3. Il propose un mot de la bonne longueur.
4. Les lettres sont évaluées.
5. Il ajuste ses propositions.
6. Il peut demander des indices supplémentaires dans la modale d'indice, avec pénalité.
7. Il gagne officiellement en trouvant le mot dans les 6 essais.
8. S'il échoue après 6 essais, la série est perdue et le Rab de Biloute commence.
9. Dans le Rab de Biloute, il peut continuer à proposer des mots jusqu'à trouver.
10. Il découvre le bonus local.
11. Il peut partager son résultat.

## Scoring

Score de base : 1000 points.

- Essai 1 : aucune pénalité.
- Chaque essai supplémentaire : -120 points.
- Chaque indice supplémentaire : -180 points.
- Victoire minimale : 50 points.
- Rab de Biloute : les pénalités continuent après le 6e essai et le score peut devenir négatif.
- Série : elle progresse uniquement en cas de victoire dans les 6 essais officiels ; elle est perdue dès l'entrée dans le Rab de Biloute.

Le temps ne fait pas partie du score principal.

## Partage

Format attendu :

```text
Le mot à Biloute 2026-05-31
820 points · 1/6 · 1 indice payant
🟩🟩🟩🟩🟩🟩
https://exemple.fr/le-mot-a-biloute/
```

Dans le Rab de Biloute, le résumé doit mentionner explicitement le mode :

```text
Le mot à Biloute 2026-05-31
-200 points · Rab de Biloute · 11 essais · 0 indice payant
⬛⬛⬛⬛⬛⬛
...
🟩🟩🟩🟩🟩🟩
https://exemple.fr/le-mot-a-biloute/
```

## Version

Version courante : `26.06.01.1`.

Le format est `AA.MM.JJ.i`.
