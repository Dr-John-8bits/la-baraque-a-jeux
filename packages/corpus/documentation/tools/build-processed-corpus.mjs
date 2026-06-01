import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docRoot = path.resolve(__dirname, "..");
const rawRoot = path.join(docRoot, "raw");
const processedRoot = path.join(docRoot, "processed");

const generatedAt = "2026-06-01";

const sourceIds = {
  ileviaGtfs: "gtfs-ilevia-data-gouv",
  ileviaStops: "ilevia-arret-point-datamel",
  melCommunes: "mel-communes-datamel",
  melCommunesAssociees: "mel-communes-associees-datamel",
  melPopulations: "mel-populations-datamel",
  lilleQuartiers: "ville-lille-quartiers-data-gouv",
  lilleEquipements: "ville-lille-equipements-publics-data-gouv",
  lilleMonuments: "ville-lille-monuments-historiques-data-gouv",
  lilleParcs: "ville-lille-parcs-jardins-data-gouv",
  lilleRues: "ville-lille-troncons-rue-data-gouv",
  lilleAiresJeux: "ville-lille-aires-jeux-data-gouv",
  lilleVelos: "ville-lille-stations-reparation-velo-data-gouv",
  regionalWords: "regional-words-source-index",
  nordEscapadeDictionnaire: "nord-escapade-dictionnaire-chti",
  banqueChtimiGastronomie: "banque-chtimi-gastronomie-jeux",
  comptoirFlandresDictionnaire: "comptoir-flandres-dictionnaire-chti",
  comptoirFlandresBieres: "comptoir-flandres-bieres-nord",
};

const modeByRouteType = new Map([
  [0, "tramway"],
  [1, "metro"],
  [2, "rail"],
  [3, "bus"],
  [4, "ferry"],
  [5, "cable-tram"],
  [6, "aerial-lift"],
  [7, "funicular"],
  [11, "trolleybus"],
  [12, "monorail"],
]);

const religiousPattern =
  /\b(abbaye|basilique|calvaire|cathedrale|chapelle|cloitre|couvent|culte|cultuel|eglise|monastere|mosquee|paroisse|presbytere|religieux|religieuse|sainte?|st|synagogue|temple)\b/i;

await mkdir(path.join(processedRoot, "transport"), { recursive: true });
await mkdir(path.join(processedRoot, "geography"), { recursive: true });
await mkdir(path.join(processedRoot, "editorial"), { recursive: true });

const transport = await buildTransport();
const geography = await buildGeography(transport);
const localPlaces = await buildLocalPlaces();
const regionalWordSeeds = buildRegionalWordSeeds();
const candidateItems = buildCandidateItems({ transport, geography, localPlaces, regionalWordSeeds });
const candidateFamilies = buildCandidateFamilies({ transport, geography, localPlaces });

await writeJson(path.join(processedRoot, "editorial", "candidate-items.json"), candidateItems);
await writeJson(path.join(processedRoot, "editorial", "candidate-families.json"), candidateFamilies);
await writeJson(path.join(processedRoot, "editorial", "regional-word-seeds.json"), regionalWordSeeds);
await writeJson(path.join(processedRoot, "editorial", "excluded-sensitive-items.json"), {
  generatedAt,
  description:
    "Items ecartes des corpus jouables automatiques parce qu'ils portent un risque religieux, sensible ou ambigu. Les sources brutes restent conservees.",
  items: candidateItems.items.filter((item) => item.editorialStatus === "avoid"),
});

console.log("Corpus documentaire derive genere.");
console.log(`- lignes Ilévia: ${transport.lines.length}`);
console.log(`- communes MEL: ${geography.communes.length}`);
console.log(`- quartiers Lille/Lomme/Hellemmes: ${geography.quartiers.length}`);
console.log(`- lieux locaux: ${localPlaces.items.length}`);
console.log(`- items candidats: ${candidateItems.items.length}`);
console.log(`- familles candidates: ${candidateFamilies.families.length}`);

async function buildTransport() {
  const gtfsDir = path.join(rawRoot, "transport", "ilevia-gtfs");
  const routes = parseCsv(await readText(path.join(gtfsDir, "routes.txt")));
  const stops = parseCsv(await readText(path.join(gtfsDir, "stops.txt")));
  const trips = parseCsv(await readText(path.join(gtfsDir, "trips.txt")));
  const ileviaStopFeatures = await readJson(
    path.join(rawRoot, "transport", "ilevia-arret-point.geojson"),
  );
  const communeNameByKey = await loadCommuneNameIndex();

  const stopGeoById = new Map(
    ileviaStopFeatures.features.map((feature) => [
      String(feature.properties.stop_id),
      {
        commune: canonicalCommuneName(feature.properties.commune, communeNameByKey),
        x: numberOrNull(feature.properties.x),
        y: numberOrNull(feature.properties.y),
      },
    ]),
  );

  const stopsById = new Map(
    stops.map((stop) => {
      const geo = stopGeoById.get(stop.stop_id) ?? {};
      return [
        stop.stop_id,
        {
          id: stop.stop_id,
          name: cleanLabel(stop.stop_name),
          description: stop.stop_desc || null,
          latitude: numberOrNull(stop.stop_lat) ?? geo.y ?? null,
          longitude: numberOrNull(stop.stop_lon) ?? geo.x ?? null,
          commune:
            geo.commune ??
            canonicalCommuneName(communeFromStopDescription(stop.stop_desc), communeNameByKey),
          locationType: numberOrNull(stop.location_type),
          parentStation: stop.parent_station || null,
          wheelchairBoarding: numberOrNull(stop.wheelchair_boarding),
        },
      ];
    }),
  );

  const routesById = new Map(
    routes.map((route) => {
      const routeType = Number(route.route_type);
      return [
        route.route_id,
        {
          id: route.route_id,
          shortName: route.route_short_name,
          longName: route.route_long_name,
          description: route.route_desc || null,
          routeType,
          mode: modeByRouteType.get(routeType) ?? "unknown",
          color: route.route_color || null,
          textColor: route.route_text_color || null,
        },
      ];
    }),
  );

  const tripsById = new Map(
    trips.map((trip) => [
      trip.trip_id,
      {
        routeId: trip.route_id,
        serviceId: trip.service_id,
        headsign: cleanLabel(trip.trip_headsign),
        directionId: trip.direction_id || "0",
      },
    ]),
  );

  const directionBuckets = collectTripPatterns(
    await readText(path.join(gtfsDir, "stop_times.txt")),
    tripsById,
  );

  const lines = [...routesById.values()]
    .map((route) => {
      const directions = [...directionBuckets.values()]
        .filter((bucket) => bucket.routeId === route.id)
        .sort((a, b) => String(a.directionId).localeCompare(String(b.directionId)))
        .map((bucket) => {
          const pattern = [...bucket.patterns.values()].sort(
            (a, b) => b.count - a.count || b.stopIds.length - a.stopIds.length,
          )[0];
          const stopsForDirection = pattern.stopIds.map((stopId, index) => {
            const stop = stopsById.get(stopId);
            return {
              sequence: index + 1,
              stopId,
              name: stop?.name ?? stopId,
              commune: stop?.commune ?? null,
              latitude: stop?.latitude ?? null,
              longitude: stop?.longitude ?? null,
            };
          });
          return {
            directionId: bucket.directionId,
            representativeTripCount: pattern.count,
            terminalFrom: stopsForDirection[0]?.name ?? null,
            terminalTo: stopsForDirection.at(-1)?.name ?? null,
            headsigns: topEntries(bucket.headsigns, 8).map(([label, count]) => ({ label, count })),
            stopCount: stopsForDirection.length,
            stops: stopsForDirection,
          };
        });

      const communeSet = new Set();
      const stationSet = new Map();
      for (const direction of directions) {
        for (const stop of direction.stops) {
          if (stop.commune) communeSet.add(stop.commune);
          if (!stationSet.has(stop.name)) stationSet.set(stop.name, stop);
        }
      }

      return {
        ...route,
        sourceIds: [sourceIds.ileviaGtfs, sourceIds.ileviaStops],
        communes: [...communeSet].sort(localeSort),
        uniqueStopNames: [...stationSet.keys()].sort(localeSort),
        directions,
      };
    })
    .sort((a, b) => routeSortKey(a).localeCompare(routeSortKey(b), "fr"));

  const metroLines = lines.filter((line) => line.mode === "metro");
  const tramLines = lines.filter((line) => line.mode === "tramway");
  const busLines = lines.filter((line) => line.mode === "bus");
  const metroStationGroups = metroLines.map((line) => ({
    line: line.shortName,
    label: line.longName,
    sourceIds: line.sourceIds,
    stationsByDirection: line.directions.map((direction) => ({
      directionId: direction.directionId,
      terminalFrom: direction.terminalFrom,
      terminalTo: direction.terminalTo,
      stations: direction.stops.map((stop) => stop.name),
    })),
  }));

  await writeJson(path.join(processedRoot, "transport", "ilevia-lines.json"), {
    generatedAt,
    sourceIds: [sourceIds.ileviaGtfs, sourceIds.ileviaStops],
    routeTypeLegend: Object.fromEntries(modeByRouteType),
    lines,
  });
  await writeJson(path.join(processedRoot, "transport", "metro-lines.json"), {
    generatedAt,
    sourceIds: [sourceIds.ileviaGtfs, sourceIds.ileviaStops],
    lines: metroLines,
  });
  await writeJson(path.join(processedRoot, "transport", "metro-tram-lines.json"), {
    generatedAt,
    sourceIds: [sourceIds.ileviaGtfs, sourceIds.ileviaStops],
    lines: [...metroLines, ...tramLines],
  });
  await writeJson(path.join(processedRoot, "transport", "bus-lines.json"), {
    generatedAt,
    sourceIds: [sourceIds.ileviaGtfs, sourceIds.ileviaStops],
    lines: busLines,
  });
  await writeJson(path.join(processedRoot, "transport", "metro-station-groups.json"), {
    generatedAt,
    description: "Associations de stations par ligne et par direction, derivees du GTFS Ilévia.",
    sourceIds: [sourceIds.ileviaGtfs, sourceIds.ileviaStops],
    groups: metroStationGroups,
  });

  return { lines, metroLines, tramLines, busLines, stopsById };
}

async function loadCommuneNameIndex() {
  const files = [
    path.join(rawRoot, "data-gouv", "mel-communes.geojson"),
    path.join(rawRoot, "data-gouv", "mel-communes-associees.geojson"),
  ];
  const entries = [];
  for (const file of files) {
    const data = await readJson(file);
    for (const feature of data.features) entries.push(feature.properties.nom);
  }
  return new Map(entries.map((name) => [normalizeKey(name), name]));
}

function canonicalCommuneName(value, communeNameByKey) {
  if (!value) return null;
  return communeNameByKey.get(normalizeKey(value)) ?? titleCase(value);
}

async function buildGeography(transport) {
  const communesGeo = await readJson(path.join(rawRoot, "data-gouv", "mel-communes.geojson"));
  const populationsGeo = await readJson(path.join(rawRoot, "data-gouv", "mel-populations.geojson"));
  const quartiersRaw = await readJson(
    path.join(rawRoot, "data-gouv", "lille-quartiers.records.json"),
  );

  const populationsByInsee = new Map(
    populationsGeo.features.map((feature) => [
      feature.properties.code_insee,
      {
        pop2006: numberOrNull(feature.properties.pop_2006),
        pop2015: numberOrNull(feature.properties.pop_2015),
        pop2020: numberOrNull(feature.properties.pop_2020),
      },
    ]),
  );

  const serviceByCommune = new Map();
  for (const line of transport.lines) {
    for (const commune of line.communes) {
      const key = normalizeKey(commune);
      if (!serviceByCommune.has(key)) {
        serviceByCommune.set(key, { metro: new Set(), tramway: new Set(), bus: new Set() });
      }
      const bucket = serviceByCommune.get(key);
      if (bucket[line.mode]) bucket[line.mode].add(line.shortName);
    }
  }

  const communes = communesGeo.features
    .map((feature) => {
      const p = feature.properties;
      const services = serviceByCommune.get(normalizeKey(p.nom));
      return {
        name: cleanLabel(p.nom),
        codeInsee: p.code_insee,
        type: p.nature,
        population: numberOrNull(p.population),
        populationHistory: populationsByInsee.get(p.code_insee) ?? null,
        surfaceKm2: numberOrNull(p.surface_km2),
        densityPerKm2: numberOrNull(p.densite_pop_km2),
        territorialUnit: p.libelle_ut || null,
        governanceTerritory: p.libelle_territoire_gouvernance || null,
        servedBy: services
          ? {
              metro: [...services.metro].sort(routeNameSort),
              tramway: [...services.tramway].sort(routeNameSort),
              bus: [...services.bus].sort(routeNameSort),
            }
          : { metro: [], tramway: [], bus: [] },
        sourceIds: [sourceIds.melCommunes, sourceIds.melPopulations, sourceIds.ileviaGtfs],
      };
    })
    .sort((a, b) => localeSort(a.name, b.name));

  const quartiers = quartiersRaw
    .map((row) => ({
      name: cleanLabel(row.quartier),
      commune: cleanLabel(row.commune),
      postalCode: String(row.code_post),
      quartierCode: row.code_quar,
      centroid: parseGeoPoint(row.geo_point_2d),
      sourceIds: [sourceIds.lilleQuartiers],
    }))
    .sort((a, b) => localeSort(a.name, b.name));

  await writeJson(path.join(processedRoot, "geography", "mel-communes.json"), {
    generatedAt,
    sourceIds: [sourceIds.melCommunes, sourceIds.melPopulations, sourceIds.ileviaGtfs],
    communes,
  });
  await writeJson(path.join(processedRoot, "geography", "lille-quartiers.json"), {
    generatedAt,
    sourceIds: [sourceIds.lilleQuartiers],
    quartiers,
  });

  return { communes, quartiers };
}

async function buildLocalPlaces() {
  const [equipements, monuments, parcs, airesJeux, velos, rues] = await Promise.all([
    readJson(path.join(rawRoot, "data-gouv", "lille-equipements-publics.records.json")),
    readJson(path.join(rawRoot, "data-gouv", "lille-monuments-historiques.records.json")),
    readJson(path.join(rawRoot, "data-gouv", "lille-parcs-jardins.records.json")),
    readJson(path.join(rawRoot, "data-gouv", "lille-aires-jeux.records.json")),
    readJson(path.join(rawRoot, "data-gouv", "lille-stations-reparation-velo.records.json")),
    readJson(path.join(rawRoot, "data-gouv", "lille-troncons-rue.records.json")),
  ]);

  const items = [];

  for (const row of equipements) {
    items.push(placeItem({
      id: `equipement-${row.__id}`,
      label: cleanLabel(row.lib_equipement_complet || row.lib_equipement_court),
      shortLabel: cleanLabel(row.lib_equipement_court || row.lib_equipement_complet),
      type: "equipement-public",
      category: cleanLabel(row.rubrique),
      subcategory: cleanLabel(row.theme || row.type || row.poste),
      commune: cleanLabel(row.commune),
      quartier: cleanLabel(row.quartier),
      address: cleanLabel(row.adresse),
      latitude: numberOrNull(row.latitude),
      longitude: numberOrNull(row.longitude),
      sourceIds: [sourceIds.lilleEquipements],
    }));
  }

  for (const row of monuments) {
    items.push(placeItem({
      id: `monument-${row.reference_mh || row.__id}`,
      label: cleanLabel(row.edifice || row.denomination),
      shortLabel: cleanLabel(row.edifice || row.denomination),
      type: "monument-historique",
      category: cleanLabel(row.type_protection),
      subcategory: cleanLabel(row.denomination),
      commune: cleanLabel(row.commune),
      quartier: cleanLabel(row.quartier),
      address: cleanLabel(row.adresse),
      latitude: numberOrNull(row.latitude),
      longitude: numberOrNull(row.longitude),
      sourceIds: [sourceIds.lilleMonuments],
      facts: compact([
        row.reference_mh ? `Reference MH ${row.reference_mh}` : null,
        row.date_protection ? `Protection ${row.date_protection}` : null,
        row.datation_bati_lmcu ? `Datation MEL ${row.datation_bati_lmcu}` : null,
      ]),
    }));
  }

  for (const row of parcs) {
    const point = parseGeoPoint(row.geo_point_2d);
    items.push(placeItem({
      id: `parc-${row.id || row.__id}`,
      label: cleanLabel(row.nom),
      shortLabel: cleanLabel(row.nom_liste || row.nom),
      type: "parc-jardin",
      category: cleanLabel(row.type_nev),
      subcategory: cleanLabel(row.sous_type),
      commune: "Lille",
      quartier: cleanLabel(row.quartier),
      address: cleanLabel(row.adresse),
      latitude: point?.latitude ?? null,
      longitude: point?.longitude ?? null,
      sourceIds: [sourceIds.lilleParcs],
      facts: compact([row.surface ? `Surface ${Math.round(Number(row.surface))} m2` : null]),
    }));
  }

  for (const row of airesJeux) {
    const point = parseGeoPoint(row.geo_point_2d || row.coord_geo);
    items.push(placeItem({
      id: `aire-jeux-${row.__id}`,
      label: cleanLabel(row.nom || row.nom_aire_jeux || row.libelle),
      shortLabel: cleanLabel(row.nom || row.nom_aire_jeux || row.libelle),
      type: "aire-jeux",
      category: "Aire de jeux",
      subcategory: cleanLabel(row.type || row.sous_type),
      commune: cleanLabel(row.commune) || "Lille",
      quartier: cleanLabel(row.quartier),
      address: cleanLabel(row.adresse),
      latitude: numberOrNull(row.latitude) ?? point?.latitude ?? null,
      longitude: numberOrNull(row.longitude) ?? point?.longitude ?? null,
      sourceIds: [sourceIds.lilleAiresJeux],
    }));
  }

  for (const row of velos) {
    const point = parseGeoPoint(row.geo_point_2d || row.coord_geo);
    items.push(placeItem({
      id: `velo-${row.__id}`,
      label: cleanLabel(row.nom || row.libelle || row.adresse),
      shortLabel: cleanLabel(row.nom || row.libelle || row.adresse),
      type: "station-reparation-velo",
      category: "Velo",
      subcategory: cleanLabel(row.type),
      commune: cleanLabel(row.commune) || "Lille",
      quartier: cleanLabel(row.quartier),
      address: cleanLabel(row.adresse),
      latitude: numberOrNull(row.latitude) ?? point?.latitude ?? null,
      longitude: numberOrNull(row.longitude) ?? point?.longitude ?? null,
      sourceIds: [sourceIds.lilleVelos],
    }));
  }

  const streetNames = [...new Set(rues.map((row) => cleanLabel(row.nom_rue || row.libelle)).filter(Boolean))]
    .sort(localeSort)
    .map((label, index) => ({
      id: `rue-${slugify(label)}-${index + 1}`,
      label,
      type: "rue",
      sourceIds: [sourceIds.lilleRues],
      editorialStatus: "reference",
    }));

  const usableItems = items.map((item) => ({
    ...item,
    editorialStatus: item.riskFlags.includes("religious-reference") ? "avoid" : "candidate",
  }));

  await writeJson(path.join(processedRoot, "geography", "lille-local-places.json"), {
    generatedAt,
    description:
      "Lieux locaux normalises depuis les jeux Ville de Lille. Les items a risque religieux sont marques avoid pour ne pas alimenter automatiquement les jeux.",
    sourceIds: [
      sourceIds.lilleEquipements,
      sourceIds.lilleMonuments,
      sourceIds.lilleParcs,
      sourceIds.lilleAiresJeux,
      sourceIds.lilleVelos,
    ],
    items: usableItems.sort((a, b) => localeSort(a.label, b.label)),
  });
  await writeJson(path.join(processedRoot, "geography", "lille-street-names.json"), {
    generatedAt,
    sourceIds: [sourceIds.lilleRues],
    streets: streetNames,
  });

  return { items: usableItems, streets: streetNames };
}

function buildCandidateItems({ transport, geography, localPlaces, regionalWordSeeds }) {
  const items = [];

  for (const line of transport.lines) {
    for (const direction of line.directions.slice(0, 1)) {
      for (const stop of direction.stops) {
        items.push(candidateItem({
          label: stop.name,
          type: `${line.mode}-stop`,
          zone: stop.commune,
          themes: ["transport", line.mode, `ligne-${slugify(line.shortName)}`],
          sourceIds: line.sourceIds,
          fact: `${stop.name} est desservi par ${line.longName}.`,
          riskText: stop.name,
        }));
      }
    }
  }

  for (const commune of geography.communes) {
    const modes = Object.entries(commune.servedBy)
      .filter(([, routes]) => routes.length > 0)
      .map(([mode]) => mode);
    items.push(candidateItem({
      label: commune.name,
      type: "commune",
      zone: "MEL",
      themes: compact(["commune", "mel", ...modes]),
      sourceIds: commune.sourceIds,
      fact: `${commune.name} est une commune de la MEL.`,
      riskText: commune.name,
    }));
  }

  for (const quartier of geography.quartiers) {
    items.push(candidateItem({
      label: quartier.name,
      type: "quartier",
      zone: quartier.commune,
      themes: ["quartier", "lille"],
      sourceIds: quartier.sourceIds,
      fact: `${quartier.name} est reference dans le jeu de donnees des quartiers de Lille, Lomme et Hellemmes.`,
      riskText: quartier.name,
    }));
  }

  for (const place of localPlaces.items) {
    items.push(candidateItem({
      label: place.label,
      type: place.type,
      zone: place.quartier || place.commune,
      themes: compact([place.type, slugify(place.category), slugify(place.subcategory)]),
      sourceIds: place.sourceIds,
      fact: place.address ? `${place.label} est reference a l'adresse ${place.address}.` : `${place.label} est reference dans le corpus local.`,
      riskText: [place.label, place.category, place.subcategory].join(" "),
      forcedStatus: place.editorialStatus === "avoid" ? "avoid" : undefined,
    }));
  }

  for (const word of regionalWordSeeds.items) {
    items.push(candidateItem({
      label: word.label,
      type: "regional-word",
      zone: "Nord",
      themes: word.themes,
      sourceIds: word.sourceIds,
      fact: word.definition,
      riskText: word.label,
      forcedStatus: word.validation === "exclude" ? "avoid" : "needs-review",
    }));
  }

  return {
    generatedAt,
    description:
      "Reserve d'items bruts pour Lille-Mele et Le mot a Biloute. Les textes sont des faits courts ou des reformulations originales, pas des extraits de sources.",
    items: dedupeBy(items, (item) => `${normalizeKey(item.type)}:${normalizeKey(item.label)}`).sort((a, b) =>
      localeSort(`${a.type} ${a.label}`, `${b.type} ${b.label}`),
    ),
  };
}

function buildCandidateFamilies({ transport, geography, localPlaces }) {
  const families = [];

  for (const line of [...transport.metroLines, ...transport.tramLines]) {
    const direction = line.directions[0];
    if (!direction) continue;
    for (const [index, chunk] of chunks(direction.stops, 4).entries()) {
      if (chunk.length !== 4) continue;
      families.push(family({
        title: `${line.longName} - sequence ${index + 1}`,
        items: chunk.map((stop) => stop.name),
        difficulty: line.mode === "metro" ? "easy" : "medium",
        logic: `Quatre arrets consecutifs ou proches dans ${line.longName}.`,
        themes: ["transport", line.mode],
        sourceIds: line.sourceIds,
      }));
    }
  }

  for (const line of transport.busLines.filter((line) => /^L\d/.test(line.shortName)).slice(0, 14)) {
    const direction = line.directions[0];
    if (!direction) continue;
    const chunk = direction.stops.slice(0, 4);
    if (chunk.length === 4) {
      families.push(family({
        title: `${line.longName} - premiers arrets`,
        items: chunk.map((stop) => stop.name),
        difficulty: "hard",
        logic: `Quatre arrets de la meme liane Ilévia.`,
        themes: ["transport", "bus", "liane"],
        sourceIds: line.sourceIds,
      }));
    }
  }

  const communesByTerritory = groupBy(geography.communes, (commune) => commune.governanceTerritory || "Autres territoires");
  for (const [territory, communes] of communesByTerritory) {
    for (const chunk of chunks(communes, 4).slice(0, 2)) {
      if (chunk.length === 4) {
        families.push(family({
          title: territory,
          items: chunk.map((commune) => commune.name),
          difficulty: "medium",
          logic: "Quatre communes rattachees au meme territoire de gouvernance MEL.",
          themes: ["communes", "mel"],
          sourceIds: [sourceIds.melCommunes],
        }));
      }
    }
  }

  const metroCommunes = geography.communes.filter((commune) => commune.servedBy.metro.length > 0);
  for (const chunk of chunks(metroCommunes, 4)) {
    if (chunk.length === 4) {
      families.push(family({
        title: "Communes desservies par le metro",
        items: chunk.map((commune) => commune.name),
        difficulty: "medium",
        logic: "Quatre communes avec au moins un arret de metro dans le GTFS Ilévia.",
        themes: ["communes", "metro"],
        sourceIds: [sourceIds.melCommunes, sourceIds.ileviaGtfs],
      }));
    }
  }

  for (const chunk of chunks(geography.quartiers, 4)) {
    if (chunk.length === 4) {
      families.push(family({
        title: "Quartiers de Lille, Lomme ou Hellemmes",
        items: chunk.map((quartier) => quartier.name),
        difficulty: "easy",
        logic: "Quatre quartiers issus du jeu de donnees officiel des limites de quartiers.",
        themes: ["quartiers", "lille"],
        sourceIds: [sourceIds.lilleQuartiers],
      }));
    }
  }

  for (const [type, places] of groupBy(
    localPlaces.items.filter((item) => item.editorialStatus !== "avoid"),
    (item) => item.type,
  )) {
    const cleanPlaces = places.filter((place) => place.label && place.label.length <= 40);
    for (const chunk of chunks(cleanPlaces, 4).slice(0, 5)) {
      if (chunk.length === 4) {
        families.push(family({
          title: titleCase(type.replaceAll("-", " ")),
          items: chunk.map((place) => place.label),
          difficulty: type.includes("monument") ? "hard" : "medium",
          logic: `Quatre items du type ${type}, issus des donnees publiques locales.`,
          themes: [type],
          sourceIds: [...new Set(chunk.flatMap((place) => place.sourceIds))],
        }));
      }
    }
  }

  return {
    generatedAt,
    description:
      "Familles candidates pour Lille-Mele. Elles restent a relire editorialement, mais leurs associations sont derivees de donnees structurees.",
    families: dedupeBy(
      families.filter((item) => item.validation !== "avoid"),
      (item) => item.items.join("|"),
    ).slice(0, 120),
  };
}

function buildRegionalWordSeeds() {
  const refs = {
    vocabulaire: [
      sourceIds.nordEscapadeDictionnaire,
      sourceIds.comptoirFlandresDictionnaire,
      sourceIds.regionalWords,
    ],
    gastronomie: [
      sourceIds.banqueChtimiGastronomie,
      sourceIds.comptoirFlandresDictionnaire,
      sourceIds.regionalWords,
    ],
    biere: [
      sourceIds.banqueChtimiGastronomie,
      sourceIds.comptoirFlandresBieres,
      sourceIds.regionalWords,
    ],
    lille: [
      sourceIds.banqueChtimiGastronomie,
      sourceIds.comptoirFlandresDictionnaire,
      sourceIds.regionalWords,
    ],
  };
  const allSourceIds = [...new Set(Object.values(refs).flat())];
  const items = [
    ["biloute", "Biloute", "Mot affectueux du parler populaire du Nord.", ["vocabulaire", "parler-regional"], refs.vocabulaire],
    ["drache", "Drache", "Grosse pluie, souvent employee pour une averse bien marquee.", ["meteo", "parler-regional"], refs.vocabulaire],
    ["chicon", "Chicon", "Nom regional courant de l'endive.", ["gastronomie", "legume"], refs.gastronomie],
    ["quinquin", "Quinquin", "Petit enfant dans le parler regional.", ["famille", "parler-regional"], refs.vocabulaire],
    ["ducasse", "Ducasse", "Fete populaire locale, souvent associee aux maneges.", ["tradition", "fete"], refs.vocabulaire],
    ["baraque", "Baraque", "Stand ou petite installation de vente, frequent dans le vocabulaire de fete ou de marche.", ["quotidien", "marche"], refs.vocabulaire],
    ["braderie", "Braderie", "Grande vente populaire, particulierement associee a Lille.", ["lille", "evenement"], refs.lille],
    ["estaminet", "Estaminet", "Cafe ou lieu convivial traditionnel du Nord et de Flandre.", ["sortie", "tradition"], refs.gastronomie],
    ["welsh", "Welsh", "Plat de brasserie tres present dans le Nord, a base de fromage fondu.", ["gastronomie", "plat"], refs.gastronomie],
    ["carbonnade", "Carbonnade", "Plat mijote au boeuf, souvent associe aux tables du Nord.", ["gastronomie", "plat"], refs.gastronomie],
    ["potjevleesch", "Potjevleesch", "Specialite froide en gelee, typique de la tradition flamande regionale.", ["gastronomie", "plat"], refs.gastronomie],
    ["merveilleux", "Merveilleux", "Dessert a base de meringue et de creme, tres associe au Nord.", ["gastronomie", "dessert"], refs.gastronomie],
    ["maroilles", "Maroilles", "Fromage du Nord au caractere bien identifiable.", ["gastronomie", "fromage"], refs.gastronomie],
    ["genievre", "Genièvre", "Eau-de-vie traditionnelle du Nord.", ["gastronomie", "boisson"], refs.gastronomie],
    ["cassonade", "Cassonade", "Sucre roux utilise dans plusieurs douceurs regionales.", ["gastronomie", "sucre"], refs.gastronomie],
    ["speculoos", "Speculoos", "Biscuit epice tres present dans le Nord et la Belgique voisine.", ["gastronomie", "dessert"], refs.gastronomie],
    ["babelutte", "Babelutte", "Confiserie dure au caramel connue dans le Nord.", ["gastronomie", "confiserie"], refs.gastronomie],
    ["flamiche", "Flamiche", "Tarte salee regionale, souvent associee au poireau ou au fromage.", ["gastronomie", "plat"], refs.gastronomie],
    ["waterzoi", "Waterzoï", "Plat flamand mijote, souvent au poisson ou a la volaille.", ["gastronomie", "plat"], refs.gastronomie],
    ["houblon", "Houblon", "Plante associee aux traditions brassicoles du Nord.", ["gastronomie", "biere"], refs.biere],
    ["brassin", "Brassin", "Cuvee ou production de biere, utile pour un angle brassicole non marque.", ["gastronomie", "biere"], refs.biere],
    ["carnaval", "Carnaval", "Fete populaire majeure dans plusieurs villes du Nord.", ["tradition", "fete"], refs.vocabulaire],
    ["beffroi", "Beffroi", "Tour civile emblematique de nombreuses villes du Nord.", ["patrimoine", "architecture"], refs.lille],
    ["friterie", "Friterie", "Lieu de restauration populaire autour des frites.", ["gastronomie", "quotidien"], refs.gastronomie],
    ["acater", "Acater", "Acheter, dans une forme regionale courte et directe.", ["vocabulaire", "quotidien"], refs.vocabulaire],
    ["ade", "Adé", "Formule de depart ou d'au revoir.", ["vocabulaire", "salutation"], refs.vocabulaire],
    ["aheure", "Aheuré", "Se dit de quelqu'un qui arrive a l'heure.", ["vocabulaire", "quotidien"], refs.vocabulaire],
    ["amiteux", "Amiteux", "Qualifie une attitude amicale ou adoucie.", ["vocabulaire", "caractere"], refs.vocabulaire],
    ["arluquer", "Arluquer", "Regarder avec insistance ou curiosite.", ["vocabulaire", "quotidien"], refs.vocabulaire],
    ["arniquer", "Arniquer", "S'habiller ou se mettre en tenue.", ["vocabulaire", "quotidien"], refs.vocabulaire],
    ["arprindre", "Arprindre", "Reprendre quelque chose, souvent dans une tournure familiere.", ["vocabulaire", "quotidien"], refs.vocabulaire],
    ["arvoyure", "Arvoyure", "Idée de revoir quelqu'un plus tard.", ["vocabulaire", "salutation"], refs.vocabulaire],
    ["badoule", "Badoule", "Personne un peu extravagante ou qui part dans tous les sens.", ["vocabulaire", "caractere"], refs.vocabulaire],
    ["bidoule", "Bidoule", "Boue ou salissure qui colle aux chaussures.", ["vocabulaire", "quotidien"], refs.vocabulaire],
    ["bistoule", "Bistoule", "Cafe allonge d'un trait d'alcool fort.", ["gastronomie", "boisson"], refs.gastronomie],
    ["bouque", "Bouque", "Bouche dans le parler regional.", ["vocabulaire", "corps"], refs.vocabulaire],
    ["braire", "Braire", "Pleurer dans le vocabulaire populaire regional.", ["vocabulaire", "emotion"], refs.vocabulaire],
    ["branque", "Branque", "Branche dans une forme regionale.", ["vocabulaire", "quotidien"], refs.vocabulaire],
    ["buquer", "Buquer", "Frapper ou toquer a une porte.", ["vocabulaire", "quotidien"], refs.vocabulaire],
    ["cafouiller", "Cafouiller", "Se melanger ou fouiller sans ordre.", ["vocabulaire", "quotidien"], refs.vocabulaire],
    ["camuche", "Camuche", "Cachette ou endroit ou l'on dissimule quelque chose.", ["vocabulaire", "quotidien"], refs.vocabulaire],
    ["canchon", "Canchon", "Chanson dans une prononciation regionale.", ["vocabulaire", "musique"], refs.vocabulaire],
    ["carette", "Carette", "Voiture dans le parler populaire.", ["vocabulaire", "mobilite"], refs.vocabulaire],
    ["catouilles", "Catouilles", "Chatouilles dans une forme regionale.", ["vocabulaire", "quotidien"], refs.vocabulaire],
    ["caudron", "Caudron", "Chaudron, souvent associe a la cuisine familiale.", ["vocabulaire", "objet"], refs.vocabulaire],
    ["caveux", "Caveux", "Cheveux dans le parler regional.", ["vocabulaire", "corps"], refs.vocabulaire],
    ["cayelle", "Cayelle", "Chaise dans le vocabulaire regional.", ["vocabulaire", "objet"], refs.vocabulaire],
    ["chuc", "Chuc", "Sucre dans le parler regional.", ["gastronomie", "sucre"], refs.gastronomie],
    ["clinche", "Clinche", "Poignee de porte dans le parler regional.", ["vocabulaire", "objet"], refs.vocabulaire],
    ["couque", "Couque", "Gateau ou brioche selon les usages locaux.", ["gastronomie", "dessert"], refs.gastronomie],
    ["cumulet", "Cumulet", "Pirouette ou roulade.", ["vocabulaire", "jeu"], refs.vocabulaire],
    ["dache", "Dache", "Petit clou de chaussure dans le vocabulaire regional.", ["vocabulaire", "objet"], refs.vocabulaire],
    ["demucher", "Démucher", "Faire sortir de la cachette ou retrouver ce qui etait cache.", ["vocabulaire", "quotidien"], refs.vocabulaire],
    ["detouiller", "Détouiller", "Denouer ou defaire ce qui est emmêle.", ["vocabulaire", "quotidien"], refs.vocabulaire],
    ["esquinter", "Esquinter", "Abimer ou fatiguer fortement.", ["vocabulaire", "quotidien"], refs.vocabulaire],
    ["faime", "Faime", "Femme dans une forme regionale.", ["vocabulaire", "quotidien"], refs.vocabulaire],
    ["ferale", "Férale", "Ferraille dans le parler regional.", ["vocabulaire", "objet"], refs.vocabulaire],
    ["fouffe", "Fouffe", "Vieux vetement, chiffon ou objet sans grande valeur.", ["vocabulaire", "objet"], refs.vocabulaire],
    ["fraique", "Fraique", "Mouille ou humide.", ["meteo", "quotidien"], refs.vocabulaire],
    ["galafe", "Galafe", "Personne qui mange beaucoup.", ["gastronomie", "caractere"], refs.gastronomie],
    ["gambe", "Gambe", "Jambe dans le parler regional.", ["vocabulaire", "corps"], refs.vocabulaire],
    ["gambon", "Gambon", "Jambon dans le vocabulaire regional.", ["gastronomie", "aliment"], refs.gastronomie],
    ["gardin", "Gardin", "Jardin dans une forme regionale.", ["vocabulaire", "quotidien"], refs.vocabulaire],
    ["gatiau", "Gatiau", "Gateau dans le parler regional.", ["gastronomie", "dessert"], refs.gastronomie],
    ["gins", "Gins", "Gens dans le parler regional.", ["vocabulaire", "quotidien"], refs.vocabulaire],
    ["gobe", "Gobe", "Tasse ou bol pour boire.", ["vocabulaire", "objet"], refs.vocabulaire],
    ["gramint", "Gramint", "Beaucoup, en parler regional.", ["vocabulaire", "quantite"], refs.vocabulaire],
    ["greine", "Greine", "Grimace ou mine boudeuse.", ["vocabulaire", "expression"], refs.vocabulaire],
    ["guiffe", "Guiffe", "Bouche dans un registre familier.", ["vocabulaire", "corps"], refs.vocabulaire],
    ["jatte", "Jatte", "Verre, bol ou tasse selon l'usage.", ["vocabulaire", "objet"], refs.vocabulaire],
    ["liquette", "Liquette", "Petit morceau, souvent pour parler d'une portion.", ["gastronomie", "quantite"], refs.gastronomie],
    ["longin", "Longin", "Personne lente ou peu pressee.", ["vocabulaire", "caractere"], refs.vocabulaire],
    ["mafler", "Mafler", "Fatiguer ou user quelqu'un.", ["vocabulaire", "quotidien"], refs.vocabulaire],
    ["malaju", "Malaju", "De mauvais poil ou mal dispose.", ["vocabulaire", "humeur"], refs.vocabulaire],
    ["maronne", "Maronne", "Pantalon ou culotte dans le parler regional.", ["vocabulaire", "vetement"], refs.vocabulaire],
    ["martiau", "Martiau", "Marteau dans le parler regional.", ["vocabulaire", "objet"], refs.vocabulaire],
    ["mason", "Mason", "Maison dans une forme regionale.", ["vocabulaire", "quotidien"], refs.vocabulaire],
    ["mecant", "Mécant", "Mechant dans une prononciation regionale.", ["vocabulaire", "caractere"], refs.vocabulaire],
    ["minger", "Minger", "Manger dans le parler regional.", ["gastronomie", "quotidien"], refs.gastronomie],
    ["mitan", "Mitan", "Milieu ou centre.", ["vocabulaire", "position"], refs.vocabulaire],
    ["mouque", "Mouque", "Mouche dans le parler regional.", ["vocabulaire", "quotidien"], refs.vocabulaire],
    ["muche", "Muche", "Cachette ou chose cachee.", ["vocabulaire", "quotidien"], refs.vocabulaire],
    ["nactieux", "Nactieux", "Meticuleux au point de devenir maniaque.", ["vocabulaire", "caractere"], refs.vocabulaire],
    ["ortiaux", "Ortiaux", "Orteils dans le parler regional.", ["vocabulaire", "corps"], refs.vocabulaire],
    ["panche", "Panche", "Ventre dans le parler regional.", ["vocabulaire", "corps"], refs.vocabulaire],
    ["hochepot", "Hochepot", "Pot-au-feu regional servi dans le Nord.", ["gastronomie", "plat"], refs.gastronomie],
    ["rata", "Rata", "Ragout ou plat simple du quotidien.", ["gastronomie", "plat"], refs.gastronomie],
    ["fricot", "Fricot", "Plat cuisine simplement, souvent dans l'esprit du repas de tous les jours.", ["gastronomie", "plat"], refs.gastronomie],
    ["frichti", "Frichti", "Repas vite prepare ou petit plat sans ceremonie.", ["gastronomie", "quotidien"], refs.gastronomie],
    ["raton", "Raton", "Crepe a la levure dans la tradition culinaire regionale.", ["gastronomie", "dessert"], refs.gastronomie],
    ["libouli", "Libouli", "Creme patissiere dans le vocabulaire culinaire regional.", ["gastronomie", "dessert"], refs.gastronomie],
    ["crama", "Crama", "Creme brulee dans le vocabulaire culinaire regional.", ["gastronomie", "dessert"], refs.gastronomie],
    ["touquette", "Touquette", "Morceau de pain trempe dans la soupe ou mouillette.", ["gastronomie", "pain"], refs.gastronomie],
    ["chicoree", "Chicorée", "Plante torrefiee et boisson tres associee aux habitudes du Nord.", ["gastronomie", "boisson"], refs.gastronomie],
    ["cafiot", "Cafiot", "Cafe leger dans le vocabulaire regional.", ["gastronomie", "boisson"], refs.gastronomie],
    ["marabou", "Marabou", "Cafetiere dans le vocabulaire regional.", ["gastronomie", "objet"], refs.gastronomie],
    ["chirloute", "Chirloute", "Chicoree dans le parler regional.", ["gastronomie", "boisson"], refs.gastronomie],
    ["galopin", "Galopin", "Petit verre de biere.", ["gastronomie", "biere"], refs.biere],
    ["triboulette", "Triboulette", "Grande bouteille ou contenant lie a la biere.", ["gastronomie", "biere"], refs.biere],
    ["godale", "Godale", "Biere dans le vocabulaire regional.", ["gastronomie", "biere"], refs.biere],
    ["broquin", "Broquin", "Ancien terme lie a un impot sur la biere.", ["gastronomie", "biere"], refs.biere],
    ["betises", "Bêtises", "Confiseries associees a Cambrai et au Nord.", ["gastronomie", "confiserie"], refs.gastronomie],
    ["chuques", "Chuques", "Bonbons du Nord dans le vocabulaire regional.", ["gastronomie", "confiserie"], refs.gastronomie],
  ].map(([id, label, definition, themes, itemSourceIds]) => ({
    id,
    label,
    answer: normalizeAnswer(label),
    definition,
    themes,
    validation: "needs-review",
    sourceIds: itemSourceIds,
    notes:
      "Definition reformulee. Verifier l'orthographe et l'usage avant integration dans words.json.",
  }));

  return {
    generatedAt,
    description:
      "Graines de vocabulaire regional et gastronomique. Elles indexent les sources web fournies sans recopier leurs textes.",
    sourceIds: allSourceIds,
    items,
  };
}

function collectTripPatterns(stopTimesText, tripsById) {
  const buckets = new Map();
  const lines = stopTimesText.split(/\r?\n/);
  const headers = parseCsvRecord(lines[0]);
  const indexes = Object.fromEntries(headers.map((header, index) => [header, index]));
  let currentTripId = null;
  let currentStops = [];

  for (let i = 1; i < lines.length; i += 1) {
    if (!lines[i]) continue;
    const row = parseCsvRecord(lines[i]);
    const tripId = row[indexes.trip_id];
    if (currentTripId && tripId !== currentTripId) {
      addTripPattern(currentTripId, currentStops);
      currentStops = [];
    }
    currentTripId = tripId;
    currentStops.push({
      stopId: row[indexes.stop_id],
      sequence: Number(row[indexes.stop_sequence]),
    });
  }
  if (currentTripId) addTripPattern(currentTripId, currentStops);

  function addTripPattern(tripId, stopEntries) {
    const trip = tripsById.get(tripId);
    if (!trip || stopEntries.length === 0) return;
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

function placeItem(item) {
  const riskFlags = [];
  const riskText = [item.label, item.shortLabel, item.category, item.subcategory, item.address].join(" ");
  if (religiousPattern.test(normalizeForRisk(riskText))) riskFlags.push("religious-reference");
  return {
    ...item,
    label: item.label || item.shortLabel || item.id,
    shortLabel: item.shortLabel || item.label || item.id,
    riskFlags,
  };
}

function candidateItem({ label, type, zone, themes, sourceIds, fact, riskText, forcedStatus }) {
  const riskFlags = [];
  if (religiousPattern.test(normalizeForRisk(riskText || label))) riskFlags.push("religious-reference");
  return {
    id: `${type}-${slugify(label)}`,
    label,
    type,
    zone: zone || null,
    themes: [...new Set(themes.filter(Boolean).map(slugify))],
    sourceIds,
    verifiedFact: fact,
    ambiguityRisk: riskFlags.length ? "high" : "low",
    riskFlags,
    editorialStatus: forcedStatus || (riskFlags.length ? "avoid" : "candidate"),
  };
}

function family({ title, items, difficulty, logic, themes, sourceIds }) {
  const riskFlags = items.some((item) => religiousPattern.test(normalizeForRisk(item)))
    ? ["religious-reference"]
    : [];
  return {
    id: slugify(`${title}-${items.join("-")}`).slice(0, 96),
    title,
    items,
    difficulty,
    logic,
    falseFriend: null,
    themes: [...new Set(themes.map(slugify))],
    sourceIds,
    riskFlags,
    validation: riskFlags.length ? "avoid" : "to-review",
  };
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

function parseGeoPoint(value) {
  if (!value || typeof value !== "string") return null;
  const [latitude, longitude] = value.split(",").map((part) => Number(part.trim()));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
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

function normalizeForRisk(value) {
  return ` ${normalizeKey(value)} `;
}

function normalizeAnswer(value) {
  return String(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Za-z-]/g, "")
    .toUpperCase();
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

function routeNameSort(a, b) {
  return routeSortToken(a).localeCompare(routeSortToken(b), "fr", { numeric: true });
}

function routeSortKey(route) {
  return `${route.routeType.toString().padStart(2, "0")}-${routeSortToken(route.shortName)}`;
}

function routeSortToken(value) {
  return String(value).replace(/^M(\d+)$/, "M$1").replace(/^L(\d+)$/, "L$1");
}

function increment(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function topEntries(map, limit) {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || localeSort(a[0], b[0])).slice(0, limit);
}

function groupBy(items, getKey) {
  const grouped = new Map();
  for (const item of items) {
    const key = getKey(item);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  }
  return grouped;
}

function chunks(items, size) {
  const result = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
}

function dedupeBy(items, getKey) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}
