import { CONFIG, INITIAL_PROPERTIES } from './data.js';
import { purchasePrice, formatSolari, totalsForOwner, updateMarketValues } from './market.js';
import { runCpuTurn } from './cpu.js';

export function createInitialState() {
  return {
    schemaVersion: 2,
    month: 1,
    lastInflationMonth: 0,
    purchasesThisMonth: { player: 0, cpu: 0 },
    playerCash: CONFIG.initialCash,
    cpuCash: CONFIG.initialCash,
    properties: INITIAL_PROPERTIES.map(p => ({ ...p, owner: null })),
    log: [`Mese 1 - Nuova partita iniziata con ${formatSolari(CONFIG.initialCash)} per giocatore e Competitor.`],
    gameOver: false,
    winner: null
  };
}

export function addLog(state, message) {
  state.log.unshift(`Mese ${state.month} - ${message}`);
  state.log = state.log.slice(0, CONFIG.maxLogEntries);
}

export function buyProperty(state, propertyId, buyer = 'player') {
  const count = state.purchasesThisMonth?.[buyer];
  if (!['player', 'cpu'].includes(buyer) || !Number.isInteger(count) || count < 0 || count >= CONFIG.maxPurchasesPerMonth) return false;
  const property = state.properties.find(p => p.id === propertyId);
  const cashKey = buyer === 'player' ? 'playerCash' : 'cpuCash';
  if (!property || property.owner || state[cashKey] - purchasePrice(property) < CONFIG.minimumCashReserve || state.gameOver) return false;
  state[cashKey] -= purchasePrice(property);
  property.owner = buyer;
  state.purchasesThisMonth[buyer] += 1;
  addLog(state, `${buyer === 'player' ? CONFIG.playerName : 'Competitor'} acquista ${property.nome} per ${formatSolari(purchasePrice(property))}.`);
  return true;
}

export function collectMonthlyCashflow(state, owner) {
  const totals = totalsForOwner(state, owner);
  if (owner === 'player') {
    state.playerCash += totals.income;
    state.playerCash -= totals.costs;
  } else {
    state.cpuCash += totals.income;
    state.cpuCash -= totals.costs;
  }
  return totals;
}

export function checkInsolvency(state) {
  const player = totalsForOwner(state, 'player');
  const cpu = totalsForOwner(state, 'cpu');
  if (state.playerCash < 0 && player.value + state.playerCash <= 0) {
    state.gameOver = true; state.winner = 'cpu'; addLog(state, 'Sergio perde per insolvenza.'); return true;
  }
  if (state.cpuCash < 0 && cpu.value + state.cpuCash <= 0) {
    state.gameOver = true; state.winner = 'player'; addLog(state, 'Il Competitor perde per insolvenza.'); return true;
  }
  return false;
}

export function finishGame(state) {
  const player = totalsForOwner(state, 'player');
  const cpu = totalsForOwner(state, 'cpu');
  state.gameOver = true;
  state.winner = player.netWorth === cpu.netWorth ? 'draw' : player.netWorth > cpu.netWorth ? 'player' : 'cpu';
  addLog(state, `Partita conclusa. Patrimonio Sergio: ${formatSolari(player.netWorth)}. Patrimonio Competitor: ${formatSolari(cpu.netWorth)}.`);
}

export function advanceMonth(state) {
  if (state.gameOver) return state;
  const p = collectMonthlyCashflow(state, 'player');
  addLog(state, `${CONFIG.playerName} riceve ${formatSolari(p.income)} di rendite e paga ${formatSolari(p.costs)} di costi.`);
  const c = collectMonthlyCashflow(state, 'cpu');
  addLog(state, `Competitor riceve ${formatSolari(c.income)} di rendite e paga ${formatSolari(c.costs)} di costi.`);
  if (updateMarketValues(state)) addLog(state, 'Inflazione mensile: +0,25% su tutti gli immobili (arrotondamento al Solaro).');
  const bought = runCpuTurn(state);
  if (!bought.length) addLog(state, 'Competitor conserva liquidità e non effettua acquisti.');
  if (checkInsolvency(state)) return state;
  if (state.month >= CONFIG.totalMonths) finishGame(state);
  else { state.month += 1; state.purchasesThisMonth = { player: 0, cpu: 0 }; }
  return state;
}

export function serializeState(state) {
  return JSON.stringify(state);
}

export function loadStateFromStorage(storage = localStorage) {
  const raw = storage.getItem(CONFIG.storageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Number.isInteger(parsed.month) || parsed.month < 1 || parsed.month > CONFIG.totalMonths
      || !Number.isFinite(parsed.playerCash) || !Number.isFinite(parsed.cpuCash)
      || typeof parsed.gameOver !== 'boolean' || !Array.isArray(parsed.log) || !parsed.log.every(x => typeof x === 'string')
      || !Array.isArray(parsed.properties) || parsed.properties.length !== INITIAL_PROPERTIES.length
      || new Set(parsed.properties.map(p => p.id)).size !== INITIAL_PROPERTIES.length
      || !parsed.properties.every(p => {
        const base = INITIAL_PROPERTIES.find(b => b.id === p.id);
        return base && ['nome', 'categoria', 'prezzo', 'rendita', 'costo', 'rischio', 'descrizione'].every(k => p[k] === base[k])
          && Number.isSafeInteger(p.valore) && p.valore > 0 && [null, 'player', 'cpu'].includes(p.owner);
      })) return null;
    if (parsed.schemaVersion != null && ![1, 2].includes(parsed.schemaVersion)) return null;
    const legacy = parsed.schemaVersion !== 2;
    if (!legacy && (!['player', 'cpu'].every(owner => Number.isInteger(parsed.purchasesThisMonth?.[owner])
      && parsed.purchasesThisMonth[owner] >= 0 && parsed.purchasesThisMonth[owner] <= CONFIG.maxPurchasesPerMonth)
      || !Number.isInteger(parsed.lastInflationMonth) || parsed.lastInflationMonth < 0 || parsed.lastInflationMonth > parsed.month)) return null;
    if (legacy) {
      // The old 30-line log and boolean cannot prove monthly purchase counts.
      // Reserve all slots for this transitional month; never invent a count.
      parsed.purchasesThisMonth = { player: CONFIG.maxPurchasesPerMonth, cpu: CONFIG.maxPurchasesPerMonth };
      parsed.lastInflationMonth = parsed.gameOver ? parsed.month : parsed.month - 1;
      parsed.schemaVersion = 2;
      if (parsed.gameOver && parsed.month === CONFIG.totalMonths && totalsForOwner(parsed, 'player').netWorth === totalsForOwner(parsed, 'cpu').netWorth) parsed.winner = 'draw';
      parsed.log = (parsed.log || []).map(line => line.replace(/^(Mese \d+ - )?/, '$1Storico precedente · '));
      addLog(parsed, 'Regole aggiornate: acquisti sospesi per entrambi in questo mese di transizione; disponibili dal prossimo mese. Valori e liquidità conservati.');
    }
    parsed.log = (parsed.log || []).map(line => line.replace(/\bCPU\b/g, 'Competitor'));
    delete parsed.playerBoughtThisMonth;
    return parsed;
  } catch { return null; }
}

export function saveStateToStorage(state, storage = localStorage) {
  storage.setItem(CONFIG.storageKey, serializeState(state));
}

