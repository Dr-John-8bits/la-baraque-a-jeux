# Versioning

Lille-Mêle utilise un format de version lisible :

```text
AA.MM.JJ.i
```

Exemple :

```text
26.05.31.3
```

## Signification

- `AA` : année sur deux chiffres.
- `MM` : mois.
- `JJ` : jour.
- `i` : itération du jour.

## Quand incrémenter l'itération ?

Incrémenter `i` à chaque série de modifications prête à être versionnée :

- changement visible dans l'app ;
- modification de règles ;
- modification de contenu ;
- correction responsive ;
- ajout documentaire significatif ;
- préparation de release.

## Où mettre à jour la version ?

Pour le prototype actuel, la reference publique des nouveautes est mutualisee :

- `app.js` : constante `APP_VERSION` ;
- `../../docs/blog/entries/` : entree publique source ;
- `../../docs/blog/NEWS.md` : fichier genere par `npm run build:blog` ;
- `CHANGELOG.md` : nouvelle entrée seulement si un detail propre au jeu doit rester dans l'historique local ;
- `README.md` : version courante si nécessaire ;
- `progress.md` : note d'itération.

## Règle pratique

Une version correspond à un état testable.

Ne pas incrémenter uniquement pour une note sans impact, sauf si cette note fait partie d'une livraison documentaire.
