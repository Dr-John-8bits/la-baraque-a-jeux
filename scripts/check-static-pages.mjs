import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const errors = [];
const pages = [
  "index.html",
  "404.html",
  "blog.html",
  "apps/le-mot-a-biloute/index.html",
  "apps/lille-mele/index.html",
  "apps/biloute-biere-braderie/index.html",
  "apps/station-mystere/index.html",
];

for (const page of pages) {
  await validateHtml(page);
}

for (const file of [
  "docs/blog/NEWS.md",
  "packages/corpus/sources.json",
  "packages/corpus/le-mot-a-biloute/words.json",
  "packages/corpus/lille-mele/puzzles.json",
]) {
  await assertExists(file, file);
}

await validateFetches("apps/le-mot-a-biloute/app.js");
await validateFetches("apps/lille-mele/app.js");
await validateFetches("apps/station-mystere/app.js");

if (errors.length > 0) {
  console.error("Pages statiques invalides :");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Pages statiques valides.");
}

async function validateHtml(page) {
  const html = await readFile(page, "utf8");
  const attrs = html.matchAll(/\s(?:href|src|srcset)="([^"]+)"/g);
  for (const match of attrs) {
    const raw = match[1].split(/\s+/)[0];
    if (isExternal(raw) || raw.startsWith("#")) continue;
    const target = resolveReference(path.dirname(page), raw);
    await assertExists(target, `${page} -> ${raw}`);
  }
}

async function validateFetches(file) {
  const source = await readFile(file, "utf8");
  const refs = source.matchAll(/fetchJson\("([^"]+)"\)/g);
  for (const match of refs) {
    const target = resolveReference(path.dirname(file), match[1]);
    await assertExists(target, `${file} -> ${match[1]}`);
  }
}

function resolveReference(fromDir, reference) {
  const withoutHash = reference.split("#")[0];
  const normalized = path.normalize(path.join(fromDir, withoutHash));
  if (reference.endsWith("/")) return path.join(normalized, "index.html");
  return normalized;
}

function isExternal(reference) {
  return /^(https?:|mailto:|tel:|data:)/.test(reference);
}

async function assertExists(file, label) {
  try {
    await access(path.join(root, file));
  } catch {
    errors.push(`${label} est introuvable.`);
  }
}
