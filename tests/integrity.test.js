import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { INITIAL_PROPERTIES } from "../js/data.js";
test("initial inventory is exactly the preserved pre-revision baseline", () => {
  const baseline = JSON.parse(readFileSync(new URL('../reports/initial-properties-baseline.json', import.meta.url)));
  assert.deepEqual(INITIAL_PROPERTIES, baseline);
  assert.equal(INITIAL_PROPERTIES.length, 20);
  // Independent historical hash: data.js differs only in the renamed/shared reserve and two economy CONFIG lines.
  const original = readFileSync(new URL('../js/data.js', import.meta.url), 'utf8')
    .replace(/^  minimumCashReserve: 20000,\n/gm, '  cpuReserve: 20000,\n')
    .replace(/^  (maxPurchasesPerMonth|monthlyInflationRate):.*\n/gm, '');
  const historical = JSON.parse(readFileSync(new URL('../reports/economy-baseline.json', import.meta.url)));
  assert.equal(createHash('sha256').update(original).digest('hex'), historical['js/data.js']);
});

test("runtime economy contains no random market or event implementation and no fixed-price consumers", () => {
  for (const file of ['game', 'market', 'cpu', 'presentation', 'ui']) {
    const source = readFileSync(new URL(`../js/${file}.js`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /Math\.random|applyMonthlyEvent|propertyMarketDelta|\.prezzo/);
  }
});

test("twenty original property SVG files are distinct and have no external dependencies", () => {
  const sources = INITIAL_PROPERTIES.map((p) =>
    readFileSync(
      new URL(`../assets/properties/${p.id}.svg`, import.meta.url),
      "utf8",
    ),
  );
  assert.equal(sources.length, 20);
  assert.equal(new Set(sources).size, 20);
  for (const source of sources) {
    assert.match(source, /<svg.*viewBox="0 0 600 360"/);
    assert.doesNotMatch(source, /<script|<image|href=|<foreignObject/i);
  }
});
