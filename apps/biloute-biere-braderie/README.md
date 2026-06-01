# Biloute · Bière · Braderie

Mini-jeu web statique inspiré du ch’tifoumi, adapté à l'univers de Lille.

## Règles

- Biloute bat Bière.
- Bière bat Braderie.
- Braderie bat Biloute.

Le joueur affronte l'ordinateur. Le premier à 5 manches gagnées remporte la partie.

## Structure

```text
.
├── index.html
├── app.js
├── styles.css
├── manifest.webmanifest
├── ROADMAP.md
├── README.md
└── progress.md
```

Le jeu expose `window.render_game_to_text()` pour les tests et `window.advanceTime(ms)` pour la boucle de vérification Playwright.

## Documentation

- [Roadmap](ROADMAP.md)
