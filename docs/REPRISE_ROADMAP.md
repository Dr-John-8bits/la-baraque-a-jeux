# Feuille de route de reprise

Plan de reprise du monorepo, découpé en **lots courts et vérifiables** (un lot ≈ une
session, un commit propre, des tests qui passent). Objectif double : faire avancer le projet
**et** maîtriser les crédits Claude Code en évitant les grosses passes floues.

Mis à jour le 2026-06-14. Audit d'entrée : `npm run check` ✅, `npm run test:browser` ✅
(aucune régression à réparer).

## État des jeux

| Jeu | État | Jouable | Vrai blocage |
|-----|------|:---:|--------------|
| Le Mot à Biloute | mature | ✅ | Corpus 40 → 100+ mots ; qualité des indices |
| Lille-Mêle | alpha avancée | ✅ | Éditorial : 10 grilles relues → 30-45 |
| Biloute · Bière · Braderie | v1 | ✅ | Finition : calepin, stats, tests |
| Station Mystère | alpha v1 | ✅ | Qualité des indices + relecture 60 fiches + a11y + tuile portail |

> Ch'ti Fil (5ᵉ jeu envisagé) a été abandonné le 2026-06-14 et son dossier supprimé. La
> documentation de corpus partagée (`packages/corpus/documentation/`) est conservée : elle
> peut nourrir Lille-Mêle et Le Mot à Biloute.

## Principe de coût

Deux natures de travail aux coûts très différents :

- **Code** (robustesse, accessibilité, calepin, générateur) : borné, vérifiable par tests,
  bon rapport valeur/crédit.
- **Éditorial** (écrire des grilles, sourcer des mots, trouver les pépites) : gourmand en
  tokens, peu vérifiable par machine, forte valeur humaine. → toujours en **petits lots
  collaboratifs**, jamais en une passe massive.

## Blocs et lots

### Bloc 0 — Qualité éditoriale des indices *(prérequis transverse)*

Issu d'un retour éditeur : indices souvent redondants ou génériques, pépites manquantes
(ex. l'art en station à Mitterie). **À traiter avant les relectures de contenu**, sinon on
relit avec une mauvaise grille de lecture.

- **Lot 0.1** — ✅ Charte des indices et des pépites : `docs/editorial/charte-indices.md`.
- **Lot 0.2** — Passe de recherche assistée *Station Mystère* : pour chaque fiche métro,
  trouver la pépite sourcée, la soumettre à l'éditeur, réécrire les 5 indices (structure
  libre menée par la pépite). En sous-lots de ~8-10 fiches.
- **Lot 0.3** — Passe *Le Mot à Biloute* : dé-redonder les `hints` (deux angles distincts),
  enrichir les bonus si besoin. Par sous-lots de ~15 mots.
- **Lot 0.4** — Passe *Lille-Mêle* : vérifier/enrichir les anecdotes (fait neuf + source).

> Périmètre validé : **les trois jeux éditoriaux**. Structure d'indices Station Mystère :
> **libre, menée par la pépite**.

### Bloc 1 — Gains transverses rapides *(code, léger)*

- **Lot 1.1** — ✅ *Fait (2026-06-14)* — Robustesse partagée :
  - `writeJson` durci (try/catch, retourne un booléen) → quota plein / mode privé ne
    cassent plus la partie ; protège les 4 jeux (tous passent par `game-utils/storage.js`).
  - Le Mot à Biloute et Lille-Mêle : chargement du corpus protégé (auparavant top-level
    `await` sans catch → page bloquée). Message d'erreur lisible et accessible si le corpus
    est indisponible. Station Mystère gérait déjà ce cas.
  - Test navigateur dédié : coupure réseau du corpus → message affiché (2 specs OK).
- **Lot 1.2** — Passe accessibilité : `aria-live`, focus, navigation clavier sur
  `packages/ui` et chaque jeu.

### Bloc 2 — Finir ce qui est presque fini *(code, léger)*

- **Lot 2.1** — Biloute · Bière · Braderie : calepin + stats (tournées jouées/gagnées,
  série, meilleure série), textes de fin selon le score, tests dédiés (fin gagnée/perdue,
  timeout, révélation).

### Bloc 3 — Stabiliser Station Mystère *(code + éditorial, moyen)*

- **Lot 3.1** — Playtests desktop/mobile, corrections UX (suggestions, focus, aria-live,
  corpus indisponible).
- **Lot 3.2** — Relecture des 60 fiches métro (accents, typo, stations ambiguës avec
  commune). S'appuie sur le Bloc 0.
- **Lot 3.3** — Décision tuile portail « En construction → Jouer » + actu blog.

### Bloc 4 — Débloquer le contenu *(éditorial lourd, sous-lots)*

- **Lot 4.x** — Lille-Mêle : grilles relues manquantes, **5 grilles par session**
  (≈4-6 sessions), sourcées, sans item `avoid`, sans référence religieuse.
- **Lot 4.y** — Le Mot à Biloute : corpus vers 100 mots, **~15 mots par session**, sourcés.

## Garde-fous

- Rester statique (HTML/CSS/JS natif, JSON statiques, compatible GitHub Pages).
- Pas de framework lourd sans justification forte et validation explicite.
- Ne pas supprimer les hooks de test `window.render_game_to_text`.
- Toute mécanique touchée → tests mis à jour ; tout changement de règle produit → signalé.
- Chaque lot se termine par `npm run check` (+ `test:browser` si pertinent).
