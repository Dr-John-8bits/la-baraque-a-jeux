# Spécifications produit

## Titre

**Le mot à Biloute**

## Promesse

Un mot du Nord à deviner chaque jour.

## Concept

Le jeu propose chaque jour un mot lié à Lille, à la métropole lilloise, au Nord ou au parler ch'ti. Le joueur dispose de 6 essais et reçoit un retour visuel après chaque proposition.

Le jeu se joue directement dans le navigateur, sur mobile en priorité, sans compte et sans backend.

## Boucle de jeu

1. Le joueur ouvre le jeu.
2. Il lit le premier indice, gratuit mais difficile.
3. Il propose un mot de la bonne longueur.
4. Les lettres sont évaluées.
5. Il ajuste ses propositions.
6. Il peut demander des indices supplémentaires, avec pénalité.
7. Il gagne en trouvant le mot ou perd après 6 essais.
8. Il découvre le bonus local.
9. Il peut partager son résultat.

## Scoring

Score de base : 1000 points.

- Essai 1 : aucune pénalité.
- Chaque essai supplémentaire : -120 points.
- Chaque indice supplémentaire : -180 points.
- Défaite : 0 point.
- Victoire minimale : 50 points.

Le temps ne fait pas partie du score principal.

## Partage

Format attendu :

```text
Le mot à Biloute 2026-05-31
820 points · 1/6 · 1 indice payant
🟩🟩🟩🟩🟩🟩
https://exemple.fr/le-mot-a-biloute/
```

## Version

Version courante : `26.05.31.5`.

Le format est `AA.MM.JJ.i`.
