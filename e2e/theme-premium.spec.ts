import { expect, test, type Page } from "@playwright/test";

/**
 * Publie le thème de démonstration « Pashove Premium » sur la boutique demo.
 *
 *   E2E_EMAIL=... E2E_PASSWORD=... E2E_STORE_SLUG=demo \
 *   PLAYWRIGHT_CHANNEL=chrome npx playwright test e2e/theme-premium.spec.ts
 */

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const storeSlug = process.env.E2E_STORE_SLUG ?? "demo";

test.skip(!email || !password, "Compte de test absent.");

async function login(page: Page) {
  await page.goto("/fr/auth/login");
  await page.fill('input[name="email"]', email!);
  await page.fill('input[name="password"]', password!);
  await page.click('button[type="submit"]');
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15_000 });
}

async function selectStore(page: Page, slug: string) {
  await page.goto("/fr/app");
  const select = page.getByLabel(/Boutique active|Active store/).first();
  await expect(select).toBeVisible({ timeout: 15_000 });
  const before = await select.inputValue();
  const options = await select.locator("option").allTextContents();
  const wanted =
    options.find((option) => option.toLowerCase().includes("démo")) ??
    options.find((option) => option.toLowerCase().includes(slug.toLowerCase()));
  if (!wanted) throw new Error(`Boutique « ${slug} » introuvable.`);
  await select.selectOption({ label: wanted });
  // Fixe aussi le cookie de boutique active : évite une course entre la
  // server action et la navigation suivante.
  const storeId = await select
    .locator("option")
    .filter({ hasText: wanted })
    .first()
    .getAttribute("value");
  if (storeId) {
    await page.context().addCookies([
      { name: "pashove_store", value: storeId, url: "http://localhost:3000" },
    ]);
  }
  await expect
    .poll(async () => {
      try {
        return await page.getByLabel(/Boutique active|Active store/).first().inputValue();
      } catch {
        return before;
      }
    }, { timeout: 20_000 })
    .not.toBe(before);
}

test("publie le thème Pashove Premium sur demo", async ({ page }, testInfo) => {
  test.setTimeout(150_000);
  await login(page);
  await selectStore(page, storeSlug);

  await page.goto("/fr/app/themes");
  await page.getByRole("button", { name: /Créer un thème/ }).click();
  await page.getByLabel("Nom").fill("Pashove Premium");
  await page.getByRole("button", { name: /Pashove Premium/ }).click();
  await page.getByRole("button", { name: /Créer et ouvrir l’éditeur/ }).click();
  await expect(page).toHaveURL(/\/app\/themes\/[^/]+\/editor/, { timeout: 20_000 });

  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Publier" }).click();
  await expect(page.getByText(/Thème publié/).first()).toBeVisible({ timeout: 40_000 });

  await page.waitForTimeout(1200);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(`/fr/store/${storeSlug}`, { waitUntil: "domcontentloaded" });
      break;
    } catch {
      await page.waitForTimeout(1500);
    }
  }
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  await page.screenshot({ path: testInfo.outputPath("premium-home-desktop.png"), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: testInfo.outputPath("premium-home-mobile.png"), fullPage: true });
});
