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
