import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync("reports/after", { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
});
const page = await context.newPage();
const errors = [];
const requests = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("requestfailed", (r) => requests.push(r.url()));
await page.goto("http://127.0.0.1:8763");
const shots = [];
const shot = async (name) => {
  await page.screenshot({
    path: `reports/after/${name}.png`,
    animations: "disabled",
  });
  shots.push(`reports/after/${name}.png`);
};
await shot("desktop-onboarding");
await page.locator("#onboarding-start").click();
await shot("desktop-home");
await page.locator("#catalog-title").focus();
await shot("desktop-catalog");
await page.locator('#catalog [data-detail="residenza-solaris"]').click();
await shot("desktop-detail");
await page.locator("#buy-button").click();
await shot("desktop-purchase");
await page.locator("#purchase-owned").click();
await shot("desktop-owned");
await page.locator("#next-month").click();
await page.locator("#next-month").click();
await page.locator("#nav-portfolio").click();
await shot("desktop-portfolio");
await page.locator("#news-archive summary").click();
await shot("desktop-cpu-activity");
await page.locator("#new-game").click();
await shot("desktop-new-game");
await page.locator("#reset-cancel").click();
await page.setViewportSize({ width: 390, height: 844 });
await page.locator("#nav-home").click();
await shot("mobile-home");
await page.locator("#catalog-title").focus();
await shot("mobile-catalog");
await page.locator('#catalog [data-detail="residenza-solaris"]').click();
await shot("mobile-detail");
await page.locator("#nav-owned").click();
await shot("mobile-owned");
await page.locator("#nav-portfolio").click();
await shot("mobile-portfolio");
await page.evaluate(async () => {
  const g = await import("/js/game.js");
  const s = JSON.parse(localStorage.getItem("solari-market-save-v1"));
  while (!s.gameOver) g.advanceMonth(s);
  g.saveStateToStorage(s);
});
await page.reload();
await shot("mobile-final");
await page.setViewportSize({ width: 1280, height: 720 });
await shot("desktop-final");
writeFileSync(
  "reports/screenshot-console.json",
  JSON.stringify(
    {
      screenshots: shots,
      pageErrorsAndConsoleErrors: errors,
      failedRequests: requests,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({ screenshots: shots.length, errors, requests }, null, 2),
);
await browser.close();
