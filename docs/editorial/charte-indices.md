# Charte des indices et des pépites

Cette charte définit la qualité éditoriale attendue pour **tout contenu à indices** des
jeux de La Baraque à Jeux. Elle s'applique avant toute relecture ou enrichissement de
corpus : on relit avec cette grille de lecture, pas à l'instinct.

Elle complète, sans le remplacer, le `docs/editorial/README.md` (sourçage, reformulation,
exclusions). Elle existe parce qu'un audit a montré deux défauts récurrents : des indices
**redondants** (qui répètent la même idée) et des indices **génériques** (vrais pour
presque toutes les entrées), au détriment du détail qui rend une station ou un mot
mémorable — la « pépite ».

## Principes communs

1. **Chaque indice apporte une information neuve.** Si un indice peut être deviné à partir
   d'un autre, il est redondant : on le réécrit ou on le supprime.
2. **Pas d'indice générique.** Un indice vrai pour presque toutes les entrées (« je suis une
   station du métro Ilévia ») ne sert à rien et gaspille un palier. Interdit.
3. **Au moins une pépite par fiche.** Le détail singulier qui fait « ah tiens ! » : une œuvre
   d'art en station, une étymologie, une anecdote historique, un lieu remarquable, un usage
   inattendu. C'est ce qui distingue un bon contenu d'une fiche administrative.
4. **Progression du général au précis.** Les premiers indices situent largement ; les
   derniers resserrent. On ne donne jamais le plus précis en premier.
5. **Le dernier indice ne contient jamais la réponse.** Ni le nom exact, ni un homonyme
   transparent (ex. nom de quartier identique au nom de la station).
6. **Tout fait est sourçable.** Aucune pépite inventée. Chaque affirmation non triviale
   s'appuie sur un `sourceId` stable (voir `packages/corpus/sources.json`). En cas de doute,
   on ne publie pas.
7. **Voix du projet.** Ton local, propre, relu, accessible. Pas de copie brute du web.
   Aucune référence religieuse. Aucun item marqué `avoid`.

## Station Mystère — 5 indices, structure libre menée par la pépite

La structure n'est **pas figée** (on abandonne l'enchaînement mécanique
transport / ligne / commune / réseau / landmark). Chaque fiche choisit ses 5 indices selon
ce qui caractérise le mieux la station, en respectant la progression.

Schéma indicatif (à adapter) :

- **Indice 1** — ancrage large : secteur de la métropole, ambiance, type de lieu desservi.
- **Indice 2** — repère factuel utile : ligne, ou grande fonction du secteur.
- **Indice 3** — commune ou quartier.
- **Indice 4** — **pépite** : œuvre d'art, histoire, étymologie, anecdote singulière.
- **Indice 5** — précis mais sans livrer la réponse : un repère immédiat pour qui connaît.

Au moins **un** des indices 1 à 5 doit être une pépite ; viser deux quand la station s'y
prête. Les champs `type` des indices décrivent le contenu réel (ex. `art`, `histoire`,
`etymologie`, `geographie`, `ligne`, `commune`), pas un gabarit imposé.

> Exemple de défaut corrigé — *Mitterie* : l'indice 1 était générique, l'indice 5 contenait
> le nom de la station, et la station n'avait aucune pépite (l'art en station n'était pas
> évoqué). Cible : remplacer le générique, déplacer le précis, ajouter la pépite sourcée.

## Le Mot à Biloute — `starterHint` + 2 `hints`

- **`starterHint`** : une amorce-devinette, ambiance, jamais la définition.
- **`hints[0]` et `hints[1]` : deux angles différents.** Par exemple définition vs usage,
  ou catégorie vs anecdote. Interdit : reformuler deux fois la même idée.
- Les deux hints **resserrent** vers la réponse, ils ne répètent pas l'amorce.

> Exemples — *Chicon* est conforme : « endive ailleurs » (synonyme) + « servi au gratin »
> (usage). *Drache* ne l'est pas : « météo généreuse » et « grosse pluie » disent la même
> chose. *Beffroi* non plus : « grande tour » répétée par une blague sans info neuve.

## Lille-Mêle — anecdotes et microcopies

- Une anecdote = un fait neuf et vérifiable, pas une paraphrase du nom de la famille.
- Aucune anecdote sans `sourceIds` valides.
- Mêmes interdits que partout : religieux, `avoid`, copie brute.

## Passe de recherche en ligne assistée

L'enrichissement par pépites se fait en collaboration, jamais en aveugle :

1. Pour chaque entrée, recherche en ligne du détail singulier (art, histoire, étymologie,
   lieu).
2. **Proposition à l'éditeur avec la source** : le fait brut + l'URL/`sourceId` candidat.
3. Validation ou correction par l'éditeur (connaissance du terrain).
4. Rédaction dans la voix du projet, ajout du `sourceId`, puis `npm run check:corpus`.

Rien n'entre dans le corpus sans cette boucle. Une pépite non sourçable est écartée, pas
maquillée.
