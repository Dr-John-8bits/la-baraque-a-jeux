# Blog

Le fichier public `docs/blog/NEWS.md` est genere depuis les entrees Markdown de `docs/blog/entries/`.

## Ajouter une entree

1. Creer un fichier dans `docs/blog/entries/`.
2. Utiliser un nom ordonnable : `AAAA-MM-JJ-ordre-sujet.md`.
3. Commencer le fichier par un titre `## ...`.
4. Lancer :

```bash
npm run build:blog
npm run check
```

Le tri est descendant sur le nom de fichier. Pour une meme date, l'ordre le plus eleve apparait en haut. L'entree fondatrice du 31 mai garde donc l'ordre le plus bas pour rester tout en bas de la liste.

## Convention de version

Les versions publiques conservent le format `AA.MM.JJ.i`.

- `AA.MM.JJ` suit la date de livraison.
- `i` correspond a l'iteration du jour.
- Une entree de blog documente l'etat livrable cote joueur et les changements techniques significatifs.

Les changelogs historiques des jeux peuvent rester dans leurs dossiers, mais le blog mutualise devient la reference publique.
