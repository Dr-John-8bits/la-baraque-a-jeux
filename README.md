# La baraque a jeux Lille

Monorepo des mini-jeux lillois :

- le portail **La baraque a jeux** ;
- **Le mot a Biloute** ;
- **Lille-Mele**.

Le projet reste volontairement leger : applications statiques, pas de backend obligatoire, et une base commune pour le style, le corpus editorial et les scripts de validation.

## Structure

```text
.
├── assets/
│   └── brand/
├── apps/
│   ├── le-mot-a-biloute/
│   └── lille-mele/
├── packages/
│   ├── corpus/
│   ├── game-utils/
│   └── ui/
├── docs/
│   ├── blog/
│   └── editorial/
└── scripts/
```

## Principes

- `index.html` est le portail public servi par GitHub Pages.
- `assets/brand/` contient les assets de marque communs.
- `apps/` contient les experiences publiques.
- `packages/corpus/` contient les donnees partagees, schemas et notes de validation.
- `packages/ui/` contient les styles, tokens et composants communs.
- `packages/game-utils/` contient les helpers communs : date du jour, partage, stockage local, rendu Markdown et chargement JSON.
- `docs/blog/NEWS.md` alimente la page publique `blog.html`.
- `scripts/` contiendra les validateurs et outils de generation.

Chaque jeu garde son moteur propre, mais s'appuie sur les briques communes pour les fondations.

## Verification

```bash
npm run check
```

Smoke test navigateur optionnel :

```bash
npm run test:browser
```

Cette commande sert uniquement a la verification : elle demarre un serveur statique de test si aucun serveur local n'est deja disponible.
