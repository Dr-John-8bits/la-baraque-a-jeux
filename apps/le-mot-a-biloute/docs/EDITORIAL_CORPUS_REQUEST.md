# Demande de corpus éditorial

Ce document liste les contenus nécessaires pour construire complètement **Le mot à Biloute** pendant que le développement technique avance en parallèle.

## Objectif

Constituer un corpus local fiable, drôle, vérifié et exploitable par le moteur du jeu.

Le premier objectif réaliste est :

- **30 mots** pour une version `0.2` ;
- **60 mots** pour un lancement public minimal ;
- **100 mots** pour un lancement confortable avec roulement éditorial.

## Livraison idéale

Tu peux fournir les contenus par lots.

Format recommandé :

- un fichier `.md`, `.csv` ou `.json` ;
- un lot de 10 à 20 mots à la fois ;
- une section de notes/sources à la fin ;
- les incertitudes clairement signalées.

## Champs nécessaires par mot

Pour chaque mot, j'ai besoin de :

| Champ | Obligatoire | Description |
| --- | --- | --- |
| `answer` | Oui | Mot affiché comme réponse, en lettres sans espace ni apostrophe. |
| `acceptedAnswers` | Oui | Variantes acceptées, au minimum le mot principal. |
| `category` | Oui | Exemple : `Vocabulaire ch'ti`, `Quartier lillois`, `Cuisine du Nord`. |
| `difficulty` | Oui | `facile`, `moyen`, `difficile`. |
| `starterHint` | Oui | Premier indice gratuit, vague et difficile. |
| `hints` | Oui | 2 ou 3 indices progressifs, plus utiles. |
| `bonusTitle` | Oui | Titre du bonus final. |
| `bonusText` | Oui | Courte explication de fin. |
| `themes` | Oui | Mots-clés : `Lille`, `météo`, `cuisine`, `transport`, etc. |
| `sourceNote` | Souhaité | Source, justification, souvenir ou note de vérification. |
| `riskNote` | Si besoin | Marque, orthographe incertaine, mot sensible, ambiguïté. |

## Exemple complet

```md
## DRACHE

- Réponse : DRACHE
- Variantes acceptées : DRACHE
- Catégorie : Vocabulaire ch'ti
- Difficulté : facile
- Thèmes : météo, parler régional, Nord
- Premier indice : Ça peut ruiner une belle sortie sans demander la permission.
- Indice 2 : Météo bien du Nord, version généreuse.
- Indice 3 : Grosse pluie en parler régional.
- Bonus titre : Drache
- Bonus texte : Dans le Nord, une drache désigne une grosse pluie. Pas une bruine polie : une vraie démonstration météo.
- Source/note : Mot régional courant.
- Risque/note : Aucun.
```

## Types de contenus attendus

## 1. Vocabulaire ch'ti et régional

Objectif v0.2 : 8 à 10 mots.

Exemples de familles :

- météo ;
- maison ;
- expressions affectueuses ;
- cuisine ;
- objets du quotidien ;
- fêtes populaires.

À fournir :

- orthographes possibles ;
- variante la plus courante ;
- sens exact ;
- contexte d'usage ;
- mots à éviter car trop caricaturaux ou incertains.

## 2. Lille et quartiers

Objectif v0.2 : 6 à 8 mots.

Exemples :

- quartiers ;
- lieux emblématiques ;
- rues ou places très connues ;
- repères culturels.

À fournir :

- nom exact ;
- longueur sans accents/espaces si nécessaire ;
- mini note de contexte ;
- niveau de difficulté pour une personne locale.

## 3. Métropole lilloise

Objectif v0.2 : 4 à 6 mots.

Exemples :

- communes ;
- repères métropolitains ;
- lieux culturels ;
- patrimoine industriel.

À fournir :

- formes courtes acceptables ;
- attention aux apostrophes et traits d'union ;
- note sur ce qui est connu localement ou non.

## 4. Cuisine et traditions

Objectif v0.2 : 5 à 8 mots.

Exemples :

- plats ;
- produits ;
- boissons ;
- événements populaires ;
- rituels locaux.

À fournir :

- définition simple ;
- angle drôle possible ;
- niveau de notoriété.

## 5. Transports et quotidien

Objectif v0.2 : 3 à 5 mots.

Exemples :

- mots génériques : métro, tram, rame, quai ;
- stations ou lieux de passage ;
- habitudes de trajet.

Prudence :

- éviter de reprendre une charte ou un ton officiel ;
- noter les marques ou noms institutionnels sensibles.

## 6. Corpus documentaire brut

Tu peux aussi me donner des documents sources non transformés :

- notes personnelles ;
- listes de mots ;
- glossaires ;
- liens/sources ;
- extraits reformulables ;
- souvenirs, anecdotes, expressions entendues.

Je transformerai ensuite cela en données structurées pour le jeu.

## Volumes recommandés

| Version | Nombre de mots | Objectif |
| --- | ---: | --- |
| 0.2 | 30 | Premier vrai corpus testable. |
| 0.3 | 60 | Expérience quotidienne crédible. |
| 1.0 | 100 | Lancement confortable. |

## Équilibre souhaité pour 30 mots

- 8 vocabulaire ch'ti/régional ;
- 6 quartiers/lieux de Lille ;
- 5 cuisine/traditions ;
- 4 métropole ;
- 4 transports/quotidien ;
- 3 surprises locales.

## Contraintes de longueur

Pour le lancement, privilégier :

- mots de 5 à 8 lettres ;
- pas d'espaces ;
- pas d'apostrophes ;
- pas de traits d'union ;
- accents ignorés mais orthographe principale claire.

Les mots plus longs pourront attendre un mode spécial.

## Ton des indices

Le premier indice doit être difficile.

Bon premier indice :

```text
Ça peut ruiner une belle sortie sans demander la permission.
```

Trop direct :

```text
Grosse pluie du Nord.
```

Les indices payants peuvent devenir plus explicites.

## Sources et vérification

Pour chaque mot régional ou historique, indique si possible :

- source documentaire ;
- usage personnel/familial/local ;
- variante connue ;
- incertitude ;
- niveau de confiance.

Une note courte suffit.

## Liste rouge souhaitée

J'ai aussi besoin d'une liste de ce qu'on ne veut pas :

- clichés à éviter ;
- mots jugés trop ringards ;
- mots trop obscurs ;
- termes sensibles ;
- marques à ne pas utiliser ;
- lieux ou références à éviter.

## Assets visuels attendus plus tard

Quand tu seras prêt :

- logo ou direction de logo ;
- visuel principal ;
- icône PWA carrée ;
- image de partage social ;
- palette ou références graphiques ;
- éventuelles textures ou éléments illustratifs.

## Priorité de livraison

Le plus utile maintenant :

1. Un lot de 30 mots candidats.
2. Pour chacun : catégorie, difficulté, premier indice, 2 indices payants, bonus.
3. Une liste de variantes orthographiques.
4. Une liste rouge.
5. Quelques sources ou notes de confiance.
