import { shareText as shareTextWithFallback } from "../../packages/game-utils/share.js";
import { readJson, writeJson } from "../../packages/game-utils/storage.js";

const TARGET_SCORE = 5;
const ROUND_DURATION_MS = 3000;
const REVEAL_DURATION_MS = 1100;
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
  playerScorePill: document.querySelector("#playerScore")?.closest(".score-pill"),
  computerScorePill: document.querySelector("#computerScore")?.closest(".score-pill"),
  duelPanel: document.querySelector(".duel-panel"),
  playerPickSymbol: document.querySelector("#playerPickSymbol"),
  playerPickName: document.querySelector("#playerPickName"),
  computerPickSymbol: document.querySelector("#computerPickSymbol"),
  computerPickName: document.querySelector("#computerPickName"),
  duelStatus: document.querySelector("#duelStatus"),
  outcomeBanner: document.querySelector("#outcomeBanner"),
  outcomeIcon: document.querySelector("#outcomeIcon"),
  outcomeTitle: document.querySelector("#outcomeTitle"),
  outcomeDetail: document.querySelector("#outcomeDetail"),
  timerPanel: document.querySelector(".timer-panel"),
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
    revealRemainingMs: 0,
    message: "Lance CH'TI FOU MI, puis choisis avant la fin de MI.",
    tone: "",
    lastRound: null,
    pendingRound: null,
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
    updateRoundClock(ms);
    render();
  };
  window.render_game_to_text = renderGameToText;
}

function startRound() {
  if (state.status !== "playing" || state.phase === "countdown" || state.phase === "revealing") {
    return;
  }
  state.phase = "countdown";
  state.remainingMs = ROUND_DURATION_MS;
  state.revealRemainingMs = 0;
  state.pendingRound = null;
  state.message = "CH'TI... FOU... MI... choisis vite.";
  state.tone = "";
  render();
  startFrameLoop();
}

function playRound(playerChoiceId) {
  if (state.status !== "playing" || state.phase !== "countdown" || !CHOICES[playerChoiceId]) {
    return;
  }
  stopFrameLoop();

  const computerChoiceId = getComputerChoice();
  const result = getRoundResult(playerChoiceId, computerChoiceId);
  const playerChoice = CHOICES[playerChoiceId];
  const computerChoice = CHOICES[computerChoiceId];
  let message = "";
  let tone = "";

  if (result === "tie") {
    message = `ÉGALITÉ. ${playerChoice.label} contre ${computerChoice.label}. Mauvaise foi autorisée, point refusé.`;
    tone = "tie";
  } else if (result === "win") {
    message = `GAGNÉ. ${playerChoice.label} bat ${computerChoice.label}. ${playerChoice.reason}`;
    tone = "win";
  } else {
    message = `PERDU. ${computerChoice.label} bat ${playerChoice.label}. ${computerChoice.reason}`;
    tone = "loss";
  }

  state.pendingRound = {
    round: state.round,
    playerChoice: playerChoiceId,
    computerChoice: computerChoiceId,
    result,
    message,
    tone,
  };
  state.phase = "revealing";
  state.revealRemainingMs = REVEAL_DURATION_MS;
  state.message = "Choix verrouillé. L'ordi révèle son coup...";
  state.tone = "reveal";
  render();
  startFrameLoop();
}

function finishRound(roundResult) {
  applyRoundScore(roundResult);
  state.lastRound = roundResult;
  state.pendingRound = null;
  state.revealRemainingMs = 0;
  state.history.unshift(state.lastRound);
  state.history = state.history.slice(0, 6);
  state.message = roundResult.message;
  state.tone = roundResult.tone;

  if (state.playerScore >= TARGET_SCORE || state.computerScore >= TARGET_SCORE) {
    state.status = state.playerScore >= TARGET_SCORE ? "player_won" : "computer_won";
    state.phase = "finished";
    state.message =
      state.status === "player_won"
        ? "TOURNÉE GAGNÉE. Premier à 5 atteint."
        : "TOURNÉE PERDUE. L'ordi atteint 5 avant toi.";
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
  stopFrameLoop();
  const computerChoiceId = getComputerChoice();
  const computerChoice = CHOICES[computerChoiceId];
  finishRound({
    round: state.round,
    playerChoice: null,
    computerChoice: computerChoiceId,
    result: "timeout",
    message: `TROP TARD. L'ordi joue ${computerChoice.label} et prend le point.`,
    tone: "loss",
  });
}

function applyRoundScore(roundResult) {
  if (roundResult.result === "win") state.playerScore += 1;
  if (roundResult.result === "loss" || roundResult.result === "timeout") {
    state.computerScore += 1;
  }
}

function startFrameLoop() {
  stopFrameLoop();
  lastCountdownTick = performance.now();
  countdownFrame = window.requestAnimationFrame(tickCountdown);
}

function stopFrameLoop() {
  if (!countdownFrame) return;
  window.cancelAnimationFrame(countdownFrame);
  countdownFrame = 0;
}

function tickCountdown(now) {
  const elapsed = Math.max(0, now - lastCountdownTick);
  lastCountdownTick = now;
  updateRoundClock(elapsed);
  render();
  if (state.phase === "countdown" || state.phase === "revealing") {
    countdownFrame = window.requestAnimationFrame(tickCountdown);
  }
}

function updateRoundClock(elapsedMs) {
  if (state.status !== "playing") return;

  if (state.phase === "countdown") {
    state.remainingMs = Math.max(0, state.remainingMs - elapsedMs);
    if (state.remainingMs <= 0) {
      handleTimeout();
    }
  }

  if (state.phase === "revealing") {
    state.revealRemainingMs = Math.max(0, state.revealRemainingMs - elapsedMs);
    if (state.revealRemainingMs <= 0) {
      finishPendingRound();
    }
  }
}

function finishPendingRound() {
  if (state.phase !== "revealing" || !state.pendingRound) return;
  stopFrameLoop();
  finishRound(state.pendingRound);
}

function getComputerChoice() {
  return CHOICE_ORDER[Math.floor(Math.random() * CHOICE_ORDER.length)];
}

function getRoundResult(playerChoiceId, computerChoiceId) {
  if (playerChoiceId === computerChoiceId) return "tie";
  return CHOICES[playerChoiceId].beats === computerChoiceId ? "win" : "loss";
}

function resetGame() {
  stopFrameLoop();
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
  els.roundButton.disabled = finished || state.phase === "countdown" || state.phase === "revealing";
  els.roundButton.textContent =
    state.phase === "countdown"
      ? "À toi"
      : state.phase === "revealing"
        ? "Révélation"
      : state.phase === "finished"
        ? "Terminé"
        : state.lastRound
          ? "Manche suivante"
          : "Lancer";

  renderResultPanel();
  renderHistory();
  renderDuelPanel();
  renderOutcomeBanner();
  renderTimer();
  renderScoreFeedback();
  renderChoiceFeedback();
}

function renderDuelPanel() {
  const waiting = state.phase === "countdown";
  const revealing = state.phase === "revealing";
  const visibleRound = revealing ? state.pendingRound : state.lastRound;
  const playerChoice = !waiting && visibleRound?.playerChoice
    ? CHOICES[visibleRound.playerChoice]
    : null;
  const computerChoice = !waiting && !revealing && visibleRound?.computerChoice
    ? CHOICES[visibleRound.computerChoice]
    : null;
  els.playerPickSymbol.textContent = waiting ? "!" : playerChoice?.symbol || "?";
  els.playerPickName.textContent = waiting
    ? "Choisis"
    : playerChoice?.label || (visibleRound?.result === "timeout" ? "Trop tard" : "Choisis");
  els.computerPickSymbol.textContent = waiting || revealing ? "?" : computerChoice?.symbol || "?";
  els.computerPickName.textContent = waiting || revealing ? "Cache" : computerChoice?.label || "Attend";
  const outcome = getVisibleOutcome();
  els.duelPanel.className = [
    "duel-panel",
    revealing ? "duel-panel--revealing" : "",
    outcome ? `duel-panel--${outcome.tone}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  els.duelStatus.textContent = waiting
    ? getCountdownBeat()
    : revealing
      ? "SUSPENSE"
      : visibleRound
        ? getRoundOutcomeView(visibleRound).duelLabel
      : "VS";
  els.duelStatus.className = [
    "duel-versus",
    waiting ? "duel-versus--countdown" : "",
    revealing ? "duel-versus--revealing" : "",
    outcome ? `duel-versus--${outcome.tone}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function renderOutcomeBanner() {
  const outcome = getVisibleOutcome();
  els.outcomeBanner.hidden = !outcome;
  if (!outcome) return;

  els.outcomeIcon.textContent = outcome.icon;
  els.outcomeTitle.textContent = outcome.title;
  els.outcomeDetail.textContent = outcome.detail;
  els.outcomeBanner.className = ["outcome-banner", `outcome-banner--${outcome.tone}`].join(" ");
}

function renderScoreFeedback() {
  [els.playerScorePill, els.computerScorePill].forEach((pill) => {
    pill.classList.remove("is-leading", "is-last-point", "is-final-winner", "is-final-loser");
  });

  els.playerScorePill.classList.toggle("is-leading", state.playerScore > state.computerScore);
  els.computerScorePill.classList.toggle("is-leading", state.computerScore > state.playerScore);

  const result = state.phase === "ready" || state.phase === "finished" ? state.lastRound?.result : null;
  els.playerScorePill.classList.toggle("is-last-point", result === "win");
  els.computerScorePill.classList.toggle("is-last-point", result === "loss" || result === "timeout");

  els.playerScorePill.classList.toggle("is-final-winner", state.status === "player_won");
  els.computerScorePill.classList.toggle("is-final-winner", state.status === "computer_won");
  els.playerScorePill.classList.toggle("is-final-loser", state.status === "computer_won");
  els.computerScorePill.classList.toggle("is-final-loser", state.status === "player_won");
}

function renderChoiceFeedback() {
  const revealing = state.phase === "revealing";
  const round = state.phase === "countdown" ? null : revealing ? state.pendingRound : state.lastRound;
  const winnerChoice =
    !revealing && round?.result === "win"
      ? round.playerChoice
      : !revealing && (round?.result === "loss" || round?.result === "timeout")
        ? round.computerChoice
        : null;

  els.choices.forEach((button) => {
    const choice = button.dataset.choice;
    button.classList.toggle("is-player-pick", Boolean(round?.playerChoice) && choice === round.playerChoice);
    button.classList.toggle(
      "is-computer-pick",
      !revealing && Boolean(round?.computerChoice) && choice === round.computerChoice
    );
    button.classList.toggle("is-winning-pick", Boolean(winnerChoice) && choice === winnerChoice);
    button.classList.toggle("is-tie-pick", !revealing && round?.result === "tie" && choice === round.playerChoice);
    button.classList.toggle(
      "is-revealing-pick",
      revealing && Boolean(round?.playerChoice) && choice === round.playerChoice
    );
  });
}

function renderTimer() {
  const revealing = state.phase === "revealing";
  const remaining = state.phase === "countdown"
    ? state.remainingMs
    : revealing
      ? state.revealRemainingMs
      : ROUND_DURATION_MS;
  const duration = revealing ? REVEAL_DURATION_MS : ROUND_DURATION_MS;
  const ratio = Math.max(0, Math.min(1, remaining / duration));
  els.timerPanel.className = ["timer-panel", revealing ? "timer-panel--revealing" : ""]
    .filter(Boolean)
    .join(" ");
  els.countdownWord.textContent =
    state.phase === "countdown"
      ? getCountdownBeat()
      : revealing
        ? "Suspense"
        : state.lastRound
          ? "Encore ?"
          : "Prêt ?";
  els.countdownTime.textContent =
    state.phase === "countdown" || revealing ? `${(remaining / 1000).toFixed(1)} s` : "3.0 s";
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
  els.resultPanel.className = ["result-panel", won ? "result-panel--win" : "result-panel--loss"].join(" ");
  els.resultTitle.textContent = won ? "Tournée gagnée." : "La braderie t'a retourné.";
  els.resultText.textContent = won
    ? `Score final ${state.playerScore}-${state.computerScore}. Série en cours : ${stats.currentStreak}.`
    : `Score final ${state.playerScore}-${state.computerScore}. Meilleure série : ${stats.bestStreak}.`;
}

function getVisibleOutcome() {
  if (state.phase === "countdown" || state.phase === "revealing") return null;
  if (state.status === "player_won") {
    return {
      tone: "win",
      icon: "✓",
      title: "Tournée gagnée",
      detail: `Score final ${state.playerScore}-${state.computerScore}`,
    };
  }
  if (state.status === "computer_won") {
    return {
      tone: "loss",
      icon: "!",
      title: "Tournée perdue",
      detail: `Score final ${state.playerScore}-${state.computerScore}`,
    };
  }
  if (!state.lastRound || state.phase === "countdown") return null;
  return getRoundOutcomeView(state.lastRound);
}

function getRoundOutcomeView(round) {
  if (round.result === "win") {
    return {
      tone: "win",
      icon: "+1",
      title: "Manche gagnée",
      detail: "Le point est pour toi",
      duelLabel: "GAGNÉ",
    };
  }
  if (round.result === "loss") {
    return {
      tone: "loss",
      icon: "+1",
      title: "Manche perdue",
      detail: "Le point est pour l'ordi",
      duelLabel: "PERDU",
    };
  }
  if (round.result === "timeout") {
    return {
      tone: "loss",
      icon: "!",
      title: "Trop tard",
      detail: "Le point est pour l'ordi",
      duelLabel: "TROP TARD",
    };
  }
  return {
    tone: "tie",
    icon: "=",
    title: "Égalité",
    detail: "Aucun point marqué",
    duelLabel: "ÉGALITÉ",
  };
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
    coordinateSystem: "no canvas; DOM choice buttons ordered left to right",
    status: state.status,
    phase: state.phase,
    countdown: {
      durationMs: ROUND_DURATION_MS,
      remainingMs: Math.round(state.remainingMs),
      beat: state.phase === "countdown" ? getCountdownBeat() : null,
    },
    reveal: {
      durationMs: REVEAL_DURATION_MS,
      remainingMs: Math.round(state.revealRemainingMs),
      pending:
        state.phase === "revealing"
          ? {
              round: state.pendingRound?.round,
              playerChoice: state.pendingRound?.playerChoice,
              computerChoice: "hidden",
            }
          : null,
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
    visibleOutcome: getVisibleOutcome(),
    message: state.message,
  });
}
