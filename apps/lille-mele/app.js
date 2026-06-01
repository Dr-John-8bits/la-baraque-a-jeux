import { getDateId, selectDailyItem } from "../../packages/game-utils/daily.js";
import { fetchJson } from "../../packages/game-utils/fetch-json.js";
import { hashString, seededShuffle } from "../../packages/game-utils/random.js";
import { readJson, writeJson } from "../../packages/game-utils/storage.js";
import { shareText as shareTextWithFallback } from "../../packages/game-utils/share.js";
import { escapeHtml } from "../../packages/game-utils/text-render.js";

const MAX_MISTAKES = 4;
const STORAGE_PREFIX = "lillemele.v1.";
const APP_VERSION = "26.06.01.3";
const DEFAULT_STATS = {
  played: 0,
  won: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastCompletedPuzzleId: "",
};

const sources = await fetchJson("../../packages/corpus/sources.json");

const puzzles = await fetchJson("../../packages/corpus/lille-mele/puzzles.json");

const els = {
  intro: document.querySelector("#intro"),
  puzzleDate: document.querySelector("#puzzleDate"),
  mistakes: document.querySelector("#mistakes"),
  streak: document.querySelector("#streak"),
  foundGroups: document.querySelector("#foundGroups"),
  board: document.querySelector("#board"),
  message: document.querySelector("#message"),
  actions: document.querySelector(".actions"),
  clearButton: document.querySelector("#clearButton"),
  shuffleButton: document.querySelector("#shuffleButton"),
  submitButton: document.querySelector("#submitButton"),
  result: document.querySelector("#result"),
  rulesButton: document.querySelector("#rulesButton"),
  sourcesButton: document.querySelector("#sourcesButton"),
  rulesPanel: document.querySelector("#rulesPanel"),
  sourcesPanel: document.querySelector("#sourcesPanel"),
  sourceList: document.querySelector("#sourceList"),
  toast: document.querySelector("#toast"),
};

const today = new Date();
const todayId = getDateId(today);
const puzzle = selectDailyItem(puzzles, todayId, { epochId: "2026-01-01" });
const groupByItem = new Map();
puzzle.groups.forEach((group) => {
  group.items.forEach((item) => groupByItem.set(item, group));
});

let state = loadState();
let visualFeedback = { items: [], type: "" };
let visualFeedbackTimer = 0;
let messageTone = "";
let toastTimer = 0;

function makeInitialState() {
  return {
    puzzleId: puzzle.id,
    selectedItems: [],
    foundGroupIds: [],
    mistakes: 0,
    status: "in_progress",
    attempts: [],
    itemOrder: seededShuffle(
      puzzle.groups.flatMap((group) => group.items),
      hashString(puzzle.id)
    ),
    completedRecorded: false,
    bonusAnswered: null,
  };
}

function loadState() {
  const key = getStateKey();
  const saved = readJson(key, null);
  if (saved && saved.puzzleId === puzzle.id && isStateCompatible(saved)) return saved;
  return makeInitialState();
}

function isStateCompatible(saved) {
  const expectedItems = new Set(puzzle.groups.flatMap((group) => group.items));
  const savedItems = new Set(saved.itemOrder || []);
  if (expectedItems.size !== savedItems.size) return false;
  for (const item of expectedItems) {
    if (!savedItems.has(item)) return false;
  }
  return true;
}

function saveState() {
  writeJson(getStateKey(), state);
}

function getStateKey() {
  return `${STORAGE_PREFIX}state.${puzzle.id}`;
}

function getStats() {
  return { ...DEFAULT_STATS, ...readJson(`${STORAGE_PREFIX}stats`, {}) };
}

function setStats(stats) {
  writeJson(`${STORAGE_PREFIX}stats`, stats);
}

function updateStatsIfNeeded() {
  if (state.completedRecorded || !["won", "lost"].includes(state.status)) return;
  const stats = getStats();
  stats.played += 1;
  if (state.status === "won") {
    stats.won += 1;
    stats.currentStreak =
      stats.lastCompletedPuzzleId && stats.lastCompletedPuzzleId !== puzzle.id
        ? stats.currentStreak + 1
        : Math.max(1, stats.currentStreak);
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
  } else {
    stats.currentStreak = 0;
  }
  stats.lastCompletedPuzzleId = puzzle.id;
  state.completedRecorded = true;
  setStats(stats);
  saveState();
}

function render() {
  if (state.status === "won" || state.status === "lost") {
    updateStatsIfNeeded();
  }
  const stats = getStats();
  els.intro.textContent = puzzle.intro;
  els.puzzleDate.textContent = formatPuzzleDate(today);
  els.mistakes.textContent = `${state.mistakes} / ${MAX_MISTAKES}`;
  els.streak.textContent = String(stats.currentStreak || 0);
  els.message.className = `message ${messageTone}`.trim();
  const feedbackActive = visualFeedback.items.length > 0;
  els.actions.hidden = state.status !== "in_progress";
  els.submitButton.disabled =
    state.selectedItems.length !== 4 || state.status !== "in_progress" || feedbackActive;
  els.clearButton.disabled =
    state.selectedItems.length === 0 || state.status !== "in_progress" || feedbackActive;
  els.shuffleButton.disabled = state.status !== "in_progress" || feedbackActive;
  renderFoundGroups();
  renderBoard();
  renderResult();
  saveState();
}

function renderFoundGroups() {
  els.foundGroups.innerHTML = "";
  state.foundGroupIds.forEach((groupId) => {
    const group = puzzle.groups.find((candidate) => candidate.id === groupId);
    if (!group) return;
    els.foundGroups.appendChild(createGroupNode(group));
  });
  if (state.foundGroupIds.length === 0) {
    const empty = document.createElement("div");
    empty.className = "message";
    empty.textContent = "Aucun groupe trouvé pour l'instant.";
    els.foundGroups.appendChild(empty);
  }
}

function createGroupNode(group) {
  const node = document.createElement("article");
  node.className = `found-group ${group.difficulty}`;
  node.innerHTML = `
    <span class="found-title">${escapeHtml(group.title)}</span>
    <span class="found-items">${group.items.map(escapeHtml).join(" · ")}</span>
  `;
  return node;
}

function renderBoard() {
  els.board.innerHTML = "";
  const foundItems = new Set(
    puzzle.groups
      .filter((group) => state.foundGroupIds.includes(group.id))
      .flatMap((group) => group.items)
  );
  const activeItems = state.itemOrder.filter((item) => !foundItems.has(item));

  activeItems.forEach((item) => {
    const tile = document.createElement("button");
    const isSelected = state.selectedItems.includes(item);
    const feedbackType = visualFeedback.items.includes(item) ? visualFeedback.type : "";
    const label = document.createElement("span");
    tile.type = "button";
    tile.className = ["tile", isSelected ? "selected" : "", feedbackType ? `feedback-${feedbackType}` : ""]
      .filter(Boolean)
      .join(" ");
    label.className = "tile-label";
    label.textContent = item;
    tile.appendChild(label);
    tile.setAttribute("aria-pressed", String(isSelected));
    tile.disabled =
      state.status !== "in_progress" ||
      visualFeedback.items.length > 0 ||
      (!isSelected && state.selectedItems.length >= 4);
    tile.addEventListener("click", () => toggleItem(item));
    els.board.appendChild(tile);
    fitTileLabel(tile, label);
  });
}

function renderResult() {
  const finished = state.status === "won" || state.status === "lost";
  els.result.classList.toggle("visible", finished);
  if (!finished) {
    els.result.innerHTML = "";
    return;
  }

  const won = state.status === "won";
  const allGroups = puzzle.groups
    .map((group) => createGroupSummary(group, !state.foundGroupIds.includes(group.id)))
    .join("");
  const bonusHtml = won ? createBonusHtml() : "";
  els.result.innerHTML = `
    <h2>${won ? "Grille démêlée." : "Perdu à Porte des Postes."}</h2>
    <p>${won ? puzzle.finalNote : "La grille t'a eu. Elle avait pourtant l'air sympa."}</p>
    <p><strong>Erreurs :</strong> ${state.mistakes} / ${MAX_MISTAKES}</p>
    <div class="found-groups">${allGroups}</div>
    ${bonusHtml}
    <div class="result-actions">
      <button type="button" id="shareButton">Partager</button>
      <button type="button" id="resetButton">Rejouer la grille</button>
    </div>
  `;
  document.querySelector("#shareButton")?.addEventListener("click", shareResult);
  document.querySelector("#resetButton")?.addEventListener("click", resetPuzzle);
  document.querySelectorAll("[data-bonus-answer]").forEach((button) => {
    button.addEventListener("click", () => answerBonus(button.dataset.bonusAnswer === "true"));
  });
}

function createGroupSummary(group, revealed) {
  const nodeClass = `found-group ${group.difficulty}`;
  const prefix = revealed ? "Révélé : " : "";
  return `
    <article class="${nodeClass}">
      <span class="found-title">${prefix}${escapeHtml(group.title)}</span>
      <span class="found-items">${group.items.map(escapeHtml).join(" · ")}</span>
    </article>
  `;
}

function createBonusHtml() {
  const bonus = puzzle.bonus;
  if (!bonus) return "";
  const answered = state.bonusAnswered !== null;
  const correct = state.bonusAnswered === bonus.answer;
  return `
    <div class="bonus">
      <strong>P'tit Vrai ou Bidon ?</strong>
      <p>${escapeHtml(bonus.question)}</p>
      ${
        answered
          ? `<p><strong>${correct ? "Vrai bon." : "Raté."}</strong> ${escapeHtml(bonus.explanation)}</p>`
          : `<div class="bonus-options">
              <button type="button" data-bonus-answer="true">Vrai</button>
              <button type="button" data-bonus-answer="false">Bidon</button>
            </div>`
      }
    </div>
  `;
}

function toggleItem(item) {
  if (state.status !== "in_progress") return;
  if (state.selectedItems.includes(item)) {
    state.selectedItems = state.selectedItems.filter((selected) => selected !== item);
  } else if (state.selectedItems.length < 4) {
    state.selectedItems.push(item);
  }
  render();
}

function submitSelection() {
  if (state.selectedItems.length !== 4 || state.status !== "in_progress") return;
  const selected = [...state.selectedItems];
  const foundGroup = puzzle.groups.find((group) => {
    if (state.foundGroupIds.includes(group.id)) return false;
    return group.items.every((item) => selected.includes(item));
  });

  if (foundGroup) {
    state.foundGroupIds.push(foundGroup.id);
    state.attempts.push({
      items: selected,
      result: "correct",
      groupId: foundGroup.id,
      createdAt: new Date().toISOString(),
    });
    state.selectedItems = [];
    messageTone = "good";
    els.message.textContent = foundGroup.note || "Bonne correspondance.";
    if (state.foundGroupIds.length === puzzle.groups.length) {
      state.status = "won";
      els.message.textContent = "Grille démêlée. Tu peux descendre à la prochaine.";
    }
    render();
    return;
  }

  const overlap = getMaxOverlap(selected);
  state.mistakes += 1;
  state.attempts.push({
    items: selected,
    result: overlap === 3 ? "one_away" : "incorrect",
    createdAt: new Date().toISOString(),
  });
  state.selectedItems = [];

  if (state.mistakes >= MAX_MISTAKES) {
    state.status = "lost";
    messageTone = "wrong";
    showSelectionFeedback(selected, "wrong");
    els.message.textContent = "Trop d'erreurs. La rame est repartie.";
  } else if (overlap === 3) {
    messageTone = "near";
    showSelectionFeedback(selected, "one-away");
    els.message.textContent = "Tout près : 3 cartes sont dans la même famille.";
  } else {
    messageTone = "wrong";
    showSelectionFeedback(selected, "wrong");
    els.message.textContent = "Mauvaise correspondance.";
  }
  render();
}

function showSelectionFeedback(items, type) {
  clearTimeout(visualFeedbackTimer);
  visualFeedback = { items, type };
  visualFeedbackTimer = setTimeout(() => {
    visualFeedback = { items: [], type: "" };
    render();
  }, type === "one-away" ? 1300 : 760);
}

function getMaxOverlap(selected) {
  return Math.max(
    ...puzzle.groups
      .filter((group) => !state.foundGroupIds.includes(group.id))
      .map((group) => group.items.filter((item) => selected.includes(item)).length)
  );
}

function clearSelection() {
  state.selectedItems = [];
  messageTone = "";
  els.message.textContent = "Sélection effacée.";
  render();
}

function shuffleActiveItems() {
  const foundItems = new Set(
    puzzle.groups
      .filter((group) => state.foundGroupIds.includes(group.id))
      .flatMap((group) => group.items)
  );
  const fixed = state.itemOrder.filter((item) => foundItems.has(item));
  const active = state.itemOrder.filter((item) => !foundItems.has(item));
  state.itemOrder = [...fixed, ...seededShuffle(active, Date.now() % 2147483647)];
  messageTone = "";
  els.message.textContent = "Cartes mélangées.";
  render();
}

function resetPuzzle() {
  state = makeInitialState();
  visualFeedback = { items: [], type: "" };
  messageTone = "";
  els.message.textContent = "Grille réinitialisée.";
  render();
}

function answerBonus(value) {
  state.bonusAnswered = value;
  saveState();
  render();
}

async function shareResult() {
  const text = buildShareText();
  const status = await shareTextWithFallback(text);
  if (status === "copied") {
    showToast("Résultat copié.");
  } else if (status === "failed") {
    showToast("Partage indisponible.");
  }
}

function buildShareText() {
  const lines = [`Lille-Mêle #${puzzle.number}`];
  const colorByGroup = new Map([
    ["easy", "🟩"],
    ["medium", "🟨"],
    ["hard", "🟦"],
    ["tricky", "🟥"],
  ]);
  state.foundGroupIds.forEach((groupId) => {
    const group = puzzle.groups.find((candidate) => candidate.id === groupId);
    lines.push((colorByGroup.get(group?.difficulty) || "⬜").repeat(4));
  });
  while (lines.length < 5) lines.push("⬛⬛⬛⬛");
  lines.push(`Erreurs : ${state.mistakes}/${MAX_MISTAKES}`);
  lines.push(window.location.href.split("#")[0]);
  return lines.join("\n");
}

function renderSources() {
  els.sourceList.innerHTML = "";
  sources.forEach((source) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = source.label;
    item.appendChild(link);
    els.sourceList.appendChild(item);
  });
}

function showToast(text) {
  clearTimeout(toastTimer);
  els.toast.textContent = text;
  els.toast.classList.add("visible");
  toastTimer = setTimeout(() => els.toast.classList.remove("visible"), 1800);
}

function togglePanel(panel) {
  const isVisible = panel.classList.contains("visible");
  els.rulesPanel.classList.remove("visible");
  els.sourcesPanel.classList.remove("visible");
  panel.classList.toggle("visible", !isVisible);
}

function renderGameToText() {
  const foundItems = new Set(
    puzzle.groups
      .filter((group) => state.foundGroupIds.includes(group.id))
      .flatMap((group) => group.items)
  );
  const payload = {
    note: "DOM puzzle. Origin is the top-left viewport; visible tiles are listed in reading order.",
    puzzle: { id: puzzle.id, number: puzzle.number, title: puzzle.title },
    status: state.status,
    mistakes: state.mistakes,
    selectedItems: state.selectedItems,
    foundGroups: state.foundGroupIds,
    activeItems: state.itemOrder.filter((item) => !foundItems.has(item)),
    message: els.message.textContent,
    canSubmit: !els.submitButton.disabled,
    resultVisible: els.result.classList.contains("visible"),
    version: APP_VERSION,
  };
  return JSON.stringify(payload);
}

window.render_game_to_text = renderGameToText;
window.advanceTime = () => {
  render();
};

function formatPuzzleDate(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  })
    .format(date)
    .replace(".", "");
}

function fitTileLabel(tile, label) {
  label.classList.remove("break-anywhere");
  label.style.fontSize = "";

  const width = tile.clientWidth || 80;
  const height = tile.clientHeight || 54;
  const compact = width < 90;
  let size = compact ? 15 : 16;
  const minSize = 9;
  const paddingBuffer = compact ? 10 : 14;

  label.style.fontSize = `${size}px`;
  while (!labelFits(tile, label, paddingBuffer) && size > minSize) {
    size -= 0.5;
    label.style.fontSize = `${size}px`;
  }

  const longestSegment = Math.max(
    ...label.textContent.split(/\s+/).map((segment) => segment.length)
  );
  if ((size <= 11 && longestSegment > 12) || (!labelFits(tile, label, paddingBuffer) && longestSegment > 12)) {
    label.classList.add("break-anywhere");
    size = compact ? 12 : 13;
    label.style.fontSize = `${size}px`;
    while (!labelFits(tile, label, paddingBuffer) && size > 8) {
      size -= 0.5;
      label.style.fontSize = `${size}px`;
    }
  }

  if (label.scrollHeight > height - 6) {
    label.style.fontSize = `${Math.max(8, size - 1)}px`;
  }
}

function labelFits(tile, label, paddingBuffer) {
  return (
    label.scrollWidth <= tile.clientWidth - paddingBuffer &&
    label.scrollHeight <= tile.clientHeight - 6
  );
}

function refitTileLabels() {
  document.querySelectorAll(".tile").forEach((tile) => {
    const label = tile.querySelector(".tile-label");
    if (label) fitTileLabel(tile, label);
  });
}

els.submitButton.addEventListener("click", submitSelection);
els.clearButton.addEventListener("click", clearSelection);
els.shuffleButton.addEventListener("click", shuffleActiveItems);
els.rulesButton.addEventListener("click", () => togglePanel(els.rulesPanel));
els.sourcesButton.addEventListener("click", () => togglePanel(els.sourcesPanel));
window.addEventListener("resize", refitTileLabels);
document.fonts?.ready?.then(refitTileLabels);

renderSources();
render();
