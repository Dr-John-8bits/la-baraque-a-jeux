"use strict";

const APP_VERSION = "26.05.31.5";
const GAME_URL = new URL(".", window.location.href).href;
const BASE_SCORE = 1000;
const POINTS_PER_EXTRA_GUESS = 120;
const POINTS_PER_EXTRA_HINT = 180;

const WORDS = [
  {
    id: "drache",
    answer: "DRACHE",
    category: "Vocabulaire ch'ti",
    starterHint: "Ça peut ruiner une belle sortie sans demander la permission.",
    hints: ["Météo bien du Nord, version généreuse.", "Grosse pluie en parler régional."],
    acceptedAnswers: ["DRACHE"],
    bonus: {
      title: "Drache",
      text: "Dans le Nord, une drache désigne une grosse pluie. Pas une bruine polie : une vraie démonstration météo.",
    },
  },
  {
    id: "chicon",
    answer: "CHICON",
    category: "Cuisine du Nord",
    starterHint: "Il divise la table, surtout quand il assume son amertume.",
    hints: ["On l'appelle plus souvent endive ailleurs.", "Légume du Nord, souvent servi au gratin."],
    acceptedAnswers: ["CHICON"],
    bonus: {
      title: "Chicon",
      text: "Le chicon, c'est l'endive. En salade ou au gratin, il garde une petite amertume très assumée.",
    },
  },
  {
    id: "fives",
    answer: "FIVES",
    category: "Quartier lillois",
    starterHint: "Un nom court, mais pas une petite histoire.",
    hints: ["Quartier à l'est de Lille.", "Quartier lillois marqué par son histoire industrielle."],
    acceptedAnswers: ["FIVES"],
    bonus: {
      title: "Fives",
      text: "Fives est un quartier lillois à l'est de la ville, longtemps associé aux ateliers, aux rails et à une forte mémoire ouvrière.",
    },
  },
  {
    id: "beffroi",
    answer: "BEFFROI",
    category: "Patrimoine",
    starterHint: "Il donne envie de lever la tête.",
    hints: ["Grande tour emblématique du Nord.", "Tour lilloise utile pour se sentir minuscule."],
    acceptedAnswers: ["BEFFROI"],
    bonus: {
      title: "Beffroi",
      text: "Les beffrois font partie du paysage du Nord. Celui de Lille donne une belle occasion de se sentir minuscule.",
    },
  },
  {
    id: "ducasse",
    answer: "DUCASSE",
    category: "Tradition populaire",
    starterHint: "On y va rarement pour le silence.",
    hints: ["Tradition populaire locale.", "Fête foraine du Nord, souvent bruyante et sucrée."],
    acceptedAnswers: ["DUCASSE"],
    bonus: {
      title: "Ducasse",
      text: "Une ducasse est une fête populaire locale. On y croise facilement des manèges, du sucre et des souvenirs collants.",
    },
  },
  {
    id: "wazemmes",
    answer: "WAZEMMES",
    category: "Quartier lillois",
    starterHint: "Un matin calme peut vite y changer d'avis.",
    hints: ["Quartier lillois connu pour son marché.", "Quartier populaire au sud-ouest du centre de Lille."],
    acceptedAnswers: ["WAZEMMES"],
    bonus: {
      title: "Wazemmes",
      text: "Wazemmes est un quartier populaire et vivant de Lille, notamment connu pour son marché et son ambiance bien remplie.",
    },
  },
  {
    id: "quinquin",
    answer: "QUINQUIN",
    category: "Parler régional",
    starterHint: "Un mot tendre qui a presque une mélodie.",
    hints: ["Mot régional lié à l'enfance.", "Petit enfant dans le parler du Nord."],
    acceptedAnswers: ["QUINQUIN"],
    bonus: {
      title: "Quinquin",
      text: "Le mot quinquin évoque l'enfant dans le parler du Nord. Difficile de le lire sans entendre une berceuse quelque part.",
    },
  },
  {
    id: "frites",
    answer: "FRITES",
    category: "Cuisine du Nord",
    starterHint: "Elles peuvent voler la vedette au plat principal.",
    hints: ["Elles accompagnent beaucoup de débats très sérieux.", "Pommes de terre dorées, reines de la baraque."],
    acceptedAnswers: ["FRITES"],
    bonus: {
      title: "Frites",
      text: "Dans le Nord, les frites ne sont pas seulement un accompagnement. Elles peuvent très vite devenir le sujet principal.",
    },
  },
  {
    id: "braderie",
    answer: "BRADERIE",
    category: "Événement lillois",
    starterHint: "Quand Lille devient un immense terrain de fouille.",
    hints: ["Grand événement populaire lillois.", "Les rues disparaissent sous les moules, les frites et les bonnes affaires."],
    acceptedAnswers: ["BRADERIE"],
    bonus: {
      title: "Braderie",
      text: "La braderie transforme Lille en terrain de fouille géant, entre stands, discussions et piles de moules-frites.",
    },
  },
  {
    id: "biloute",
    answer: "BILOUTE",
    category: "Parler régional",
    starterHint: "Le jeu te tutoie presque avec ce mot.",
    hints: ["Mot affectueux du Nord.", "Il est dans le titre du jeu."],
    acceptedAnswers: ["BILOUTE"],
    bonus: {
      title: "Biloute",
      text: "Biloute est un mot populaire du Nord, souvent employé avec affection. Ici, il signe surtout l'esprit complice du jeu.",
    },
  },
];

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
  messageRow: document.getElementById("messageRow"),
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
  statsButton: document.getElementById("statsButton"),
  statsDialog: document.getElementById("statsDialog"),
  statPlayed: document.getElementById("statPlayed"),
  statWon: document.getElementById("statWon"),
  statStreak: document.getElementById("statStreak"),
  statBestScore: document.getElementById("statBestScore"),
  versionLabel: document.getElementById("versionLabel"),
};

const todayId = getTodayId();
const word = getDailyWord(todayId);
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
announce("À toi de jouer.");

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
    announce(`Indice ${state.extraHintsUsed + 1} révélé. ${POINTS_PER_EXTRA_HINT} points en moins.`);
  });

  els.shareButton.addEventListener("click", shareResult);
  els.dialogShareButton.addEventListener("click", shareResult);
  els.statsButton.addEventListener("click", () => {
    renderStats();
    els.statsDialog.showModal();
  });

  window.advanceTime = () => render();
  window.render_game_to_text = renderGameToText;
}

function getTodayId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDailyWord(dayId) {
  const epoch = Date.UTC(2026, 0, 1);
  const [year, month, day] = dayId.split("-").map(Number);
  const current = Date.UTC(year, month - 1, day);
  const offset = Math.floor((current - epoch) / 86400000);
  return WORDS[((offset % WORDS.length) + WORDS.length) % WORDS.length];
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
    announce(nextPrompt());
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

function nextPrompt() {
  const remaining = MAX_GUESSES - state.guesses.length;
  if (remaining === 1) return "Dernier essai.";
  if (remaining <= 3) return `${remaining} essais restants.`;
  return "On garde le cap.";
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
  els.versionLabel.textContent = `v${APP_VERSION}`;
  renderBoard();
  renderKeyboard();
  if (state.result !== "playing") {
    announce(state.result === "won" ? "Trouvé. Bien joué." : `Réponse : ${word.answer}.`);
  }
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
  els.messageRow.textContent = message;
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
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch (error) {
      if (error && error.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    announce("Résultat copié.");
  } catch {
    announce(text);
  }
}

function getStats() {
  try {
    return JSON.parse(localStorage.getItem(statsKey)) || {};
  } catch {
    return {};
  }
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
    const yesterday = getRelativeDay(-1);
    stats.won += 1;
    stats.streak = stats.lastWin === yesterday ? (stats.streak || 0) + 1 : 1;
    stats.lastWin = todayId;
    stats.bestScore = stats.bestScore ? Math.max(stats.bestScore, state.score) : state.score;
  } else {
    stats.streak = 0;
  }

  localStorage.setItem(statsKey, JSON.stringify(stats));
}

function getRelativeDay(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderStats() {
  const stats = getStats();
  els.statPlayed.textContent = String(stats.played || 0);
  els.statWon.textContent = String(stats.won || 0);
  els.statStreak.textContent = String(stats.streak || 0);
  els.statBestScore.textContent = stats.bestScore ? String(stats.bestScore) : "-";
}

function saveGame() {
  localStorage.setItem(gameKey, JSON.stringify(state));
}

function loadGame() {
  try {
    const raw = localStorage.getItem(gameKey);
    if (!raw) return null;
    const loaded = JSON.parse(raw);
    if (!loaded || !Array.isArray(loaded.guesses)) return null;
    return loaded;
  } catch {
    return null;
  }
}

function calculateScore(result = state.result) {
  if (result === "lost") return 0;
  const effectiveGuessCount = result === "playing" ? state.guesses.length + 1 : state.guesses.length;
  const guessPenalty = Math.max(0, effectiveGuessCount - 1) * POINTS_PER_EXTRA_GUESS;
  const hintPenalty = state.extraHintsUsed * POINTS_PER_EXTRA_HINT;
  const score = BASE_SCORE - guessPenalty - hintPenalty;
  return Math.max(result === "playing" ? 0 : 50, score);
}

function renderGameToText() {
  return JSON.stringify({
    screen: "game",
    date: todayId,
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
    message: els.messageRow.textContent,
    keyboard: state.keyStatuses,
    version: APP_VERSION,
  });
}
