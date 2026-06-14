import { escapeHtml } from "./text-render.js";

export function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  let html = "";
  let listOpen = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      if (listOpen) {
        html += "</ul>";
        listOpen = false;
      }
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      if (listOpen) {
        html += "</ul>";
        listOpen = false;
      }
      const level = heading[1].length;
      html += `<h${level}>${renderInline(heading[2])}</h${level}>`;
      continue;
    }

    if (line.startsWith("- ")) {
      if (!listOpen) {
        html += "<ul>";
        listOpen = true;
      }
      html += `<li>${renderInline(line.slice(2))}</li>`;
      continue;
    }

    if (listOpen) {
      html += "</ul>";
      listOpen = false;
    }
    html += `<p>${renderInline(line)}</p>`;
  }

  if (listOpen) html += "</ul>";
  return html;
}

function renderInline(text) {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

