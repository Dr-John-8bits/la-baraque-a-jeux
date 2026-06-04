import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stationCorpusRoot = path.resolve(__dirname, "..");
const sharedCorpusRoot = path.resolve(__dirname, "../..");
const notesPath = path.join(sharedCorpusRoot, "documentation", "processed", "transport", "transport-places-notes.json");

const sourceIds = ["gtfs-ilevia-data-gouv", "ilevia-arret-point-datamel"];
const noteBuckets = ["nameOrigin", "history", "anecdotes", "nearbyLandmarks", "clueAtoms"];

const metroCorpus = await readJson(path.join(stationCorpusRoot, "metro-stations.json"));
const tramCorpus = await readJson(path.join(stationCorpusRoot, "tram-stations.json"));
const notesCorpus = await readJson(notesPath);

const itemsById = new Map();
for (const item of notesCorpus.items ?? []) {
  const canonicalId = canonicalItemId(item);
  const normalizedItem = { ...structuredClone(item), id: canonicalId };
  const existingItem = itemsById.get(canonicalId);
  itemsById.set(canonicalId, existingItem ? mergeItems(existingItem, normalizedItem) : normalizedItem);
}

for (const station of metroCorpus.stations ?? []) {
  mergeStation(station, "metro");
}
for (const station of tramCorpus.stations ?? []) {
  mergeStation(station, "tramway");
}

const items = [...itemsById.values()]
  .map(finalizeItem)
  .sort((a, b) => sortKey(a).localeCompare(sortKey(b), "fr", { numeric: true }));

const output = {
  generatedAt: notesCorpus.generatedAt ?? new Date().toISOString().slice(0, 10),
  status: notesCorpus.status ?? "draft",
  description:
    notesCorpus.description ??
    "Base mutualisable de notes documentaires sur les lieux, stations et lignes de transport. Elle sert de reserve commune pour Station Mystere et les futurs jeux du portail.",
  sourceIds: mergeUnique(notesCorpus.sourceIds ?? [], sourceIds),
  model: {
    noteBuckets: notesCorpus.model?.noteBuckets ?? noteBuckets,
    externalSourcesPurpose:
      notesCorpus.model?.externalSourcesPurpose ??
      "URLs et references ponctuelles, par exemple pages Wikipedia station par station, sans gonfler le registre commun sources.json.",
  },
  items,
};

await writeFile(notesPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

const levelCounts = countByLevel(items);
console.log(
  `Notes transport synchronisees : ${items.length} lieux (${levelCounts.metro} metro, ${levelCounts.tramway} tramway, ${levelCounts.shared} mixtes).`,
);

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

function mergeStation(station, level) {
  const item = itemsById.get(station.id) ?? createItem(station);
  const type = level === "metro" ? "metro-station" : "tramway-station";

  item.label ||= station.nom;
  item.types = mergeUnique(item.types, [type]);
  item.communes = mergeUnique(item.communes, station.communes?.length ? station.communes : [station.commune]);
  item.technicalRefs = mergeTechnicalRefs(item.technicalRefs, [
    {
      system: "station-mystere",
      level,
      answerType: "station",
      technicalId: station.id,
    },
  ]);
  item.sourceIds = mergeUnique(item.sourceIds, station.sourceIds ?? sourceIds);
  item.clueAtoms = mergeNotes(item.clueAtoms, buildClueAtoms(station, level));

  itemsById.set(station.id, item);
}

function createItem(station) {
  return {
    id: station.id,
    label: station.nom,
    types: [],
    communes: [],
    technicalRefs: [],
    sourceIds: [],
    externalSources: [],
    nameOrigin: [],
    history: [],
    anecdotes: [],
    nearbyLandmarks: [],
    clueAtoms: [],
  };
}

function canonicalItemId(item) {
  const stationRefs = (item.technicalRefs ?? []).filter(
    (ref) =>
      ref.system === "station-mystere" &&
      ref.answerType === "station" &&
      (ref.level === "metro" || ref.level === "tramway"),
  );
  const technicalIds = unique(stationRefs.map((ref) => ref.technicalId));
  if (technicalIds.length === 1) return technicalIds[0];
  return item.id;
}

function mergeItems(existing, incoming) {
  const merged = {
    ...existing,
    label: existing.label || incoming.label,
    types: mergeUnique(existing.types, incoming.types),
    communes: mergeUnique(existing.communes, incoming.communes),
    technicalRefs: mergeTechnicalRefs(existing.technicalRefs, incoming.technicalRefs),
    sourceIds: mergeUnique(existing.sourceIds, incoming.sourceIds),
    externalSources: mergeExternalSources(existing.externalSources, incoming.externalSources),
  };

  for (const bucket of noteBuckets) {
    merged[bucket] = mergeNotes(existing[bucket], incoming[bucket]);
  }
  return merged;
}

function finalizeItem(item) {
  const levels = new Set(item.technicalRefs.map((ref) => ref.level));
  if (levels.size > 1 || item.clueAtoms.some((note) => note.id.startsWith("metro-correspondance-"))) {
    item.types = mergeUnique(item.types, ["transport-hub"]);
  }

  item.types = sortByPreferredOrder(item.types, [
    "metro-station",
    "tramway-station",
    "vlille-station",
    "bus-line",
    "bus-stop",
    "transport-hub",
    "landmark",
  ]);
  item.communes = sortFrench(item.communes);
  item.technicalRefs = sortTechnicalRefs(item.technicalRefs);
  item.sourceIds = mergeUnique(item.sourceIds, sourceIds);
  item.externalSources ??= [];
  for (const bucket of noteBuckets) item[bucket] ??= [];
  item.clueAtoms = sortNotes(item.clueAtoms);
  return item;
}

function buildClueAtoms(station, level) {
  if (level === "metro") return buildMetroClueAtoms(station);
  return buildTramwayClueAtoms(station);
}

function buildMetroClueAtoms(station) {
  const atoms = [];
  const lines = sortFrench(station.lignes ?? []);
  if (lines.length > 1) {
    atoms.push({
      id: `metro-correspondance-${lines.map((line) => line.toLowerCase()).join("-")}`,
      type: "network",
      text: `Station de correspondance entre les lignes ${lines.join(" et ")} du metro.`,
      status: "draft",
      sourceIds: ["gtfs-ilevia-data-gouv"],
      externalSourceIds: [],
    });
  } else if (lines.length === 1) {
    atoms.push({
      id: `metro-ligne-${lines[0].toLowerCase()}`,
      type: "network",
      text: `Station de la ligne ${lines[0]} du metro.`,
      status: "draft",
      sourceIds: ["gtfs-ilevia-data-gouv"],
      externalSourceIds: [],
    });
  }

  const terminusLines = sortFrench(unique((station.positions ?? []).filter((position) => position.isTerminus).map((position) => position.ligne)));
  for (const line of terminusLines) {
    atoms.push({
      id: `terminus-${line.toLowerCase()}`,
      type: "network",
      text: `Terminus de la ligne ${line} dans le corpus technique.`,
      status: "draft",
      sourceIds: ["gtfs-ilevia-data-gouv"],
      externalSourceIds: [],
    });
  }

  atoms.push(...buildCommuneAtoms(station));
  return atoms;
}

function buildTramwayClueAtoms(station) {
  const atoms = [];
  const branches = sortFrench(station.branches ?? []);

  if (station.troncCommun) {
    atoms.push({
      id: "tramway-tronc-commun-roubaix-tourcoing",
      type: "network",
      text: "Station du tronc commun du tramway vers les branches Roubaix et Tourcoing.",
      status: "draft",
      sourceIds: ["gtfs-ilevia-data-gouv"],
      externalSourceIds: [],
    });
  } else {
    for (const branch of branches) {
      atoms.push({
        id: `tramway-branche-${slugify(branch)}`,
        type: "network",
        text: `Station de la branche ${capitalize(branch)} du tramway.`,
        status: "draft",
        sourceIds: ["gtfs-ilevia-data-gouv"],
        externalSourceIds: [],
      });
    }
  }

  const terminusBranches = sortFrench(
    unique((station.positions ?? []).filter((position) => position.isTerminus).map((position) => position.branchId)),
  );
  for (const branch of terminusBranches) {
    atoms.push({
      id: `terminus-tramway-${slugify(branch)}`,
      type: "network",
      text: `Terminus de la branche ${capitalize(branch)} du tramway dans le corpus technique.`,
      status: "draft",
      sourceIds: ["gtfs-ilevia-data-gouv"],
      externalSourceIds: [],
    });
  }

  atoms.push(...buildCommuneAtoms(station));
  return atoms;
}

function buildCommuneAtoms(station) {
  const communes = station.communes?.length ? station.communes : [station.commune];
  return sortFrench(communes).map((commune) => ({
    id: `commune-${slugify(commune)}`,
    type: "geography",
    text: `La station est situee a ${commune}.`,
    status: "draft",
    sourceIds: ["ilevia-arret-point-datamel"],
    externalSourceIds: [],
  }));
}

function mergeTechnicalRefs(existing = [], additions = []) {
  const refsByKey = new Map();
  for (const ref of [...existing, ...additions]) {
    refsByKey.set(`${ref.system}:${ref.level}:${ref.answerType}:${ref.technicalId}`, ref);
  }
  return [...refsByKey.values()];
}

function mergeExternalSources(existing = [], additions = []) {
  const sourcesById = new Map();
  for (const source of [...existing, ...additions]) {
    if (!sourcesById.has(source.id)) sourcesById.set(source.id, source);
  }
  return [...sourcesById.values()];
}

function mergeNotes(existing = [], additions = []) {
  const notesById = new Map();
  for (const note of existing) notesById.set(note.id, note);
  for (const note of additions) {
    if (!notesById.has(note.id)) notesById.set(note.id, note);
  }
  return [...notesById.values()];
}

function mergeUnique(...arrays) {
  return unique(arrays.flat().filter((item) => item !== undefined && item !== null && item !== ""));
}

function unique(values) {
  return [...new Set(values)];
}

function sortTechnicalRefs(refs) {
  const levelOrder = new Map([
    ["metro", 1],
    ["tramway", 2],
    ["velo", 3],
    ["bus", 4],
  ]);
  return [...refs].sort((a, b) => {
    const levelDiff = (levelOrder.get(a.level) ?? 99) - (levelOrder.get(b.level) ?? 99);
    if (levelDiff !== 0) return levelDiff;
    return a.technicalId.localeCompare(b.technicalId, "fr", { numeric: true });
  });
}

function sortNotes(notes) {
  const typeOrder = new Map([
    ["network", 1],
    ["geography", 2],
    ["name", 3],
    ["history", 4],
    ["landmark", 5],
    ["anecdote", 6],
    ["culture", 7],
    ["architecture", 8],
  ]);
  return [...notes].sort((a, b) => {
    const typeDiff = (typeOrder.get(a.type) ?? 99) - (typeOrder.get(b.type) ?? 99);
    if (typeDiff !== 0) return typeDiff;
    return a.id.localeCompare(b.id, "fr", { numeric: true });
  });
}

function sortByPreferredOrder(values, preferredOrder) {
  const order = new Map(preferredOrder.map((value, index) => [value, index]));
  return [...values].sort((a, b) => {
    const orderDiff = (order.get(a) ?? 99) - (order.get(b) ?? 99);
    if (orderDiff !== 0) return orderDiff;
    return a.localeCompare(b, "fr", { numeric: true });
  });
}

function sortFrench(values) {
  return [...values].sort((a, b) => String(a).localeCompare(String(b), "fr", { numeric: true }));
}

function sortKey(item) {
  return `${normalizeForSort(item.label)}-${item.id}`;
}

function normalizeForSort(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "ae")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function capitalize(value) {
  const text = String(value);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function countByLevel(items) {
  const counts = { metro: 0, tramway: 0, shared: 0 };
  for (const item of items) {
    const levels = new Set(item.technicalRefs.map((ref) => ref.level));
    if (levels.has("metro")) counts.metro += 1;
    if (levels.has("tramway")) counts.tramway += 1;
    if (levels.size > 1) counts.shared += 1;
  }
  return counts;
}
