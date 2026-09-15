import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Same deterministic UI journey before/after; no production state is changed.
const phase = process.argv[2] || 'after';
if (!['before', 'after'].includes(phase)) throw new Error('Use before or after');
const root = 'reports/smartphone';
mkdirSync(`${root}/${phase}`, { recursive: true });
const browser = await chromium.launch();
const report = { phase, screens: [], errors: [], comparisons: [] };
for (const [width, height] of [[320,568],[390,844],[430,932],[768,1024],[1280,800]]) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
  page.on('requestfailed', r => report.errors.push(r.url()));
  const shot = async (state, selector) => {
    if (selector) await page.locator(selector).scrollIntoViewIfNeeded();
    else await page.evaluate(() => window.scrollTo(0, 0));
    await page.mouse.move(0, 0);
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
    const geometry = await page.evaluate(() => {
      const dialog = document.querySelector('dialog[open]');
      const scope = dialog || document.body;
      const outside = [...scope.querySelectorAll('*')].filter(e => {
        if (!e.getClientRects().length || e.classList.contains('skip-link')) return false;
        const r = e.getBoundingClientRect();
        return r.width && (r.left < -1 || r.right > innerWidth + 1);
      }).map(e => ({ tag: e.tagName, class: e.className, text: e.textContent.trim().slice(0,60) }));
      return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, outside, headerHeight: document.querySelector('.site-header').offsetHeight };
    });
    const file = `${width}-${state}.png`;
    const image = await page.screenshot({ path: `${root}/${phase}/${file}`, animations: 'disabled' });
    report.screens.push({ width, height, state, file, ...geometry });
    if (phase === 'after' && width >= 768) {
      const before = readFileSync(`${root}/before/${file}`);
      const sha = b => createHash('sha256').update(b).digest('hex');
      report.comparisons.push({ file, identical: before.equals(image), beforeSHA256: sha(before), afterSHA256: sha(image) });
    }
  };
  await page.goto('http://127.0.0.1:8763');
  await shot('onboarding');
  await page.locator('#onboarding-start').click();
  await shot('home');
  await shot('catalog', '.filters');
  await page.locator('#search').fill('cometa');
  await shot('filtered', '#catalog');
  await page.locator('#catalog [data-detail="studio-cometa"]').click();
  await shot('detail');
  await shot('buy', '#buy-button');
  await page.locator('#buy-button').click();
  await shot('purchase');
  await page.locator('#purchase-owned').click();
  await shot('owned');
  await page.locator('#next-month').click();
  await page.locator('#next-month').click();
  await page.locator('#nav-portfolio').click();
  await shot('portfolio');
  await shot('competitor', '#cpu-panel');
  await page.locator('#news-archive summary').click();
  await shot('archive', '#news-archive');
  await page.locator('#new-game').click();
  await shot('reset');
  await page.locator('#reset-cancel').click();
  await page.evaluate(async () => {
    const g = await import('/js/game.js');
    const s = JSON.parse(localStorage.getItem('solari-market-save-v1'));
    while (!s.gameOver) g.advanceMonth(s);
    g.saveStateToStorage(s);
  });
  await page.reload();
  await shot('final');
  await shot('final-action', '#final-new-game');
  await context.close();
}
await browser.close();
writeFileSync(`${root}/${phase}.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ phase, screenshots: report.screens.length, errors: report.errors, overflow: report.screens.filter(s => s.outside.length || s.scrollWidth > s.width), comparisons: report.comparisons }, null, 2));
if (phase === 'after' && (report.errors.length || report.screens.some(s => s.outside.length || s.scrollWidth > s.width) || report.comparisons.some(c => !c.identical))) process.exitCode = 1;
