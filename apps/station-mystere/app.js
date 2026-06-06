import { getDailyDateId, getRelativeDateId, selectDailyItem } from "../../packages/game-utils/daily.js";
import { fetchJson } from "../../packages/game-utils/fetch-json.js";
import { shareText as shareTextWithFallback } from "../../packages/game-utils/share.js";
import { readJson, writeJson } from "../../packages/game-utils/storage.js";
import { escapeHtml } from "../../packages/game-utils/text-render.js";

const APP_VERSION = "26.06.06.2";
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

const STORAGE_KEYS = {
  currentGame: `${STORAGE_PREFIX}currentGame`,
  stats: `${STORAGE_PREFIX}stats`,
  firstHelpSeen: `${STORAGE_PREFIX}firstHelpSeen`,
};

const DEFAULT_STATS = {
  version: 1,
  played: 0,
  wins: 0,
  losses: 0,
  currentStreak: 0,
  bestStreak: 0,
  bestScore: 0,
  totalScore: 0,
  totalHintsUsed: 0,
  winsByHintsUsed: {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  },
  lastPlayedDateId: null,
  lastWinDateId: null,
  history: [],
};

const FEEDBACK_TONES = new Set(["success", "danger", "neutral"]);

const els = {
  app: document.querySelector("#stationApp"),
  dailyDate: document.querySelector("#dailyDate"),
  scoreValue: document.querySelector("#scoreValue"),
  streakValue: document.querySelector("#streakValue"),
  hintProgress: document.querySelector("#hintProgress"),
  mysteryPanel: document.querySelector("#mysteryPanel"),
  mysteryEyebrow: document.querySelector("#mysteryEyebrow"),
  mysteryLabel: document.querySelector("#mysteryLabel"),
  mysteryStatus: document.querySelector("#mysteryStatus"),
  nextHintButton: document.querySelector("#nextHintButton"),
  hintDialog: document.querySelector("#hintDialog"),
  hintTitle: document.querySelector("#hintTitle"),
  hintDialogContent: document.querySelector("#hintDialogContent"),
  hintCostText: document.querySelector("#hintCostText"),
  revealHintButton: document.querySelector("#revealHintButton"),
  answerForm: document.querySelector("#answerForm"),
  answerInput: document.querySelector("#answerInput"),
  suggestions: document.querySelector("#stationSuggestions"),
  validateButton: document.querySelector("#validateButton"),
  feedback: document.querySelector("#feedback"),
  notebookButton: document.querySelector("#notebookButton"),
  notebookActionButton: document.querySelector("#notebookActionButton"),
  notebookPreview: document.querySelector("#notebookPreview"),
  statsButton: document.querySelector("#statsButton"),
  resultStatsButton: document.querySelector("#resultStatsButton"),
  helpButton: document.querySelector("#helpButton"),
  shareButton: document.querySelector("#shareButton"),
  resultPanel: document.querySelector("#resultPanel"),
  resultKicker: document.querySelector("#resultKicker"),
  resultTitle: document.querySelector("#resultTitle"),
  resultSummary: document.querySelector("#resultSummary"),
  discoveryCard: document.querySelector("#discoveryCard"),
  notebookDialog: document.querySelector("#notebookDialog"),
  notebookContent: document.querySelector("#notebookContent"),
  statsDialog: document.querySelector("#statsDialog"),
  statsContent: document.querySelector("#statsContent"),
  helpDialog: document.querySelector("#helpDialog"),
  helpStartButton: document.querySelector("#helpStartButton"),
  toast: document.querySelector("#toast"),
};

let playableEntries = [];
let todayId = "";
let previousDailyId = "";
let todayEntry = null;
let state = null;
let currentSuggestions = [];
let activeSuggestionIndex = -1;
let toastTimer = 0;

init();

async function init() {
  exposeDebugHooks();

  try {
    const payload = await fetchJson(CORPUS_URL);
    playableEntries = getPlayableEntries(payload);
    todayId = getStationMystereDateId();
    previousDailyId = getPreviousDateId(todayId);
    todayEntry = selectDailyItem(playableEntries, todayId, { epochId: DAILY_EPOCH_ID });
    state = hydrateState(loadGame(), todayEntry, todayId);
    bindEvents();
    render();
    showLaunchHelp();
  } catch (error) {
    state = createErrorState(error);
    bindEvents();
    render();
  }
}

function bindEvents() {
  els.answerForm?.addEventListener("submit", submitAnswer);
  els.answerInput?.addEventListener("input", updateSuggestions);
  els.answerInput?.addEventListener("keydown", handleAnswerKeydown);
  els.suggestions?.addEventListener("click", handleSuggestionClick);
  els.nextHintButton?.addEventListener("click", openHintDialog);
  els.revealHintButton?.addEventListener("click", () => revealNextHint({ openDialogAfter: true }));
  els.notebookButton?.addEventListener("click", () => openDialog(els.notebookDialog));
  els.notebookActionButton?.addEventListener("click", () => openDialog(els.notebookDialog));
  els.statsButton?.addEventListener("click", () => openDialog(els.statsDialog));
  els.resultStatsButton?.addEventListener("click", () => openDialog(els.statsDialog));
  els.helpButton?.addEventListener("click", () => {
    writeJson(STORAGE_KEYS.firstHelpSeen, true);
    openDialog(els.helpDialog);
  });
  els.helpStartButton?.addEventListener("click", closeHelpDialog);
  els.shareButton?.addEventListener("click", shareResult);
  document.addEventListener("click", handleOutsideSuggestionClick);
}

function getPlayableEntries(payload) {
  const entries = Array.isArray(payload) ? payload : payload?.entries;
  if (!Array.isArray(entries)) throw new Error("Corpus Station Mystère invalide.");

  const playable = entries.filter(isEntryPlayable).map(prepareEntry);
  if (!playable.length) throw new Error("Aucune fiche métro jouable.");
  return playable;
}

function isEntryPlayable(entry) {
  return (
    entry?.niveau === GAME_MODE &&
    entry?.typeReponse === "station" &&
    typeof entry?.id === "string" &&
    typeof entry?.reponse === "string" &&
    Array.isArray(entry?.indices) &&
    entry.indices.length >= TOTAL_HINTS &&
    Boolean(entry?.ficheDecouverte?.titre) &&
    Boolean(entry?.ficheDecouverte?.texte)
  );
}

function prepareEntry(entry) {
  const sortedHints = [...entry.indices]
    .sort((a, b) => Number(a.ordre) - Number(b.ordre))
    .slice(0, TOTAL_HINTS);
  const acceptedAnswers = getAcceptedAnswers(entry);
  const normalizedAcceptedAnswers = acceptedAnswers.map(normalizeAnswer).filter(Boolean);

  return {
    ...entry,
    sortedHints,
    acceptedAnswers,
    normalizedAnswer: normalizeAnswer(entry.reponse),
    normalizedAcceptedAnswers,
  };
}

function getAcceptedAnswers(entry) {
  return [...new Set([entry.reponse, ...(entry.reponsesAcceptees || [])].filter(Boolean))];
}

function getStationMystereDateId(date = new Date()) {
  return getDailyDateId(date, {
    timeZone: DAILY_TIME_ZONE,
    rolloverHour: DAILY_ROLLOVER_HOUR,
  });
}

function getPreviousDateId(dateId) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateId)) {
    return getRelativeDateId(-1, new Date(), { timeZone: DAILY_TIME_ZONE });
  }
  return getRelativeDateId(-1, new Date(`${dateId}T12:00:00Z`), { timeZone: DAILY_TIME_ZONE });
}

function createInitialState(entry, dateId) {
  return {
    version: 1,
    appVersion: APP_VERSION,
    dateId,
    entryId: entry.id,
    status: "playing",
    score: BASE_SCORE,
    revealedHintCount: 0,
    attempts: [],
    penalties: [],
    startedAt: new Date().toISOString(),
    completedAt: null,
    result: null,
    statsApplied: false,
    lastFeedback: "Demande un premier indice gratuit pour commencer l'enquête.",
    feedbackTone: "neutral",
  };
}

function createErrorState(error) {
  return {
    version: 1,
    appVersion: APP_VERSION,
    dateId: todayId || getStationMystereDateId(),
    entryId: null,
    status: "error",
    score: 0,
    revealedHintCount: 0,
    attempts: [],
    penalties: [],
    startedAt: new Date().toISOString(),
    completedAt: null,
    result: null,
    statsApplied: false,
    lastFeedback: error?.message || "Impossible de charger l'énigme du jour.",
    feedbackTone: "danger",
  };
}

function hydrateState(saved, entry, dateId) {
  if (!isStateCompatible(saved, entry, dateId)) return createInitialState(entry, dateId);

  const initial = createInitialState(entry, dateId);
  const hydrated = {
    ...initial,
    ...saved,
    score: clampScore(saved.score),
    revealedHintCount: clampHintCount(saved.revealedHintCount),
    attempts: Array.isArray(saved.attempts) ? saved.attempts.filter(Boolean) : [],
    penalties: Array.isArray(saved.penalties) ? saved.penalties.filter(Boolean) : [],
    feedbackTone: FEEDBACK_TONES.has(saved.feedbackTone) ? saved.feedbackTone : "neutral",
  };

  if (!["playing", "won", "lost"].includes(hydrated.status)) hydrated.status = "playing";
  if (hydrated.status !== "playing" && !hydrated.completedAt) hydrated.completedAt = new Date().toISOString();
  return hydrated;
}

function isStateCompatible(saved, entry, dateId) {
  return (
    saved &&
    typeof saved === "object" &&
    saved.version === 1 &&
    saved.dateId === dateId &&
    saved.entryId === entry.id
  );
}

function loadGame() {
  return readJson(STORAGE_KEYS.currentGame, null);
}

function saveGame() {
  if (state?.status !== "error") writeJson(STORAGE_KEYS.currentGame, state);
}

function submitAnswer(event) {
  event.preventDefault();
  if (!isGameActive()) return;

  const answer = els.answerInput.value;
  const normalizedAnswer = normalizeAnswer(answer);

  if (!normalizedAnswer) {
    showFeedback("Saisis ou sélectionne une station avant de valider.", "neutral");
    render();
    return;
  }

  if (hasAlreadyAttempted(normalizedAnswer)) {
    showFeedback("Tu as déjà essayé cette station.", "neutral");
    render();
    return;
  }

  clearSuggestions();

  if (isCorrectAnswer(normalizedAnswer)) {
    recordAttempt(answer, normalizedAnswer, true, 0);
    finishGame("won");
    return;
  }

  recordAttempt(answer, normalizedAnswer, false, WRONG_ANSWER_PENALTY);
  applyPenalty("wrong-answer", WRONG_ANSWER_PENALTY);

  if (state.score === 0) {
    finishGame("lost");
    return;
  }

  showFeedback("Ce n'est pas cette station. -100 points.", "danger");
  saveGame();
  render();
}

function recordAttempt(answer, normalizedAnswer, isCorrect, penalty) {
  state.attempts.push({
    answer: answer.trim(),
    normalizedAnswer,
    isCorrect,
    penalty,
    createdAt: new Date().toISOString(),
  });
}

function hasAlreadyAttempted(normalizedAnswer) {
  return state.attempts.some((attempt) => attempt.normalizedAnswer === normalizedAnswer);
}

function isCorrectAnswer(normalizedAnswer) {
  return todayEntry.normalizedAcceptedAnswers.includes(normalizedAnswer);
}

function revealNextHint({ openDialogAfter = false } = {}) {
  if (!isGameActive() || !canRevealNextHint()) return;

  const nextHintNumber = state.revealedHintCount + 1;
  const cost = getNextHintCost();
  state.revealedHintCount = nextHintNumber;
  if (cost > 0) applyPenalty("hint", cost, { hintNumber: nextHintNumber });

  if (state.score === 0) {
    finishGame("lost");
    return;
  }

  showFeedback(
    cost > 0 ? `Indice ${nextHintNumber} débloqué. -${cost} points.` : "Premier indice débloqué gratuitement.",
    "neutral"
  );
  saveGame();
  render();
  if (openDialogAfter) openDialog(els.hintDialog);
}

function canRevealNextHint() {
  return Boolean(todayEntry) && state.revealedHintCount < Math.min(todayEntry.sortedHints.length, TOTAL_HINTS);
}

function getNextHintCost() {
  return HINT_COSTS[state.revealedHintCount] || 0;
}

function openHintDialog() {
  if (!todayEntry || state?.status === "error") return;
  if (isGameActive() && state.revealedHintCount === 0) {
    revealNextHint({ openDialogAfter: true });
    return;
  }
  openDialog(els.hintDialog);
}

function applyPenalty(type, points, extra = {}) {
  const normalizedPoints = Math.max(0, Number(points) || 0);
  state.score = clampScore(state.score - normalizedPoints);
  state.penalties.push({
    type,
    points: normalizedPoints,
    createdAt: new Date().toISOString(),
    ...extra,
  });
}

function finishGame(status) {
  if (!["won", "lost"].includes(status)) return;
  state.status = status;
  if (status === "lost") state.score = 0;
  state.completedAt = state.completedAt || new Date().toISOString();
  state.result = status === "won" ? getReward() : "lost";
  showFeedback(
    status === "won" ? getRewardMessage(state.result) : "Score à 0. La station mystère se révèle.",
    status === "won" ? "success" : "danger"
  );
  applyStatsIfNeeded();
  saveGame();
  render();
  els.resultPanel?.scrollIntoView({ block: "start" });
}

function getReward() {
  const wrongAnswers = state.attempts.filter((attempt) => !attempt.isCorrect).length;
  const paidHintsUsed = Math.max(0, state.revealedHintCount - 1);
  if (wrongAnswers === 0 && paidHintsUsed === 0) return "bronze-cup";
  return "bronze-medal";
}

function getRewardMessage(reward) {
  return reward === "bronze-cup" ? "Sans faute. Coupe de bronze." : "Station trouvée. Médaille de bronze.";
}

function isGameActive() {
  return state?.status === "playing";
}

function updateSuggestions() {
  if (!isGameActive()) {
    clearSuggestions();
    return;
  }

  const query = els.answerInput.value;
  currentSuggestions = getSuggestions(query);
  activeSuggestionIndex = currentSuggestions.length ? 0 : -1;
  renderSuggestions();
}

function getSuggestions(query) {
  const normalizedQuery = normalizeAnswer(query);
  if (normalizedQuery.length < MIN_SUGGESTION_CHARS) return [];

  return playableEntries
    .map((entry) => {
      const labels = entry.acceptedAnswers.map((label) => ({
        label,
        normalized: normalizeAnswer(label),
      }));
      const starts = labels.some((item) => item.normalized.startsWith(normalizedQuery));
      const contains = labels.some((item) => item.normalized.includes(normalizedQuery));
      if (!starts && !contains) return null;
      return {
        entry,
        rank: starts ? 0 : 1,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank || a.entry.reponse.localeCompare(b.entry.reponse, "fr"))
    .slice(0, MAX_SUGGESTIONS)
    .map((item) => item.entry);
}

function renderSuggestions() {
  if (!els.suggestions || !els.answerInput) return;

  if (!currentSuggestions.length) {
    els.suggestions.hidden = true;
    els.suggestions.innerHTML = "";
    els.answerInput.setAttribute("aria-expanded", "false");
    return;
  }

  els.suggestions.hidden = false;
  els.answerInput.setAttribute("aria-expanded", "true");
  els.suggestions.innerHTML = currentSuggestions
    .map(
      (entry, index) => `
        <button
          class="suggestion-option"
          type="button"
          role="option"
          data-suggestion-id="${escapeHtml(entry.id)}"
          aria-selected="${index === activeSuggestionIndex ? "true" : "false"}"
        >${escapeHtml(entry.reponse)}</button>
      `
    )
    .join("");
}

function handleSuggestionClick(event) {
  const button = event.target.closest("[data-suggestion-id]");
  if (!button) return;
  selectSuggestion(button.dataset.suggestionId);
}

function handleAnswerKeydown(event) {
  if (els.suggestions.hidden || !currentSuggestions.length) return;

  if (event.key === "ArrowDown") {
    event.preventDefault();
    activeSuggestionIndex = (activeSuggestionIndex + 1) % currentSuggestions.length;
    renderSuggestions();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    activeSuggestionIndex =
      (activeSuggestionIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
    renderSuggestions();
  } else if (event.key === "Enter" && activeSuggestionIndex >= 0) {
    event.preventDefault();
    selectSuggestion(currentSuggestions[activeSuggestionIndex].id);
  } else if (event.key === "Escape") {
    clearSuggestions();
  }
}

function handleOutsideSuggestionClick(event) {
  if (!els.answerForm?.contains(event.target)) clearSuggestions();
}

function selectSuggestion(entryId) {
  const entry = playableEntries.find((candidate) => candidate.id === entryId);
  if (!entry) return;
  els.answerInput.value = entry.reponse;
  clearSuggestions();
  els.answerInput.focus();
}

function clearSuggestions() {
  currentSuggestions = [];
  activeSuggestionIndex = -1;
  renderSuggestions();
}

function render() {
  renderStatus();
  renderHintDialog();
  renderAnswerForm();
  renderActions();
  renderFeedback();
  renderNotebookPreview();
  renderResult();
  renderNotebook();
  renderStats();
}

function renderStatus() {
  const stats = getStats();
  if (els.dailyDate) els.dailyDate.textContent = formatDateLabel(todayId || state?.dateId);
  if (els.scoreValue) els.scoreValue.textContent = String(state?.score ?? 0);
  if (els.streakValue) els.streakValue.textContent = String(stats.currentStreak || 0);
  if (els.hintProgress) {
    const visibleHints = state?.revealedHintCount || 0;
    els.hintProgress.textContent = `${visibleHints}/${TOTAL_HINTS}`;
  }

  if (els.mysteryPanel) {
    els.mysteryPanel.classList.toggle("mystery-panel--won", state?.status === "won");
    els.mysteryPanel.classList.toggle("mystery-panel--lost", state?.status === "lost");
  }

  if (els.mysteryLabel) {
    els.mysteryLabel.textContent =
      state?.status === "won" || state?.status === "lost"
        ? todayEntry?.reponse || "Station révélée"
        : "Nom de station masqué";
  }

  if (els.mysteryEyebrow) {
    els.mysteryEyebrow.textContent =
      state?.status === "won" || state?.status === "lost" ? "Station révélée" : "Station inconnue";
  }

  if (els.mysteryStatus) {
    els.mysteryStatus.textContent = getStatusLabel();
  }
}

function renderHintDialog() {
  if (!els.hintDialogContent) return;
  if (!todayEntry || !state) {
    els.hintDialogContent.innerHTML = "";
    return;
  }

  const visibleHints = todayEntry.sortedHints.slice(0, state.revealedHintCount);
  const canReveal = isGameActive() && canRevealNextHint();
  const nextHintNumber = state.revealedHintCount + 1;
  const nextHintCost = getNextHintCost();

  if (els.hintTitle) {
    els.hintTitle.textContent = visibleHints.length ? "Tes indices" : "Premier indice";
  }

  els.hintDialogContent.innerHTML = visibleHints.length
    ? `<ol class="hint-list">${visibleHints
        .map(
          (hint) => `
            <li class="hint-card">
              <p>${escapeHtml(hint.texte)}</p>
            </li>
          `
        )
        .join("")}</ol>`
    : `<p class="empty-hints">Aucun indice ouvert pour l'instant.</p>`;

  if (els.revealHintButton) {
    els.revealHintButton.disabled = !canReveal;
    els.revealHintButton.textContent = canReveal
      ? nextHintCost > 0
        ? `Indice ${nextHintNumber} (-${nextHintCost})`
        : "Premier indice gratuit"
      : "Tous les indices sont révélés";
  }

  if (els.hintCostText) {
    els.hintCostText.textContent = canReveal
      ? nextHintCost > 0
        ? `Demander cet indice retirera ${nextHintCost} points.`
        : "Le premier indice ne retire aucun point."
      : "Tous les indices disponibles sont affichés.";
  }
}

function renderAnswerForm() {
  const active = isGameActive();
  if (els.answerInput) els.answerInput.disabled = !active;
  if (els.validateButton) els.validateButton.disabled = !active;
  if (!active) clearSuggestions();
}

function renderActions() {
  const active = isGameActive();

  if (els.nextHintButton) {
    els.nextHintButton.disabled = !active || !todayEntry;
    els.nextHintButton.textContent =
      state?.revealedHintCount === 0
        ? "Indice gratuit"
        : state?.status === "playing"
          ? "Indices"
          : "Indices consultés";
  }

  if (els.shareButton) els.shareButton.disabled = state?.status === "playing" || state?.status === "error";
}

function renderFeedback() {
  if (!els.feedback) return;
  els.feedback.textContent = state?.lastFeedback || "";
  els.feedback.classList.toggle("feedback--success", state?.feedbackTone === "success");
  els.feedback.classList.toggle("feedback--danger", state?.feedbackTone === "danger");
}

function renderNotebookPreview() {
  if (!els.notebookPreview) return;
  const attempts = state?.attempts || [];
  const visibleHints = state?.revealedHintCount || 0;
  const lastAttempts = attempts.slice(-3);

  els.notebookPreview.innerHTML = `
    <p>${visibleHints} indice${visibleHints > 1 ? "s" : ""} ouvert${visibleHints > 1 ? "s" : ""}.</p>
    ${
      lastAttempts.length
        ? `<ol class="mini-list">${lastAttempts
            .map((attempt) => `<li>${escapeHtml(attempt.answer)}</li>`)
            .join("")}</ol>`
        : "<p>Aucune tentative pour l'instant.</p>"
    }
  `;
}

function renderResult() {
  const finished = state?.status === "won" || state?.status === "lost";
  if (!els.resultPanel) return;

  els.resultPanel.hidden = !finished;
  if (!finished || !todayEntry) return;

  const won = state.status === "won";
  const wrongAnswers = getWrongAnswerCount();
  const hintsUsed = state.revealedHintCount;

  els.resultPanel.classList.toggle("result-panel--lost", !won);
  els.resultKicker.textContent = won ? "Station trouvée" : "Station révélée";
  els.resultTitle.textContent = todayEntry.reponse;
  els.resultSummary.textContent = won
    ? `${state.score} points · ${hintsUsed} indice${hintsUsed > 1 ? "s" : ""} · ${wrongAnswers} erreur${wrongAnswers > 1 ? "s" : ""}.`
    : `Score à 0 · ${hintsUsed} indice${hintsUsed > 1 ? "s" : ""} consulté${hintsUsed > 1 ? "s" : ""}.`;

  renderDiscoveryCard();
}

function renderDiscoveryCard() {
  if (!els.discoveryCard || !todayEntry?.ficheDecouverte) return;
  const discovery = todayEntry.ficheDecouverte;
  const facts = Array.isArray(discovery.faits) ? discovery.faits : [];
  els.discoveryCard.innerHTML = `
    <h3>${escapeHtml(discovery.titre || todayEntry.reponse)}</h3>
    <p>${escapeHtml(discovery.texte || "")}</p>
    ${
      facts.length
        ? `<ul>${facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join("")}</ul>`
        : ""
    }
  `;
}

function renderNotebook() {
  if (!els.notebookContent) return;
  const attempts = state?.attempts || [];
  const penalties = state?.penalties || [];
  const visibleHints = todayEntry?.sortedHints?.slice(0, state?.revealedHintCount || 0) || [];
  const finished = state?.status === "won" || state?.status === "lost";

  els.notebookContent.innerHTML = `
    <section class="notebook-section">
      <h3>Résumé</h3>
      <ul class="mini-list">
        <li>Score : ${escapeHtml(String(state?.score ?? 0))}</li>
        <li>État : ${escapeHtml(getStatusLabel())}</li>
        <li>Indices ouverts : ${escapeHtml(String(state?.revealedHintCount ?? 0))}/${TOTAL_HINTS}</li>
        ${finished && todayEntry ? `<li>Réponse : ${escapeHtml(todayEntry.reponse)}</li>` : ""}
      </ul>
    </section>
    <section class="notebook-section">
      <h3>Indices</h3>
      ${
        visibleHints.length
          ? `<ol class="mini-list">${visibleHints
              .map((hint) => `<li>${escapeHtml(hint.texte)}</li>`)
              .join("")}</ol>`
          : "<p>Aucun indice visible.</p>"
      }
    </section>
    <section class="notebook-section">
      <h3>Tentatives</h3>
      ${
        attempts.length
          ? `<ol class="mini-list">${attempts
              .map(
                (attempt) =>
                  `<li>${escapeHtml(attempt.answer)} · ${attempt.isCorrect ? "juste" : `-${attempt.penalty} points`}</li>`
              )
              .join("")}</ol>`
          : "<p>Aucune tentative pour l'instant.</p>"
      }
    </section>
    <section class="notebook-section">
      <h3>Pénalités</h3>
      ${
        penalties.length
          ? `<ol class="mini-list">${penalties
              .map((penalty) => `<li>${escapeHtml(formatPenalty(penalty))}</li>`)
              .join("")}</ol>`
          : "<p>Aucune pénalité.</p>"
      }
    </section>
  `;
}

function renderStats() {
  if (!els.statsContent) return;
  const stats = getStats();
  const winRate = stats.played ? Math.round((stats.wins / stats.played) * 100) : 0;
  const averageScore = stats.wins ? Math.round(stats.totalScore / stats.wins) : 0;
  const averageHints = stats.played ? (stats.totalHintsUsed / stats.played).toFixed(1) : "0";

  els.statsContent.innerHTML = `
    <section class="stats-section">
      <dl class="stats-grid">
        ${renderStatItem("Parties", stats.played)}
        ${renderStatItem("Victoires", stats.wins)}
        ${renderStatItem("Réussite", `${winRate}%`)}
        ${renderStatItem("Série", stats.currentStreak)}
        ${renderStatItem("Meilleure série", stats.bestStreak)}
        ${renderStatItem("Meilleur score", stats.bestScore || "-")}
        ${renderStatItem("Score moyen", averageScore || "-")}
        ${renderStatItem("Indices moyens", averageHints)}
      </dl>
    </section>
    <section class="stats-section">
      <h3>Historique récent</h3>
      ${
        stats.history.length
          ? `<ol class="mini-list">${stats.history
              .slice(0, 8)
              .map((entry) => `<li>${escapeHtml(formatHistoryEntry(entry))}</li>`)
              .join("")}</ol>`
          : "<p>Aucune partie terminée pour l'instant.</p>"
      }
    </section>
  `;
}

function renderStatItem(label, value) {
  return `
    <div>
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(String(value))}</dd>
    </div>
  `;
}

function getStats() {
  const saved = readJson(STORAGE_KEYS.stats, {});
  return sanitizeStats(saved);
}

function setStats(stats) {
  writeJson(STORAGE_KEYS.stats, sanitizeStats(stats));
}

function sanitizeStats(value) {
  const winsByHintsUsed = {
    ...DEFAULT_STATS.winsByHintsUsed,
    ...(value?.winsByHintsUsed && typeof value.winsByHintsUsed === "object"
      ? value.winsByHintsUsed
      : {}),
  };

  return {
    ...DEFAULT_STATS,
    ...(value && typeof value === "object" ? value : {}),
    winsByHintsUsed,
    history: Array.isArray(value?.history) ? value.history.filter(Boolean).slice(0, 30) : [],
  };
}

function applyStatsIfNeeded() {
  if (state.statsApplied) return;

  const stats = getStats();
  if (stats.lastPlayedDateId === todayId) {
    state.statsApplied = true;
    setStats(stats);
    return;
  }

  const won = state.status === "won";
  const hintsUsed = state.revealedHintCount;
  stats.played += 1;
  stats.lastPlayedDateId = todayId;
  stats.totalHintsUsed += hintsUsed;

  if (won) {
    stats.wins += 1;
    stats.currentStreak = stats.lastWinDateId === previousDailyId ? stats.currentStreak + 1 : 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
    stats.bestScore = Math.max(stats.bestScore || 0, state.score);
    stats.totalScore += state.score;
    stats.lastWinDateId = todayId;
    stats.winsByHintsUsed[hintsUsed] = (stats.winsByHintsUsed[hintsUsed] || 0) + 1;
  } else {
    stats.losses += 1;
    stats.currentStreak = 0;
  }

  stats.history = [buildHistoryEntry(), ...stats.history.filter((entry) => entry.dateId !== todayId)].slice(0, 30);
  state.statsApplied = true;
  setStats(stats);
}

function buildHistoryEntry() {
  return {
    dateId: todayId,
    entryId: todayEntry?.id || null,
    status: state.status,
    score: state.score,
    hintsUsed: state.revealedHintCount,
    wrongAnswers: getWrongAnswerCount(),
    result: state.result,
  };
}

async function shareResult() {
  if (state?.status === "playing" || state?.status === "error") return;
  const status = await shareTextWithFallback(buildShareText());
  if (status === "shared") showToast("Résultat partagé.");
  if (status === "copied") showToast("Résultat copié.");
  if (status === "failed") showToast("Impossible de copier le résultat.");
}

function buildShareText(gameState = state) {
  if (!gameState || gameState.status === "playing") return "";
  const lines = [`Station Mystère #${gameState.dateId}`];
  if (gameState.status === "won") {
    lines.push(`Métro : trouvé en ${gameState.revealedHintCount} indice${gameState.revealedHintCount > 1 ? "s" : ""}`);
    lines.push(`Score : ${gameState.score}`);
    lines.push(getRewardLabel(gameState.result));
  } else {
    lines.push("Métro : perdu");
    lines.push("Score : 0");
  }
  return lines.join("\n");
}

function openDialog(dialog) {
  if (!dialog) return;
  renderNotebook();
  renderStats();
  renderHintDialog();
  if (dialog.open) return;
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function closeHelpDialog() {
  writeJson(STORAGE_KEYS.firstHelpSeen, true);
  if (els.helpDialog?.open && typeof els.helpDialog.close === "function") els.helpDialog.close();
  else els.helpDialog?.removeAttribute("open");
  els.nextHintButton?.focus();
}

function showLaunchHelp() {
  if (state?.status !== "playing" || !els.helpDialog) return;
  window.requestAnimationFrame(() => openDialog(els.helpDialog));
}

function showFeedback(message, tone = "neutral") {
  state.lastFeedback = message;
  state.feedbackTone = FEEDBACK_TONES.has(tone) ? tone : "neutral";
}

function showToast(message) {
  if (!els.toast) return;
  window.clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("visible");
  toastTimer = window.setTimeout(() => els.toast.classList.remove("visible"), 2200);
}

function getStatusLabel() {
  if (state?.status === "won") return "Trouvée";
  if (state?.status === "lost") return "Révélée";
  if (state?.status === "error") return "Erreur";
  return "En cours";
}

function getRewardLabel(reward = state?.result) {
  if (reward === "bronze-cup") return "Coupe de bronze";
  if (reward === "bronze-medal") return "Médaille de bronze";
  return "Pas de récompense";
}

function getWrongAnswerCount() {
  return state?.attempts?.filter((attempt) => !attempt.isCorrect).length || 0;
}

function formatPenalty(penalty) {
  if (penalty.type === "hint") return `Indice ${penalty.hintNumber} : -${penalty.points} points`;
  return `Mauvaise réponse : -${penalty.points} points`;
}

function formatHistoryEntry(entry) {
  const result = entry.status === "won" ? `${entry.score} points` : "perdu";
  return `${entry.dateId} · ${result} · ${entry.hintsUsed} indice${entry.hintsUsed > 1 ? "s" : ""}`;
}

function formatDateLabel(dateId) {
  if (!dateId || !/^\d{4}-\d{2}-\d{2}$/.test(dateId)) return "Aujourd'hui";
  const date = new Date(`${dateId}T12:00:00Z`);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: DAILY_TIME_ZONE,
  }).format(date);
}

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

function clampHintCount(value) {
  return Math.min(TOTAL_HINTS, Math.max(0, Math.round(Number(value) || 0)));
}

function clampScore(value) {
  return Math.max(0, Math.round(Number(value) || 0));
}

function exposeDebugHooks() {
  window.render_game_to_text = renderGameToText;
  window.advanceTime = (ms = 0) => {
    render();
    return ms;
  };
}

function renderGameToText() {
  const payload = {
    app: "station-mystere",
    version: APP_VERSION,
    dateId: todayId,
    entry: todayEntry
      ? {
          id: todayEntry.id,
          niveau: todayEntry.niveau,
          reponse: todayEntry.reponse,
        }
      : null,
    status: state?.status || "loading",
    score: state?.score ?? null,
    revealedHintCount: state?.revealedHintCount ?? 0,
    attempts: state?.attempts || [],
    result: state?.result || null,
    statsApplied: Boolean(state?.statsApplied),
    helpDialogVisible: Boolean(els.helpDialog?.open),
    hintDialogVisible: Boolean(els.hintDialog?.open),
    suggestions: currentSuggestions.map((entry) => entry.reponse),
    stats: getStats(),
    dailyRollover: {
      hour: DAILY_ROLLOVER_HOUR,
      timeZone: DAILY_TIME_ZONE,
    },
  };
  return JSON.stringify(payload);
}
