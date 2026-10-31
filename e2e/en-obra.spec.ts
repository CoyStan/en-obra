import { expect, test, type Locator, type Page } from "@playwright/test";

// Demo data is generated relative to today, so the assertions below hold on any
// date. Don't freeze the browser clock here: React Native Web's text inputs drop
// typed text when Date.now() never advances.

/**
 * Fills a field and retries until the value sticks. Sheets autofocus their first
 * field as they open, which can pull focus away from a field the test is typing in.
 */
async function typeInto(field: Locator, text: string) {
  await expect(async () => {
    await field.fill(text);
    await expect(field).toHaveValue(text, { timeout: 500 });
  }).toPass();
}

async function openDemo(page: Page) {
  await page.goto("/?demo");
  await expect(page.getByText("Ejemplo · los datos no se mezclan con los tuyos")).toBeVisible();
}

async function openGardenJob(page: Page) {
  await page.getByRole("tab", { name: "Mis trabajos" }).click();
  await page.getByLabel("Jardín de la casa. Camila Torres").click();
  await expect(page.getByText("Lo siguiente")).toBeVisible();
}

test("a fresh install offers a new job or the demo", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Crear mi primer trabajo")).toBeVisible();
  await expect(page.getByText("Ver ejemplo")).toBeVisible();
  await expect(page.getByText("Tus datos se guardan solo en este dispositivo.")).toBeVisible();
});

test("Hoy lists late items first and summarizes what needs attention", async ({ page }) => {
  await openDemo(page);
  await expect(page.getByLabel("1 Atrasados")).toBeVisible();
  await expect(page.getByLabel("1 Llegan hoy")).toBeVisible();
  await expect(page.getByLabel("2 Por pedir")).toBeVisible();
  const firstRow = page.getByLabel(/^Editar /).first();
  await expect(firstRow).toHaveAccessibleName("Editar Piedra de río");
});

test("marking a material as received updates the job progress", async ({ page }) => {
  await openDemo(page);
  await page.getByLabel(/^Cambiar estado de Piedra de río/).click();
  await page.getByRole("radio", { name: /^Recibido\./ }).click();
  await page.getByLabel("Guardar estado Recibido").click();
  await expect(page.getByText("Piedra de río: recibido.")).toBeVisible();

  await page.getByRole("tab", { name: "Mis trabajos" }).click();
  await expect(page.getByLabel("Jardín de la casa. Camila Torres")).toContainText("2/4");
});

test("the client view previews the exact WhatsApp message and hides prices", async ({ page }) => {
  await openDemo(page);
  await openGardenJob(page);
  await page.getByLabel("Vista cliente y WhatsApp").click();
  const message = page.getByLabel(/^Mensaje que se enviará/);
  await expect(message).toContainText("Hola Camila");
  await expect(message).toContainText("1 de 4 materiales ya están listos en obra.");
  await expect(message).toContainText("Tierra negra (12 costales)");
  await expect(message).not.toContainText("$");
});

test("deleting a material can be undone", async ({ page }) => {
  await openDemo(page);
  await openGardenJob(page);
  await page.getByLabel("Borrar Kit de riego por goteo").click();
  await expect(page.getByLabel("Editar Kit de riego por goteo")).toHaveCount(0);
  await page.getByRole("button", { name: "Deshacer" }).click();
  await expect(page.getByLabel("Editar Kit de riego por goteo")).toBeVisible();
});

test("a new job and its material survive a reload", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Crear mi primer trabajo").click();
  await typeInto(page.getByPlaceholder("Ej. Arreglar el jardín…"), "Instalación eléctrica");
  await typeInto(page.getByPlaceholder("Ej. Camila…"), "Lucía Ramírez");
  await page.getByText("Empezar trabajo").click();

  await page.getByLabel("Instalación eléctrica. Lucía Ramírez").click();
  await page.getByText("Agregar primer material").click();
  await typeInto(page.getByPlaceholder("Ej. Plantas de sombra…"), "Cable calibre 12");
  await typeInto(page.getByPlaceholder("Ej. 18 piezas…"), "3 rollos");
  await page.getByText("Agregar al trabajo").click();
  await expect(page.getByLabel("Editar Cable calibre 12")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Hoy", { exact: true }).first()).toBeVisible();
  await expect(page.getByLabel("Editar Cable calibre 12")).toBeVisible();
  await expect(page.getByText("3 rollos · Instalación eléctrica")).toBeVisible();
});

test("wide screens switch to the desktop workspace", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/?demo");
  await expect(page.getByText("Control del trabajo")).toBeVisible();
});

test("desktop confirms status changes like the phone layout does", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/?demo");
  await page.getByText("Cambiar estado", { exact: true }).click();
  await page.getByRole("radio", { name: /^Recibido\./ }).click();
  await page.getByLabel("Guardar estado Recibido").click();
  await expect(page.getByText("Piedra de río: recibido.")).toBeVisible();
  await expect(page.getByText("Ejemplo · los datos no se mezclan con los tuyos")).toBeVisible();
});
