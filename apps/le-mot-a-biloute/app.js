import { getDailyDateId, getRelativeDateId, selectDailyItem } from "../../packages/game-utils/daily.js";
import { fetchJson } from "../../packages/game-utils/fetch-json.js";
import { readJson, writeJson } from "../../packages/game-utils/storage.js";
import { copyText, shareText as shareTextWithFallback } from "../../packages/game-utils/share.js";

const APP_VERSION = "26.06.02.2";
const GAME_URL = new URL(".", window.location.href).href;
const DAILY_EPOCH_ID = "2026-01-01";
const DAILY_TIME_ZONE = "Europe/Paris";
const DAILY_ROLLOVER_HOUR = 12;
const BASE_SCORE = 1000;
const POINTS_PER_EXTRA_GUESS = 120;
const POINTS_PER_EXTRA_HINT = 180;
const HINT_LABEL = "Ch’ti coup d'pouce";
const FREE_HINT_LABEL = `${HINT_LABEL} gratuit`;
const RECOVERY_RESUME_LABEL = "Prendre du rab";

const WORDS = await fetchJson("../../packages/corpus/le-mot-a-biloute/words.json");
const GUESS_POLICY = await fetchJson("../../packages/corpus/le-mot-a-biloute/guess-policy.json");
const ACCEPTED_GUESSES = await fetchJson(
  "../../packages/corpus/le-mot-a-biloute/accepted-guesses.json"
);
const FRENCH_GUESSES = await fetchJson(
  "../../packages/corpus/le-mot-a-biloute/french-guesses.json"
);

const MAX_GUESSES = 6;
const STORAGE_PREFIX = "mot-a-biloute";
const statsKey = `${STORAGE_PREFIX}:stats`;
const KEYBOARD_ROWS = [
  ["A", "Z", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["Q", "S", "D", "F", "G", "H", "J", "K", "L", "M"],
  ["ENTER", "W", "X", "C", "V", "B", "N", "BACKSPACE"],
];
const LETTER_RANK = { absent: 1, present: 2, correct: 3 };

const els = {
  board: document.getElementById("board"),
  keyboard: document.getElementById("keyboard"),
  categoryLabel: document.getElementById("categoryLabel"),
  tryCount: document.getElementById("tryCount"),
  scoreCount: document.getElementById("scoreCount"),
  streakCount: document.getElementById("streakCount"),
  statusAnnouncer: document.getElementById("statusAnnouncer"),
  hintButton: document.getElementById("hintButton"),
  primaryActionButton: document.getElementById("primaryActionButton"),
  hintDialog: document.getElementById("hintDialog"),
  hintTitle: document.getElementById("hintTitle"),
  hintList: document.getElementById("hintList"),
  hintCostText: document.getElementById("hintCostText"),
  nextHintButton: document.getElementById("nextHintButton"),
  resultDialog: document.getElementById("resultDialog"),
  recoveryDialog: document.getElementById("recoveryDialog"),
  resultKicker: document.getElementById("resultKicker"),
  resultTitle: document.getElementById("resultTitle"),
  resultSummary: document.getElementById("resultSummary"),
  resultDetails: document.getElementById("resultDetails"),
  bonusTitle: document.getElementById("bonusTitle"),
  bonusText: document.getElementById("bonusText"),
  nextWordCountdown: document.getElementById("nextWordCountdown"),
  dialogShareButton: document.getElementById("dialogShareButton"),
  shareFeedback: document.getElementById("shareFeedback"),
  shareFallback: document.getElementById("shareFallback"),
  shareFallbackText: document.getElementById("shareFallbackText"),
  copyFallbackButton: document.getElementById("copyFallbackButton"),
  helpButton: document.getElementById("helpButton"),
  helpDialog: document.getElementById("helpDialog"),
  archiveButton: document.getElementById("archiveButton"),
  archiveDialog: document.getElementById("archiveDialog"),
  archivePrevButton: document.getElementById("archivePrevButton"),
  archiveNextButton: document.getElementById("archiveNextButton"),
  archiveDateLabel: document.getElementById("archiveDateLabel"),
  archiveWordMeta: document.getElementById("archiveWordMeta"),
  archivePlayButton: document.getElementById("archivePlayButton"),
  archiveTodayButton: document.getElementById("archiveTodayButton"),
  statsButton: document.getElementById("statsButton"),
  statsDialog: document.getElementById("statsDialog"),
  exportStatsButton: document.getElementById("exportStatsButton"),
  importStatsButton: document.getElementById("importStatsButton"),
  importStatsInput: document.getElementById("importStatsInput"),
  statPlayed: document.getElementById("statPlayed"),
  statWon: document.getElementById("statWon"),
  statStreak: document.getElementById("statStreak"),
  statBestScore: document.getElementById("statBestScore"),
  statWinRate: document.getElementById("statWinRate"),
  statHistory: document.getElementById("statHistory"),
  performanceChart: document.getElementById("performanceChart"),
};

const todayId = getBilouteDateId();
let activeDateId = todayId;
let archiveMode = false;
let archiveSelectedDateId = todayId;
let word = null;
let wordLength = 0;
let acceptedAnswers = [];
let acceptedGuessSet = new Set();
let gameKey = "";
let showRecoveryResumeAction = false;
let primaryActionMode = null;
let revealRowIndex = null;
let revealCleanupTimer = null;
let state = null;

activateDate(todayId);

render();
bindEvents();
scheduleDailyRefresh();
scheduleCountdownRefresh();

function bindEvents() {
  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "Enter") {
      event.preventDefault();
      submitGuess();
      return;
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      removeLetter();
      return;
    }
    if (/^[a-zA-ZÀ-ÿ]$/.test(event.key)) {
      event.preventDefault();
      addLetter(event.key);
    }
  });

  els.keyboard.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-key]");
    if (!button) return;
    const key = button.dataset.key;
    if (key === "ENTER") submitGuess();
    else if (key === "BACKSPACE") removeLetter();
    else addLetter(key);
  });

  els.hintButton.addEventListener("click", openHintDialog);
  els.nextHintButton.addEventListener("click", revealPaidHint);

  els.primaryActionButton.addEventListener("click", handlePrimaryAction);
  els.dialogShareButton.addEventListener("click", shareResult);
  els.copyFallbackButton.addEventListener("click", copyManualShareText);
  els.helpButton.addEventListener("click", () => {
    els.helpDialog.showModal();
  });
  els.archiveButton.addEventListener("click", openArchiveDialog);
  els.archivePrevButton.addEventListener("click", () => moveArchiveSelection(-1));
  els.archiveNextButton.addEventListener("click", () => moveArchiveSelection(1));
  els.archivePlayButton.addEventListener("click", playSelectedArchive);
  els.archiveTodayButton.addEventListener("click", returnToToday);
  els.statsButton.addEventListener("click", () => {
    renderStats();
    els.statsDialog.showModal();
  });
  els.exportStatsButton.addEventListener("click", exportStats);
  els.importStatsButton.addEventListener("click", () => els.importStatsInput.click());
  els.importStatsInput.addEventListener("change", importStats);

  window.advanceTime = () => render();
  window.render_game_to_text = renderGameToText;
}

function activateDate(dateId, options = {}) {
  activeDateId = dateId;
  archiveMode = Boolean(options.archive && dateId !== todayId);
  word = selectDailyItem(WORDS, activeDateId, { epochId: DAILY_EPOCH_ID });
  wordLength = word.answer.length;
  acceptedAnswers = word.acceptedAnswers.map(normalize);
  acceptedGuessSet = buildAcceptedGuessSet();
  gameKey = `${STORAGE_PREFIX}:game:${activeDateId}:${word.id}`;

  const loadedGame = archiveMode ? null : loadGame();
  state = hydrateGameState(loadedGame || createInitialState());
  showRecoveryResumeAction = !archiveMode && loadedGame?.result === "recovery";
  primaryActionMode = null;
  revealRowIndex = null;
}

function createInitialState() {
  return {
    guesses: [],
    current: "",
    statuses: [],
    keyStatuses: {},
    starterHintSeen: false,
    extraHintsUsed: 0,
    startedAt: Date.now(),
    endedAt: null,
    result: "playing",
    score: null,
    shareText: "",
    officialResultRecorded: false,
    recoveryPromptSeen: false,
    recoveryStartedAt: null,
  };
}

function hydrateGameState(gameState) {
  gameState.extraHintsUsed = Number.isInteger(gameState.extraHintsUsed)
    ? gameState.extraHintsUsed
    : gameState.hintUsed
      ? 1
      : 0;
  gameState.starterHintSeen = Boolean(gameState.starterHintSeen || gameState.extraHintsUsed > 0);
  gameState.officialResultRecorded = Boolean(
    gameState.officialResultRecorded || ["won", "lost", "recovered"].includes(gameState.result)
  );
  gameState.recoveryPromptSeen = Boolean(gameState.recoveryPromptSeen);
  gameState.recoveryStartedAt = gameState.recoveryStartedAt || null;
  if (!isGameActive(gameState.result)) {
    gameState.score = gameState.score ?? calculateScore(gameState.result, gameState);
    gameState.shareText = buildShareText(gameState);
  }
  return gameState;
}

function buildAcceptedGuessSet() {
  return new Set([
    ...acceptedAnswers,
    ...(ACCEPTED_GUESSES.words || []).map(normalize),
    ...(FRENCH_GUESSES.words || []).map(normalize),
    ...(GUESS_POLICY.words || []).map(normalize),
  ]);
}

function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();
}

function isGameActive(result = state.result) {
  return result === "playing" || result === "recovery";
}

function isOfficialDailyGame() {
  return !archiveMode && activeDateId === todayId;
}

function isRecoveryState(result = state.result) {
  return result === "recovery" || result === "recovered";
}

function addLetter(letter) {
  if (!isGameActive()) return;
  const normalized = normalize(letter);
  if (!normalized || state.current.length >= wordLength) return;
  state.current += normalized[0];
  saveGame();
  render();
}

function removeLetter() {
  if (!isGameActive()) return;
  state.current = state.current.slice(0, -1);
  saveGame();
  render();
}

function submitGuess() {
  if (!isGameActive()) return;
  const guess = normalize(state.current);

  if (guess.length !== wordLength) {
    shakeCurrentRow();
    announce(`${wordLength} lettres attendues.`);
    return;
  }

  const validation = validateGuess(guess);
  if (!validation.valid) {
    shakeCurrentRow();
    announce(validation.message);
    return;
  }

  const statuses = scoreGuess(guess, word.answer);
  state.guesses.push(guess);
  state.statuses.push(statuses);
  revealRowIndex = state.guesses.length - 1;
  scheduleRevealCleanup();
  updateKeyStatuses(guess, statuses);
  state.current = "";

  if (acceptedAnswers.includes(guess)) {
    finishGame(state.result === "recovery" ? "recovered" : "won");
  } else if (state.result === "playing" && state.guesses.length >= MAX_GUESSES) {
    enterRecoveryMode();
  } else {
    saveGame();
    render();
  }
}

function validateGuess(guess) {
  if (!/^[A-Z]+$/.test(guess)) {
    return { valid: false, message: "Lettres uniquement, biloute." };
  }
  if (acceptedAnswers.includes(guess)) {
    return { valid: true };
  }

  const rules = GUESS_POLICY.rules || {};
  if (GUESS_POLICY.mode === "strict") {
    if (!acceptedGuessSet.has(guess)) {
      return {
        valid: false,
        message: GUESS_POLICY.messages?.unknown || "Ce mot n'est pas dans le calepin.",
      };
    }
  }
  if (rules.rejectSingleRepeatedLetter && new Set(guess).size === 1) {
    return {
      valid: false,
      message: GUESS_POLICY.messages?.repeated || "Ça ressemble à une touche coincée.",
    };
  }
  if (rules.requireVowelLikeLetter && !/[AEIOUY]/.test(guess)) {
    return {
      valid: false,
      message: GUESS_POLICY.messages?.vowel || "Il faut au moins une voyelle ou un Y.",
    };
  }

  return { valid: true };
}

function scoreGuess(guess, answer) {
  const result = Array(wordLength).fill("absent");
  const answerLetters = answer.split("");
  const guessLetters = guess.split("");
  const remaining = {};

  for (let i = 0; i < wordLength; i += 1) {
    if (guessLetters[i] === answerLetters[i]) {
      result[i] = "correct";
    } else {
      remaining[answerLetters[i]] = (remaining[answerLetters[i]] || 0) + 1;
    }
  }

  for (let i = 0; i < wordLength; i += 1) {
    if (result[i] === "correct") continue;
    const letter = guessLetters[i];
    if (remaining[letter]) {
      result[i] = "present";
      remaining[letter] -= 1;
    }
  }

  return result;
}

function updateKeyStatuses(guess, statuses) {
  guess.split("").forEach((letter, index) => {
    const current = state.keyStatuses[letter];
    const next = statuses[index];
    if (!current || LETTER_RANK[next] > LETTER_RANK[current]) {
      state.keyStatuses[letter] = next;
    }
  });
}

function finishGame(result) {
  state.result = result;
  state.endedAt = Date.now();
  state.score = calculateScore(result);
  state.shareText = buildShareText();
  if (isOfficialDailyGame()) {
    if (result === "won") {
      recordOfficialResult("won");
    } else if (result === "lost" || result === "recovered") {
      recordOfficialResult("lost");
    }
    recordHistory(result);
  }
  saveGame();
  render();
  showResultDialog();
}

function render() {
  const active = isGameActive();
  els.categoryLabel.textContent = archiveMode ? `Archive · ${word.category}` : word.category;
  els.tryCount.textContent = formatTryCount();
  els.scoreCount.textContent = String(calculateScore(state.result));
  els.streakCount.textContent = String(getStats().streak || 0);
  if (shouldShowRecoveryResumeAction()) {
    els.hintButton.textContent = RECOVERY_RESUME_LABEL;
    els.hintButton.disabled = false;
    els.hintButton.setAttribute("aria-label", RECOVERY_RESUME_LABEL);
  } else {
    const hintButtonLabel = state.starterHintSeen ? HINT_LABEL : FREE_HINT_LABEL;
    els.hintButton.textContent = hintButtonLabel;
    els.hintButton.disabled = !active;
    els.hintButton.setAttribute("aria-label", hintButtonLabel);
  }
  renderPrimaryAction();
  renderBoard();
  renderKeyboard();
  renderHintDialog();
  renderCountdown();
}

function shouldShowRecoveryResumeAction() {
  return showRecoveryResumeAction && state.result === "recovery";
}

function formatTryCount() {
  if (!isRecoveryState()) return `${state.guesses.length}/${MAX_GUESSES}`;
  const extraTries = Math.max(0, state.guesses.length - MAX_GUESSES);
  return extraTries > 0 ? `${MAX_GUESSES}/${MAX_GUESSES} +${extraTries}` : `${MAX_GUESSES}/${MAX_GUESSES}+`;
}

function renderPrimaryAction() {
  const active = isGameActive();
  const nextMode = active ? "validate" : "share";
  els.primaryActionButton.textContent = active ? "Valider" : "Partager";
  els.primaryActionButton.disabled = active && state.current.length !== wordLength;
  els.primaryActionButton.setAttribute(
    "aria-label",
    active ? "Valider la proposition" : "Partager le résultat"
  );
  els.primaryActionButton.classList.toggle("share-ready", !active);

  if (primaryActionMode === "validate" && nextMode === "share") {
    highlightShareButton(els.primaryActionButton);
  }
  primaryActionMode = nextMode;
}

function highlightShareButton(button) {
  button.classList.add("share-ready");
  button.classList.remove("share-pop");
  window.requestAnimationFrame(() => button.classList.add("share-pop"));
}

function renderHintDialog() {
  els.hintTitle.textContent = state.starterHintSeen ? "Tes coups d'pouce" : FREE_HINT_LABEL;
  els.hintList.innerHTML = "";

  if (state.starterHintSeen) {
    els.hintList.append(createHintCard(FREE_HINT_LABEL, word.starterHint));
  }

  for (let index = 0; index < state.extraHintsUsed; index += 1) {
    els.hintList.append(createHintCard(`${HINT_LABEL} ${index + 2}`, word.hints[index]));
  }

  const canRevealPaid = isGameActive() && state.extraHintsUsed < word.hints.length;
  els.nextHintButton.disabled = !canRevealPaid;
  els.nextHintButton.textContent = canRevealPaid
    ? `${HINT_LABEL} suivant -${POINTS_PER_EXTRA_HINT}`
    : "Plus de coup d'pouce";
  els.hintCostText.textContent = canRevealPaid
    ? `Le premier coup d'pouce est gratuit. Le suivant retire ${POINTS_PER_EXTRA_HINT} points.`
    : "Tous les coups d'pouce disponibles sont affichés.";
}

function createHintCard(title, text) {
  const card = document.createElement("article");
  card.className = "hint-card";

  const heading = document.createElement("strong");
  heading.textContent = title;

  const body = document.createElement("p");
  body.textContent = text;

  card.append(heading, body);
  return card;
}

function openHintDialog() {
  if (shouldShowRecoveryResumeAction()) {
    showRecoveryResumeAction = false;
    render();
    showRecoveryDialog();
    return;
  }
  if (!isGameActive()) return;
  if (!state.starterHintSeen) {
    state.starterHintSeen = true;
    saveGame();
    render();
  } else {
    renderHintDialog();
  }
  if (!els.hintDialog.open) els.hintDialog.showModal();
}

function revealPaidHint() {
  if (!isGameActive()) return;
  if (state.extraHintsUsed >= word.hints.length) return;
  state.starterHintSeen = true;
  state.extraHintsUsed += 1;
  saveGame();
  render();
  renderHintDialog();
  announce(`Coup d'pouce ${state.extraHintsUsed + 1} révélé. ${POINTS_PER_EXTRA_HINT} points en moins.`);
}

function renderBoard() {
  els.board.innerHTML = "";
  const rowCount = getBoardRowCount();
  els.board.style.gridTemplateRows = `repeat(${rowCount}, 1fr)`;
  els.board.classList.toggle("is-recovery", isRecoveryState());

  for (let row = 0; row < rowCount; row += 1) {
    const rowEl = document.createElement("div");
    rowEl.className = "guess-row";
    rowEl.setAttribute("role", "row");
    rowEl.style.gridTemplateColumns = `repeat(${wordLength}, 1fr)`;

    const committed = state.guesses[row] || "";
    const letters = committed || (isGameActive() && row === state.guesses.length ? state.current : "");
    const statuses = state.statuses[row] || [];

    for (let col = 0; col < wordLength; col += 1) {
      const letter = letters[col] || "";
      const status = statuses[col] || "";
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.setAttribute("role", "gridcell");
      tile.textContent = letter;
      tile.setAttribute("aria-label", getTileLabel(row, col, letter, status));
      if (letter) tile.classList.add("filled");
      if (status) {
        tile.classList.add(status);
        if (row === revealRowIndex) {
          tile.classList.add("flip");
          tile.style.setProperty("--flip-delay", `${col * 82}ms`);
        }
      }
      rowEl.append(tile);
    }

    els.board.append(rowEl);
  }
}

function getTileLabel(row, col, letter, status) {
  const position = `Ligne ${row + 1}, case ${col + 1}`;
  if (!letter) return `${position}, vide`;
  if (!status) return `${position}, ${letter} saisi`;
  return `${position}, ${letter}, ${getStatusText(status)}`;
}

function getStatusText(status) {
  if (status === "correct") return "bonne lettre, bonne place";
  if (status === "present") return "bonne lettre, autre place";
  return "lettre absente";
}

function getBoardRowCount() {
  const activeRows = isGameActive() ? state.guesses.length + 1 : state.guesses.length;
  return Math.max(MAX_GUESSES, activeRows);
}

function renderKeyboard() {
  els.keyboard.innerHTML = "";
  KEYBOARD_ROWS.forEach((row) => {
    const rowEl = document.createElement("div");
    rowEl.className = "key-row";
    row.forEach((key) => {
      const button = document.createElement("button");
      button.className = "key";
      button.type = "button";
      button.dataset.key = key;
      button.textContent = key === "BACKSPACE" ? "⌫" : key === "ENTER" ? "OK" : key;
      button.setAttribute("aria-label", key === "BACKSPACE" ? "Effacer" : key === "ENTER" ? "Valider" : key);
      if (key === "BACKSPACE" || key === "ENTER") button.classList.add("wide");
      if (state.keyStatuses[key]) button.classList.add(state.keyStatuses[key]);
      rowEl.append(button);
    });
    els.keyboard.append(rowEl);
  });
}

function shakeCurrentRow() {
  const row = els.board.children[state.guesses.length];
  if (!row) return;
  row.querySelectorAll(".tile").forEach((tile) => {
    tile.classList.remove("shake");
    window.requestAnimationFrame(() => tile.classList.add("shake"));
  });
}

function scheduleRevealCleanup() {
  window.clearTimeout(revealCleanupTimer);
  revealCleanupTimer = window.setTimeout(() => {
    revealRowIndex = null;
    renderBoard();
  }, 980);
}

function announce(message) {
  els.statusAnnouncer.textContent = message;
}

function enterRecoveryMode() {
  state.result = "recovery";
  state.score = null;
  state.shareText = "";
  state.recoveryStartedAt = state.recoveryStartedAt || Date.now();
  state.recoveryPromptSeen = true;
  showRecoveryResumeAction = false;
  if (isOfficialDailyGame()) recordOfficialResult("lost");
  saveGame();
  render();
  announce("T'as perdu, Biloute ! Rab de Biloute lancé.");
  showRecoveryDialog();
}

function showRecoveryDialog() {
  if (!els.recoveryDialog.open) els.recoveryDialog.showModal();
}

function showResultDialog() {
  const won = state.result === "won";
  const recovered = state.result === "recovered";
  const tries = state.guesses.length;
  const score = state.score ?? calculateScore(state.result);
  els.resultKicker.textContent = recovered ? "Rab de Biloute" : won ? "Bien joué biloute !" : "Terminus";
  els.resultTitle.textContent = won || recovered
    ? `${word.answer} en ${tries} essai${tries > 1 ? "s" : ""}`
    : `C'était ${word.answer}`;
  els.resultSummary.textContent = recovered
    ? `${score} points · trouvé au Rab de Biloute · ${formatPaidHintCount()}`
    : `${score} points · ${formatPaidHintCount()}`;
  renderResultDetails(state.result);
  els.bonusTitle.textContent = word.bonus.title;
  els.bonusText.textContent = word.bonus.text;
  if (!els.resultDialog.open) els.resultDialog.showModal();
  resetShareFeedback();
  highlightShareButton(els.dialogShareButton);
}

function renderResultDetails(result) {
  els.resultDetails.innerHTML = "";
  const stats = getStats();
  const tries = state.guesses.length;
  const guessPenalty = Math.max(0, tries - 1) * POINTS_PER_EXTRA_GUESS;
  const hintPenalty = state.extraHintsUsed * POINTS_PER_EXTRA_HINT;
  const rawScore = BASE_SCORE - guessPenalty - hintPenalty;
  const score = state.score ?? calculateScore(result);
  const scoreFormula = result === "won" && score !== rawScore
    ? `${BASE_SCORE} - ${guessPenalty} - ${hintPenalty}, minimum ${score}`
    : `${BASE_SCORE} - ${guessPenalty} - ${hintPenalty} = ${score}`;
  const officialLabel = archiveMode
    ? "Archive, hors série"
    : result === "won"
      ? "Victoire officielle"
      : result === "recovered"
        ? "Rab, série perdue"
        : "Série perdue";

  appendDefinitionItems(els.resultDetails, [
    ["Essais", result === "recovered" ? `${tries} dont ${tries - MAX_GUESSES} au rab` : `${tries}/${MAX_GUESSES}`],
    ["Coups d'pouce", formatPaidHintCount()],
    ["Calcul", scoreFormula],
    ["Officiel", officialLabel],
    ["Série", archiveMode ? "-" : String(stats.streak || 0)],
    ["Meilleur", archiveMode ? "-" : stats.bestScore ? String(stats.bestScore) : "-"],
  ]);
}

function buildShareText(gameState = state) {
  const score = gameState.score ?? calculateScore(gameState.result, gameState);
  const rows = gameState.statuses.map((statuses) =>
    statuses
      .map((status) => {
        if (status === "correct") return "🟩";
        if (status === "present") return "🟨";
        return "⬛";
      })
      .join("")
  );
  const summary = gameState.result === "recovered"
    ? `${score} points · Rab de Biloute · ${gameState.guesses.length} essais · ${formatPaidHintCount(gameState)}`
    : `${score} points · ${gameState.result === "won" ? gameState.guesses.length : "X"}/${MAX_GUESSES} · ${formatPaidHintCount(gameState)}`;
  const archiveLabel = archiveMode ? " archive" : "";
  return [
    `Le mot à Biloute${archiveLabel} ${activeDateId}`,
    summary,
    ...rows,
    GAME_URL,
  ].join("\n");
}

async function shareResult() {
  const text = state.shareText || buildShareText();
  resetShareFeedback();
  const status = await shareTextWithFallback(text);
  if (status === "copied") {
    showResultDialogForShareFeedback();
    showShareFeedback("Résultat copié.");
    announce("Résultat copié.");
  } else if (status === "failed") {
    showResultDialogForShareFeedback();
    showManualShareFallback(text);
    announce("Copie manuelle disponible.");
  } else if (status === "shared") {
    showShareFeedback("Partage lancé.");
  } else if (status === "aborted") {
    showShareFeedback("Partage annulé.");
  }
}

function showResultDialogForShareFeedback() {
  if (!els.resultDialog.open) showResultDialog();
}

async function copyManualShareText() {
  const text = els.shareFallbackText.value || state.shareText || buildShareText();
  if (await copyText(text)) {
    showShareFeedback("Résultat copié.");
    announce("Résultat copié.");
    return;
  }
  els.shareFallbackText.focus();
  els.shareFallbackText.select();
  showShareFeedback("Texte sélectionné : utilise Ctrl+C.");
}

function resetShareFeedback() {
  els.shareFeedback.textContent = "";
  els.shareFallback.hidden = true;
  els.shareFallbackText.value = "";
}

function showShareFeedback(message) {
  els.shareFeedback.textContent = message;
}

function showManualShareFallback(text) {
  els.shareFallback.hidden = false;
  els.shareFallbackText.value = text;
  els.shareFallbackText.focus();
  els.shareFallbackText.select();
  showShareFeedback("Copie ton résultat ci-dessous.");
}

function handlePrimaryAction() {
  if (isGameActive()) {
    submitGuess();
  } else {
    shareResult();
  }
}

function openArchiveDialog() {
  archiveSelectedDateId = activeDateId;
  renderArchiveDialog();
  els.archiveDialog.showModal();
}

function moveArchiveSelection(offset) {
  archiveSelectedDateId = getRelativeIdFromDateId(offset, archiveSelectedDateId);
  if (archiveSelectedDateId < DAILY_EPOCH_ID) archiveSelectedDateId = DAILY_EPOCH_ID;
  if (archiveSelectedDateId > todayId) archiveSelectedDateId = todayId;
  renderArchiveDialog();
}

function playSelectedArchive() {
  const archive = archiveSelectedDateId !== todayId;
  activateDate(archiveSelectedDateId, { archive });
  els.archiveDialog.close();
  render();
  announce(archive ? `Archive du ${formatDateLabel(activeDateId)} chargée.` : "Mot du jour chargé.");
}

function returnToToday() {
  activateDate(todayId);
  archiveSelectedDateId = todayId;
  els.archiveDialog.close();
  render();
  announce("Mot du jour chargé.");
}

function renderArchiveDialog() {
  const selectedWord = selectDailyItem(WORDS, archiveSelectedDateId, { epochId: DAILY_EPOCH_ID });
  els.archiveDateLabel.textContent = formatDateLabel(archiveSelectedDateId);
  els.archiveWordMeta.textContent = `${selectedWord.category} · ${selectedWord.answer.length} lettres`;
  els.archivePrevButton.disabled = archiveSelectedDateId <= DAILY_EPOCH_ID;
  els.archiveNextButton.disabled = archiveSelectedDateId >= todayId;
}

function getStats() {
  return readJson(statsKey, {});
}

function exportStats() {
  const payload = {
    game: "le-mot-a-biloute",
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    stats: getStats(),
  };
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `calepin-biloute-${todayId}.json`;
  link.click();
  URL.revokeObjectURL(url);
  announce("Calepin exporté.");
}

async function importStats(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    const stats = sanitizeImportedStats(payload.stats || payload);
    writeJson(statsKey, stats);
    renderStats();
    render();
    announce("Calepin importé.");
  } catch (error) {
    announce("Import impossible : fichier invalide.");
  } finally {
    event.target.value = "";
  }
}

function sanitizeImportedStats(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid stats payload.");
  }

  return {
    played: toPositiveInteger(value.played),
    won: toPositiveInteger(value.won),
    streak: toPositiveInteger(value.streak),
    bestScore: Number.isFinite(value.bestScore) ? Math.round(value.bestScore) : null,
    lastPlayed: isDateId(value.lastPlayed) ? value.lastPlayed : null,
    lastWin: isDateId(value.lastWin) ? value.lastWin : null,
    history: Array.isArray(value.history)
      ? value.history.slice(0, 7).map(sanitizeHistoryEntry).filter(Boolean)
      : [],
  };
}

function sanitizeHistoryEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  const result = ["won", "lost", "recovered"].includes(entry.result) ? entry.result : "lost";
  return {
    date: isDateId(entry.date) ? entry.date : todayId,
    answer: normalize(entry.answer).slice(0, 12),
    result,
    score: Number.isFinite(entry.score) ? Math.round(entry.score) : 0,
    tries: toPositiveInteger(entry.tries),
    extraHintsUsed: toPositiveInteger(entry.extraHintsUsed),
  };
}

function toPositiveInteger(value) {
  return Number.isInteger(value) && value > 0 ? value : 0;
}

function isDateId(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatPaidHintCount(gameState = state) {
  const plural = gameState.extraHintsUsed === 1 ? "" : "s";
  return `${gameState.extraHintsUsed} coup${plural} d'pouce payant${plural}`;
}

function recordHistory(result) {
  if (!isOfficialDailyGame()) return;
  const stats = {
    played: 0,
    won: 0,
    streak: 0,
    bestScore: null,
    history: [],
    ...getStats(),
  };
  const history = Array.isArray(stats.history) ? stats.history : [];
  stats.history = [
    {
      date: activeDateId,
      answer: word.answer,
      result,
      score: state.score ?? calculateScore(result),
      tries: state.guesses.length,
      extraHintsUsed: state.extraHintsUsed,
    },
    ...history.filter((entry) => entry?.date !== activeDateId),
  ].slice(0, 7);
  writeJson(statsKey, stats);
}

function recordOfficialResult(result) {
  if (!isOfficialDailyGame()) return;
  if (state.officialResultRecorded) return;

  const stats = {
    played: 0,
    won: 0,
    streak: 0,
    bestScore: null,
    lastPlayed: null,
    ...getStats(),
  };
  if (stats.lastPlayed === activeDateId) {
    state.officialResultRecorded = true;
    return;
  }

  stats.played += 1;
  stats.lastPlayed = activeDateId;

  if (result === "won") {
    const yesterday = getPreviousDailyId(activeDateId);
    stats.won += 1;
    stats.streak = stats.lastWin === yesterday ? (stats.streak || 0) + 1 : 1;
    stats.lastWin = activeDateId;
    stats.bestScore = stats.bestScore ? Math.max(stats.bestScore, state.score) : state.score;
  } else {
    stats.streak = 0;
  }

  writeJson(statsKey, stats);
  state.officialResultRecorded = true;
}

function renderStats() {
  const stats = getStats();
  const played = stats.played || 0;
  const won = stats.won || 0;
  els.statPlayed.textContent = String(played);
  els.statWon.textContent = String(won);
  els.statStreak.textContent = String(stats.streak || 0);
  els.statBestScore.textContent = stats.bestScore ? String(stats.bestScore) : "-";
  els.statWinRate.textContent = played ? `${Math.round((won / played) * 100)}%` : "-";
  renderHistory(stats.history);
  renderPerformance(stats.history);
}

function renderHistory(history = []) {
  els.statHistory.innerHTML = "";
  if (!Array.isArray(history) || history.length === 0) {
    const item = document.createElement("li");
    item.textContent = "Rien à noter pour l'instant.";
    els.statHistory.append(item);
    return;
  }

  history.slice(0, 5).forEach((entry) => {
    const item = document.createElement("li");
    const resultLabel = formatHistoryResult(entry.result);
    item.textContent = `${entry.date} · ${entry.answer} · ${entry.score} pts · ${resultLabel}`;
    els.statHistory.append(item);
  });
}

function renderPerformance(history = []) {
  els.performanceChart.innerHTML = "";
  if (!Array.isArray(history) || history.length === 0) {
    const empty = document.createElement("p");
    empty.className = "performance-empty";
    empty.textContent = "Pas encore assez de parties.";
    els.performanceChart.append(empty);
    return;
  }

  const recent = history.slice(0, 7).reverse();
  const scores = recent.map((entry) => Number(entry.score) || 0);
  const min = Math.min(0, ...scores);
  const max = Math.max(BASE_SCORE, ...scores);
  const range = Math.max(1, max - min);

  recent.forEach((entry) => {
    const score = Number(entry.score) || 0;
    const bar = document.createElement("div");
    bar.className = `performance-bar is-${entry.result}`;
    bar.setAttribute(
      "aria-label",
      `${entry.date}, ${score} points, ${formatHistoryResult(entry.result)}`
    );

    const fill = document.createElement("span");
    fill.style.height = `${Math.max(8, ((score - min) / range) * 104)}px`;

    const label = document.createElement("span");
    label.textContent = String(score);

    bar.append(fill, label);
    els.performanceChart.append(bar);
  });
}

function formatHistoryResult(result) {
  if (result === "won") return "gagné";
  if (result === "recovered") return "rab";
  return "perdu";
}

function appendDefinitionItems(list, items) {
  items.forEach(([term, description]) => {
    const wrapper = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = description;
    wrapper.append(dt, dd);
    list.append(wrapper);
  });
}

function saveGame() {
  if (!isOfficialDailyGame()) return;
  writeJson(gameKey, state);
}

function loadGame() {
  const loaded = readJson(gameKey, null);
  if (!loaded || !Array.isArray(loaded.guesses)) return null;
  return loaded;
}

function calculateScore(result = state.result, gameState = state) {
  if (result === "lost") return 0;
  const effectiveGuessCount = isGameActive(result)
    ? gameState.guesses.length + 1
    : gameState.guesses.length;
  const guessPenalty = Math.max(0, effectiveGuessCount - 1) * POINTS_PER_EXTRA_GUESS;
  const hintPenalty = gameState.extraHintsUsed * POINTS_PER_EXTRA_HINT;
  const score = BASE_SCORE - guessPenalty - hintPenalty;
  if (result === "won") return Math.max(50, score);
  if (isRecoveryState(result)) return score;
  return Math.max(0, score);
}

function getBilouteDateId(date = new Date()) {
  return getDailyDateId(date, {
    rolloverHour: DAILY_ROLLOVER_HOUR,
    timeZone: DAILY_TIME_ZONE,
  });
}

function getPreviousDailyId(dateId) {
  return getRelativeIdFromDateId(-1, dateId);
}

function getRelativeIdFromDateId(offset, dateId) {
  return getRelativeDateId(offset, new Date(`${dateId}T00:00:00Z`), { timeZone: "UTC" });
}

function scheduleDailyRefresh() {
  window.setInterval(() => {
    if (getBilouteDateId() !== todayId) {
      window.location.reload();
    }
  }, 60 * 1000);
}

function scheduleCountdownRefresh() {
  window.setInterval(renderCountdown, 1000);
}

function renderCountdown() {
  if (!els.nextWordCountdown) return;
  els.nextWordCountdown.textContent = `Prochain mot à 12 h : ${formatDuration(
    getNextRolloverDate().getTime() - Date.now()
  )}`;
}

function getNextRolloverDate(now = new Date()) {
  const parts = getZonedDateTimeParts(now, DAILY_TIME_ZONE);
  const currentDateId = `${parts.year}-${parts.month}-${parts.day}`;
  const targetDateId =
    Number(parts.hour) < DAILY_ROLLOVER_HOUR
      ? currentDateId
      : getRelativeIdFromDateId(1, currentDateId);
  const [year, month, day] = targetDateId.split("-").map(Number);
  return zonedTimeToUtc(year, month, day, DAILY_ROLLOVER_HOUR, 0, DAILY_TIME_ZONE);
}

function zonedTimeToUtc(year, month, day, hour, minute, timeZone) {
  const wallTime = Date.UTC(year, month - 1, day, hour, minute, 0);
  let utcTime = wallTime;
  for (let index = 0; index < 3; index += 1) {
    utcTime = wallTime - getTimeZoneOffsetMs(new Date(utcTime), timeZone);
  }
  return new Date(utcTime);
}

function getTimeZoneOffsetMs(date, timeZone) {
  const parts = getZonedDateTimeParts(date, timeZone);
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return asUtc - date.getTime();
}

function getZonedDateTimeParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  return Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")} h ${String(minutes).padStart(2, "0")} min ${String(seconds).padStart(2, "0")} s`;
}

function formatDateLabel(dateId) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateId}T00:00:00Z`));
}

function renderGameToText() {
  return JSON.stringify({
    screen: "game",
    date: activeDateId,
    today: todayId,
    archiveMode,
    dailyRollover: {
      hour: DAILY_ROLLOVER_HOUR,
      timeZone: DAILY_TIME_ZONE,
      nextAt: getNextRolloverDate().toISOString(),
    },
    answerLength: wordLength,
    category: word.category,
    guesses: state.guesses,
    current: state.current,
    result: state.result,
    recoveryMode: state.result === "recovery",
    recoveryResumeAction: shouldShowRecoveryResumeAction(),
    officialResultRecorded: state.officialResultRecorded,
    validation: {
      mode: GUESS_POLICY.mode,
      label: GUESS_POLICY.label,
      acceptedGuesses: acceptedGuessSet.size,
    },
    score: state.score ?? calculateScore(state.result),
    triesUsed: state.guesses.length,
    triesMax: MAX_GUESSES,
    starterHint: word.starterHint,
    starterHintSeen: state.starterHintSeen,
    extraHintsUsed: state.extraHintsUsed,
    visibleHints: [
      ...(state.starterHintSeen ? [word.starterHint] : []),
      ...word.hints.slice(0, state.extraHintsUsed),
    ],
    message: els.statusAnnouncer.textContent,
    keyboard: state.keyStatuses,
    version: APP_VERSION,
  });
}
