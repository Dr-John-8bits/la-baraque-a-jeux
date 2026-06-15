/*
 * Calepin partagé : un seul rendu de statistiques pour tous les jeux quotidiens.
 * Chaque jeu fournit ses propres données (métriques, historique, barres) ; le rendu
 * et les outils export/import sont communs → calepins cohérents d'un jeu à l'autre.
 * Style : packages/ui/calepin.css. Modèle d'origine : Le Mot à Biloute.
 */
import { escapeHtml } from "../game-utils/text-render.js";

// refs : { statsList, history, chart } (éléments DOM)
// config : { metrics:[{label,value}], historyLines:[string], perfBars:[{ratio,label,result,ariaLabel}], historyEmpty, perfEmpty }
export function renderCalepin(refs, config) {
  const { statsList, history, chart } = refs;
  const {
    metrics = [],
    historyLines = [],
    perfBars = [],
    historyEmpty = "Rien à noter pour l'instant.",
    perfEmpty = "Pas encore assez de parties.",
  } = config;

  if (statsList) {
    statsList.innerHTML = metrics
      .map((m) => `<div><dt>${escapeHtml(m.label)}</dt><dd>${escapeHtml(String(m.value))}</dd></div>`)
      .join("");
  }

  if (history) {
    history.innerHTML = "";
    if (!historyLines.length) {
      const li = document.createElement("li");
      li.textContent = historyEmpty;
      history.append(li);
    } else {
      historyLines.slice(0, 5).forEach((line) => {
        const li = document.createElement("li");
        li.textContent = line;
        history.append(li);
      });
    }
  }

  if (chart) {
    chart.innerHTML = "";
    if (!perfBars.length) {
      const empty = document.createElement("p");
      empty.className = "performance-empty";
      empty.textContent = perfEmpty;
      chart.append(empty);
      return;
    }
    perfBars.slice(-7).forEach((b) => {
      const bar = document.createElement("div");
      bar.className = `performance-bar is-${b.result || "won"}`;
      if (b.ariaLabel) bar.setAttribute("aria-label", b.ariaLabel);
      const fill = document.createElement("span");
      fill.style.height = `${Math.max(8, Math.min(1, b.ratio || 0) * 104)}px`;
      const label = document.createElement("span");
      label.textContent = b.label != null ? String(b.label) : "";
      bar.append(fill, label);
      chart.append(bar);
    });
  }
}

// Branche les boutons export / import (générique, même comportement partout).
export function setupCalepinTools(refs, config) {
  const { exportButton, importButton, importInput } = refs;
  const { statsKey, fileName = "calepin.json", gameName = "", sanitize, getStats, onImported } = config;

  exportButton?.addEventListener("click", () => {
    const stats = getStats ? getStats() : safeParse(localStorage.getItem(statsKey));
    const blob = new Blob(
      [JSON.stringify({ game: gameName, exportedAt: new Date().toISOString(), stats }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  });

  if (importButton && importInput) {
    importButton.addEventListener("click", () => importInput.click());
    importInput.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const payload = JSON.parse(await file.text());
        const raw = payload && payload.stats ? payload.stats : payload;
        const clean = sanitize ? sanitize(raw) : raw;
        if (clean && typeof clean === "object") {
          localStorage.setItem(statsKey, JSON.stringify(clean));
          onImported?.(clean);
        }
      } catch {
        // fichier invalide : on ignore
      } finally {
        importInput.value = "";
      }
    });
  }
}

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
