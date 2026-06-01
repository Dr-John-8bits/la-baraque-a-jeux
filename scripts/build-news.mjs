import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const entriesDir = "docs/blog/entries";
const outputFile = "docs/blog/NEWS.md";
const isCheck = process.argv.includes("--check");

const header = `# Blog

Les nouveautés de La baraque à jeux, du portail et des jeux.
`;

const generated = await buildNews();

if (isCheck) {
  const current = await readFile(outputFile, "utf8");
  if (current !== generated) {
    console.error(`${outputFile} n'est pas synchronise. Lancez npm run build:blog.`);
    process.exitCode = 1;
  } else {
    console.log("Blog synchronise.");
  }
} else {
  await writeFile(outputFile, generated);
  console.log(`${outputFile} mis a jour.`);
}

async function buildNews() {
  await mkdir(entriesDir, { recursive: true });
  const files = (await readdir(entriesDir))
    .filter((file) => file.endsWith(".md"))
    .sort((a, b) => b.localeCompare(a, "fr"));

  const entries = [];
  for (const file of files) {
    const content = (await readFile(path.join(entriesDir, file), "utf8")).trim();
    if (!content.startsWith("## ")) {
      throw new Error(`${path.join(entriesDir, file)} doit commencer par un titre de niveau 2.`);
    }
    entries.push(content);
  }

  return `${header}\n${entries.join("\n\n")}\n`;
}
