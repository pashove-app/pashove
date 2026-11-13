import { expect, test } from "@playwright/test";

test.describe("site public", () => {
  test("la page d’accueil répond et affiche un titre", async ({ page }) => {
    const response = await page.goto("/fr");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("la page tarifs est accessible", async ({ page }) => {
    const response = await page.goto("/fr/pricing");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("la connexion affiche le formulaire", async ({ page }) => {
    await page.goto("/fr/auth/login");
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test("le centre d’aide public répond", async ({ page }) => {
    const response = await page.goto("/fr/help");
    expect(response?.status()).toBe(200);
  });
});
