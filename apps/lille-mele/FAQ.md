# FAQ et règles du jeu

## C'est quoi Lille-Mêle ?

Lille-Mêle est un jeu de connexions locales. Le joueur voit 16 cartes et doit retrouver 4 familles de 4 cartes.

## Comment on joue ?

1. Sélectionne 4 cartes.
2. Appuie sur `Valider`.
3. Si les 4 cartes forment une famille, le groupe est révélé.
4. Sinon, une erreur est comptée.
5. La partie est gagnée quand les 4 familles sont trouvées.
6. La partie est perdue après 4 erreurs.

## Qu'est-ce qu'une famille ?

Une famille est un groupe de 4 cartes reliées par une logique commune.

Exemples possibles :

- stations d'une même ligne de métro ;
- communes de la MEL ;
- quartiers de Lille ;
- lieux culturels ;
- monuments ou repères urbains ;
- spécialités locales ;
- mots ou expressions régionales ;
- événements lillois ;
- noms ayant une forme commune ;
- lieux liés à un même thème ;
- détails historiques ou urbains.

## Est-ce qu'il peut y avoir des pièges ?

Oui, mais ils doivent rester justes. Un bon piège fait hésiter, puis paraît logique quand la réponse est révélée.

Un mauvais piège donne deux réponses également valables. Ce type de grille doit être évité.

## Que veut dire "trois sur quatre" ?

Cela signifie que ta sélection contient 3 cartes d'une même famille, mais qu'une carte n'est pas la bonne.

Le jeu ne dit pas laquelle.

## Combien d'erreurs sont autorisées ?

Le prototype autorise 4 erreurs.

## Est-ce qu'une grille change tous les jours ?

Oui, le principe cible est une grille quotidienne. Le prototype actuel contient encore un petit nombre de grilles de test.

## Pourquoi afficher la date plutôt qu'un numéro de grille ?

La date correspond mieux au rituel quotidien : la grille du jour est celle d'aujourd'hui.

Le numéro reste utile pour les archives, les tests et le partage.

## Le jeu nécessite-t-il un compte ?

Non. Le MVP est pensé sans compte, sans backend et sans installation.

## Où sont sauvegardées les données ?

Dans le navigateur, via `localStorage`.

Cela concerne l'état de la partie, le streak et les statistiques locales simples.

## Qu'est-ce qui est partagé ?

Le partage doit rester sans spoiler. Il indique le résultat, le nombre d'erreurs et une représentation visuelle des groupes trouvés, mais pas les réponses.

## Quels contenus sont interdits ?

Les grilles, textes, questions, réponses et microcopies ne doivent contenir aucune référence religieuse.

## Les contenus sont-ils définitifs ?

Non. Les grilles actuelles sont des prototypes. Avant lancement public, chaque grille doit être vérifiée, sourcée et testée.
