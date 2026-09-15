import { test, expect } from '@playwright/test';
for (const width of [1280, 390]) {
 test(`economy purchase cap and current pricing persist at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:width===1280?720:844});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('/');
  await expect(page.locator('#onboarding-modal')).toContainText('3 acquisti');
  await expect(page.locator('#onboarding-modal')).toContainText('0,25%');
  await page.locator('#onboarding-start').click();
  await page.evaluate(async()=>{
   const g=await import('/js/game.js'); const s=g.createInitialState(); s.onboardingDismissed=true; s.playerCash=1000000;
   s.properties[0].valore=99000; s.properties[1].valore=11000;
   g.saveStateToStorage(s);
  });
  await page.reload();
  await expect(page.locator('#catalog .card').first()).toContainText('Campo Lunare');
  await page.locator('#search').fill('aurora');
  await expect(page.locator('#catalog .card')).toContainText('99.000 S');
  await page.locator('#search').fill('');
  for (const [id,price] of [['campo-lunare','11.000'],['terreno-aurora','99.000'],['lotto-zenit','21.000']]) {
   await page.locator(`#catalog [data-detail="${id}"]`).click();
   await expect(page.locator('#buy-button')).toHaveText(`Acquista · ${price} S`);
   await page.locator('#buy-button').click();
   await expect(page.locator('#purchase-dialog')).toContainText(`−${price} S`);
   await page.locator('#purchase-close').click();
  }
  await expect(page.locator('#next-step')).toContainText('3 / 3');
  await page.reload();
  await page.locator('#catalog [data-detail="podere-cristallo"]').click();
  await expect(page.locator('#buy-button')).toBeDisabled();
  await expect(page.locator('#detail-content')).toContainText('Limite mensile');
  await page.screenshot({path:`reports/economy-${width}-cap.png`,fullPage:true});
  await page.locator('#next-month').click();
  await expect(page.locator('#month-label')).toHaveText('Mese 2 / 60');
  await expect(page.locator('#buy-button')).toBeEnabled();
  await expect(page.locator('#buy-button')).toHaveText('Acquista · 28.070 S');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('solari-market-save-v1')));
  expect(saved.playerCash).toBe(869115); expect(saved.lastInflationMonth).toBe(1);
  expect(saved.properties.filter(p=>p.owner==='cpu').length).toBeLessThanOrEqual(3);
  await page.locator('#nav-portfolio').click();
  await expect(page.locator('.compare-cpu')).toContainText('Competitor');
  expect(await page.locator('body').innerText()).not.toMatch(/\bCPU\b|oscillazioni|imprevisti/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`reports/economy-${width}-portfolio.png`,fullPage:true});
  expect(errors).toEqual([]);
 });
}
test('browser engine: 60 cycles, once-only inflation, no randomness, stable economics, draw reload and legacy migration',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const g=await import('/js/game.js'), m=await import('/js/market.js'), c=await import('/js/cpu.js');
  const original=Math.random; Math.random=()=>{throw Error('Random call in economy');};
  try {
   const seq=g.createInitialState(); seq.cpuCash=1000000;
   seq.properties=['a','b','c','d'].map((id,i)=>({id,nome:id,prezzo:10000,valore:10000,rendita:300-i,costo:0,rischio:'Basso',categoria:i<2?'Terreni':'Uffici',owner:null}));
   const picks=c.runCpuTurn(seq).map(p=>p.id); const fourth=g.buyProperty(seq,'d','cpu');
   const s=g.createInitialState(); const values=s.properties.map(p=>p.valore), flows=s.properties.map(p=>[p.rendita,p.costo]);
   for(let month=1;month<=60;month++) {
    if(s.month!==month||s.gameOver)throw Error('bad month');
    m.updateMarketValues(s);m.updateMarketValues(s);g.advanceMonth(s);
    s.properties.forEach((p,i)=>{values[i]=Math.round(values[i]*1.0025);if(p.valore!==values[i])throw Error('inflation');});
   }
   const snapshot=JSON.stringify(s);g.advanceMonth(s);
   const tie=g.createInitialState();tie.month=60;tie.onboardingDismissed=true;tie.properties.forEach(p=>p.owner='player');tie.properties=[];
   g.advanceMonth(tie);g.saveStateToStorage(tie);
   return {picks,fourth,finished:s.gameOver,last:s.lastInflationMonth,unchanged:snapshot===JSON.stringify(s),flows:s.properties.map(p=>[p.rendita,p.costo]),initialFlows:flows,winner:tie.winner};
  } finally {Math.random=original;}
 });
 expect(result.picks).toEqual(['a','c','b']);expect(result.fourth).toBe(false);expect(result.finished).toBe(true);expect(result.last).toBe(60);expect(result.unchanged).toBe(true);expect(result.flows).toEqual(result.initialFlows);expect(result.winner).toBe('draw');
 // Keep a real catalog on the saved draw fixture: no owner, equal cash, finished.
 await page.evaluate(async()=>{const g=await import('/js/game.js'); const s=g.createInitialState();s.month=60;s.lastInflationMonth=60;s.onboardingDismissed=true;g.finishGame(s);g.saveStateToStorage(s);});
 await page.reload();await expect(page.locator('#final-title')).toContainText('Pareggio');await expect(page.locator('#next-month')).toBeDisabled();
 await page.evaluate(async()=>{const g=await import('/js/game.js');const s=g.createInitialState();s.month=9;s.onboardingDismissed=true;s.log=['Mese 8 - CPU compra.','Mese 8 - Evento: precedente.'];delete s.schemaVersion;delete s.purchasesThisMonth;delete s.lastInflationMonth;g.saveStateToStorage(s);});
 await page.reload();await expect(page.locator('#next-step')).toContainText('3 / 3');await expect(page.locator('#activity-log')).toContainText('Storico precedente');
 expect(await page.locator('body').innerText()).not.toMatch(/\bCPU\b/);
 await page.locator('#next-month').click(); await page.reload(); await expect(page.locator('#next-step')).toContainText('0 / 3');expect(errors).toEqual([]);
});
