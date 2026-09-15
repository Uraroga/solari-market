import { test, expect } from "@playwright/test";
const errors = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/");
  await page.locator("#onboarding-start").click();
});
test.afterEach(() => expect(errors).toEqual([]));

test("home is an image-led marketplace with compact HUD, ranked opportunities and category navigation", async ({
  page,
}) => {
  await expect(page.locator("#netmonthly-label")).toHaveText("0 S");
  await expect(page.locator("#nav-home")).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.locator("#nav-home")).toHaveCSS(
    "background-color",
    "rgb(232, 238, 229)",
  );
  await expect(page.locator("#opportunities .card")).toHaveCount(3);
  await expect(page.locator("#catalog .card")).toHaveCount(20);
  await expect(page.locator("[data-category]")).toHaveCount(5);
  const sources = await page
    .locator("#catalog img")
    .evaluateAll((imgs) => imgs.map((i) => i.getAttribute("src")));
  expect(new Set(sources).size).toBe(20);
  expect(
    sources.every((s) => s.startsWith("assets/") && s.endsWith(".svg")),
  ).toBe(true);
  expect(
    await page
      .locator("#opportunities")
      .evaluate((e) => e.getBoundingClientRect().bottom),
  ).toBeLessThan(720);
  await page.locator('[data-category="Ville"]').click();
  await expect(page.locator("#filter-category")).toHaveValue("Ville");
  await expect(page.locator("#catalog .card")).toHaveCount(4);
  await page.locator("#filter-category").selectOption("");
  await page.locator("#search").fill("cometa");
  await expect(page.locator("#catalog .card")).toHaveCount(1);
  await page.locator("#search").fill("");
  await page.locator("#filter-risk").selectOption("Basso");
  await expect(page.locator("#catalog .card")).toHaveCount(6);
  await page.locator("#sort-price").selectOption("desc");
  await expect(page.locator("#catalog .card").first()).toContainText(
    "Casa Giardino",
  );
  await page.locator("#search").fill("nessun-immobile");
  await expect(page.locator("#catalog")).toContainText("Nessun immobile");
  await page.locator("#reset-filters").click();
  await expect(page.locator("#catalog .card")).toHaveCount(20);
});

test("support project link stays visible in the header and does not interfere with gameplay", async ({
  page,
}) => {
  const support = page.locator(".site-header .support-link");
  await expect(support).toBeVisible();
  await expect(page.locator("footer .support-link")).toHaveCount(0);
  await expect(support).toHaveAttribute("href", "https://paypal.me/uraroga");
  await expect(support).toHaveAttribute("target", "_blank");
  await expect(support).toHaveAttribute("rel", /noopener/);
  await expect(support).toHaveAttribute("rel", /noreferrer/);
  await expect(support).not.toHaveClass(/primary|solar|buy/);

  const headerControlStyles = await page.evaluate(() => {
    const supportStyle = getComputedStyle(document.querySelector(".support-link"));
    const nextStyle = getComputedStyle(document.querySelector("#next-month"));
    return {
      support: {
        height: supportStyle.height,
        radius: supportStyle.borderRadius,
        paddingTop: supportStyle.paddingTop,
        fontFamily: supportStyle.fontFamily,
        fontWeight: supportStyle.fontWeight,
      },
      next: {
        height: nextStyle.height,
        radius: nextStyle.borderRadius,
        paddingTop: nextStyle.paddingTop,
        fontFamily: nextStyle.fontFamily,
        fontWeight: nextStyle.fontWeight,
      },
    };
  });
  expect(headerControlStyles.support).toEqual(headerControlStyles.next);

  await page.locator("#nav-owned").click();
  await expect(support).toBeVisible();
  await page.locator("#nav-portfolio").click();
  await expect(support).toBeVisible();
  await page.locator("#nav-home").click();
  await expect(support).toBeVisible();

  await page.context().route("https://paypal.me/**", route => route.fulfill({status:200,contentType:"text/html",body:"Support link navigation test"}));
  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    support.click(),
  ]);
  expect(popup.url()).toMatch(
    /^https:\/\/(paypal\.me\/uraroga|www\.paypal\.com\/paypalme\/uraroga)/,
  );
  await popup.close();

  await expect(page.locator("#home-view")).toBeVisible();
  await expect(page.locator("#month-label")).toHaveText("Mese 1 / 60");
  await page.locator('#catalog [data-detail="residenza-solaris"]').click();
  await page.locator("#buy-button").click();
  await expect(page.getByRole("dialog", { name: "Acquisto completato" })).toBeVisible();
});

test("onboarding is a keyboard modal, persisted, and new game requires explicit confirmation", async ({
  page,
}) => {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const intro = page.getByRole("dialog", { name: "La città parte da te." });
  await expect(intro).toBeVisible();
  await expect(page.locator("#onboarding-start")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#onboarding-start")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(intro).not.toBeVisible();
  await page.reload();
  await expect(intro).not.toBeVisible();
  await page.locator("#next-month").click();
  await page.locator("#new-game").click();
  await expect(
    page.getByRole("dialog", { name: "Iniziare una nuova partita?" }),
  ).toBeVisible();
  await expect(page.locator("#reset-cancel")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#month-label")).toHaveText("Mese 2 / 60");
  await page.locator("#new-game").click();
  await page.locator("#reset-confirm").click();
  await expect(page.locator("#month-label")).toHaveText("Mese 1 / 60");
  await expect(page.locator("#cash-label")).toHaveText("100.000 S");
  await page.reload();
  await expect(page.locator("#month-label")).toHaveText("Mese 1 / 60");
});

test("all 60 monthly turns finish and final restart also requires confirmation", async ({
  page,
}) => {
  await page.evaluate(() => {
    Math.random = () => { throw Error('Unexpected randomness'); };
  });
  for (let i = 0; i < 60; i++) await page.locator("#next-month").click();
  const final = page.getByRole("dialog", { name: /Hai vinto|Competitor vince/ });
  await expect(final).toBeVisible();
  await expect(page.locator("#next-month")).toBeDisabled();
  await expect(final.locator(".compare-card")).toHaveCount(2);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("solari-market-save-v1")),
  );
  expect(saved.gameOver).toBe(true);
  expect(saved.month).toBe(60);
  await page.locator("#final-new-game").click();
  await page.locator("#reset-cancel").click();
  await expect(final).toBeVisible();
  await page.locator("#final-new-game").click();
  await page.locator("#reset-confirm").click();
  await expect(final).not.toBeVisible();
  await expect(page.locator("#month-label")).toHaveText("Mese 1 / 60");
});

test("months show recent news first, group older archive and show deterministic inflation", async ({
  page,
}) => {
  await page.evaluate(() => {
    Math.random = () => { throw Error('Unexpected randomness'); };
  });
  await page.locator('#catalog [data-detail="residenza-solaris"]').click();
  await page.locator("#buy-button").click();
  await page.locator("#purchase-close").click();
  await expect(page.locator("#next-step")).toContainText(
    "passa al mese successivo",
  );
  await page.locator("#next-month").click();
  await page.locator("#next-month").click();
  await expect(page.locator("#month-label")).toHaveText("Mese 3 / 60");
  await expect(page.locator("#recent-news li")).toHaveCount(3);
  await expect(page.locator('#activity-log')).toContainText('Inflazione mensile: +0,25%');
  await expect(page.locator('#market-event')).toHaveCount(0);
  await expect(page.locator("#news-archive")).not.toHaveAttribute("open", "");
  await page.locator("#news-archive summary").click();
  const months = await page
    .locator("#news-archive .log-month h3")
    .allTextContents();
  expect(months[0]).toBe("MESE 2");
  expect(months[months.length - 1]).toBe("MESE 1");
  await expect(page.locator("#cpu-panel")).toContainText("Immobili Competitor");
  await expect(page.locator("#next-step")).toContainText("Esplora");
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("solari-market-save-v1")),
  );
  expect(saved.month).toBe(3);
  expect(saved.properties.some((p) => p.owner === "cpu")).toBe(true);
  await page.reload();
  await expect(page.locator("#month-label")).toHaveText("Mese 3 / 60");
  await expect(page.locator("#onboarding-modal")).not.toBeVisible();
});

test("portfolio compares real totals and growth from initial capital, including reserve guidance", async ({
  page,
}) => {
  await page.locator("#nav-portfolio").click();
  await expect(page.locator("#portfolio-lead")).toContainText(
    "Siete alla pari",
  );
  await expect(page.locator(".compare-player")).toContainText("TU");
  await expect(page.locator(".compare-cpu")).toContainText("Competitor");
  await expect(
    page.locator('.compare-player [data-metric="netWorth"]'),
  ).toHaveText("100.000 S");
  await expect(
    page.locator('.compare-player [data-metric="count"]'),
  ).toHaveText("0");
  await expect(
    page.locator('.compare-player [data-metric="netIncome"]'),
  ).toHaveText("0 S");
  await expect(page.locator("#growth-summary")).toContainText(
    "100.000 S iniziali",
  );
  await expect(page.locator("#reserve-guidance")).toContainText(
    "Liquidità disponibile",
  );
  await page.evaluate(async () => {
    const g = await import("/js/game.js");
    const s = g.createInitialState();
    s.playerCash = 14000;
    s.cpuCash = 90000;
    s.onboardingDismissed = true;
    g.saveStateToStorage(s);
  });
  await page.reload();
  await page.locator("#nav-portfolio").click();
  await expect(page.locator("#portfolio-lead")).toContainText(
    "Il Competitor è avanti di 76.000 S",
  );
  await expect(page.locator("#reserve-guidance")).toContainText(
    "Riserva ridotta",
  );
  await expect(page.locator("#growth-summary")).toContainText("−86.000 S");
  await expect(page.locator("#cpu-panel")).toContainText("90.000 S");
});

test("estate management uses a five-metric summary and inspectable owned rows", async ({
  page,
}) => {
  await page.locator("#nav-owned").click();
  await expect(page.locator("#owned-list")).toContainText(
    "Il primo indirizzo ti aspetta",
  );
  await page.getByRole("button", { name: "Trova il primo immobile" }).click();
  await page.locator('#catalog [data-detail="studio-cometa"]').click();
  await page.locator("#buy-button").click();
  await page.locator("#purchase-owned").click();
  await expect(page.locator("#owned-summary dt")).toHaveText([
    "Immobili",
    "Valore immobili",
    "Rendite / mese",
    "Costi / mese",
    "Netto / mese",
  ]);
  await expect(page.locator("#owned-summary dd")).toHaveText([
    "1",
    "19.000 S",
    "760 S",
    "260 S",
    "500 S",
  ]);
  await expect(page.locator("#owned-list .property-row")).toHaveCount(1);
  await expect(page.locator("#owned-list .card")).toHaveCount(0);
  await page.locator("#owned-list [data-detail]").click();
  await expect(page.locator("#detail-title")).toHaveText("Studio Cometa");
});

test("detail leads with artwork and economics, purchase announces an exact receipt", async ({
  page,
}) => {
  await page.evaluate(async () => {
    const g = await import("/js/game.js");
    const s = g.createInitialState();
    s.playerCash = 41000;
    s.onboardingDismissed = true;
    g.saveStateToStorage(s);
  });
  await page.reload();
  await page.locator('#catalog [data-detail="residenza-solaris"]').click();
  await expect(page.locator("#buy-button")).toBeDisabled();
  await expect(page.locator("#detail-content")).toContainText("Devi mantenere almeno 20.000 S di riserva.");
  const blockedReserveSave = await page.evaluate(() => localStorage.getItem("solari-market-save-v1"));
  await page.reload();
  expect(await page.evaluate(() => localStorage.getItem("solari-market-save-v1"))).toBe(blockedReserveSave);

  await page.evaluate(async () => {
    const g = await import("/js/game.js");
    const s = g.createInitialState();
    s.onboardingDismissed = true;
    g.saveStateToStorage(s);
  });
  await page.reload();
  await page.locator('#catalog [data-detail="residenza-solaris"]').click();
  await expect(page.locator("#detail-title")).toHaveText("Residenza Solaris");
  await expect(page.locator("#detail-title")).toBeFocused();
  const art = await page
    .locator("#detail-content .property-image")
    .boundingBox();
  const buy = await page.locator("#buy-button").boundingBox();
  expect(art.x + art.width).toBeLessThan(buy.x);
  await expect(page.locator("#buy-button")).toHaveText("Acquista · 22.000 S");
  await page.locator("#buy-button").click();
  const receipt = page.getByRole("dialog", { name: "Acquisto completato" });
  await expect(receipt).toBeVisible();
  await expect(receipt).toContainText("Residenza Solaris");
  await expect(receipt).toContainText("−22.000 S");
  await expect(receipt).toContainText("+550 S");
  await expect(page.locator("#cash-label")).toHaveText("78.000 S");
  await expect(page.locator("#netmonthly-label")).toHaveText("550 S");
  await page.getByRole("button", { name: "Vai ai miei immobili" }).click();
  await expect(page.locator("#owned-view")).toBeVisible();
  await page.locator("#nav-home").click();
  await page.locator('#catalog [data-detail="residenza-solaris"]').click();
  await expect(page.locator("#buy-button")).toBeDisabled();
  await page.locator("#back-to-catalog").click();
  await page.locator('#catalog [data-detail="villa-sirena"]').click();
  await expect(page.locator("#buy-button")).toBeDisabled();
  await expect(page.locator("#detail-content")).toContainText(
    "Devi mantenere almeno 20.000 S di riserva.",
  );
});
