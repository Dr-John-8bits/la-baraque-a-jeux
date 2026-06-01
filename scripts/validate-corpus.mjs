import { readFile } from "node:fs/promises";

const errors = [];

const sources = await readJson("packages/corpus/sources.json");
const words = await readJson("packages/corpus/le-mot-a-biloute/words.json");
const guessPolicy = await readJson("packages/corpus/le-mot-a-biloute/guess-policy.json");
const acceptedGuesses = await readJson("packages/corpus/le-mot-a-biloute/accepted-guesses.json");
const puzzles = await readJson("packages/corpus/lille-mele/puzzles.json");
const excludedSensitiveItems = await readJson(
  "packages/corpus/documentation/processed/editorial/excluded-sensitive-items.json"
);
const candidateItems = await readJson(
  "packages/corpus/documentation/processed/editorial/candidate-items.json"
);

const sourceIds = validateSources(sources);
const forbiddenLabels = buildForbiddenLabels(excludedSensitiveItems, candidateItems);
validateWords(words, sourceIds);
validateGuessPolicy(guessPolicy);
validateAcceptedGuesses(acceptedGuesses, sourceIds);
validatePuzzles(puzzles, sourceIds, forbiddenLabels);

if (errors.length > 0) {
  console.error("Corpus invalide :");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Corpus valide.");
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    errors.push(`${file} ne peut pas etre lu ou parse : ${error.message}`);
    return null;
  }
}

function validateSources(value) {
  const ids = new Set();
  const labels = new Set();
  const urls = new Set();

  if (!Array.isArray(value)) {
    errors.push("packages/corpus/sources.json doit etre un tableau.");
    return ids;
  }

  value.forEach((source, index) => {
    const scope = `sources[${index}]`;
    requireKebabId(source?.id, `${scope}.id`);
    requireString(source?.label, `${scope}.label`, { max: 100 });
    requireUrl(source?.url, `${scope}.url`);
    requireString(source?.publisher, `${scope}.publisher`, { max: 80 });
    requireString(source?.license, `${scope}.license`, { max: 80 });
    requireDate(source?.consultedAt, `${scope}.consultedAt`);
    requireString(source?.notes, `${scope}.notes`, { max: 240, optional: true });

    addUnique(ids, source?.id, `${scope}.id`);
    addUnique(labels, source?.label, `${scope}.label`);
    addUnique(urls, source?.url, `${scope}.url`);
  });

  return ids;
}

function validateWords(value, sourceIds) {
  if (!Array.isArray(value)) {
    errors.push("packages/corpus/le-mot-a-biloute/words.json doit etre un tableau.");
    return;
  }

  const ids = new Set();
  const answers = new Set();

  value.forEach((word, index) => {
    const scope = `words[${index}]`;
    requireKebabId(word?.id, `${scope}.id`);
    requireAnswer(word?.answer, `${scope}.answer`);
    requireString(word?.category, `${scope}.category`, { max: 40 });
    requireString(word?.starterHint, `${scope}.starterHint`, { max: 140 });
    requireEnum(word?.difficulty, `${scope}.difficulty`, ["easy", "medium", "hard"], {
      optional: true,
    });
    requireEnum(word?.status, `${scope}.status`, ["prototype", "reviewed", "published"], {
      optional: true,
    });
    requireKebabArray(word?.tags, `${scope}.tags`, { optional: true });
    requireSourceRefs(word?.sourceIds, `${scope}.sourceIds`, sourceIds, { optional: true });
    requireStringArray(word?.hints, `${scope}.hints`, { min: 1, maxItem: 140, unique: true });
    requireAnswerArray(word?.acceptedAnswers, `${scope}.acceptedAnswers`, { min: 1 });
    requireString(word?.bonus?.title, `${scope}.bonus.title`, { max: 60 });
    requireString(word?.bonus?.text, `${scope}.bonus.text`, { max: 280 });

    addUnique(ids, word?.id, `${scope}.id`);
    addUnique(answers, word?.answer, `${scope}.answer`);

    if (
      typeof word?.answer === "string" &&
      Array.isArray(word?.acceptedAnswers) &&
      !word.acceptedAnswers.includes(word.answer)
    ) {
      errors.push(`${scope}.acceptedAnswers doit contenir la reponse principale.`);
    }
  });
}

function validateGuessPolicy(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push("packages/corpus/le-mot-a-biloute/guess-policy.json doit etre un objet.");
    return;
  }

  requireEnum(value.mode, "guessPolicy.mode", ["guided-permissive", "strict"]);
  requireString(value.label, "guessPolicy.label", { max: 60 });
  requireString(value.description, "guessPolicy.description", { max: 320 });
  if (!value.rules || typeof value.rules !== "object" || Array.isArray(value.rules)) {
    errors.push("guessPolicy.rules doit etre un objet.");
  } else {
    requireBoolean(value.rules.rejectSingleRepeatedLetter, "guessPolicy.rules.rejectSingleRepeatedLetter");
    requireBoolean(value.rules.requireVowelLikeLetter, "guessPolicy.rules.requireVowelLikeLetter");
  }
  if (!value.messages || typeof value.messages !== "object" || Array.isArray(value.messages)) {
    errors.push("guessPolicy.messages doit etre un objet.");
  } else {
    requireString(value.messages.repeated, "guessPolicy.messages.repeated", { max: 100 });
    requireString(value.messages.vowel, "guessPolicy.messages.vowel", { max: 100 });
    requireString(value.messages.unknown, "guessPolicy.messages.unknown", { max: 100 });
  }
  requireAnswerArray(value.words, "guessPolicy.words", { min: 0 });
}

function validateAcceptedGuesses(value, sourceIds) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push("packages/corpus/le-mot-a-biloute/accepted-guesses.json doit etre un objet.");
    return;
  }

  requireDate(value.generatedAt, "acceptedGuesses.generatedAt");
  requireString(value.description, "acceptedGuesses.description", { max: 320 });
  requireSourceRefs(value.sourceIds, "acceptedGuesses.sourceIds", sourceIds);
  requireAnswerArray(value.words, "acceptedGuesses.words", { min: 1 });
}

function validatePuzzles(value, sourceIds, forbiddenLabels) {
  if (!Array.isArray(value)) {
    errors.push("packages/corpus/lille-mele/puzzles.json doit etre un tableau.");
    return;
  }

  const ids = new Set();
  const numbers = new Set();
  value.forEach((puzzle, index) => {
    const scope = `puzzles[${index}]`;
    requireKebabId(puzzle?.id, `${scope}.id`);
    requireInteger(puzzle?.number, `${scope}.number`, { min: 1 });
    requireString(puzzle?.title, `${scope}.title`, { max: 60 });
    requireString(puzzle?.intro, `${scope}.intro`, { max: 140 });
    requireString(puzzle?.finalNote, `${scope}.finalNote`, { max: 320 });
    requireEnum(puzzle?.status, `${scope}.status`, ["prototype", "reviewed", "published"], {
      optional: false,
    });
    requireKebabArray(puzzle?.tags, `${scope}.tags`, { min: 1 });
    requireSourceRefs(puzzle?.sourceIds, `${scope}.sourceIds`, sourceIds, { min: 1 });
    requireArray(puzzle?.groups, `${scope}.groups`, 4);
    requireString(puzzle?.bonus?.question, `${scope}.bonus.question`, { max: 140 });
    if (typeof puzzle?.bonus?.answer !== "boolean") {
      errors.push(`${scope}.bonus.answer doit etre un booleen.`);
    }
    requireString(puzzle?.bonus?.explanation, `${scope}.bonus.explanation`, { max: 240 });

    addUnique(ids, puzzle?.id, `${scope}.id`);
    addUnique(numbers, puzzle?.number, `${scope}.number`);

    const groupIds = new Set();
    const itemIds = new Set();
    const normalizedItemIds = new Set();
    puzzle?.groups?.forEach((group, groupIndex) => {
      const groupScope = `${scope}.groups[${groupIndex}]`;
      requireKebabId(group?.id, `${groupScope}.id`);
      requireString(group?.title, `${groupScope}.title`, { max: 60 });
      requireEnum(group?.difficulty, `${groupScope}.difficulty`, [
        "easy",
        "medium",
        "hard",
        "tricky",
      ]);
      requireSourceRefs(group?.sourceIds, `${groupScope}.sourceIds`, sourceIds, { min: 1 });
      requireKebabArray(group?.tags, `${groupScope}.tags`, { optional: true });
      requireStringArray(group?.items, `${groupScope}.items`, {
        length: 4,
        maxItem: 40,
        unique: true,
      });
      requireString(group?.note, `${groupScope}.note`, { max: 180 });

      addUnique(groupIds, group?.id, `${groupScope}.id`);
      group?.items?.forEach((item, itemIndex) => {
        const itemLabel = `${groupScope}.items[${itemIndex}]`;
        addUnique(itemIds, item, itemLabel);
        const normalized = normalizeLabel(item);
        addUnique(normalizedItemIds, normalized, itemLabel);
        if (forbiddenLabels.has(normalized)) {
          errors.push(`${itemLabel} utilise un item exclu ou sensible : ${forbiddenLabels.get(normalized)}.`);
        }
      });
    });

    if (itemIds.size !== 16) {
      errors.push(`${scope}.groups doit contenir 16 items distincts au total.`);
    }
    if (normalizedItemIds.size !== 16) {
      errors.push(`${scope}.groups doit contenir 16 items distincts apres normalisation.`);
    }
  });
}

function buildForbiddenLabels(excludedSensitiveItems, candidateItems) {
  const labels = new Map();
  collectForbiddenLabels(labels, excludedSensitiveItems?.items, "excluded-sensitive-items.json");
  collectForbiddenLabels(
    labels,
    candidateItems?.items?.filter((item) => item?.editorialStatus === "avoid" || item?.validation === "avoid"),
    "candidate-items.json"
  );
  return labels;
}

function collectForbiddenLabels(labels, items, sourceLabel) {
  if (items === undefined) return;
  if (!Array.isArray(items)) {
    errors.push(`${sourceLabel} doit exposer un tableau items.`);
    return;
  }
  items.forEach((item, index) => {
    const label = item?.label;
    if (typeof label !== "string" || label.trim() === "") {
      errors.push(`${sourceLabel}.items[${index}].label est obligatoire.`);
      return;
    }
    labels.set(normalizeLabel(label), label);
  });
}

function normalizeLabel(value) {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’.-]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function requireString(value, label, options = {}) {
  if (options.optional && value === undefined) return;
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${label} est obligatoire.`);
    return;
  }
  if (options.max && value.length > options.max) {
    errors.push(`${label} doit contenir ${options.max} caracteres maximum.`);
  }
}

function requireInteger(value, label, options = {}) {
  if (!Number.isInteger(value)) {
    errors.push(`${label} doit etre un entier.`);
    return;
  }
  if (options.min !== undefined && value < options.min) {
    errors.push(`${label} doit etre superieur ou egal a ${options.min}.`);
  }
}

function requireBoolean(value, label) {
  if (typeof value !== "boolean") {
    errors.push(`${label} doit etre un booleen.`);
  }
}

function requireArray(value, label, expectedLength = null) {
  if (!Array.isArray(value)) {
    errors.push(`${label} doit etre un tableau.`);
    return false;
  }
  if (expectedLength !== null && value.length !== expectedLength) {
    errors.push(`${label} doit contenir ${expectedLength} element(s).`);
  }
  return true;
}

function requireStringArray(value, label, options = {}) {
  if (!requireArray(value, label, options.length ?? null)) return;
  if (options.min !== undefined && value.length < options.min) {
    errors.push(`${label} doit contenir au moins ${options.min} element(s).`);
  }

  const seen = new Set();
  value.forEach((item, index) => {
    const itemLabel = `${label}[${index}]`;
    requireString(item, itemLabel, { max: options.maxItem });
    if (options.unique) addUnique(seen, item, itemLabel);
  });
}

function requireKebabArray(value, label, options = {}) {
  if (options.optional && value === undefined) return;
  if (!requireArray(value, label)) return;
  if (options.min !== undefined && value.length < options.min) {
    errors.push(`${label} doit contenir au moins ${options.min} element(s).`);
  }

  const seen = new Set();
  value.forEach((item, index) => {
    const itemLabel = `${label}[${index}]`;
    requireKebabId(item, itemLabel);
    addUnique(seen, item, itemLabel);
  });
}

function requireAnswerArray(value, label, options = {}) {
  if (!requireArray(value, label)) return;
  if (options.min !== undefined && value.length < options.min) {
    errors.push(`${label} doit contenir au moins ${options.min} element(s).`);
  }

  const seen = new Set();
  value.forEach((item, index) => {
    const itemLabel = `${label}[${index}]`;
    requireAnswer(item, itemLabel);
    addUnique(seen, item, itemLabel);
  });
}

function requireKebabId(value, label) {
  requireString(value, label);
  if (typeof value === "string" && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    errors.push(`${label} doit etre un identifiant kebab-case.`);
  }
}

function requireAnswer(value, label) {
  requireString(value, label);
  if (typeof value === "string" && !/^[A-ZÀ-Ÿ-]{4,12}$/.test(value)) {
    errors.push(`${label} doit etre en capitales et rester court.`);
  }
}

function requireUrl(value, label) {
  requireString(value, label);
  if (typeof value === "string" && !/^https?:\/\//.test(value)) {
    errors.push(`${label} doit etre une URL http(s).`);
  }
}

function requireDate(value, label) {
  requireString(value, label);
  if (typeof value === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    errors.push(`${label} doit utiliser le format AAAA-MM-JJ.`);
  }
}

function requireEnum(value, label, allowed, options = {}) {
  if (options.optional && value === undefined) return;
  if (!allowed.includes(value)) {
    errors.push(`${label} doit etre parmi : ${allowed.join(", ")}.`);
  }
}

function requireSourceRefs(value, label, sourceIds, options = {}) {
  if (options.optional && value === undefined) return;
  if (!requireArray(value, label)) return;
  if (options.min !== undefined && value.length < options.min) {
    errors.push(`${label} doit contenir au moins ${options.min} source(s).`);
  }

  const seen = new Set();
  value.forEach((sourceId, index) => {
    const itemLabel = `${label}[${index}]`;
    requireKebabId(sourceId, itemLabel);
    addUnique(seen, sourceId, itemLabel);
    if (typeof sourceId === "string" && !sourceIds.has(sourceId)) {
      errors.push(`${itemLabel} ne correspond a aucune source commune.`);
    }
  });
}

function addUnique(set, value, label) {
  if (value === undefined || value === null || value === "") return;
  if (set.has(value)) errors.push(`${label} est en doublon.`);
  set.add(value);
}
