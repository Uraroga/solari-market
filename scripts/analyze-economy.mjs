import { writeFileSync } from 'node:fs';
import { CONFIG, CATEGORIES, INITIAL_PROPERTIES } from '../js/data.js';
import { createInitialState, advanceMonth, buyProperty } from '../js/game.js';
import { netMonthly, totalsForOwner } from '../js/market.js';
const properties = INITIAL_PROPERTIES.map(p => {
  let finalValue=p.valore;
  for(let month=1;month<=CONFIG.totalMonths;month++) finalValue=Math.round(finalValue*(1+CONFIG.monthlyInflationRate));
  const net=netMonthly(p), netCash60=net*CONFIG.totalMonths;
  return {id:p.id,name:p.nome,category:p.categoria,initialPrice:p.prezzo,netMonthly:net,monthlyYieldPct:100*net/p.prezzo,finalValue60:finalValue,netCash60,gain60:netCash60+finalValue-p.prezzo,totalReturn60Pct:100*(netCash60+finalValue-p.prezzo)/p.prezzo,cashPaybackMonths:p.prezzo/net};
});
const categories=CATEGORIES.map(category=>{
 const rows=properties.filter(p=>p.category===category),sum=key=>rows.reduce((a,p)=>a+p[key],0);
 return {category,price:sum('initialPrice'),net:sum('netMonthly'),weightedMonthlyYieldPct:100*sum('netMonthly')/sum('initialPrice'),weightedReturn60Pct:100*sum('gain60')/sum('initialPrice'),minYieldPct:Math.min(...rows.map(p=>p.monthlyYieldPct)),maxYieldPct:Math.max(...rows.map(p=>p.monthlyYieldPct))};
});
const scenarios=[];
for(const strategy of ['wait','net-yield','terrain-first']){
 const s=createInitialState(), purchases=[];
 while(!s.gameOver){
  if(strategy!=='wait'){
   const ranked=s.properties.filter(p=>!p.owner).sort((a,b)=>{
    const terrain= strategy==='terrain-first' ? Number(b.categoria==='Terreni')-Number(a.categoria==='Terreni') : 0;
    return terrain || netMonthly(b)/b.valore-netMonthly(a)/a.valore || a.valore-b.valore;
   });
   for(const p of ranked)if(buyProperty(s,p.id))purchases.push({month:s.month,id:p.id,price:p.valore});
  }
  advanceMonth(s);
 }
 scenarios.push({strategy,winner:s.winner,player:totalsForOwner(s,'player'),competitor:totalsForOwner(s,'cpu'),playerPurchases:purchases,competitorProperties:s.properties.filter(p=>p.owner==='cpu').map(p=>p.id)});
}
const result={method:'Single-asset initial purchase held for 60 full cycles: net cash is not reinvested; all monthly integer rounding included. Category returns are capital-weighted. Scenarios use real game engine, deterministic heuristics, not optimal play or win-rate estimates.',properties,categories,scenarios};
writeFileSync(new URL('../reports/economy-analysis.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
const pct=x=>x.toFixed(3)+'%';
const table='| Categoria | Netto mensile / capitale | Rendimento totale 60 mesi | Intervallo netto mensile |\n|---|---:|---:|---:|\n'+categories.map(c=>`| ${c.category} | ${pct(c.weightedMonthlyYieldPct)} | ${pct(c.weightedReturn60Pct)} | ${pct(c.minYieldPct)}–${pct(c.maxYieldPct)} |`).join('\n');
writeFileSync(new URL('../reports/economy-analysis.md',import.meta.url),'# Analisi riproducibile\n\n'+result.method+'\n\n'+table+'\n\n| Terreno | Netto/mese | Valore finale | Netto 60 mesi | Ritorno totale |\n|---|---:|---:|---:|---:|\n'+properties.filter(p=>p.category==='Terreni').map(p=>`| ${p.name} | ${p.netMonthly} S | ${p.finalValue60} S | ${p.netCash60} S | ${pct(p.totalReturn60Pct)} |`).join('\n')+'\n\n| Strategia deterministica | Patrimonio giocatore | Patrimonio Competitor | Esito |\n|---|---:|---:|---|\n'+scenarios.map(s=>`| ${s.strategy} | ${s.player.netWorth} S | ${s.competitor.netWorth} S | ${s.winner} |`).join('\n')+'\n');
console.log(table);console.log(scenarios.map(s=>({strategy:s.strategy,player:s.player.netWorth,competitor:s.competitor.netWorth,winner:s.winner})));
