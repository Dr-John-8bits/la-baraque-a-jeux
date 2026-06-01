import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const roots = ["apps", "packages", "scripts", "tests"];
const files = ["playwright.config.mjs"];

for (const root of roots) {
  await collectJavaScript(root);
}

let failed = false;
for (const file of files.sort()) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) failed = true;
}

if (failed) {
  process.exitCode = 1;
}

async function collectJavaScript(dir) {
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectJavaScript(target);
    } else if (/\.(mjs|js)$/.test(entry.name)) {
      files.push(target);
    }
  }
}
