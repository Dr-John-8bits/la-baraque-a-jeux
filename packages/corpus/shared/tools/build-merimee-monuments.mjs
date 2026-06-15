#!/usr/bin/env node
/*
 * Socle mutualisé : monuments historiques de Lille depuis la base Mérimée
 * (Ministère de la Culture, API Opendatasoft, Licence Ouverte 2.0).
 *
 * Produit `packages/corpus/shared/monuments-lille.json` : une liste curée de monuments
 * datés et reconnaissables, réutilisée par La Frise (faits datés) et Lille-Mêle (familles
 * patrimoine). Chaque édifice garde sa référence Mérimée (PA…) pour traçabilité.
 *
 * Curation (charte) : on écarte les libellés génériques (« Immeuble », « Maison »…),
 * les édifices cultuels (filtre religieux du validateur) et les notices sans date.
 * Re-jouable : `npm run build:merimee`
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "../monuments-lille.json");
const UA = { headers: { "User-Agent": "LaBaraqueAJeux/1.0 (+https://dr-john-8bits.github.io/la-baraque-a-jeux/; contact jean.debaecker@gmail.com)" } };
const DATASET = "liste-des-immeubles-proteges-au-titre-des-monuments-historiques";
const BASE = `https://data.culture.gouv.fr/api/explore/v2.1/catalog/datasets/${DATASET}/records`;
const SELECT = "reference,titre_editorial_de_la_notice,denomination_de_l_edifice,datation_de_l_edifice,siecle_de_la_campagne_principale_de_construction,auteur_de_l_edifice";

// libellés trop génériques (pas un repère reconnaissable)
const GENERIC = /^(immeubles?|maisons?|h[oô]tel particulier\b|ferme|usine|ensemble|edifice|propri[ée]t[ée]|ancien h[oô]tel\b|ancienne? maison|ancien immeuble|ancien b[aâ]timent|tour\b)/i;
// édifices cultuels : même filtre que validate-corpus.mjs (FORBIDDEN_LABEL_PATTERNS) + variantes
const FORBID = /\b(saint|sainte|st|ste|eglise|église|chapelle|calvaire|abbaye|temple|cathedrale|cathédrale|couvent|mosquee|synagogue|vierge|notre[\s-]dame|j[ée]suites?)\b/i;

const cap = (s) => { s = String(s || "").trim(); return s ? s[0].toUpperCase() + s.slice(1) : s; };
function dateOf(r) {
  const dt = (r.datation_de_l_edifice || "").match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
  if (dt) return { year: Number(dt[1]), precision: "an" };
  const sc = (r.siecle_de_la_campagne_principale_de_construction || "").match(/(\d+)\s*(?:e|er|ère|ème)?\s*si[èe]cle/i);
  if (sc) return { year: Number(sc[1]) * 100 - 50, precision: "siecle", century: Number(sc[1]) };
  return null;
}
function blurb(denom) {
  const d = (denom || "").split(";")[0].trim();
  return `${cap(d) || "Édifice"} — monument historique de Lille.`.slice(0, 180);
}

async function fetchAll() {
  const out = [];
  for (let offset = 0; offset < 1000; offset += 100) {
    const url = `${BASE}?where=${encodeURIComponent('commune_forme_editoriale like "Lille"')}&select=${encodeURIComponent(SELECT)}&limit=100&offset=${offset}`;
    const res = await fetch(url, UA);
    if (!res.ok) throw new Error(`Mérimée ${res.status} ${res.statusText}`);
    const json = await res.json();
    const rows = json.results || [];
    out.push(...rows);
    if (rows.length < 100) break;
  }
  return out;
}

async function main() {
  const rows = await fetchAll();
  const stats = { fetched: rows.length, generique: 0, religieux: 0, sansDate: 0, doublon: 0 };
  const seen = new Set();
  const monuments = [];
  for (const r of rows) {
    const label = (r.titre_editorial_de_la_notice || "").trim();
    if (!label) { stats.sansDate++; continue; }
    if (GENERIC.test(label)) { stats.generique++; continue; }
    if (FORBID.test(label)) { stats.religieux++; continue; }
    const d = dateOf(r);
    if (!d) { stats.sansDate++; continue; }
    const key = label.toLowerCase();
    if (seen.has(key)) { stats.doublon++; continue; }
    seen.add(key);
    monuments.push({
      ref: r.reference,
      label,
      year: d.year,
      precision: d.precision,
      ...(d.century ? { century: d.century } : {}),
      category: "patrimoine",
      denomination: (r.denomination_de_l_edifice || "").split(";")[0].trim() || null,
      blurb: blurb(r.denomination_de_l_edifice),
      sourceIds: ["merimee"],
    });
  }
  monuments.sort((a, b) => a.year - b.year);
  const corpus = {
    description: "Monuments historiques de Lille (base Mérimée, Licence Ouverte). Socle mutualisé pour La Frise (faits datés) et Lille-Mêle (familles patrimoine). Généré par tools/build-merimee-monuments.mjs.",
    source: "merimee",
    generatedAt: process.env.LABAJ_BUILD_DATE || "",
    monuments,
  };
  writeFileSync(OUT, JSON.stringify(corpus, null, 2) + "\n");
  const exact = monuments.filter((m) => m.precision === "an").length;
  process.stderr.write(
    `OK — ${monuments.length} monuments écrits (année exacte: ${exact}, siècle: ${monuments.length - exact}).\n` +
    `Récupérés: ${stats.fetched} | écartés → génériques: ${stats.generique}, religieux: ${stats.religieux}, sans date/titre: ${stats.sansDate}, doublons: ${stats.doublon}\n`
  );
}
main().catch((e) => { console.error("ÉCHEC:", e.message); process.exit(1); });
