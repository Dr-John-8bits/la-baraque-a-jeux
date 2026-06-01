# La baraque a jeux Lille

Monorepo des mini-jeux lillois :

- le portail **La baraque a jeux** ;
- **Le mot a Biloute** ;
- **Lille-Mele**.

Le projet reste volontairement leger : applications statiques, pas de backend obligatoire, et une base commune pour le style, le corpus editorial et les scripts de validation.

## Structure

```text
.
├── apps/
│   ├── portail/
│   ├── le-mot-a-biloute/
│   └── lille-mele/
├── packages/
│   ├── corpus/
│   ├── game-utils/
│   └── ui/
├── docs/
│   └── editorial/
└── scripts/
```

## Lancer localement

Depuis la racine :

```bash
npm run serve
```

Puis ouvrir :

```text
http://127.0.0.1:48391/apps/portail/
http://127.0.0.1:48391/apps/le-mot-a-biloute/
http://127.0.0.1:48391/apps/lille-mele/
```

## Principes

- `apps/` contient les experiences publiques.
- `packages/corpus/` contiendra les donnees partagees, schemas et notes de validation.
- `packages/ui/` contiendra les styles et composants communs quand les apps seront factorisees.
- `packages/game-utils/` contiendra les helpers communs : date du jour, partage, stockage local, validation.
- `scripts/` contiendra les validateurs et outils de generation.

Chaque jeu peut encore fonctionner de facon autonome pendant la phase de migration. La mutualisation se fera par petites etapes pour garder le prototype jouable.

## Verification

```bash
npm run check:js
```
