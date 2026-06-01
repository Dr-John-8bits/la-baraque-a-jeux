# Organisation monorepo

## Objectif

Regrouper le portail et les jeux dans un seul depot afin de mutualiser :

- l'identite graphique ;
- le corpus documentaire lillois ;
- les scripts de validation ;
- les conventions de release ;
- les briques techniques communes.

## Applications

| Dossier | Role |
| --- | --- |
| `apps/portail` | Point d'entree public de La baraque a jeux. |
| `apps/le-mot-a-biloute` | Jeu quotidien de mot local. |
| `apps/lille-mele` | Jeu quotidien de familles et connexions locales. |

## Paquets partages

Les dossiers de `packages/` sont volontairement initialises comme espaces de travail, meme si les apps n'importent pas encore de code commun.

| Dossier | Role cible |
| --- | --- |
| `packages/corpus` | Donnees sources, schemas, conventions editoriales et validations. |
| `packages/ui` | Design tokens, styles communs, composants UI. |
| `packages/game-utils` | Fonctions communes : dates, stockage local, partage, scoring generique. |

## Strategie technique

Phase actuelle :

- conserver les jeux statiques et jouables ;
- deplacer le code dans `apps/` ;
- documenter les zones communes ;
- nettoyer les artefacts generes.

Phase suivante :

- extraire les donnees dans `packages/corpus` ;
- ajouter des scripts de validation ;
- factoriser les styles les plus stables ;
- envisager ensuite Vite/TypeScript seulement quand les schemas seront stabilises.

## Deploiement

Le deploiement cible pourra copier :

- `apps/portail` a la racine publique ;
- `apps/le-mot-a-biloute` vers `/le-mot-a-biloute/` ;
- `apps/lille-mele` vers `/lille-mele/`.

Tant que ce pipeline n'est pas en place, les apps restent consultables directement dans leur dossier source.

