import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState } from "../js/game.js";
import { CONFIG } from "../js/data.js";
const presentation = await import("../js/presentation.js").catch(() => ({}));

test("opportunities rank only available affordable properties by monthly net yield", () => {
  const s = createInitialState();
  s.playerCash = 45000;
  s.properties.find((p) => p.id === "studio-cometa").owner = "cpu";
  assert.equal(typeof presentation.opportunities, "function");
  const picks = presentation.opportunities(s);
  assert.equal(picks.length, 3);
  assert.ok(picks.every((p) => !p.owner && s.playerCash - p.valore >= CONFIG.minimumCashReserve));
  assert.equal(picks[0].id, "residenza-solaris");
  assert.deepEqual(presentation.opportunities({ ...s, playerCash: 0 }), []);
});
