import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [1280, 390, 320]) {
  test(`responsive keyboard flows and WCAG checks at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 1280 ? 720 : 844 });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto("/");
    const audit = async () => {
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        results.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      ).toEqual([]);
    };
    await audit();
    await page.keyboard.press("Enter");
    await expect(page.locator("#onboarding-modal")).not.toBeVisible();
    await audit();
    await page.locator('[data-category="Appartamenti"]').focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#catalog .card")).toHaveCount(4);
    await page.locator('#catalog [data-detail="residenza-solaris"]').focus();
    await page.keyboard.press("Enter");
    await audit();
    await page.locator("#buy-button").focus();
    await page.keyboard.press("Enter");
    await audit();
    await page.keyboard.press("Tab");
    await expect(page.locator("#purchase-close")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator("#purchase-owned")).toBeFocused();
    await page.keyboard.press("Enter");
    await audit();
    await page.locator("#nav-portfolio").click();
    await audit();
    await page.locator("#new-game").click();
    await audit();
    await page.keyboard.press("Escape");
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(
      await page
        .locator("#next-month")
        .evaluate((el) => getComputedStyle(el).transitionDuration),
    ).toBe("0s");
    expect(errors).toEqual([]);
  });
}

test("mobile primary touch targets are at least 44px high", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("#onboarding-start").click();
  for (const id of [
    "new-game",
    "next-month",
    "nav-home",
    "nav-owned",
    "nav-portfolio",
  ])
    expect(
      (await page.locator("#" + id).boundingBox()).height,
      id,
    ).toBeGreaterThanOrEqual(44);
});

test("old saves without UI flags remain playable and preserve economy", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.evaluate(async () => {
    const g = await import("/js/game.js");
    const s = g.createInitialState();
    g.buyProperty(s, "residenza-solaris");
    s.month = 12;
    g.saveStateToStorage(s);
  });
  await page.reload();
  await page.locator("#onboarding-start").click();
  await expect(page.locator("#cash-label")).toHaveText("78.000 S");
  await expect(page.locator("#month-label")).toHaveText("Mese 12 / 60");
  await page.locator("#nav-owned").click();
  await expect(page.locator("#owned-list .property-row")).toHaveCount(1);
  await page.reload();
  await expect(page.locator("#onboarding-modal")).not.toBeVisible();
  expect(errors).toEqual([]);
});

test("storage denial is visible without uncaught errors and the session remains playable", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Denied", "SecurityError");
      },
    });
  });
  await page.goto("/");
  await expect(page.locator("#onboarding-start")).toBeVisible();
  await page.locator("#onboarding-start").click();
  await expect(page.locator("#save-status")).toContainText(
    "Salvataggio non disponibile",
  );
  await page.locator("#next-month").click();
  await expect(page.locator("#month-label")).toHaveText("Mese 2 / 60");
  await page.locator("#new-game").click();
  await page.locator("#reset-confirm").click();
  await expect(page.locator("#month-label")).toHaveText("Mese 1 / 60");
  expect(errors).toEqual([]);
});

test("finished games remain inspectable and accessible on narrow screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.evaluate(async () => {
    const g = await import("/js/game.js");
    const s = g.createInitialState();
    s.month = 60;
    s.onboardingDismissed = true;
    g.advanceMonth(s, () => 0.1);
    g.saveStateToStorage(s);
  });
  await page.reload();
  await expect(page.locator("#final-screen")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.locator("#final-review").click();
  await expect(page.locator("#portfolio-view")).toBeVisible();
  await expect(page.locator("#next-month")).toBeDisabled();
  await page.locator("#nav-home").click();
  await expect(page.locator("#next-step")).toContainText("Sfida conclusa");
  await page.reload();
  await expect(page.locator("#final-screen")).toBeVisible();
  expect(errors).toEqual([]);
});

test("all property illustrations load locally and are distinct", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#onboarding-start").click();
  const assets = await page.locator("#catalog img").evaluateAll((imgs) =>
    imgs.map((i) => ({
      src: i.src,
      loaded: i.complete && i.naturalWidth > 0,
    })),
  );
  expect(assets).toHaveLength(20);
  expect(
    assets.every(
      (i) => i.loaded && i.src.startsWith("http://127.0.0.1:8763/assets/"),
    ),
  ).toBe(true);
});
