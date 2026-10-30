// Regenerates the README screenshots, hero banner and demo GIF from the web build.
//
//   npm run screenshots              # export web build, then capture
//   npm run screenshots -- --no-build
//
// The browser clock is frozen so demo dates ("Llega hoy", "Atrasado") are stable.
// The GIF needs ffmpeg on the PATH and is skipped without it.
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { chromium } from "playwright";
import { serve } from "./serve-web.mjs";

const root = resolve(import.meta.dirname, "..");
const buildDir = join(root, "dist-screens");
const outDir = join(root, "docs", "screenshots");
const frozenNow = new Date("2026-11-04T10:30:00-06:00");
const mobile = { width: 412, height: 915 };
const desktop = { width: 1440, height: 900 };

if (!process.argv.includes("--no-build")) {
  execSync(`npx expo export --platform web --output-dir ${buildDir}`, { cwd: root, stdio: "inherit" });
}
mkdirSync(outDir, { recursive: true });

const { server, url } = await serve(buildDir);
const browser = await chromium.launch(existsSync("/usr/bin/google-chrome") ? { channel: "chrome" } : {});
const pageOptions = { deviceScaleFactor: 2, locale: "es-MX", timezoneId: "America/Mexico_City" };

// Load the built-in demo once and keep it as "user" data, so seeded pages
// don't carry the "Ejemplo" banner.
async function loadSeed() {
  const page = await browser.newPage({ viewport: mobile, ...pageOptions });
  await page.clock.setFixedTime(frozenNow);
  await page.goto(`${url}/?demo`, { waitUntil: "networkidle" });
  await page.getByText("Hoy", { exact: true }).first().waitFor();
  const envelope = await page.evaluate(() => JSON.parse(localStorage.getItem("en-obra-tracker-demo-v2")));
  await page.close();
  return JSON.stringify({ ...envelope, datasetKind: "user" });
}
const seed = await loadSeed();

async function preparePage(page, seeded) {
  await page.clock.setFixedTime(frozenNow);
  if (seeded) {
    await page.addInitScript((data) => {
      if (!localStorage.getItem("en-obra-tracker-v2")) localStorage.setItem("en-obra-tracker-v2", data);
    }, seed);
  }
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  return page;
}

async function openApp(viewport, { seeded }) {
  return preparePage(await browser.newPage({ viewport, ...pageOptions }), seeded);
}

async function shot(page, name) {
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(outDir, `${name}.png`) });
  console.log(`  docs/screenshots/${name}.png`);
}

const tap = (page, text) => page.getByText(text, { exact: true }).first().click();
const tapLabel = (page, label) => page.getByLabel(label).first().click();

console.log("Capturing screenshots:");

const welcome = await openApp(mobile, { seeded: false });
await shot(welcome, "01-welcome");
await welcome.close();

const phone = await openApp(mobile, { seeded: true });
await shot(phone, "02-today");
await tapLabel(phone, "Cambiar estado de Piedra de río");
await shot(phone, "03-status");
await tap(phone, "Cancelar");
await tap(phone, "Mis trabajos");
await tapLabel(phone, "Jardín de la casa. Camila Torres");
await shot(phone, "04-job");
await tapLabel(phone, "Vista cliente y WhatsApp");
await shot(phone, "05-client-update");
await phone.keyboard.press("Escape");
await phone.close();

const suppliers = await openApp(mobile, { seeded: true });
await tap(suppliers, "Proveedores");
await shot(suppliers, "06-suppliers");
await suppliers.close();

const wide = await openApp(desktop, { seeded: true });
await shot(wide, "07-desktop");
await wide.close();

// Demo GIF: change a status, open the job, show the client update.
if (process.argv.includes("--no-gif") || !hasFfmpeg()) {
  console.log("  (skipping demo.gif: ffmpeg not found or --no-gif)");
} else {
  const videoDir = join(tmpdir(), "en-obra-video");
  rmSync(videoDir, { recursive: true, force: true });
  const recordingStarted = Date.now();
  const context = await browser.newContext({
    viewport: mobile,
    ...pageOptions,
    deviceScaleFactor: 1,
    recordVideo: { dir: videoDir, size: mobile },
  });
  const page = await preparePage(await context.newPage(), true);
  const started = Date.now();
  await page.waitForTimeout(1200);
  await showTap(page, page.getByLabel("Cambiar estado de Piedra de río").first());
  await showTap(page, page.getByLabel("Recibido. Ya llegó al trabajo o contigo.").first());
  await showTap(page, page.getByLabel("Guardar estado Recibido").first());
  await page.waitForTimeout(1300);
  await showTap(page, page.getByText("Mis trabajos", { exact: true }).first());
  await showTap(page, page.getByLabel("Jardín de la casa. Camila Torres").first());
  await page.waitForTimeout(600);
  await showTap(page, page.getByLabel("Vista cliente y WhatsApp").first());
  await page.waitForTimeout(800);
  await page.mouse.move(206, 500);
  await page.mouse.wheel(0, 260);
  await page.waitForTimeout(2600);
  const video = page.video();
  // Trim the page load at the start of the recording.
  const skip = Math.max(0, (started - recordingStarted) / 1000);
  await context.close();
  const source = await video.path();
  const gif = join(outDir, "demo.gif");
  execSync(
    `ffmpeg -y -loglevel error -ss ${skip.toFixed(2)} -i "${source}" ` +
      `-vf "fps=12,scale=360:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4" ` +
      `"${gif}"`,
  );
  rmSync(videoDir, { recursive: true, force: true });
  console.log("  docs/screenshots/demo.gif");
}

// Hero banner: three phone frames on a teal backdrop.
const img = (name) => `data:image/png;base64,${readFileSync(join(outDir, `${name}.png`)).toString("base64")}`;
const hero = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
await hero.setContent(`<!doctype html><html><head><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1600px; height: 900px; overflow: hidden; font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
         background: radial-gradient(1200px 700px at 85% 10%, #1f9a97 0%, #147a78 45%, #0c5251 100%); color: #fff; }
  .copy { position: absolute; left: 88px; top: 170px; width: 500px; }
  .badge { display: inline-block; padding: 8px 16px; border-radius: 999px; background: rgba(255,255,255,.14); font-size: 18px; font-weight: 600; letter-spacing: .02em; }
  h1 { font-size: 88px; line-height: 1; margin: 28px 0 24px; letter-spacing: -.03em; }
  p { font-size: 27px; line-height: 1.4; color: #d9f1ef; }
  .tags { margin-top: 36px; display: flex; gap: 12px; flex-wrap: wrap; }
  .tags span { font-size: 17px; padding: 8px 14px; border-radius: 10px; background: #fff0ec; color: #a8503f; font-weight: 600; }
  .phone { position: absolute; width: 300px; border-radius: 44px; padding: 12px; background: #15191d;
           box-shadow: 0 40px 80px rgba(0,0,0,.35), inset 0 0 0 2px #2c3238; }
  .phone img { display: block; width: 100%; border-radius: 34px; }
  .p1 { left: 640px; top: 175px; transform: rotate(-6deg); }
  .p2 { left: 910px; top: 90px; z-index: 2; }
  .p3 { left: 1180px; top: 175px; transform: rotate(6deg); }
</style></head><body>
  <div class="copy">
    <span class="badge">Android · Español · Local-first</span>
    <h1>En Obra</h1>
    <p>Materiales, proveedores y avances de cada trabajo, con actualizaciones al cliente por WhatsApp.</p>
    <div class="tags"><span>Expo SDK 57</span><span>React Native</span><span>NativeWind</span><span>TypeScript</span></div>
  </div>
  <div class="phone p1"><img src="${img("02-today")}"></div>
  <div class="phone p2"><img src="${img("04-job")}"></div>
  <div class="phone p3"><img src="${img("05-client-update")}"></div>
</body></html>`);
await hero.waitForTimeout(300);
await hero.screenshot({ path: join(outDir, "hero.png") });
console.log("  docs/screenshots/hero.png");

await browser.close();
server.close();

function hasFfmpeg() {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// Draws a short ripple where the tap lands so the GIF is easy to follow.
async function showTap(page, locator) {
  const box = await locator.boundingBox();
  if (box) {
    await page.evaluate(({ x, y }) => {
      const dot = document.createElement("div");
      Object.assign(dot.style, {
        position: "fixed", left: `${x - 22}px`, top: `${y - 22}px`, width: "44px", height: "44px",
        borderRadius: "50%", background: "rgba(20,122,120,.35)", border: "2px solid rgba(20,122,120,.8)",
        pointerEvents: "none", zIndex: 99999, transition: "transform .5s ease-out, opacity .5s ease-out",
      });
      document.body.appendChild(dot);
      requestAnimationFrame(() => { dot.style.transform = "scale(1.6)"; dot.style.opacity = "0"; });
      setTimeout(() => dot.remove(), 600);
    }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    await page.waitForTimeout(250);
  }
  await locator.click();
  await page.waitForTimeout(900);
}
