import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const documentationRoot = path.resolve(__dirname, "..");
const corpusRoot = path.resolve(documentationRoot, "..");
const repoRoot = path.resolve(corpusRoot, "..", "..");
const apiUrl = "https://fr.wikipedia.org/w/api.php";
const generatedAt = new Date().toISOString();
const userAgent = "LaBaraqueAJeuxLilleCorpusBot/0.1 (local documentary corpus; https://fr.wikipedia.org/)";

const configs = {
  metro: {
    corpusFile: "metro-stations.json",
    outputSegment: "metro",
    logLabel: "metro",
    displayLabel: "stations de metro",
    searchQuery: (station) => `${station.nom} ${firstCommune(station.commune)} métro de Lille`,
    acceptedTitlePatterns: [/\(métro de Lille\)$/i],
    rejectedTitlePatterns: [/^métro de Lille$/i, /^ligne [12] du métro de Lille$/i],
    minimumScore: 70,
    purpose:
      "Copies brutes locales non versionnees des pages Wikipedia des stations de metro. Elles servent de matiere documentaire avant reformulation editoriale.",
    titleOverrides: new Map([
      ["4-cantons-stade-p-mauroy", "Quatre Cantons - Stade Pierre-Mauroy (métro de Lille)"],
      ["cite-scientifique", "Cité Scientifique - Professeur Gabillard (métro de Lille)"],
      ["hotel-de-ville-villeneuve-d-ascq", "Villeneuve-d'Ascq - Hôtel de Ville (métro de Lille)"],
      ["chu-centre-o-lambret", "CHU - Centre Oscar-Lambret (métro de Lille)"],
      ["chu-eurasante", "CHU - Eurasanté (métro de Lille)"],
      ["c-h-dron", "CH Dron (métro de Lille)"],
      ["hotel-de-ville-wasquehal", "Wasquehal - Hôtel de Ville (métro de Lille)"],
      ["ep-montesquieu", "Épeule - Montesquieu (métro de Lille)"],
      ["st-maurice-pellevoisin", "Saint-Maurice Pellevoisin (métro de Lille)"],
      ["st-philibert", "Saint-Philibert (métro de Lille)"],
      ["les-pres-e-pisani", "Les Prés - Edgard-Pisani (métro de Lille)"],
      ["lille-europe", "Gare Lille-Europe (métro de Lille)"],
      ["mairie-de-lille", "Mairie de Lille (métro de Lille)"],
      ["port-de-lille", "Port de Lille (métro de Lille)"],
      ["gare-lille-flandres", "Gare Lille-Flandres (métro de Lille)"],
    ]),
  },
  tramway: {
    corpusFile: "tram-stations.json",
    outputSegment: "tramway",
    logLabel: "tramway",
    displayLabel: "stations de tramway",
    searchQuery: (station) => `${station.nom} ${firstCommune(station.commune)} tramway Lille Roubaix Tourcoing`,
    acceptedTitlePatterns: [/\(tramway .*\)$/i, /\(métro de Lille\)$/i],
    rejectedTitlePatterns: [
      /^tramway du grand boulevard$/i,
      /^tramway de Lille Métropole$/i,
      /^liste des stations du métro et du tramway de Lille$/i,
      /^autobus de Lille Roubaix Tourcoing$/i,
      /^lignes de l'autobus de Lille Roubaix Tourcoing$/i,
      /^métropole européenne de Lille$/i,
    ],
    minimumScore: 70,
    purpose:
      "Copies brutes locales non versionnees des pages Wikipedia disponibles pour les stations de tramway. Les stations sans page dediee restent listees comme manquantes.",
    titleOverrides: new Map([
      ["euroteleport", "Eurotéléport (métro de Lille)"],
      ["wasquehal-pave-de-lille", "Wasquehal - Pavé de Lille (métro de Lille)"],
      ["lille-europe", "Gare Lille-Europe (métro de Lille)"],
      ["gare-lille-flandres", "Gare Lille-Flandres (métro de Lille)"],
      ["tourcoing-centre", "Tourcoing - Centre (métro de Lille)"],
    ]),
  },
};

const level = process.argv[2] ?? "metro";
const config = configs[level];
if (!config) {
  throw new Error(`Mode Wikipedia inconnu : ${level}. Modes disponibles : ${Object.keys(configs).join(", ")}.`);
}

const stationCorpusPath = path.join(corpusRoot, "station-mystere", config.corpusFile);
const outputRoot = path.join(documentationRoot, "raw", "wikipedia", "station-mystere", config.outputSegment);
const pagesRoot = path.join(outputRoot, "pages");
const stationCorpus = await readJson(stationCorpusPath);

await rm(pagesRoot, { recursive: true, force: true });
await mkdir(pagesRoot, { recursive: true });

const manifest = {
  generatedAt,
  level,
  source: {
    site: "Wikipédia en français",
    apiUrl,
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr",
    termsUrl: "https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use",
  },
  purpose: config.purpose,
  outputRoot: path.relative(repoRoot, outputRoot),
  pages: [],
  missing: [],
};

for (const station of stationCorpus.stations) {
  const result = await fetchStationPage(station);
  manifest.pages.push(result.manifestEntry);
  if (result.manifestEntry.status !== "found") manifest.missing.push(result.manifestEntry);
  await sleep(250);
}

await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
await writeFile(path.join(outputRoot, "README.txt"), buildReadme(manifest), "utf8");

const foundCount = manifest.pages.filter((page) => page.status === "found").length;
console.log(`Wikipedia ${config.logLabel} : ${foundCount}/${manifest.pages.length} pages recuperees.`);
if (manifest.missing.length > 0) {
  console.log("Pages manquantes ou incertaines :");
  for (const item of manifest.missing) console.log(`- ${item.stationId} (${item.stationName})`);
}
console.log(`Dossier local ignore par Git : ${path.relative(repoRoot, outputRoot)}`);

async function fetchStationPage(station) {
  const selected = await resolvePageTitle(station);
  const baseEntry = {
    stationId: station.id,
    stationName: station.nom,
    stationCommune: station.commune,
    status: selected ? "found" : "missing",
    selectedTitle: selected?.title ?? null,
    pageId: selected?.pageid ?? null,
    url: selected ? `https://fr.wikipedia.org/wiki/${encodeTitleForWikiUrl(selected.title)}` : null,
    searchResults: selected?.searchResults ?? [],
    files: null,
  };

  if (!selected) return { manifestEntry: baseEntry };

  const page = await fetchPageContent(selected.title);
  const wikiText = page.revisions?.[0]?.slots?.main?.content ?? "";
  const revision = page.revisions?.[0] ?? {};
  const parse = await fetchRenderedPage(selected.title);

  const files = {
    metadata: `pages/${station.id}.json`,
    wikitext: `pages/${station.id}.wiki`,
    html: `pages/${station.id}.html`,
  };

  const metadata = {
    station,
    selectedTitle: page.title,
    pageId: page.pageid,
    url: page.fullurl,
    canonicalUrl: page.canonicalurl,
    touched: page.touched,
    lastRevision: {
      id: revision.revid,
      parentId: revision.parentid,
      timestamp: revision.timestamp,
      user: revision.user,
      comment: revision.comment,
    },
    fetchedAt: generatedAt,
    license: manifest.source.license,
    licenseUrl: manifest.source.licenseUrl,
    api: {
      revisionQuery: buildApiUrl({
        action: "query",
        prop: "info|revisions",
        inprop: "url",
        rvprop: "ids|timestamp|user|comment|content",
        rvslots: "main",
        titles: selected.title,
        format: "json",
        formatversion: "2",
      }),
      parseQuery: buildApiUrl({
        action: "parse",
        page: selected.title,
        prop: "text|sections|categories|links|images|externallinks|displaytitle|iwlinks|properties",
        format: "json",
        formatversion: "2",
      }),
    },
    searchResults: selected.searchResults,
    parseMetadata: {
      displayTitle: parse.displaytitle,
      sections: parse.sections ?? [],
      categories: parse.categories ?? [],
      links: parse.links ?? [],
      images: parse.images ?? [],
      externalLinks: parse.externallinks ?? [],
      interwikiLinks: parse.iwlinks ?? [],
      properties: parse.properties ?? [],
    },
  };

  await writeFile(path.join(outputRoot, files.metadata), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  await writeFile(path.join(outputRoot, files.wikitext), wikiText, "utf8");
  await writeFile(path.join(outputRoot, files.html), parse.text, "utf8");

  return {
    manifestEntry: {
      ...baseEntry,
      pageId: page.pageid,
      selectedTitle: page.title,
      url: page.fullurl,
      revisionId: revision.revid,
      revisionTimestamp: revision.timestamp,
      files,
      byteLength: {
        wikitext: Buffer.byteLength(wikiText, "utf8"),
        html: Buffer.byteLength(parse.text, "utf8"),
      },
    },
  };
}

async function resolvePageTitle(station) {
  const overrideTitle = config.titleOverrides.get(station.id);
  const searchResults = await searchStation(station);
  if (overrideTitle) {
    const page = await fetchPageInfo(overrideTitle);
    if (page) return { title: page.title, pageid: page.pageid, searchResults };
  }

  const candidates = searchResults
    .filter((result) => result.ns === 0)
    .map((result, index) => ({ ...result, score: scoreSearchResult(station, result, index) }))
    .sort((a, b) => b.score - a.score);

  const best = candidates.find((candidate) => candidate.score >= config.minimumScore);
  if (!best) return null;
  return { title: best.title, pageid: best.pageid, searchResults };
}

async function searchStation(station) {
  const json = await fetchJson(
    buildApiUrl({
      action: "query",
      list: "search",
      srsearch: config.searchQuery(station),
      srlimit: "8",
      format: "json",
      formatversion: "2",
    }),
  );
  return json.query?.search ?? [];
}

function scoreSearchResult(station, result, index) {
  const title = normalize(result.title);
  const titleBase = normalize(result.title.replace(/\s*\([^)]*\)\s*$/i, ""));
  const stationName = normalize(station.nom);
  const commune = normalize(station.commune);
  const acceptedTitle = isAcceptedStationTitle(result.title);
  const sharedTokens = sharedTokenCount(titleBase, stationName);
  const stationTitleMatch =
    titleBase === stationName || titleBase.includes(stationName) || stationName.includes(titleBase) || sharedTokens >= 2;
  let score = Math.max(0, 20 - index);

  if (!acceptedTitle || !stationTitleMatch) return -500 + score;
  if (acceptedTitle) score += 110;
  if (titleBase === stationName) score += 80;
  if (titleBase.includes(stationName) || stationName.includes(titleBase)) score += 30;
  if (sharedTokens >= 1) score += 20;
  if (sharedTokens >= 2) score += 20;
  if (commune && sharedTokenCount(title, commune) >= 1) score += 10;
  if (isRejectedTitle(result.title)) score -= 140;
  if (!acceptedTitle) score -= 80;

  return score;
}

function isAcceptedStationTitle(title) {
  return config.acceptedTitlePatterns.some((pattern) => pattern.test(title));
}

function isRejectedTitle(title) {
  return config.rejectedTitlePatterns.some((pattern) => pattern.test(title));
}

async function fetchPageInfo(title) {
  const json = await fetchJson(
    buildApiUrl({
      action: "query",
      prop: "info",
      titles: title,
      format: "json",
      formatversion: "2",
    }),
  );
  const page = json.query?.pages?.[0];
  if (!page || page.missing) return null;
  return page;
}

async function fetchPageContent(title) {
  const json = await fetchJson(
    buildApiUrl({
      action: "query",
      prop: "info|revisions",
      inprop: "url",
      rvprop: "ids|timestamp|user|comment|content",
      rvslots: "main",
      titles: title,
      format: "json",
      formatversion: "2",
    }),
  );
  const page = json.query?.pages?.[0];
  if (!page || page.missing) throw new Error(`Page introuvable : ${title}`);
  return page;
}

async function fetchRenderedPage(title) {
  const json = await fetchJson(
    buildApiUrl({
      action: "parse",
      page: title,
      prop: "text|sections|categories|links|images|externallinks|displaytitle|iwlinks|properties",
      format: "json",
      formatversion: "2",
    }),
  );
  if (!json.parse) throw new Error(`Rendu introuvable : ${title}`);
  return json.parse;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": userAgent,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Erreur Wikipedia API ${response.status} sur ${url}`);
  }
  return response.json();
}

function buildApiUrl(params) {
  const url = new URL(apiUrl);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

function buildReadme(manifest) {
  return [
    `Corpus brut Wikipedia - ${config.displayLabel}`,
    "",
    "Ce dossier est ignore par Git.",
    "",
    "Il contient des copies locales integrales des pages Wikipedia recuperees via l'API MediaWiki :",
    "- un fichier .wiki avec le wikitexte integral ;",
    "- un fichier .html avec le rendu integral fourni par action=parse ;",
    "- un fichier .json avec les metadonnees, la revision et les liens.",
    "",
    `Source : ${manifest.source.site}`,
    `Licence : ${manifest.source.license} (${manifest.source.licenseUrl})`,
    `Conditions Wikimedia : ${manifest.source.termsUrl}`,
    `Date de recuperation : ${manifest.generatedAt}`,
    "",
    "Ces fichiers servent uniquement de matiere documentaire locale. Les fiches de jeu doivent etre reformulees et sourcees avant publication.",
    "",
  ].join("\n");
}

function sharedTokenCount(a, b) {
  const tokensA = new Set(tokenize(a));
  return tokenize(b).filter((token) => tokensA.has(token)).length;
}

function tokenize(value) {
  return normalize(value)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !["de", "du", "des", "la", "le", "les", "d", "l"].includes(token));
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "oe")
    .replace(/[’']/g, " ")
    .replace(/[-.]/g, " ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function firstCommune(value) {
  return value?.split("/")?.[0]?.trim() ?? "";
}

function encodeTitleForWikiUrl(title) {
  return encodeURIComponent(title.replaceAll(" ", "_"));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
