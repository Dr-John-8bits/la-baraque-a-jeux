import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stationCorpusRoot = path.resolve(__dirname, "..");
const sharedCorpusRoot = path.resolve(__dirname, "../..");
const rawTransportRoot = path.join(sharedCorpusRoot, "documentation", "raw", "transport");
const gtfsRoot = path.join(rawTransportRoot, "ilevia-gtfs");
const rawDataGouvRoot = path.join(sharedCorpusRoot, "documentation", "raw", "data-gouv");

const sourceIds = ["gtfs-ilevia-data-gouv", "ilevia-arret-point-datamel"];
const generatedAt = new Date().toISOString().slice(0, 10);
const stopMergeDistanceKm = 0.3;

await mkdir(stationCorpusRoot, { recursive: true });

const routes = parseCsv(await readText(path.join(gtfsRoot, "routes.txt")));
const stops = parseCsv(await readText(path.join(gtfsRoot, "stops.txt")));
const trips = parseCsv(await readText(path.join(gtfsRoot, "trips.txt")));
const arretPoint = await readJson(path.join(rawTransportRoot, "ilevia-arret-point.geojson"));
const communeNameByKey = await loadCommuneNameIndex();

const busRoutes = routes
  .filter((route) => Number(route.route_type) === 3)
  .sort((a, b) => routeNameSort(a.route_short_name, b.route_short_name));
const busRouteIds = new Set(busRoutes.map((route) => route.route_id));
const geoByStopId = new Map(
  arretPoint.features.map((feature) => [
    String(feature.properties.stop_id),
    {
      commune: canonicalCommuneName(feature.properties.commune),
      latitude: numberOrNull(feature.properties.y),
      longitude: numberOrNull(feature.properties.x),
    },
  ]),
);
const stopById = new Map(
  stops.map((stop) => {
    const geo = geoByStopId.get(stop.stop_id) ?? {};
    return [
      stop.stop_id,
      {
        id: stop.stop_id,
        nom: cleanLabel(stop.stop_name),
        description: cleanLabel(stop.stop_desc),
        commune: geo.commune ?? canonicalCommuneName(communeFromStopDescription(stop.stop_desc)),
        latitude: numberOrNull(stop.stop_lat) ?? geo.latitude ?? null,
        longitude: numberOrNull(stop.stop_lon) ?? geo.longitude ?? null,
        locationType: numberOrNull(stop.location_type),
        parentStation: stop.parent_station || null,
        wheelchairBoarding: numberOrNull(stop.wheelchair_boarding),
      },
    ];
  }),
);
const tripsById = new Map(
  trips
    .filter((trip) => busRouteIds.has(trip.route_id))
    .map((trip) => [
      trip.trip_id,
      {
        routeId: trip.route_id,
        headsign: cleanLabel(trip.trip_headsign),
        directionId: trip.direction_id || "0",
      },
    ]),
);

const directionBuckets = collectTripPatterns(
  await readText(path.join(gtfsRoot, "stop_times.txt")),
  tripsById,
);
const stopDraftsByKey = new Map();
const stopKeysByName = new Map();
const routeById = new Map(busRoutes.map((route) => [route.route_id, route]));

const lines = busRoutes.map((route) => buildLine(route));
const stopIdsByKey = assignStopIds(stopDraftsByKey);
const stopIdsByGtfsStopId = mapGtfsStopIdsToStopIds(stopDraftsByKey, stopIdsByKey);
const linesWithStopIds = lines.map((line) => ({
  ...line,
  directions: line.directions.map((direction) => ({
    ...direction,
    patterns: direction.patterns.map((pattern) => ({
      ...pattern,
      stops: pattern.stops.map((stop) => ({
        ...stop,
        id: stopIdsByGtfsStopId.get(stop.stopId),
      })),
    })),
  })),
}));
const stopsOutput = [...stopDraftsByKey.values()]
  .map((stop) => finalizeStop(stop, stopIdsByKey))
  .sort((a, b) => stopSortKey(a).localeCompare(stopSortKey(b), "fr", { numeric: true }));

const lineCategoryCounts = new Map();
for (const line of linesWithStopIds) {
  lineCategoryCounts.set(line.categorie, (lineCategoryCounts.get(line.categorie) ?? 0) + 1);
}
const communeCounts = new Map();
for (const stop of stopsOutput) {
  for (const commune of stop.communes) communeCounts.set(commune, (communeCounts.get(commune) ?? 0) + 1);
}

const output = {
  generatedAt,
  status: "technical-baseline",
  description:
    "Premier corpus technique complet pour le niveau 3 Bus Mystere. Il conserve les lignes, parcours distincts et arrets regroupes avant selection editoriale.",
  level: "bus",
  sourceIds,
  stats: {
    lineCount: linesWithStopIds.length,
    directionCount: linesWithStopIds.reduce((sum, line) => sum + line.directions.length, 0),
    patternCount: linesWithStopIds.reduce(
      (sum, line) => sum + line.directions.reduce((dirSum, direction) => dirSum + direction.patterns.length, 0),
      0,
    ),
    stopCount: stopsOutput.length,
    rawGtfsStopPointCount: new Set(
      stopsOutput.flatMap((stop) => stop.identifiants.gtfsStopIds),
    ).size,
    candidateHubCount: stopsOutput.filter((stop) => stop.usageJeu.statut === "pole-candidat").length,
    candidateToStudyCount: stopsOutput.filter((stop) => stop.usageJeu.statut === "candidat-a-etudier").length,
    inventoryOnlyCount: stopsOutput.filter((stop) => stop.usageJeu.statut === "inventaire").length,
    communeCount: communeCounts.size,
    lineCategories: Object.fromEntries([...lineCategoryCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]))),
    raw: {
      gtfsRoutes: routes.length,
      gtfsStops: stops.length,
      gtfsTrips: trips.length,
      arretPointFeatures: arretPoint.features.length,
    },
  },
  notes: [
    "Base derivee du GTFS Ilévia et du GeoJSON dataMEL des arrets.",
    "Toutes les lignes GTFS route_type=3 sont conservees, y compris scolaires, resa et dessertes speciales.",
    "Les arrets sont regroupes par nom et proximite geographique afin de reduire les doublons de quais ou de sens.",
    "Les statuts de jeu sont heuristiques et servent uniquement a prioriser le travail editorial.",
  ],
  communes: [...communeCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
    .map(([nom, stopCount]) => ({ nom, stopCount })),
  hubs: stopsOutput
    .filter((stop) => stop.usageJeu.statut !== "inventaire")
    .slice()
    .sort((a, b) => b.usageJeu.score - a.usageJeu.score || b.lignes.length - a.lignes.length)
    .slice(0, 80)
    .map((stop) => ({
      id: stop.id,
      nom: stop.nom,
      commune: stop.commune,
      lignes: stop.lignes,
      score: stop.usageJeu.score,
      statut: stop.usageJeu.statut,
      raisons: stop.usageJeu.raisons,
    })),
  lines: linesWithStopIds,
  stops: stopsOutput,
};

await writeJson(path.join(stationCorpusRoot, "bus-network.json"), output);

console.log("Corpus Bus Station Mystere genere.");
console.log(`- lignes bus: ${output.stats.lineCount}`);
console.log(`- parcours distincts: ${output.stats.patternCount}`);
console.log(`- arrets regroupes: ${output.stats.stopCount}`);
console.log(`- poles candidats: ${output.stats.candidateHubCount}`);
console.log(`- candidats a etudier: ${output.stats.candidateToStudyCount}`);

function buildLine(route) {
  const directions = [...directionBuckets.values()]
    .filter((bucket) => bucket.routeId === route.route_id)
    .sort((a, b) => String(a.directionId).localeCompare(String(b.directionId)))
    .map((bucket) => buildDirection(route, bucket));

  const communes = new Set();
  const stopIds = new Set();
  for (const direction of directions) {
    for (const pattern of direction.patterns) {
      for (const stop of pattern.stops) {
        stopIds.add(stop.stopId);
        if (stop.commune) communes.add(stop.commune);
      }
    }
  }

  return {
    id: route.route_id,
    nomCourt: route.route_short_name,
    nom: cleanLabel(route.route_long_name),
    description: cleanLabel(route.route_desc),
    categorie: classifyRoute(route),
    couleur: route.route_color || null,
    couleurTexte: route.route_text_color || null,
    communes: [...communes].sort(localeSort),
    stopPointCount: stopIds.size,
    directions,
  };
}

function buildDirection(route, bucket) {
  const patterns = [...bucket.patterns.values()]
    .sort((a, b) => b.count - a.count || b.stopIds.length - a.stopIds.length)
    .map((pattern, index) => buildPattern(route, bucket, pattern, index + 1));
  const totalTripCount = patterns.reduce((sum, pattern) => sum + pattern.trajetCount, 0);
  return {
    directionId: bucket.directionId,
    patternCount: patterns.length,
    totalTripCount,
    representativePatternId: patterns[0]?.patternId ?? null,
    girouettes: topEntries(bucket.headsigns, 8).map(([label, count]) => ({ label, count })),
    patterns,
  };
}

function buildPattern(route, bucket, pattern, index) {
  const stopsForPattern = pattern.stopIds.map((stopId, stopIndex) => {
    const stop = stopById.get(stopId);
    if (!stop) throw new Error(`Stop GTFS introuvable: ${stopId}`);
    return {
      stopId,
      nom: stop.nom,
      commune: stop.commune,
      sequence: stopIndex + 1,
      coordonnees: {
        latitude: stop.latitude,
        longitude: stop.longitude,
      },
    };
  });
  const patternId = `${route.route_id}-${bucket.directionId}-${index}`;
  const patternOutput = {
    patternId,
    trajetCount: pattern.count,
    stopCount: stopsForPattern.length,
    terminusDepart: stopsForPattern[0]?.nom ?? null,
    terminusArrivee: stopsForPattern.at(-1)?.nom ?? null,
    stops: stopsForPattern,
  };

  for (const stop of stopsForPattern) {
    addStopOccurrence(stop.stopId, {
      ligne: route.route_short_name,
      routeId: route.route_id,
      routeCategorie: classifyRoute(route),
      directionId: bucket.directionId,
      patternId,
      sequence: stop.sequence,
      trajetCount: pattern.count,
      terminusDepart: patternOutput.terminusDepart,
      terminusArrivee: patternOutput.terminusArrivee,
      isTerminus: stop.sequence === 1 || stop.sequence === stopsForPattern.length,
    });
  }

  return patternOutput;
}

function addStopOccurrence(stopId, occurrence) {
  const stop = stopById.get(stopId);
  const stopKey = findOrCreateStopKey(stop);
  if (!stopDraftsByKey.has(stopKey)) {
    stopDraftsByKey.set(stopKey, {
      stopKey,
      gtfsStopIds: new Set(),
      nom: stop.nom,
      communes: new Set(),
      coordonneesSamples: [],
      descriptionsGtfs: new Set(),
      wheelchairBoardingValues: new Set(),
      lignes: new Set(),
      routeCategories: new Set(),
      occurrences: [],
    });
  }
  const draft = stopDraftsByKey.get(stopKey);
  draft.gtfsStopIds.add(stopId);
  if (stop.commune) draft.communes.add(stop.commune);
  if (stop.description) draft.descriptionsGtfs.add(stop.description);
  if (stop.wheelchairBoarding !== null) draft.wheelchairBoardingValues.add(stop.wheelchairBoarding);
  if (Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude)) {
    draft.coordonneesSamples.push({ latitude: stop.latitude, longitude: stop.longitude });
  }
  draft.lignes.add(occurrence.ligne);
  draft.routeCategories.add(occurrence.routeCategorie);
  draft.occurrences.push(occurrence);
}

function findOrCreateStopKey(stop) {
  const nameKey = normalizeKey(stop.nom);
  if (!stopKeysByName.has(nameKey)) stopKeysByName.set(nameKey, []);
  const candidates = stopKeysByName.get(nameKey);
  const candidate = candidates.find((key) => isSameGroupedStop(stopDraftsByKey.get(key), stop));
  if (candidate) return candidate;

  const key = `${nameKey}|${candidates.length + 1}`;
  candidates.push(key);
  return key;
}

function isSameGroupedStop(draft, stop) {
  if (!draft) return false;
  if (draft.coordonneesSamples.length === 0 || !Number.isFinite(stop.latitude) || !Number.isFinite(stop.longitude)) {
    return stop.commune ? draft.communes.has(stop.commune) : false;
  }
  const average = averageCoordinates(draft.coordonneesSamples);
  return distanceKm(average, { latitude: stop.latitude, longitude: stop.longitude }) <= stopMergeDistanceKm;
}

function assignStopIds(stopDrafts) {
  const byBaseSlug = new Map();
  for (const stop of stopDrafts.values()) {
    const baseSlug = slugify(stop.nom);
    if (!byBaseSlug.has(baseSlug)) byBaseSlug.set(baseSlug, []);
    byBaseSlug.get(baseSlug).push(stop);
  }

  const used = new Set();
  const ids = new Map();
  for (const stop of stopDrafts.values()) {
    const baseSlug = slugify(stop.nom);
    const homonyms = byBaseSlug.get(baseSlug);
    let id = homonyms.length > 1 ? `bus-${baseSlug}-${slugify(stopCommuneLabel(stop))}` : `bus-${baseSlug}`;
    if (used.has(id)) id = `${id}-${slugify([...stop.gtfsStopIds][0])}`;
    used.add(id);
    ids.set(stop.stopKey, id);
  }
  return ids;
}

function mapGtfsStopIdsToStopIds(stopDraftsByKey, stopIdsByKey) {
  const ids = new Map();
  for (const stop of stopDraftsByKey.values()) {
    for (const gtfsStopId of stop.gtfsStopIds) {
      ids.set(gtfsStopId, stopIdsByKey.get(stop.stopKey));
    }
  }
  return ids;
}

function finalizeStop(stop, stopIdsByKey) {
  const lignes = [...stop.lignes].sort(routeNameSort);
  const routeCategories = [...stop.routeCategories].sort(localeSort);
  const positions = stop.occurrences
    .sort(
      (a, b) =>
        routeNameSort(a.ligne, b.ligne) ||
        String(a.directionId).localeCompare(String(b.directionId), "fr") ||
        b.trajetCount - a.trajetCount ||
        a.sequence - b.sequence,
    )
    .map((occurrence) => ({
      ligne: occurrence.ligne,
      routeId: occurrence.routeId,
      routeCategorie: occurrence.routeCategorie,
      directionId: occurrence.directionId,
      patternId: occurrence.patternId,
      sequence: occurrence.sequence,
      trajetCount: occurrence.trajetCount,
      terminusDepart: occurrence.terminusDepart,
      terminusArrivee: occurrence.terminusArrivee,
      isTerminus: occurrence.isTerminus,
    }));
  const usageJeu = buildGameUsage(stop, lignes, positions);

  return {
    id: stopIdsByKey.get(stop.stopKey),
    type: "bus-stop",
    niveau: "bus",
    nom: stop.nom,
    nomTechnique: stop.nom,
    commune: stopCommuneLabel(stop),
    communes: [...stop.communes].sort(localeSort),
    coordonnees: averageCoordinates(stop.coordonneesSamples),
    lignes,
    categoriesLignes: routeCategories,
    lineCount: lignes.length,
    isTerminus: positions.some((position) => position.isTerminus),
    identifiants: {
      gtfsStopIds: [...stop.gtfsStopIds].sort((a, b) => a.localeCompare(b, "fr", { numeric: true })),
    },
    accessibilite: {
      wheelchairBoardingValues: [...stop.wheelchairBoardingValues].sort((a, b) => a - b),
    },
    positions,
    usageJeu,
    indicesTechniques: buildTechnicalHints(stop, lignes, positions),
    ficheDecouverte: {
      statut: "a-enrichir",
      description: null,
      quartier: null,
      proximite: [],
      roleTransport: null,
      anecdote: null,
      particularites: [],
      sourceIds: [],
    },
    sourceIds,
  };
}

function buildGameUsage(stop, lignes, positions) {
  const reasons = [];
  let score = lignes.length;
  const terminusLineCount = new Set(positions.filter((position) => position.isTerminus).map((position) => position.ligne))
    .size;
  if (terminusLineCount > 0) {
    score += Math.min(terminusLineCount, 5);
    reasons.push("terminus");
  }
  if (lignes.length >= 5) reasons.push("nombreuses-lignes");
  if (lignes.length >= 3 && lignes.length < 5) reasons.push("plusieurs-lignes");
  const normalizedName = normalizeKey(stop.nom);
  if (/\b(gare|euroteleport|porte|mairie|hotel de ville|centre|flandres|europe)\b/.test(normalizedName)) {
    score += 2;
    reasons.push("nom-repere");
  }
  const hasRegularLine = positions.some((position) => position.routeCategorie === "regular" || position.routeCategorie === "liane");
  if (hasRegularLine) {
    score += 1;
    reasons.push("ligne-structurante-ou-reguliere");
  }

  let statut = "inventaire";
  if (score >= 7 || lignes.length >= 5) statut = "pole-candidat";
  else if (score >= 4 || lignes.length >= 3) statut = "candidat-a-etudier";

  return {
    statut,
    score,
    raisons: [...new Set(reasons)].sort(localeSort),
  };
}

function buildTechnicalHints(stop, lignes, positions) {
  const hints = ["Je suis un arrêt ou pôle bus du réseau Ilévia."];
  const commune = stopCommuneLabel(stop);
  if (commune) hints.push(`Je suis situé à ${commune}.`);
  if (lignes.length === 1) hints.push(`Je suis desservi par la ligne ${lignes[0]}.`);
  if (lignes.length > 1) hints.push(`Je suis desservi par ${lignes.length} lignes bus.`);
  if (positions.some((position) => position.isTerminus)) hints.push("Je suis un terminus sur au moins un parcours.");
  return [...new Set(hints)];
}

function classifyRoute(route) {
  const shortName = route.route_short_name ?? "";
  const text = normalizeKey([route.route_long_name, route.route_desc, shortName].join(" "));
  if (/^9\d{2}$/.test(shortName) || text.includes("scolaire") || text.includes("college")) return "school";
  if (shortName.endsWith("R") || text.includes("resa")) return "resa";
  if (/^L\d/.test(shortName)) return "liane";
  if (/^CO\d/.test(shortName)) return "corolle";
  if (/^CIT/.test(shortName)) return "citadine";
  if (/^N\d/.test(shortName)) return "night";
  if (/^(MWR|NVL|STAD|Z\d)/.test(shortName)) return "special";
  return "regular";
}

function collectTripPatterns(stopTimesText, tripsById) {
  const tripStops = new Map();
  const lines = stopTimesText.split(/\r?\n/);
  const headers = parseCsvRecord(lines[0]);
  const indexes = Object.fromEntries(headers.map((header, index) => [header, index]));

  for (let i = 1; i < lines.length; i += 1) {
    if (!lines[i]) continue;
    const row = parseCsvRecord(lines[i]);
    const tripId = row[indexes.trip_id];
    if (!tripsById.has(tripId)) continue;
    if (!tripStops.has(tripId)) tripStops.set(tripId, []);
    tripStops.get(tripId).push({
      stopId: row[indexes.stop_id],
      sequence: Number(row[indexes.stop_sequence]),
    });
  }

  const buckets = new Map();
  for (const [tripId, stopEntries] of tripStops) {
    const trip = tripsById.get(tripId);
    const key = `${trip.routeId}:${trip.directionId}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        routeId: trip.routeId,
        directionId: trip.directionId,
        headsigns: new Map(),
        patterns: new Map(),
      });
    }
    const bucket = buckets.get(key);
    if (trip.headsign) increment(bucket.headsigns, trip.headsign);
    const stopIds = stopEntries
      .sort((a, b) => a.sequence - b.sequence)
      .map((entry) => entry.stopId);
    const patternKey = stopIds.join("|");
    if (!bucket.patterns.has(patternKey)) bucket.patterns.set(patternKey, { count: 0, stopIds });
    bucket.patterns.get(patternKey).count += 1;
  }

  return buckets;
}

async function loadCommuneNameIndex() {
  const files = [
    path.join(rawDataGouvRoot, "mel-communes.geojson"),
    path.join(rawDataGouvRoot, "mel-communes-associees.geojson"),
  ];
  const entries = [];
  for (const file of files) {
    const data = await readJson(file);
    for (const feature of data.features) entries.push(feature.properties.nom);
  }
  return new Map(entries.map((name) => [normalizeKey(name), name]));
}

function canonicalCommuneName(value) {
  if (!value) return null;
  return communeNameByKey.get(normalizeKey(value)) ?? titleCase(value);
}

function parseCsv(text) {
  const rows = [];
  let record = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      record.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      record.push(field);
      rows.push(record);
      record = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || record.length) {
    record.push(field);
    rows.push(record);
  }

  const headers = rows.shift();
  return rows
    .filter((row) => row.length > 1 || row[0])
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
}

function parseCsvRecord(line) {
  const values = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(field);
      field = "";
    } else {
      field += char;
    }
  }
  values.push(field);
  return values;
}

async function readText(file) {
  return readFile(file, "utf8");
}

async function readJson(file) {
  return JSON.parse(await readText(file));
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

function cleanLabel(value) {
  if (value === null || value === undefined) return null;
  return String(value).replace(/\s+/g, " ").trim() || null;
}

function compact(values) {
  return values.filter((value) => value !== null && value !== undefined && value !== "");
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function communeFromStopDescription(description) {
  if (!description) return null;
  const match = description.match(/\b\d{5}\s+(.+)$/);
  return match ? titleCase(match[1]) : null;
}

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[œŒ]/g, "oe")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(value) {
  return normalizeKey(value).replace(/\s+/g, "-") || "item";
}

function titleCase(value) {
  if (!value) return null;
  return String(value)
    .toLocaleLowerCase("fr")
    .split(/([ '\-])/)
    .map((part, index, parts) => {
      if (/^[ '\-]$/.test(part)) return part;
      if (index > 0 && parts[index - 1] === "'") return part;
      return part.charAt(0).toLocaleUpperCase("fr") + part.slice(1);
    })
    .join("");
}

function averageCoordinates(samples) {
  if (samples.length === 0) {
    return {
      latitude: null,
      longitude: null,
    };
  }
  const sum = samples.reduce(
    (acc, sample) => ({
      latitude: acc.latitude + sample.latitude,
      longitude: acc.longitude + sample.longitude,
    }),
    { latitude: 0, longitude: 0 },
  );
  return {
    latitude: roundCoordinate(sum.latitude / samples.length),
    longitude: roundCoordinate(sum.longitude / samples.length),
  };
}

function distanceKm(a, b) {
  if (!Number.isFinite(a.latitude) || !Number.isFinite(a.longitude)) return Number.POSITIVE_INFINITY;
  if (!Number.isFinite(b.latitude) || !Number.isFinite(b.longitude)) return Number.POSITIVE_INFINITY;
  const earthRadiusKm = 6371;
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLon = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function roundCoordinate(value) {
  return Number(value.toFixed(6));
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function stopCommuneLabel(stop) {
  return [...stop.communes].sort(localeSort).join(" / ") || null;
}

function routeNameSort(a, b) {
  return routeSortToken(a).localeCompare(routeSortToken(b), "fr", { numeric: true });
}

function routeSortToken(value) {
  return String(value).replace(/^M(\d+)$/, "M$1").replace(/^L(\d+)$/, "L$1");
}

function localeSort(a, b) {
  return String(a).localeCompare(String(b), "fr", { sensitivity: "base" });
}

function stopSortKey(stop) {
  return `${String(stop.lineCount).padStart(3, "0")}-${stop.commune}-${stop.nom}-${stop.id}`;
}

function topEntries(map, limit) {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr")).slice(0, limit);
}

function increment(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}
