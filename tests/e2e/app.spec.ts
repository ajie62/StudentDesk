import { _electron as electron, test, expect } from "@playwright/test";

test.describe("Application globale", () => {
  let electronApp: any;
  let page: any;

  test.beforeEach(async () => {
    electronApp = await electron.launch({ args: ["."] });
    page = await electronApp.firstWindow();
  });

  test.afterEach(async () => {
    await electronApp.close();
  });

  test("Affiche le titre STUDENTDESK", async () => {
    await expect(page.locator(".brand").first()).toHaveText("STUDENTDESK");
  });

  test("Affiche le dashboard par défaut", async () => {
    await expect(page.locator("main")).toContainText("Tableau de bord");
  });

  test("Navigue vers la page Réglages", async () => {
    await page.click('button[title="Réglages"]');
    await expect(page.locator("h2")).toHaveText("Réglages");
  });

  test("Navigue vers le Changelog via le numéro de version", async () => {
    await page.click(".app-version");
    await expect(page.locator("main")).toContainText("Changelog");
  });

  test("Ouvre et ferme le menu mobile (burger)", async () => {
    await page.setViewportSize({ width: 500, height: 700 });

    const burger = page.locator("button.burger");
    await expect(burger).toBeVisible();

    // ouverture
    await burger.click();
    await expect(page.locator(".sidebar.open")).toBeVisible();

    // fermeture
    await burger.click({ force: true });
    await expect(page.locator(".sidebar.open")).toHaveCount(0);
  });
});
