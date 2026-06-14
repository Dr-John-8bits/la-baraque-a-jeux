# Cahier des charges — Commune Mystère

> **Statut : scaffolding.** Le répertoire, le corpus et le moteur géo sont en place ; le jeu reste à coder. Ce document est le point de départ de la prochaine session.

## 1. Concept

Un **4ᵉ jeu quotidien** pour La Baraque à Jeux : deviner la **commune de la Métropole Européenne de Lille (MEL)** du jour, façon *Worldle*.

À chaque commune proposée, le jeu indique :

- la **distance à vol d'oiseau** vers la commune cible (km) ;
- la **direction** (boussole 8 points → flèche) ;
- un **% de proximité**.

Le joueur **triangule par la géographie** jusqu'à trouver. C'est le **seul jeu du portail qui utilise la carte** — les 3 autres sont mots (Le Mot à Biloute), connexions (Lille-Mêle) et déduction par indices (Station Mystère). Aucune redondance.

> ⚠️ À ne pas confondre : **Wordle** (deviner un *mot* par ses lettres) = Le Mot à Biloute. Ici c'est **Worldle** (deviner un *lieu* par distance/direction). Mécanique totalement différente.

## 2. Nom — À ARBITRER avant de coder

« Commune Mystère » est un **titre de travail** (et le slug `commune-mystere`). Il a l'avantage de la cohérence avec « Station Mystère », mais peut laisser croire à une mécanique d'indices (ce n'est pas le cas).

Alternatives qui évoquent mieux la mécanique géo :

- **Boussole** (ou « La Boussole ») — direct, évoque la direction ;
- **À vol d'biloute** — clin d'œil à « à vol d'oiseau » ;
- **Cap su' Lille** / **Cartoche** (carte + ch'ti).

➡️ Décider le nom, puis renommer : dossier `apps/<slug>/`, `manifest.webmanifest`, clés `localStorage`, libellés.

## 3. Données (✅ prêtes)

- Corpus : `packages/corpus/commune-mystere/communes.json`.
- **95 communes** : `{ name, codeInsee, lat, lon }`, triées par nom.
- Métadonnées utiles : `epochId: "2026-01-01"`, **`maxDistanceKm: 35`** (plus grande distance entre 2 communes, La Bassée ↔ Neuville-en-Ferrain) — sert à normaliser le % de proximité.
- Source : **geo.api.gouv.fr (IGN / INSEE)**, Licence Ouverte Etalab 2.0. À créditer dans `À propos` / `sources.json`.
- ~11 Ko. Aucune pépite éditoriale requise : le jeu tourne sur la pure géométrie (donc **zéro corvée éditoriale quotidienne**, contrairement à Station).
- **Donnée optionnelle (variante carte recommandée, cf. §5 bis)** : contours GeoJSON simplifiés des 95 communes (~100-200 Ko), à récupérer une fois sur l'open data. Non requise pour la v1 « liste seule ».

## 4. Règles du jeu

- **1 commune par jour**, commune à tous les joueurs, tirage **déterministe par date**.
- Bascule à **midi (Europe/Paris)** — réutiliser `getDailyDateId` + `selectDailyItem` + `epochId` de `packages/game-utils/daily.js`, exactement comme les 3 autres jeux.
- **6 essais** maximum (à confirmer au playtest ; 6 est la valeur de départ).
- À chaque essai (commune valide, non déjà proposée) :
  - **distance** (haversine), arrondie au km ;
  - **direction** : cap (bearing) → boussole `N NE E SE S SO O NO` → flèche ;
  - **proximité %** = `round(100 × (1 − distance / maxDistanceKm))`, borné `[0,100]` ;
  - **couleur du %** : rouge `< 40`, ambre `40–80`, vert `≥ 80` (cf. maquette validée).
- **Victoire** : commune exacte trouvée. **Défaite** : 6 essais épuisés → révéler la commune.
- **Saisie** : autocomplétion sur les 95 communes ; n'accepter qu'une commune **valide** ; **normaliser** (minuscules, sans accents ni tirets) pour le match ; refuser les doublons.

## 5. Moteur géo (✅ écrit et validé — voir `app.js`)

Les helpers sont déjà dans `app.js`, testés sur de vraies distances (Lille → Tourcoing = 12,7 km NE, Lille → Roubaix = 11,6 km NE, etc.) :

- `haversineKm(a, b)` → distance à vol d'oiseau ;
- `bearingDeg(a, b)` puis `cardinal8(deg)` → `N…NO` + flèche ;
- `normalizeName(s)` → match de saisie tolérant.

## 5 bis. Affichage : variante carte « Globle lillois » (RECOMMANDÉE)

On n'a pas de silhouette toute faite (comme le Worldle des pays), et ce n'est pas grave : un jeu de proximité marche très bien sans visuel — cf. **Globle** (on devine, chaque proposition se colore selon sa proximité, aucune forme affichée). Mais on peut faire **mieux** qu'une simple liste, en **générant une carte** depuis l'open data.

**Principe.** Afficher une **carte SVG des 95 communes de la MEL**. À chaque essai, la commune proposée **s'allume en dégradé chaud → froid** selon sa proximité de la cible (rouge = loin, vert = tout proche). Le joueur voit la métropole se remplir et resserre visuellement. La liste distance / flèche / % (§6) reste en complément (et reste la source d'info pour les lecteurs d'écran).

**Pourquoi cette variante.** Plus fun que la silhouette (interactif, on voit tout le territoire), uniquement lillois, et **toujours zéro corvée éditoriale** (purement géométrique). C'est la cible.

**Données à ajouter (une seule fois).**
- Contours des communes en **GeoJSON simplifié** → `packages/corpus/commune-mystere/communes-contours.geojson` (ou fusionnés au corpus).
- Source : **geo.api.gouv.fr** (`?fields=contour&format=geojson`) ou le jeu « découpage administratif » (IGN / Etalab). Open data, Licence Ouverte.
- **Simplifier** les polygones (Douglas-Peucker, ex. `mapshaper`) pour viser **~100-200 Ko** au total. « Forme reconnaissable » suffit, pas le tracé cadastral.

**Rendu (sans librairie).**
- projeter `lon/lat` → coordonnées SVG en équirectangulaire local : `x = (lon − lonMin) · k · cos(latMoy)`, `y = (latMax − lat) · k` (le `cos(latMoy)` évite l'étirement horizontal) ;
- un `<path>` par commune, couleur pilotée par l'état (`non joué` = neutre ; sinon dégradé par % de proximité) ;
- la **cible n'est jamais surlignée** avant la victoire (pas de spoiler) ;
- accessibilité : `role="img"` + `aria-label` résumant (« carte de la métropole, 3 communes proposées »).

**Repli / découpage.** L'**option A** (liste seule, déjà couverte) tourne avec les seuls centroïdes. On peut donc livrer **A en v1** et brancher **la carte en v1.1** sans rien jeter — le moteur (distance/direction/%) est identique, la carte n'est qu'une couche d'affichage en plus.

## 6. UI / identité

- **Identité « chunky »** du site (bordures 2px ink, ombres dures, tricolore rouge/teal/or, fond crème/marine, police Inter auto-hébergée).
- **Réutiliser le partagé** : nav (`site-nav.css`), dialog « À propos » (`about-dialog.js`), `base.css`, `tokens.css`, preload Inter, favicon, service worker.
- **Écrans** (cf. la maquette validée — masque de la cible, liste des essais avec distance/flèche/%/barre, champ + Valider) :
  - bandeau stats (score/série) ;
  - **masque de la commune cible** (style « brouillard », réutilisable de Station si pertinent) ;
  - **liste des essais** (nom · distance · flèche direction · % · barre de proximité colorée) ;
  - champ de saisie + autocomplétion + **Valider** ;
  - ligne **« commune d'hier : … »** (comme Le Mot / Station) ;
  - **compte à rebours « prochaine commune à 12 h »** (porter `scheduleCountdownRefresh` / `renderCountdown`) ;
  - bouton **Partager**.
- Accessibilité : `aria-live` sur les essais, `:focus-visible`, `prefers-reduced-motion`, cibles 44px.

## 7. Partage (façon Worldle, spoiler-free)

```
Commune Mystère 2026-06-14
🟥 14 km ↙
🟧  5 km ↖
🟩  2 km ↗
✅ trouvé en 4 essais
https://dr-john-8bits.github.io/la-baraque-a-jeux/apps/<slug>/
```

Carré coloré (rouge/ambre/vert selon proximité) + flèche par essai. **Ne jamais écrire le nom de la réponse.** Inclure le lien (URL absolue de prod).

## 8. Persistance (localStorage)

- Clés : `commune-mystere.v1.currentGame`, `commune-mystere.v1.stats`.
- `stats` : `played, won, currentStreak, bestStreak, lastPlayedDateId, lastWinDateId, guessDistribution, history` (le `history` avec `{date, won}` alimente la heatmap du calepin).
- Sauvegarder la **partie en cours** (essais déjà faits) et **rejeter un état sauvegardé aberrant** (cf. test Station).

## 9. Intégration portail (à faire au branchement)

- Ajouter la **carte** au portail → on **repasse à 4 jeux** → remettre la grille en **2×2** (la règle `games-grid` à 720px avait été passée à `repeat(3,…)` pour 3 jeux ; revenir à `repeat(2,…)`). Le compactage mobile reste valable.
- C'est un **jeu quotidien** → l'ajouter :
  - au **hub** (`portal-hub.js`) : passer de `X/3` à `X/4`, ajouter l'entrée dans `DAILY_GAMES` (`statsKey`, champs `lastPlayedDateId` / `currentStreak`) ;
  - au **calepin** (`portal-calepin.js`) : 4ᵉ carte de stats + heatmap.
- Mettre à jour : `og:description` du portail, `sitemap.xml`, **image OG** (régénérer avec les 4 jeux), `manifest` racine si besoin.
- Ajouter le jeu au **precache du service worker** (`sw.js`) + bumper `VERSION`.
- Ajouter la page à la liste de `scripts/check-static-pages.mjs` (sinon elle n'est pas validée) et, si on veut, un bloc de validation du corpus dans `scripts/validate-corpus.mjs`.

## 10. Tests

- Smoke (`tests/smoke.spec.mjs`) : chargement, saisie d'une commune valide → distance/direction affichées, victoire, défaite (6 essais), reprise d'un état aberrant.
- Exposer `window.render_game_to_text()` (comme les autres jeux).

## 11. À régler au playtest

- Nombre d'essais (6 ?).
- Faut-il **pondérer le tirage** pour commencer par des communes connues (Lille, Roubaix, Tourcoing…) plutôt qu'une commune obscure dès le jour 1 ? (Risque de frustration.)
- Formule de proximité (linéaire sur `maxDistanceKm`, ou racine pour « récompenser » les essais proches).

## 12. Par où commencer (prochaine session)

1. **Choisir le nom** → renommer dossier / slug / manifest / clés localStorage.
2. **Coder `app.js`** : charger le corpus, tirer la commune du jour, état, `render()`, `submitGuess()` (le moteur géo est déjà là), partage, schedulers (rollover + compte à rebours).
3. **`styles.css`** dans l'identité chunky (la maquette donne le rendu cible).
4. **Brancher au portail** (§9) : grille 2×2, hub, calepin, og, sitemap, sw, check-static.
5. **Tests** smoke + `npm run check` + `npm run test:browser`.
