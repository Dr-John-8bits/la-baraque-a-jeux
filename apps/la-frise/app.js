/*
 * La Frise du Nord — jeu de chronologie quotidien.
 * Variante A : on remet 5 faits régionaux dans l'ordre, du plus ancien au plus récent.
 * 3 essais avec feedback : à chaque validation, les cartes bien placées passent au vert,
 * se verrouillent et révèlent leur date (repère pour placer les autres).
 * Cadence et identité partagées avec les autres jeux (daily.js, calepin, partage, SW).
 */
import { getDailyDateId, getRelativeDateId } from "../../packages/game-utils/daily.js";
import { fetchJson } from "../../packages/game-utils/fetch-json.js";
import { readJson, writeJson } from "../../packages/game-utils/storage.js";
import { shareText as shareTextWithFallback } from "../../packages/game-utils/share.js";
import { escapeHtml } from "../../packages/game-utils/text-render.js";
import { renderCalepin, setupCalepinTools } from "../../packages/ui/calepin.js";

const APP_VERSION = "26.06.15.2";
const DAILY_EPOCH_ID = "2026-01-01";
const DAILY_TIME_ZONE = "Europe/Paris";
const DAILY_ROLLOVER_HOUR = 12;
const SET_SIZE = 5; // nombre de faits à ordonner par jour
const MAX_ATTEMPTS = 3; // essais avant révélation
const MIN_GAP = 3; // écart d'années minimal entre deux faits d'une frise (ordre net, cf. specifications.md §5)
const CORPUS_URL = "../../packages/corpus/la-frise/events.json";
const GAME_URL = new URL(".", window.location.href).href;
const STORAGE_PREFIX = "la-frise.v1.";
const STORAGE_KEYS = {
  currentGame: `${STORAGE_PREFIX}currentGame`,
  stats: `${STORAGE_PREFIX}stats`,
  help: `${STORAGE_PREFIX}helpSeen`,
};
const CATEGORY_LABELS = {
  histoire: "Histoire",
  patrimoine: "Patrimoine",
  transport: "Transport",
  culture: "Culture",
  sport: "Sport",
  "industrie-social": "Industrie & société",
};

/* ------------------------------------------------------------------ *
 * Moteur (exporté pour les tests)
 * ------------------------------------------------------------------ */
function getTodayId(date = new Date()) {
  return getDailyDateId(date, { timeZone: DAILY_TIME_ZONE, rolloverHour: DAILY_ROLLOVER_HOUR });
}
export function comparableYear(event) {
  if (event.precision === "siecle") {
    const century = event.year > 100 ? Math.floor(event.year / 100) + 1 : event.year;
    return century * 100 - 50;
  }
  return event.year;
}
export function scoreOrder(order) {
  const solution = [...order].sort((a, b) => comparableYear(a) - comparableYear(b));
  const perEvent = order.map((ev, i) => Boolean(solution[i] && solution[i].id === ev.id));
  return { exact: perEvent.filter(Boolean).length, total: order.length, perEvent };
}
export function checkBeforeAfter(candidate, anchor, answer) {
  const isAfter = comparableYear(candidate) >= comparableYear(anchor);
  return (answer === "apres") === isAfter;
}

/* ------------------------------------------------------------------ *
 * Tirage déterministe du jour (PRNG mulberry32 amorcé par la date)
 * ------------------------------------------------------------------ */
function daysSinceEpoch(dateId) {
  return Math.floor((Date.parse(`${dateId}T00:00:00Z`) - Date.parse(`${DAILY_EPOCH_ID}T00:00:00Z`)) / 86400000);
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffled(list, rng) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function pickDailySet(events, dateId) {
  const seed = daysSinceEpoch(dateId);
  const pool = shuffled(events, mulberry32(seed >>> 0));
  const chosen = [];
  for (const ev of pool) {
    if (!Number.isFinite(comparableYear(ev))) continue;
    const y = comparableYear(ev);
    if (chosen.every((c) => Math.abs(comparableYear(c) - y) >= MIN_GAP)) chosen.push(ev);
    if (chosen.length === SET_SIZE) break;
  }
  return chosen;
}
function scrambleOrder(set, dateId) {
  const ids = set.map((e) => e.id);
  const solution = [...set].sort((a, b) => comparableYear(a) - comparableYear(b)).map((e) => e.id);
  let order = shuffled(ids, mulberry32((daysSinceEpoch(dateId) ^ 0x9e3779b9) >>> 0));
  if (order.join() === solution.join()) order = [...order.slice(1), order[0]];
  return order;
}

/* ------------------------------------------------------------------ *
 * État
 * ------------------------------------------------------------------ */
const DEFAULT_STATS = {
  played: 0,
  won: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastPlayedDateId: null,
  lastWinDateId: null,
  history: [],
};

let events = [];
let todayId = getTodayId();
let dailySet = [];
let byId = new Map();
let state = null;
let stats = DEFAULT_STATS;
let dragId = null;

const els = {};
function cacheEls() {
  [
    "instruction", "cardList", "validateButton", "revealPanel", "yesterdayLine",
    "nextFriseCountdown", "statusDate", "statusScore", "statusStreak", "shareButton",
    "calepinButton", "rulesButton", "toast",
    "statsDialog", "statsList", "statsHistory", "statsChart",
    "exportStatsButton", "importStatsButton", "importStatsInput",
    "firstHelp", "helpStartButton", "helpOptOut", "rulesDialog",
  ].forEach((id) => (els[id] = document.getElementById(id)));
}

const isTerminal = () => state && state.status !== "playing";

/* ------------------------------------------------------------------ *
 * Init
 * ------------------------------------------------------------------ */
async function init() {
  cacheEls();
  try {
    const corpus = await fetchJson(CORPUS_URL);
    events = (corpus.events || []).filter((e) => e && Number.isFinite(comparableYear(e)));
  } catch (error) {
    if (els.instruction) els.instruction.textContent = "Frise indisponible : vérifie ta connexion, puis recharge.";
    console.error("[La Frise du Nord] corpus introuvable :", error);
    return;
  }
  byId = new Map(events.map((e) => [e.id, e]));
  stats = sanitizeStats(readJson(STORAGE_KEYS.stats, DEFAULT_STATS));
  loadDay();
  bindEvents();
  if (!localStorage.getItem(STORAGE_KEYS.help)) openDialog(els.firstHelp);
  render();
  renderYesterday();
  startCountdown();
  exposeTestHook();
}

function loadDay() {
  todayId = getTodayId();
  dailySet = pickDailySet(events, todayId);
  const saved = readJson(STORAGE_KEYS.currentGame, null);
  if (
    saved &&
    saved.dateId === todayId &&
    Array.isArray(saved.order) &&
    saved.order.length === dailySet.length &&
    saved.order.every((id) => byId.has(id))
  ) {
    state = {
      dateId: todayId,
      order: saved.order,
      lockedIds: Array.isArray(saved.lockedIds) ? saved.lockedIds.filter((id) => byId.has(id)) : [],
      attempts: Number(saved.attempts) || 0,
      attemptScores: Array.isArray(saved.attemptScores) ? saved.attemptScores : [],
      status: ["playing", "won", "lost"].includes(saved.status) ? saved.status : "playing",
      score: saved.score || null,
    };
  } else {
    state = freshState();
  }
}
function freshState() {
  return {
    dateId: todayId,
    order: scrambleOrder(dailySet, todayId),
    lockedIds: [],
    attempts: 0,
    attemptScores: [],
    status: "playing",
    score: null,
  };
}
function saveGame() {
  writeJson(STORAGE_KEYS.currentGame, state);
}

/* ------------------------------------------------------------------ *
 * Rendu
 * ------------------------------------------------------------------ */
function orderedEvents() {
  return state.order.map((id) => byId.get(id));
}
function render() {
  if (!state) return;
  const terminal = isTerminal();
  if (els.statusDate) els.statusDate.textContent = formatDay(todayId);
  if (els.statusStreak) els.statusStreak.textContent = String(stats.currentStreak || 0);
  if (els.statusScore) {
    els.statusScore.textContent = state.score ? `${state.score.exact}/${SET_SIZE}` : `–/${SET_SIZE}`;
  }
  if (els.instruction) els.instruction.textContent = instructionText();
  renderCards();
  if (els.validateButton) {
    els.validateButton.disabled = terminal;
    els.validateButton.textContent = terminal
      ? state.status === "won" ? "Frise résolue" : "Frise révélée"
      : state.attempts > 0 ? `Valider (essai ${state.attempts + 1}/${MAX_ATTEMPTS})` : "Valider";
  }
  if (els.shareButton) els.shareButton.hidden = !terminal;
  renderReveal();
}

function instructionText() {
  if (state.status === "won") return `Bravo ! Résolu en ${state.attempts} essai${state.attempts > 1 ? "s" : ""}.`;
  if (state.status === "lost") return "Raté — l'ordre exact se révèle.";
  if (state.attempts > 0) return `Essai ${state.attempts + 1}/${MAX_ATTEMPTS} · les cartes vertes sont bien placées, réarrange les autres.`;
  return "Remets les faits dans l'ordre, du plus ancien au plus récent.";
}

function renderCards() {
  if (!els.cardList) return;
  const terminal = isTerminal();
  const locked = new Set(state.lockedIds);
  const list = orderedEvents();
  els.cardList.innerHTML = list
    .map((ev, i) => {
      const isLocked = locked.has(ev.id);
      const revealed = isLocked || terminal; // les cartes verrouillées (ou en fin de partie) montrent leur date
      const stateClass = isLocked ? " is-correct" : terminal ? " is-wrong" : "";
      const movable = !terminal && !isLocked;
      const lead = revealed
        ? `<span class="frise-card__year">${ev.year}</span>`
        : `<span class="frise-card__rank" aria-hidden="true">${i + 1}</span>`;
      const cat = CATEGORY_LABELS[ev.category] || ev.category || "";
      const controls = movable
        ? `<span class="frise-card__moves">
             <button type="button" class="frise-move" data-move="up" data-id="${ev.id}" aria-label="Monter « ${escapeHtml(ev.label)} »">▲</button>
             <button type="button" class="frise-move" data-move="down" data-id="${ev.id}" aria-label="Descendre « ${escapeHtml(ev.label)} »">▼</button>
           </span>`
        : "";
      return `<li class="frise-card${stateClass}" data-id="${ev.id}" data-index="${i}"${movable ? ' draggable="true"' : ""}>
        ${lead}
        <span class="frise-card__body">
          <span class="frise-card__label">${escapeHtml(ev.label)}</span>
          ${cat ? `<span class="frise-card__cat">${escapeHtml(cat)}</span>` : ""}
        </span>
        ${controls}
      </li>`;
    })
    .join("");
  // désactive les flèches sans cible (carte non verrouillée isolée en bout)
  const unlocked = state.order.filter((id) => !locked.has(id));
  if (unlocked.length) {
    els.cardList.querySelector(`.frise-move[data-id="${unlocked[0]}"][data-move="up"]`)?.setAttribute("disabled", "");
    els.cardList.querySelector(`.frise-move[data-id="${unlocked[unlocked.length - 1]}"][data-move="down"]`)?.setAttribute("disabled", "");
  }
}

function renderReveal() {
  if (!els.revealPanel) return;
  if (!isTerminal()) {
    els.revealPanel.hidden = true;
    els.revealPanel.innerHTML = "";
    return;
  }
  const solution = [...dailySet].sort((a, b) => comparableYear(a) - comparableYear(b));
  const rows = solution
    .map(
      (ev) => `<article class="reveal-card">
        <p class="reveal-card__top"><span class="reveal-card__year">${ev.year}</span><span class="reveal-card__cat">${escapeHtml(CATEGORY_LABELS[ev.category] || ev.category || "")}</span></p>
        <h3>${escapeHtml(ev.label)}</h3>
        ${ev.blurb ? `<p class="reveal-card__blurb">${escapeHtml(ev.blurb)}</p>` : ""}
        <p class="reveal-card__source">Source : ${escapeHtml(sourceLabel(ev))}</p>
      </article>`
    )
    .join("");
  els.revealPanel.hidden = false;
  els.revealPanel.innerHTML = `
    <p class="eyebrow">Les dates</p>
    <div class="reveal-cards">${rows}</div>
    <p class="next-frise-line">Prochaine frise demain à 12 h.</p>`;
}

function sourceLabel(ev) {
  const id = (ev.sourceIds || [])[0] || "";
  if (id === "wikidata") return "Wikidata (CC0)";
  if (id === "wikipedia-fr") return "Wikipédia";
  return id || "—";
}

/* ------------------------------------------------------------------ *
 * Réordonnancement (flèches + glisser-déposer) — respecte les cartes verrouillées
 * ------------------------------------------------------------------ */
function reinterleave(unlockedSeq, lockedSet) {
  let u = 0;
  return state.order.map((id) => (lockedSet.has(id) ? id : unlockedSeq[u++]));
}
function moveCard(id, dir) {
  if (isTerminal()) return;
  const locked = new Set(state.lockedIds);
  if (locked.has(id)) return;
  const unlocked = state.order.filter((x) => !locked.has(x));
  const u = unlocked.indexOf(id);
  const target = u + (dir === "up" ? -1 : 1);
  if (target < 0 || target >= unlocked.length) return;
  [unlocked[u], unlocked[target]] = [unlocked[target], unlocked[u]];
  state.order = reinterleave(unlocked, locked);
  saveGame();
  render();
  els.cardList?.querySelector(`.frise-move[data-id="${id}"][data-move="${dir}"]:not([disabled])`)?.focus();
}
function reorderByDrop(fromId, toId) {
  if (isTerminal() || fromId === toId) return;
  const locked = new Set(state.lockedIds);
  if (locked.has(fromId) || locked.has(toId)) return;
  const unlocked = state.order.filter((x) => !locked.has(x));
  const from = unlocked.indexOf(fromId);
  const to = unlocked.indexOf(toId);
  if (from < 0 || to < 0) return;
  unlocked.splice(to, 0, unlocked.splice(from, 1)[0]);
  state.order = reinterleave(unlocked, locked);
  saveGame();
  render();
}

/* ------------------------------------------------------------------ *
 * Validation (jusqu'à MAX_ATTEMPTS essais)
 * ------------------------------------------------------------------ */
function validate() {
  if (!state || isTerminal()) return;
  const score = scoreOrder(orderedEvents());
  state.attempts += 1;
  state.score = score;
  state.attemptScores = [...(state.attemptScores || []), score.perEvent];
  // verrouille les cartes bien placées (et repère celles qui le deviennent CE tour)
  const wasLocked = new Set(state.lockedIds);
  const allCorrect = orderedEvents().filter((ev, i) => score.perEvent[i]).map((e) => e.id);
  const newlyLocked = allCorrect.filter((id) => !wasLocked.has(id));
  state.lockedIds = [...new Set([...state.lockedIds, ...allCorrect])];

  if (score.exact === score.total) state.status = "won";
  else if (state.attempts >= MAX_ATTEMPTS) state.status = "lost";

  if (isTerminal()) updateStats();
  saveGame();
  render();
  playFeedback(newlyLocked);
  if (isTerminal()) {
    celebrate();
    els.revealPanel?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } else {
    showToast(`${score.exact}/${SET_SIZE} bien placées. Encore ${MAX_ATTEMPTS - state.attempts} essai${MAX_ATTEMPTS - state.attempts > 1 ? "s" : ""}.`);
  }
}

// Retour visuel après validation : flip révélateur sur les cartes qui se verrouillent,
// tremblement sur celles encore mal placées.
function playFeedback(newlyLocked) {
  if (!els.cardList) return;
  const fresh = new Set(newlyLocked);
  const locked = new Set(state.lockedIds);
  let i = 0;
  els.cardList.querySelectorAll(".frise-card").forEach((card) => {
    const id = card.dataset.id;
    if (fresh.has(id)) {
      card.style.setProperty("--flip-delay", `${i * 90}ms`);
      card.classList.add("is-flipping");
      i += 1;
    } else if (!locked.has(id)) {
      card.classList.add("is-shaking");
    }
  });
}

function updateStats() {
  if (stats.lastPlayedDateId === todayId) return;
  const won = state.status === "won";
  stats.played += 1;
  if (won) {
    stats.won += 1;
    const continues = stats.lastWinDateId === getRelativeDateId(-1, new Date(), { timeZone: DAILY_TIME_ZONE });
    stats.currentStreak = continues ? stats.currentStreak + 1 : 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
    stats.lastWinDateId = todayId;
  } else {
    stats.currentStreak = 0;
  }
  stats.lastPlayedDateId = todayId;
  stats.history = [{ date: todayId, won, attempts: state.attempts, exact: state.score.exact }, ...stats.history].slice(0, 60);
  writeJson(STORAGE_KEYS.stats, stats);
}

function celebrate() {
  showToast(
    state.status === "won"
      ? `Résolu en ${state.attempts} essai${state.attempts > 1 ? "s" : ""}, biloute ! 🎉`
      : "Frise révélée — à demain midi."
  );
}

/* ------------------------------------------------------------------ *
 * Partage (spoiler-free : une rangée par essai)
 * ------------------------------------------------------------------ */
function buildShareText() {
  const head = state.status === "won" ? `${state.attempts}/${MAX_ATTEMPTS}` : `✗/${MAX_ATTEMPTS}`;
  const rows = (state.attemptScores || []).map((pe) => pe.map((ok) => (ok ? "🟩" : "⬛")).join("")).join("\n");
  return [`La Frise du Nord ${todayId} ${head}`, rows, GAME_URL].filter(Boolean).join("\n");
}
async function shareResult() {
  const ok = await shareTextWithFallback(buildShareText());
  showToast(ok === "copied" ? "Résultat copié !" : ok === "shared" ? "Merci du partage !" : "Partage indisponible.");
}

/* ------------------------------------------------------------------ *
 * Calepin (stats partagées)
 * ------------------------------------------------------------------ */
function openCalepin() {
  renderCalepinStats();
  openDialog(els.statsDialog);
}
function renderCalepinStats() {
  const winRate = stats.played ? Math.round((stats.won / stats.played) * 100) : 0;
  renderCalepin(
    { statsList: els.statsList, history: els.statsHistory, chart: els.statsChart },
    {
      metrics: [
        { label: "Frises jouées", value: stats.played },
        { label: "Résolues", value: stats.won },
        { label: "Réussite", value: `${winRate}%` },
        { label: "Série en cours", value: stats.currentStreak || 0 },
        { label: "Meilleure série", value: stats.bestStreak || 0 },
      ],
      historyLines: (stats.history || []).map(
        (h) => `${h.date} · ${h.won ? `résolu en ${h.attempts || "?"} essai${(h.attempts || 0) > 1 ? "s" : ""}` : `${h.exact}/${SET_SIZE} · raté`}`
      ),
      perfBars: (stats.history || [])
        .slice(0, 7)
        .reverse()
        .map((h) => ({
          ratio: Math.max(0, Math.min(1, (Number(h.exact) || 0) / SET_SIZE)),
          result: h.won ? "won" : "lost",
          label: h.exact ?? 0,
          ariaLabel: `${h.date} : ${h.exact}/${SET_SIZE}`,
        })),
      historyEmpty: "Aucune frise terminée pour l'instant.",
      perfEmpty: "Pas encore assez de frises.",
    }
  );
}
function sanitizeStats(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  return {
    played: num(r.played),
    won: num(r.won),
    currentStreak: num(r.currentStreak),
    bestStreak: num(r.bestStreak),
    lastPlayedDateId: typeof r.lastPlayedDateId === "string" ? r.lastPlayedDateId : null,
    lastWinDateId: typeof r.lastWinDateId === "string" ? r.lastWinDateId : null,
    history: Array.isArray(r.history)
      ? r.history
          .filter((h) => h && typeof h.date === "string")
          .map((h) => ({ date: h.date, won: Boolean(h.won), attempts: num(h.attempts), exact: num(h.exact) }))
          .slice(0, 60)
      : [],
  };
}

/* ------------------------------------------------------------------ *
 * Frise d'hier + compte à rebours
 * ------------------------------------------------------------------ */
function renderYesterday() {
  if (!els.yesterdayLine) return;
  const yId = getRelativeDateId(-1, new Date(), { timeZone: DAILY_TIME_ZONE });
  const set = pickDailySet(events, yId);
  if (set.length < 2) { els.yesterdayLine.textContent = ""; return; }
  const sorted = [...set].sort((a, b) => comparableYear(a) - comparableYear(b));
  els.yesterdayLine.textContent = `Frise d'hier : de « ${sorted[0].label} » (${sorted[0].year}) à « ${sorted[sorted.length - 1].label} » (${sorted[sorted.length - 1].year}).`;
}

function startCountdown() {
  const tick = () => {
    if (getTodayId() !== todayId) { location.reload(); return; }
    if (els.nextFriseCountdown) els.nextFriseCountdown.textContent = `Prochaine frise dans ${msToNextNoon()}.`;
  };
  tick();
  setInterval(tick, 1000 * 30);
}
function msToNextNoon() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DAILY_TIME_ZONE, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const get = (t) => Number(parts.find((p) => p.type === t)?.value || 0);
  let secondsLeft = (DAILY_ROLLOVER_HOUR - get("hour")) * 3600 - get("minute") * 60 - get("second");
  if (secondsLeft <= 0) secondsLeft += 24 * 3600;
  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  return `${h} h ${String(m).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ *
 * Dialogues + toast
 * ------------------------------------------------------------------ */
function openDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
  else dialog.setAttribute("open", "");
}
function closeDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}
let toastTimer = 0;
function showToast(message) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("is-visible"), 2600);
}

/* ------------------------------------------------------------------ *
 * Liaisons
 * ------------------------------------------------------------------ */
function bindEvents() {
  els.validateButton?.addEventListener("click", validate);
  els.shareButton?.addEventListener("click", shareResult);
  els.calepinButton?.addEventListener("click", openCalepin);
  els.rulesButton?.addEventListener("click", () => openDialog(els.rulesDialog));

  els.cardList?.addEventListener("click", (e) => {
    const btn = e.target.closest(".frise-move");
    if (btn) moveCard(btn.dataset.id, btn.dataset.move);
  });
  els.cardList?.addEventListener("dragstart", (e) => {
    const li = e.target.closest(".frise-card");
    if (!li || !li.getAttribute("draggable")) return;
    dragId = li.dataset.id;
    li.classList.add("is-dragging");
    e.dataTransfer.effectAllowed = "move";
  });
  els.cardList?.addEventListener("dragend", (e) => {
    e.target.closest(".frise-card")?.classList.remove("is-dragging");
    dragId = null;
  });
  els.cardList?.addEventListener("dragover", (e) => {
    if (dragId) e.preventDefault();
  });
  els.cardList?.addEventListener("drop", (e) => {
    const li = e.target.closest(".frise-card");
    if (li && dragId) { e.preventDefault(); reorderByDrop(dragId, li.dataset.id); }
  });

  els.helpStartButton?.addEventListener("click", () => {
    if (els.helpOptOut?.checked) localStorage.setItem(STORAGE_KEYS.help, "1");
    closeDialog(els.firstHelp);
  });

  setupCalepinTools(
    { exportButton: els.exportStatsButton, importButton: els.importStatsButton, importInput: els.importStatsInput },
    {
      statsKey: STORAGE_KEYS.stats,
      fileName: "calepin-la-frise.json",
      gameName: "La Frise du Nord",
      sanitize: sanitizeStats,
      getStats: () => stats,
      onImported: (clean) => { stats = sanitizeStats(clean); renderCalepinStats(); render(); showToast("Calepin importé."); },
    }
  );

  document.querySelectorAll("[data-close-dialog]").forEach((btn) => {
    btn.addEventListener("click", () => closeDialog(btn.closest("dialog")));
  });
}

/* ------------------------------------------------------------------ *
 * Format + hook de test
 * ------------------------------------------------------------------ */
function formatDay(dateId) {
  const [, m, d] = dateId.split("-").map(Number);
  const mois = ["janv.", "févr.", "mars", "avril", "mai", "juin", "juill.", "août", "sept.", "oct.", "nov.", "déc."];
  return `${d} ${mois[m - 1]}`;
}
function exposeTestHook() {
  window.render_game_to_text = () =>
    JSON.stringify({
      game: "la-frise",
      version: APP_VERSION,
      date: todayId,
      setSize: dailySet.length,
      order: state.order,
      lockedIds: state.lockedIds,
      attempts: state.attempts,
      maxAttempts: MAX_ATTEMPTS,
      status: state.status,
      score: state.score,
      labels: orderedEvents().map((e) => e.label),
    });
}

init();
