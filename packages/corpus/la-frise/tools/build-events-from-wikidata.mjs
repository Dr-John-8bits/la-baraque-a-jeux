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
// œuvres de musée (datées mais hors-sujet pour une frise de lieux/événements) — repérées via la description
const ART = /^(tableau|peinture|toile|sculpture|statue|gravure|estampe|dessin|œuvre|retable|triptyque|portrait|vitrail)\b/i;
// corrections issues de la vérification factuelle adverse (cf. workflow verif-frise-dates)
const DENY_QIDS = new Set([
  "Q2421499", // « Lille Grand Palais » : QID = station de métro (1989), inception 1899 erronée — entrée écartée
]);
const YEAR_OVERRIDE = {
  Q801098: 1848, // Gare de Lille-Flandres : ouverture voyageurs intra-muros 1848 (P571=1842 = début des travaux à Fives)
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

const stats = { fetched: 0, religieux: 0, generique: 0, art: 0, deny: 0, sansLabel: 0, doublon: 0 };
function curate(rows, kind, seen) {
  const out = [];
  for (const r of rows) {
    stats.fetched++;
    if (DENY_QIDS.has(r.qid)) { stats.deny++; continue; }
    if (YEAR_OVERRIDE[r.qid]) r.year = YEAR_OVERRIDE[r.qid];
    if (!r.label || /^Q\d+$/.test(r.label) || !Number.isFinite(r.year)) { stats.sansLabel++; continue; }
    const norm = normalize(r.label);
    if (FORBIDDEN.some((re) => re.test(` ${norm} `)) || FORBIDDEN.some((re) => re.test(norm))) { stats.religieux++; continue; }
    if (kind !== "naissance" && ART.test(r.desc)) { stats.art++; continue; }
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

async function main() {
  // 1) graines existantes -> re-sourcées proprement (placeholder -> wikipedia-fr)
  const current = JSON.parse(readFileSync(OUT, "utf8"));
  // idempotence : on ne garde QUE les graines rédigées main (sans wikidataId), pas nos propres sorties
  const seeds = (current.events || [])
    .filter((e) => !e.wikidataId)
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
  const picked = Object.entries(CAPS)
    .flatMap(([kind, cap]) => (pools[kind] || []).slice(0, cap))
    .map(({ _fame, ...e }) => e);

  // 4) fusion + tri chronologique
  const events = [...seeds.map(({ _fame, ...e }) => e), ...picked].sort((a, b) => a.year - b.year);
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
    `\nOK — ${events.length} faits écrits (${seeds.length} graines + ${picked.length} Wikidata).\n` +
    `Récupérés: ${stats.fetched} | écartés → religieux: ${stats.religieux}, œuvres: ${stats.art}, génériques: ${stats.generique}, sans label: ${stats.sansLabel}, doublons: ${stats.doublon}\n` +
    `Catégories: ${JSON.stringify(byCat)} | années: ${events[0]?.year}–${events[events.length - 1]?.year}\n`
  );
}
main().catch((e) => { console.error("ÉCHEC:", e.message); process.exit(1); });
