import { expect, test, type Page } from "@playwright/test";

/**
 * Parcours E2E de l'éditeur de thèmes.
 *
 * Il s'exécute uniquement si un compte de test est fourni :
 *
 *   E2E_EMAIL=... E2E_PASSWORD=... E2E_STORE_SLUG=... \
 *   npx playwright test e2e/theme-editor.spec.ts --project=chromium
 *
 * `E2E_PUBLISH=1` ajoute la publication et la vérification de la vitrine.
 * Sans ces variables, le test est ignoré : aucun thème réel n'est modifié.
 */

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
const storeSlug = process.env.E2E_STORE_SLUG;
const shouldPublish = process.env.E2E_PUBLISH === "1";

test.skip(
  !email || !password,
  "Compte de test absent : définir E2E_EMAIL et E2E_PASSWORD pour exécuter le parcours.",
);

async function login(page: Page) {
  await page.goto("/fr/auth/login");
  await page.fill('input[name="email"]', email!);
  await page.fill('input[name="password"]', password!);
  await page.click('button[type="submit"]');
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15_000 });
}

async function openEditor(page: Page) {
  await page.goto("/fr/app/themes");

  const editorLink = page.getByRole("link", { name: "Personnaliser" }).first();
  if ((await editorLink.count()) === 0) {
    await page.getByRole("button", { name: /Créer un thème/ }).click();
    await page.getByRole("button", { name: /Créer et ouvrir l’éditeur/ }).click();
  } else {
    await editorLink.click();
  }

  await expect(page).toHaveURL(/\/app\/themes\/[^/]+\/editor/, { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Sections", exact: true })).toBeVisible();
}

test.describe("éditeur de thèmes", () => {
  test("ajoute une bannière, modifie le titre et enregistre", async ({ page }, testInfo) => {
    await login(page);
    await openEditor(page);

    await page.screenshot({ path: testInfo.outputPath("editor-desktop.png"), fullPage: false });

    const heading = `Bienvenue E2E ${Date.now()}`;

    // Ajoute une section depuis la bibliothèque.
    await page.getByRole("button", { name: /Ajouter une section/ }).first().click();
    await page.getByRole("button", { name: /Bannière d.image/ }).first().click();
    await expect(page.getByText("Section", { exact: true }).first()).toBeVisible();

    // Modifie le titre de la section.
    const titleField = page.locator('[data-field-key="heading"] input').first();
    await titleField.fill(heading);

    // Vérifie que l'aperçu se met à jour en direct.
    await expect(page.getByText(heading).first()).toBeVisible();

    // Enregistre.
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText(/Version enregistrée|Brouillon enregistré/).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.screenshot({ path: testInfo.outputPath("editor-section.png"), fullPage: false });

    // Aperçu mobile.
    await page.getByTitle("Mobile").first().click();
    await page.screenshot({ path: testInfo.outputPath("editor-mobile.png"), fullPage: false });

    if (shouldPublish && storeSlug) {
      page.on("dialog", (dialog) => void dialog.accept());
      await page.getByRole("button", { name: "Publier" }).click();
      await expect(page.getByText(/Thème publié/).first()).toBeVisible({ timeout: 20_000 });

      await page.goto(`/fr/store/${storeSlug}`);
      await expect(page.getByText(heading).first()).toBeVisible({ timeout: 20_000 });
      await page.screenshot({ path: testInfo.outputPath("storefront-publie.png"), fullPage: false });
    }
  });
});
