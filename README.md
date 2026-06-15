# La Baraque à Jeux Lille

Monorepo des mini-jeux quotidiens lillois : un portail et plusieurs jeux « du jour » autour de Lille, du Nord et du parler ch'ti.

**En ligne :** https://dr-john-8bits.github.io/la-baraque-a-jeux/

## Les jeux

Quatre jeux quotidiens sont en ligne, chacun avec une mécanique différente :

| Jeu | Mécanique |
|---|---|
| **Le Mot à Biloute** | deviner le mot du jour, lettre par lettre — vocabulaire du Nord et ch'ti |
| **Station Mystère** | retrouver la station de métro lilloise du jour à partir d'indices |
| **La Frise du Nord** | remettre cinq faits régionaux dans l'ordre chronologique |
| **Lille-Mêle** | regrouper seize mots en quatre familles lilloises |

Deux autres sont en chantier : **Commune Mystère** (géographie, à coder) et **Biloute · Bière · Braderie** (retiré du portail, page conservée).

Le projet reste volontairement léger : applications statiques, pas de backend, déploiement sur GitHub Pages. Une base commune sert au style, au corpus éditorial et aux scripts de validation.

## Structure

```text
.
├── index.html              portail public (GitHub Pages)
├── apps/                   un dossier par jeu
│   ├── le-mot-a-biloute/
│   ├── station-mystere/
│   ├── la-frise/
│   ├── lille-mele/
│   ├── commune-mystere/    (scaffold)
│   └── biloute-biere-braderie/
├── packages/
│   ├── corpus/             données par jeu + sources.json + shared/ (socle mutualisé)
│   ├── game-utils/         helpers : date du jour, partage, stockage, JSON, Markdown
│   └── ui/                 tokens, styles, navigation, calepin partagé
├── docs/
│   ├── blog/               NEWS.md → blog.html
│   └── editorial/
└── scripts/                validateurs et outils de génération
```

## Principes

- `index.html` est le portail public servi par GitHub Pages ; chaque jeu vit dans `apps/<slug>/`.
- Chaque jeu garde son moteur propre, mais s'appuie sur les briques communes (`packages/ui`, `packages/game-utils`) : identité « chunky », cadence quotidienne (bascule à midi, heure de Paris), calepin de stats partagé, partage spoiler-free, service worker pour le hors-ligne.
- `packages/corpus/` contient les données de chaque jeu, le registre des sources (`sources.json`) et le socle mutualisé (`shared/`, par exemple les monuments Mérimée réutilisés par plusieurs jeux).
- **Charte éditoriale** : chaque fait ou pépite est sourcé et réutilisable (open data — Wikidata en CC0, Mérimée et données de la MEL sous Licence Ouverte…). Une donnée non sourçable est écartée, pas maquillée. Des outils de build re-jouables (`npm run build:*`) récupèrent, vérifient et curent les données.
- `docs/blog/NEWS.md` alimente la page publique `blog.html`, générée depuis `docs/blog/entries/`.

Principe de **mutualisation frugale** : toute donnée récoltée pour un jeu est passée en revue pour les autres — pas un critère de sélection, un réflexe pour amortir chaque source.
