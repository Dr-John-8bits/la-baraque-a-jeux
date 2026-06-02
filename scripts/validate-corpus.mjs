import { readFile } from "node:fs/promises";

const errors = [];
const FORBIDDEN_LABEL_PATTERNS = [
  /\bsaint\b/,
  /\bsainte\b/,
  /\bst\b/,
  /\bste\b/,
  /\beglise\b/,
  /\bchapelle\b/,
  /\bcalvaire\b/,
  /\babbaye\b/,
  /\btemple\b/,
  /\bdieu\b/,
  /\bcathedrale\b/,
  /\bcatholique\b/,
  /\bmosquee\b/,
  /\bislam/,
  /\bbouddh/,
  /\brelig/,
  /\baumonerie\b/,
  /\barmee du salut\b/,
];

const sources = await readJson("packages/corpus/sources.json");
const words = await readJson("packages/corpus/le-mot-a-biloute/words.json");
const guessPolicy = await readJson("packages/corpus/le-mot-a-biloute/guess-policy.json");
const acceptedGuesses = await readJson("packages/corpus/le-mot-a-biloute/accepted-guesses.json");
const frenchGuesses = await readJson("packages/corpus/le-mot-a-biloute/french-guesses.json");
const puzzles = await readJson("packages/corpus/lille-mele/puzzles.json");
const stationMetroStations = await readJson("packages/corpus/station-mystere/metro-stations.json");
const stationVlilleStations = await readJson("packages/corpus/station-mystere/vlille-stations.json");
const stationBusNetwork = await readJson("packages/corpus/station-mystere/bus-network.json");
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
validateFrenchGuesses(frenchGuesses, sourceIds);
validatePuzzles(puzzles, sourceIds, forbiddenLabels);
validateStationMystereMetroStations(stationMetroStations, sourceIds);
validateStationMystereVlilleStations(stationVlilleStations, sourceIds);
validateStationMystereBusNetwork(stationBusNetwork, sourceIds);

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

function validateFrenchGuesses(value, sourceIds) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push("packages/corpus/le-mot-a-biloute/french-guesses.json doit etre un objet.");
    return;
  }

  requireDate(value.generatedAt, "frenchGuesses.generatedAt");
  requireString(value.description, "frenchGuesses.description", { max: 320 });
  requireSourceRefs(value.sourceIds, "frenchGuesses.sourceIds", sourceIds);
  requireString(value.license, "frenchGuesses.license", { max: 80 });
  requireAnswerArray(value.words, "frenchGuesses.words", { min: 1 });
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
        const forbiddenPattern = FORBIDDEN_LABEL_PATTERNS.find((pattern) => pattern.test(normalized));
        if (forbiddenPattern) {
          errors.push(`${itemLabel} contient une reference religieuse interdite : ${item}.`);
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

function validateStationMystereMetroStations(value, sourceIds) {
  const scope = "stationMystere.metroStations";
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${scope} doit etre un objet.`);
    return;
  }

  requireDate(value.generatedAt, `${scope}.generatedAt`);
  requireEnum(value.status, `${scope}.status`, ["technical-baseline", "reviewed", "published"]);
  requireString(value.description, `${scope}.description`, { max: 320 });
  requireEnum(value.level, `${scope}.level`, ["metro"]);
  requireSourceRefs(value.sourceIds, `${scope}.sourceIds`, sourceIds, { min: 1 });

  if (value.stats && typeof value.stats === "object" && !Array.isArray(value.stats)) {
    requireInteger(value.stats.lineCount, `${scope}.stats.lineCount`, { min: 1 });
    requireInteger(value.stats.stationCount, `${scope}.stats.stationCount`, { min: 1 });
    requireInteger(value.stats.transferStationCount, `${scope}.stats.transferStationCount`, { min: 0 });
    requireInteger(value.stats.ambiguousNameCount, `${scope}.stats.ambiguousNameCount`, { min: 0 });
  } else {
    errors.push(`${scope}.stats est obligatoire.`);
  }

  if (requireArray(value.lines, `${scope}.lines`)) {
    if (value.lines.length < 1) errors.push(`${scope}.lines doit contenir au moins une ligne.`);
    value.lines.forEach((line, lineIndex) => {
      const lineScope = `${scope}.lines[${lineIndex}]`;
      requireString(line?.id, `${lineScope}.id`, { max: 20 });
      requireString(line?.nomCourt, `${lineScope}.nomCourt`, { max: 8 });
      requireString(line?.nom, `${lineScope}.nom`, { max: 80 });
      if (!/^M\d+$/.test(line?.nomCourt ?? "")) {
        errors.push(`${lineScope}.nomCourt doit etre un code metro de type M1.`);
      }
      if (requireArray(line?.directions, `${lineScope}.directions`)) {
        line.directions.forEach((direction, directionIndex) => {
          const directionScope = `${lineScope}.directions[${directionIndex}]`;
          requireString(direction?.directionId, `${directionScope}.directionId`, { max: 8 });
          requireInteger(direction?.trajetRepresentatifCount, `${directionScope}.trajetRepresentatifCount`, {
            min: 1,
          });
          requireString(direction?.terminusDepart, `${directionScope}.terminusDepart`, { max: 80 });
          requireString(direction?.terminusArrivee, `${directionScope}.terminusArrivee`, { max: 80 });
          if (requireArray(direction?.stations, `${directionScope}.stations`)) {
            direction.stations.forEach((station, stationIndex) => {
              const stationScope = `${directionScope}.stations[${stationIndex}]`;
              requireKebabId(station?.id, `${stationScope}.id`);
              requireString(station?.stopId, `${stationScope}.stopId`, { max: 20 });
              requireString(station?.nom, `${stationScope}.nom`, { max: 80 });
              requireString(station?.commune, `${stationScope}.commune`, { max: 120 });
              requireInteger(station?.sequence, `${stationScope}.sequence`, { min: 1 });
              requireCoordinates(station?.coordonnees, `${stationScope}.coordonnees`);
            });
          }
        });
      }
    });
  }

  if (requireArray(value.stations, `${scope}.stations`)) {
    const ids = new Set();
    let transferCount = 0;
    value.stations.forEach((station, index) => {
      const stationScope = `${scope}.stations[${index}]`;
      requireKebabId(station?.id, `${stationScope}.id`);
      addUnique(ids, station?.id, `${stationScope}.id`);
      requireEnum(station?.type, `${stationScope}.type`, ["metro"]);
      requireEnum(station?.niveau, `${stationScope}.niveau`, ["metro"]);
      requireString(station?.nom, `${stationScope}.nom`, { max: 80 });
      requireString(station?.nomTechnique, `${stationScope}.nomTechnique`, { max: 80 });
      requireString(station?.commune, `${stationScope}.commune`, { max: 120 });
      requireStringArray(station?.communes, `${stationScope}.communes`, {
        min: 1,
        maxItem: 80,
        unique: true,
      });
      requireCoordinates(station?.coordonnees, `${stationScope}.coordonnees`);
      requireStringArray(station?.lignes, `${stationScope}.lignes`, { min: 1, maxItem: 8, unique: true });
      station?.lignes?.forEach((line, lineIndex) => {
        if (!/^M\d+$/.test(line)) errors.push(`${stationScope}.lignes[${lineIndex}] doit etre une ligne metro.`);
      });
      if (station?.lignes?.length > 1) transferCount += 1;
      requireStringArray(station?.identifiants?.gtfsStopIds, `${stationScope}.identifiants.gtfsStopIds`, {
        min: 1,
        maxItem: 20,
        unique: true,
      });
      requireStringArray(station?.indicesTechniques, `${stationScope}.indicesTechniques`, {
        min: 1,
        maxItem: 160,
        unique: true,
      });
      requireSourceRefs(station?.sourceIds, `${stationScope}.sourceIds`, sourceIds, { min: 1 });
      requireEnum(station?.ficheDecouverte?.statut, `${stationScope}.ficheDecouverte.statut`, [
        "a-enrichir",
        "reviewed",
        "published",
      ]);
    });

    if (value.stats?.stationCount !== value.stations.length) {
      errors.push(`${scope}.stats.stationCount doit correspondre au nombre de stations.`);
    }
    if (value.stats?.transferStationCount !== transferCount) {
      errors.push(`${scope}.stats.transferStationCount doit correspondre aux stations multi-lignes.`);
    }
  }
}

function validateStationMystereVlilleStations(value, sourceIds) {
  const scope = "stationMystere.vlilleStations";
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${scope} doit etre un objet.`);
    return;
  }

  requireDate(value.generatedAt, `${scope}.generatedAt`);
  requireEnum(value.status, `${scope}.status`, ["technical-baseline", "reviewed", "published"]);
  requireString(value.description, `${scope}.description`, { max: 320 });
  requireEnum(value.level, `${scope}.level`, ["velo"]);
  requireSourceRefs(value.sourceIds, `${scope}.sourceIds`, sourceIds, { min: 1 });
  requireString(value.system?.id, `${scope}.system.id`, { max: 40 });
  requireString(value.system?.name, `${scope}.system.name`, { max: 80 });
  requireString(value.system?.timezone, `${scope}.system.timezone`, { max: 80 });
  requireString(value.system?.gbfsVersion, `${scope}.system.gbfsVersion`, { max: 20 });

  if (value.stats && typeof value.stats === "object" && !Array.isArray(value.stats)) {
    requireInteger(value.stats.stationInformationCount, `${scope}.stats.stationInformationCount`, { min: 1 });
    requireInteger(value.stats.stationStatusCount, `${scope}.stats.stationStatusCount`, { min: 0 });
    requireInteger(value.stats.stationCount, `${scope}.stats.stationCount`, { min: 1 });
    requireInteger(value.stats.playableCandidateCount, `${scope}.stats.playableCandidateCount`, { min: 0 });
    requireInteger(value.stats.toReviewCount, `${scope}.stats.toReviewCount`, { min: 0 });
    requireInteger(value.stats.missingStatusCount, `${scope}.stats.missingStatusCount`, { min: 0 });
    requireInteger(value.stats.installedCount, `${scope}.stats.installedCount`, { min: 0 });
    requireInteger(value.stats.rentingCount, `${scope}.stats.rentingCount`, { min: 0 });
    requireInteger(value.stats.returningCount, `${scope}.stats.returningCount`, { min: 0 });
    requireInteger(value.stats.virtualStationCount, `${scope}.stats.virtualStationCount`, { min: 0 });
    requireInteger(value.stats.zeroCapacityCount, `${scope}.stats.zeroCapacityCount`, { min: 0 });
    requireInteger(value.stats.totalCapacity, `${scope}.stats.totalCapacity`, { min: 0 });
    requireInteger(value.stats.communeCount, `${scope}.stats.communeCount`, { min: 0 });
  } else {
    errors.push(`${scope}.stats est obligatoire.`);
  }

  if (requireArray(value.communes, `${scope}.communes`)) {
    value.communes.forEach((commune, index) => {
      const communeScope = `${scope}.communes[${index}]`;
      requireString(commune?.nom, `${communeScope}.nom`, { max: 80 });
      requireInteger(commune?.stationCount, `${communeScope}.stationCount`, { min: 1 });
    });
  }

  if (requireArray(value.feeds, `${scope}.feeds`)) {
    value.feeds.forEach((feed, index) => {
      const feedScope = `${scope}.feeds[${index}]`;
      requireString(feed?.name, `${feedScope}.name`, { max: 80 });
      requireUrl(feed?.url, `${feedScope}.url`);
    });
  }

  if (requireArray(value.stations, `${scope}.stations`)) {
    const ids = new Set();
    let candidateCount = 0;
    let toReviewCount = 0;
    let missingStatusCount = 0;
    let totalCapacity = 0;
    let zeroCapacityCount = 0;
    let virtualStationCount = 0;

    value.stations.forEach((station, index) => {
      const stationScope = `${scope}.stations[${index}]`;
      requireKebabId(station?.id, `${stationScope}.id`);
      addUnique(ids, station?.id, `${stationScope}.id`);
      requireEnum(station?.type, `${stationScope}.type`, ["vlille"]);
      requireEnum(station?.niveau, `${stationScope}.niveau`, ["velo"]);
      requireString(station?.nom, `${stationScope}.nom`, { max: 100 });
      requireString(station?.nomTechnique, `${stationScope}.nomTechnique`, { max: 100 });
      requireString(station?.commune, `${stationScope}.commune`, { max: 80 });
      requireString(station?.codePostal, `${stationScope}.codePostal`, { max: 12 });
      requireCoordinates(station?.coordonnees, `${stationScope}.coordonnees`);
      requireInteger(station?.capacite, `${stationScope}.capacite`, { min: 0 });
      totalCapacity += Number.isInteger(station?.capacite) ? station.capacite : 0;
      if (station?.capacite === 0) zeroCapacityCount += 1;
      if (typeof station?.isVirtualStation !== "boolean") {
        errors.push(`${stationScope}.isVirtualStation doit etre un booleen.`);
      } else if (station.isVirtualStation) {
        virtualStationCount += 1;
      }
      requireString(station?.parking?.type, `${stationScope}.parking.type`, { max: 40 });
      if (typeof station?.parking?.arceau !== "boolean") {
        errors.push(`${stationScope}.parking.arceau doit etre un booleen.`);
      }
      requireString(station?.identifiants?.gbfsStationId, `${stationScope}.identifiants.gbfsStationId`, {
        max: 20,
      });

      if (station?.statutTempsReel === null) {
        missingStatusCount += 1;
      } else if (station?.statutTempsReel && typeof station.statutTempsReel === "object") {
        requireInteger(station.statutTempsReel.lastReported, `${stationScope}.statutTempsReel.lastReported`, {
          min: 0,
        });
        requireBoolean(station.statutTempsReel.isInstalled, `${stationScope}.statutTempsReel.isInstalled`);
        requireBoolean(station.statutTempsReel.isRenting, `${stationScope}.statutTempsReel.isRenting`);
        requireBoolean(station.statutTempsReel.isReturning, `${stationScope}.statutTempsReel.isReturning`);
        requireInteger(station.statutTempsReel.velosDisponibles, `${stationScope}.statutTempsReel.velosDisponibles`, {
          min: 0,
        });
        requireInteger(station.statutTempsReel.placesDisponibles, `${stationScope}.statutTempsReel.placesDisponibles`, {
          min: 0,
        });
      } else {
        errors.push(`${stationScope}.statutTempsReel doit etre un objet ou null.`);
      }

      requireEnum(station?.eligibiliteJeu?.statut, `${stationScope}.eligibiliteJeu.statut`, [
        "candidate",
        "a-verifier",
      ]);
      if (station?.eligibiliteJeu?.statut === "candidate") candidateCount += 1;
      if (station?.eligibiliteJeu?.statut === "a-verifier") toReviewCount += 1;
      requireKebabArray(station?.eligibiliteJeu?.raisons, `${stationScope}.eligibiliteJeu.raisons`);
      requireStringArray(station?.indicesTechniques, `${stationScope}.indicesTechniques`, {
        min: 1,
        maxItem: 160,
        unique: true,
      });
      requireSourceRefs(station?.sourceIds, `${stationScope}.sourceIds`, sourceIds, { min: 1 });
      requireEnum(station?.ficheDecouverte?.statut, `${stationScope}.ficheDecouverte.statut`, [
        "a-enrichir",
        "reviewed",
        "published",
      ]);
    });

    if (value.stats?.stationCount !== value.stations.length) {
      errors.push(`${scope}.stats.stationCount doit correspondre au nombre de stations.`);
    }
    if (value.stats?.stationInformationCount !== value.stations.length) {
      errors.push(`${scope}.stats.stationInformationCount doit correspondre au nombre de stations.`);
    }
    if (value.stats?.playableCandidateCount !== candidateCount) {
      errors.push(`${scope}.stats.playableCandidateCount doit correspondre aux candidates.`);
    }
    if (value.stats?.toReviewCount !== toReviewCount) {
      errors.push(`${scope}.stats.toReviewCount doit correspondre aux stations a verifier.`);
    }
    if (value.stats?.missingStatusCount !== missingStatusCount) {
      errors.push(`${scope}.stats.missingStatusCount doit correspondre aux statuts manquants.`);
    }
    if (value.stats?.totalCapacity !== totalCapacity) {
      errors.push(`${scope}.stats.totalCapacity doit correspondre a la capacite cumulee.`);
    }
    if (value.stats?.zeroCapacityCount !== zeroCapacityCount) {
      errors.push(`${scope}.stats.zeroCapacityCount doit correspondre aux stations a capacite nulle.`);
    }
    if (value.stats?.virtualStationCount !== virtualStationCount) {
      errors.push(`${scope}.stats.virtualStationCount doit correspondre aux stations virtuelles.`);
    }
  }
}

function validateStationMystereBusNetwork(value, sourceIds) {
  const scope = "stationMystere.busNetwork";
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${scope} doit etre un objet.`);
    return;
  }

  requireDate(value.generatedAt, `${scope}.generatedAt`);
  requireEnum(value.status, `${scope}.status`, ["technical-baseline", "reviewed", "published"]);
  requireString(value.description, `${scope}.description`, { max: 360 });
  requireEnum(value.level, `${scope}.level`, ["bus"]);
  requireSourceRefs(value.sourceIds, `${scope}.sourceIds`, sourceIds, { min: 1 });

  if (value.stats && typeof value.stats === "object" && !Array.isArray(value.stats)) {
    requireInteger(value.stats.lineCount, `${scope}.stats.lineCount`, { min: 1 });
    requireInteger(value.stats.directionCount, `${scope}.stats.directionCount`, { min: 1 });
    requireInteger(value.stats.patternCount, `${scope}.stats.patternCount`, { min: 1 });
    requireInteger(value.stats.stopCount, `${scope}.stats.stopCount`, { min: 1 });
    requireInteger(value.stats.rawGtfsStopPointCount, `${scope}.stats.rawGtfsStopPointCount`, { min: 1 });
    requireInteger(value.stats.candidateHubCount, `${scope}.stats.candidateHubCount`, { min: 0 });
    requireInteger(value.stats.candidateToStudyCount, `${scope}.stats.candidateToStudyCount`, { min: 0 });
    requireInteger(value.stats.inventoryOnlyCount, `${scope}.stats.inventoryOnlyCount`, { min: 0 });
    requireInteger(value.stats.communeCount, `${scope}.stats.communeCount`, { min: 0 });
  } else {
    errors.push(`${scope}.stats est obligatoire.`);
  }

  if (requireArray(value.communes, `${scope}.communes`)) {
    value.communes.forEach((commune, index) => {
      const communeScope = `${scope}.communes[${index}]`;
      requireString(commune?.nom, `${communeScope}.nom`, { max: 100 });
      requireInteger(commune?.stopCount, `${communeScope}.stopCount`, { min: 1 });
    });
  }

  const stopIds = new Set();
  let candidateHubCount = 0;
  let candidateToStudyCount = 0;
  let inventoryOnlyCount = 0;
  let rawGtfsStopPointCount = 0;
  if (requireArray(value.stops, `${scope}.stops`)) {
    const gtfsStopIds = new Set();
    value.stops.forEach((stop, index) => {
      const stopScope = `${scope}.stops[${index}]`;
      requireKebabId(stop?.id, `${stopScope}.id`);
      addUnique(stopIds, stop?.id, `${stopScope}.id`);
      requireEnum(stop?.type, `${stopScope}.type`, ["bus-stop"]);
      requireEnum(stop?.niveau, `${stopScope}.niveau`, ["bus"]);
      requireString(stop?.nom, `${stopScope}.nom`, { max: 100 });
      requireString(stop?.nomTechnique, `${stopScope}.nomTechnique`, { max: 100 });
      requireString(stop?.commune, `${stopScope}.commune`, { max: 180 });
      requireStringArray(stop?.communes, `${stopScope}.communes`, { min: 1, maxItem: 100, unique: true });
      requireCoordinates(stop?.coordonnees, `${stopScope}.coordonnees`);
      requireStringArray(stop?.lignes, `${stopScope}.lignes`, { min: 1, maxItem: 12, unique: true });
      requireStringArray(stop?.categoriesLignes, `${stopScope}.categoriesLignes`, {
        min: 1,
        maxItem: 20,
        unique: true,
      });
      stop?.categoriesLignes?.forEach((category, categoryIndex) => {
        requireEnum(category, `${stopScope}.categoriesLignes[${categoryIndex}]`, [
          "citadine",
          "corolle",
          "liane",
          "night",
          "regular",
          "resa",
          "school",
          "special",
        ]);
      });
      requireInteger(stop?.lineCount, `${stopScope}.lineCount`, { min: 1 });
      if (Array.isArray(stop?.lignes) && stop.lineCount !== stop.lignes.length) {
        errors.push(`${stopScope}.lineCount doit correspondre au nombre de lignes.`);
      }
      requireBoolean(stop?.isTerminus, `${stopScope}.isTerminus`);
      requireStringArray(stop?.identifiants?.gtfsStopIds, `${stopScope}.identifiants.gtfsStopIds`, {
        min: 1,
        maxItem: 20,
        unique: true,
      });
      stop?.identifiants?.gtfsStopIds?.forEach((gtfsStopId) => gtfsStopIds.add(gtfsStopId));
      requireArray(stop?.positions, `${stopScope}.positions`);
      requireEnum(stop?.usageJeu?.statut, `${stopScope}.usageJeu.statut`, [
        "pole-candidat",
        "candidat-a-etudier",
        "inventaire",
      ]);
      requireInteger(stop?.usageJeu?.score, `${stopScope}.usageJeu.score`, { min: 0 });
      requireKebabArray(stop?.usageJeu?.raisons, `${stopScope}.usageJeu.raisons`);
      if (stop?.usageJeu?.statut === "pole-candidat") candidateHubCount += 1;
      if (stop?.usageJeu?.statut === "candidat-a-etudier") candidateToStudyCount += 1;
      if (stop?.usageJeu?.statut === "inventaire") inventoryOnlyCount += 1;
      requireStringArray(stop?.indicesTechniques, `${stopScope}.indicesTechniques`, {
        min: 1,
        maxItem: 180,
        unique: true,
      });
      requireSourceRefs(stop?.sourceIds, `${stopScope}.sourceIds`, sourceIds, { min: 1 });
      requireEnum(stop?.ficheDecouverte?.statut, `${stopScope}.ficheDecouverte.statut`, [
        "a-enrichir",
        "reviewed",
        "published",
      ]);
    });
    rawGtfsStopPointCount = gtfsStopIds.size;
  }

  let directionCount = 0;
  let patternCount = 0;
  if (requireArray(value.lines, `${scope}.lines`)) {
    value.lines.forEach((line, lineIndex) => {
      const lineScope = `${scope}.lines[${lineIndex}]`;
      requireString(line?.id, `${lineScope}.id`, { max: 20 });
      requireString(line?.nomCourt, `${lineScope}.nomCourt`, { max: 12 });
      requireString(line?.nom, `${lineScope}.nom`, { max: 100 });
      requireString(line?.description, `${lineScope}.description`, { max: 160 });
      requireEnum(line?.categorie, `${lineScope}.categorie`, [
        "citadine",
        "corolle",
        "liane",
        "night",
        "regular",
        "resa",
        "school",
        "special",
      ]);
      requireStringArray(line?.communes, `${lineScope}.communes`, { maxItem: 100, unique: true });
      requireInteger(line?.stopPointCount, `${lineScope}.stopPointCount`, { min: 1 });
      if (requireArray(line?.directions, `${lineScope}.directions`)) {
        directionCount += line.directions.length;
        line.directions.forEach((direction, directionIndex) => {
          const directionScope = `${lineScope}.directions[${directionIndex}]`;
          requireString(direction?.directionId, `${directionScope}.directionId`, { max: 8 });
          requireInteger(direction?.patternCount, `${directionScope}.patternCount`, { min: 1 });
          requireInteger(direction?.totalTripCount, `${directionScope}.totalTripCount`, { min: 1 });
          requireString(direction?.representativePatternId, `${directionScope}.representativePatternId`, {
            max: 40,
          });
          if (requireArray(direction?.patterns, `${directionScope}.patterns`)) {
            patternCount += direction.patterns.length;
            if (direction.patternCount !== direction.patterns.length) {
              errors.push(`${directionScope}.patternCount doit correspondre au nombre de patterns.`);
            }
            direction.patterns.forEach((pattern, patternIndex) => {
              const patternScope = `${directionScope}.patterns[${patternIndex}]`;
              requireString(pattern?.patternId, `${patternScope}.patternId`, { max: 40 });
              requireInteger(pattern?.trajetCount, `${patternScope}.trajetCount`, { min: 1 });
              requireInteger(pattern?.stopCount, `${patternScope}.stopCount`, { min: 1 });
              requireString(pattern?.terminusDepart, `${patternScope}.terminusDepart`, { max: 100 });
              requireString(pattern?.terminusArrivee, `${patternScope}.terminusArrivee`, { max: 100 });
              if (requireArray(pattern?.stops, `${patternScope}.stops`)) {
                if (pattern.stopCount !== pattern.stops.length) {
                  errors.push(`${patternScope}.stopCount doit correspondre au nombre d'arrets.`);
                }
                pattern.stops.forEach((stop, stopIndex) => {
                  const lineStopScope = `${patternScope}.stops[${stopIndex}]`;
                  requireKebabId(stop?.id, `${lineStopScope}.id`);
                  if (typeof stop?.id === "string" && !stopIds.has(stop.id)) {
                    errors.push(`${lineStopScope}.id ne correspond a aucun arret bus.`);
                  }
                  requireString(stop?.stopId, `${lineStopScope}.stopId`, { max: 20 });
                  requireString(stop?.nom, `${lineStopScope}.nom`, { max: 100 });
                  requireString(stop?.commune, `${lineStopScope}.commune`, { max: 120 });
                  requireInteger(stop?.sequence, `${lineStopScope}.sequence`, { min: 1 });
                  requireCoordinates(stop?.coordonnees, `${lineStopScope}.coordonnees`);
                });
              }
            });
          }
        });
      }
    });
  }

  if (value.stats?.lineCount !== value.lines?.length) {
    errors.push(`${scope}.stats.lineCount doit correspondre au nombre de lignes.`);
  }
  if (value.stats?.stopCount !== value.stops?.length) {
    errors.push(`${scope}.stats.stopCount doit correspondre au nombre d'arrets.`);
  }
  if (value.stats?.directionCount !== directionCount) {
    errors.push(`${scope}.stats.directionCount doit correspondre au nombre de directions.`);
  }
  if (value.stats?.patternCount !== patternCount) {
    errors.push(`${scope}.stats.patternCount doit correspondre au nombre de parcours.`);
  }
  if (value.stats?.candidateHubCount !== candidateHubCount) {
    errors.push(`${scope}.stats.candidateHubCount doit correspondre aux poles candidats.`);
  }
  if (value.stats?.candidateToStudyCount !== candidateToStudyCount) {
    errors.push(`${scope}.stats.candidateToStudyCount doit correspondre aux candidats a etudier.`);
  }
  if (value.stats?.inventoryOnlyCount !== inventoryOnlyCount) {
    errors.push(`${scope}.stats.inventoryOnlyCount doit correspondre aux arrets d'inventaire.`);
  }
  if (value.stats?.rawGtfsStopPointCount !== rawGtfsStopPointCount) {
    errors.push(`${scope}.stats.rawGtfsStopPointCount doit correspondre aux stop_id GTFS utilises.`);
  }

  if (requireArray(value.hubs, `${scope}.hubs`)) {
    value.hubs.forEach((hub, index) => {
      const hubScope = `${scope}.hubs[${index}]`;
      requireKebabId(hub?.id, `${hubScope}.id`);
      if (typeof hub?.id === "string" && !stopIds.has(hub.id)) {
        errors.push(`${hubScope}.id ne correspond a aucun arret bus.`);
      }
      requireString(hub?.nom, `${hubScope}.nom`, { max: 100 });
      requireString(hub?.commune, `${hubScope}.commune`, { max: 180 });
      requireStringArray(hub?.lignes, `${hubScope}.lignes`, { min: 1, maxItem: 12, unique: true });
      requireInteger(hub?.score, `${hubScope}.score`, { min: 0 });
      requireEnum(hub?.statut, `${hubScope}.statut`, ["pole-candidat", "candidat-a-etudier"]);
      requireKebabArray(hub?.raisons, `${hubScope}.raisons`);
    });
  }
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

function requireCoordinates(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${label} doit etre un objet.`);
    return;
  }
  if (!Number.isFinite(value.latitude)) errors.push(`${label}.latitude doit etre un nombre.`);
  if (!Number.isFinite(value.longitude)) errors.push(`${label}.longitude doit etre un nombre.`);
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
