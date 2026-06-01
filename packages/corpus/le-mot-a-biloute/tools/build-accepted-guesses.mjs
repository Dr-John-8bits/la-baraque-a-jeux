import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const outputPath = "packages/corpus/le-mot-a-biloute/accepted-guesses.json";

const bannedTokens = new Set([
  "ABBE",
  "ABBAYE",
  "CALVAIRE",
  "CATHEDRALE",
  "CHAPELLE",
  "CLOITRE",
  "COUVENT",
  "CROIX",
  "CURE",
  "DAME",
  "EGLISE",
  "ERMITAGE",
  "MOINE",
  "MOINES",
  "NOTRE",
  "PASTEUR",
  "PRESBYTERE",
  "PRIEURE",
  "SAINT",
  "SAINTE",
  "SAINTS",
  "SEMINAIRE",
  "ST",
  "STE",
  "TEMPLE",
]);

const wordsBySource = new Map();
const sourceIds = new Set();
const excludedSensitiveItems = await readJson(
  "packages/corpus/documentation/processed/editorial/excluded-sensitive-items.json"
);
const excludedLabels = new Set(
  (excludedSensitiveItems.items || []).map((item) => normalize(item.label)).filter(Boolean)
);

const answerWords = await readJson("packages/corpus/le-mot-a-biloute/words.json");
for (const item of answerWords) {
  for (const answer of item.acceptedAnswers || []) addCandidate(answer, item.sourceIds);
}

const regionalSeeds = await readJson(
  "packages/corpus/documentation/processed/editorial/regional-word-seeds.json"
);
for (const item of regionalSeeds.items || []) addCandidate(item.answer || item.label, item.sourceIds);

const communes = await readJson(
  "packages/corpus/documentation/processed/geography/mel-communes.json"
);
for (const commune of communes.communes || []) addCandidate(commune.name, commune.sourceIds);

const quartiers = await readJson(
  "packages/corpus/documentation/processed/geography/lille-quartiers.json"
);
for (const quartier of quartiers.quartiers || []) addCandidate(quartier.name, quartier.sourceIds);

for (const file of [
  "packages/corpus/documentation/processed/transport/metro-tram-lines.json",
  "packages/corpus/documentation/processed/transport/bus-lines.json",
]) {
  const data = await readJson(file);
  for (const line of data.lines || []) {
    for (const stopName of line.uniqueStopNames || []) addCandidate(stopName, line.sourceIds);
  }
}

const payload = {
  generatedAt: "2026-06-01",
  description:
    "Liste locale de propositions acceptées pour Le mot à Biloute. Elle est générée depuis les réponses relues et le corpus documentaire traité, sans reprendre de dictionnaire externe.",
  sourceIds: [...sourceIds].sort(),
  words: [...wordsBySource.keys()].sort(),
};

await writeFile(resolve(root, outputPath), `${JSON.stringify(payload, null, 2)}\n`);
console.log(`${payload.words.length} propositions acceptees ecrites dans ${outputPath}.`);

async function readJson(path) {
  return JSON.parse(await readFile(resolve(root, path), "utf8"));
}

function addCandidate(label, ids = []) {
  if (!label || hasSensitiveReference(label)) return;

  addWord(normalize(label), ids);
  for (const token of tokenize(label)) addWord(token, ids);
}

function addWord(word, ids = []) {
  if (!/^[A-Z]{4,12}$/.test(word)) return;
  if (hasSensitiveReference(word)) return;

  if (!wordsBySource.has(word)) wordsBySource.set(word, new Set());
  const wordSources = wordsBySource.get(word);
  for (const sourceId of ids || []) {
    sourceIds.add(sourceId);
    wordSources.add(sourceId);
  }
}

function hasSensitiveReference(label) {
  const normalized = normalize(label);
  if (!normalized) return false;
  if (excludedLabels.has(normalized)) return true;
  if ([...excludedLabels].some((item) => item && normalized.includes(item))) return true;
  if ([...bannedTokens].some((token) => token.length >= 4 && normalized.includes(token))) return true;

  return tokenize(label).some((token) => bannedTokens.has(token));
}

function tokenize(value) {
  return String(value || "")
    .split(/[^\p{L}]+/u)
    .map(normalize)
    .filter(Boolean);
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();
}
