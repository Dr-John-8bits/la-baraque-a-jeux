# Plan d'implémentation

## Objectif du document

Ce document transforme le cadrage game design de Station Mystère en plan d'exécution technique.

Il doit permettre de lancer le développement de la v1 Métro Mystère sans redécouvrir les décisions de gameplay, sans relire toute la conversation et sans réinventer les composants déjà présents dans La Baraque à Jeux Lille.

Ce document est volontairement opérationnel. Il décrit les fichiers à créer, les composants à réutiliser, les constantes, les fonctions, les états, les événements, les cas limites, les tests et l'ordre recommandé de développement.

---

## Référence principale

Documents à lire avant de coder :

1. `apps/station-mystere/game-design.md`
2. `apps/station-mystere/implementation-plan.md`
3. `apps/station-mystere/specifications.md`
4. `apps/station-mystere/gameplay.md`
5. `apps/station-mystere/roadmap.md`

Le présent document pilote l'exécution technique.

`game-design.md` pilote l'expérience de jeu et les choix d'interface.

---

## Résumé exécutif

La v1 doit transformer la page placeholder de Station Mystère en jeu quotidien jouable, centré uniquement sur le métro.

Le joueur voit une station mystère, lit un premier indice gratuit, cherche une station dans un champ avec suggestions, valide une proposition, débloque éventuellement des indices payants, puis gagne ou perd. La réponse est toujours révélée avec une fiche découverte.

Le jeu doit rester en JavaScript natif, comme les autres jeux du portail.

Il n'y a pas besoin de Phaser, de canvas, de carte interactive, de backend, de compte utilisateur ou de librairie supplémentaire.

---

## Périmètre de développement v1

Inclus :

- écran jouable Métro Mystère ;
- sélection quotidienne ;
- chargement du corpus éditorial ;
- filtrage des fiches métro ;
- recherche de station ;
- suggestions limitées ;
- validation de réponse ;
- score ;
- indices progressifs ;
- pénalités ;
- victoire ;
- défaite ;
- fiche découverte ;
- calepin ;
- statistiques locales ;
- partage sans spoiler ;
- reprise de partie ;
- aide courte ;
- tests smoke ;
- responsive mobile et desktop.

Exclus :

- tramway ;
- V'Lille ;
- bus ;
- multi-niveaux dans l'interface active ;
- carte de réseau ;
- archive des anciennes parties ;
- classement ;
- compte joueur ;
- synchronisation serveur ;
- zone de notes personnelles ;
- moteur de jeu externe.

---

## Décisions non négociables v1

- le jeu démarre directement sur l'écran jouable ;
- la station du jour est identique pour tout le monde ;
- renouvellement quotidien à midi, heure de Paris ;
- score initial : 1000 ;
- indice 1 gratuit et affiché automatiquement ;
- indice 2 : -150 ;
- indice 3 : -200 ;
- indice 4 : -250 ;
- indice 5 : -300 ;
- mauvaise réponse : -100 ;
- score minimum : 0 ;
- défaite à score 0 ;
- réponse révélée immédiatement après victoire ou défaite ;
- bouton principal : Valider ;
- suggestions à partir de 2 caractères ;
- 6 suggestions maximum ;
- aucune liste complète si le champ est vide ;
- le partage ne révèle pas la station ;
- LocalStorage uniquement ;
- `npm run check` doit passer.

---

## Fichiers à modifier ou créer

À modifier :

- `apps/station-mystere/index.html`
- `apps/station-mystere/styles.css`
- `tests/smoke.spec.mjs`
- éventuellement `scripts/check-static-pages.mjs`

À créer :

- `apps/station-mystere/app.js`

À ne pas modifier au premier passage, sauf nécessité :

- `packages/game-utils/daily.js`
- `packages/game-utils/fetch-json.js`
- `packages/game-utils/storage.js`
- `packages/game-utils/share.js`
- `packages/ui/about-dialog.js`
- `packages/corpus/station-mystere/editorial-entries.json`

Le corpus est considéré prêt pour la v1. Le développement ne doit pas commencer par modifier les fiches éditoriales, sauf si un test révèle une erreur bloquante.

---

## Imports recommandés dans app.js

```js
import { getDailyDateId, getRelativeDateId, selectDailyItem } from "../../packages/game-utils/daily.js";
import { fetchJson } from "../../packages/game-utils/fetch-json.js";
import { readJson, writeJson } from "../../packages/game-utils/storage.js";
import { shareText as shareTextWithFallback } from "../../packages/game-utils/share.js";
import { escapeHtml } from "../../packages/game-utils/text-render.js";
```

`getRelativeDateId` est utile pour les séries de victoires.

`escapeHtml` est utile si certaines zones sont construites via `innerHTML`. Si possible, préférer `textContent` pour les textes simples.

---

## Constantes recommandées

```js
const APP_VERSION = "26.06.05.1";
const GAME_NAME = "Station Mystère";
const GAME_MODE = "metro";
const STORAGE_PREFIX = "station-mystere.v1.";
const DAILY_EPOCH_ID = "2026-01-01";
const DAILY_TIME_ZONE = "Europe/Paris";
const DAILY_ROLLOVER_HOUR = 12;
const BASE_SCORE = 1000;
const WRONG_ANSWER_PENALTY = 100;
const HINT_COSTS = [0, 150, 200, 250, 300];
const MIN_SUGGESTION_CHARS = 2;
const MAX_SUGGESTIONS = 6;
const TOTAL_HINTS = 5;
const CORPUS_URL = "../../packages/corpus/station-mystere/editorial-entries.json";
```

Attention :

- `HINT_COSTS[0]` correspond à l'indice 1 gratuit ;
- `HINT_COSTS[1]` correspond à l'indice 2 ;
- le tableau est indexé par `revealedHintCount` quand on cherche le coût du prochain indice.

---

## Clés LocalStorage

```js
const STORAGE_KEYS = {
  currentGame: `${STORAGE_PREFIX}currentGame`,
  stats: `${STORAGE_PREFIX}stats`,
  settings: `${STORAGE_PREFIX}settings`,
  firstHelpSeen: `${STORAGE_PREFIX}firstHelpSeen`,
};
```

Règles :

- `currentGame` contient uniquement la partie du jour ;
- `stats` contient les statistiques cumulées ;
- `settings` peut rester vide au début ;
- `firstHelpSeen` permet de masquer l'aide au prochain chargement ;
- si une clé contient une donnée invalide, ignorer proprement et repartir d'un état sain.

---

## Données utilisées

Source :

- `packages/corpus/station-mystere/editorial-entries.json`

Filtrage v1 :

- garder uniquement les entrées avec `niveau === "metro"` ;
- garder uniquement les entrées avec une réponse, cinq indices et une fiche découverte ;
- ne pas afficher les entrées tramway pilotes.

Préparation recommandée :

```js
function getPlayableEntries(entries) {
  return entries
    .filter((entry) => entry.niveau === GAME_MODE)
    .filter(isEntryPlayable)
    .map(prepareEntry);
}
```

Entrée jouable minimale :

```json
{
  "id": "metro-rihour",
  "niveau": "metro",
  "typeReponse": "station",
  "reponse": "Rihour",
  "reponsesAcceptees": ["Rihour"],
  "indices": [
    { "ordre": 1, "type": "ligne", "texte": "..." },
    { "ordre": 2, "type": "quartier", "texte": "..." },
    { "ordre": 3, "type": "repere", "texte": "..." },
    { "ordre": 4, "type": "histoire", "texte": "..." },
    { "ordre": 5, "type": "precision", "texte": "..." }
  ],
  "ficheDecouverte": {
    "titre": "Rihour",
    "texte": "...",
    "faits": []
  }
}
```

---

## Fonctions de préparation des données

Fonctions recommandées :

```js
function isEntryPlayable(entry) {}
function prepareEntry(entry) {}
function sortHints(hints) {}
function getAcceptedAnswers(entry) {}
function getEntryLineLabels(entry) {}
function getDiscoveryText(entry) {}
```

`prepareEntry` peut ajouter des champs calculés :

```js
{
  ...entry,
  sortedHints,
  acceptedAnswerSet,
  normalizedAnswer,
  normalizedAcceptedAnswers
}
```

Ne pas modifier l'objet source si ce n'est pas nécessaire. Préférer produire un objet préparé.

---

## Normalisation des réponses

Fonction attendue :

```js
function normalizeAnswer(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/['’`´-]/g, " ")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}
```

À vérifier :

- `République - Beaux-Arts` -> `republique beaux arts`
- `Gare Lille-Flandres` -> `gare lille flandres`
- `C.H.U. - Eurasanté` -> `chu eurasante`
- `4 Cantons - Stade Pierre-Mauroy` -> `4 cantons stade pierre mauroy`
- `Saint-Philibert` -> `saint philibert`

La validation doit regarder :

1. la réponse canonique ;
2. les réponses acceptées ;
3. les formes normalisées.

---

## Sélection quotidienne

Fonction recommandée :

```js
function getStationMystereDateId(date = new Date()) {
  return getDailyDateId(date, {
    timeZone: DAILY_TIME_ZONE,
    rolloverHour: DAILY_ROLLOVER_HOUR,
  });
}
```

Sélection :

```js
const todayId = getStationMystereDateId();
const entry = selectDailyItem(playableEntries, todayId, { epochId: DAILY_EPOCH_ID });
```

Règles :

- si aucune entrée jouable, afficher un état d'erreur ;
- la sélection doit être stable pour un même `dateId` ;
- ne pas utiliser `Math.random` pour la station du jour ;
- prévoir `getPreviousDailyId` pour les statistiques de série.

---

## Modèle d'état de partie

État initial recommandé :

```json
{
  "version": 1,
  "appVersion": "26.06.05.1",
  "dateId": "2026-06-05",
  "entryId": "metro-rihour",
  "status": "playing",
  "score": 1000,
  "revealedHintCount": 1,
  "attempts": [],
  "penalties": [],
  "startedAt": "2026-06-05T10:05:00.000Z",
  "completedAt": null,
  "result": null,
  "statsApplied": false,
  "lastFeedback": ""
}
```

Valeurs de `status` :

- `loading`
- `playing`
- `won`
- `lost`
- `error`

Valeurs de `result` :

- `null`
- `bronze-cup`
- `bronze-medal`
- `lost`

Une partie terminée doit rester consultable au rechargement.

---

## Tentatives

Structure recommandée :

```json
{
  "answer": "Rihour",
  "normalizedAnswer": "rihour",
  "isCorrect": false,
  "penalty": 100,
  "createdAt": "2026-06-05T10:07:00.000Z"
}
```

Règles :

- ne pas enregistrer les réponses vides ;
- ne pas repénaliser une réponse déjà tentée ;
- enregistrer la forme affichée pour le calepin ;
- enregistrer la forme normalisée pour éviter les doublons.

---

## Pénalités

Structure recommandée :

```json
{
  "type": "wrong-answer",
  "points": 100,
  "createdAt": "2026-06-05T10:07:00.000Z"
}
```

Pour un indice :

```json
{
  "type": "hint",
  "hintNumber": 2,
  "points": 150,
  "createdAt": "2026-06-05T10:08:00.000Z"
}
```

Les pénalités servent au calepin et au récapitulatif.

---

## Statistiques

Structure recommandée :

```json
{
  "version": 1,
  "played": 0,
  "wins": 0,
  "losses": 0,
  "currentStreak": 0,
  "bestStreak": 0,
  "bestScore": 0,
  "totalScore": 0,
  "totalHintsUsed": 0,
  "winsByHintsUsed": {
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0
  },
  "lastPlayedDateId": null,
  "lastWinDateId": null,
  "history": []
}
```

Historique local recommandé, limité à 30 entrées :

```json
{
  "dateId": "2026-06-05",
  "entryId": "metro-rihour",
  "status": "won",
  "score": 650,
  "hintsUsed": 3,
  "wrongAnswers": 2,
  "result": "bronze-medal"
}
```

Règles :

- `played` augmente après victoire ou défaite ;
- `wins` augmente uniquement après victoire ;
- `losses` augmente uniquement après défaite ;
- `currentStreak` augmente si la victoire suit le jour joué précédent ;
- `currentStreak` passe à 0 après une défaite ;
- `bestScore` ne tient compte que des victoires ;
- `totalScore` ne tient compte que des victoires ;
- `statsApplied` dans la partie évite les doublons.

---

## Fonctions statistiques

Fonctions recommandées :

```js
function getStats() {}
function setStats(stats) {}
function applyStatsIfNeeded() {}
function buildHistoryEntry(gameState) {}
function getWinRate(stats) {}
function getAverageScore(stats) {}
function getAverageHints(stats) {}
function getPreviousDailyId(dateId) {}
```

S'inspirer de `apps/lille-mele/app.js` pour la prévention des doublons avec `lastPlayedDateId`.

S'inspirer de `apps/le-mot-a-biloute/app.js` pour l'historique et les indicateurs de performance, mais ne pas reprendre l'export/import de stats dans la v1.

---

## Résultat et récompenses

Fonction recommandée :

```js
function getReward(gameState) {
  if (gameState.status !== "won") return null;
  const wrongAnswers = gameState.attempts.filter((attempt) => !attempt.isCorrect).length;
  const paidHintsUsed = Math.max(0, gameState.revealedHintCount - 1);
  if (wrongAnswers === 0 && paidHintsUsed === 0) return "bronze-cup";
  return "bronze-medal";
}
```

Libellés :

- `bronze-cup` : Coupe de bronze ;
- `bronze-medal` : Médaille de bronze ;
- `lost` : Pas de récompense.

---

## Contrat HTML recommandé

Le placeholder actuel peut être remplacé par une structure jouable.

IDs recommandés :

```txt
#stationApp
#stationTitle
#stationSubtitle
#dailyDate
#scoreValue
#hintProgress
#rewardPreview
#mysteryPanel
#mysteryLabel
#hintList
#nextHintButton
#answerForm
#answerInput
#stationSuggestions
#validateButton
#feedback
#notebookButton
#statsButton
#helpButton
#shareButton
#resultPanel
#resultTitle
#resultSummary
#discoveryCard
#notebookDialog
#statsDialog
#helpDialog
#toast
```

Tous les boutons doivent avoir un nom accessible.

Le champ de recherche doit avoir un `label` visible ou un `aria-label` clair.

---

## Structure HTML cible

Structure simplifiée :

```html
<main class="station-game" id="stationApp">
  <section class="station-game__hero" aria-labelledby="stationTitle">
    <p class="eyebrow">Métro Mystère</p>
    <h1 id="stationTitle">Station Mystère</h1>
    <p id="stationSubtitle">Trouve la station de métro du jour.</p>
  </section>

  <section class="station-board" aria-label="Énigme du jour">
    <div class="station-status">
      <p>Date <span id="dailyDate"></span></p>
      <p>Score <span id="scoreValue">1000</span></p>
      <p>Indices <span id="hintProgress">1/5</span></p>
    </div>

    <div class="mystery-panel" id="mysteryPanel">
      <p id="mysteryLabel">Station mystère</p>
      <ol class="hint-list" id="hintList"></ol>
    </div>

    <form class="answer-form" id="answerForm">
      <label for="answerInput">Rechercher une station</label>
      <input id="answerInput" type="search" autocomplete="off" />
      <div id="stationSuggestions" role="listbox"></div>
      <button id="validateButton" type="submit">Valider</button>
    </form>

    <p id="feedback" role="status" aria-live="polite"></p>

    <div class="station-actions">
      <button id="nextHintButton" type="button">Indice suivant</button>
      <button id="notebookButton" type="button">Calepin</button>
      <button id="statsButton" type="button">Stats</button>
      <button id="helpButton" type="button">Aide</button>
    </div>
  </section>

  <section id="resultPanel" hidden></section>
</main>
```

Cette structure peut être adaptée, mais les rôles doivent rester clairs.

---

## Dialogues recommandés

Dialogues :

- `#notebookDialog`
- `#statsDialog`
- `#helpDialog`

Le résultat peut être :

- soit un panneau dans la page ;
- soit un dialogue `#resultDialog`.

Recommandation :

- utiliser un panneau résultat visible dans la page, plus robuste sur mobile ;
- réserver les dialogues au calepin, aux stats et à l'aide.

Si un `dialog` est utilisé :

- prévoir fermeture par bouton ;
- prévoir fermeture au clic extérieur si cohérent ;
- gérer le retour de focus ;
- éviter qu'un dialogue ouvert laisse le champ de réponse actif derrière.

---

## Classes CSS recommandées

Classes de layout :

```txt
.station-game
.station-game__hero
.station-board
.station-status
.mystery-panel
.mystery-panel--won
.mystery-panel--lost
.hint-list
.hint-card
.hint-card--locked
.answer-form
.suggestion-list
.suggestion-option
.station-actions
.notebook-summary
.stats-grid
.discovery-card
.result-panel
.toast
```

Règles visuelles :

- utiliser les variables `--labaj-*` existantes ;
- ne pas créer une palette entièrement nouvelle ;
- garder des bordures et surfaces cohérentes avec les autres jeux ;
- éviter les grands aplats décoratifs inutiles ;
- protéger la lisibilité du champ et des suggestions.

---

## Responsive

Mobile jusqu'à 720 px :

- une colonne ;
- panneau mystère en haut ;
- score et indice dans une ligne compacte ;
- champ de recherche large ;
- suggestions sous le champ ;
- actions en grille compacte ;
- calepin et stats en dialogue.

Desktop au-delà de 720 px :

- deux zones possibles ;
- panneau mystère à gauche ;
- calepin ou résumé à droite ;
- le champ de recherche peut rester sous le panneau principal ;
- ne pas transformer la page en tableau de bord.

Très petit mobile :

- éviter les titres trop grands ;
- limiter la hauteur des suggestions ;
- bouton Valider pleine largeur ;
- ne pas garder une action critique sous le pli si le clavier mobile est ouvert.

---

## Plan app.js recommandé

Ordre interne du fichier :

1. imports ;
2. constantes ;
3. sélection des éléments DOM ;
4. chargement initial ;
5. fonctions de boot ;
6. fonctions de données ;
7. fonctions d'état ;
8. fonctions de gameplay ;
9. fonctions de recherche ;
10. fonctions de stats ;
11. fonctions de rendu ;
12. fonctions de partage ;
13. fonctions utilitaires ;
14. hook `render_game_to_text`.

Le fichier peut rester monolithique au départ, comme les autres jeux, puis être découpé plus tard si le besoin apparaît.

---

## Éléments DOM dans app.js

Structure recommandée :

```js
const els = {
  app: document.querySelector("#stationApp"),
  dailyDate: document.querySelector("#dailyDate"),
  scoreValue: document.querySelector("#scoreValue"),
  hintProgress: document.querySelector("#hintProgress"),
  hintList: document.querySelector("#hintList"),
  nextHintButton: document.querySelector("#nextHintButton"),
  answerForm: document.querySelector("#answerForm"),
  answerInput: document.querySelector("#answerInput"),
  suggestions: document.querySelector("#stationSuggestions"),
  validateButton: document.querySelector("#validateButton"),
  feedback: document.querySelector("#feedback"),
  notebookButton: document.querySelector("#notebookButton"),
  statsButton: document.querySelector("#statsButton"),
  helpButton: document.querySelector("#helpButton"),
  shareButton: document.querySelector("#shareButton"),
  resultPanel: document.querySelector("#resultPanel"),
  discoveryCard: document.querySelector("#discoveryCard"),
  notebookDialog: document.querySelector("#notebookDialog"),
  statsDialog: document.querySelector("#statsDialog"),
  helpDialog: document.querySelector("#helpDialog"),
  toast: document.querySelector("#toast"),
};
```

Ne pas supposer qu'un élément existe sans vérifier pendant le développement. Une erreur DOM doit être visible en test.

---

## Boot recommandé

Pseudo-code :

```js
let entries = [];
let playableEntries = [];
let todayId = "";
let todayEntry = null;
let state = null;
let selectedSuggestionId = null;

await init();

async function init() {
  try {
    entries = await fetchJson(CORPUS_URL);
    playableEntries = getPlayableEntries(entries);
    todayId = getStationMystereDateId();
    todayEntry = selectDailyItem(playableEntries, todayId, { epochId: DAILY_EPOCH_ID });
    state = loadGame() || createInitialState(todayEntry, todayId);
    state = hydrateState(state, todayEntry, todayId);
    bindEvents();
    render();
    maybeShowFirstHelp();
  } catch (error) {
    renderLoadError(error);
  }
}
```

---

## Chargement et hydratation

Fonctions recommandées :

```js
function createInitialState(entry, dateId) {}
function loadGame() {}
function hydrateState(saved, entry, dateId) {}
function isStateCompatible(saved, entry, dateId) {}
function saveGame() {}
```

Compatibilité :

- même `dateId` ;
- même `entryId` ;
- version acceptable ;
- score numérique ;
- `revealedHintCount` entre 1 et 5 ;
- `attempts` tableau ;
- `status` connu.

Si l'état stocké est incompatible, créer une nouvelle partie.

---

## Événements

Événements à brancher :

```js
els.answerForm.addEventListener("submit", submitAnswer);
els.answerInput.addEventListener("input", updateSuggestions);
els.answerInput.addEventListener("keydown", handleAnswerKeydown);
els.nextHintButton.addEventListener("click", revealNextHint);
els.notebookButton.addEventListener("click", openNotebook);
els.statsButton.addEventListener("click", openStats);
els.helpButton.addEventListener("click", openHelp);
els.shareButton?.addEventListener("click", shareResult);
document.addEventListener("click", handleOutsideSuggestionClick);
```

Touches à gérer dans la recherche :

- flèche bas : suggestion suivante ;
- flèche haut : suggestion précédente ;
- Entrée : valider la suggestion active ou le champ ;
- Échap : fermer les suggestions.

Le clavier ne doit pas empêcher l'utilisation simple du formulaire.

---

## Recherche de suggestions

Fonctions recommandées :

```js
function updateSuggestions() {}
function getSuggestions(query) {}
function renderSuggestions(suggestions) {}
function selectSuggestion(entryId) {}
function clearSuggestions() {}
function handleAnswerKeydown(event) {}
```

Algorithme :

1. normaliser la requête ;
2. si moins de 2 caractères, masquer les suggestions ;
3. chercher dans réponse canonique et réponses acceptées ;
4. prioriser les réponses qui commencent par la requête ;
5. ensuite les réponses qui contiennent la requête ;
6. limiter à 6 résultats ;
7. afficher le nom canonique.

Ne pas révéler d'indices supplémentaires dans les suggestions.

---

## Validation de réponse

Fonctions recommandées :

```js
function submitAnswer(event) {}
function getSubmittedAnswer() {}
function findMatchingAnswer(answer) {}
function isCorrectAnswer(answer) {}
function hasAlreadyAttempted(normalizedAnswer) {}
function recordAttempt(answer, isCorrect) {}
```

Pseudo-code :

```js
function submitAnswer(event) {
  event.preventDefault();
  if (!isGameActive()) return;

  const answer = getSubmittedAnswer();
  const normalized = normalizeAnswer(answer);

  if (!normalized) {
    showFeedback("Saisis ou sélectionne une station avant de valider.", "neutral");
    return;
  }

  if (hasAlreadyAttempted(normalized)) {
    showFeedback("Tu as déjà essayé cette station.", "neutral");
    return;
  }

  if (isCorrectAnswer(normalized)) {
    recordAttempt(answer, true);
    finishGame("won");
    return;
  }

  recordAttempt(answer, false);
  applyPenalty("wrong-answer", WRONG_ANSWER_PENALTY);
  if (state.score === 0) finishGame("lost");
  render();
}
```

---

## Indices

Fonctions recommandées :

```js
function getVisibleHints() {}
function getNextHint() {}
function getNextHintCost() {}
function canRevealNextHint() {}
function revealNextHint() {}
```

Pseudo-code :

```js
function revealNextHint() {
  if (!isGameActive()) return;
  if (!canRevealNextHint()) return;

  const nextHintNumber = state.revealedHintCount + 1;
  const cost = HINT_COSTS[nextHintNumber - 1] || 0;

  state.revealedHintCount = nextHintNumber;
  applyPenalty("hint", cost, { hintNumber: nextHintNumber });

  if (state.score === 0) finishGame("lost");
  saveGame();
  render();
}
```

Attention :

- si le joueur révèle un indice qui met le score à 0, l'indice doit rester visible dans le récapitulatif ;
- si les 5 indices sont déjà visibles, désactiver le bouton d'indice ;
- le bouton doit afficher le coût du prochain indice.

---

## Score

Fonction recommandée :

```js
function applyPenalty(type, points, extra = {}) {
  const normalizedPoints = Math.max(0, Number(points) || 0);
  state.score = Math.max(0, state.score - normalizedPoints);
  state.penalties.push({
    type,
    points: normalizedPoints,
    createdAt: new Date().toISOString(),
    ...extra,
  });
}
```

Ne pas recalculer le score uniquement depuis les tableaux à chaque rendu. Le score courant dans `state` est la source de vérité.

Les tableaux `attempts` et `penalties` servent au calepin, aux stats et au debug.

---

## Fin de partie

Fonctions recommandées :

```js
function finishGame(status) {}
function isGameActive() {}
function getFinalResult() {}
function applyStatsIfNeeded() {}
```

Pseudo-code :

```js
function finishGame(status) {
  state.status = status;
  state.completedAt = new Date().toISOString();
  state.result = status === "won" ? getReward(state) : "lost";
  applyStatsIfNeeded();
  saveGame();
  render();
}
```

Règles :

- après fin de partie, désactiver le champ et le bouton Valider ;
- masquer ou désactiver le bouton d'indice ;
- afficher la fiche découverte ;
- afficher le partage ;
- permettre de consulter calepin et stats.

---

## Calepin

Fonctions recommandées :

```js
function openNotebook() {}
function closeNotebook() {}
function renderNotebook() {}
function renderNotebookHints() {}
function renderNotebookAttempts() {}
function renderNotebookPenalties() {}
```

Contenu pendant la partie :

- score ;
- indices révélés ;
- coût du prochain indice ;
- tentatives ;
- pénalités.

Contenu après la partie :

- résultat ;
- score final ;
- bonne réponse ;
- fiche découverte ;
- tentatives ;
- indices utilisés.

Sur desktop, le calepin peut être visible en colonne. Sur mobile, le dialogue est préférable.

---

## Fiche découverte

Fonctions recommandées :

```js
function renderDiscoveryCard(entry) {}
function getDiscoveryFacts(entry) {}
function getDiscoverySourceLabels(entry) {}
```

Contenu :

- titre ;
- texte ;
- faits si disponibles ;
- éventuellement sources sous forme discrète.

Règle :

- la fiche découverte apparaît après victoire ou défaite ;
- elle ne doit pas apparaître avant la fin ;
- elle peut être visible dans le panneau résultat et dans le calepin.

---

## Partage

Fonctions recommandées :

```js
function buildShareText(gameState = state) {}
async function shareResult() {}
function showShareFeedback(status) {}
```

Format recommandé :

```txt
Station Mystère #2026-06-05
Métro : trouvé en 3 indices
Score : 650
Médaille de bronze
```

Défaite :

```txt
Station Mystère #2026-06-05
Métro : perdu
Score : 0
```

Ne jamais inclure :

- nom de la station ;
- indices ;
- fiche découverte ;
- ligne M1 ou M2 si elle révèle trop.

Utiliser `shareTextWithFallback`.

---

## Aide

Fonctions recommandées :

```js
function shouldShowFirstHelp() {}
function maybeShowFirstHelp() {}
function openHelp() {}
function closeHelp() {}
function markFirstHelpSeen() {}
```

S'inspirer de Lille-Mêle :

- aide visible au premier lancement ;
- bouton Jouer ;
- mémorisation via `firstHelpSeen`.

Si le premier affichage semble trop intrusif, ne pas ouvrir automatiquement la modale. À la place, afficher un petit encart d'aide dismissible. Le choix final peut être fait au développement, mais le jeu doit rester compréhensible.

---

## Messages de feedback

Messages recommandés :

```js
const FEEDBACK_MESSAGES = {
  emptyAnswer: "Saisis ou sélectionne une station avant de valider.",
  wrongAnswer: "Ce n'est pas cette station. -100 points.",
  duplicateAnswer: "Tu as déjà essayé cette station.",
  hintRevealed: "Nouvel indice débloqué.",
  winPerfect: "Sans faute. Coupe de bronze.",
  winAssisted: "Station trouvée. Médaille de bronze.",
  lost: "Score à 0. La station mystère se révèle.",
  loadError: "Impossible de charger l'énigme du jour.",
  shared: "Résultat partagé.",
  copied: "Résultat copié.",
};
```

Le feedback doit être rendu dans une zone `aria-live`.

---

## Rendu

Fonction principale :

```js
function render() {
  renderStatus();
  renderHints();
  renderAnswerForm();
  renderActions();
  renderFeedback();
  renderResult();
  renderNotebook();
  renderStats();
}
```

Règles :

- une fonction de rendu ne doit pas modifier le gameplay ;
- une action utilisateur modifie l'état puis appelle `saveGame` et `render` ;
- éviter les rendus partiels trop subtils en v1 ;
- préférer un rendu simple et fiable.

---

## Hook de test render_game_to_text

Tous les jeux existants exposent un hook de debug/test. Station Mystère doit faire pareil.

À ajouter :

```js
window.render_game_to_text = () =>
  JSON.stringify({
    app: "station-mystere",
    version: APP_VERSION,
    dateId: todayId,
    entry: {
      id: todayEntry?.id,
      niveau: todayEntry?.niveau,
      reponse: todayEntry?.reponse,
    },
    status: state?.status,
    score: state?.score,
    revealedHintCount: state?.revealedHintCount,
    attempts: state?.attempts,
    result: state?.result,
    statsApplied: state?.statsApplied,
    dailyRollover: {
      hour: DAILY_ROLLOVER_HOUR,
      timeZone: DAILY_TIME_ZONE,
    },
  });
```

Ce hook peut inclure la réponse, car il sert aux tests automatisés, pas au joueur.

---

## Mise à jour du smoke test

Le test actuel vérifie seulement la page placeholder.

À remplacer par des vérifications jouables :

1. aller sur `apps/station-mystere/` ;
2. attendre `window.render_game_to_text` ;
3. vérifier le titre ;
4. vérifier que le score vaut 1000 ;
5. vérifier que l'indice 1 est visible ;
6. vérifier que le champ de recherche existe ;
7. vérifier que les suggestions apparaissent après 2 caractères ;
8. faire une mauvaise réponse ;
9. vérifier que le score baisse à 900 ;
10. révéler un indice ;
11. vérifier que le score baisse selon le coût ;
12. saisir la bonne réponse depuis le hook ;
13. vérifier victoire et fiche découverte ;
14. recharger ;
15. vérifier que la partie reste terminée ;
16. vérifier que les stats ne doublent pas.

Extrait de logique possible :

```js
await page.goto(`${base}apps/station-mystere/`);
await page.waitForFunction(() => typeof window.render_game_to_text === "function");
const initial = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
expect(initial.score).toBe(1000);
await expect(page.getByRole("textbox", { name: /Rechercher une station/ })).toBeVisible();
```

---

## Tests manuels indispensables

Scénario 1 : victoire parfaite

- ouvrir la page ;
- lire le premier indice ;
- saisir la bonne station ;
- valider ;
- vérifier coupe de bronze ;
- vérifier score 1000 ;
- vérifier fiche découverte ;
- vérifier partage sans spoiler.

Scénario 2 : victoire avec erreur

- saisir une mauvaise station ;
- vérifier -100 ;
- saisir la bonne station ;
- vérifier médaille de bronze ;
- vérifier stats.

Scénario 3 : victoire avec indices

- demander indice 2 ;
- vérifier -150 ;
- demander indice 3 ;
- vérifier -200 ;
- saisir la bonne station ;
- vérifier score 650 ;
- vérifier calepin.

Scénario 4 : défaite

- enchaîner erreurs et indices jusqu'à 0 ;
- vérifier réponse révélée ;
- vérifier fiche découverte ;
- vérifier champ désactivé ;
- vérifier stats défaite.

Scénario 5 : reprise

- commencer une partie ;
- faire une erreur ;
- recharger ;
- vérifier que score et tentatives sont conservés.

Scénario 6 : partie terminée

- gagner ;
- recharger ;
- vérifier que la victoire reste visible ;
- vérifier que les stats ne changent pas.

Scénario 7 : mobile

- tester largeur 390 px ;
- ouvrir le clavier ;
- vérifier que le champ, les suggestions et Valider restent utilisables ;
- ouvrir calepin et stats.

---

## Accessibilité à vérifier

- le champ de recherche a un label ;
- les suggestions ont un rôle compréhensible ;
- le bouton Valider est accessible au clavier ;
- les touches fléchées permettent de parcourir les suggestions ;
- Échap ferme les suggestions ;
- le feedback est annoncé via `aria-live` ;
- les dialogues ont un titre ;
- le focus revient au bon bouton après fermeture ;
- les états désactivés utilisent `disabled` quand pertinent ;
- la couleur seule ne porte pas l'information ;
- le contraste reste suffisant.

---

## Performance et robustesse

Points de vigilance :

- le corpus éditorial est petit, aucun besoin d'optimisation lourde ;
- les suggestions peuvent être recalculées à chaque saisie ;
- éviter les timers inutiles ;
- ne pas stocker tout le corpus dans LocalStorage ;
- ne pas écrire dans LocalStorage à chaque frappe, seulement après action de jeu ;
- gérer l'échec de chargement avec un état lisible ;
- ne pas bloquer la page si le corpus contient une entrée invalide.

---

## Sécurité éditoriale

Le joueur ne doit pas voir avant la fin :

- la réponse ;
- la fiche découverte ;
- les sources ;
- les faits trop explicites.

Mais le hook `render_game_to_text` peut exposer la réponse pour les tests.

Les textes affichés depuis le corpus doivent être rendus proprement :

- `textContent` si possible ;
- `escapeHtml` si `innerHTML` est utilisé ;
- jamais de HTML arbitraire venant du corpus.

---

## Adaptation de la page placeholder

Le placeholder actuel annonce 4 niveaux.

Pendant la v1 jouable :

- le contenu principal doit devenir le jeu métro ;
- la mention des futurs niveaux peut rester discrète dans l'aide ou sous le jeu ;
- éviter de promettre 4 niveaux jouables tant qu'ils ne sont pas intégrés ;
- la meta description peut rester large ou être ajustée pour préciser que la v1 démarre par le métro.

Recommandation :

- H1 : Station Mystère ;
- sous-titre : Trouve la station de métro du jour ;
- mention secondaire : Tramway, V'Lille et Bus arriveront plus tard.

---

## Mise à jour de check-static-pages

Quand `app.js` est ajouté et référencé dans `index.html`, `check-static-pages` vérifiera automatiquement le fichier si le `src` est relatif.

À vérifier :

- `apps/station-mystere/app.js` existe ;
- `fetchJson("../../packages/corpus/station-mystere/editorial-entries.json")` est pris en compte uniquement si `validateFetches` inclut `apps/station-mystere/app.js`.

Modification probable :

```js
await validateFetches("apps/station-mystere/app.js");
```

dans `scripts/check-static-pages.mjs`.

---

## Ordre recommandé des commits de développement

Commit 1 :

- transformer le placeholder en structure jouable ;
- ajouter `app.js` minimal ;
- charger le corpus ;
- afficher station du jour masquée et premier indice.

Commit 2 :

- ajouter recherche ;
- suggestions ;
- validation ;
- mauvaise réponse ;
- victoire.

Commit 3 :

- ajouter indices payants ;
- score ;
- défaite ;
- fiche découverte.

Commit 4 :

- ajouter sauvegarde ;
- reprise ;
- stats ;
- partage.

Commit 5 :

- ajouter calepin ;
- aide ;
- polish responsive ;
- accessibilité.

Commit 6 :

- compléter les tests ;
- QA desktop/mobile ;
- corrections finales.

Si le crédit Codex est limité, faire au minimum les commits 1 à 3 pour obtenir une boucle jouable.

---

## Ordre de développement en une seule session

Si une seule session doit produire une v1 complète :

1. créer la structure HTML ;
2. créer `app.js` avec chargement corpus ;
3. afficher état initial ;
4. ajouter recherche et validation ;
5. ajouter score et indices ;
6. ajouter fin de partie ;
7. ajouter sauvegarde ;
8. ajouter stats ;
9. ajouter partage ;
10. ajouter calepin ;
11. brancher `render_game_to_text` ;
12. mettre à jour smoke test ;
13. lancer `npm run check` ;
14. lancer `npm run test:browser` ;
15. corriger les problèmes mobile et accessibilité.

---

## Risques principaux

Risque : interface trop lourde.

Réponse :

- garder le panneau mystère comme centre ;
- mettre calepin et stats dans des surfaces secondaires ;
- ne pas tout afficher en même temps.

Risque : suggestions trop faciles.

Réponse :

- pas de liste quand champ vide ;
- 2 caractères minimum ;
- 6 suggestions maximum.

Risque : stats doublées.

Réponse :

- `statsApplied` dans l'état ;
- `lastPlayedDateId` dans les stats ;
- test après rechargement.

Risque : corpus incomplet ou entrée invalide.

Réponse :

- filtrer les entrées non jouables ;
- état d'erreur si aucune entrée ;
- ne pas casser toute l'app pour une entrée imparfaite.

Risque : page mobile difficile avec clavier ouvert.

Réponse :

- champ proche du bouton ;
- suggestions courtes ;
- actions secondaires plus bas ou en dialogue.

---

## Définition de terminé

La v1 est prête quand :

- le jeu charge sans erreur ;
- une station métro du jour est sélectionnée ;
- le premier indice est visible ;
- la recherche fonctionne ;
- les réponses acceptées sont reconnues ;
- les mauvaises réponses pénalisent ;
- les indices payants pénalisent ;
- la victoire fonctionne ;
- la défaite fonctionne ;
- la fiche découverte s'affiche dans les deux cas ;
- la partie se sauvegarde ;
- les stats se mettent à jour une seule fois ;
- le partage ne spoile pas ;
- le calepin est utile ;
- l'aide existe ;
- mobile et desktop sont lisibles ;
- `npm run check` passe ;
- `npm run test:browser` passe.

---

## Prompt conseillé pour la prochaine session Codex

Quand les crédits seront renouvelés, message recommandé :

```txt
On lance le développement de Station Mystère v1 Métro. Lis d'abord apps/station-mystere/game-design.md et apps/station-mystere/implementation-plan.md, puis implémente la v1 en suivant le plan. Réutilise les composants existants du portail et de Le Mot à Biloute. Ne développe que le métro pour l'instant. Lance npm run check et npm run test:browser à la fin.
```

Ce prompt donne le bon périmètre et évite de repartir dans l'analyse.
