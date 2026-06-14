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
    if (message.type() === "error") errors.push(`${page.url()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`${page.url()}: ${error.message}`));

  await page.goto(base);
  await expect(page).toHaveTitle("La baraque à jeux");
  await expect(page.getByRole("link", { name: "Accueil", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Blog", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "À propos", exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Ouvrir Le mot à Biloute", exact: true })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Ouvrir Lille-Mêle", exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Ouvrir Biloute Bière Braderie", exact: true })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Ouvrir Station Mystère", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "À propos", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "À propos", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Fermer", exact: true }).click();

  await page.goto(`${base}blog.html`);
  await expect(page.getByRole("heading", { name: "Blog", exact: true })).toBeVisible();
  await expect(page.getByText("Station Mystère entre en construction")).toBeVisible();
  await expect(page.getByText("Naissance de La Baraque à Jeux de Lille")).toBeVisible();
  await expect(page.getByText("Ce premier lancement marque le début de l'aventure.")).toBeVisible();

  await page.evaluate(() => localStorage.clear());
  await page.goto(`${base}apps/le-mot-a-biloute/`);
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await page.getByRole("button", { name: /Ch’ti coup d'pouce/ }).click();
  const wordState = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  expect(wordState.visibleHints.length).toBeGreaterThanOrEqual(1);

  await page.evaluate(() => localStorage.clear());
  await page.goto(`${base}apps/lille-mele/`);
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await expect(page.getByRole("button", { name: "Sources" })).toHaveCount(0);
  await expect(page.locator("#firstHelp")).toBeVisible();
  await expect(page.getByRole("link", { name: "À propos et règles" })).toHaveAttribute(
    "href",
    "a-propos.html"
  );

  const lilleState = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  const puzzles = JSON.parse(await readFile("packages/corpus/lille-mele/puzzles.json", "utf8"));
  const puzzle = puzzles.find((candidate) => candidate.id === lilleState.puzzle.id);
  expect(lilleState.dailyRollover.hour).toBe(12);
  expect(lilleState.dailyRollover.timeZone).toBe("Europe/Paris");
  expect(lilleState.puzzle.status).toBe("reviewed");
  expect(lilleState.firstHelpVisible).toBe(true);
  await page.getByRole("button", { name: "Jouer" }).click();
  await expect(page.locator("#firstHelp")).toBeHidden();
  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await expect(page.locator("#firstHelp")).toBeHidden();
  await page.getByRole("button", { name: "Règles" }).click();
  await expect(page.locator("#firstHelp")).toBeVisible();
  await page.getByRole("button", { name: "Jouer" }).click();
  await expect(page.locator("#firstHelp")).toBeHidden();
  await expect(page.locator("#nextPuzzleCountdown")).toContainText(/\d{2} h \d{2}/);
  const group = puzzle.groups[0];
  const nearMiss = [...group.items.slice(0, 3), puzzle.groups[1].items[0]];

  await submitLilleMeleSelection(page, nearMiss);
  await expect(page.locator("#message")).toContainText("Tout près");

  await submitLilleMeleSelection(page, group.items);
  const afterGroup = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  expect(afterGroup.foundGroups).toContain(group.id);
  await expect(page.locator("#foundGroups .found-group")).toHaveClass(/solution-color-1/);

  for (const selection of buildWrongSelectionsAfterFirstGroup(puzzle)) {
    await submitLilleMeleSelection(page, selection);
  }

  await expect(page.locator("#message")).toContainText("Les réponses se dévoilent");
  await expect(page.locator("#foundGroups .found-group")).toHaveCount(0);
  await expect(page.locator("#board .reveal-group")).toHaveCount(4);
  const revealColors = await page.locator("#board .reveal-group").evaluateAll((nodes) =>
    nodes.map((node) => [...node.classList].find((className) => className.startsWith("solution-color-")))
  );
  expect(revealColors).toEqual([
    "solution-color-1",
    "solution-color-2",
    "solution-color-3",
    "solution-color-4",
  ]);
  await expect(page.getByRole("button", { name: "Rejouer la grille" })).toHaveCount(0);
  const afterLoss = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  expect(afterLoss.status).toBe("lost");
  expect(afterLoss.mistakes).toBe(afterLoss.mistakesMax);
  expect(afterLoss.revealedGroups).toHaveLength(4);
  expect(afterLoss.resultVisible).toBe(true);

  await page.goto(`${base}apps/lille-mele/a-propos.html`);
  await expect(page).toHaveTitle("À propos de Lille-Mêle");
  await expect(page.getByRole("heading", { name: "À propos de Lille-Mêle" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Règles" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sources" })).toHaveCount(0);
  await expect(page.locator("#sourceList")).toHaveCount(0);

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

  await page.evaluate(() => localStorage.clear());
  await page.goto(`${base}apps/station-mystere/`);
  await expect(page).toHaveTitle("Station Mystère");
  await expect(page.getByRole("heading", { name: "Station Mystère", exact: true })).toBeVisible();
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await expect(page.locator("#helpDialog")).toBeVisible();
  await page.getByRole("button", { name: "Jouer", exact: true }).click();
  const stationInitial = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  expect(stationInitial.dailyRollover.hour).toBe(12);
  expect(stationInitial.dailyRollover.timeZone).toBe("Europe/Paris");
  expect(stationInitial.entry.niveau).toBe("metro");
  expect(stationInitial.status).toBe("playing");
  expect(stationInitial.score).toBe(1000);
  expect(stationInitial.revealedHintCount).toBe(0);
  await expect(page.locator("#hintList")).toHaveCount(0);

  await page.getByRole("button", { name: "Indice gratuit", exact: true }).click();
  await expect(page.locator("#hintDialog")).toBeVisible();
  await expect(page.locator("#hintDialog .hint-card")).toHaveCount(1);
  const stationAfterFreeHint = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  expect(stationAfterFreeHint.score).toBe(1000);
  expect(stationAfterFreeHint.revealedHintCount).toBe(1);
  await page.locator("#hintDialog .dialog-actions").getByRole("button", { name: "Fermer" }).click();

  const stationInput = page.getByLabel("Rechercher une station");
  await expect(stationInput).toBeVisible();
  await stationInput.fill("ga");
  await expect(page.locator("#stationSuggestions [role='option']").first()).toBeVisible();

  await stationInput.fill("zzzz");
  await page.getByRole("button", { name: "Valider", exact: true }).click();
  const stationAfterWrong = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  expect(stationAfterWrong.score).toBe(900);
  expect(stationAfterWrong.attempts).toHaveLength(1);
  await expect(page.locator("#feedback")).toContainText("-100 points");

  await page.getByRole("button", { name: "Indices", exact: true }).click();
  await expect(page.locator("#hintDialog")).toBeVisible();
  await page.locator("#hintDialog").getByRole("button", { name: "Indice 2 (-150)", exact: true }).click();
  const stationAfterHint = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  expect(stationAfterHint.score).toBe(750);
  expect(stationAfterHint.revealedHintCount).toBe(2);
  await expect(page.locator("#hintDialog .hint-card")).toHaveCount(2);
  await page.locator("#hintDialog .dialog-actions").getByRole("button", { name: "Fermer" }).click();

  await stationInput.fill(stationAfterHint.entry.reponse);
  await stationInput.press("Escape"); // ferme la liste de suggestions qui couvre "Valider"
  await page.getByRole("button", { name: "Valider", exact: true }).click();
  await expect(page.locator("#resultPanel")).toBeVisible();
  await expect(page.locator("#resultTitle")).toContainText(stationAfterHint.entry.reponse);
  await expect(page.locator("#discoveryCard")).toBeVisible();
  const stationAfterWin = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  expect(stationAfterWin.status).toBe("won");
  expect(stationAfterWin.score).toBe(750);
  expect(stationAfterWin.statsApplied).toBe(true);
  expect(stationAfterWin.stats.played).toBe(1);
  expect(stationAfterWin.stats.wins).toBe(1);

  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  const stationAfterReload = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  expect(stationAfterReload.status).toBe("won");
  expect(stationAfterReload.score).toBe(750);
  expect(stationAfterReload.stats.played).toBe(1);
  expect(stationAfterReload.stats.wins).toBe(1);
  expect(errors).toEqual([]);
});

test("les jeux affichent un message lisible quand le corpus est indisponible", async ({ page }) => {
  await page.route("**/packages/corpus/le-mot-a-biloute/**", (route) => route.abort());
  await page.goto(`${base}apps/le-mot-a-biloute/`);
  await expect(page.locator(".loading-error")).toContainText("n'a pas pu être chargé");

  await page.route("**/packages/corpus/lille-mele/**", (route) => route.abort());
  await page.goto(`${base}apps/lille-mele/`);
  await expect(page.locator("#message.error")).toContainText("n'a pas pu être chargée");
});

test("station: la navigation clavier des suggestions expose aria-activedescendant", async ({ page }) => {
  await page.goto(`${base}apps/station-mystere/`);
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  if (await page.locator("#helpDialog").isVisible()) {
    await page.getByRole("button", { name: "Jouer", exact: true }).click();
  }
  const input = page.getByLabel("Rechercher une station");
  await input.fill("ga");
  await expect(page.locator("#stationSuggestions [role='option']").first()).toBeVisible();
  await input.press("ArrowDown");
  await expect(input).toHaveAttribute("aria-activedescendant", /^stationSuggestion-\d+$/);
  const activeId = await input.getAttribute("aria-activedescendant");
  await expect(page.locator(`#${activeId}`)).toHaveAttribute("aria-selected", "true");
});

test("lille-mele: la modale d'accueil rend l'arrière-plan inert", async ({ page }) => {
  await page.goto(`${base}apps/lille-mele/`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await expect(page.locator("#firstHelp")).toBeVisible();
  const headerInert = await page.evaluate(
    () => document.querySelector("body > header")?.inert === true
  );
  expect(headerInert).toBe(true);
});

test("bbb: une tournée gagnée 5-0 enrichit le calepin", async ({ page }) => {
  await page.goto(`${base}apps/biloute-biere-braderie/`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  await page.evaluate(() => window.__forceComputerChoice("biere")); // biloute bat biere

  for (let i = 0; i < 5; i += 1) {
    await page.locator("#roundButton").click();
    await page.getByRole("button", { name: /Biloute bat Bière/ }).click();
    await page.evaluate(() => window.advanceTime(1600));
  }

  const won = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  expect(won.status).toBe("player_won");
  expect(won.score).toMatchObject({ player: 5, computer: 0 });
  expect(won.stats).toMatchObject({ played: 1, won: 1, fewestConceded: 0 });
  expect(won.stats.history[0]).toMatchObject({ result: "won", playerScore: 5, computerScore: 0 });
  await expect(page.locator("#resultText")).toContainText("Tournée parfaite");

  await page.getByRole("button", { name: "Calepin", exact: true }).click();
  await expect(page.locator("#statsDialog")).toBeVisible();
  await expect(page.locator("#statsGrid")).toContainText("Tournées gagnées");
  await expect(page.locator("#tournamentHistory .calepin-row--win").first()).toBeVisible();
});

test("station mystere rejette un état sauvegardé au statut aberrant", async ({ page }) => {
  await page.goto(`${base}apps/station-mystere/`);
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  const st = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  // État de forme valide (version/date/entrée) mais au statut corrompu et au score non par défaut.
  await page.evaluate((s) => {
    localStorage.setItem(
      "station-mystere.v1.currentGame",
      JSON.stringify({
        version: 1,
        dateId: s.dateId,
        entryId: s.entry.id,
        status: "corrompu",
        score: 500,
        revealedHintCount: 2,
        attempts: [],
        penalties: [],
      })
    );
  }, st);
  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  const after = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  expect(after.status).toBe("playing");
  expect(after.score).toBe(1000); // état frais, pas le score 500 de l'état corrompu
  expect(after.revealedHintCount).toBe(0);
});

test("bbb: cinq temps morts font perdre la tournée", async ({ page }) => {
  await page.goto(`${base}apps/biloute-biere-braderie/`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");

  for (let i = 0; i < 5; i += 1) {
    await page.locator("#roundButton").click();
    await page.evaluate(() => window.advanceTime(3100)); // dépasse les 3 s -> timeout
  }

  const lost = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  expect(lost.status).toBe("computer_won");
  expect(lost.score).toMatchObject({ player: 0, computer: 5 });
  expect(lost.stats).toMatchObject({ lost: 1, timeouts: 5 });
  await expect(page.locator("#resultText")).toContainText("Balayé");
});
