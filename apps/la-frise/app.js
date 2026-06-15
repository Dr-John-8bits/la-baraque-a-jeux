/*
 * La Frise du Nord — jeu de chronologie quotidien.
 * Variante A : on remet 5 faits régionaux dans l'ordre, du plus ancien au plus récent.
 * Cadence et identité partagées avec les autres jeux (daily.js, calepin, partage, SW).
 */
import { getDailyDateId, getRelativeDateId } from "../../packages/game-utils/daily.js";
import { fetchJson } from "../../packages/game-utils/fetch-json.js";
import { readJson, writeJson } from "../../packages/game-utils/storage.js";
import { shareText as shareTextWithFallback } from "../../packages/game-utils/share.js";
import { escapeHtml } from "../../packages/game-utils/text-render.js";
import { renderCalepin, setupCalepinTools } from "../../packages/ui/calepin.js";

const APP_VERSION = "26.06.15.0";
const DAILY_EPOCH_ID = "2026-01-01";
const DAILY_TIME_ZONE = "Europe/Paris";
const DAILY_ROLLOVER_HOUR = 12;
const SET_SIZE = 5; // nombre de faits à ordonner par jour
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
// Choisit SET_SIZE faits aux années distinctes et bien séparées (ordre non ambigu).
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
// Mélange de départ : différent de la solution (sinon on rote la pile).
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
  bestScore: 0,
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
  if (saved && saved.dateId === todayId && Array.isArray(saved.order) && saved.order.length === dailySet.length) {
    state = {
      dateId: todayId,
      order: saved.order.filter((id) => byId.has(id)),
      submitted: Boolean(saved.submitted),
      score: saved.score || null,
    };
    if (state.order.length !== dailySet.length) state = freshState();
  } else {
    state = freshState();
  }
}
function freshState() {
  return { dateId: todayId, order: scrambleOrder(dailySet, todayId), submitted: false, score: null };
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
  if (els.statusDate) els.statusDate.textContent = formatDay(todayId);
  if (els.statusStreak) els.statusStreak.textContent = String(stats.currentStreak || 0);
  if (els.statusScore) {
    els.statusScore.textContent = state.submitted && state.score ? `${state.score.exact}/${state.score.total}` : `–/${SET_SIZE}`;
  }
  if (els.instruction) {
    els.instruction.textContent = state.submitted
      ? state.score.exact === state.score.total
        ? "Sans faute ! Frise parfaite."
        : `${state.score.exact}/${state.score.total} bien placés. Les dates sont révélées.`
      : "Remets les faits dans l'ordre, du plus ancien au plus récent.";
  }
  renderCards();
  if (els.validateButton) {
    els.validateButton.disabled = state.submitted;
    els.validateButton.textContent = state.submitted ? "Frise validée" : "Valider";
  }
  if (els.shareButton) els.shareButton.hidden = !state.submitted;
  renderReveal();
}

function renderCards() {
  if (!els.cardList) return;
  const list = orderedEvents();
  els.cardList.innerHTML = list
    .map((ev, i) => {
      const correct = state.submitted && state.score ? state.score.perEvent[i] : null;
      const stateClass = correct === null ? "" : correct ? " is-correct" : " is-wrong";
      const cat = CATEGORY_LABELS[ev.category] || ev.category || "";
      const revealed = state.submitted
        ? `<span class="frise-card__year">${ev.year}</span>`
        : `<span class="frise-card__rank" aria-hidden="true">${i + 1}</span>`;
      const controls = state.submitted
        ? ""
        : `<span class="frise-card__moves">
             <button type="button" class="frise-move" data-move="up" data-index="${i}" aria-label="Monter « ${escapeHtml(ev.label)} »"${i === 0 ? " disabled" : ""}>▲</button>
             <button type="button" class="frise-move" data-move="down" data-index="${i}" aria-label="Descendre « ${escapeHtml(ev.label)} »"${i === list.length - 1 ? " disabled" : ""}>▼</button>
           </span>`;
      return `<li class="frise-card${stateClass}" data-id="${ev.id}" data-index="${i}"${state.submitted ? "" : ' draggable="true"'}>
        ${revealed}
        <span class="frise-card__body">
          <span class="frise-card__label">${escapeHtml(ev.label)}</span>
          ${cat ? `<span class="frise-card__cat">${escapeHtml(cat)}</span>` : ""}
        </span>
        ${controls}
      </li>`;
    })
    .join("");
}

function renderReveal() {
  if (!els.revealPanel) return;
  if (!state.submitted) {
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
 * Réordonnancement (flèches + glisser-déposer)
 * ------------------------------------------------------------------ */
function moveCard(index, dir) {
  if (state.submitted) return;
  const target = index + (dir === "up" ? -1 : 1);
  if (target < 0 || target >= state.order.length) return;
  const order = [...state.order];
  [order[index], order[target]] = [order[target], order[index]];
  state.order = order;
  saveGame();
  render();
  focusCard(target);
}
function reorderByDrop(fromId, toId) {
  if (state.submitted || fromId === toId) return;
  const order = [...state.order];
  const from = order.indexOf(fromId);
  const to = order.indexOf(toId);
  if (from < 0 || to < 0) return;
  order.splice(to, 0, order.splice(from, 1)[0]);
  state.order = order;
  saveGame();
  render();
}
function focusCard(index) {
  const btn = els.cardList?.querySelector(`.frise-card[data-index="${index}"] .frise-move[data-move="up"]:not([disabled]), .frise-card[data-index="${index}"] .frise-move`);
  btn?.focus();
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */
function validate() {
  if (!state || state.submitted) return;
  const score = scoreOrder(orderedEvents());
  state.score = score;
  state.submitted = true;
  updateStats(score);
  saveGame();
  render();
  celebrate(score);
  els.revealPanel?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function updateStats(score) {
  if (stats.lastPlayedDateId === todayId) return; // déjà compté
  const won = score.exact === score.total;
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
  stats.bestScore = Math.max(stats.bestScore || 0, score.exact);
  stats.lastPlayedDateId = todayId;
  stats.history = [{ date: todayId, won, exact: score.exact }, ...stats.history].slice(0, 60);
  writeJson(STORAGE_KEYS.stats, stats);
}

function celebrate(score) {
  showToast(score.exact === score.total ? "Sans faute, biloute ! 🎉" : `${score.exact}/${score.total} bien placés.`);
}

/* ------------------------------------------------------------------ *
 * Partage (spoiler-free)
 * ------------------------------------------------------------------ */
function buildShareText() {
  const squares = (state.score?.perEvent || []).map((ok) => (ok ? "🟩" : "⬛")).join("");
  return [
    `La Frise du Nord ${todayId}`,
    `${squares} (${state.score?.exact ?? 0}/${SET_SIZE} bien placés)`,
    GAME_URL,
  ].join("\n");
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
        { label: "Sans faute", value: stats.won },
        { label: "Réussite", value: `${winRate}%` },
        { label: "Série en cours", value: stats.currentStreak || 0 },
        { label: "Meilleure série", value: stats.bestStreak || 0 },
      ],
      historyLines: (stats.history || []).map(
        (h) => `${h.date} · ${h.won ? "sans faute" : `${h.exact}/${SET_SIZE}`}`
      ),
      perfBars: (stats.history || [])
        .slice(0, 7)
        .reverse()
        .map((h) => ({
          ratio: Math.max(0, Math.min(1, (Number(h.exact) || 0) / SET_SIZE)),
          result: h.won ? "won" : "lost",
          label: (h.exact ?? 0),
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
    bestScore: num(r.bestScore),
    lastPlayedDateId: typeof r.lastPlayedDateId === "string" ? r.lastPlayedDateId : null,
    lastWinDateId: typeof r.lastWinDateId === "string" ? r.lastWinDateId : null,
    history: Array.isArray(r.history)
      ? r.history
          .filter((h) => h && typeof h.date === "string")
          .map((h) => ({ date: h.date, won: Boolean(h.won), exact: num(h.exact) }))
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
  let secondsLeft = ((DAILY_ROLLOVER_HOUR - get("hour")) * 3600) - get("minute") * 60 - get("second");
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
    if (btn) moveCard(Number(btn.dataset.index), btn.dataset.move);
  });
  // glisser-déposer (souris/desktop)
  els.cardList?.addEventListener("dragstart", (e) => {
    const li = e.target.closest(".frise-card");
    if (!li || state.submitted) return;
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
  const [y, m, d] = dateId.split("-").map(Number);
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
      submitted: state.submitted,
      score: state.score,
      labels: orderedEvents().map((e) => e.label),
    });
}

init();
