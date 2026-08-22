// Screenshot pipeline for df-docs — captures the live admin UI (df-prod :8080)
// into .shots/ for review; nothing overwrites static/img/ automatically.
// Run: node scripts/shots.mjs   (from repo root)
// ponytail: borrowed playwright install; `npm i -D playwright` if this joins
// the repo toolchain. Dialog-level shots need per-page scripts; add per rewrite.
import { chromium } from "/data/projects/career-ops/node_modules/playwright/index.mjs";
import { mkdirSync } from "fs";

const BASE = process.env.DF_URL || "http://127.0.0.1:8080/dreamfactory/dist/index.html";
const EMAIL = process.env.DF_EMAIL;
const PASS = process.env.DF_PASS;
if (!EMAIL || !PASS) {
  console.error("Set DF_EMAIL and DF_PASS (admin creds for the target instance).");
  process.exit(1);
}
const OUT = ".shots";
const GROUPS = ["API Generation & Connections", "Security", "AI", "System", "Admin Settings"];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
page.setDefaultTimeout(8000); // admin UI polls forever; never wait for idle

const hideBanner = () => page.evaluate(() => {
  // Deepest match only — textContent includes descendants, so a naive filter
  // matches the app root and hides the whole UI (learned the blank way).
  const els = [...document.querySelectorAll("div, span, p, header, aside")]
    .filter(e => /subscription has expired/i.test(e.textContent || ""))
    .sort((a, b) => a.textContent.length - b.textContent.length);
  if (els.length) {
    const d = els[0];
    (d.closest("div[class*=banner], div[class*=alert]") || d).style.display = "none";
  }
});

await page.goto(BASE, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/df-login-page.png` });

// Material inputs: visible "Enter Email*" is a label, not a placeholder attr
await page.locator("input:not([type=password])").first().fill(EMAIL);
await page.locator("input[type=password]").first().fill(PASS);
await page.getByRole("button", { name: /sign in|login/i }).click();
await page.waitForTimeout(3500);
await hideBanner();
await page.screenshot({ path: `${OUT}/home-dashboard.png` });

// Expand groups once, harvest every href, then navigate directly — clicking
// links re-collapses the sidebar and strands later clicks.
for (const g of GROUPS) {
  try {
    await page.getByText(g, { exact: true }).first().click();
    await page.waitForTimeout(400);
  } catch { console.log(`no group: ${g}`); }
}
const targets = await page
  .locator("nav a, mat-nav-list a, .sidebar a, aside a")
  .evaluateAll(els => els.map(e => [
    (e.textContent || "").trim().split("\n")[0],
    e.getAttribute("href"),
  ]));
console.log(`found ${targets.length} sidebar links`);
const seen = new Set(["home"]);
for (const [text, href] of targets) {
  const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug || !href || seen.has(slug) || /logout|profile|launchpad/.test(slug)) continue;
  seen.add(slug);
  try {
    // In-page hash routing: a full goto reboots the SPA and shoots it blank
    const hash = href.slice(href.indexOf("#"));
    await page.evaluate(h => { location.hash = h; }, hash);
    await page.waitForTimeout(2000);
    await hideBanner();
    await page.screenshot({ path: `${OUT}/${slug}.png` });
    console.log(`ok ${slug}`);
  } catch (e) {
    console.log(`FAIL ${slug}: ${String(e).slice(0, 100)}`);
  }
}
await browser.close();
