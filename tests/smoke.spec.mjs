import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

const base = process.env.LABAJ_BASE_URL || "http://127.0.0.1:48391/";

function buildWrongSelectionsAfterFirstGroup(puzzle) {
  return [
    [...puzzle.groups[1].items.slice(2, 4), ...puzzle.groups[2].items.slice(2, 4)],
    [...puzzle.groups[1].items.slice(0, 2), ...puzzle.groups[3].items.slice(0, 2)],
    [...puzzle.groups[2].items.slice(0, 2), ...puzzle.groups[3].items.slice(2, 4)],
  ];
}

async function submitLilleMeleSelection(page, items) {
  for (const item of items) {
    await page.getByRole("button", { name: item }).click();
  }
  await page.getByRole("button", { name: "Valider" }).click();
}

test("portail, blog et jeux chargent depuis le monorepo", async ({ page }) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(base);
  await expect(page).toHaveTitle("La baraque à jeux");
  await expect(page.getByRole("link", { name: "Le mot à Biloute", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Lille-Mêle", exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Ouvrir Biloute Bière Braderie", exact: true })
  ).toBeVisible();

  await page.goto(`${base}blog.html`);
  await expect(page.getByRole("heading", { name: "Blog", exact: true })).toBeVisible();
  await expect(page.getByText("Naissance de La Baraque à Jeux de Lille")).toBeVisible();
  await expect(page.getByText("Ce premier lancement marque le début de l'aventure.")).toBeVisible();

  await page.goto(`${base}apps/le-mot-a-biloute/`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await page.getByRole("button", { name: /Ch’ti coup d'pouce/ }).click();
  const wordState = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  expect(wordState.visibleHints.length).toBeGreaterThanOrEqual(1);

  await page.goto(`${base}apps/lille-mele/`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await page.getByRole("button", { name: "Sources" }).click();
  const sources = JSON.parse(await readFile("packages/corpus/sources.json", "utf8"));
  await expect(page.locator("#sourceList a")).toHaveCount(sources.length);

  const lilleState = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  const puzzles = JSON.parse(await readFile("packages/corpus/lille-mele/puzzles.json", "utf8"));
  const puzzle = puzzles.find((candidate) => candidate.id === lilleState.puzzle.id);
  expect(lilleState.dailyRollover.hour).toBe(12);
  expect(lilleState.dailyRollover.timeZone).toBe("Europe/Paris");
  expect(lilleState.puzzle.status).toBe("reviewed");
  const group = puzzle.groups[0];
  const nearMiss = [...group.items.slice(0, 3), puzzle.groups[1].items[0]];

  await submitLilleMeleSelection(page, nearMiss);
  await expect(page.locator("#message")).toContainText("Tout près");

  await submitLilleMeleSelection(page, group.items);
  const afterGroup = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  expect(afterGroup.foundGroups).toContain(group.id);

  for (const selection of buildWrongSelectionsAfterFirstGroup(puzzle)) {
    await submitLilleMeleSelection(page, selection);
  }

  await expect(page.locator("#message")).toContainText("Les réponses se dévoilent");
  await expect(page.locator("#foundGroups .found-group")).toHaveCount(0);
  await expect(page.locator("#board .reveal-group")).toHaveCount(4);
  await expect(page.getByRole("button", { name: "Rejouer la grille" })).toHaveCount(0);
  const afterLoss = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  expect(afterLoss.status).toBe("lost");
  expect(afterLoss.mistakes).toBe(afterLoss.mistakesMax);
  expect(afterLoss.revealedGroups).toHaveLength(4);
  expect(afterLoss.resultVisible).toBe(true);

  await page.goto(`${base}apps/biloute-biere-braderie/`);
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await page.getByRole("button", { name: "Lancer" }).click();
  await page.getByRole("button", { name: /Biloute bat Bière/ }).click();
  const bbbRevealState = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  if (bbbRevealState.phase === "revealing") {
    expect(bbbRevealState.reveal.pending.playerChoice).toBe("biloute");
    await page.evaluate(() => window.advanceTime(1600));
  }
  const bbbState = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  expect(bbbState.lastRound.playerChoice).toBe("biloute");
  expect(bbbState.score.player + bbbState.score.computer).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
