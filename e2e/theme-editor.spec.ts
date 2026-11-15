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

/**
 * Le compte de test peut posséder plusieurs boutiques : on sélectionne
 * explicitement celle du parcours avant d'ouvrir l'éditeur.
 */
async function selectStore(page: Page, slug: string) {
  await page.goto("/fr/app");
  const select = page.getByLabel(/Boutique active|Active store/).first();
  await expect(select).toBeVisible({ timeout: 15_000 });

  const options = await select.locator("option").allTextContents();
  const wanted =
    process.env.E2E_STORE_NAME ??
    options.find((option) => option.toLowerCase().includes("démo")) ??
    options.find((option) => option.toLowerCase().includes(slug.toLowerCase()));

  if (!wanted) {
    throw new Error(
      `Boutique « ${slug} » introuvable dans le sélecteur (${options.join(", ")}).`,
    );
  }

  const before = await select.inputValue();
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
  // Le changement passe par une server action : attendre le rechargement et
  // vérifier que la boutique active a réellement changé avant de continuer.
  await expect
    .poll(
      async () => {
        try {
          return await page
            .getByLabel(/Boutique active|Active store/)
            .first()
            .inputValue();
        } catch {
          return before;
        }
      },
      { timeout: 20_000 },
    )
    .not.toBe(before);
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
  test.setTimeout(120_000);

  test("ajoute une bannière, modifie le titre et enregistre", async ({ page }, testInfo) => {
    page.on("response", (response) => {
      if (response.url().includes("/api/themes/")) {
        console.log(`[api] ${response.request().method()} ${response.status()} ${response.url()}`);
      }
    });
    page.on("pageerror", (error) => console.log(`[pageerror] ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") console.log(`[console] ${message.text()}`);
    });

    await login(page);
    if (storeSlug) await selectStore(page, storeSlug);
    await openEditor(page);

    // Repart d'un brouillon propre pour des captures sans sections de test
    // empilées d'une exécution précédente.
    if (process.env.E2E_RESET === "1") {
      page.once("dialog", (dialog) => void dialog.accept());
      await page.getByRole("button", { name: /Pashove Dawn/ }).first().click();
      await page.getByRole("button", { name: "Réinitialiser le thème" }).click();
      await page.waitForTimeout(800);
    }

    await page.screenshot({ path: testInfo.outputPath("editor-desktop.png"), fullPage: false });

    const heading = `Bienvenue E2E ${Date.now()}`;

    // Ajoute une section au modèle depuis la bibliothèque.
    await page.getByRole("button", { name: "Ajouter une section au modèle" }).click();
    const library = page.getByRole("dialog", { name: "Ajouter une section" });
    await expect(library).toBeVisible();
    await library.getByRole("button", { name: /Bannière d.image/ }).first().click();
    await expect(page.getByText("Section", { exact: true }).first()).toBeVisible();

    // Modifie le titre de la section.
    const titleField = page.locator('[data-field-key="heading"] input').first();
    await titleField.fill(heading);

    // Vérifie que l'aperçu se met à jour en direct.
    await expect(page.getByText(heading).first()).toBeVisible();

    // Enregistre.
    await page.getByRole("button", { name: "Enregistrer" }).click();
    const toast = page
      .getByText(/Version enregistrée|Brouillon enregistré|Impossible d.enregistrer/)
      .first();
    await expect(toast).toBeVisible({ timeout: 15_000 });
    await expect(toast).toHaveText(/Version enregistrée|Brouillon enregistré/);

    await page.screenshot({ path: testInfo.outputPath("editor-section.png"), fullPage: false });

    // Vrai viewport téléphone : aperçu plein écran + barre flottante.
    await page.setViewportSize({ width: 390, height: 844 });
    // Laisse le toast d'enregistrement disparaître pour des captures propres.
    await page.waitForTimeout(3600);
    await page.screenshot({ path: testInfo.outputPath("editor-mobile.png"), fullPage: false });

    // Tiroir « Modifier » : structure du modèle.
    await page.getByRole("button", { name: "Modifier", exact: true }).click();
    const structureSheet = page.getByRole("dialog", { name: "Modifier" });
    await expect(structureSheet).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("editor-mobile-structure.png"), fullPage: false });

    // Toucher une section ouvre ses paramètres dans le même tiroir.
    await structureSheet.getByRole("button", { name: /Bannière d.image/ }).last().click();
    const settingsSheet = page.getByRole("dialog", { name: /Bannière d.image/ });
    await expect(settingsSheet).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("editor-mobile-settings.png"), fullPage: false });
    await settingsSheet.getByRole("button", { name: "Fermer" }).click();

    // Menu ⋮.
    await page.getByRole("button", { name: "Menu de l’éditeur" }).click();
    const menuSheet = page.getByRole("dialog", { name: "Menu" });
    await expect(menuSheet).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("editor-mobile-menu.png"), fullPage: false });
    await menuSheet.getByRole("button", { name: "Fermer" }).click();

    // Sélecteur de page (recherche + catégories + pied de thème).
    await page
      .getByRole("navigation", { name: "Barre de l’éditeur" })
      .getByRole("button", { name: "Page d’accueil" })
      .click();
    const pagesSheet = page.getByRole("dialog", { name: "Page d’accueil" });
    await expect(pagesSheet).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("editor-mobile-pages.png"), fullPage: false });
    await pagesSheet.getByRole("button", { name: "Fermer" }).click();

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);

    if (shouldPublish && storeSlug) {
      page.on("dialog", (dialog) => void dialog.accept());
      await page.getByRole("button", { name: "Publier" }).click();
      await expect(page.getByText(/Thème publié/).first()).toBeVisible({ timeout: 20_000 });

      await page.goto(`/fr/store/${storeSlug}`);
      await expect(page.getByText(heading).first()).toBeVisible({ timeout: 20_000 });
      // Laisse l'hydratation et les animations d'apparition se déclencher,
      // puis parcourt la page pour charger les images différées.
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1200);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(600);
      await page.screenshot({ path: testInfo.outputPath("storefront-publie.png"), fullPage: true });
    }
  });
});
