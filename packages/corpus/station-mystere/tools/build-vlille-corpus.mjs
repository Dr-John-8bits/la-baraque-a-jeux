import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stationCorpusRoot = path.resolve(__dirname, "..");
const sharedCorpusRoot = path.resolve(__dirname, "../..");
const rawTransportRoot = path.join(sharedCorpusRoot, "documentation", "raw", "transport");
const rawGbfsRoot = path.join(rawTransportRoot, "ilevia-gbfs");
const rawDataGouvRoot = path.join(sharedCorpusRoot, "documentation", "raw", "data-gouv");

const sourceIds = ["gbfs-vlille-ilevia", "mel-communes-associees-datamel"];
const generatedAt = new Date().toISOString().slice(0, 10);

await mkdir(stationCorpusRoot, { recursive: true });

const gbfsIndex = await readJson(path.join(rawGbfsRoot, "gbfs.json"));
const systemInformation = await readJson(path.join(rawGbfsRoot, "system_information.json"));
const stationInformation = await readJson(path.join(rawGbfsRoot, "station_information.json"));
const stationStatus = await readJson(path.join(rawGbfsRoot, "station_status.json"));
const communeGeo = await readJson(path.join(rawDataGouvRoot, "mel-communes-associees.geojson"));

const statusByStationId = new Map(
  stationStatus.data.stations.map((status) => [String(status.station_id), status]),
);
const communes = communeGeo.features.map((feature) => ({
  name: feature.properties.nom,
  geometry: feature.geometry,
}));

const stations = stationInformation.data.stations
  .map((station) => buildStation(station, statusByStationId.get(String(station.station_id))))
  .sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }));

const communeCounts = new Map();
for (const station of stations) {
  const key = station.commune ?? "Commune non detectee";
  communeCounts.set(key, (communeCounts.get(key) ?? 0) + 1);
}

const output = {
  generatedAt,
  status: "technical-baseline",
  description:
    "Premier corpus technique pour le niveau 2 Velo Mystere. Les champs culturels sont a enrichir et sourcer avant publication jouable.",
  level: "velo",
  system: {
    id: systemInformation.data.system_id,
    name: systemInformation.data.name,
    timezone: systemInformation.data.timezone,
    language: systemInformation.data.language,
    gbfsVersion: gbfsIndex.version,
  },
  sourceIds,
  stats: {
    stationInformationCount: stationInformation.data.stations.length,
    stationStatusCount: stationStatus.data.stations.length,
    stationCount: stations.length,
    playableCandidateCount: stations.filter((station) => station.eligibiliteJeu.statut === "candidate").length,
    toReviewCount: stations.filter((station) => station.eligibiliteJeu.statut === "a-verifier").length,
    missingStatusCount: stations.filter((station) => station.statutTempsReel === null).length,
    installedCount: stations.filter((station) => station.statutTempsReel?.isInstalled).length,
    rentingCount: stations.filter((station) => station.statutTempsReel?.isRenting).length,
    returningCount: stations.filter((station) => station.statutTempsReel?.isReturning).length,
    virtualStationCount: stations.filter((station) => station.isVirtualStation).length,
    zeroCapacityCount: stations.filter((station) => station.capacite === 0).length,
    totalCapacity: stations.reduce((sum, station) => sum + (station.capacite ?? 0), 0),
    communeCount: communeCounts.size,
  },
  communes: [...communeCounts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "fr", { sensitivity: "base" }))
    .map(([nom, stationCount]) => ({ nom, stationCount })),
  notes: [
    "Base derivee du flux GBFS V'Lille Ilévia.",
    "station_information est utilise comme source stable principale.",
    "station_status est integre comme photographie technique au moment de l'extraction, mais ne doit pas servir seul a definir le corpus quotidien.",
    "Les communes sont detectees par intersection entre les coordonnees GBFS et les limites des communes associees de la MEL.",
  ],
  feeds: extractFeeds(gbfsIndex),
  stations,
};

await writeJson(path.join(stationCorpusRoot, "vlille-stations.json"), output);

console.log("Corpus V'Lille Station Mystere genere.");
console.log(`- stations GBFS: ${output.stats.stationCount}`);
console.log(`- candidates jouables: ${output.stats.playableCandidateCount}`);
console.log(`- a verifier: ${output.stats.toReviewCount}`);
console.log(`- communes detectees: ${output.stats.communeCount}`);

function buildStation(station, status) {
  const commune = communeForPoint(station.lon, station.lat);
  const eligibiliteJeu = buildEligibility(station, status, commune);
  return {
    id: `vlille-${station.station_id}`,
    type: "vlille",
    niveau: "velo",
    nom: cleanLabel(station.name),
    nomTechnique: cleanLabel(station.name),
    commune,
    codePostal: cleanLabel(station.post_code),
    coordonnees: {
      latitude: numberOrNull(station.lat),
      longitude: numberOrNull(station.lon),
    },
    capacite: numberOrNull(station.capacity),
    parking: {
      type: station.parking_type || null,
      arceau: Boolean(station.parking_hoop),
    },
    isVirtualStation: Boolean(station.is_virtual_station),
    identifiants: {
      gbfsStationId: String(station.station_id),
    },
    statutTempsReel: status
      ? {
          lastReported: numberOrNull(status.last_reported),
          isInstalled: Boolean(status.is_installed),
          isRenting: Boolean(status.is_renting),
          isReturning: Boolean(status.is_returning),
          velosDisponibles: numberOrNull(status.num_bikes_available),
          placesDisponibles: numberOrNull(status.num_docks_available),
          vehicleTypesAvailable: Array.isArray(status.vehicle_types_available)
            ? status.vehicle_types_available.map((vehicle) => ({
                vehicleTypeId: String(vehicle.vehicle_type_id),
                count: numberOrNull(vehicle.count),
              }))
            : [],
        }
      : null,
    eligibiliteJeu,
    indicesTechniques: buildTechnicalHints(station, commune),
    ficheDecouverte: {
      statut: "a-enrichir",
      description: null,
      quartier: null,
      proximite: [],
      anecdote: null,
      particularites: [],
      sourceIds: [],
    },
    sourceIds,
  };
}

function buildEligibility(station, status, commune) {
  const raisons = [];
  if (!status) raisons.push("statut-gbfs-manquant");
  if (numberOrNull(station.capacity) === 0) raisons.push("capacite-nulle");
  if (station.is_virtual_station) raisons.push("station-virtuelle");
  if (!commune) raisons.push("commune-non-detectee");
  if (status && !status.is_installed) raisons.push("station-non-installee");
  if (status && !status.is_renting) raisons.push("location-indisponible");
  if (status && !status.is_returning) raisons.push("retour-indisponible");

  return {
    statut: raisons.length === 0 ? "candidate" : "a-verifier",
    raisons,
  };
}

function buildTechnicalHints(station, commune) {
  const hints = ["Je suis une station V'Lille."];
  if (commune) hints.push(`Je suis située à ${commune}.`);
  if (station.post_code) hints.push(`Mon code postal est ${station.post_code}.`);
  if (Number.isFinite(Number(station.capacity)) && Number(station.capacity) > 0) {
    hints.push(`Ma capacité technique est de ${station.capacity} places.`);
  }
  return [...new Set(hints)];
}

function communeForPoint(longitude, latitude) {
  if (!Number.isFinite(Number(longitude)) || !Number.isFinite(Number(latitude))) return null;
  const point = [Number(longitude), Number(latitude)];
  const match = communes.find((commune) => geometryContainsPoint(commune.geometry, point));
  return match?.name ?? null;
}

function geometryContainsPoint(geometry, point) {
  if (!geometry) return false;
  if (geometry.type === "Polygon") return polygonContainsPoint(geometry.coordinates, point);
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => polygonContainsPoint(polygon, point));
  }
  return false;
}

function polygonContainsPoint(rings, point) {
  if (!rings.length || !ringContainsPoint(rings[0], point)) return false;
  return !rings.slice(1).some((hole) => ringContainsPoint(hole, point));
}

function ringContainsPoint(ring, point) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function extractFeeds(gbfsIndex) {
  const languageFeeds = gbfsIndex.data?.en?.feeds ?? [];
  return languageFeeds.map((feed) => ({
    name: feed.name,
    url: feed.url,
  }));
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

function cleanLabel(value) {
  if (value === null || value === undefined) return null;
  return String(value).replace(/\s+/g, " ").trim() || null;
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
