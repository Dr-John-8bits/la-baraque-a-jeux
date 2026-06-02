import { getDailyDateId, getRelativeDateId, selectDailyItem } from "../../packages/game-utils/daily.js";
import { fetchJson } from "../../packages/game-utils/fetch-json.js";
import { hashString, seededShuffle } from "../../packages/game-utils/random.js";
import { readJson, writeJson } from "../../packages/game-utils/storage.js";
import { shareText as shareTextWithFallback } from "../../packages/game-utils/share.js";
import { escapeHtml } from "../../packages/game-utils/text-render.js";

const MAX_MISTAKES = 4;
const STORAGE_PREFIX = "lillemele.v1.";
const FIRST_HELP_KEY = `${STORAGE_PREFIX}firstHelpSeen`;
const APP_VERSION = "26.06.02.4";
const DAILY_EPOCH_ID = "2026-01-01";
const DAILY_TIME_ZONE = "Europe/Paris";
const DAILY_ROLLOVER_HOUR = 12;
const SOLUTION_COLOR_CLASSES = [
  "solution-color-1",
  "solution-color-2",
  "solution-color-3",
  "solution-color-4",
];
const SHARE_GLYPHS = ["🟩", "🟨", "🟦", "🟥"];
const DEFAULT_STATS = {
  played: 0,
  won: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastPlayedDateId: "",
  lastWinDateId: "",
};

const puzzles = await fetchJson("../../packages/corpus/lille-mele/puzzles.json");

const els = {
  intro: document.querySelector("#intro"),
  puzzleDate: document.querySelector("#puzzleDate"),
  nextPuzzleCountdown: document.querySelector("#nextPuzzleCountdown"),
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
  firstHelp: document.querySelector("#firstHelp"),
  firstHelpStartButton: document.querySelector("#firstHelpStartButton"),
  toast: document.querySelector("#toast"),
};

const todayId = getLilleMeleDateId();
const reviewedPuzzles = puzzles.filter((candidate) => candidate.status === "reviewed");
const officialPuzzles = reviewedPuzzles.length ? reviewedPuzzles : puzzles;
const puzzle = selectDailyItem(officialPuzzles, todayId, { epochId: DAILY_EPOCH_ID });
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
    dailyDateId: todayId,
    puzzleId: puzzle.id,
    selectedItems: [],
    foundGroupIds: [],
    mistakes: 0,
    status: "in_progress",
    attempts: [],
    itemOrder: seededShuffle(
      puzzle.groups.flatMap((group) => group.items),
      hashString(`${todayId}:${puzzle.id}`)
    ),
    officialResultRecorded: false,
    endedAt: null,
    bonusAnswered: null,
  };
}

function loadState() {
  const key = getStateKey();
  const saved = readJson(key, null);
  if (
    saved &&
    saved.puzzleId === puzzle.id &&
    saved.dailyDateId === todayId &&
    isStateCompatible(saved)
  ) {
    return hydrateState(saved);
  }
  return makeInitialState();
}

function hydrateState(saved) {
  const initial = makeInitialState();
  return {
    ...initial,
    ...saved,
    dailyDateId: todayId,
    puzzleId: puzzle.id,
    selectedItems: Array.isArray(saved.selectedItems) ? saved.selectedItems : [],
    foundGroupIds: Array.isArray(saved.foundGroupIds) ? saved.foundGroupIds : [],
    attempts: Array.isArray(saved.attempts) ? saved.attempts : [],
    itemOrder: Array.isArray(saved.itemOrder) ? saved.itemOrder : initial.itemOrder,
    officialResultRecorded: Boolean(saved.officialResultRecorded || saved.completedRecorded),
    endedAt: saved.endedAt || null,
  };
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
  return `${STORAGE_PREFIX}state.${todayId}.${puzzle.id}`;
}

function getStats() {
  return { ...DEFAULT_STATS, ...readJson(`${STORAGE_PREFIX}stats`, {}) };
}

function setStats(stats) {
  writeJson(`${STORAGE_PREFIX}stats`, stats);
}

function updateStatsIfNeeded() {
  if (state.officialResultRecorded || !["won", "lost"].includes(state.status)) return;
  const stats = getStats();
  if (stats.lastPlayedDateId === todayId) {
    state.officialResultRecorded = true;
    saveState();
    return;
  }

  stats.played += 1;
  stats.lastPlayedDateId = todayId;

  if (state.status === "won") {
    const previousDailyId = getPreviousDailyId(todayId);
    stats.won += 1;
    stats.currentStreak = stats.lastWinDateId === previousDailyId ? stats.currentStreak + 1 : 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
    stats.lastWinDateId = todayId;
  } else {
    stats.currentStreak = 0;
  }

  state.officialResultRecorded = true;
  state.endedAt = state.endedAt || new Date().toISOString();
  setStats(stats);
  saveState();
}

function render() {
  if (state.status === "won" || state.status === "lost") {
    updateStatsIfNeeded();
  }
  const stats = getStats();
  els.intro.textContent = puzzle.intro;
  els.puzzleDate.textContent = formatPuzzleDate(todayId);
  renderCountdown();
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
  const shouldHide = state.status === "lost" || state.foundGroupIds.length === 0;
  els.foundGroups.hidden = shouldHide;
  if (shouldHide) return;

  state.foundGroupIds.forEach((groupId) => {
    const group = puzzle.groups.find((candidate) => candidate.id === groupId);
    if (!group) return;
    els.foundGroups.appendChild(createGroupNode(group));
  });
}

function createGroupNode(group) {
  const node = document.createElement("article");
  node.className = `found-group ${group.difficulty} ${getGroupColorClass(group)}`;
  node.innerHTML = `
    <span class="found-title">${escapeHtml(group.title)}</span>
    <span class="found-items">${group.items.map(escapeHtml).join(" · ")}</span>
  `;
  return node;
}

function renderBoard() {
  els.board.innerHTML = "";
  els.board.className = "board";
  els.board.setAttribute("aria-label", "Cartes à regrouper");

  if (state.status === "lost") {
    renderLostReveal();
    return;
  }

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

function renderLostReveal() {
  els.board.className = "board reveal-board";
  els.board.setAttribute("aria-label", "Réponses révélées");

  puzzle.groups.forEach((group, index) => {
    const node = document.createElement("article");
    const title = document.createElement("span");
    const items = document.createElement("div");

    node.className = `found-group reveal-group ${group.difficulty} ${getGroupColorClass(group)}`;
    node.style.setProperty("--reveal-index", String(index));

    title.className = "reveal-title";
    title.textContent = group.title;

    items.className = "reveal-items";
    group.items.forEach((item) => {
      const card = document.createElement("span");
      card.className = "reveal-card";
      card.textContent = item;
      items.appendChild(card);
    });

    node.append(title, items);
    els.board.appendChild(node);
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
  const groupsHtml = won ? `<div class="found-groups">${allGroups}</div>` : "";
  const bonusHtml = won ? createBonusHtml() : "";
  els.result.innerHTML = `
    <h2>${won ? "Grille démêlée." : "Perdu à Porte des Postes."}</h2>
    <p>${
      won
        ? `${escapeHtml(puzzle.finalNote)} Reviens demain à midi pour une nouvelle grille.`
        : "Les familles sont révélées dans la grille. Reviens demain à midi pour retenter ta chance."
    }</p>
    <p><strong>Erreurs :</strong> ${state.mistakes} / ${MAX_MISTAKES}</p>
    ${groupsHtml}
    ${bonusHtml}
    <div class="result-actions">
      <button type="button" id="shareButton">Partager</button>
    </div>
  `;
  document.querySelector("#shareButton")?.addEventListener("click", shareResult);
  document.querySelectorAll("[data-bonus-answer]").forEach((button) => {
    button.addEventListener("click", () => answerBonus(button.dataset.bonusAnswer === "true"));
  });
}

function createGroupSummary(group, revealed) {
  const nodeClass = `found-group ${group.difficulty} ${getGroupColorClass(group)}`;
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
      state.endedAt = new Date().toISOString();
      els.message.textContent = "Grille démêlée. Prochaine grille demain à midi.";
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
    state.endedAt = new Date().toISOString();
    messageTone = "wrong";
    clearSelectionFeedback();
    els.message.textContent = "Trop d'erreurs. Les réponses se dévoilent.";
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

function clearSelectionFeedback() {
  clearTimeout(visualFeedbackTimer);
  visualFeedback = { items: [], type: "" };
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
  const lines = [`Lille-Mêle #${puzzle.number} · ${todayId}`];
  state.foundGroupIds.forEach((groupId) => {
    lines.push((SHARE_GLYPHS[getGroupIndex(groupId)] || "⬜").repeat(4));
  });
  while (lines.length < 5) lines.push("⬛⬛⬛⬛");
  lines.push(`Erreurs : ${state.mistakes}/${MAX_MISTAKES}`);
  lines.push(window.location.href.split("#")[0]);
  return lines.join("\n");
}

function showToast(text) {
  clearTimeout(toastTimer);
  els.toast.textContent = text;
  els.toast.classList.add("visible");
  toastTimer = setTimeout(() => els.toast.classList.remove("visible"), 1800);
}

function shouldShowFirstHelp() {
  return readJson(FIRST_HELP_KEY, false) !== true;
}

function showFirstHelp() {
  if (!els.firstHelp) return;
  els.firstHelp.hidden = false;
  document.body.classList.add("help-open");
  window.requestAnimationFrame(() => els.firstHelpStartButton?.focus());
}

function hideFirstHelp({ returnFocus = false } = {}) {
  if (!els.firstHelp) return;
  writeJson(FIRST_HELP_KEY, true);
  els.firstHelp.hidden = true;
  document.body.classList.remove("help-open");
  if (returnFocus) els.rulesButton?.focus();
}

function handleHelpKeydown(event) {
  if (event.key === "Escape" && els.firstHelp && !els.firstHelp.hidden) {
    hideFirstHelp({ returnFocus: true });
  }
}

function renderGameToText() {
  const foundItems = new Set(
    puzzle.groups
      .filter((group) => state.foundGroupIds.includes(group.id))
      .flatMap((group) => group.items)
  );
  const lost = state.status === "lost";
  const payload = {
    note: "DOM puzzle. Origin is the top-left viewport; visible tiles are listed in reading order.",
    date: todayId,
    dailyRollover: {
      hour: DAILY_ROLLOVER_HOUR,
      timeZone: DAILY_TIME_ZONE,
      nextAt: getNextRolloverDate().toISOString(),
    },
    puzzle: { id: puzzle.id, number: puzzle.number, title: puzzle.title, status: puzzle.status },
    status: state.status,
    mistakes: state.mistakes,
    mistakesMax: MAX_MISTAKES,
    selectedItems: state.selectedItems,
    foundGroups: state.foundGroupIds,
    activeItems: lost ? [] : state.itemOrder.filter((item) => !foundItems.has(item)),
    revealedGroups: lost
      ? puzzle.groups.map((group) => ({
          id: group.id,
          title: group.title,
          items: group.items,
          difficulty: group.difficulty,
          colorClass: getGroupColorClass(group),
        }))
      : [],
    officialResultRecorded: state.officialResultRecorded,
    message: els.message.textContent,
    canSubmit: !els.submitButton.disabled,
    resultVisible: els.result.classList.contains("visible"),
    firstHelpVisible: Boolean(els.firstHelp && !els.firstHelp.hidden),
    version: APP_VERSION,
  };
  return JSON.stringify(payload);
}

window.render_game_to_text = renderGameToText;
window.advanceTime = () => {
  render();
};

function getGroupIndex(groupOrId) {
  const groupId = typeof groupOrId === "string" ? groupOrId : groupOrId?.id;
  const index = puzzle.groups.findIndex((group) => group.id === groupId);
  return index >= 0 ? index : 0;
}

function getGroupColorClass(group) {
  return SOLUTION_COLOR_CLASSES[getGroupIndex(group) % SOLUTION_COLOR_CLASSES.length];
}

function getLilleMeleDateId(date = new Date()) {
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
    if (getLilleMeleDateId() !== todayId) {
      window.location.reload();
    }
  }, 60 * 1000);
}

function scheduleCountdownRefresh() {
  window.setInterval(renderCountdown, 1000);
}

function renderCountdown() {
  if (!els.nextPuzzleCountdown) return;
  els.nextPuzzleCountdown.textContent = formatDuration(
    getNextRolloverDate().getTime() - Date.now()
  );
}

function getNextRolloverDate(now = new Date()) {
  const parts = getZonedDateTimeParts(now, DAILY_TIME_ZONE);
  const currentDateId = `${parts.year}-${parts.month}-${parts.day}`;
  const targetDateId =
    Number(parts.hour) < DAILY_ROLLOVER_HOUR
      ? currentDateId
      : getRelativeDateId(1, new Date(`${currentDateId}T00:00:00Z`), { timeZone: "UTC" });
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
  return `${String(hours).padStart(2, "0")} h ${String(minutes).padStart(2, "0")}`;
}

function formatPuzzleDate(dateId) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(`${dateId}T00:00:00Z`))
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
els.rulesButton.addEventListener("click", showFirstHelp);
els.firstHelpStartButton?.addEventListener("click", () => hideFirstHelp());
window.addEventListener("keydown", handleHelpKeydown);
window.addEventListener("resize", refitTileLabels);
document.fonts?.ready?.then(refitTileLabels);

scheduleDailyRefresh();
scheduleCountdownRefresh();
render();
if (shouldShowFirstHelp()) showFirstHelp();
