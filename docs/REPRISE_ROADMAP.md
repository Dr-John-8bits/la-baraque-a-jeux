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
- **Lot 1.2** — ✅ *Fait (2026-06-14)* — Passe accessibilité (audit multi-agents WCAG 2.1 AA,
  31 findings vérifiés, faux positifs écartés) :
  - Cibles tactiles ≥ 44px : clavier et boutons utilitaires (Mot à Biloute), boutons de
    choix et « Lancer » (BBB), croix de fermeture (Station + `packages/ui`).
  - Contraste : textes de détail des bannières perte/égalité (BBB) repassés en encre ;
    focus blanc sur le bouton rouge « Lancer ».
  - Focus : restitution au déclencheur sur la modale « À propos » partagée ; arrière-plan
    `inert` derrière la modale d'accueil non-native de Lille-Mêle ; focus porté sur le
    résultat révélé (Station).
  - ARIA : combobox de recherche `aria-activedescendant` + ids d'options + `aria-live`
    (Station) ; résultat de fin en `aria-live="assertive"` (Lille-Mêle) ; labels manquants
    (input fichier Mot à Biloute, boutons bonus Lille-Mêle).
  - Faux positifs écartés : `prefers-reduced-motion` déjà couvert globalement par `base.css` ;
    « focus trap » des `<dialog>` natifs déjà assuré par le navigateur.
  - 2 tests navigateur ajoutés (combobox `aria-activedescendant`, arrière-plan `inert`).
  - Reporté (faible valeur) : annonce des tuiles révélées et `aria-live` assertif des erreurs
    (Mot à Biloute), `aria-label` des pastilles de score et raccourcis clavier (BBB).

### Bloc 2 — Finir ce qui est presque fini *(code, léger)*

- **Lot 2.1** — ✅ *Fait (2026-06-14)* — Biloute · Bière · Braderie :
  - Calepin (modale `<dialog>` à la convention des jeux mûrs) ouvert par un bouton discret :
    tournées jouées/gagnées/perdues, taux de victoire, série en cours, meilleure série,
    plus belle victoire, manches gagnées, temps morts, historique des 10 dernières tournées.
  - Stats enrichies (les anciennes clés restent compatibles via fusion `DEFAULT_STATS`) +
    export/import JSON du calepin.
  - Textes de fin variant selon le score (5-0 parfait … 4-5 serré) ; « Rejouer » → « Revanche ».
  - `render_game_to_text` expose désormais `stats` (additif).
  - 2 tests navigateur : tournée gagnée 5-0 (déterministe via le crochet de test
    `__forceComputerChoice`) et tournée perdue par 5 temps morts.

### Bloc 3 — Stabiliser Station Mystère *(code + éditorial, moyen)*

- **Lot 3.1** — ✅ *Fait (2026-06-14)* — Playtests + corrections code :
  - Playtest mobile complet (victoire avec indices, mauvaise réponse, calepin) : 0 erreur
    console ; LocalStorage corrompu → le jeu démarre frais sans planter.
  - Chasse aux bugs multi-agents (7 findings vérifiés, faux positifs écartés). Corrigés :
    rejet d'un état sauvegardé au `status` aberrant ; plus de décompte incohérent de
    `stats.played` quand le stockage est bloqué (s'appuie sur le booléen de `writeJson`) ;
    `max-height` des suggestions adaptatif (`clamp 50svh`) pour les écrans courts/paysage ;
    fermeture des suggestions à l'ouverture d'une modale.
  - Suggestions : ouverture **vers le bas** (le puzzle reste visible pendant la saisie) ;
    Échap ferme la liste **sans vider** le champ.
  - 1 test de régression ajouté (rejet d'un état au statut corrompu).
- **Lot 3.2** — *Reporté à la phase éditoriale* — Relecture des 60 fiches métro (pépites,
  anti-redondance, accents, stations ambiguës). S'appuie sur le Bloc 0.
- **Lot 3.3** — ✅ *Fait (2026-06-14)* — Tuile portail Station Mystère passée de
  « En construction / Voir » à « Métro / Jouer », description au présent. *Reste optionnel :
  une actu blog annonçant l'ouverture.*

### Bloc 4 — Débloquer le contenu *(éditorial lourd, sous-lots)*

- **Lot 4.x** — Lille-Mêle : grilles relues manquantes, **5 grilles par session**
  (≈4-6 sessions), sourcées, sans item `avoid`, sans référence religieuse.
- **Lot 4.y** — Le Mot à Biloute : corpus vers 100 mots, **~15 mots par session**, sourcés.
  - 🔄 *En cours (2026-06-14)* — **40 → 64 mots** (2 lots). Tirés de
    `regional-word-seeds.json` (définitions sourcées des dictionnaires ch'ti, `sourceIds`
    enregistrés). Charte appliquée : amorce-devinette + 2 hints d'angles distincts + pépite.
    Écartés volontairement : respellings phonétiques plats ; mots à risque (RATON = aussi une
    injure ; MARABOU = connotation religieuse) ; définitions à faible confiance (mafler,
    bidoule, touquette). Statut `prototype` en attente de relecture éditeur. Mots déjà présents
    dans le dictionnaire de propositions (pas de régénération).
    - Lot 1 : baraque, friterie, carnaval, galopin, godale, mitan, muche, fouffe, nactieux,
      buquer, galafe, amiteux.
    - Lot 2 : brassin, cumulet, dache, catouilles, fricot, jatte, longin, malaju, guiffe,
      arniquer, badoule, cafiot.
    - Reste vers 100 : ~36 mots (encore ~40 graines candidates dans le seed, + recherche
      web sourcée si besoin).

## Garde-fous

- Rester statique (HTML/CSS/JS natif, JSON statiques, compatible GitHub Pages).
- Pas de framework lourd sans justification forte et validation explicite.
- Ne pas supprimer les hooks de test `window.render_game_to_text`.
- Toute mécanique touchée → tests mis à jour ; tout changement de règle produit → signalé.
- Chaque lot se termine par `npm run check` (+ `test:browser` si pertinent).
