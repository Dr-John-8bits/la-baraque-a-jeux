import { getDailyDateId, getRelativeDateId, selectDailyItem } from "../../packages/game-utils/daily.js";
import { fetchJson } from "../../packages/game-utils/fetch-json.js";
import { readJson, writeJson } from "../../packages/game-utils/storage.js";
import { shareText as shareTextWithFallback } from "../../packages/game-utils/share.js";

const APP_VERSION = "26.05.31.5";
const GAME_URL = new URL(".", window.location.href).href;
const DAILY_TIME_ZONE = "Europe/Paris";
const DAILY_ROLLOVER_HOUR = 12;
const BASE_SCORE = 1000;
const POINTS_PER_EXTRA_GUESS = 120;
const POINTS_PER_EXTRA_HINT = 180;

const WORDS = await fetchJson("../../packages/corpus/le-mot-a-biloute/words.json");

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
  shareButton: document.getElementById("shareButton"),
  hintPanel: document.getElementById("hintPanel"),
  starterHintText: document.getElementById("starterHintText"),
  extraHints: document.getElementById("extraHints"),
  resultDialog: document.getElementById("resultDialog"),
  resultKicker: document.getElementById("resultKicker"),
  resultTitle: document.getElementById("resultTitle"),
  resultSummary: document.getElementById("resultSummary"),
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
};

const todayId = getBilouteDateId();
const word = selectDailyItem(WORDS, todayId, { epochId: "2026-01-01" });
const wordLength = word.answer.length;
const gameKey = `${STORAGE_PREFIX}:game:${todayId}:${word.id}`;
const statsKey = `${STORAGE_PREFIX}:stats`;

const state = loadGame() || {
  guesses: [],
  current: "",
  statuses: [],
  keyStatuses: {},
  extraHintsUsed: 0,
  startedAt: Date.now(),
  endedAt: null,
  result: "playing",
  score: null,
  shareText: "",
};

state.extraHintsUsed = Number.isInteger(state.extraHintsUsed)
  ? state.extraHintsUsed
  : state.hintUsed
    ? 1
    : 0;
if (state.result !== "playing") {
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

  els.hintButton.addEventListener("click", () => {
    if (state.result !== "playing") return;
    if (state.extraHintsUsed >= word.hints.length) return;
    state.extraHintsUsed += 1;
    saveGame();
    render();
  });

  els.shareButton.addEventListener("click", shareResult);
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

function addLetter(letter) {
  if (state.result !== "playing") return;
  const normalized = normalize(letter);
  if (!normalized || state.current.length >= wordLength) return;
  state.current += normalized[0];
  saveGame();
  render();
}

function removeLetter() {
  if (state.result !== "playing") return;
  state.current = state.current.slice(0, -1);
  saveGame();
  render();
}

function submitGuess() {
  if (state.result !== "playing") return;
  const guess = normalize(state.current);

  if (guess.length !== wordLength) {
    shakeCurrentRow();
    announce(`${wordLength} lettres attendues.`);
    return;
  }

  const statuses = scoreGuess(guess, word.answer);
  state.guesses.push(guess);
  state.statuses.push(statuses);
  updateKeyStatuses(guess, statuses);
  state.current = "";

  const accepted = word.acceptedAnswers.map(normalize);
  if (accepted.includes(guess)) {
    finishGame("won");
  } else if (state.guesses.length >= MAX_GUESSES) {
    finishGame("lost");
  } else {
    saveGame();
    render();
  }
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
  saveGame();
  updateStats(result);
  render();
  showResultDialog();
}

function render() {
  els.categoryLabel.textContent = word.category;
  els.tryCount.textContent = `${state.guesses.length}/${MAX_GUESSES}`;
  els.scoreCount.textContent = String(calculateScore(state.result));
  els.streakCount.textContent = String(getStats().streak || 0);
  els.starterHintText.textContent = word.starterHint;
  renderHints();
  els.hintButton.textContent = `Indice -${POINTS_PER_EXTRA_HINT}`;
  els.hintButton.disabled = state.extraHintsUsed >= word.hints.length || state.result !== "playing";
  els.shareButton.disabled = state.result === "playing";
  renderBoard();
  renderKeyboard();
}

function renderHints() {
  els.extraHints.innerHTML = "";
  for (let index = 0; index < state.extraHintsUsed; index += 1) {
    const hint = document.createElement("p");
    hint.className = "extra-hint";
    hint.textContent = `Indice ${index + 2} : ${word.hints[index]}`;
    els.extraHints.append(hint);
  }
}

function renderBoard() {
  els.board.innerHTML = "";
  els.board.style.gridTemplateRows = `repeat(${MAX_GUESSES}, 1fr)`;

  for (let row = 0; row < MAX_GUESSES; row += 1) {
    const rowEl = document.createElement("div");
    rowEl.className = "guess-row";
    rowEl.style.gridTemplateColumns = `repeat(${wordLength}, 1fr)`;

    const committed = state.guesses[row] || "";
    const letters = committed || (row === state.guesses.length ? state.current : "");
    const statuses = state.statuses[row] || [];

    for (let col = 0; col < wordLength; col += 1) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.textContent = letters[col] || "";
      tile.setAttribute("aria-label", `Ligne ${row + 1}, lettre ${col + 1}`);
      if (letters[col]) tile.classList.add("filled");
      if (statuses[col]) tile.classList.add(statuses[col]);
      rowEl.append(tile);
    }

    els.board.append(rowEl);
  }
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

function showResultDialog() {
  const won = state.result === "won";
  const tries = state.guesses.length;
  const score = state.score ?? calculateScore(state.result);
  els.resultKicker.textContent = won ? "Trouvé" : "Terminus";
  els.resultTitle.textContent = won ? `${word.answer} en ${tries} essai${tries > 1 ? "s" : ""}` : `C'était ${word.answer}`;
  els.resultSummary.textContent = `${score} points · ${state.extraHintsUsed} indice${state.extraHintsUsed > 1 ? "s" : ""} payant${state.extraHintsUsed > 1 ? "s" : ""}`;
  els.bonusTitle.textContent = word.bonus.title;
  els.bonusText.textContent = word.bonus.text;
  if (!els.resultDialog.open) els.resultDialog.showModal();
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
  const tries = state.result === "won" ? state.guesses.length : "X";
  return [
    `Le mot à Biloute ${todayId}`,
    `${score} points · ${tries}/${MAX_GUESSES} · ${state.extraHintsUsed} indice${state.extraHintsUsed > 1 ? "s" : ""} payant${state.extraHintsUsed > 1 ? "s" : ""}`,
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

function getStats() {
  return readJson(statsKey, {});
}

function updateStats(result) {
  const stats = {
    played: 0,
    won: 0,
    streak: 0,
    bestScore: null,
    lastPlayed: null,
    ...getStats(),
  };
  if (stats.lastPlayed === todayId) return;

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
}

function renderStats() {
  const stats = getStats();
  els.statPlayed.textContent = String(stats.played || 0);
  els.statWon.textContent = String(stats.won || 0);
  els.statStreak.textContent = String(stats.streak || 0);
  els.statBestScore.textContent = stats.bestScore ? String(stats.bestScore) : "-";
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
  const effectiveGuessCount = result === "playing" ? state.guesses.length + 1 : state.guesses.length;
  const guessPenalty = Math.max(0, effectiveGuessCount - 1) * POINTS_PER_EXTRA_GUESS;
  const hintPenalty = state.extraHintsUsed * POINTS_PER_EXTRA_HINT;
  const score = BASE_SCORE - guessPenalty - hintPenalty;
  return Math.max(result === "playing" ? 0 : 50, score);
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
    score: state.score ?? calculateScore(state.result),
    triesUsed: state.guesses.length,
    triesMax: MAX_GUESSES,
    starterHint: word.starterHint,
    extraHintsUsed: state.extraHintsUsed,
    visibleHints: word.hints.slice(0, state.extraHintsUsed),
    message: els.statusAnnouncer.textContent,
    keyboard: state.keyStatuses,
    version: APP_VERSION,
  });
}
