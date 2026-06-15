#!/usr/bin/env node
/*
 * Construit le corpus de faits datés de « La Frise du Nord » depuis Wikidata (licence CC0).
 *
 * Pipeline : 3 requêtes SPARQL (édifices/lieux lillois datés, personnalités nées à Lille,
 * événements datés à Lille) -> curation conforme à la charte (filtre religieux du validateur,
 * anti-libellés génériques, plage d'années, dédoublonnage, classement par notoriété) ->
 * normalisation au schéma events.json -> fusion avec les faits-graines rédigés main.
 *
 * Chaque fait porte sourceId "wikidata" + son QID (champ wikidataId) pour traçabilité.
 * Re-jouable : `node packages/corpus/la-frise/tools/build-events-from-wikidata.mjs`
 *
 * NB : les blurbs viennent de la description Wikidata (CC0) — ce sont des BROUILLONS à
 * polir éditorialement. Le statut du corpus passe à "draft".
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "../events.json");
const MERIMEE_PATH = resolve(HERE, "../../shared/monuments-lille.json");
// monuments Mérimée écartés pour La Frise (obscurs ou doublons d'un fait déjà présent)
const MERIMEE_DENY = new Set([
  "PA59000185", // Ancien siège social de la Société des Mines de Lens (obscur)
  "PA59000062", // Salle des fêtes, à Lille-Fives (obscur)
  "PA59000079", // Observatoire de l'Institut de mathématiques (obscur)
  "PA59000184", // Hôtel Catel-Béghin (hôtel particulier obscur)
  "PA00107719", // Palais des Beaux-Arts (déjà présent via Wikidata)
  "PA59000078", // Hôtel de ville (doublonne avec le beffroi des graines)
  // écartés après vérification adverse (date trompeuse, hors Lille ou trop obscurs) :
  "PA00107603", // Hôtel de Marchiennes (1626 = seul le porche ; bâtiment 1710-20 ; obscur)
  "PA00107597", // Hôtel Castiaux (hôtel particulier discret)
  "PA59000008", // École des Arts et Métiers (1886 = 1re pierre, ouverte 1900 ; peu connue)
  "PA59000071", // Grands Moulins de Paris (en réalité à Marquette-lez-Lille, pas Lille)
]);
const ENDPOINT = "https://query.wikidata.org/sparql";
const UA = "LaBaraqueAJeux/1.0 (jeux locaux Lille; +https://dr-john-8bits.github.io/la-baraque-a-jeux/; contact jean.debaecker@gmail.com)";
const LILLE = "wd:Q648";
const TARGET_TOTAL = 90; // cible ~50-100 (cf. specifications.md §3)

// --- filtre religieux : repris à l'identique du validateur (scripts/validate-corpus.mjs) ---
const FORBIDDEN = [
  /\bsaint\b/, /\bsainte\b/, /\bst\b/, /\bste\b/, /\beglise\b/, /\bchapelle\b/,
  /\bcalvaire\b/, /\babbaye\b/, /\btemple\b/, /\bdieu\b/, /\bcathedrale\b/,
  /\bcatholique\b/, /\bmosquee\b/, /\bislam/, /\bbouddh/, /\brelig/,
  /\baumonerie\b/, /\barmee du salut\b/,
];
// libellés trop génériques pour faire une carte reconnaissable
const GENERIC = [/^maisons?\b/, /^immeubles?\b/, /^rue /, /^place /, /^h[oô]tel particulier/, /^ancienne? /];
// faits obscurs/hors-sujet pour le grand public (cf. vérif adverse) → écartés :
// fondations d'institutions, stations de métro (déjà le terrain de Station Mystère),
// compétitions génériques, édifices cultuels non couverts par FORBIDDEN.
const OBSCURE = /\b(ecole|lycee|institut|faculte|universite|seminaire|conservatoire|couvent|hospice|departement de|chambre de commerce|consulat|caserne|business school|\bschool\b|station du metro|station de metro|championnats?|aerospatiale|office national|synagogue|reserve naturelle|world forum|canoe club|chaire)\b/;
// Plancher de notoriété par type. Pour les LIEUX : volontairement bas — les monuments
// LOCAUX (porte, colonne…) ont peu de wikis mais restent reconnaissables des Lillois.
// Pour naissances/événements : la notoriété (nb de wikis) suit mieux la reconnaissance.
const MIN_FAME = { lieu: 2, naissance: 9, evenement: 6 };
// œuvres de musée (datées mais hors-sujet pour une frise de lieux/événements) — repérées via la description
const ART = /^(tableau|peinture|toile|sculpture|statue|gravure|estampe|dessin|œuvre|retable|triptyque|portrait|vitrail)\b/i;
// corrections issues de la vérification factuelle adverse (cf. workflow verif-frise-dates)
const DENY_QIDS = new Set([
  "Q2421499", // « Lille Grand Palais » : QID = station de métro (1989), inception 1899 erronée
  // tri éditorial (peu reconnaissables ou redondants) :
  "Q26257798", // Hôtel Catel-Béghin (hôtel particulier obscur)
  "Q901844", // Stade Henri-Jooris (démoli, éclipsé — flaggé par la vérif)
  "Q55597907", // Ligne 2 du tramway (redondant avec « le Mongy » des graines)
  "Q113578402", // Piscine olympique Marx-Dormoy (équipement obscur)
  "Q13629025", // « Ici Nord » (obscur)
  "Q3234867", // « Les Poussins, Parc de la Citadelle » (sculpture obscure)
  "Q3533115", // Tour Lilleurope (redondant avec Tour de Lille)
]);
const YEAR_OVERRIDE = {
  Q801098: 1848, // Gare de Lille-Flandres : ouverture voyageurs intra-muros 1848 (P571=1842 = début des travaux à Fives)
};
const LABEL_OVERRIDE = {
  Q299703: "Gaël Kakuta", // libellé Wikidata bruité (« Gaël Ernesto washington Kakuta »)
};

function normalize(s) {
  return String(s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}
function kebab(s) {
  return normalize(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}
function cap(s) { s = String(s || "").trim(); return s ? s[0].toUpperCase() + s.slice(1) : s; }
function cleanBlurb(desc, fallback) {
  let b = cap((desc || "").trim());
  if (!b) b = fallback;
  if (b && !/[.!?…]$/.test(b)) b += ".";
  return b.slice(0, 180);
}
function categorize(text, fallback = "patrimoine") {
  const t = normalize(text);
  if (/metro|tramway|station|gare|pont|canal|chemin de fer|ligne de|viaduc/.test(t)) return "transport";
  if (/stade|piscine|sport|gymnase|velodrome|hippodrome|championnat|jeux olympiques|coupe|tournoi|athletisme/.test(t)) return "sport";
  if (/musee|theatre|opera|cinema|bibliotheque|conservatoire|galerie|festival|exposition|salle de concert|marche des fiertes/.test(t)) return "culture";
  if (/usine|manufacture|brasserie|filature|mine|industri|ecole|universite|institut/.test(t)) return "industrie-social";
  return fallback;
}

const QUERIES = [
  {
    kind: "lieu",
    sparql: `SELECT ?item ?itemLabel ?year ?desc ?fame WHERE {
      ?item wdt:P131 ${LILLE} ; wdt:P571 ?date ; wikibase:sitelinks ?fame .
      BIND(YEAR(?date) AS ?year) FILTER(?year > 1000 && ?year <= 2026)
      OPTIONAL { ?item schema:description ?desc FILTER(LANG(?desc)="fr") }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "fr". }
    } ORDER BY DESC(?fame) LIMIT 200`,
  },
  {
    kind: "naissance",
    sparql: `SELECT ?item ?itemLabel ?year ?desc ?fame WHERE {
      ?item wdt:P19 ${LILLE} ; wdt:P569 ?date ; wikibase:sitelinks ?fame .
      BIND(YEAR(?date) AS ?year) FILTER(?year > 1000 && ?year <= 2012)
      OPTIONAL { ?item schema:description ?desc FILTER(LANG(?desc)="fr") }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "fr". }
    } ORDER BY DESC(?fame) LIMIT 80`,
  },
  {
    kind: "evenement",
    sparql: `SELECT ?item ?itemLabel ?year ?desc ?fame WHERE {
      ?item wdt:P131 ${LILLE} ; wdt:P585 ?date ; wikibase:sitelinks ?fame .
      BIND(YEAR(?date) AS ?year) FILTER(?year > 1000 && ?year <= 2026)
      OPTIONAL { ?item schema:description ?desc FILTER(LANG(?desc)="fr") }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "fr". }
    } ORDER BY DESC(?fame) LIMIT 80`,
  },
];

async function runQuery(sparql) {
  const url = `${ENDPOINT}?format=json&query=${encodeURIComponent(sparql)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/sparql-results+json" } });
  if (!res.ok) throw new Error(`SPARQL ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.results.bindings.map((b) => ({
    qid: b.item.value.split("/").pop(),
    label: b.itemLabel?.value || "",
    year: Number(b.year?.value),
    desc: b.desc?.value || "",
    fame: Number(b.fame?.value) || 0,
  }));
}

const stats = { fetched: 0, religieux: 0, generique: 0, art: 0, obscur: 0, peuNotoire: 0, deny: 0, sansLabel: 0, doublon: 0 };
function curate(rows, kind, seen) {
  const out = [];
  for (const r of rows) {
    stats.fetched++;
    if (DENY_QIDS.has(r.qid)) { stats.deny++; continue; }
    if (YEAR_OVERRIDE[r.qid]) r.year = YEAR_OVERRIDE[r.qid];
    if (LABEL_OVERRIDE[r.qid]) r.label = LABEL_OVERRIDE[r.qid];
    if (!r.label || /^Q\d+$/.test(r.label) || !Number.isFinite(r.year)) { stats.sansLabel++; continue; }
    if (r.fame < (MIN_FAME[kind] || 0)) { stats.peuNotoire++; continue; }
    const norm = normalize(r.label);
    if (FORBIDDEN.some((re) => re.test(` ${norm} `)) || FORBIDDEN.some((re) => re.test(norm))) { stats.religieux++; continue; }
    if (kind !== "naissance" && ART.test(r.desc)) { stats.art++; continue; }
    if (kind !== "naissance" && OBSCURE.test(`${norm} ${normalize(r.desc)}`)) { stats.obscur++; continue; }
    if (kind !== "naissance" && GENERIC.some((re) => re.test(norm))) { stats.generique++; continue; }
    const isBirth = kind === "naissance";
    const label = isBirth ? `Naissance de ${r.label}` : cap(r.label);
    const id = kebab(label) || kebab(r.qid);
    const key = isBirth ? `naissance-${normalize(r.label)}` : norm;
    if (seen.has(key) || seen.has(id)) { stats.doublon++; continue; }
    seen.add(key); seen.add(id);
    const category = isBirth
      ? "histoire"
      : categorize(`${r.label} ${r.desc}`, kind === "evenement" ? "culture" : "patrimoine");
    const fallback = isBirth ? `Personnalité née à Lille.` : `À Lille (${r.year}).`;
    out.push({
      id, label, year: r.year, precision: "an", category,
      blurb: cleanBlurb(r.desc, fallback),
      sourceIds: ["wikidata"], wikidataId: r.qid, _fame: r.fame,
    });
  }
  return out;
}

function loadMerimeeMonuments(seen) {
  let data;
  try { data = JSON.parse(readFileSync(MERIMEE_PATH, "utf8")); } catch { return []; }
  const out = [];
  for (const m of data.monuments || []) {
    if (m.precision !== "an") continue; // années exactes : le siècle fausserait la date révélée
    if (MERIMEE_DENY.has(m.ref)) continue;
    const label = String(m.label || "").split(",")[0].trim(); // « Lycée Baggio, ... » -> « Lycée Baggio »
    const id = kebab(label);
    const key = normalize(label);
    if (!label || seen.has(key) || seen.has(id)) continue;
    seen.add(key); seen.add(id);
    out.push({ id, label, year: m.year, precision: "an", category: "patrimoine", blurb: m.blurb, sourceIds: ["merimee"], merimeeRef: m.ref });
  }
  return out;
}

async function main() {
  // 1) graines existantes -> re-sourcées proprement (placeholder -> wikipedia-fr)
  const current = JSON.parse(readFileSync(OUT, "utf8"));
  // idempotence : on ne garde QUE les graines rédigées main (sans wikidataId), pas nos propres sorties
  const seeds = (current.events || [])
    .filter((e) => !e.wikidataId && !e.merimeeRef)
    .map((e) => ({
      ...e,
      sourceIds: (e.sourceIds || []).map((s) => (s === "wikipedia-a-sourcer" ? "wikipedia-fr" : s)),
    }));
  const seen = new Set();
  seeds.forEach((e) => { seen.add(e.id); seen.add(normalize(e.label)); });

  // 2) fetch + curation Wikidata (pools séparés, déjà triés par notoriété)
  const CAPS = { lieu: 52, naissance: 12, evenement: 18 }; // équilibrage : éviter une frise « 100 % naissances »
  const pools = {};
  for (const q of QUERIES) {
    process.stderr.write(`… requête « ${q.kind} »\n`);
    const rows = await runQuery(q.sparql);
    pools[q.kind] = curate(rows, q.kind, seen);
  }

  // 3) plafonnement par type puis fusion
  const selectedRaw = Object.entries(CAPS).flatMap(([kind, cap]) => (pools[kind] || []).slice(0, cap));
  if (process.env.LABAJ_DEBUG) {
    [...selectedRaw].sort((a, b) => a.year - b.year).forEach((e) =>
      process.stderr.write(`  ${(e.wikidataId || "").padEnd(11)} fame ${String(e._fame).padStart(3)} [${e.category.padEnd(16)}] ${e.year}  ${e.label}\n`)
    );
  }
  const picked = selectedRaw.map(({ _fame, ...e }) => e);

  // 3bis) monuments Mérimée (socle mutualisé, Licence Ouverte) — années exactes seulement
  const merimee = loadMerimeeMonuments(seen);

  // 4) fusion + tri chronologique
  const events = [...seeds.map(({ _fame, ...e }) => e), ...picked, ...merimee].sort((a, b) => a.year - b.year);
  const byCat = {};
  events.forEach((e) => (byCat[e.category] = (byCat[e.category] || 0) + 1));

  const corpus = {
    description: "Faits datés du patrimoine et de l'histoire de Lille et des Hauts-de-France pour « La Frise du Nord ». Graines rédigées main + faits issus de Wikidata (CC0) via tools/build-events-from-wikidata.mjs. Blurbs auto = brouillons à polir.",
    epochId: current.epochId || "2026-01-01",
    status: "draft",
    generatedAt: process.env.LABAJ_BUILD_DATE || "",
    events,
  };
  writeFileSync(OUT, JSON.stringify(corpus, null, 2) + "\n");

  process.stderr.write(
    `\nOK — ${events.length} faits écrits (${seeds.length} graines + ${picked.length} Wikidata + ${merimee.length} Mérimée).\n` +
    `Récupérés: ${stats.fetched} | écartés → peu notoires: ${stats.peuNotoire}, institutions/obscurs: ${stats.obscur}, religieux: ${stats.religieux}, œuvres: ${stats.art}, génériques: ${stats.generique}, sans label: ${stats.sansLabel}, doublons: ${stats.doublon}\n` +
    `Catégories: ${JSON.stringify(byCat)} | années: ${events[0]?.year}–${events[events.length - 1]?.year}\n`
  );
}
main().catch((e) => { console.error("ÉCHEC:", e.message); process.exit(1); });
