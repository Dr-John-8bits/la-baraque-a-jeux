# FAQ et règles du jeu

## Quel est le but du jeu ?

Deviner le mot du jour lié à Lille, au Nord ou au parler ch'ti.

## Combien y a-t-il d'essais ?

Le joueur dispose de 6 essais officiels. S'il ne trouve pas le mot dans ces 6 essais, sa série est perdue, mais il passe au **Rab de Biloute** et peut continuer jusqu'à trouver.

## Que signifient les couleurs ?

- Vert : la lettre est correcte et bien placée.
- Jaune : la lettre est dans le mot, mais pas à cet endroit.
- Gris : la lettre n'est pas dans le mot.

## Le premier Ch’ti coup d'pouce est-il gratuit ?

Oui. Le premier Ch’ti coup d'pouce est gratuit et s'affiche quand le joueur clique sur `Ch’ti coup d'pouce gratuit`. Il est volontairement difficile, pour donner une ambiance sans révéler trop vite la réponse.

## Les autres coups d'pouce coûtent-ils des points ?

Oui. Chaque coup d'pouce supplémentaire fait perdre 180 points.

## Comment le score est-il calculé ?

Le score de base est de 1000 points.

- Chaque essai supplémentaire après le premier fait perdre 120 points.
- Chaque coup d'pouce supplémentaire fait perdre 180 points.
- Une victoire garde un score minimal de 50 points.
- Dans le Rab de Biloute, les pénalités continuent après le 6e essai et le score peut devenir négatif.
- La série est perdue dès que le Rab de Biloute commence.

Exemple : trouver le mot au 3e essai avec 1 coup d'pouce payant donne `1000 - 2 x 120 - 180 = 580 points`.

## Le temps compte-t-il ?

Non. Le score principal ne tient pas compte du temps. Le jeu quotidien doit valoriser la déduction, les essais économisés et les coups d'pouce non utilisés.

Un mode chronométré pourra exister plus tard comme variante.

## Peut-on jouer plusieurs fois dans la journée ?

Le principe est un mot commun par jour. La progression du jour est sauvegardée localement dans le navigateur.

## Les accents comptent-ils ?

Non. La saisie est normalisée : les accents sont ignorés et les lettres sont comparées en majuscules.

## Les données sont-elles envoyées quelque part ?

Non. La version actuelle fonctionne localement dans le navigateur. Les statistiques restent dans `localStorage`.

## Que contient le partage ?

Le partage contient :

- le nom du jeu ;
- la date du mot ;
- le score ;
- le nombre d'essais ;
- le nombre de coups d'pouce payants utilisés ;
- la grille emoji ;
- le lien public du jeu.

## Le jeu est-il affilié à Wordle, Ilévia, Lille ou la MEL ?

Non. **Le mot à Biloute** est un projet indépendant.
