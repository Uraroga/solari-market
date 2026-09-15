import { test, expect } from '@playwright/test';

for (const [width, height] of [[320,568], [390,844], [430,932]]) {
  test(`smartphone ${width} has compact reachable navigation and single-column cards`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.locator('#onboarding-start').click();
    expect((await page.locator('.site-header').boundingBox()).height).toBeLessThanOrEqual(210);
    await expect(page.locator('#next-month')).toBeInViewport();
    for (const selector of ['#catalog', '#opportunities']) {
      const cards = await page.locator(`${selector} .card`).evaluateAll(es => es.map(e => {
        const r = e.getBoundingClientRect(); return { x:r.x, width:r.width, y:r.y, bottom:r.bottom };
      }));
      expect(cards[0].width).toBeGreaterThan(width - 40);
      expect(cards[1].x).toBe(cards[0].x);
      expect(cards[1].y).toBeGreaterThan(cards[0].bottom);
    }
    await page.locator('#nav-portfolio').click();
    const cards = await page.locator('#portfolio-view .compare-card').all();
    const first = await cards[0].boundingBox();
    const second = await cards[1].boundingBox();
    expect(second.y).toBeGreaterThan(first.y + first.height);
  });

  test(`smartphone ${width} touch journey keeps content unclipped and dialogs operable`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    const check = async () => {
      const issues = await page.evaluate(() => {
        const scope = document.querySelector('dialog[open]') || document.body;
        const problems = [];
        if (document.documentElement.scrollWidth > innerWidth) problems.push('page overflow');
        for (const e of scope.querySelectorAll('*')) {
          if (!e.getClientRects().length || e.classList.contains('skip-link')) continue;
          const r = e.getBoundingClientRect();
          if (!r.width) continue;
          if (r.left < -1 || r.right > innerWidth + 1) problems.push(`outside: ${e.className}`);
          if (!['SELECT','INPUT','IMG','SVG','PATH'].includes(e.tagName) && e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 1) problems.push(`clipped: ${e.className}`);
          if (e.matches('button, input, select, summary, .support-link') && (r.height < 44 || r.width < 44)) problems.push(`touch size: ${e.id || e.className}`);
        }
        return problems;
      });
      expect(issues).toEqual([]);
    };
    const touch = async (selector) => {
      const target = page.locator(selector);
      await target.scrollIntoViewIfNeeded();
      // Real pointer action also checks that sticky UI does not intercept taps.
      await target.click();
    };
    await check();
    await touch('#onboarding-start');
    await check();
    await touch('#search');
    await page.locator('#search').fill('cometa');
    await expect(page.locator('#catalog .card')).toHaveCount(1);
    await page.locator('#search').fill('');
    await touch('#filter-category');
    await page.locator('#filter-category').selectOption('Ville');
    await expect(page.locator('#catalog .card')).toHaveCount(4);
    await page.locator('#filter-category').selectOption('');
    await page.locator('#filter-risk').selectOption('Basso');
    await expect(page.locator('#catalog .card')).toHaveCount(6);
    await page.locator('#sort-price').selectOption('desc');
    await check();
    await page.locator('#filter-risk').selectOption('');
    await touch('#catalog [data-detail="studio-cometa"]');
    await check();
    await touch('#buy-button');
    await check();
    await touch('#purchase-owned');
    await check();
    await touch('#next-month');
    await touch('#next-month');
    await touch('#nav-portfolio');
    await check();
    await touch('#news-archive summary');
    await check();
    await touch('#new-game');
    await check();
    await touch('#reset-cancel');
    // Exercise actual turn buttons all the way to the final dialog.
    for (let i = 0; i < 58; i++) await touch('#next-month');
    await expect(page.getByRole('dialog', { name: /Hai vinto|Competitor vince/ })).toBeVisible();
    await check();
    await touch('#final-new-game');
    await check();
    await touch('#reset-cancel');
    await touch('#final-new-game');
    await touch('#reset-confirm');
    await expect(page.locator('#month-label')).toHaveText('Mese 1 / 60');
    expect(errors).toEqual([]);
  });
}
