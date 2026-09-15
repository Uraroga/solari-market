import { CONFIG, CATEGORIES } from './data.js';

export function formatSolari(amount) {
  const rounded = Math.round(Number(amount) || 0);
  return `${rounded.toLocaleString('it-IT')} S`;
}

export function purchasePrice(property) {
  return property.valore;
}

export function netMonthly(property) {
  return property.rendita - property.costo;
}

export function ownerLabel(owner) {
  if (owner === 'player') return 'Sergio';
  if (owner === 'cpu') return 'Competitor';
  return 'Disponibile';
}

export function investmentLabel(property) {
  const net = netMonthly(property);
  const yieldRate = net / purchasePrice(property);
  if (property.rischio === 'Alto' && yieldRate >= 0.025) return 'Alto potenziale';
  if (property.rischio === 'Alto') return 'Rischioso';
  if (property.categoria === 'Terreni' && yieldRate < 0.008) return 'Crescita lenta';
  if (yieldRate >= 0.032) return 'Redditizio';
  if (purchasePrice(property) > 60000 && yieldRate < 0.018) return 'Costoso';
  if (property.rischio === 'Basso') return 'Prudente';
  return 'Bilanciato';
}

export function investmentProfile(property) {
  const label = investmentLabel(property);
  const net = formatSolari(netMonthly(property));
  const profiles = {
    Prudente: `Immobile stabile con rischio basso e guadagno netto di ${net} al mese. Adatto a iniziare senza esporsi troppo.`,
    Bilanciato: `Combina prezzo, rischio e guadagno netto di ${net} al mese in modo equilibrato. Utile per diversificare.`,
    Redditizio: `Genera un guadagno netto alto rispetto al prezzo. Richiede attenzione ai costi, ma accelera la crescita della liquidità.`,
    Costoso: `Richiede molto capitale e rende meno nel breve periodo. Ha senso se vuoi puntare sul valore patrimoniale.`,
    Rischioso: `Rischio Alto è un criterio prudenziale del Competitor, non una probabilità di perdita. Valore +0,25% mensile come tutti gli immobili; costi fissi.`,
    'Crescita lenta': `Rende poco ogni mese, ma costa poco da mantenere e può rivalutarsi nel tempo.`,
    'Alto potenziale': `Rendimento interessante al prezzo attuale. Rischio Alto influenza la strategia del Competitor, non la crescita deterministica.`
  };
  return profiles[label];
}

// Round each month's nominal value to the nearest whole Solaro (ties upward).
export function updateMarketValues(state) {
  if (state.gameOver || state.lastInflationMonth >= state.month) return false;
  state.properties.forEach(p => { p.valore = Math.round(p.valore * (1 + CONFIG.monthlyInflationRate)); });
  state.lastInflationMonth = state.month;
  return true;
}

export function totalsForOwner(state, owner) {
  const owned = state.properties.filter(p => p.owner === owner);
  const cash = owner === 'player' ? state.playerCash : state.cpuCash;
  const value = owned.reduce((sum, p) => sum + p.valore, 0);
  const income = owned.reduce((sum, p) => sum + p.rendita, 0);
  const costs = owned.reduce((sum, p) => sum + p.costo, 0);
  const netIncome = income - costs;
  return { count: owned.length, cash, value, income, costs, netIncome, netWorth: cash + value };
}

export function categoryCounts(properties, owner) {
  return CATEGORIES.reduce((acc, category) => {
    acc[category] = properties.filter(p => p.owner === owner && p.categoria === category).length;
    return acc;
  }, {});
}
