import { getDailyDateId, getRelativeDateId, selectDailyItem } from "../../packages/game-utils/daily.js";
import { fetchJson } from "../../packages/game-utils/fetch-json.js";
import { readJson, writeJson } from "../../packages/game-utils/storage.js";
import { shareText as shareTextWithFallback } from "../../packages/game-utils/share.js";

const APP_VERSION = "26.06.01.3";
const GAME_URL = new URL(".", window.location.href).href;
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

const MAX_GUESSES = 6;
const STORAGE_PREFIX = "mot-a-biloute";
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
  dialogShareButton: document.getElementById("dialogShareButton"),
  helpButton: document.getElementById("helpButton"),
  helpDialog: document.getElementById("helpDialog"),
  statsButton: document.getElementById("statsButton"),
  statsDialog: document.getElementById("statsDialog"),
  statPlayed: document.getElementById("statPlayed"),
  statWon: document.getElementById("statWon"),
  statStreak: document.getElementById("statStreak"),
  statBestScore: document.getElementById("statBestScore"),
  statWinRate: document.getElementById("statWinRate"),
  statHistory: document.getElementById("statHistory"),
};

const todayId = getBilouteDateId();
const word = selectDailyItem(WORDS, todayId, { epochId: "2026-01-01" });
const wordLength = word.answer.length;
const acceptedAnswers = word.acceptedAnswers.map(normalize);
const gameKey = `${STORAGE_PREFIX}:game:${todayId}:${word.id}`;
const statsKey = `${STORAGE_PREFIX}:stats`;
const loadedGame = loadGame();
let showRecoveryResumeAction = loadedGame?.result === "recovery";
let primaryActionMode = null;

const state = loadedGame || {
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

state.extraHintsUsed = Number.isInteger(state.extraHintsUsed)
  ? state.extraHintsUsed
  : state.hintUsed
    ? 1
    : 0;
state.starterHintSeen = Boolean(state.starterHintSeen || state.extraHintsUsed > 0);
state.officialResultRecorded = Boolean(
  state.officialResultRecorded || ["won", "lost", "recovered"].includes(state.result)
);
state.recoveryPromptSeen = Boolean(state.recoveryPromptSeen);
state.recoveryStartedAt = state.recoveryStartedAt || null;
if (!isGameActive()) {
  state.score = state.score ?? calculateScore(state.result);
  state.shareText = buildShareText();
}

render();
bindEvents();
scheduleDailyRefresh();

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
  els.helpButton.addEventListener("click", () => {
    els.helpDialog.showModal();
  });
  els.statsButton.addEventListener("click", () => {
    renderStats();
    els.statsDialog.showModal();
  });

  window.advanceTime = () => render();
  window.render_game_to_text = renderGameToText;
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
    const validGuesses = new Set((GUESS_POLICY.words || []).map(normalize));
    if (!validGuesses.has(guess)) {
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
  if (result === "won") {
    recordOfficialResult("won");
  } else if (result === "lost" || result === "recovered") {
    recordOfficialResult("lost");
  }
  recordHistory(result);
  saveGame();
  render();
  showResultDialog();
}

function render() {
  const active = isGameActive();
  els.categoryLabel.textContent = word.category;
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
        tile.dataset.mark = getStatusMark(status);
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

function getStatusMark(status) {
  if (status === "correct") return "✓";
  if (status === "present") return "~";
  return "×";
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
  recordOfficialResult("lost");
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
  const officialLabel = result === "won"
    ? "Victoire officielle"
    : result === "recovered"
      ? "Rab, série perdue"
      : "Série perdue";

  appendDefinitionItems(els.resultDetails, [
    ["Essais", result === "recovered" ? `${tries} dont ${tries - MAX_GUESSES} au rab` : `${tries}/${MAX_GUESSES}`],
    ["Coups d'pouce", formatPaidHintCount()],
    ["Calcul", scoreFormula],
    ["Officiel", officialLabel],
    ["Série", String(stats.streak || 0)],
    ["Meilleur", stats.bestScore ? String(stats.bestScore) : "-"],
  ]);
}

function buildShareText() {
  const score = state.score ?? calculateScore(state.result);
  const rows = state.statuses.map((statuses) =>
    statuses
      .map((status) => {
        if (status === "correct") return "🟩";
        if (status === "present") return "🟨";
        return "⬛";
      })
      .join("")
  );
  const summary = state.result === "recovered"
    ? `${score} points · Rab de Biloute · ${state.guesses.length} essais · ${formatPaidHintCount()}`
    : `${score} points · ${state.result === "won" ? state.guesses.length : "X"}/${MAX_GUESSES} · ${formatPaidHintCount()}`;
  return [
    `Le mot à Biloute ${todayId}`,
    summary,
    ...rows,
    GAME_URL,
  ].join("\n");
}

async function shareResult() {
  const text = state.shareText || buildShareText();
  const status = await shareTextWithFallback(text);
  if (status === "copied") {
    announce("Résultat copié.");
  } else if (status === "failed") {
    announce(text);
  }
}

function handlePrimaryAction() {
  if (isGameActive()) {
    submitGuess();
  } else {
    shareResult();
  }
}

function getStats() {
  return readJson(statsKey, {});
}

function formatPaidHintCount() {
  const plural = state.extraHintsUsed === 1 ? "" : "s";
  return `${state.extraHintsUsed} coup${plural} d'pouce payant${plural}`;
}

function recordHistory(result) {
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
      date: todayId,
      answer: word.answer,
      result,
      score: state.score ?? calculateScore(result),
      tries: state.guesses.length,
      extraHintsUsed: state.extraHintsUsed,
    },
    ...history.filter((entry) => entry?.date !== todayId),
  ].slice(0, 7);
  writeJson(statsKey, stats);
}

function recordOfficialResult(result) {
  if (state.officialResultRecorded) return;

  const stats = {
    played: 0,
    won: 0,
    streak: 0,
    bestScore: null,
    lastPlayed: null,
    ...getStats(),
  };
  if (stats.lastPlayed === todayId) {
    state.officialResultRecorded = true;
    return;
  }

  stats.played += 1;
  stats.lastPlayed = todayId;

  if (result === "won") {
    const yesterday = getPreviousDailyId(todayId);
    stats.won += 1;
    stats.streak = stats.lastWin === yesterday ? (stats.streak || 0) + 1 : 1;
    stats.lastWin = todayId;
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
    const resultLabel = entry.result === "won"
      ? "gagné"
      : entry.result === "recovered"
        ? "rab"
        : "perdu";
    item.textContent = `${entry.date} · ${entry.answer} · ${entry.score} pts · ${resultLabel}`;
    els.statHistory.append(item);
  });
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
  writeJson(gameKey, state);
}

function loadGame() {
  const loaded = readJson(gameKey, null);
  if (!loaded || !Array.isArray(loaded.guesses)) return null;
  return loaded;
}

function calculateScore(result = state.result) {
  if (result === "lost") return 0;
  const effectiveGuessCount = isGameActive(result) ? state.guesses.length + 1 : state.guesses.length;
  const guessPenalty = Math.max(0, effectiveGuessCount - 1) * POINTS_PER_EXTRA_GUESS;
  const hintPenalty = state.extraHintsUsed * POINTS_PER_EXTRA_HINT;
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
  return getRelativeDateId(-1, new Date(`${dateId}T00:00:00Z`), { timeZone: "UTC" });
}

function scheduleDailyRefresh() {
  window.setInterval(() => {
    if (getBilouteDateId() !== todayId) {
      window.location.reload();
    }
  }, 60 * 1000);
}

function renderGameToText() {
  return JSON.stringify({
    screen: "game",
    date: todayId,
    dailyRollover: {
      hour: DAILY_ROLLOVER_HOUR,
      timeZone: DAILY_TIME_ZONE,
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
