import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stationCorpusRoot = path.resolve(__dirname, "..");
const sharedCorpusRoot = path.resolve(__dirname, "../..");
const rawTransportRoot = path.join(sharedCorpusRoot, "documentation", "raw", "transport");
const gtfsRoot = path.join(rawTransportRoot, "ilevia-gtfs");

const sourceIds = ["gtfs-ilevia-data-gouv", "ilevia-arret-point-datamel"];
const generatedAt = new Date().toISOString().slice(0, 10);

await mkdir(stationCorpusRoot, { recursive: true });

const routes = parseCsv(await readText(path.join(gtfsRoot, "routes.txt")));
const stops = parseCsv(await readText(path.join(gtfsRoot, "stops.txt")));
const trips = parseCsv(await readText(path.join(gtfsRoot, "trips.txt")));
const arretPoint = await readJson(path.join(rawTransportRoot, "ilevia-arret-point.geojson"));
const communeNameByKey = await loadCommuneNameIndex();

const metroRoutes = routes
  .filter((route) => Number(route.route_type) === 1 && /^ME\d+$/.test(route.route_id))
  .sort((a, b) => routeSortToken(a.route_short_name).localeCompare(routeSortToken(b.route_short_name), "fr"));
const metroRouteIds = new Set(metroRoutes.map((route) => route.route_id));
const metroRouteById = new Map(metroRoutes.map((route) => [route.route_id, route]));
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
    .filter((trip) => metroRouteIds.has(trip.route_id))
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

const stationDraftsByKey = new Map();
const stationKeysByName = new Map();
const lines = metroRoutes.map((route) => {
  const directions = [...directionBuckets.values()]
    .filter((bucket) => bucket.routeId === route.route_id)
    .sort((a, b) => String(a.directionId).localeCompare(String(b.directionId)))
    .map((bucket) => buildDirection(route, bucket));

  return {
    id: route.route_id,
    nomCourt: route.route_short_name,
    nom: cleanLabel(route.route_long_name),
    description: cleanLabel(route.route_desc),
    couleur: route.route_color || null,
    couleurTexte: route.route_text_color || null,
    directions,
  };
});

const stationIdsByKey = assignStationIds(stationDraftsByKey);
const stationIdsByStopId = mapStopIdsToStationIds(stationDraftsByKey, stationIdsByKey);
const stations = [...stationDraftsByKey.values()]
  .map((station) => finalizeStation(station, stationIdsByKey))
  .sort((a, b) => stationSortKey(a).localeCompare(stationSortKey(b), "fr", { numeric: true }));

const linesWithStationIds = lines.map((line) => ({
  ...line,
  directions: line.directions.map((direction) => ({
    ...direction,
    stations: direction.stations.map((station) => ({
      ...station,
      id: stationIdsByStopId.get(station.stopId),
    })),
  })),
}));

const output = {
  generatedAt,
  status: "technical-baseline",
  description:
    "Premier corpus technique pour le niveau 1 Metro Mystere. Les champs culturels sont a enrichir et sourcer avant publication jouable.",
  level: "metro",
  sourceIds,
  stats: {
    lineCount: linesWithStationIds.length,
    stationCount: stations.length,
    stationsByLine: Object.fromEntries(
      linesWithStationIds.map((line) => [
        line.nomCourt,
        new Set(line.directions.flatMap((direction) => direction.stations.map((station) => station.id))).size,
      ]),
    ),
    transferStationCount: stations.filter((station) => station.lignes.length > 1).length,
    ambiguousNameCount: ambiguousNameGroups(stations).length,
    raw: {
      gtfsRoutes: routes.length,
      gtfsStops: stops.length,
      gtfsTrips: trips.length,
      arretPointFeatures: arretPoint.features.length,
    },
  },
  notes: [
    "Base derivee du GTFS Ilévia et du GeoJSON dataMEL des arrets.",
    "Les libelles proviennent des donnees techniques et devront etre relus editorialement, notamment les accents et abreviations.",
    "Les stations homonymes sont distinguees par commune dans leur identifiant stable.",
  ],
  lines: linesWithStationIds,
  stations,
};

await writeJson(path.join(stationCorpusRoot, "metro-stations.json"), output);

console.log("Corpus Metro Station Mystere genere.");
console.log(`- lignes: ${output.stats.lineCount}`);
console.log(`- stations: ${output.stats.stationCount}`);
console.log(`- correspondances metro: ${output.stats.transferStationCount}`);
console.log(`- noms ambigus: ${output.stats.ambiguousNameCount}`);

function buildDirection(route, bucket) {
  const pattern = [...bucket.patterns.values()].sort(
    (a, b) => b.count - a.count || b.stopIds.length - a.stopIds.length,
  )[0];
  const stopsForDirection = pattern.stopIds.map((stopId, index) => {
    const stop = stopById.get(stopId);
    if (!stop) throw new Error(`Stop GTFS introuvable: ${stopId}`);
    return {
      stopId,
      nom: stop.nom,
      commune: stop.commune,
      sequence: index + 1,
      coordonnees: {
        latitude: stop.latitude,
        longitude: stop.longitude,
      },
    };
  });

  const direction = {
    directionId: bucket.directionId,
    trajetRepresentatifCount: pattern.count,
    terminusDepart: stopsForDirection[0]?.nom ?? null,
    terminusArrivee: stopsForDirection.at(-1)?.nom ?? null,
    girouettes: topEntries(bucket.headsigns, 6).map(([label, count]) => ({ label, count })),
    stations: stopsForDirection,
  };

  for (const stop of stopsForDirection) {
    addStationOccurrence(stop.stopId, {
      ligne: route.route_short_name,
      routeId: route.route_id,
      directionId: direction.directionId,
      sequence: stop.sequence,
      terminusDepart: direction.terminusDepart,
      terminusArrivee: direction.terminusArrivee,
      isTerminus: stop.sequence === 1 || stop.sequence === stopsForDirection.length,
    });
  }

  return direction;
}

function addStationOccurrence(stopId, occurrence) {
  const stop = stopById.get(stopId);
  const stationKey = findOrCreateStationKey(stop);
  if (!stationDraftsByKey.has(stationKey)) {
    stationDraftsByKey.set(stationKey, {
      stationKey,
      stopIds: new Set(),
      nom: stop.nom,
      communes: new Set(),
      coordonneesSamples: [],
      descriptionGtfs: stop.description,
      locationType: stop.locationType,
      wheelchairBoarding: stop.wheelchairBoarding,
      lignes: new Set(),
      occurrences: [],
    });
  }
  const station = stationDraftsByKey.get(stationKey);
  station.stopIds.add(stopId);
  if (stop.commune) station.communes.add(stop.commune);
  if (Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude)) {
    station.coordonneesSamples.push({ latitude: stop.latitude, longitude: stop.longitude });
  }
  station.lignes.add(occurrence.ligne);
  station.occurrences.push(occurrence);
}

function assignStationIds(stationDrafts) {
  const byBaseSlug = new Map();
  for (const station of stationDrafts.values()) {
    const baseSlug = slugify(station.nom);
    if (!byBaseSlug.has(baseSlug)) byBaseSlug.set(baseSlug, []);
    byBaseSlug.get(baseSlug).push(station);
  }

  const used = new Set();
  const ids = new Map();
  for (const station of stationDrafts.values()) {
    const baseSlug = slugify(station.nom);
    const homonyms = byBaseSlug.get(baseSlug);
    let id = homonyms.length > 1 ? `${baseSlug}-${slugify(stationCommuneLabel(station))}` : baseSlug;
    if (used.has(id)) id = `${id}-${slugify([...station.stopIds][0])}`;
    used.add(id);
    ids.set(station.stationKey, id);
  }
  return ids;
}

function mapStopIdsToStationIds(stationDraftsByKey, stationIdsByKey) {
  const ids = new Map();
  for (const station of stationDraftsByKey.values()) {
    for (const stopId of station.stopIds) {
      ids.set(stopId, stationIdsByKey.get(station.stationKey));
    }
  }
  return ids;
}

function finalizeStation(station, stationIdsByKey) {
  const lignes = [...station.lignes].sort(routeNameSort);
  const positions = station.occurrences
    .sort(
      (a, b) =>
        routeNameSort(a.ligne, b.ligne) ||
        String(a.directionId).localeCompare(String(b.directionId), "fr") ||
        a.sequence - b.sequence,
    )
    .map((occurrence) => ({
      ligne: occurrence.ligne,
      directionId: occurrence.directionId,
      sequence: occurrence.sequence,
      terminusDepart: occurrence.terminusDepart,
      terminusArrivee: occurrence.terminusArrivee,
      isTerminus: occurrence.isTerminus,
    }));

  return {
    id: stationIdsByKey.get(station.stationKey),
    type: "metro",
    niveau: "metro",
    nom: station.nom,
    nomTechnique: station.nom,
    commune: stationCommuneLabel(station),
    communes: [...station.communes].sort(localeSort),
    coordonnees: averageCoordinates(station.coordonneesSamples),
    lignes,
    correspondancesMetro: lignes.length > 1 ? lignes : [],
    identifiants: {
      gtfsStopIds: [...station.stopIds].sort((a, b) => a.localeCompare(b, "fr", { numeric: true })),
    },
    accessibilite: {
      wheelchairBoarding: station.wheelchairBoarding,
    },
    positions,
    indicesTechniques: buildTechnicalHints(station, lignes, positions),
    ficheDecouverte: {
      statut: "a-enrichir",
      description: null,
      origineNom: null,
      personnaliteAssociee: null,
      histoire: null,
      oeuvreArt: null,
      architecture: null,
      anecdote: null,
      particularites: [],
      sourceIds: [],
    },
    sourceIds,
  };
}

function findOrCreateStationKey(stop) {
  const nameKey = normalizeKey(stop.nom);
  if (!stationKeysByName.has(nameKey)) stationKeysByName.set(nameKey, []);
  const candidates = stationKeysByName.get(nameKey);
  const candidate = candidates.find((key) => isSamePhysicalStation(stationDraftsByKey.get(key), stop));
  if (candidate) return candidate;

  const key = `${nameKey}|${candidates.length + 1}`;
  candidates.push(key);
  return key;
}

function isSamePhysicalStation(station, stop) {
  if (!station) return false;
  if (station.coordonneesSamples.length === 0 || !Number.isFinite(stop.latitude) || !Number.isFinite(stop.longitude)) {
    return station.communes.has(stop.commune);
  }
  const average = averageCoordinates(station.coordonneesSamples);
  return distanceKm(average, { latitude: stop.latitude, longitude: stop.longitude }) <= 0.7;
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

function roundCoordinate(value) {
  return Number(value.toFixed(6));
}

function stationCommuneLabel(station) {
  return [...station.communes].sort(localeSort).join(" / ") || null;
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

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function buildTechnicalHints(station, lignes, positions) {
  const hints = ["Je suis une station du métro Ilévia."];
  if (lignes.length === 1) hints.push(`Je suis desservie par la ligne ${lignes[0].replace("M", "")}.`);
  if (lignes.length > 1) hints.push(`Je suis une correspondance entre ${lignes.join(" et ")}.`);
  const communeLabel = stationCommuneLabel(station);
  if (communeLabel) hints.push(`Je suis située à ${communeLabel}.`);
  if (positions.some((position) => position.isTerminus)) hints.push("Je suis un terminus sur au moins un trajet.");
  return [...new Set(hints)];
}

function ambiguousNameGroups(stations) {
  const groups = new Map();
  for (const station of stations) {
    const key = normalizeKey(station.nom);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(station.id);
  }
  return [...groups.values()].filter((ids) => ids.length > 1);
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

async function loadCommuneNameIndex() {
  const rawDataGouvRoot = path.join(sharedCorpusRoot, "documentation", "raw", "data-gouv");
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

function cleanLabel(value) {
  if (value === null || value === undefined) return null;
  return String(value).replace(/\s+/g, " ").trim() || null;
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

function routeNameSort(a, b) {
  return routeSortToken(a).localeCompare(routeSortToken(b), "fr", { numeric: true });
}

function localeSort(a, b) {
  return String(a).localeCompare(String(b), "fr", { sensitivity: "base" });
}

function routeSortToken(value) {
  return String(value).replace(/^M(\d+)$/, "M$1").replace(/^L(\d+)$/, "L$1");
}

function stationSortKey(station) {
  const first = station.positions[0];
  return `${routeSortToken(first?.ligne ?? "")}-${String(first?.sequence ?? 0).padStart(3, "0")}-${station.id}`;
}

function topEntries(map, limit) {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr")).slice(0, limit);
}

function increment(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}
