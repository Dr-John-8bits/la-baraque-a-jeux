/*
 * Commune Mystère (titre de travail) — jeu géographique quotidien.
 * SCAFFOLDING : le moteur géo ci-dessous est écrit et validé. La logique de jeu
 * (état, rendu, saisie, partage) reste à coder — voir specifications.md (§12).
 *
 * Réutilise les utilitaires partagés et la cadence quotidienne des autres jeux.
 */
import { getDailyDateId, getRelativeDateId, selectDailyItem } from "../../packages/game-utils/daily.js";
import { fetchJson } from "../../packages/game-utils/fetch-json.js";
import { readJson, writeJson } from "../../packages/game-utils/storage.js";
import { shareText as shareTextWithFallback } from "../../packages/game-utils/share.js";

const APP_VERSION = "26.06.14.0-scaffold";
const DAILY_EPOCH_ID = "2026-01-01";
const DAILY_TIME_ZONE = "Europe/Paris";
const DAILY_ROLLOVER_HOUR = 12;
const MAX_GUESSES = 6;
const CORPUS_URL = "../../packages/corpus/commune-mystere/communes.json";
const GAME_URL = new URL(".", window.location.href).href;
const STORAGE_PREFIX = "commune-mystere.v1.";
const STORAGE_KEYS = {
  currentGame: `${STORAGE_PREFIX}currentGame`,
  stats: `${STORAGE_PREFIX}stats`,
};

/* ------------------------------------------------------------------ *
 * Moteur géo — VALIDÉ (Lille→Tourcoing 12,7 km NE, Lille→Roubaix 11,6 km NE…)
 * ------------------------------------------------------------------ */
const EARTH_RADIUS_KM = 6371;
const toRad = (deg) => (deg * Math.PI) / 180;

// Distance à vol d'oiseau entre deux points {lat, lon}, en km.
export function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

// Cap (0-360°) de a vers b.
export function bearingDeg(a, b) {
  const dLon = toRad(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

const COMPASS = [
  { code: "N", arrow: "↑" },
  { code: "NE", arrow: "↗" },
  { code: "E", arrow: "→" },
  { code: "SE", arrow: "↘" },
  { code: "S", arrow: "↓" },
  { code: "SO", arrow: "↙" },
  { code: "O", arrow: "←" },
  { code: "NO", arrow: "↖" },
];

// Cap (°) → secteur boussole 8 points (code + flèche).
export function cardinal8(deg) {
  const index = Math.round(((deg % 360) + 360) % 360 / 45) % 8;
  return COMPASS[index];
}

// Normalisation pour le match de saisie : minuscules, sans accents ni tirets/espaces.
export function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Résultat d'un essai (commune proposée vs cible) — prêt à brancher dans le rendu.
export function evaluateGuess(guess, target, maxDistanceKm) {
  const distanceKm = haversineKm(guess, target);
  const compass = cardinal8(bearingDeg(guess, target));
  const proximity = Math.max(
    0,
    Math.min(100, Math.round(100 * (1 - distanceKm / maxDistanceKm)))
  );
  return {
    name: guess.name,
    distanceKm: Math.round(distanceKm),
    direction: compass.code,
    arrow: compass.arrow,
    proximity, // 0-100
    correct: distanceKm < 0.001,
  };
}

/* ------------------------------------------------------------------ *
 * Cadence quotidienne — à réutiliser tel quel (cf. Le Mot / Station)
 * ------------------------------------------------------------------ */
function getTodayId(date = new Date()) {
  return getDailyDateId(date, { timeZone: DAILY_TIME_ZONE, rolloverHour: DAILY_ROLLOVER_HOUR });
}

/* ================================================================== *
 * À CODER (prochaine session) — voir specifications.md
 * ------------------------------------------------------------------
 * let communes, maxDistanceKm, todayId, target, state;
 *
 * async function init() {
 *   const corpus = await fetchJson(CORPUS_URL);
 *   communes = corpus.communes;
 *   maxDistanceKm = corpus.maxDistanceKm;
 *   todayId = getTodayId();
 *   target = selectDailyItem(communes, todayId, { epochId: DAILY_EPOCH_ID });
 *   state = hydrate(readJson(STORAGE_KEYS.currentGame, null));
 *   bindEvents(); render();
 *   renderYesterday();           // "Commune d'hier : …" via getRelativeDateId(-1)
 *   scheduleDailyRefresh();      // recharge si on dépasse midi
 *   scheduleCountdownRefresh();  // "Prochaine commune à 12 h : …"
 * }
 *
 * function submitGuess(name) {
 *   // 1. normaliser + retrouver la commune (refuser inconnue / déjà jouée)
 *   // 2. const r = evaluateGuess(guess, target, maxDistanceKm)
 *   // 3. pousser dans state.guesses, victoire si r.correct, défaite si MAX_GUESSES
 *   // 4. saveGame(); render();
 * }
 *
 * function buildShareText() { ... grille 🟥🟧🟩 + flèches + GAME_URL (spoiler-free) }
 * function render() { ... liste des essais, masque, compte à rebours }
 * window.render_game_to_text = () => JSON.stringify({ ... }); // pour les tests
 *
 * init();
 * ================================================================== */

// Garde-fou de scaffolding : confirme que le corpus se charge bien.
fetchJson(CORPUS_URL)
  .then((corpus) => {
    console.info(
      `[Commune Mystère ${APP_VERSION}] corpus OK : ${corpus.count} communes, maxDistanceKm=${corpus.maxDistanceKm}. Jeu à coder (voir specifications.md).`
    );
  })
  .catch((error) => console.error("[Commune Mystère] corpus introuvable :", error));
