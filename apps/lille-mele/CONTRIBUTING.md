# Contribution et workflow

Ce projet est propriétaire pour ses contenus et son identité. Toute contribution doit donc rester compatible avec une exploitation commerciale future.

## Avant de modifier

Lire :

- [README.md](README.md)
- [FAQ.md](FAQ.md)
- [docs/CONTENT_GUIDELINES.md](docs/CONTENT_GUIDELINES.md)
- [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md)
- [LICENSE.md](LICENSE.md)

## Règles générales

- Garder le prototype jouable.
- Ne pas ajouter de dépendance sans nécessité.
- Ne pas versionner d'artefacts générés.
- Ne jamais intégrer de contenu tiers copié-collé.
- Ne jamais ajouter de référence religieuse dans le jeu.
- Documenter les sources des contenus.
- Mettre à jour le changelog pour toute modification livrable.
- Incrémenter la version selon [docs/VERSIONING.md](docs/VERSIONING.md).

## Modifier le jeu

Pour le prototype actuel, les changements applicatifs se font principalement dans :

```text
index.html
styles.css
app.js
../../packages/corpus/lille-mele/puzzles.json
../../packages/corpus/sources.json
```

Après modification :

1. lancer `npm run check` depuis la racine ;
2. tester une sélection correcte ;
3. tester une sélection incorrecte ;
4. tester le cas "trois sur quatre" ;
5. vérifier le rendu mobile ;
6. vérifier la console ;
7. mettre à jour la documentation si nécessaire.

## Modifier les contenus

Avant d'ajouter ou modifier une grille :

- vérifier les 16 items ;
- vérifier les 4 groupes ;
- vérifier les ambiguïtés ;
- vérifier l'absence de référence religieuse ;
- ajouter les sources dans `../../packages/corpus/sources.json` ;
- rédiger des notes originales ;
- faire relire la grille.

## Commits

Les commits doivent être courts et explicites.

Exemples :

```text
feat: améliorer le feedback des erreurs
docs: structurer la documentation projet
copy: ajuster l'accroche du jeu
```

Chaque série de modifications prête à être versionnée doit être accompagnée d'une proposition de commit en français.
