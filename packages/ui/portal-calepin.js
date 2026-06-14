/*
 * « Mon calepin » du portail : une modale qui agrège les stats des jeux (localStorage,
 * même origine, zéro backend), une heatmap de régularité, des jalons, et la célébration
 * « 3/3 » quand les trois jeux du jour sont bouclés.
 *
 * Les jeux ne nomment pas leurs champs pareil (Le Mot : lastPlayed/won/streak ;
 * Lille-Mêle : lastPlayedDateId/won/currentStreak ; Station : lastPlayedDateId/wins/currentStreak),
 * d'où la table GAMES.
 */
import { getDailyDateId } from "../game-utils/daily.js";

const TIME_ZONE = "Europe/Paris";
const ROLLOVER_HOUR = 12;
const todayId = getDailyDateId(new Date(), { timeZone: TIME_ZONE, rolloverHour: ROLLOVER_HOUR });

const ACTIVITY_KEY = "labaj:activity";
const SEED_KEY = "labaj:activitySeeded";
const CELEBRATED_KEY = "labaj:celebrated";

const GAMES = [
  { key: "le-mot", label: "Le mot à Biloute", accent: "var(--labaj-red)", statsKey: "mot-a-biloute:stats", dateField: "lastPlayed", wonField: "won", streakField: "streak", bestStreakField: null, bestScoreField: "bestScore" },
  { key: "lille-mele", label: "Lille-Mêle", accent: "var(--labaj-teal)", statsKey: "lillemele.v1.stats", dateField: "lastPlayedDateId", wonField: "won", streakField: "currentStreak", bestStreakField: "bestStreak", bestScoreField: null },
  { key: "station", label: "Station Mystère", accent: "var(--labaj-blue)", statsKey: "station-mystere.v1.stats", dateField: "lastPlayedDateId", wonField: "wins", streakField: "currentStreak", bestStreakField: "bestStreak", bestScoreField: "bestScore" },
];

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / mode privé : on ignore */
  }
}

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const isDateId = (d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);

function dateIdMinus(days) {
  const d = new Date(`${todayId}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

// --- Collecte des stats par jeu ---
const games = GAMES.map((g) => {
  const stats = readJson(g.statsKey, {}) || {};
  return {
    ...g,
    stats,
    playedToday: stats[g.dateField] === todayId,
    parties: num(stats.played),
    victoires: num(stats[g.wonField]),
    serie: num(stats[g.streakField]),
    meilleureSerie: g.bestStreakField ? num(stats[g.bestStreakField]) : null,
    meilleurScore: g.bestScoreField ? num(stats[g.bestScoreField]) : null,
  };
});

const doneToday = games.filter((g) => g.playedToday).length;
const totalParties = games.reduce((a, g) => a + g.parties, 0);
const totalVictoires = games.reduce((a, g) => a + g.victoires, 0);
const maxSerie = games.reduce((a, g) => Math.max(a, g.serie, g.meilleureSerie || 0), 0);

// --- Journal d'activité (pour la heatmap) ---
function buildActivityLog() {
  const log = readJson(ACTIVITY_KEY, {}) || {};
  // Amorçage unique depuis les historiques des jeux qui en gardent un (Le Mot, Station).
  if (!localStorage.getItem(SEED_KEY)) {
    const perDate = {};
    for (const g of games) {
      const hist = Array.isArray(g.stats.history) ? g.stats.history : [];
      for (const entry of hist) {
        const d = entry?.date || entry?.dateId;
        if (isDateId(d)) (perDate[d] ||= new Set()).add(g.key);
      }
    }
    for (const [d, set] of Object.entries(perDate)) {
      log[d] = Math.max(num(log[d]), set.size);
    }
    localStorage.setItem(SEED_KEY, "1");
  }
  // Mise à jour du jour à partir de l'état réel des jeux.
  if (doneToday > 0) log[todayId] = Math.max(num(log[todayId]), doneToday);
  writeJson(ACTIVITY_KEY, log);
  return log;
}
const activityLog = buildActivityLog();

// --- Rendu ---
function renderStatCard(g) {
  const rows = [
    ["Parties", String(g.parties)],
    ["Victoires", String(g.victoires)],
    ["Série", String(g.serie)],
  ];
  if (g.meilleureSerie != null) rows.push(["Meilleure série", String(g.meilleureSerie)]);
  if (g.meilleurScore != null) rows.push(["Meilleur score", g.meilleurScore ? String(g.meilleurScore) : "—"]);
  return `
    <article class="calepin-game" style="--accent:${g.accent}">
      <h4>${g.label}${g.playedToday ? ' <span class="calepin-game__today">joué ✓</span>' : ""}</h4>
      <dl class="calepin-game__stats">
        ${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}
      </dl>
    </article>`;
}

function renderHeatmap() {
  const WEEKS = 12;
  const days = [];
  for (let i = WEEKS * 7 - 1; i >= 0; i -= 1) days.push(dateIdMinus(i));
  const firstDow = (new Date(`${days[0]}T12:00:00Z`).getUTCDay() + 6) % 7; // lundi = 0
  const blanks = Array.from({ length: firstDow }, () => '<span class="heatmap__cell heatmap__cell--blank"></span>');
  const cells = days.map((d) => {
    const level = Math.min(3, num(activityLog[d]));
    return `<span class="heatmap__cell" data-level="${level}" title="${d} — ${num(activityLog[d])}/3"></span>`;
  });
  return `
    <section class="calepin-section">
      <h3>Ta régularité <span class="calepin-section__sub">(12 dernières semaines)</span></h3>
      <div class="heatmap" role="img" aria-label="Calendrier d'activité des 12 dernières semaines">${blanks.join("")}${cells.join("")}</div>
      <p class="heatmap__legend"><span>moins</span><i data-level="0"></i><i data-level="1"></i><i data-level="2"></i><i data-level="3"></i><span>plus</span></p>
    </section>`;
}

function renderBadges() {
  const badges = [
    { icon: "🎯", label: "Première victoire", earned: totalVictoires >= 1 },
    { icon: "🏅", label: "Triplé du jour", earned: doneToday === 3 },
    { icon: "🧢", label: "10 parties", earned: totalParties >= 10 },
    { icon: "🔥", label: "Série de 7", earned: maxSerie >= 7 },
    { icon: "⭐", label: "50 parties", earned: totalParties >= 50 },
    { icon: "💎", label: "Série de 30", earned: maxSerie >= 30 },
  ];
  return `
    <section class="calepin-section">
      <h3>Jalons</h3>
      <ul class="calepin-badges">
        ${badges
          .map(
            (b) =>
              `<li class="calepin-badge${b.earned ? " is-earned" : ""}"><span aria-hidden="true">${b.icon}</span> ${b.label}</li>`
          )
          .join("")}
      </ul>
    </section>`;
}

function renderCalepin() {
  const target = document.getElementById("calepinContent");
  if (!target) return;
  target.innerHTML = `
    <p class="calepin-lead">${doneToday}/3 jeux du jour bouclés${maxSerie > 1 ? ` · ta plus longue série : ${maxSerie} j` : ""}.</p>
    <section class="calepin-section">
      <div class="calepin-games">${games.map(renderStatCard).join("")}</div>
    </section>
    ${renderHeatmap()}
    ${renderBadges()}`;
}

// --- Wiring de la modale ---
const dialog = document.getElementById("calepinDialog");
const openButton = document.getElementById("calepinButton");
let lastTrigger = null;
if (dialog && openButton) {
  openButton.addEventListener("click", () => {
    lastTrigger = openButton;
    renderCalepin();
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  });
  dialog.querySelector("[data-calepin-close]")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => lastTrigger?.focus());
}

// --- Célébration « 3/3 » ---
function celebrate() {
  if (doneToday !== 3) return;
  if (readJson(CELEBRATED_KEY, null) === todayId) return; // une fois par jour
  writeJson(CELEBRATED_KEY, todayId);

  const banner = document.getElementById("celebration");
  if (!banner) return;
  banner.textContent = "🎉 Triplé ! T'as bouclé les 3 jeux du jour, biloute. À demain midi !";
  banner.hidden = false;
  banner.classList.add("is-visible");

  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!reduced) {
    const colors = ["var(--labaj-red)", "var(--labaj-teal)", "var(--labaj-gold)", "var(--labaj-blue)", "var(--labaj-green)"];
    const layer = document.createElement("div");
    layer.className = "confetti-layer";
    for (let i = 0; i < 36; i += 1) {
      const piece = document.createElement("i");
      piece.style.left = `${(i / 36) * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = `${(i % 9) * 90}ms`;
      piece.style.transform = `rotate(${i * 37}deg)`;
      layer.append(piece);
    }
    document.body.append(layer);
    window.setTimeout(() => layer.remove(), 3200);
  }
  window.setTimeout(() => {
    banner.classList.remove("is-visible");
    window.setTimeout(() => (banner.hidden = true), 400);
  }, 5000);
}
celebrate();
