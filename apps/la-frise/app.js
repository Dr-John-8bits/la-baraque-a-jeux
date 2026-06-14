/*
 * La Frise du Nord (titre de travail) — jeu de chronologie quotidien.
 * SCAFFOLDING : la cadence et le scoring sont posés ; la logique de jeu
 * (état, ordonnancement, rendu, révélation, partage) reste à coder.
 * Voir specifications.md (§4 mécanique, §12 par où commencer).
 */
import { getDailyDateId, getRelativeDateId, selectDailyItem } from "../../packages/game-utils/daily.js";
import { fetchJson } from "../../packages/game-utils/fetch-json.js";
import { readJson, writeJson } from "../../packages/game-utils/storage.js";
import { shareText as shareTextWithFallback } from "../../packages/game-utils/share.js";

const APP_VERSION = "26.06.14.0-scaffold";
const DAILY_EPOCH_ID = "2026-01-01";
const DAILY_TIME_ZONE = "Europe/Paris";
const DAILY_ROLLOVER_HOUR = 12;
const SET_SIZE = 5; // nombre de faits à ordonner par jour (à régler)
const CORPUS_URL = "../../packages/corpus/la-frise/events.json";
const GAME_URL = new URL(".", window.location.href).href;
const STORAGE_PREFIX = "la-frise.v1.";
const STORAGE_KEYS = {
  currentGame: `${STORAGE_PREFIX}currentGame`,
  stats: `${STORAGE_PREFIX}stats`,
};

/* ------------------------------------------------------------------ *
 * Cadence quotidienne — à réutiliser tel quel (cf. les autres jeux)
 * ------------------------------------------------------------------ */
function getTodayId(date = new Date()) {
  return getDailyDateId(date, { timeZone: DAILY_TIME_ZONE, rolloverHour: DAILY_ROLLOVER_HOUR });
}

/* ------------------------------------------------------------------ *
 * Année comparable — gère les dates floues (siècle / circa)
 * ------------------------------------------------------------------ */
export function comparableYear(event) {
  if (event.precision === "siecle") {
    // ex. year peut porter le n° de siècle OU l'année : on retombe sur l'année médiane.
    const century = event.year > 100 ? Math.floor(event.year / 100) + 1 : event.year;
    return century * 100 - 50;
  }
  return event.year;
}

/* ------------------------------------------------------------------ *
 * Scoring de l'ordonnancement (variante A) — positions exactes
 * `order` = tableau d'events proposés ; renvoie {exact, total, perEvent[]}
 * ------------------------------------------------------------------ */
export function scoreOrder(order) {
  const solution = [...order].sort((a, b) => comparableYear(a) - comparableYear(b));
  const perEvent = order.map((ev, i) => solution[i] && solution[i].id === ev.id);
  return { exact: perEvent.filter(Boolean).length, total: order.length, perEvent };
}

/* ------------------------------------------------------------------ *
 * Réponse « avant / après » (variante B)
 * ------------------------------------------------------------------ */
export function checkBeforeAfter(candidate, anchor, answer) {
  const isAfter = comparableYear(candidate) >= comparableYear(anchor);
  return (answer === "apres") === isAfter;
}

/* ================================================================== *
 * À CODER (prochaine session) — voir specifications.md
 * ------------------------------------------------------------------
 * let events, todayId, dailySet, state;
 *
 * async function init() {
 *   const corpus = await fetchJson(CORPUS_URL);
 *   events = corpus.events;
 *   todayId = getTodayId();
 *   dailySet = pickDailySet(events, todayId);   // SET_SIZE faits, écarts nets (cf. §5)
 *   state = hydrate(readJson(STORAGE_KEYS.currentGame, null));
 *   bindEvents(); render();
 *   renderYesterday();           // "Frise d'hier" via getRelativeDateId(-1)
 *   scheduleDailyRefresh();      // recharge si on dépasse midi
 *   scheduleCountdownRefresh();  // "Prochaine frise à 12 h : …"
 * }
 *
 * function validate() {
 *   const r = scoreOrder(state.order);          // variante A
 *   // feedback par carte via r.perEvent, victoire si r.exact === r.total
 *   // révéler les dates + blurb + source ; saveGame(); render();
 * }
 *
 * function buildShareText() { ... 🟩/⬛ par position + GAME_URL (spoiler-free) }
 * window.render_game_to_text = () => JSON.stringify({ ... }); // pour les tests
 *
 * init();
 * ================================================================== */

// Garde-fou de scaffolding : confirme que le corpus se charge bien.
fetchJson(CORPUS_URL)
  .then((corpus) => {
    console.info(
      `[La Frise du Nord ${APP_VERSION}] corpus-graine OK : ${corpus.events.length} faits (statut « ${corpus.status} »). À étendre + jeu à coder (voir specifications.md).`
    );
  })
  .catch((error) => console.error("[La Frise du Nord] corpus introuvable :", error));
