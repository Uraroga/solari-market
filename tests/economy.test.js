import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, buyProperty, advanceMonth, finishGame, saveStateToStorage, loadStateFromStorage } from '../js/game.js';
import { CONFIG } from '../js/data.js';
import * as market from '../js/market.js';
import { runCpuTurn, evaluatePropertyForCpu, shouldCpuBuy } from '../js/cpu.js';
import { opportunities } from '../js/presentation.js';
const storage = () => { const m = new Map(); return {getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)}; };
test('central purchase cap survives save/reload; invalid buyers and fourth purchase have no side effects', () => {
 let s=createInitialState(); s.playerCash=1000000;
 assert.equal(buyProperty(s,s.properties[0].id,'intruder'),false);
 for (const p of s.properties.slice(0,3)) assert.equal(buyProperty(s,p.id),true);
 const disk=storage(); saveStateToStorage(s,disk); s=loadStateFromStorage(disk);
 const before=JSON.stringify(s); assert.equal(buyProperty(s,s.properties[3].id),false); assert.equal(JSON.stringify(s),before);
 advanceMonth(s); assert.equal(buyProperty(s,s.properties[3].id),true);
});
test('Competitor re-ranks category diversity after each purchase and central cap cannot be bypassed', () => {
 const s=createInitialState(); s.cpuCash=1000000;
 s.properties=['a','b','c','d'].map((id,i)=>({id,nome:id,prezzo:10000,valore:10000,rendita:300-i,costo:0,rischio:'Basso',categoria:i<2?'Terreni':'Uffici',owner:null}));
 const bought=runCpuTurn(s);
 assert.deepEqual(bought.map(p=>p.id),['a','c','b']);
 assert.equal(s.purchasesThisMonth.cpu,3);
 assert.deepEqual(runCpuTurn(s),[]);
 assert.equal(buyProperty(s,'d','cpu'),false);
 const poor=createInitialState(); poor.cpuCash=20000; assert.deepEqual(runCpuTurn(poor),[]);
});

test('Competitor strategy changes by game phase without rewarding weak diversification', () => {
 const state=createInitialState(); state.cpuCash=100000;
 const marginal={id:'marginal',nome:'Marginale',prezzo:20000,valore:20000,rendita:390,costo:0,rischio:'Basso',categoria:'Terreni',owner:null};
 state.month=20; assert.equal(shouldCpuBuy(marginal,state),true);
 state.month=21; assert.equal(shouldCpuBuy(marginal,state),false);
 const balanced={...marginal,id:'balanced',nome:'Bilanciato',rendita:430};
 state.month=45; assert.equal(shouldCpuBuy(balanced,state),true);
 state.month=46; assert.equal(shouldCpuBuy(balanced,state),false);
 const weakDiversifier={...marginal,id:'weak',nome:'Debole',rendita:100,categoria:'Ville'};
 for (const month of [1,20,21,45,46,60]) { state.month=month; assert.equal(shouldCpuBuy(weakDiversifier,state),false); }
});

test('profitable high-risk property is no longer over-penalized', () => {
 const state=createInitialState(); state.month=10; state.cpuCash=100000;
 const profitable={id:'high-return',nome:'Alto ritorno',prezzo:20000,valore:20000,rendita:600,costo:0,rischio:'Alto',categoria:'Negozi',owner:null};
 assert.equal(shouldCpuBuy(profitable,state),true);
 const safe={...profitable,id:'safe-return',nome:'Ritorno sicuro',rischio:'Basso'};
 assert.ok(evaluatePropertyForCpu(safe,state) > evaluatePropertyForCpu(profitable,state));
});

test('shared minimum cash reserve blocks player and Competitor purchases atomically', () => {
 assert.equal(CONFIG.minimumCashReserve, 20000);
 const playerState=createInitialState();
 playerState.playerCash=30000;
 const beforePlayer=JSON.stringify(playerState);
 assert.equal(buyProperty(playerState, playerState.properties[0].id, 'player'), false);
 assert.equal(JSON.stringify(playerState), beforePlayer);
 const exactReserve=createInitialState();
 exactReserve.playerCash=market.purchasePrice(exactReserve.properties[0]) + CONFIG.minimumCashReserve;
 assert.equal(buyProperty(exactReserve, exactReserve.properties[0].id, 'player'), true);
 assert.equal(exactReserve.playerCash, CONFIG.minimumCashReserve);
 const competitorState=createInitialState();
 competitorState.cpuCash=CONFIG.minimumCashReserve + 9999;
 competitorState.properties=[{id:'deal',nome:'Affare',prezzo:10000,valore:10000,rendita:900,costo:0,rischio:'Basso',categoria:'Uffici',owner:null}];
 const beforeCompetitor=JSON.stringify(competitorState);
 assert.equal(shouldCpuBuy(competitorState.properties[0], competitorState), false);
 assert.deepEqual(runCpuTurn(competitorState), []);
 assert.equal(JSON.stringify(competitorState), beforeCompetitor);
});

test('deterministic inflation reaches every property once per month; no rent/cost changes or random calls', () => {
 assert.equal(CONFIG.monthlyInflationRate,.0025);
 const s=createInitialState(); buyProperty(s,s.properties[0].id);
 const before=s.properties.map(p=>({...p}));
 const random=Math.random; Math.random=()=>{throw Error('random forbidden');};
 try {
  market.updateMarketValues(s); const inflated=s.properties.map(p=>p.valore);
  market.updateMarketValues(s); assert.deepEqual(s.properties.map(p=>p.valore),inflated);
  advanceMonth(s);
  s.properties.forEach((p,i)=>{assert.equal(p.valore,Math.round(before[i].valore*1.0025)); assert.equal(p.rendita,before[i].rendita); assert.equal(p.costo,before[i].costo);});
  assert.equal(s.playerCash,88040);
  assert.equal(s.lastInflationMonth,1);
 } finally {Math.random=random;}
});

test('current value is shared purchase price, affordability, ranking and profile denominator', () => {
 const s=createInitialState(); const p=s.properties[0]; p.valore=200000;
 assert.equal(buyProperty(s,p.id),false);
 assert.equal(market.purchasePrice(p),200000);
 assert.ok(!opportunities(s).includes(p));
 assert.equal(shouldCpuBuy(p,s),false);
 const beforeScore=evaluatePropertyForCpu({...p,valore:12000},s);
 assert.ok(evaluatePropertyForCpu(p,s)<beforeScore);
 const tower=s.properties.find(p=>p.id==='torre-meridiana'); tower.valore=100000;
 assert.equal(market.investmentLabel(tower),'Rischioso');
 p.valore=12345; const worth=market.totalsForOwner(s,'player').netWorth;
 assert.equal(buyProperty(s,p.id),true); assert.equal(s.playerCash,87655);
 assert.equal(market.totalsForOwner(s,'player').netWorth,worth);
 assert.ok(s.log[0].includes(market.formatSolari(12345)));
 assert.equal(p.prezzo,12000);
});

test('sixty full monthly cycles, deterministic growth, stable flows and draw; final state is immutable', () => {
 const s=createInitialState(); s.properties.forEach(p=>{p.owner='player';});
 const t=market.totalsForOwner(s,'player'); const values=s.properties.map(p=>p.valore);
 for(let i=1;i<=60;i++) { assert.equal(s.month,i); assert.equal(s.gameOver,false); advanceMonth(s); values.forEach((v,j)=>values[j]=Math.round(v*1.0025)); assert.deepEqual(s.properties.map(p=>p.valore),values); assert.equal(s.playerCash,100000+i*t.netIncome); }
 assert.equal(s.month,60); assert.equal(s.gameOver,true); assert.equal(s.lastInflationMonth,60);
 assert.equal(market.totalsForOwner(s,'player').netWorth,s.playerCash+values.reduce((a,b)=>a+b,0));
 const snapshot=JSON.stringify(s); advanceMonth(s); market.updateMarketValues(s); assert.equal(JSON.stringify(s),snapshot);
 const tie=createInitialState(); finishGame(tie); assert.equal(tie.winner,'draw');
});

test('legacy migration preserves finances and values, reserves unknown monthly slots without inferring capped logs', () => {
 const s=createInitialState(); s.month=17; s.playerCash=1234; s.properties[0].owner='player'; s.properties[0].valore=11700;
 delete s.purchasesThisMonth; delete s.lastInflationMonth; delete s.schemaVersion; s.playerBoughtThisMonth=false;
 s.log=['Mese 16 - CPU acquista Casa.','Mese 16 - Evento: vecchio mercato.'];
 const disk=storage(); saveStateToStorage(s,disk); let loaded=loadStateFromStorage(disk);
 assert.equal(loaded.playerCash,1234); assert.deepEqual(loaded.properties,s.properties);
 assert.deepEqual(loaded.purchasesThisMonth,{player:3,cpu:3}); assert.equal(loaded.lastInflationMonth,16); assert.equal(loaded.schemaVersion,2);
 assert.ok(loaded.log.every(x=>!x.includes('CPU'))); assert.ok(loaded.log.some(x=>x.includes('Storico precedente')));
 saveStateToStorage(loaded,disk); assert.deepEqual(loadStateFromStorage(disk),loaded);
 advanceMonth(loaded); assert.deepEqual(loaded.purchasesThisMonth,{player:0,cpu:0});
 assert.equal(loaded.properties[0].valore,11729);
});

test('malformed modern counters cannot reopen the cap; invalid economy saves are rejected', () => {
 const disk=storage();
 for(const counts of [undefined,{player:-1,cpu:0},{player:0.5,cpu:0},{player:4,cpu:0}]){
  const s=createInitialState();s.purchasesThisMonth=counts;saveStateToStorage(s,disk);assert.equal(loadStateFromStorage(disk),null);
 }
 for(const mutate of [s=>s.month=61,s=>s.month=1.5,s=>s.playerCash=null,s=>s.properties[0].valore=-10,s=>s.lastInflationMonth=61]){
  const s=createInitialState();mutate(s);saveStateToStorage(s,disk);assert.equal(loadStateFromStorage(disk),null);
 }
});
test('completed legacy tie is corrected without replaying historical months',()=>{
 const s=createInitialState();delete s.schemaVersion;delete s.purchasesThisMonth;s.gameOver=true;s.winner='player';s.month=60;
 const disk=storage();saveStateToStorage(s,disk);const loaded=loadStateFromStorage(disk);assert.equal(loaded.winner,'draw');assert.equal(loaded.lastInflationMonth,60);
 const before=JSON.stringify(loaded);advanceMonth(loaded);assert.equal(JSON.stringify(loaded),before);
});

test('whole-Solaro half-increments round upwards without multiplier floating-point loss',()=>{
 const s=createInitialState();s.properties[0].valore=13400;market.updateMarketValues(s);assert.equal(s.properties[0].valore,13434);
});
test('Competitor keeps profitable high-risk assets eligible and stops at 0, 1, 2 or 3 affordable purchases',()=>{
 const s=createInitialState();s.cpuCash=1000000;
 s.properties=['a','b','c','d'].map((id,i)=>({id,nome:id,prezzo:10000,valore:10000,rendita:[800,790,250,240][i],costo:0,rischio:i<2?'Alto':'Basso',categoria:'Uffici',owner:null}));
 assert.deepEqual(runCpuTurn(s).map(p=>p.id),['a','b','c']);
 for(const [price,count] of [[90000,0],[60000,1],[30000,2],[10000,3]]){
  const s=createInitialState();s.properties=['a','b','c','d'].map(id=>({id,nome:id,prezzo:price,valore:price,rendita:price*.03,costo:0,rischio:'Basso',categoria:'Uffici',owner:null}));
  assert.equal(runCpuTurn(s).length,count);assert.ok(s.cpuCash>=CONFIG.minimumCashReserve);assert.equal(s.purchasesThisMonth.cpu,count);
 }
});
test('missing direct-call counters fail closed, not open or throwing',()=>{
 const s=createInitialState();delete s.purchasesThisMonth;assert.equal(buyProperty(s,s.properties[0].id),false);
});

test('reload retains inflation marker and Competitor slots; rejected transactions are atomic',()=>{
 let s=createInitialState();runCpuTurn(s);market.updateMarketValues(s);const disk=storage();saveStateToStorage(s,disk);s=loadStateFromStorage(disk);
 const before=JSON.stringify(s);assert.deepEqual(runCpuTurn(s),[]);assert.equal(market.updateMarketValues(s),false);
 assert.equal(buyProperty(s,'missing'),false);assert.equal(buyProperty(s,s.properties.find(p=>p.owner==='cpu').id),false);assert.equal(JSON.stringify(s),before);
 for(let month=1;month<=60;month++)advanceMonth(s);
 saveStateToStorage(s,disk);assert.deepEqual(loadStateFromStorage(disk),s);
});
