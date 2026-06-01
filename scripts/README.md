# Scripts

Scripts de verification du monorepo statique.

## Commandes

```bash
npm run build:blog
npm run check
npm run check:blog
npm run check:js
npm run check:corpus
npm run check:static
npm run test:browser
```

## Roles

- `build-news.mjs` genere `docs/blog/NEWS.md` depuis `docs/blog/entries/`.
- `check-js.mjs` controle la syntaxe des fichiers JavaScript.
- `validate-corpus.mjs` valide les donnees partagees du corpus.
- `check-static-pages.mjs` verifie les pages, liens internes, assets et fichiers charges par `fetch`.
- `test:browser` lance le smoke test Playwright et demarre un serveur statique de test si necessaire.
