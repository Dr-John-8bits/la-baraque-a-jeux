# Cahier des charges — La Frise du Nord

> **Statut : scaffolding.** Répertoire + cahier des charges + squelette + un corpus-graine de démonstration. Le jeu reste à coder ; le gros du travail est **éditorial** (constituer la liste de faits datés et sourcés). Point de départ de la prochaine session.

## 1. Concept

Un jeu quotidien de **chronologie** sur l'histoire et le patrimoine des **Hauts-de-France**. On replace dans le temps des faits régionaux : Bouvines, Vauban, le Mongy, le VAL, le Louvre-Lens…

C'est la **famille manquante** : aucun des autres jeux ne joue sur le temps.

| Famille | Jeu |
|---|---|
| Mot / lettres | Le Mot à Biloute |
| Groupement sémantique | Lille-Mêle |
| Déduction par indices | Station Mystère |
| Géographie / spatial | Commune Mystère *(scaffold)* |
| **Temporel / chronologie** | **La Frise du Nord** |

Atout : c'est le jeu **le plus enraciné** dans les racines régionales (il fait remonter l'histoire du Nord), pour un **moteur trivial**. Le coût est l'éditorial, qui est justement la valeur de marque (et il respecte la [charte indices & pépites](../../README.md) : chaque fait sourcé, aucune date inventée).

## 2. Nom — À ARBITRER avant de coder

Titre de travail « La Frise du Nord » (slug `la-frise`). Alternatives :
- **Avant / Après** (si on retient la mécanique higher-lower) ;
- **Chrono ch'ti** ;
- **Quand donc ?**

➡️ Décider nom + mécanique (§4), puis renommer dossier/slug/manifest/clés localStorage.

## 3. Données / corpus

- Corpus : `packages/corpus/la-frise/events.json`.
- **Un corpus-graine de 8 faits est déjà fourni** comme gabarit de format. À **étendre à ~50-100 faits** pour une bonne rotation.
- Format par item :
  ```json
  { "id": "metro-val-lille", "label": "Le métro VAL de Lille", "year": 1983,
    "precision": "an", "category": "transport",
    "blurb": "Premier métro entièrement automatique au monde.",
    "sourceIds": ["wikipedia-..."] }
  ```
  - `precision` : `"an"` | `"siecle"` | `"circa"` — pour gérer les dates floues.
  - `category` : histoire, patrimoine, transport, industrie-social, culture, sport… (sert à varier et, éventuellement, à thématiser un set).
  - `blurb` : 1 phrase, affichée **à la révélation** (dimension documentaire, comme Station).
- **Sourçage (charte)** : chaque fait a ≥1 `sourceId` enregistré dans `packages/corpus/sources.json`. Wikipédia + données déjà au repo (monuments `epoque_construction`/`siecle`, dates d'ouverture de stations, historique de population des communes) + curation. Un fait non datable de façon sûre est **écarté**, pas approximé.

## 4. Règles — choisir UNE mécanique pour la v1

### Variante A — « Frise » : remettre dans l'ordre (RECOMMANDÉE pour démarrer)
- 1 set quotidien de **5 faits** (à régler), tirage déterministe par date (epoch `2026-01-01`, bascule midi Europe/Paris — réutiliser `getDailyDateId` + `selectDailyItem`).
- Le joueur **ordonne** les cartes du plus ancien au plus récent (glisser-déposer **ou** flèches monter/descendre — prévoir le clavier).
- **Validation finale** : compter les positions exactes (ou les paires bien ordonnées). Feedback visuel par carte (bien placée / mal placée), façon Lille-Mêle. 1 validation, ou N essais — à régler.
- **Révélation** : les vraies dates + le `blurb` + la source de chaque fait → on apprend quelque chose à chaque partie.

### Variante B — « Avant / Après » : higher-lower
- On part d'un fait-ancre (date connue affichée). On présente un fait, le joueur répond **« avant »** ou **« après »**. Tant qu'il a juste, la série s'allonge (score = longueur). Tirage du jour = graine déterministe de la séquence.
- Plus addictif, encore plus simple à coder ; mais score = série plutôt que puzzle « résolu ».

> Choisir A **ou** B pour la v1 (les deux partagent le corpus). A donne un vrai « puzzle du jour » homogène avec les autres ; B est un score-attack.

## 5. Moteur (trivial)

- Comparaison sur `year`. Dates floues : un `siecle` → on compare via l'année médiane (ex. XIXᵉ → 1850) ; `circa` → tolérance.
- **À la génération du set quotidien**, écarter les paires trop rapprochées/ambiguës (ex. < 5 ans d'écart si `precision` ≠ `"an"`) pour qu'il y ait toujours un ordre net.
- Variante A : score = nb de positions exactes (ou nb de paires `(i,j)` bien ordonnées / total).
- Variante B : `guessCorrect = (candidate.year >= anchor.year) === (réponse === "après")`.

## 6. UI / identité

- Identité **chunky** du site (bordures 2px, ombres dures, tricolore, crème/marine, police Inter) ; réutiliser nav, dialog « À propos », `base.css`/`tokens.css`/`site-nav.css`, service worker, favicon.
- Écrans (variante A) : la **pile de cartes à ordonner** (glisser-déposer / flèches), bouton **Valider**, **révélation** avec dates + fiches, ligne « frise d'hier », **compte à rebours** « prochaine frise à 12 h », bouton **Partager**.
- Accessibilité : ordonner **au clavier** (boutons monter/descendre + `aria`), `aria-live`, cibles 44px, `prefers-reduced-motion`.

## 7. Partage (spoiler-free)

```
La Frise du Nord 2026-06-14
🟩🟩⬛🟩⬛  (3/5 bien placés)
https://dr-john-8bits.github.io/la-baraque-a-jeux/apps/<slug>/
```
Carré vert par position exacte, noir sinon. **Ne jamais écrire les dates ni l'ordre.** + lien (URL absolue de prod).

## 8. Persistance (localStorage)

- Clés : `la-frise.v1.currentGame`, `la-frise.v1.stats`.
- `stats` : `played, won, currentStreak, bestStreak, lastPlayedDateId, lastWinDateId, scoreDistribution, history` (le `history {date, won}` alimente la heatmap du calepin).
- Sauvegarder la partie en cours et rejeter un état aberrant.

## 9. Intégration portail (au branchement)

- 5ᵉ jeu (avec Commune Mystère) → **repenser la grille** (4 cartes = 2×2 ; 5 cartes → 2×2 + 1, ou 1 colonne sur 2 rangées… à arbitrer pour éviter l'orpheline ; cf. l'historique grille 3 vs 4 cartes).
- Jeu **quotidien** → l'ajouter au **hub** (`portal-hub.js`, X/4 → X/5) et au **calepin** (`portal-calepin.js`).
- Mettre à jour : `og:description` du portail, `sitemap.xml`, **image OG**, precache `sw.js` (+ bump `VERSION`).
- Ajouter la page à `scripts/check-static-pages.mjs` ; ajouter (optionnel) une validation du corpus à `scripts/validate-corpus.mjs`.

## 10. Tests

- Smoke : chargement, ordonnancement (clavier), validation + score, révélation, reprise d'état aberrant. Exposer `window.render_game_to_text()`.

## 11. À régler au playtest

- Mécanique A ou B (commencer par A).
- Nombre de faits par set (5 ?) et nombre d'essais (1 validation, ou plusieurs ?).
- Gestion fine des dates floues (siècles, « vers »).
- Difficulté : faits très espacés = facile, rapprochés = dur → doser via l'écart minimal.

## 12. Par où commencer (prochaine session)

1. **Choisir nom + mécanique** (A recommandée).
2. **Constituer le corpus** `events.json` (~50 faits datés sourcés) — *le gros du travail*, en suivant le gabarit fourni et la charte (sources enregistrées).
3. **Coder `app.js`** : cadence quotidienne + sélection du set + ordonnancement + validation/score + révélation + partage + schedulers.
4. **`styles.css`** dans l'identité chunky.
5. **Brancher au portail** (§9) + tests + `npm run check`.
