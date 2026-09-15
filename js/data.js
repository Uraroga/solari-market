export const CONFIG = {
  initialCash: 100000,
  totalMonths: 60,
  maxPurchasesPerMonth: 3,
  monthlyInflationRate: 0.0025,
  minimumCashReserve: 20000,
  playerName: 'Sergio',
  currencyName: 'Solari',
  currencySymbol: 'S',
  maxLogEntries: 30,
  storageKey: 'solari-market-save-v1'
};

export const CATEGORIES = ['Terreni', 'Appartamenti', 'Negozi', 'Uffici', 'Ville'];
export const RISKS = ['Basso', 'Medio', 'Alto'];

export const INITIAL_PROPERTIES = [
  { id:'terreno-aurora', nome:'Terreno Aurora', categoria:'Terreni', prezzo:12000, rendita:80, costo:40, valore:12000, rischio:'Basso', descrizione:'Lotto agricolo vicino a una nuova direttrice urbana, poco redditizio ma stabile.' },
  { id:'campo-lunare', nome:'Campo Lunare', categoria:'Terreni', prezzo:15000, rendita:60, costo:35, valore:15000, rischio:'Basso', descrizione:'Area pianeggiante con costi contenuti e prospettive di rivalutazione graduale.' },
  { id:'lotto-zenit', nome:'Lotto Zenit', categoria:'Terreni', prezzo:21000, rendita:120, costo:70, valore:21000, rischio:'Medio', descrizione:'Terreno edificabile in zona emergente, più volatile ma interessante nel lungo periodo.' },
  { id:'podere-cristallo', nome:'Podere Cristallo', categoria:'Terreni', prezzo:28000, rendita:160, costo:90, valore:28000, rischio:'Medio', descrizione:'Grande lotto periferico con manutenzione leggera e potenziale patrimoniale.' },
  { id:'residenza-solaris', nome:'Residenza Solaris', categoria:'Appartamenti', prezzo:22000, rendita:760, costo:210, valore:22000, rischio:'Basso', descrizione:'Appartamento compatto in stabile efficiente, buoni canoni e rischi limitati.' },
  { id:'loft-prisma', nome:'Loft Prisma', categoria:'Appartamenti', prezzo:26000, rendita:880, costo:260, valore:26000, rischio:'Medio', descrizione:'Loft moderno richiesto da professionisti, rende bene ma richiede cura.' },
  { id:'attico-nuvola', nome:'Attico Nuvola', categoria:'Appartamenti', prezzo:34000, rendita:1080, costo:360, valore:34000, rischio:'Medio', descrizione:'Unità panoramica con valore solido e costi condominiali superiori.' },
  { id:'casa-miraggio', nome:'Casa Miraggio', categoria:'Appartamenti', prezzo:18000, rendita:570, costo:170, valore:18000, rischio:'Basso', descrizione:'Soluzione accessibile, rendimento moderato e facile da mantenere.' },
  { id:'bottega-centrale', nome:'Bottega Centrale', categoria:'Negozi', prezzo:30000, rendita:1350, costo:520, valore:30000, rischio:'Medio', descrizione:'Spazio commerciale in passaggio pedonale, buon margine netto con costi sensibili.' },
  { id:'emporio-vela', nome:'Emporio Vela', categoria:'Negozi', prezzo:24000, rendita:1040, costo:440, valore:24000, rischio:'Medio', descrizione:'Negozio di quartiere con domanda costante e ritorno equilibrato.' },
  { id:'galleria-orione', nome:'Galleria Orione', categoria:'Negozi', prezzo:42000, rendita:2050, costo:860, valore:42000, rischio:'Alto', descrizione:'Locale ampio in area commerciale competitiva: alto incasso, alta esposizione.' },
  { id:'chiosco-riviera', nome:'Chiosco Riviera', categoria:'Negozi', prezzo:16000, rendita:620, costo:250, valore:16000, rischio:'Medio', descrizione:'Piccolo punto vendita stagionale con prezzo sostenibile.' },
  { id:'uffici-zenith', nome:'Uffici Zenith', categoria:'Uffici', prezzo:28000, rendita:1260, costo:500, valore:28000, rischio:'Medio', descrizione:'Uffici flessibili per piccole imprese, reddito interessante e gestione attiva.' },
  { id:'studio-cometa', nome:'Studio Cometa', categoria:'Uffici', prezzo:19000, rendita:760, costo:260, valore:19000, rischio:'Basso', descrizione:'Studio professionale essenziale, stabile e con margine prudente.' },
  { id:'torre-meridiana', nome:'Torre Meridiana', categoria:'Uffici', prezzo:52000, rendita:2450, costo:1100, valore:52000, rischio:'Alto', descrizione:'Piano uffici prestigioso: rendimento elevato, sensibilità ai cicli economici.' },
  { id:'hub-eclisse', nome:'Hub Eclisse', categoria:'Uffici', prezzo:36000, rendita:1600, costo:660, valore:36000, rischio:'Medio', descrizione:'Spazio coworking modulare con domanda variabile ma buone prospettive.' },
  { id:'villa-orizzonte', nome:'Villa Orizzonte', categoria:'Ville', prezzo:65000, rendita:1750, costo:760, valore:65000, rischio:'Medio', descrizione:'Villa di pregio con rendimento contenuto rispetto al capitale ma alto valore patrimoniale.' },
  { id:'dimora-alba', nome:'Dimora Alba', categoria:'Ville', prezzo:72000, rendita:1900, costo:850, valore:72000, rischio:'Medio', descrizione:'Residenza signorile in zona tranquilla, adatta a strategie patrimoniali.' },
  { id:'villa-sirena', nome:'Villa Sirena', categoria:'Ville', prezzo:88000, rendita:2450, costo:1220, valore:88000, rischio:'Alto', descrizione:'Immobile esclusivo e costoso, molto esposto alle oscillazioni del lusso.' },
  { id:'casa-giardino', nome:'Casa Giardino', categoria:'Ville', prezzo:48000, rendita:1320, costo:540, valore:48000, rischio:'Basso', descrizione:'Villetta familiare solida, meno redditizia ma difensiva.' }
];
