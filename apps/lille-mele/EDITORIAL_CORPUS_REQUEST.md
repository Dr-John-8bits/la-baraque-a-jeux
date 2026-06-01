# Demande de corpus editorial pour Lille-Mêle

Objectif : te donner une liste claire des contenus dont j'ai besoin pour construire Lille-Mêle completement pendant que je developpe la partie technique.

Le corpus doit servir a produire des grilles quotidiennes de 16 cartes, soit 4 familles de 4 cartes. Chaque contenu doit etre sourcable, originalement reformule et compatible avec la regle absolue du jeu : aucune reference religieuse dans les grilles, textes, anecdotes, questions, reponses ou microcopies.

## Format recommande

Tu peux commencer en Markdown, CSV ou tableur. L'important est de garder une ligne par item ou par idee.

### Item source

| Champ | Description | Exemple |
| --- | --- | --- |
| `label` | Texte court visible sur une carte | `Rihour` |
| `type` | Station, commune, quartier, lieu, mot, plat, evenement, anecdote | `station` |
| `zone` | Lille, Lomme, Hellemmes, Roubaix, Tourcoing, MEL, etc. | `Lille-Centre` |
| `themes` | Themes possibles separes par virgules | `metro, ligne 1, centre` |
| `source` | URL, livre, archive ou reference | `https://...` |
| `date_consultation` | Date de consultation | `2026-05-31` |
| `fait_verifie` | Fait brut que la source permet de verifier | `Station de la ligne 1` |
| `note_editoriale` | Idee de formulation, piege ou anecdote | `Peut aller avec stations courtes` |
| `risque_ambiguite` | Faible, moyen, fort | `faible` |
| `interdit` | Oui/non, avec raison | `non` |

### Famille candidate

| Champ | Description |
| --- | --- |
| `titre` | Titre revele du groupe |
| `items` | 4 labels exacts |
| `difficulte` | facile, moyen, difficile, piege |
| `logique` | Pourquoi ces 4 vont ensemble |
| `fausse_piste` | Piege eventuel |
| `sources` | Sources utiles |
| `validation` | A verifier, valide, a retirer |

### Anecdote ou bonus

| Champ | Description |
| --- | --- |
| `question` | Phrase courte pour vrai/faux ou bonus |
| `reponse` | Vrai ou faux |
| `explication` | 1 a 2 phrases originales |
| `source` | Reference exacte |
| `niveau_confiance` | Faible, moyen, fort |
| `date_consultation` | Date |

## Volume souhaite

Pour une V1 solide :

- 200 a 300 items bruts utilisables ;
- 60 a 80 familles candidates ;
- 30 a 45 grilles pretes ;
- 60 anecdotes courtes ;
- 30 questions vrai/faux ;
- une reserve d'items ecartes avec la raison du rejet.

Pour une V1 vraiment confortable :

- 500 items bruts ;
- 120 familles candidates ;
- 60 grilles pretes ;
- 100 anecdotes ;
- 80 questions vrai/faux.

## Contenus prioritaires

### 1. Metro, tramway et mobilites

J'ai besoin de :

- stations des lignes 1 et 2 ;
- terminus ;
- stations par commune ;
- stations par quartier ou secteur ;
- correspondances metro, tram, train ou bus structurant ;
- stations avec noms courts, longs, composes ou similaires ;
- faits historiques du VAL ;
- faits sur le tramway vers Roubaix et Tourcoing ;
- temps de trajet ou ordres de station si sourcables.

Sources recommandees :

- Ilévia ;
- GTFS Ilévia ;
- transport.data.gouv.fr ;
- donnees ouvertes MEL si disponibles.

Vigilance :

- ne pas utiliser de logos, plans ou pictogrammes ;
- ne pas copier les textes institutionnels ;
- dater la version des donnees transport.

### 2. Communes de la MEL

J'ai besoin de :

- liste complete des communes de la MEL ;
- communes desservies par metro ;
- communes desservies par tram ;
- communes avec noms composes ;
- communes en bord de Deûle ou autour d'un axe identifiable ;
- communes associees a un lieu culturel, sportif, industriel ou universitaire ;
- anciennes communes ou evolutions administratives si bien sourcees.

Sources recommandees :

- MEL ;
- INSEE ;
- BANATIC ;
- sites officiels des communes.

Vigilance :

- distinguer commune, quartier, ancienne commune et commune associee ;
- ne pas creer de categorie purement administrative si elle n'est pas amusante a jouer.

### 3. Quartiers et secteurs lillois

J'ai besoin de :

- quartiers officiels de Lille ;
- quartiers de Lomme et Hellemmes ;
- secteurs ou noms courants connus ;
- marches, places, rues et reperes par quartier ;
- elements de vie locale non sensibles.

Sources recommandees :

- Ville de Lille ;
- donnees ouvertes de la Ville ;
- pages des mairies de quartier.

Vigilance :

- noter si un nom est officiel ou seulement usuel ;
- eviter les references trop confidentielles.

### 4. Patrimoine civil, architecture et urbanisme

J'ai besoin de :

- monuments civils ;
- places ;
- beffroi, bourse, opera, hotel de ville, citadelle, portes, gares ;
- patrimoine industriel et reconversions ;
- styles architecturaux ;
- dates, architectes, fonctions anciennes et actuelles ;
- elements urbains lies a l'eau, aux fortifications, aux portes et aux gares.

Sources recommandees :

- Ville de Lille ;
- bases patrimoniales ouvertes ;
- data.gouv.fr ;
- archives municipales ;
- Gallica pour documents anciens libres ou verifiables.

Vigilance :

- aucune reference religieuse ;
- ne pas copier les descriptions de notices ;
- verifier les droits des images si un visuel est propose.

### 5. Culture, musees et lieux de sortie

J'ai besoin de :

- musees ;
- salles de concert ;
- theatres ;
- lieux culturels metropolitains ;
- lieux de creation, design, image, textile, photo ou arts vivants ;
- lieux disparus ou transformes si sourcables.

Sources recommandees :

- sites officiels des lieux ;
- Hello Lille ;
- Ville de Lille ;
- MEL.

Vigilance :

- utiliser les noms exacts ;
- separer lieux publics, lieux prives et evenements temporaires.

### 6. Gastronomie et produits locaux

J'ai besoin de :

- plats ;
- desserts ;
- boissons non-marquees si possible ;
- produits ;
- mots de carte ou de cuisine ;
- habitudes de braderie et de marche.

Sources recommandees :

- sources culinaires fiables ;
- offices de tourisme ;
- archives ou presse ancienne si besoin.

Vigilance :

- eviter les marques commerciales sauf necessite editoriale claire ;
- eviter les cliches repetes.

### 7. Mots regionaux et expressions

J'ai besoin de :

- mots courts jouables sur carte ;
- definition ;
- zone d'usage ;
- exemple neutre ;
- source linguistique ou dictionnaire fiable ;
- niveau de notoriete.

Vigilance :

- ne pas caricaturer ;
- eviter les mots insultants, discriminants ou trop datés ;
- noter les variantes orthographiques.

### 8. Braderie, evenements et rituels urbains

J'ai besoin de :

- faits et chiffres ;
- objets, pratiques et mots associes ;
- lieux recurrents ;
- evolution historique ;
- questions vrai/faux.

Sources recommandees :

- Ville de Lille ;
- archives municipales ;
- presse ou publications historiques sourcables.

Vigilance :

- les chiffres changent selon les annees ;
- toujours dater les faits.

### 9. Eau, industrie, textile, innovation, sante, universites, sport

J'ai besoin de familles thematiques autour de :

- Deûle, canaux, ports, quais ;
- industrie textile ;
- reconversions urbaines ;
- Euratechnologies ;
- EuraSanté ;
- universites et campus ;
- clubs, stades, salles et pratiques sportives ;
- gares et mobilites regionales.

Vigilance :

- eviter les categories fourre-tout ;
- chercher des familles de 4 vraiment nettes.

## Ce qui m'aide le plus techniquement

Pour chaque grille candidate, donne :

- les 16 labels exacts ;
- les 4 groupes ;
- le titre revele de chaque groupe ;
- le niveau de difficulte ;
- les sources principales ;
- les pieges voulus ;
- les fausses pistes a eviter ;
- l'anecdote de fin ;
- la question bonus ;
- une note "aucune reference religieuse verifiee".

## Criteres d'acceptation d'une grille

Une grille est bonne si :

- elle contient exactement 16 items uniques ;
- elle contient 4 groupes de 4 ;
- aucune carte n'a besoin d'une image pour etre comprise ;
- la logique de chaque groupe est claire apres revelation ;
- aucune autre solution complete n'est aussi valable ;
- les faits sont sources ;
- les formulations sont originales ;
- les items tiennent sur mobile ;
- le ton reste local, clair et complice ;
- aucune reference religieuse n'apparait.

## Contenus a eviter

- References religieuses, meme historiques ou patrimoniales.
- Logos, plans, photos ou visuels tiers sans droits.
- Textes copies depuis des sites officiels ou touristiques.
- Marques commerciales non necessaires.
- Faits non dates ou chiffres invérifiables.
- Blagues internes.
- Categories fondees uniquement sur "ca sonne pareil" si elles ne sont pas robustes.
- Items trop longs pour une carte mobile.

## Organisation proposee

Structure ideale du futur dossier editorial :

```text
corpus/
├── items.md
├── familles-candidates.md
├── grilles/
│   ├── 2026-06-01.md
│   ├── 2026-06-02.md
│   └── ...
├── anecdotes.md
├── bonus-vrai-faux.md
├── sources.md
└── rejetes.md
```

Je pourrai ensuite transformer ce corpus en `../../packages/corpus/lille-mele/puzzles.json`, puis le faire passer dans le validateur commun avant integration dans l'application.
