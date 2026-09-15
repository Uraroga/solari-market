import { buyProperty } from './game.js';
import { CONFIG } from './data.js';
import { purchasePrice, categoryCounts, netMonthly } from './market.js';

const STRATEGY_PHASES = [
  {
    throughMonth: 20,
    minimumYield: 0.018,
    minimumScore: 0.014,
    diversityBonus: 0.006,
    affordabilityWeight: 0.006,
    riskPenalty: { Basso: 0, Medio: 0.004, Alto: 0.01 },
    highRiskConcentrationPenalty: 0.004,
  },
  {
    throughMonth: 45,
    minimumYield: 0.02,
    minimumScore: 0.016,
    diversityBonus: 0.004,
    affordabilityWeight: 0.004,
    riskPenalty: { Basso: 0, Medio: 0.006, Alto: 0.014 },
    highRiskConcentrationPenalty: 0.006,
  },
  {
    throughMonth: CONFIG.totalMonths,
    minimumYield: 0.023,
    minimumScore: 0.019,
    diversityBonus: 0.002,
    affordabilityWeight: 0.002,
    riskPenalty: { Basso: 0, Medio: 0.008, Alto: 0.018 },
    highRiskConcentrationPenalty: 0.008,
  },
];

function strategyForMonth(month) {
  return STRATEGY_PHASES.find(phase => month <= phase.throughMonth) ?? STRATEGY_PHASES.at(-1);
}

export function evaluatePropertyForCpu(property, state) {
  const strategy = strategyForMonth(state.month);
  const net = netMonthly(property);
  const yieldScore = net / purchasePrice(property);
  const counts = categoryCounts(state.properties, 'cpu');
  const diversityBonus = counts[property.categoria] ? 0 : strategy.diversityBonus;
  const affordability = Math.max(0, (state.cpuCash - purchasePrice(property) - CONFIG.minimumCashReserve) / CONFIG.initialCash);
  const highRiskOwned = state.properties.filter(p => p.owner === 'cpu' && p.rischio === 'Alto').length;
  const highRiskPenalty = property.rischio === 'Alto' ? highRiskOwned * strategy.highRiskConcentrationPenalty : 0;
  return yieldScore + diversityBonus + affordability * strategy.affordabilityWeight
    - (strategy.riskPenalty[property.rischio] || 0) - highRiskPenalty;
}

export function shouldCpuBuy(property, state) {
  if (!property || property.owner) return false;
  if (state.cpuCash - purchasePrice(property) < CONFIG.minimumCashReserve) return false;
  const yieldScore = netMonthly(property) / purchasePrice(property);
  const strategy = strategyForMonth(state.month);
  if (yieldScore < strategy.minimumYield) return false;
  return evaluatePropertyForCpu(property, state) >= strategy.minimumScore;
}

export function runCpuTurn(state) {
  const bought = [];
  while (!state.gameOver && state.purchasesThisMonth.cpu < CONFIG.maxPurchasesPerMonth) {
    // Rebuild from current cash, category and risk holdings after EVERY acquisition.
    const ranked = state.properties.filter(p => shouldCpuBuy(p, state))
      .sort((a, b) => evaluatePropertyForCpu(b, state) - evaluatePropertyForCpu(a, state) || purchasePrice(a) - purchasePrice(b) || a.id.localeCompare(b.id));
    if (!ranked.length || !buyProperty(state, ranked[0].id, 'cpu')) break;
    bought.push(ranked[0]);
  }
  return bought;
}
