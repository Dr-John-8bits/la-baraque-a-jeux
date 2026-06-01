# Checklist de release

Avant chaque livraison ou commit important, vérifier :

## Produit

- La grille est jouable du début à la fin.
- Le joueur comprend l'objectif sans lire une longue explication.
- Le message "trois sur quatre" fonctionne.
- La victoire et la défaite affichent les bonnes informations.
- Le partage ne révèle pas les réponses.

## Contenu

- 4 groupes exactement.
- 4 items par groupe.
- 16 items uniques.
- Aucune réponse vide.
- Aucune ambiguïté injuste.
- Aucune référence religieuse.
- Les anecdotes sont sourcées.
- Les formulations sont originales.

## Mobile

- Test iPhone étroit.
- Aucun texte ne déborde.
- Les boutons restent accessibles au pouce.
- Les tuiles restent lisibles.
- Le menu sticky ne masque pas le jeu.

## Accessibilité

- Les cartes sont utilisables comme boutons.
- Le feedback n'est pas uniquement coloré.
- Les contrastes restent lisibles.
- Les animations ne sont pas agressives.
- `prefers-reduced-motion` est respecté.

## Technique

- Pas d'erreur console.
- Pas d'artefact de test versionné.
- `localStorage` reste compatible ou migre proprement.
- `npm run check` passe depuis la racine.
- La version est incrémentée.
- Le changelog est mis à jour.

## Documentation

- `README.md` reste exact.
- `CHANGELOG.md` contient l'entrée de version.
- `SOURCES.md` contient les nouvelles sources.
- `FAQ.md` reflète les règles actuelles.
- Les licences restent cohérentes.

## Git

- Commit atomique.
- Message de commit clair.
- Description de commit en français avec fichiers concernés.
