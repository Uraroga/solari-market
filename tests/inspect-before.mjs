import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
mkdirSync("reports/before", { recursive: true });
const hashes = Object.fromEntries(
  ["js/data.js", "js/game.js", "js/cpu.js", "js/market.js"].map((p) => [
    p,
    createHash("sha256").update(readFileSync(p)).digest("hex"),
  ]),
);
writeFileSync("reports/economy-baseline.json", JSON.stringify(hashes, null, 2));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto("http://127.0.0.1:8763");
const shot = async (name) => {
  await page.screenshot({ path: `reports/before/${name}.png` });
  console.log(name, (await page.locator("body").innerText()).slice(0, 500));
};
await shot("onboarding");
await page.locator("#onboarding-start").click();
await shot("home");
await page.locator("#catalog").scrollIntoViewIfNeeded();
await shot("catalog");
await page.locator("[data-detail]").first().click();
await page.evaluate(() => scrollTo(0, 0));
await shot("detail");
await page.locator("#nav-owned").click();
await shot("owned");
await page.locator("#nav-portfolio").click();
await shot("portfolio-cpu-activity");
await page.evaluate(async () => {
  const g = await import("/js/game.js");
  const s = g.createInitialState();
  s.month = 60;
  g.advanceMonth(s, () => 0.1);
  g.saveStateToStorage(s);
});
await page.reload();
await shot("final");
await browser.close();
