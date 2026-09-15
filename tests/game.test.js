import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/data.js';
import { evaluatePropertyForCpu, shouldCpuBuy, runCpuTurn } from '../js/cpu.js';
import { advanceMonth, buyProperty, createInitialState, loadStateFromStorage, saveStateToStorage } from '../js/game.js';
import { investmentLabel, investmentProfile, netMonthly, totalsForOwner } from '../js/market.js';

function storageMock() { const data = new Map(); return { getItem:k=>data.has(k)?data.get(k):null, setItem:(k,v)=>data.set(k,v), removeItem:k=>data.delete(k) }; }

test('nuova partita inizializza 60 mesi, capitali e catalogo', () => {
  const state = createInitialState();
  assert.equal(state.month, 1);
  assert.equal(state.playerCash, 100000);
  assert.equal(state.cpuCash, 100000);
  assert.equal(state.properties.length, 20);
  assert.equal(new Set(state.properties.map(p => p.categoria)).size, 5);
});

test('acquisto giocatore aggiorna liquidità, proprietario e patrimonio', () => {
  const state = createInitialState();
  const property = state.properties.find(p => p.id === 'residenza-solaris');
  assert.equal(buyProperty(state, property.id, 'player'), true);
  assert.equal(state.playerCash, 100000 - property.prezzo);
  assert.equal(property.owner, 'player');
  assert.equal(totalsForOwner(state, 'player').count, 1);
  assert.equal(totalsForOwner(state, 'player').netWorth, state.playerCash + property.valore);
});

test('passaggio mese accredita rendite, sottrae costi, aggiorna inflazione e Competitor', () => {
  const state = createInitialState();
  buyProperty(state, 'residenza-solaris', 'player');
  const cashBefore = state.playerCash;
  advanceMonth(state);
  assert.equal(state.month, 2);
  assert.equal(state.playerCash, cashBefore + 550);
  assert.ok(state.log.some(x => x.includes('Inflazione mensile:')));
  assert.ok(state.log.every(x => !x.includes('Evento:')));
  assert.ok(state.properties.some(p => p.valore !== p.prezzo));
  assert.ok(state.properties.some(p => p.owner === 'cpu'));
});

test('Competitor compra un immobile conveniente ma rispetta la riserva minima', () => {
  const state = createInitialState();
  const candidate = state.properties.find(p => p.id === 'bottega-centrale');
  assert.equal(shouldCpuBuy(candidate, state), true);
  const bought = runCpuTurn(state);
  assert.equal(bought.length, 3);
  assert.ok(state.cpuCash >= CONFIG.minimumCashReserve);
  const poorState = createInitialState();
  poorState.cpuCash = CONFIG.minimumCashReserve + candidate.prezzo - 1;
  assert.equal(shouldCpuBuy(candidate, poorState), false);
});

test('salvataggio localStorage e caricamento partita salvata', () => {
  const state = createInitialState();
  buyProperty(state, 'studio-cometa', 'player');
  const storage = storageMock();
  saveStateToStorage(state, storage);
  const loaded = loadStateFromStorage(storage);
  assert.equal(loaded.properties.find(p => p.id === 'studio-cometa').owner, 'player');
  assert.equal(loaded.playerCash, state.playerCash);
});

test('fine al mese 60 dichiara il vincitore', () => {
  const state = createInitialState();
  state.month = 60;
  advanceMonth(state);
  assert.equal(state.gameOver, true);
  assert.equal(state.winner, 'draw');
});

test('valutazione Competitor penalizza rischio alto e valorizza diversificazione', () => {
  const state = createInitialState();
  const low = state.properties.find(p => p.rischio === 'Basso' && !p.owner);
  const high = { ...low, id:'rischio-test', nome:'Rischio Test', rischio:'Alto' };
  assert.ok(evaluatePropertyForCpu(low, state) > evaluatePropertyForCpu(high, state));
});

test('indicatori UI derivano dai dati economici e dalla categoria', () => {
  const state = createInitialState();
  const terreno = state.properties.find(p => p.categoria === 'Terreni');
  const negozio = state.properties.find(p => p.id === 'bottega-centrale');
  const torre = state.properties.find(p => p.id === 'torre-meridiana');
  assert.equal(netMonthly(negozio), 830);
  assert.equal(investmentLabel(terreno), 'Crescita lenta');
  assert.equal(investmentLabel(torre), 'Alto potenziale');
  assert.ok(investmentProfile(negozio).length > 40);
});
