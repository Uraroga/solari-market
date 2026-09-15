# Solari Market

Marketplace immobiliare e gioco gestionale locale in HTML/CSS/JavaScript ES modules. Nessun backend, account, API applicativa o asset remoto. I **Solari (S)** sono solo valuta di gioco.

## Avvio locale

Richiede Python 3; dalla cartella del progetto:

```bash
npm start
```

Apri **http://127.0.0.1:8763**. Non servono dipendenze npm per giocare. Il server ascolta soltanto su localhost; non terminare eventuali processi sconosciuti già presenti sulla porta.

## Regole attuali

- Sergio e **Competitor** iniziano con **100.000 S** ciascuno; 20 immobili, cinque categorie.
- **Massimo 3 acquisti per partecipante per mese**, controllato nella transazione centrale e persistito al reload. Il quarto tentativo non addebita denaro.
- **Prezzo d'acquisto = valore corrente**, attraverso `purchasePrice`: catalogo, ricerca/ordinamento, opportunità, profili, disponibilità, ricevute e strategia avversaria usano lo stesso dato. `prezzo` nei dati rimane la baseline iniziale, non il prezzo operativo.
- Ogni ciclo accredita rendite e sottrae costi di entrambi, applica **+0,25%** a tutti gli immobili (anche liberi), poi esegue Competitor. `CONFIG.monthlyInflationRate = 0.0025`.
- Valori interi: `Math.round(valore * 1.0025)` ogni mese, al Solaro più vicino, metà verso l'alto. Il marker persistito `lastInflationMonth` impedisce una seconda applicazione nello stesso mese.
- **Nessun mercato casuale, deprezzamento o evento. Rendite e costi fissi.** Il rischio resta un criterio prudenziale del Competitor, non una probabilità di perdita.
- Giocatore e Competitor devono mantenere la stessa riserva minima: **20.000 S** (`CONFIG.minimumCashReserve`). Un acquisto è valido solo se la liquidità residua resta almeno a 20.000 S.
- Competitor può comprare **0–3 beni**. Dopo ogni acquisto rifà il ranking usando liquidità, categorie e concentrazione di rischio aggiornate, applicando lo stesso vincolo di riserva del giocatore. Non è un LLM né una strategia ottimale.
- **60 cicli completi: mese 1 fino a mese 60**, quindi 60 avanzamenti. Il giocatore compra prima del flusso mensile; Competitor dopo flussi e inflazione, incassando dal ciclo seguente.
- Vince **liquidità + valore corrente degli immobili** più alto; uguaglianza = **pareggio**. Il controllo d'insolvenza anticipata resta presente, ma non è raggiungibile nel normale bilanciamento attuale.
- Non esistono rivendita, credito, sviluppo dei terreni o rendimenti sulla liquidità. **`INITIAL_PROPERTIES` è integralmente invariato**, anche nelle descrizioni originali.

## Interfaccia

Home con HUD, contatore acquisti, tre opportunità ordinate per netto/prezzo corrente, categorie, catalogo e filtri. Dettaglio con prezzo, netto, regole esplicite, limite mensile e ricevuta; I miei immobili con aggregati; Portafoglio TU/Competitor con crescita reale rispetto al capitale iniziale. Pannello avversario e ultime tre attività, archivio per mese, massimo 30 righe. Rimosso il callout dei vecchi eventi.

Onboarding persistente, dialoghi con focus/tastiera, conferma prima del reset, finale con pareggio e revisione del portafoglio. Nessun redesign in questa revisione. Il link dell'header **Sostieni il progetto** resta invariato: `https://paypal.me/uraroga`, nuova scheda, separato dal gioco.

## Salvataggi e migrazione

La chiave resta **`solari-market-save-v1`**, con contenuto **schemaVersion 2**. Mese, capitali, beni, valori, log, contatori, ultimo mese inflazionato ed esito vengono salvati insieme. Cambiare browser, host o porta cambia lo spazio localStorage.

I salvataggi precedenti validi mantengono mese, capitali, proprietari e valori storici: **nessuna rivalutazione retroattiva e nessun azzeramento del patrimonio**. I log originali sono marcati “Storico precedente” e la denominazione diventa Competitor.

**I conteggi mensili storici non sono ricostruibili da un booleano o da 30 log troncati.** Per non inventarli e non aprire un aggiramento, la migrazione riserva tutti gli slot a entrambi per il solo mese in corso; un messaggio lo spiega. Al prossimo mese i contatori ripartono da zero. È una restrizione prudenziale di transizione, non l'affermazione di tre acquisti avvenuti. Nel vecchio mese 60 non viene aggiunto un mese di recupero. Un finale storico a patrimoni uguali viene corretto in pareggio.

I salvataggi corrotti/versioni sconosciute vengono rifiutati e il normale avvio salva una nuova partita; **non c'è backup automatico del JSON scartato**. Salvare una copia prima di modificarlo manualmente. La validazione non è un anti-cheat e più schede non sono sincronizzate. Se lo storage è negato il gioco prosegue in memoria con avviso.

## Verifica riproducibile

Dipendenze solo di sviluppo: Node/npm e Chromium Playwright.

```bash
npm ci
npx playwright install chromium
npm run test:all
node scripts/analyze-economy.mjs
```

- `npm test`: motore, cap, migrazione, 60 cicli, determinismo, prezzi, ranking e integrità della baseline/asset.
- `npm run test:ui`: browser reali Chromium, percorsi utente e moduli, reload, console, axe, 1280×720 e larghezze 390/320. I nuovi test economia generano screenshot `reports/economy-*.png`; le fixture di prezzi/capitale modificati sono esplicitamente test sintetici.
- Il runner avvia un server locale oppure riusa quello sulla porta 8763: verificare che serva **questo progetto**.
- `node scripts/analyze-economy.mjs`: genera `reports/economy-analysis.json` e `.md` con tutti i 20 beni, confronti ponderati e tre strategie deterministiche reali. Non modifica i dati del gioco.
- `npm run screenshots`: catture generali in `reports/after/`, con server già avviato. `npm run art`: rigenerazione degli SVG locali.

Esiti e limiti della revisione: **[reports/ECONOMY-REVISION.md](reports/ECONOMY-REVISION.md)**. Specifica completa, tutte le 18 sezioni: **[GAME_DESIGN.md](GAME_DESIGN.md)**. Analisi categorie: **[reports/economy-analysis.md](reports/economy-analysis.md)**.

I report del precedente redesign (`TEST-REPORT.md`, `DESIGN-AUDIT.md`, `economy-baseline.json`, screenshot before/after già esistenti) sono evidenze storiche, non attestazioni delle regole attuali. Non rieseguire `tests/inspect-before.mjs`: sovrascriverebbe la baseline storica.

## Bilanciamento: dati preservati, limiti misurati

Netto mensile ponderato sul capitale iniziale: Terreni **0,243%**, Appartamenti **2,290%**, Negozi **2,670%**, Uffici **2,630%**, Ville **1,484%**. Con inflazione uguale per tutti, terreni e ville non hanno un premio percentuale patrimoniale speciale. I terreni sono accessibili e rendono più della liquidità inattiva se mantenuti, ma assorbono capitale e slot con ritorno debole, senza rivendita.

Una proposta separata è portare il netto dei terreni verso l'1% mensile iniziale, da sottoporre a playtest. **Non è applicata**: nessuna modifica automatica a prezzi, rendite, costi, rischi o descrizioni di `INITIAL_PROPERTIES`.

## Struttura

```text
index.html / css/style.css     Shell e stile preservato; testi economia aggiornati
js/app.js / js/ui.js           Avvio, rendering, interazioni e persistenza
js/data.js                    Configurazione e baseline originale
js/game.js                    Transazione centrale, cicli, finale, migrazione
js/market.js                  Prezzo condiviso, inflazione, profili e aggregati
js/cpu.js                     Valutazione sequenziale Competitor
js/presentation.js            Ranking informativo Home
assets/                       Marchio, categorie, 20 immobili SVG
scripts/analyze-economy.mjs    Analisi numerica riproducibile
 tests/                       Test Node e Playwright, catture
reports/                      Evidenze storiche e nuova revisione
```
