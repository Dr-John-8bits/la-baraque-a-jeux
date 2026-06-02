import { fetchJson } from "../../packages/game-utils/fetch-json.js";

const els = {
  sourceList: document.querySelector("#sourceList"),
  sourceCount: document.querySelector("#sourceCount"),
};

const [sources, puzzles] = await Promise.all([
  fetchJson("../../packages/corpus/sources.json"),
  fetchJson("../../packages/corpus/lille-mele/puzzles.json"),
]);

const usedSourceIds = new Set();
puzzles.forEach((puzzle) => {
  (puzzle.sourceIds || []).forEach((sourceId) => usedSourceIds.add(sourceId));
  (puzzle.groups || []).forEach((group) => {
    (group.sourceIds || []).forEach((sourceId) => usedSourceIds.add(sourceId));
  });
});

const gameSources = sources
  .filter((source) => usedSourceIds.has(source.id))
  .sort((left, right) => left.label.localeCompare(right.label, "fr"));

renderSources(gameSources);

function renderSources(items) {
  els.sourceList.innerHTML = "";
  els.sourceCount.textContent = `${items.length} sources reliées aux grilles actuelles.`;

  items.forEach((source) => {
    const item = document.createElement("li");
    const title = source.url ? document.createElement("a") : document.createElement("span");
    const meta = document.createElement("p");

    item.className = "source-card";
    title.textContent = source.label;
    if (source.url) {
      title.href = source.url;
      title.rel = "noreferrer";
    }
    meta.className = "source-meta";
    meta.textContent = [
      source.publisher,
      source.license,
      source.consultedAt ? `consultée le ${source.consultedAt}` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    item.append(title, meta);
    els.sourceList.appendChild(item);
  });
}

window.render_about_to_text = () =>
  JSON.stringify({
    sourceCount: gameSources.length,
    sourceIds: gameSources.map((source) => source.id),
  });
