/*
 * Hub de progression du portail.
 * Lit le localStorage des jeux quotidiens (même origine, zéro backend) pour afficher
 * « joué aujourd'hui ✓ / à jouer » par carte, un compteur X/3 et la plus longue série.
 * Les noms de champs diffèrent d'un jeu à l'autre (Le Mot : lastPlayed/streak ;
 * Lille-Mêle & Station : lastPlayedDateId/currentStreak), d'où la table ci-dessous.
 */
import { getDailyDateId } from "../game-utils/daily.js";

const TIME_ZONE = "Europe/Paris";
const ROLLOVER_HOUR = 12;
const todayId = getDailyDateId(new Date(), { timeZone: TIME_ZONE, rolloverHour: ROLLOVER_HOUR });

const DAILY_GAMES = [
  { href: "apps/le-mot-a-biloute/", statsKey: "mot-a-biloute:stats", playedKey: "lastPlayed", streakKey: "streak" },
  { href: "apps/lille-mele/", statsKey: "lillemele.v1.stats", playedKey: "lastPlayedDateId", streakKey: "currentStreak" },
  { href: "apps/station-mystere/", statsKey: "station-mystere.v1.stats", playedKey: "lastPlayedDateId", streakKey: "currentStreak" },
];

function readStats(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

let done = 0;
let bestStreak = 0;

for (const game of DAILY_GAMES) {
  const card = document.querySelector(`.game-card[href="${game.href}"]`);
  if (!card) continue;

  const stats = readStats(game.statsKey);
  const played = stats[game.playedKey] === todayId;
  if (played) done += 1;
  bestStreak = Math.max(bestStreak, Number(stats[game.streakKey]) || 0);

  const action = card.querySelector(".game-card__action");
  if (action) {
    action.textContent = played ? "Joué ✓" : "Jouer";
    action.classList.toggle("is-done", played);
  }
  card.classList.toggle("game-card--done", played);

  if (played) {
    const base = card.getAttribute("aria-label") || "";
    card.setAttribute("aria-label", `${base} — joué aujourd'hui`);
  }
}

const summary = document.getElementById("gamesProgress");
if (summary) {
  const parts = [
    done === DAILY_GAMES.length
      ? "🎉 Les 3 jeux du jour bouclés — reviens demain à midi"
      : `${done}/${DAILY_GAMES.length} jeux du jour bouclés`,
  ];
  if (bestStreak > 1) parts.push(`ta plus longue série : ${bestStreak} j`);
  summary.textContent = parts.join(" · ");
  summary.hidden = false;
}
