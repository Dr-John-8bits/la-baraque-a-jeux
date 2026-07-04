/*
 * « Mon calepin » du portail : une modale qui agrège les stats des jeux (localStorage,
 * même origine, zéro backend), des jalons, et « Le Palmarès du jour » — une pop-up avec
 * médailles (bronze/argent/or) et coupe partageable quand les 4 jeux du jour sont bouclés.
 *
 * Les jeux ne nomment pas leurs champs pareil (Le Mot : lastPlayed/won/streak ;
 * Lille-Mêle : lastPlayedDateId/won/currentStreak ; Station : lastPlayedDateId/wins/currentStreak),
 * d'où la table GAMES. La médaille du jour, elle, se lit dans l'historique du jeu
 * (history[0] du jour), via HISTORY_DATE_FIELD et MEDAL_RULES.
 */
import { getDailyDateId } from "../game-utils/daily.js";
import { shareText } from "../game-utils/share.js";

const TIME_ZONE = "Europe/Paris";
const ROLLOVER_HOUR = 12;
const todayId = getDailyDateId(new Date(), { timeZone: TIME_ZONE, rolloverHour: ROLLOVER_HOUR });

const PALMARES_SEEN_KEY = "labaj:palmaresSeen";

const PORTAL_URL = "https://dr-john-8bits.github.io/la-baraque-a-jeux/";

const GAMES = [
  { key: "le-mot", label: "Le mot à Biloute", accent: "var(--labaj-red)", statsKey: "mot-a-biloute:stats", dateField: "lastPlayed", wonField: "won", streakField: "streak", bestStreakField: null, bestScoreField: "bestScore" },
  { key: "lille-mele", label: "Lille-Mêle", accent: "var(--labaj-teal)", statsKey: "lillemele.v1.stats", dateField: "lastPlayedDateId", wonField: "won", streakField: "currentStreak", bestStreakField: "bestStreak", bestScoreField: null },
  { key: "station", label: "Station Mystère", accent: "var(--labaj-blue)", statsKey: "station-mystere.v1.stats", dateField: "lastPlayedDateId", wonField: "wins", streakField: "currentStreak", bestStreakField: "bestStreak", bestScoreField: "bestScore" },
  { key: "la-frise", label: "La Frise du Nord", accent: "var(--labaj-green)", statsKey: "la-frise.v1.stats", dateField: "lastPlayedDateId", wonField: "won", streakField: "currentStreak", bestStreakField: "bestStreak", bestScoreField: "bestScore" },
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

// --- Palmarès du jour : médailles + coupe ---
// Le champ de date DANS l'historique diffère du dateField des stats agrégées.
const HISTORY_DATE_FIELD = {
  "le-mot": "date",
  "lille-mele": "dateId",
  station: "dateId",
  "la-frise": "date",
};

// Médaille du jour à partir de l'entrée d'historique du jour :
// "or" | "argent" | "bronze" pour une victoire, null si perdu.
// Une victoire donne toujours au moins le bronze ; l'or récompense le sans-faute.
const MEDAL_RULES = {
  "le-mot": (e) => {
    const won = e.result === "won" || e.result === "recovered";
    if (!won) return null;
    const tries = num(e.tries);
    const hints = num(e.extraHintsUsed);
    if (e.result === "won" && tries <= 3 && hints === 0) return "or";
    if (e.result === "won" && tries <= 5 && hints === 0) return "argent";
    return "bronze";
  },
  "lille-mele": (e) => {
    if (!e.won) return null;
    const m = num(e.mistakes);
    const h = num(e.hintsUsed);
    if (m === 0 && h === 0) return "or";
    if (m <= 1 && h <= 1) return "argent";
    return "bronze";
  },
  station: (e) => {
    if (e.status !== "won") return null;
    const h = num(e.hintsUsed);
    const w = num(e.wrongAnswers);
    if (h <= 1 && w === 0) return "or";
    if (h <= 3 && w <= 1) return "argent";
    return "bronze";
  },
  "la-frise": (e) => {
    if (!e.won) return null;
    const a = num(e.attempts);
    const h = num(e.hintsUsed);
    const exact = num(e.exact);
    if (exact === 5 && a === 1 && h === 0) return "or";
    if (a <= 2 && h === 0) return "argent";
    return "bronze";
  },
};

const MEDAL_EMOJI = { or: "🥇", argent: "🥈", bronze: "🥉" };
const MEDAL_LABEL = { or: "Or", argent: "Argent", bronze: "Bronze" };

// Retrouve l'entrée d'historique du jour (on ne suppose pas aveuglément history[0]).
function todayEntry(g) {
  const hist = Array.isArray(g.stats.history) ? g.stats.history : [];
  const field = HISTORY_DATE_FIELD[g.key];
  return hist.find((e) => e && e[field] === todayId) || null;
}

// Ligne de perf spoiler-free (jamais la réponse), un peu ch'ti.
function perfLine(key, e, played, won) {
  if (!played) return "Pas encore joué";
  if (key === "le-mot") {
    if (!won) return "Mot pas trouvé";
    if (e.result === "recovered") return "Trouvé au rab";
    const t = num(e.tries);
    return `Trouvé en ${t} essai${t > 1 ? "s" : ""}`;
  }
  if (key === "lille-mele") {
    if (!won) return "Grille non démêlée";
    const m = num(e.mistakes);
    const h = num(e.hintsUsed);
    if (!m && !h) return "Démêlée sans faute";
    return `Démêlée — ${m} erreur${m > 1 ? "s" : ""}${h ? `, ${h} indice${h > 1 ? "s" : ""}` : ""}`;
  }
  if (key === "station") {
    if (!won) return "Station ratée";
    const h = num(e.hintsUsed);
    return h ? `Dénichée avec ${h} indice${h > 1 ? "s" : ""}` : "Dénichée direct";
  }
  if (key === "la-frise") {
    if (!won) return `${num(e && e.exact)}/5 bien placées`;
    const a = num(e.attempts);
    const h = num(e.hintsUsed);
    const base = a <= 1 ? "Dans l'ordre du 1er coup" : `Dans l'ordre en ${a} essais`;
    return h ? `${base}, ${h} indice${h > 1 ? "s" : ""}` : base;
  }
  return played ? "Joué" : "Pas encore joué";
}

function computePalmares() {
  const rows = games.map((g) => {
    const e = todayEntry(g);
    const played = g.playedToday || !!e;
    const medal = e ? MEDAL_RULES[g.key](e) : null;
    const won = medal != null;
    return { key: g.key, label: g.label, played, won, medal, line: perfLine(g.key, e, played, won) };
  });
  const wonCount = rows.filter((r) => r.won).length;
  const allWon = wonCount === GAMES.length;
  const allGold = allWon && rows.every((r) => r.medal === "or");
  return { rows, wonCount, allWon, allGold };
}

const palmares = computePalmares();

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

function renderBadges() {
  const badges = [
    { icon: "🎯", label: "Première victoire", earned: totalVictoires >= 1 },
    { icon: "🏅", label: "Carton plein du jour", earned: palmares.allWon },
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
  const allPlayed = doneToday === GAMES.length;
  target.innerHTML = `
    <p class="calepin-lead">${doneToday}/${GAMES.length} jeux du jour bouclés${maxSerie > 1 ? ` · ta plus longue série : ${maxSerie} j` : ""}.</p>
    ${allPlayed ? `<section class="calepin-section"><h3>Palmarès du jour</h3><div class="palmares" id="calepinPalmares"></div></section>` : ""}
    <section class="calepin-section">
      <div class="calepin-games">${games.map(renderStatCard).join("")}</div>
    </section>
    ${renderBadges()}`;
  if (allPlayed) {
    const slot = document.getElementById("calepinPalmares");
    if (slot) renderPalmaresInto(slot, palmares);
  }
}

// --- Rendu + partage du palmarès ---
function palmaresHtml(p) {
  const rows = p.rows
    .map((r) => {
      const icon = r.medal ? MEDAL_EMOJI[r.medal] : r.played ? "❌" : "⬜";
      const tier = r.medal ? MEDAL_LABEL[r.medal] : r.played ? "Raté" : "À jouer";
      return `
        <li class="palmares-row${r.won ? "" : " is-lost"}">
          <span class="palmares-row__medal" aria-hidden="true">${icon}</span>
          <span class="palmares-row__body">
            <span class="palmares-row__game">${r.label}</span>
            <span class="palmares-row__perf">${r.line}</span>
          </span>
          <span class="palmares-row__tier">${tier}</span>
        </li>`;
    })
    .join("");
  const coupe = p.allWon
    ? `<span class="palmares-coupe__cup" aria-hidden="true">🏆</span> <strong>${p.allGold ? "Carton plein en OR !" : "Carton plein !"}</strong> Les ${GAMES.length} jeux gagnés${p.allGold ? " avec brio" : ""}, biloute.`
    : `<span class="palmares-coupe__cup" aria-hidden="true">🏆</span> La coupe se débloque à ${GAMES.length} jeux gagnés — ${GAMES.length - p.wonCount} à retenter.`;
  return `
    <p class="palmares-summary">${todayId} · ${p.wonCount}/${GAMES.length} gagnés</p>
    <ul class="palmares-list">${rows}</ul>
    <p class="palmares-coupe${p.allWon ? " is-won" : ""}">${coupe}</p>
    <button type="button" class="palmares-share">Partager mon palmarès</button>`;
}

function buildPalmaresShare(p) {
  const lines = [`🎡 La Baraque à Jeux — Palmarès du jour (${todayId})`, ""];
  for (const r of p.rows) {
    const icon = r.medal ? MEDAL_EMOJI[r.medal] : r.played ? "❌" : "⬜";
    lines.push(`${icon} ${r.label} — ${r.line}`);
  }
  lines.push("");
  if (p.allWon) {
    lines.push(p.allGold ? `🏆 ${GAMES.length}/${GAMES.length} — CARTON PLEIN EN OR, cht'i champion ! 🎉` : `🏆 ${GAMES.length}/${GAMES.length} — CARTON PLEIN, cht'i champion ! 🎉`);
  } else {
    lines.push(`🎖️ ${p.wonCount}/${GAMES.length} gagnés — à retenter, biloute !`);
  }
  lines.push(`👉 ${PORTAL_URL}`);
  return lines.join("\n");
}

function renderPalmaresInto(target, p) {
  target.innerHTML = palmaresHtml(p);
  const btn = target.querySelector(".palmares-share");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const original = btn.textContent;
    const result = await shareText(buildPalmaresShare(p));
    if (result === "copied") {
      btn.textContent = "Copié dans le presse-papier ✓";
      btn.disabled = true;
      window.setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
      }, 2200);
    }
  });
}

function launchConfetti() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
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

// --- Le Palmarès du jour : modale + ouverture auto une fois par jour ---
const palmaresDialog = document.getElementById("palmaresDialog");
let palmaresLastTrigger = null;

function openPalmares() {
  const content = document.getElementById("palmaresContent");
  if (!palmaresDialog || !content) return;
  palmaresLastTrigger = document.activeElement;
  renderPalmaresInto(content, palmares);
  if (typeof palmaresDialog.showModal === "function") palmaresDialog.showModal();
  else palmaresDialog.setAttribute("open", "");
}

if (palmaresDialog) {
  palmaresDialog.querySelector("[data-palmares-close]")?.addEventListener("click", () => palmaresDialog.close());
  palmaresDialog.addEventListener("close", () => palmaresLastTrigger?.focus?.());
}

// Déclencheur : les 4 jeux JOUÉS. La coupe (et les confettis) dépendent des 4 GAGNÉS.
function maybeCelebratePalmares() {
  if (doneToday !== GAMES.length) return;
  if (readJson(PALMARES_SEEN_KEY, null) === todayId) return; // une seule fois par jour
  writeJson(PALMARES_SEEN_KEY, todayId);
  openPalmares();
  if (palmares.allWon) launchConfetti();
}
maybeCelebratePalmares();
