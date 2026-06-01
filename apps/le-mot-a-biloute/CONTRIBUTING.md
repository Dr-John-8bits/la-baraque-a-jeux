# Contribuer

Merci de vouloir contribuer à **Le mot à Biloute**.

## Nature du projet

Le projet sépare clairement :

- le code technique, sous licence MIT ;
- les contenus, mots, indices, textes, identité et assets, tous droits réservés.

Avant toute contribution éditoriale, il faut accepter que le contenu proposé puisse être intégré dans un projet propriétaire.

## Contributions techniques

Les contributions techniques peuvent porter sur :

- l'accessibilité ;
- le moteur de jeu ;
- le scoring ;
- le rendu mobile ;
- les tests ;
- le déploiement statique.

## Contributions éditoriales

Une proposition de mot doit inclure :

- le mot normalisé ;
- une catégorie ;
- un premier indice difficile ;
- au moins deux indices progressifs ;
- un bonus final court ;
- si nécessaire, les variantes acceptées ;
- une note de vérification si le mot est régional ou ambigu.

Voir [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md).

## Avant de proposer une modification

Vérifier :

- que le jeu fonctionne sur mobile ;
- que le score reste cohérent ;
- que le partage contient le lien public ;
- que le ton reste local sans devenir caricatural.

## Commandes utiles

```bash
node --check app.js
python3 -m http.server 48321
```
