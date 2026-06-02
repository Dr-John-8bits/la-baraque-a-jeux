import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const sourcePath = process.argv[2] || "wordle-fr-main/mots.txt";
const outputPath = "packages/corpus/le-mot-a-biloute/french-guesses.json";
const sourceId = "wordle-fr-louanben-mots";

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

const raw = await readFile(resolve(root, sourcePath), "utf8");
const words = new Set();

for (const line of raw.split(/\r?\n/)) {
  const word = normalize(line);
  if (!/^[A-Z]{4,12}$/.test(word)) continue;
  if (hasSensitiveReference(word)) continue;
  words.add(word);
}

const payload = {
  generatedAt: "2026-06-02",
  description:
    "Dictionnaire français de propositions acceptées pour Le mot à Biloute, importé depuis LouanBen/wordle-fr mots.txt. Il ne sert pas aux réponses du jour.",
  sourceIds: [sourceId],
  license: "GPL-3.0",
  words: [...words].sort(),
};

await writeFile(resolve(root, outputPath), `${JSON.stringify(payload, null, 2)}\n`);
console.log(`${payload.words.length} propositions francaises ecrites dans ${outputPath}.`);

function hasSensitiveReference(word) {
  return [...bannedTokens].some((token) => token.length >= 4 && word.includes(token));
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();
}
