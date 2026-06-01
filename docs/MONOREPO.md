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
| `index.html` | Point d'entree public servi par GitHub Pages. |
| `blog.html` | Page publique des nouveautes et versions. |
| `apps/le-mot-a-biloute` | Jeu quotidien de mot local. |
| `apps/lille-mele` | Jeu quotidien de familles et connexions locales. |
| `assets/brand` | Identite visuelle commune du portail et des jeux. |

## Paquets partages

Les dossiers de `packages/` contiennent les briques partagees consommees par les apps.

| Dossier | Role cible |
| --- | --- |
| `packages/corpus` | Donnees sources, schemas, conventions editoriales et validations. |
| `packages/ui` | Design tokens, styles communs, composants UI. |
| `packages/game-utils` | Fonctions communes : dates, stockage local, partage, scoring generique. |

## Contenus mutualises

| Fichier | Role |
| --- | --- |
| `docs/blog/entries/` | Entrees sources du blog public, triees par nom de fichier. |
| `docs/blog/NEWS.md` | Markdown genere et charge par `blog.html`. |

## Strategie technique

Phase actuelle :

- conserver les jeux statiques et jouables ;
- garder `index.html` comme seul portail public ;
- charger les donnees depuis `packages/corpus` ;
- partager les helpers via `packages/game-utils` ;
- partager la charte via `packages/ui` ;
- verifier le corpus, le blog, les pages statiques et le JavaScript avant publication.

Phase suivante :

- enrichir les jeux eux-memes en gardant le socle statique ;
- produire davantage de contenu source ;
- isoler progressivement la logique propre de chaque jeu si le gameplay grossit ;
- envisager Vite/TypeScript seulement si les schemas deviennent trop lourds a maintenir en JavaScript statique.

## Deploiement

Le deploiement GitHub Pages peut servir directement la racine du depot :

- `index.html` affiche le portail ;
- `blog.html` affiche les nouveautes depuis `docs/blog/NEWS.md` ;
- `apps/le-mot-a-biloute/` contient Le mot a Biloute ;
- `apps/lille-mele/` contient Lille-Mele.

Un pipeline de deploiement plus propre pourra ensuite copier les jeux vers des URLs plus courtes, mais ce n'est pas necessaire pour publier la premiere version.
