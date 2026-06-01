Original prompt: Aligne les documents, et fais une première version du jeu.

## 2026-05-31

- Décision produit : le jeu s'appelle **Le mot à Biloute** et devient un jeu quotidien de mot à deviner, inspiré des jeux à essais, plutôt qu'un mini mots-croisés.
- À faire : aligner les licences et la proposition existante, créer une première version webapp statique mobile-first, vérifier le gameplay au clavier et à la souris/tactile.
- Documents alignés : proposition, licences et README utilisent désormais **Le mot à Biloute**.
- Prototype ajouté : `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`.
- Corrections après contrôle : ancienne marque supprimée, formulations de licence ajustées, liste de mots limitée à 5-8 lettres.
- Test Playwright : mot du jour `DRACHE` validé en 1 essai, dialogue final ouvert, aucune erreur console. Capture mobile initiale trop haute, compactage CSS appliqué.
- Vérification finale : `node --check app.js`, client web-game avec indice, test mobile 390x844 avec victoire, screenshots inspectés. Aucun fichier d'erreur Playwright généré.
- Suggestion suivante : enrichir la liste à 30 mots et ajouter une validation de dictionnaire ou un mode "prototype libre" clairement assumé.
- Itération 26.05.31.2 : premier indice affiché gratuitement, indices supplémentaires pénalisants, score calculé sur essais + indices, partage enrichi avec points et URL publique, footer crédit/version.
- Vérification 26.05.31.2 : Playwright confirme 1000 points au départ, 820 après un indice payant, partage avec `https://dr-john-8bits.github.io/le-mot-a-biloute/`, screenshots viewport mobile inspectés.
- Itération 26.05.31.3 : visuel supérieur façon ligne de métro supprimé en attente d'un futur visuel fourni.
- Itération 26.05.31.4 : structure documentaire complète ajoutée, specs déplacées dans `docs/SPECIFICATIONS.md`, changelog/FAQ/règles/architecture/guide éditorial/déploiement/confidentialité/roadmap créés.
- Complément 26.05.31.4 : ajout de `CONTRIBUTING.md` et `docs/TESTING.md`, README enrichi avec la nouvelle arborescence.
- Itération 26.05.31.5 : audit complet ajouté dans `docs/AUDIT.md`, demande de corpus éditorial ajoutée dans `docs/EDITORIAL_CORPUS_REQUEST.md`, version incrémentée.

## 2026-06-01

- Mutualisation monorepo : les mots du jeu sont extraits dans `packages/corpus/le-mot-a-biloute/words.json`.
- Le jeu charge désormais son corpus en statique et utilise les helpers communs pour la date quotidienne, le stockage local et le partage.
- À surveiller : le jeu dépend maintenant d'un chargement HTTP statique du JSON, ce qui correspond à GitHub Pages.
- Itération UI : suppression du titre interne redondant, conservation d'un `h1` accessible masqué, et déplacement du bouton `Carnet` dans la ligne de message de partie pour réduire l'espace perdu sans charger le menu sticky global.
- Itération UI suivante : suppression de la bannière de message visible, ajout d'une rangée `Aide` / `Carnet`, création d'une modale d'aide avec règles, points, indices et série. Les retours courts passent par un annonceur accessible masqué ; la validation trop courte garde le secouement de ligne.
- Itération mécanique quotidienne : `Le mot à Biloute` utilise désormais une journée de jeu calée à 12 h heure de Paris. Avant midi, le mot de la veille reste actif ; à partir de midi, le nouveau mot prend le relais jusqu'au lendemain midi. Le texte d'aide et les specs ont été alignés.
- Itération indices : suppression du panneau d'indice permanent au-dessus du clavier. Le bouton `Indice gratuit` ouvre une modale et révèle le premier indice sans coût ; les indices suivants se révèlent dans la modale avec une pénalité de 180 points. Le clavier n'est plus poussé en bas pour éviter un grand vide après suppression du panneau.
- Itération validation : l'ancien bouton `Partager` de la zone d'action devient une action primaire dynamique. Pendant la partie il affiche `Valider`, actif seulement quand la proposition est complète ; après la fin de partie il redevient `Partager`. Le bouton `OK` du clavier virtuel est conservé.
- Itération partage : ajout d'un état CTA `Partager` avec animation courte de pop/halo sur le bouton d'action et sur le bouton visible dans la modale de résultat.
- Itération Rab de Biloute 26.06.01.1 : après 6 essais officiels échoués, la série est perdue mais la partie reste jouable en mode Rab de Biloute. Les essais suivants continuent de retirer 120 points et le score peut passer sous zéro ; un résultat trouvé au Rab de Biloute est partagé et présenté distinctement d'une victoire officielle.
- Vérification Rab de Biloute : `npm run check` OK. Test Playwright ciblé OK : entrée dans le Rab de Biloute au 6e échec, stats officielles à 1 partie / 0 victoire / série 0, résultat `recovered` en 11 essais avec `-200` points, bouton `Partager`, aucune erreur console. Le smoke global Playwright échoue actuellement avant le jeu sur une attente blog (`Socle mutualisé`) liée aux entrées blog locales modifiées.
- Itération wording : remplacement du vocabulaire visible `rattrapage` par `Rab de Biloute`, avec la modale `T'as perdu, Biloute !`. Les identifiants techniques restent `recovery/recovered`.
- Itération couleur locale : `Aide` devient `Hein ?`, `Carnet` devient `Calepin`, `Indice` devient `Ch’ti coup d'pouce`, et le message de victoire devient `Bien joué biloute !`.
- Vérification couleur locale : `npm run check` OK. Test Playwright ciblé OK sur les libellés `Hein ?`, `Calepin`, `Ch’ti coup d'pouce gratuit`, la victoire `Bien joué biloute !` sans majuscule forcée, et le Rab de Biloute. Captures desktop/mobile inspectées, le bouton long reste lisible.
- Itération roadmap 26.06.01.2 : ajout d'une politique `guess-policy.json` en mode découverte pour cadrer les propositions sans imposer un dictionnaire incomplet ; les suites à lettre unique et sans voyelle/Y sont refusées.
- Accessibilité : les cases validées exposent maintenant des labels détaillés pour décrire le retour des lettres.
- Fin de partie/calepin : ajout du détail du score, de l'état officiel, de la série, du meilleur score, du taux de réussite et d'un historique local simple.
- PWA/partage : ajout d'icônes PWA basées sur l'asset de marque, métadonnées Open Graph/Twitter et `404.html` GitHub Pages.
- Nettoyage docs : roadmap, audit, specs, architecture, confidentialité, déploiement, tests, README et changelog alignés sur l'état réel.
- Vérification 26.06.01.2 : `npm run check` OK, `npm run test:browser` OK. Test Playwright ciblé OK : proposition invalide bloquée sans essai consommé, Rab de Biloute toujours fonctionnel, détail de score/calepin/historique présents, labels de cases enrichis, aucune erreur console. Captures inspectées pour l'écran initial, l'état Rab et la modale de victoire enrichie.
- Itération Rab de Biloute 26.06.01.3 : quand une partie sauvegardée revient en mode Rab après rechargement, le bouton de gauche devient `Prendre du rab`, rouvre la modale dédiée, puis redevient un accès normal aux coups d'pouce.
- Vérification 26.06.01.3 : `npm run check` OK, `npm run test:browser` OK. Test Playwright ciblé OK sur le retour après rechargement en Rab de Biloute ; le client web-game confirme l'écran initial et `render_game_to_text` en version `26.06.01.3`.
- Itération corpus 26.06.01.4 : ajout de sources explicites Nord Escapade, Banque Chtimi et Comptoir des Flandres ; la reserve regionale passe a 103 graines reformulees et `words.json` contient maintenant 40 mots relus avec `sourceIds`.
- Vérification 26.06.01.4 : `npm run check:corpus` OK, `npm run check` OK, `npm run test:browser` OK. Capture web-game inspectee : le jeu charge la nouvelle liste, mot du jour `BISTOULE`, categorie `Habitude du Nord`, version `26.06.01.4`.
- Itération expérience 26.06.01.5 : ajout d'une liste `accepted-guesses.json` générée depuis le corpus traité, passage en validation stricte locale, mode archive hors stats officielles, compte à rebours du prochain mot, animation flip des lettres, import/export du calepin et graphique de performance. Le dossier temporaire `POUR INSPIRATION/` est ignoré à la racine.
- Vérification 26.06.01.5 : `npm run build:biloute-guesses` OK avec 1560 propositions, `npm run check` OK, `npm run test:browser` OK. Tests Playwright ciblés OK sur refus strict, flip, archive, retour au mot du jour, compte à rebours et calepin. Capture navigateur intégré inspectée sur mobile.
