import { readFile } from "node:fs/promises";

const errors = [];

const sources = await readJson("packages/corpus/sources.json");
const words = await readJson("packages/corpus/le-mot-a-biloute/words.json");
const puzzles = await readJson("packages/corpus/lille-mele/puzzles.json");

validateSources(sources);
validateWords(words);
validatePuzzles(puzzles);

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
  if (!Array.isArray(value)) {
    errors.push("packages/corpus/sources.json doit etre un tableau.");
    return;
  }

  const labels = new Set();
  value.forEach((source, index) => {
    const scope = `sources[${index}]`;
    requireString(source?.label, `${scope}.label`);
    requireUrl(source?.url, `${scope}.url`);
    if (source?.label) {
      if (labels.has(source.label)) errors.push(`${scope}.label est en doublon.`);
      labels.add(source.label);
    }
  });
}

function validateWords(value) {
  if (!Array.isArray(value)) {
    errors.push("packages/corpus/le-mot-a-biloute/words.json doit etre un tableau.");
    return;
  }

  const ids = new Set();
  value.forEach((word, index) => {
    const scope = `words[${index}]`;
    requireString(word?.id, `${scope}.id`);
    requireString(word?.answer, `${scope}.answer`);
    requireString(word?.category, `${scope}.category`);
    requireString(word?.starterHint, `${scope}.starterHint`);
    requireArrayMin(word?.hints, `${scope}.hints`, 1);
    requireArrayMin(word?.acceptedAnswers, `${scope}.acceptedAnswers`, 1);
    requireString(word?.bonus?.title, `${scope}.bonus.title`);
    requireString(word?.bonus?.text, `${scope}.bonus.text`);

    if (word?.id) {
      if (ids.has(word.id)) errors.push(`${scope}.id est en doublon.`);
      ids.add(word.id);
    }
    if (word?.answer && !/^[A-ZÀ-Ÿ-]{4,12}$/.test(word.answer)) {
      errors.push(`${scope}.answer doit etre en capitales et rester court.`);
    }
  });
}

function validatePuzzles(value) {
  if (!Array.isArray(value)) {
    errors.push("packages/corpus/lille-mele/puzzles.json doit etre un tableau.");
    return;
  }

  const ids = new Set();
  value.forEach((puzzle, index) => {
    const scope = `puzzles[${index}]`;
    requireString(puzzle?.id, `${scope}.id`);
    requireNumber(puzzle?.number, `${scope}.number`);
    requireString(puzzle?.title, `${scope}.title`);
    requireString(puzzle?.intro, `${scope}.intro`);
    requireString(puzzle?.finalNote, `${scope}.finalNote`);
    requireArray(puzzle?.groups, `${scope}.groups`, 4);
    requireString(puzzle?.bonus?.question, `${scope}.bonus.question`);
    if (typeof puzzle?.bonus?.answer !== "boolean") {
      errors.push(`${scope}.bonus.answer doit etre un booleen.`);
    }
    requireString(puzzle?.bonus?.explanation, `${scope}.bonus.explanation`);

    if (puzzle?.id) {
      if (ids.has(puzzle.id)) errors.push(`${scope}.id est en doublon.`);
      ids.add(puzzle.id);
    }

    const itemIds = new Set();
    puzzle?.groups?.forEach((group, groupIndex) => {
      const groupScope = `${scope}.groups[${groupIndex}]`;
      requireString(group?.id, `${groupScope}.id`);
      requireString(group?.title, `${groupScope}.title`);
      requireString(group?.difficulty, `${groupScope}.difficulty`);
      requireArray(group?.items, `${groupScope}.items`, 4);
      requireString(group?.note, `${groupScope}.note`);
      if (!["easy", "medium", "hard", "tricky"].includes(group?.difficulty)) {
        errors.push(`${groupScope}.difficulty doit etre easy, medium, hard ou tricky.`);
      }
      group?.items?.forEach((item) => {
        if (itemIds.has(item)) errors.push(`${groupScope}.items contient un item deja utilise : ${item}`);
        itemIds.add(item);
      });
    });
  });
}

function requireString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${label} est obligatoire.`);
  }
}

function requireNumber(value, label) {
  if (!Number.isFinite(value)) {
    errors.push(`${label} doit etre un nombre.`);
  }
}

function requireArray(value, label, expectedLength = null) {
  if (!Array.isArray(value)) {
    errors.push(`${label} doit etre un tableau.`);
    return;
  }
  if (expectedLength !== null && value.length !== expectedLength) {
    errors.push(`${label} doit contenir ${expectedLength} element(s).`);
  }
}

function requireArrayMin(value, label, minLength) {
  if (!Array.isArray(value)) {
    errors.push(`${label} doit etre un tableau.`);
    return;
  }
  if (value.length < minLength) {
    errors.push(`${label} doit contenir au moins ${minLength} element(s).`);
  }
}

function requireUrl(value, label) {
  requireString(value, label);
  if (typeof value === "string" && !/^https?:\/\//.test(value)) {
    errors.push(`${label} doit etre une URL http(s).`);
  }
}
