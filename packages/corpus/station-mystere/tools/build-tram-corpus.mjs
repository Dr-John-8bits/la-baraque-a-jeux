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
const branchDefinitions = [
  {
    id: "roubaix",
    nom: "Branche Roubaix",
    terminusPrincipal: "Euroteleport",
    terminusPublic: "Roubaix Eurotéléport",
  },
  {
    id: "tourcoing",
    nom: "Branche Tourcoing",
    terminusPrincipal: "Tourcoing Centre",
    terminusPublic: "Tourcoing Centre",
  },
];

await mkdir(stationCorpusRoot, { recursive: true });

const routes = parseCsv(await readText(path.join(gtfsRoot, "routes.txt")));
const stops = parseCsv(await readText(path.join(gtfsRoot, "stops.txt")));
const trips = parseCsv(await readText(path.join(gtfsRoot, "trips.txt")));
const arretPoint = await readJson(path.join(rawTransportRoot, "ilevia-arret-point.geojson"));
const communeNameByKey = await loadCommuneNameIndex();

const tramRoute = routes.find((route) => Number(route.route_type) === 0 && route.route_id === "71");
if (!tramRoute) throw new Error("Route tramway Ilévia introuvable dans le GTFS.");

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
const tramTripsById = new Map(
  trips
    .filter((trip) => trip.route_id === tramRoute.route_id)
    .map((trip) => [
      trip.trip_id,
      {
        routeId: trip.route_id,
        headsign: cleanLabel(trip.trip_headsign),
        directionId: trip.direction_id || "0",
      },
    ]),
);
const patterns = collectTripPatterns(await readText(path.join(gtfsRoot, "stop_times.txt")), tramTripsById);

const stationDraftsByKey = new Map();
const stationKeysByName = new Map();
const branchOrder = new Map(branchDefinitions.map((branch, index) => [branch.id, index]));

const branches = branchDefinitions.map((branch) => {
  const forwardPattern = selectRepresentativePattern({
    patterns,
    first: "Gare Lille Flandres",
    last: branch.terminusPrincipal,
    directionId: "0",
  });
  const returnPattern = selectRepresentativePattern({
    patterns,
    first: branch.terminusPrincipal,
    last: "Gare Lille Flandres",
    directionId: "1",
  });

  const directions = [
    buildDirection(branch, forwardPattern, "vers-terminus"),
    buildDirection(branch, returnPattern, "vers-lille"),
  ];

  return {
    id: branch.id,
    nom: branch.nom,
    terminusPublic: branch.terminusPublic,
    directions,
  };
});

const stationIdsByKey = assignStationIds(stationDraftsByKey);
const stationIdsByStopId = mapStopIdsToStationIds(stationDraftsByKey, stationIdsByKey);
const branchesWithStationIds = branches.map((branch) => {
  const directions = branch.directions.map((direction) => ({
    ...direction,
    stations: direction.stations.map((station) => ({
      ...station,
      id: stationIdsByStopId.get(station.stopId),
    })),
  }));
  const stationIds = unique(directions[0].stations.map((station) => station.id));

  return {
    ...branch,
    stationCount: stationIds.length,
    stationIds,
    directions,
  };
});
const stations = [...stationDraftsByKey.values()]
  .map((station) => finalizeStation(station, stationIdsByKey))
  .sort((a, b) => stationSortKey(a).localeCompare(stationSortKey(b), "fr", { numeric: true }));

const output = {
  generatedAt,
  status: "technical-baseline",
  description:
    "Premier corpus technique pour le niveau 2 Tramway Mystere. Les champs culturels sont a enrichir et sourcer avant publication jouable.",
  level: "tramway",
  sourceIds,
  stats: {
    lineCount: 1,
    branchCount: branchesWithStationIds.length,
    stationCount: stations.length,
    stationsByBranch: Object.fromEntries(branchesWithStationIds.map((branch) => [branch.id, branch.stationCount])),
    sharedStationCount: stations.filter((station) => station.branches.length > 1).length,
    terminalStationCount: stations.filter((station) => station.positions.some((position) => position.isTerminus)).length,
    ambiguousNameCount: ambiguousNameGroups(stations).length,
    representativePatternCount: branchesWithStationIds.reduce(
      (count, branch) => count + branch.directions.length,
      0,
    ),
    raw: {
      gtfsRoutes: routes.length,
      gtfsStops: stops.length,
      gtfsTrips: trips.length,
      tramTrips: tramTripsById.size,
      tramPatterns: patterns.length,
      arretPointFeatures: arretPoint.features.length,
    },
  },
  notes: [
    "Base derivee du GTFS Ilévia et du GeoJSON dataMEL des arrets.",
    "Le tramway est expose comme une seule route GTFS, avec deux branches principales reconstruites par terminus.",
    "Les doublons techniques de terminus, notamment Gare Lille Flandres, sont regroupes en une seule station jouable.",
    "Les libelles proviennent des donnees techniques et devront etre relus editorialement, notamment les accents et abreviations.",
  ],
  line: {
    id: tramRoute.route_id,
    nomCourt: tramRoute.route_short_name,
    nom: cleanLabel(tramRoute.route_long_name),
    description: cleanLabel(tramRoute.route_desc),
    couleur: tramRoute.route_color || null,
    couleurTexte: tramRoute.route_text_color || null,
  },
  branches: branchesWithStationIds,
  stations,
};

await writeJson(path.join(stationCorpusRoot, "tram-stations.json"), output);

console.log("Corpus Tramway Station Mystere genere.");
console.log(`- ligne: ${output.line.nomCourt}`);
console.log(`- branches: ${output.stats.branchCount}`);
console.log(`- stations: ${output.stats.stationCount}`);
console.log(`- stations communes aux deux branches: ${output.stats.sharedStationCount}`);

function selectRepresentativePattern({ patterns, first, last, directionId }) {
  const candidates = patterns
    .filter(
      (pattern) =>
        pattern.directionId === directionId &&
        stopName(pattern.stopIds[0]) === first &&
        stopName(pattern.stopIds.at(-1)) === last,
    )
    .sort((a, b) => b.count - a.count || b.stopIds.length - a.stopIds.length);

  if (candidates.length === 0) {
    throw new Error(`Aucun parcours tramway representatif trouve pour ${first} -> ${last}.`);
  }

  return candidates[0];
}

function buildDirection(branch, pattern, directionId) {
  const stopsForDirection = dedupeConsecutiveStops(
    pattern.stopIds.map((stopId, index) => {
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
    }),
  ).map((stop, index) => ({ ...stop, sequence: index + 1 }));

  const direction = {
    directionId,
    gtfsDirectionId: pattern.directionId,
    trajetRepresentatifCount: pattern.count,
    terminusDepart: stopsForDirection[0]?.nom ?? null,
    terminusArrivee: stopsForDirection.at(-1)?.nom ?? null,
    girouettes: topEntries(pattern.headsigns, 6).map(([label, count]) => ({ label, count })),
    stations: stopsForDirection,
  };

  for (const stop of stopsForDirection) {
    addStationOccurrence(stop.stopId, {
      ligne: tramRoute.route_short_name,
      routeId: tramRoute.route_id,
      branchId: branch.id,
      branchName: branch.nom,
      directionId: direction.directionId,
      sequence: stop.sequence,
      terminusDepart: direction.terminusDepart,
      terminusArrivee: direction.terminusArrivee,
      isTerminus: stop.sequence === 1 || stop.sequence === stopsForDirection.length,
    });
  }

  return direction;
}

function dedupeConsecutiveStops(stopsForDirection) {
  const deduped = [];
  for (const stop of stopsForDirection) {
    const previous = deduped.at(-1);
    if (previous && normalizeKey(previous.nom) === normalizeKey(stop.nom)) continue;
    deduped.push(stop);
  }
  return deduped;
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
      ligne: tramRoute.route_short_name,
      branches: new Set(),
      occurrences: [],
    });
  }
  const station = stationDraftsByKey.get(stationKey);
  station.stopIds.add(stopId);
  if (stop.commune) station.communes.add(stop.commune);
  if (Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude)) {
    station.coordonneesSamples.push({ latitude: stop.latitude, longitude: stop.longitude });
  }
  station.branches.add(occurrence.branchId);
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
  const branches = [...station.branches].sort((a, b) => branchOrder.get(a) - branchOrder.get(b));
  const positions = station.occurrences
    .sort(
      (a, b) =>
        (branchOrder.get(a.branchId) ?? 0) - (branchOrder.get(b.branchId) ?? 0) ||
        String(a.directionId).localeCompare(String(b.directionId), "fr") ||
        a.sequence - b.sequence,
    )
    .map((occurrence) => ({
      ligne: occurrence.ligne,
      branchId: occurrence.branchId,
      branchName: occurrence.branchName,
      directionId: occurrence.directionId,
      sequence: occurrence.sequence,
      terminusDepart: occurrence.terminusDepart,
      terminusArrivee: occurrence.terminusArrivee,
      isTerminus: occurrence.isTerminus,
    }));

  return {
    id: stationIdsByKey.get(station.stationKey),
    type: "tramway",
    niveau: "tramway",
    nom: station.nom,
    nomTechnique: station.nom,
    commune: stationCommuneLabel(station),
    communes: [...station.communes].sort(localeSort),
    coordonnees: averageCoordinates(station.coordonneesSamples),
    ligne: station.ligne,
    branches,
    brancheLibelles: branches.map((branchId) => branchDefinitions.find((branch) => branch.id === branchId)?.nom),
    troncCommun: branches.length > 1,
    identifiants: {
      gtfsStopIds: [...station.stopIds].sort((a, b) => a.localeCompare(b, "fr", { numeric: true })),
    },
    accessibilite: {
      wheelchairBoarding: station.wheelchairBoarding,
    },
    positions,
    indicesTechniques: buildTechnicalHints(station, branches, positions),
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

function buildTechnicalHints(station, branches, positions) {
  const hints = ["Je suis une station du tramway Ilévia."];
  if (branches.length === 1) {
    const branch = branchDefinitions.find((candidate) => candidate.id === branches[0]);
    hints.push(`Je suis sur la ${branch.nom.toLocaleLowerCase("fr")}.`);
  }
  if (branches.length > 1) hints.push("Je suis sur le tronc commun des deux branches du tramway.");
  const communeLabel = stationCommuneLabel(station);
  if (communeLabel) hints.push(`Je suis située à ${communeLabel}.`);
  if (positions.some((position) => position.isTerminus)) hints.push("Je suis un terminus du tramway.");
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

  const patternsByKey = new Map();
  for (const [tripId, stopEntries] of tripStops) {
    const trip = tripsById.get(tripId);
    const stopIds = stopEntries
      .sort((a, b) => a.sequence - b.sequence)
      .map((entry) => entry.stopId);
    const patternKey = `${trip.directionId}:${stopIds.join("|")}`;
    if (!patternsByKey.has(patternKey)) {
      patternsByKey.set(patternKey, {
        routeId: trip.routeId,
        directionId: trip.directionId,
        headsigns: new Map(),
        count: 0,
        stopIds,
      });
    }
    const pattern = patternsByKey.get(patternKey);
    if (trip.headsign) increment(pattern.headsigns, trip.headsign);
    pattern.count += 1;
  }

  return [...patternsByKey.values()];
}

function stopName(stopId) {
  return stopById.get(stopId)?.nom ?? null;
}

function parseCsv(text) {
  const rows = [];
  let record = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === "\"") {
      if (inQuotes && next === "\"") {
        field += "\"";
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
    if (char === "\"") {
      if (inQuotes && next === "\"") {
        field += "\"";
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

function localeSort(a, b) {
  return String(a).localeCompare(String(b), "fr", { sensitivity: "base" });
}

function stationSortKey(station) {
  const first = station.positions[0];
  return `${String(branchOrder.get(first?.branchId) ?? 0)}-${String(first?.sequence ?? 0).padStart(3, "0")}-${station.id}`;
}

function topEntries(map, limit) {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr")).slice(0, limit);
}

function unique(values) {
  return [...new Set(values)];
}

function increment(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}
