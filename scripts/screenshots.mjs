// Regenerates the README screenshots from the web build.
//
//   npm run screenshots              # export web build, then capture
//   npm run screenshots -- --no-build
//
// The browser clock is frozen so demo dates ("Llega hoy", "Atrasado") are stable.
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";

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

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".ttf": "font/ttf", ".json": "application/json", ".ico": "image/x-icon" };
const server = createServer((req, res) => {
  const path = join(buildDir, decodeURIComponent(new URL(req.url, "http://x").pathname));
  const file = existsSync(path) && !path.endsWith("/") ? path : join(buildDir, "index.html");
  res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const url = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch(existsSync("/usr/bin/google-chrome") ? { channel: "chrome" } : {});

async function openApp(viewport, { seeded }) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2, locale: "es-MX", timezoneId: "America/Mexico_City" });
  await page.clock.setFixedTime(frozenNow);
  await page.goto(url, { waitUntil: "networkidle" });
  if (seeded) {
    // Load the built-in demo, then store it as the user's own data so the
    // screenshots don't carry the "Ejemplo" banner.
    await page.getByText("Ver ejemplo").first().click();
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      const envelope = JSON.parse(localStorage.getItem("en-obra-tracker-demo-v2"));
      envelope.datasetKind = "user";
      localStorage.setItem("en-obra-tracker-v2", JSON.stringify(envelope));
    });
    await page.reload({ waitUntil: "networkidle" });
  }
  await page.waitForTimeout(800);
  return page;
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
