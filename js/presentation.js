import { purchasePrice, netMonthly } from "./market.js";
import { CONFIG } from "./data.js";

// Presentation-only ranking; never used by the game or CPU.
export function opportunities(state) {
  return state.properties
    .filter((p) => !p.owner && state.playerCash - purchasePrice(p) >= CONFIG.minimumCashReserve)
    .sort(
      (a, b) =>
        netMonthly(b) / purchasePrice(b) - netMonthly(a) / purchasePrice(a) ||
        purchasePrice(a) - purchasePrice(b),
    )
    .slice(0, 3);
}
