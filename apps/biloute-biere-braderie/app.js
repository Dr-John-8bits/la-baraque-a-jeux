import { shareText as shareTextWithFallback } from "../../packages/game-utils/share.js";
import { readJson, writeJson } from "../../packages/game-utils/storage.js";

const TARGET_SCORE = 5;
const ROUND_DURATION_MS = 3000;
const STORAGE_PREFIX = "biloute-biere-braderie.v1";
const APP_VERSION = "26.06.01.1";
const COUNTDOWN_BEATS = ["CH'TI", "FOU", "MI"];

const CHOICES = {
  biloute: {
    id: "biloute",
    label: "Biloute",
    mark: "BL",
    beats: "biere",
    symbol: "🧢",
    color: "#f3c642",
    ink: "#071b31",
    reason: "Parce que biloute tient mieux la pinte que toi.",
  },
  biere: {
    id: "biere",
    label: "Bière",
    mark: "BI",
    beats: "braderie",
    symbol: "🍺",
    color: "#0b736f",
    ink: "#ffffff",
    reason: "Parce qu'après trois pintes, tu oublies ce que tu voulais chiner.",
  },
  braderie: {
    id: "braderie",
    label: "Braderie",
    mark: "BR",
    beats: "biloute",
    symbol: "🛍️",
    color: "#d21920",
    ink: "#ffffff",
    reason: "Parce que même le plus malin des biloutes finit perdu entre deux tas de vaisselle.",
  },
};

const CHOICE_ORDER = ["biloute", "biere", "braderie"];
const DEFAULT_STATS = {
  played: 0,
  won: 0,
  lost: 0,
  bestStreak: 0,
  currentStreak: 0,
};

const els = {
  playerScore: document.querySelector("#playerScore"),
  computerScore: document.querySelector("#computerScore"),
  roundCount: document.querySelector("#roundCount"),
  playerPickSymbol: document.querySelector("#playerPickSymbol"),
  playerPickName: document.querySelector("#playerPickName"),
  computerPickSymbol: document.querySelector("#computerPickSymbol"),
  computerPickName: document.querySelector("#computerPickName"),
  duelStatus: document.querySelector("#duelStatus"),
  countdownWord: document.querySelector("#countdownWord"),
  countdownTime: document.querySelector("#countdownTime"),
  timerFill: document.querySelector("#timerFill"),
  roundButton: document.querySelector("#roundButton"),
  message: document.querySelector("#message"),
  choices: [...document.querySelectorAll("[data-choice]")],
  resultPanel: document.querySelector("#resultPanel"),
  resultTitle: document.querySelector("#resultTitle"),
  resultText: document.querySelector("#resultText"),
  rulesButton: document.querySelector("#rulesButton"),
  rulesPanel: document.querySelector("#rulesPanel"),
  resetButton: document.querySelector("#resetButton"),
  playAgainButton: document.querySelector("#playAgainButton"),
  shareButton: document.querySelector("#shareButton"),
  historyList: document.querySelector("#historyList"),
  toast: document.querySelector("#toast"),
};

let state = createInitialState();
let toastTimer = 0;
let countdownFrame = 0;
let lastCountdownTick = 0;

bindEvents();
render();

function createInitialState() {
  return {
    version: APP_VERSION,
    playerScore: 0,
    computerScore: 0,
    round: 1,
    status: "playing",
    phase: "ready",
    remainingMs: ROUND_DURATION_MS,
    message: "Lance CH'TI FOU MI, puis choisis avant la fin de MI.",
    tone: "",
    lastRound: null,
    history: [],
    completedRecorded: false,
  };
}

function bindEvents() {
  els.choices.forEach((button) => {
    button.addEventListener("click", () => playRound(button.dataset.choice));
  });
  els.roundButton.addEventListener("click", startRound);
  els.resetButton.addEventListener("click", resetGame);
  els.playAgainButton.addEventListener("click", resetGame);
  els.rulesButton.addEventListener("click", () => {
    els.rulesPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  els.shareButton.addEventListener("click", shareResult);

  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      startRound();
    }
    if (event.key === "1") {
      event.preventDefault();
      playRound("biloute");
    }
    if (event.key === "2") {
      event.preventDefault();
      playRound("biere");
    }
    if (event.key === "3") {
      event.preventDefault();
      playRound("braderie");
    }
    if (event.key.toLowerCase() === "r") resetGame();
    if (event.key.toLowerCase() === "f") toggleFullscreen();
  });

  window.advanceTime = (ms = 1000 / 60) => {
    updateCountdown(ms);
    render();
  };
  window.render_game_to_text = renderGameToText;
}

function startRound() {
  if (state.status !== "playing" || state.phase === "countdown") return;
  state.phase = "countdown";
  state.remainingMs = ROUND_DURATION_MS;
  state.message = "CH'TI... FOU... MI... choisis vite.";
  state.tone = "";
  render();
  startCountdownLoop();
}

function playRound(playerChoiceId) {
  if (state.status !== "playing" || state.phase !== "countdown" || !CHOICES[playerChoiceId]) {
    return;
  }
  stopCountdownLoop();

  const computerChoiceId = getComputerChoice();
  const result = getRoundResult(playerChoiceId, computerChoiceId);
  const playerChoice = CHOICES[playerChoiceId];
  const computerChoice = CHOICES[computerChoiceId];
  let message = "";
  let tone = "";

  if (result === "tie") {
    message = `Égalité : ${playerChoice.label} contre ${computerChoice.label}. Mauvaise foi autorisée, point refusé.`;
    tone = "tie";
  } else if (result === "win") {
    state.playerScore += 1;
    message = `${playerChoice.label} bat ${computerChoice.label}. ${playerChoice.reason}`;
    tone = "win";
  } else {
    state.computerScore += 1;
    message = `${computerChoice.label} bat ${playerChoice.label}. ${computerChoice.reason}`;
    tone = "loss";
  }

  finishRound({
    round: state.round,
    playerChoice: playerChoiceId,
    computerChoice: computerChoiceId,
    result,
    message,
    tone,
  });
}

function finishRound(roundResult) {
  state.lastRound = roundResult;
  state.history.unshift(state.lastRound);
  state.history = state.history.slice(0, 6);
  state.message = roundResult.message;
  state.tone = roundResult.tone;

  if (state.playerScore >= TARGET_SCORE || state.computerScore >= TARGET_SCORE) {
    state.status = state.playerScore >= TARGET_SCORE ? "player_won" : "computer_won";
    state.phase = "finished";
    state.message =
      state.status === "player_won"
        ? "Victoire. Tu peux lever la pinte imaginaire."
        : "Défaite. L'ordi a trop bien chiné cette fois.";
    recordCompletion();
  } else {
    state.round += 1;
    state.phase = "ready";
    state.remainingMs = ROUND_DURATION_MS;
  }

  render();
}

function handleTimeout() {
  if (state.status !== "playing" || state.phase !== "countdown") return;
  stopCountdownLoop();
  const computerChoiceId = getComputerChoice();
  const computerChoice = CHOICES[computerChoiceId];
  state.computerScore += 1;
  finishRound({
    round: state.round,
    playerChoice: null,
    computerChoice: computerChoiceId,
    result: "timeout",
    message: `Trop tard. L'ordi joue ${computerChoice.label} et prend le point.`,
    tone: "loss",
  });
}

function startCountdownLoop() {
  stopCountdownLoop();
  lastCountdownTick = performance.now();
  countdownFrame = window.requestAnimationFrame(tickCountdown);
}

function stopCountdownLoop() {
  if (!countdownFrame) return;
  window.cancelAnimationFrame(countdownFrame);
  countdownFrame = 0;
}

function tickCountdown(now) {
  const elapsed = Math.max(0, now - lastCountdownTick);
  lastCountdownTick = now;
  updateCountdown(elapsed);
  render();
  if (state.phase === "countdown") {
    countdownFrame = window.requestAnimationFrame(tickCountdown);
  }
}

function updateCountdown(elapsedMs) {
  if (state.status !== "playing" || state.phase !== "countdown") return;
  state.remainingMs = Math.max(0, state.remainingMs - elapsedMs);
  if (state.remainingMs <= 0) {
    handleTimeout();
  }
}

function getComputerChoice() {
  return CHOICE_ORDER[Math.floor(Math.random() * CHOICE_ORDER.length)];
}

function getRoundResult(playerChoiceId, computerChoiceId) {
  if (playerChoiceId === computerChoiceId) return "tie";
  return CHOICES[playerChoiceId].beats === computerChoiceId ? "win" : "loss";
}

function resetGame() {
  stopCountdownLoop();
  state = createInitialState();
  render();
}

function recordCompletion() {
  if (state.completedRecorded) return;
  const stats = getStats();
  stats.played += 1;
  if (state.status === "player_won") {
    stats.won += 1;
    stats.currentStreak += 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
  } else {
    stats.lost += 1;
    stats.currentStreak = 0;
  }
  state.completedRecorded = true;
  writeJson(`${STORAGE_PREFIX}:stats`, stats);
}

function getStats() {
  return { ...DEFAULT_STATS, ...readJson(`${STORAGE_PREFIX}:stats`, {}) };
}

function render() {
  els.playerScore.textContent = String(state.playerScore);
  els.computerScore.textContent = String(state.computerScore);
  els.roundCount.textContent = String(state.round);
  els.message.textContent = state.message;
  els.message.className = ["message", state.tone].filter(Boolean).join(" ");

  const finished = state.status !== "playing";
  const canChoose = state.status === "playing" && state.phase === "countdown";
  els.choices.forEach((button) => {
    button.disabled = !canChoose;
  });
  els.roundButton.disabled = finished || state.phase === "countdown";
  els.roundButton.textContent =
    state.phase === "countdown"
      ? "À toi"
      : state.phase === "finished"
        ? "Terminé"
        : state.lastRound
          ? "Manche suivante"
          : "Lancer";

  renderResultPanel();
  renderHistory();
  renderDuelPanel();
  renderTimer();
}

function renderDuelPanel() {
  const waiting = state.phase === "countdown";
  const playerChoice = !waiting && state.lastRound?.playerChoice
    ? CHOICES[state.lastRound.playerChoice]
    : null;
  const computerChoice = !waiting && state.lastRound?.computerChoice
    ? CHOICES[state.lastRound.computerChoice]
    : null;
  els.playerPickSymbol.textContent = waiting ? "!" : playerChoice?.symbol || "?";
  els.playerPickName.textContent = waiting
    ? "Choisis"
    : playerChoice?.label || (state.lastRound?.result === "timeout" ? "Trop tard" : "Choisis");
  els.computerPickSymbol.textContent = waiting ? "?" : computerChoice?.symbol || "?";
  els.computerPickName.textContent = waiting ? "Cache" : computerChoice?.label || "Attend";
  els.duelStatus.textContent = waiting
    ? getCountdownBeat()
    : state.lastRound
    ? state.lastRound.result === "tie"
      ? "="
      : state.lastRound.result === "win"
        ? "+1 toi"
        : "+1 ordi"
    : "VS";
}

function renderTimer() {
  const remaining = state.phase === "countdown" ? state.remainingMs : ROUND_DURATION_MS;
  const ratio = Math.max(0, Math.min(1, remaining / ROUND_DURATION_MS));
  els.countdownWord.textContent =
    state.phase === "countdown" ? getCountdownBeat() : state.lastRound ? "Encore ?" : "Prêt ?";
  els.countdownTime.textContent =
    state.phase === "countdown" ? `${(remaining / 1000).toFixed(1)} s` : "3.0 s";
  els.timerFill.style.transform = `scaleX(${ratio})`;
}

function getCountdownBeat() {
  const elapsed = ROUND_DURATION_MS - state.remainingMs;
  const beatIndex = Math.min(COUNTDOWN_BEATS.length - 1, Math.floor(elapsed / 1000));
  return COUNTDOWN_BEATS[beatIndex];
}

function renderResultPanel() {
  const finished = state.status !== "playing";
  els.resultPanel.hidden = !finished;
  if (!finished) return;

  const won = state.status === "player_won";
  const stats = getStats();
  els.resultTitle.textContent = won ? "Tournée gagnée." : "La braderie t'a retourné.";
  els.resultText.textContent = won
    ? `Score final ${state.playerScore}-${state.computerScore}. Série en cours : ${stats.currentStreak}.`
    : `Score final ${state.playerScore}-${state.computerScore}. Meilleure série : ${stats.bestStreak}.`;
}

function renderHistory() {
  els.historyList.innerHTML = "";
  if (state.history.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "Aucune manche jouée pour l'instant.";
    els.historyList.appendChild(empty);
    return;
  }

  state.history.forEach((round) => {
    const item = document.createElement("li");
    const resultLabel =
      round.result === "timeout"
        ? "Trop tard"
        : round.result === "tie"
          ? "Égalité"
          : round.result === "win"
            ? "Gagnée"
            : "Perdue";
    const playerLabel = round.playerChoice ? CHOICES[round.playerChoice].label : "Trop tard";
    item.innerHTML = `
      <strong>#${round.round} ${resultLabel}</strong>
      <span>Toi : ${escapeHtml(playerLabel)}</span>
      <span>Ordi : ${escapeHtml(CHOICES[round.computerChoice].label)}</span>
    `;
    els.historyList.appendChild(item);
  });
}

async function shareResult() {
  const text = buildShareText();
  const result = await shareTextWithFallback(text);
  if (result === "shared") showToast("Résultat partagé.");
  if (result === "copied") showToast("Résultat copié.");
  if (result === "failed") showToast("Impossible de copier le résultat.");
}

function buildShareText() {
  const outcome = state.status === "player_won" ? "gagné" : "joué";
  return [
    `Biloute · Bière · Braderie : ${outcome} ${state.playerScore}-${state.computerScore}`,
    `Manches jouées : ${state.history.length}`,
    "La baraque à jeux Lille",
    new URL(".", window.location.href).href,
  ].join("\n");
}

function showToast(text) {
  window.clearTimeout(toastTimer);
  els.toast.textContent = text;
  els.toast.classList.add("visible");
  toastTimer = window.setTimeout(() => {
    els.toast.classList.remove("visible");
  }, 1800);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderGameToText() {
  return JSON.stringify({
    coordinateSystem: "no canvas; DOM buttons ordered top to bottom",
    status: state.status,
    phase: state.phase,
    countdown: {
      durationMs: ROUND_DURATION_MS,
      remainingMs: Math.round(state.remainingMs),
      beat: state.phase === "countdown" ? getCountdownBeat() : null,
    },
    targetScore: TARGET_SCORE,
    score: {
      player: state.playerScore,
      computer: state.computerScore,
      round: state.round,
    },
    choices: CHOICE_ORDER.map((id, index) => ({
      key: String(index + 1),
      id,
      label: CHOICES[id].label,
      symbol: CHOICES[id].symbol,
      beats: CHOICES[id].beats,
    })),
    lastRound: state.lastRound,
    message: state.message,
  });
}
