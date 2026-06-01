# Lille-Mêle - Roadmap produit et ressources

## Lecture du brief

Lille-Mêle est un jeu quotidien mobile-first de regroupement semantique local : 16 cartes, 4 familles cachees, une grille par jour, sans compte et sans backend au MVP.

Le brief est deja precis sur la mecanique. Le point critique du projet sera plutot editorial : constituer des grilles justes, droles, verifiables et variees, sans tomber dans le folklore automatique. Le produit doit donc etre construit autour de deux socles des le debut :

- une logique de jeu simple, testee et durable ;
- une base de contenus sourcee, avec une trace claire des donnees utilisees.

## Roadmap recommandee

### Phase 0 - Cadrage et socle legal

Objectif : proteger le projet et cadrer les choix avant de coder.

Livrables :

- régime de licence double ajouté au dépôt : code MIT, contenus et identité tous droits réservés ;
- mention "application non officielle" prevue pour la page A propos ;
- choix de stack confirme : webapp statique HTML, CSS et JavaScript, sans build obligatoire ;
- modele de donnees des grilles valide ;
- registre des sources cree avant la production massive de contenu.

Definition of done :

- le depot indique clairement que le code technique est sous MIT, tandis que les grilles, la marque, les textes, les contenus et le design restent proprietaires ;
- les donnees publiques reutilisees restent attribuees a leurs producteurs ;
- aucune ressource protegee comme logo, plan officiel ou photo tierce n'est integree sans droit explicite.

### Phase 1 - Prototype jouable local

Objectif : valider la sensation du jeu en conditions mobile.

Livrables :

- webapp statique dans `apps/lille-mele/` ;
- grille codee en dur ;
- selection et deselection de 4 cartes ;
- validation d'un groupe ;
- compteur d'erreurs ;
- detection "trois sur quatre" ;
- victoire, defaite et revelation des groupes ;
- premier style mobile-first.

Definition of done :

- une partie complete peut etre jouee dans le navigateur ;
- la logique critique reste identifiable et testable ;
- les fonctions de rendu de test sont exposees pour Playwright.

### Phase 2 - Donnees et pipeline editorial

Objectif : passer d'une grille demo a un contenu quotidien maintenable.

Livrables :

- fichier `../../packages/corpus/lille-mele/puzzles.json` ;
- schemas JSON de reference pour `Puzzle` et `PuzzleGroup` ;
- script de validation des grilles depuis la racine ;
- registre des sources editorial mutualise dans `../../packages/corpus/sources.json` ;
- 15 a 30 grilles initiales ;
- conventions de ton et de difficulte.

Definition of done :

- chaque grille contient 4 groupes de 4 items uniques ;
- chaque categorie est justifiee par une source ou une verification editoriale ;
- chaque puzzle a une anecdote courte et une difficulte equilibree ;
- les erreurs de structure sont bloquees automatiquement.

### Phase 3 - MVP public

Objectif : livrer l'experience quotidienne complete.

Livrables :

- chargement de la grille du jour ;
- sauvegarde locale de la partie ;
- streak et statistiques locales simples ;
- partage sans spoiler ;
- pages "Comment jouer ?" et "A propos" ;
- page de sources / credits ;
- mode sombre selon preference systeme ;
- accessibilite de base ;
- responsive mobile soigne.

Definition of done :

- l'utilisateur peut ouvrir, jouer, terminer et partager une grille sans compte ;
- l'etat du jour survit a une fermeture d'onglet ;
- le partage ne revele pas les reponses ;
- les sources et licences de donnees sont visibles.

### Phase 4 - Beta privee

Objectif : tester comprehension, difficulte et tonalite.

Livrables :

- deploiement statique prive ou discret ;
- retours utilisateurs sur 7 a 14 jours ;
- ajustement des textes, categories et niveaux ;
- verification mobile sur plusieurs tailles d'ecran ;
- audit rapide accessibilite et performance.

Definition of done :

- les joueurs comprennent le jeu en moins de 15 secondes ;
- les grilles ne generent pas de contestations legitimes ;
- le taux de frustration est acceptable ;
- les contenus les plus faibles sont remplaces.

### Phase 5 - Lancement V1

Objectif : publier avec assez de contenu pour tenir le rythme.

Livrables :

- 30 a 45 grilles pretes ;
- calendrier editorial des prochaines grilles ;
- README projet ;
- mentions legales simples ;
- politique de confidentialite minimale ;
- deploiement public ;
- suivi manuel des retours.

Definition of done :

- le site est accessible publiquement ;
- le contenu initial couvre Lille, la MEL, transports, patrimoine, gastronomie, langage et culture ;
- le projet peut etre montre a des partenaires ou acheteurs potentiels sans zone floue sur les droits.

### Phase 6 - Retention et extensions

Objectif : enrichir sans alourdir.

Pistes prioritaires :

- archives des anciennes grilles ;
- bonus "P'tit Vrai ou Bidon ?" ;
- PWA installable ;
- mode "Metro-Mele" ;
- grilles speciales Braderie ;
- statistiques locales plus detaillees ;
- eventuel createur de grilles, seulement apres validation editoriale solide.

## Ressources lilloises necessaires

### Transport et metro

Usages prevus :

- noms de stations ;
- lignes 1 et 2 ;
- terminus ;
- correspondances ;
- stations par commune ;
- tramway Roubaix/Tourcoing ;
- ordre des stations ;
- durees indicatives pour une future variante "avant la prochaine station".

Sources a utiliser :

- GTFS statique Ilévia via le Point d'Acces National aux donnees de mobilite ;
- pages officielles Ilévia Ligne 1, Ligne 2, Metro et Tramway ;
- articles officiels Ilévia sur certaines stations remarquables.

Attention :

- ne pas reutiliser les plans graphiques, pictogrammes, logos ou visuels Ilévia sans autorisation ;
- preferer extraire des donnees factuelles depuis le GTFS et produire notre propre presentation ;
- conserver la date de mise a jour du GTFS utilise.

### Communes et territoire MEL

Usages prevus :

- communes de la MEL ;
- communes desservies par metro, tram ou bus structurant ;
- groupes "MEL mais pas Lille" ;
- references transfrontalieres et periurbaines.

Sources a utiliser :

- page officielle "Territoire de la MEL" ;
- INSEE ou BANATIC pour la liste administrative des communes ;
- donnees MEL si un jeu exploitable liste les communes ou perimetres.

Attention :

- distinguer Lille, communes associees, quartiers lillois et communes de la MEL ;
- verifier les changements administratifs avant publication.

### Quartiers de Lille, Lomme et Hellemmes

Usages prevus :

- quartiers officiels ;
- lieux de proximite ;
- mairies de quartier ;
- limites ou noms de secteurs ;
- categories autour de Wazemmes, Moulins, Fives, Bois-Blancs, Vauban-Esquermes, Vieux-Lille, etc.

Sources a utiliser :

- pages "Mon Quartier" de la Ville de Lille ;
- jeu de donnees "Limite des quartiers de Lille et de ses communes associees" ;
- pages des mairies de quartier.

Attention :

- certains noms courants ne correspondent pas exactement aux noms administratifs ;
- documenter les choix editoriaux quand un item est un "secteur" plutot qu'un quartier officiel.

### Patrimoine, architecture et lieux culturels

Usages prevus :

- monuments historiques ;
- beffroi, Vieille Bourse, Grand'Place, Citadelle ;
- patrimoine industriel reconverti ;
- lieux culturels metropolitains ;
- musees et salles de spectacle.

Sources a utiliser :

- jeu de donnees "Monuments historiques de Lille-Hellemmes-Lomme" ;
- pages patrimoine de la Ville de Lille ;
- Site Patrimonial Remarquable ;
- Hello Lille et sites officiels des lieux pour les informations pratiques ;
- bases nationales culturelles si besoin de notices patrimoniales.

Attention :

- eviter de copier les textes descriptifs des institutions ;
- privilegier les faits et reecrire les anecdotes dans la voix Lille-Mêle ;
- les photos institutionnelles sont protegees sauf licence explicite.

### Histoire et archives

Usages prevus :

- anecdotes de fin ;
- "Vrai ou Bidon ?" ;
- categories historiques ;
- evenements, personnages, lieux disparus ou transformes.

Sources a utiliser :

- Archives municipales de Lille ;
- pages "Histoire de Lille" sur lille.fr ;
- Gallica/BnF pour cartes, guides anciens, presse ancienne et ouvrages libres de droits ;
- publications locales identifiees, avec prudence sur les droits.

Attention :

- separer les faits historiques sourcables des formulations originales ;
- ne pas reproduire de longs extraits d'ouvrages recents ;
- tenir une fiche source pour chaque anecdote.

### Braderie, evenements et culture populaire

Usages prevus :

- grilles speciales Braderie ;
- moules-frites, brocante, chine, quartiers ;
- calendrier evenementiel si un mode special est cree.

Sources a utiliser :

- pages officielles Braderie de Lille ;
- guide officiel de l'edition en cours ;
- archives municipales pour l'histoire de l'evenement.

Attention :

- les dates changent chaque annee ;
- les chiffres officiels doivent etre dates ;
- eviter les contenus evenementiels perissables dans les grilles quotidiennes hors contexte.

### Gastronomie et langage local

Usages prevus :

- specialites culinaires ;
- mots regionaux ;
- expressions du Nord ;
- categories legeres et accessibles.

Sources a utiliser :

- sources touristiques officielles et pages de lieux pour l'inventaire des specialites ;
- ouvrages ou dictionnaires consultables legalement pour le vocabulaire ;
- verification editoriale par usage local.

Attention :

- les recettes et textes de blogs sont proteges ;
- les noms de plats et mots usuels peuvent etre utilises, mais les descriptions doivent etre originales ;
- ne pas transformer le jeu en caricature ch'ti.

### Images, sons et assets

Usages prevus :

- icones, textures, eventuels visuels de partage, illustrations futures.

Sources a utiliser :

- assets crees pour le projet ;
- photos prises par le proprietaire ;
- images generees specifiquement pour Lille-Mêle ;
- images sous licence compatible, avec attribution suivie.

Attention :

- ne pas utiliser de logos, cartes officielles, photos de presse ou visuels d'institutions sans permission ;
- preferer une direction graphique originale inspiree du metro et de la ville, sans copier la signaletique officielle.

## Strategie de droits et licences

L'application peut utiliser un régime double : code technique sous MIT, contenus et identité propriétaires. La frontiere a maintenir est la suivante :

- le code technique reutilisable peut etre distribue sous MIT ;
- les donnees publiques restent sous leur licence d'origine ;
- les grilles, textes, anecdotes, microcopies, design, fichiers de puzzles et marque Lille-Mêle restent proprietaires ;
- les sources publiques doivent etre attribuees ;
- les contributions externes doivent etre cedees ou licenciees explicitement au proprietaire du projet.

Recommandations :

- creer une page "Sources et credits" dans l'app ;
- ajouter un fichier `SOURCES.md` ou un tableau editorial avec URL, producteur, licence, date de consultation, date de mise a jour ;
- eviter les donnees sous licence a partage a l'identique de type ODbL si elles ne sont pas necessaires ;
- ne jamais copier-coller de contenus redactionnels tiers dans les anecdotes ;
- prevoir une cession de droits claire pour toute personne qui contribuerait aux grilles.

## Sources officielles reperees au 31 mai 2026

Ces liens ne constituent pas encore un registre de sources complet, mais une premiere liste de travail a transformer en `SOURCES.md`.

| Domaine | Source | Usage principal | Point de vigilance |
| --- | --- | --- | --- |
| Transport | https://transport.data.gouv.fr/datasets/localisation-des-arrets-ilevia-bus-metro-et-tram-gtfs-pictogrammes-du-reseau-ilevia | GTFS statique, arrets, lignes, horaires theoriques | Licence Ouverte 2.0 ; attribuer MEL/Ilévia et dater la version |
| Transport | https://www.ilevia.fr/cms/institutionnel/metro-ligne-1 | faits, stations, chiffres et histoire ligne 1 | ne pas copier le texte ni les visuels |
| Transport | https://www.ilevia.fr/cms/institutionnel/metro-ligne-2 | faits, stations, chiffres et histoire ligne 2 | ne pas copier le texte ni les visuels |
| MEL | https://www.lillemetropole.fr/territoire-de-la-mel | cadrage territorial, 95 communes, metropole | verifier les donnees administratives avec INSEE/BANATIC |
| Communes | https://www.insee.fr/fr/metadonnees/geographie/intercommunalite/200093201-europeenne-de-lille | liste administrative des communes | source de reference pour les noms officiels |
| Open data Lille | https://www.lille.fr/Open-data | catalogue Ville de Lille : quartiers, monuments, parcs, equipements | chaque jeu de donnees peut avoir sa licence propre |
| Patrimoine | https://www.data.gouv.fr/fr/datasets/monuments-historiques-de-lille-hellemmes-lomme/ | monuments historiques Lille-Hellemmes-Lomme | Licence Ouverte ; conserver source et date de mise a jour |
| Quartiers | https://www.lille.fr/Votre-Mairie/La-mairie-de-Lille/Mairies-de-quartier | quartiers, mairies de quartier, noms officiels | ne pas reprendre les descriptifs tels quels |
| Histoire | https://archives.lille.fr | archives, anecdotes, images anciennes, documents | verifier les droits des images et documents avant reutilisation |
| Histoire | https://gallica.bnf.fr/conseils/content/lille | documents historiques, cartes, guides anciens | verifier le statut de chaque document et ses conditions |
| Braderie | https://www.lille.fr/Braderie-de-Lille/Histoire-de-la-Braderie2/Histoire-de-la-Braderie | histoire, dates, faits sur la Braderie | chiffres et dates a dater selon l'edition |
| Tourisme/culture | https://hellolille.eu | lieux culturels, tourisme, specialites, acces | ne pas copier les textes ni les photos |
| Licence open data | https://www.data.gouv.fr/pages/legal/licences/etalab-2.0 | comprendre les obligations de la Licence Ouverte 2.0 | mentionner source et date de mise a jour, ne pas induire en erreur |

## Ordre de construction conseille

1. Stabiliser le socle statique deja publie dans le monorepo.
2. Isoler progressivement les fonctions de resolution quand le gameplay grossit.
3. Enrichir `../../packages/corpus/lille-mele/puzzles.json`.
4. Maintenir le validateur de grilles et le registre de sources commun.
5. Creer 15 a 30 grilles initiales sourcees.
6. Ajouter localStorage, streak, partage et pages legales manquantes.
7. Tester sur mobile, corriger l'accessibilite et deployer une beta.
8. Enrichir ensuite avec archives, bonus et modes thematiques.
