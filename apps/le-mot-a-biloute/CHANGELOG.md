# Changelog

Toutes les modifications notables du projet sont documentées ici.

Le format de version suit `AA.MM.JJ.i`, où `i` est l'itération du jour.

## 26.06.04.1

- Ajout d'un état de chargement visible avant l'initialisation du jeu, avec roue animée et message `Chargement en cours...`.
- La grille, les actions et le clavier restent masqués jusqu'au premier rendu complet.

## 26.06.03.1

- Ajout d'une séquence de victoire avant la modale : révélation complète de la ligne, bref temps de respiration, rebond discret du mot, puis ouverture du résultat.

## 26.06.02.2

- Renforcement du partage desktop : si le partage natif n'est pas disponible, le jeu copie le résultat avec un fallback compatible Firefox.
- Ajout d'un message visible après copie et d'une zone de copie manuelle si le navigateur bloque toute copie automatique.

## 26.06.02.1

- Ajout d'un dictionnaire français large `french-guesses.json` dérivé de `mots.txt` de LouanBen/wordle-fr.
- Les propositions courantes comme `LANGUE`, `PATOIS` ou `BOUCHE` peuvent désormais être acceptées si elles ont la bonne longueur.
- Les réponses du jour restent limitées aux mots relus de `words.json`.
- Ajout du script `npm run build:biloute-french-guesses` et des contrôles de corpus associés.
- Mise à jour des mentions de licence pour la ressource tierce GPL-3.0.

## 26.06.01.5

- Ajout d'une liste séparée de propositions acceptées, générée depuis le corpus traité.
- Passage de la validation en mode strict local.
- Ajout du mode archive, du compte à rebours, de la révélation flip lettre par lettre.
- Enrichissement du calepin avec import/export JSON et graphique de performance.
- Suppression des petits marqueurs visuels sur les lettres validées, les labels accessibles restent conservés.
- Exclusion du dossier temporaire `POUR INSPIRATION/` du versionnement.

## 26.06.01.4

- Ajout de sources web explicites pour vocabulaire ch'ti, gastronomie et bières du Nord.
- Extension de la réserve documentaire régionale à 103 graines reformulées.
- Intégration d'un premier lot relu de 40 mots jouables pour Le mot à Biloute.

## 26.06.01.3

- Ajout d'une action `Prendre du rab` quand une partie en Rab de Biloute est reprise après rechargement.
- La modale de Rab utilise désormais le même libellé pour lancer la suite.

## 26.06.01.2

- Ajout d'une politique de validation des propositions en mode découverte.
- Amélioration de l'accessibilité des cases validées avec labels détaillés.
- Enrichissement de l'écran de fin avec détail du score, état officiel, série et meilleur score.
- Ajout d'un historique local simple dans le calepin.
- Ajout de métadonnées de partage, icônes PWA et page `404.html` pour GitHub Pages.
- Mise à jour de la roadmap, de l'audit et des documents techniques.

## 26.06.01.1

- Ajout du mode Rab de Biloute après 6 essais officiels échoués.
- La série est désormais perdue dès l'entrée dans le Rab de Biloute, mais le joueur peut continuer à chercher.
- Le score continue de descendre dans le Rab de Biloute et peut devenir négatif.
- Renforcement de la couleur locale : `Hein ?`, `Calepin`, `Ch’ti coup d'pouce` et message de victoire `Bien joué biloute !`.
- Mise à jour des règles, du partage et de la documentation produit.

## 26.05.31.5

- Ajout d'un audit complet du jeu.
- Ajout d'un brief de corpus éditorial pour organiser le travail en parallèle.
- Clarification des priorités techniques, produit, contenu, accessibilité et déploiement.

## 26.05.31.4

- Structure documentaire complète ajoutée.
- Création d'une FAQ/règles du jeu.
- Ajout des documents d'architecture, déploiement, confidentialité, roadmap, tests, contribution et guide éditorial.
- Déplacement des spécifications produit dans `docs/SPECIFICATIONS.md`.

## 26.05.31.3

- Suppression du visuel supérieur temporaire qui imitait une ligne de métro.
- Préparation de l'interface pour recevoir plus tard un visuel fourni.

## 26.05.31.2

- Ajout du premier indice gratuit et volontairement vague.
- Ajout d'indices supplémentaires avec pénalité de points.
- Ajout d'un score basé sur les essais et les indices.
- Enrichissement du partage avec le score et le lien public.
- Ajout du footer crédité `Le mot à Biloute par Dr. John`.

## 26.05.31.1

- Première version jouable de la webapp.
- Ajout de la grille d'essais, du clavier virtuel, de la saisie clavier physique, du bonus final, des statistiques locales et du partage texte.
- Alignement du projet sur le nom **Le mot à Biloute**.
