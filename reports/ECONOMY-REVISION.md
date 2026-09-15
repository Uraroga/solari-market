# Revisione economica — Solari Market

## Esito verificato

Implementazione locale completata in `/home/sergio/Progetti/solari-market`: **24 test Node + 19 test Chromium = 43 superati**, nessun fallimento, skip o flaky nel run finale. Comandi realmente eseguiti, exit code 0:

```bash
cd /home/sergio/Progetti/solari-market
npm run test:all > reports/economy-test-output.txt 2>&1
node scripts/analyze-economy.mjs
node scripts/verify-evidence.mjs
```

Evidenze primarie: `economy-test-output.txt` (stdout/stderr reali), `browser-results.json` (report Playwright), `economy-verification.json` (conteggi verificati dal codice), `economy-analysis.json` e `.md` (misure, tutti i 20 beni e 5 categorie). La verifica dei titoli conferma **18 sezioni** in GAME_DESIGN.md.

Test browser reali a **1280×720, 390×844 e 320×844**, con navigazione, tastiera, axe, storage negato, cap e reload. Nessun errore pageerror/console.error osservato nei flussi coperti dalle relative asserzioni. Non è una garanzia per tutti i browser o ogni salvataggio alterato. La navigazione PayPal è intercettata solo dal test, evitando dipendenze di rete; URL, attributi e comportamento della UI restano quelli originali.

Nessun publish, push o remote; nessun altro progetto o profilo modificato, nessuna lettura/modifica dei salvataggi reali dell'utente. I test usano contesti Chromium isolati. La cartella non contiene un repository Git: nessun commit/diff Git disponibile; il manifest elenca esplicitamente i file toccati.

## Cosa è cambiato e quali errori sono stati corretti

1. **Acquisti illimitati:** `buyProperty` impone ora il massimo tre per proprietario; rifiuta quarto, proprietario invalido, contatore invalido, bene non disponibile, saldo insufficiente o partita finita. I fallimenti non addebitano, non cambiano proprietà, log o slot.
2. **Competitor separato dalla transazione:** ora passa dalla medesima funzione centrale. Può scegliere 0–3 beni, mantiene 20.000 S e ricalcola dopo ogni acquisizione liquidità, diversificazione e concentrazione Alto. Rimossa la seconda registrazione che avrebbe duplicato l'acquisto usando il nuovo percorso centrale.
3. **Prezzo iniziale diverso dal valore acquistato:** eliminato il potenziale guadagno patrimoniale istantaneo comprando un bene rivalutato al vecchio prezzo. `purchasePrice = valore` alimenta economia, UI, ranking, ordinamento, profili e ricevuta. `prezzo` resta esclusivamente baseline.
4. **Mercato imprevedibile ed eventi:** sostituiti con `monthlyInflationRate: 0.0025`, tutti i beni una volta al mese, anche liberi. `Math.round(valore*1.0025)` compone e arrotonda ogni mese all'intero, metà verso l'alto. Il marker persistito impedisce duplicazioni; rendita/costo non cambiano. Rimosse funzioni random/evento, callout e CSS inutilizzati, oltre agli export inutilizzati `propertyVisual` e `clearSavedState`.
5. **Parità assegnata al giocatore:** corretta con `draw`, anche nella UI e nei finali legacy a mese 60 con patrimoni uguali. I **60 cicli erano già la durata prevista**: mantenuti e verificati integralmente, senza fingere una correzione di off-by-one inesistente.
6. **Conteggi non persistiti:** nuovo schema 2 salva contatori e marker; il reload non riapre gli slot né ripete la rivalutazione. Validazione rafforzata per non accettare contatori corrotti come un nuovo mese.
7. **Terminologia e suggerimenti obsoleti:** Competitor in card, confronto, pannello, onboarding, log e finale; migrazione dei vecchi log. Contatore `n / 3` e messaggio specifico per cap, senza falsa richiesta di liquidità. Rimossi suggerimenti su imprevisti/eventi; spiegato il ruolo solo euristico del rischio.

## Migrazione: decisione esplicita, non conteggi inventati

La chiave `solari-market-save-v1` resta uguale, il contenuto passa a schema 2. Conservati mese, capitali, proprietà e valori storici di un vecchio salvataggio valido. Nessun reset di portafoglio, rivalutazione arretrata o cancellazione dei risultati del vecchio mercato.

I vecchi log erano troncati a 30 righe e il booleano UI non contava gli acquisti: ricostruirli sarebbe una supposizione. **Entrambi hanno tutti gli slot riservati per il solo mese transitorio**; il log lo spiega. Al prossimo ciclo vengono applicati flussi/inflazione ma nessun acquisto Competitor in quel mese; all'apertura del mese seguente entrambi hanno 0/3. A mese 60 non si aggiunge un turno compensativo. `lastInflationMonth` è mese−1 se attivo, mese se concluso. I log precedenti conservano il mese, sono marcati “Storico precedente” e non riattivano vecchi eventi.

Un reload di schema 2 non rimigra. Un salvataggio invalido/versione sconosciuta viene rifiutato; all'avvio la nuova partita viene salvata sopra di esso. **Nessun backup automatico del JSON invalido**, nessun anti-cheat né coordinamento fra schede. Esportare manualmente prima di sperimentare sugli archivi. Questi limiti sono riportati anche in README e design.

## Prove mirate

| Requisito | Verifica reale |
|---|---|
| Cap giocatore / quarto rifiutato | Tre acquisti, snapshot atomico del quarto, salvataggio/reload, sblocco al mese seguente; UI desktop e stretta |
| Cap Competitor / 0–3 | Fixture con liquidità/prezzi per esattamente 0, 1, 2, 3; turno ripetuto e cap diretto; reload del contatore |
| Ranking sequenziale | Fixture categoria produce `a,c,b` invece di graduatoria iniziale `a,b,c`; fixture concentrazione Alto produce `a,c,d`; riserva dopo ogni acquisto |
| Inflazione | Tutti i beni liberi/posseduti; doppia chiamata e reload senza duplicazione; confronto mese per mese su 60 cicli; nessuna svalutazione |
| Assenza casualità/eventi | `Math.random` sostituito da funzione che lancia durante cicli reali; controllo sorgenti senza vecchie funzioni e senza `.prezzo` operativo |
| Prezzo condiviso | Valori modificati in fixture per divergere dalla baseline; affordability, ranking, profilo, card filtrata/ordinata, dettaglio, CTA, ricevuta e addebito verificati |
| Flussi/patrimonio | Flussi identici dopo 60 cicli, cassa mensile esatta e patrimonio `cash + valori`; acquisto a patrimonio invariato |
| Finale | Sessanta avanzamenti UI; mese 60 completo; draw; nessuna mutazione dopo finale; salvataggio/reload finale |
| Persistenza | Nuovo schema, legacy, blocco transitorio, marker inflazione, dati invalidi, storage negato |
| UI | Competitor, assenza callout evento, navigazione completa, supporto invariato, zero overflow nei viewport testati, axe e tastiera |

Traccia TDD osservata durante l'implementazione: fallimenti iniziali su compratore invalido/cap; vecchio turno singolo contro array sequenziale; tasso mancante; acquisto ancora accettato al vecchio prezzo; pareggio ancora `player`; contatori legacy mancanti e corrotti; browser con onboarding privo di 3 acquisti e finale “CPU”. Ogni slice è stata portata a verde prima di proseguire. Il primo nuovo run browser ha avuto **3 fallimenti attesi**, il run finale nessuno. I file `*-progress.txt` sono output intermedi reali (possono contenere errori o vecchi conteggi), **non** l'esito finale.

## Integrità della baseline

`INITIAL_PROPERTIES` è identico alla fotografia presa **prima** degli interventi. Un secondo controllo indipendente ricostruisce `data.js` togliendo solo le due nuove righe CONFIG e confronta l'hash storico già presente:

```text
ecb643945e08cff8d5e3d08816e8ad18505f85d72c09afdb9bd87bb040aba403
```

Il confronto è superato: non sono cambiati prezzo, rendita, costo, valore iniziale, rischio, nome, ID o descrizione di alcun immobile. Il vecchio test che congelava tutti i moduli economici è sostituito da questa integrità dei dati e da test delle nuove regole; non è stato semplicemente disabilitato.

## Terreni e categorie: risultati misurati

Metodo: acquisto al valore iniziale e mantenimento per 60 cicli, netto non reinvestito, rivalutazione con lo stesso arrotondamento mensile del gioco. Rendimento totale = `(60*netto + valore finale - capitale iniziale)/capitale iniziale`; aggregati categoria ponderati per capitale, non medie non ponderate. Non è un rendimento annualizzato o una previsione di vittoria.

| Categoria | Netto mensile / capitale | Rendimento totale 60 mesi | Intervallo netto mensile |
|---|---:|---:|---:|
| Terreni | 0.243% | 30.770% | 0.167%–0.333% |
| Appartamenti | 2.290% | 153.557% | 2.118%–2.500% |
| Negozi | 2.670% | 176.338% | 2.313%–2.833% |
| Uffici | 2.630% | 173.941% | 2.596%–2.714% |
| Ville | 1.484% | 105.173% | 1.398%–1.625% |

| Terreno | Netto/mese | Valore finale | Netto 60 mesi | Ritorno totale |
|---|---:|---:|---:|---:|
| Terreno Aurora | 40 S | 13938 S | 2400 S | 36.150% |
| Campo Lunare | 25 S | 17425 S | 1500 S | 26.167% |
| Lotto Zenit | 50 S | 24395 S | 3000 S | 30.452% |
| Podere Cristallo | 70 S | 32527 S | 4200 S | 31.168% |

| Strategia deterministica | Patrimonio giocatore | Patrimonio Competitor | Esito |
|---|---:|---:|---|
| wait | 100000 S | 315023 S | cpu |
| net-yield | 345608 S | 277834 S | player |
| terrain-first | 170714 S | 333611 S | cpu |

Le tre strategie usano davvero `buyProperty` e `advanceMonth` fino alla conclusione: `wait` non compra; `net-yield` ordina per netto/valore corrente e compra fino al cap/fondi; `terrain-first` antepone i terreni e poi usa lo stesso ranking. Non sono ottimizzate e **tre scenari deterministici non stimano un win rate**.

**Interpretazione:** Negozi e Uffici sono le categorie a maggior rendimento relativo; Appartamenti hanno prezzi accessibili e flussi forti. Le Ville rendono meno in percentuale nonostante l'alto valore nominale. I Terreni sono deboli: netto di soli 25–70 S, rientro del prezzo mediante soli canoni in **300/600/420/400 mesi** rispettivamente Aurora/Campo/Lotto/Podere. Non esiste più un vantaggio di rivalutazione per categoria; il rischio basso non protegge da perdite inesistenti. Possono comunque far crescere patrimonio rispetto al contante fermo quando non sottraggono capitale a opportunità migliori, ma non sono liquidabili e consumano uno slot come gli altri.

**Proposta, non implementazione:** in una revisione esplicitamente autorizzata testare un netto Terreni intorno all'1% mensile del prezzo iniziale: 120/150/210/280 S per Aurora/Campo/Lotto/Podere. Con costi invariati andrebbero modificate le rendite, ma **qui non è stato modificato nulla**. È un obiettivo da playtest, non una garanzia di equilibrio. Sviluppo edificabile sarebbe un'alternativa più strutturale, fuori ambito; non reintrodurre inflazione differenziata o eventi nascosti per correggere il problema.

## Screenshot e limiti residui

- `economy-1280-cap.png`, `economy-1280-portfolio.png`
- `economy-390-cap.png`, `economy-390-portfolio.png`

Catturati dal runner e controllati anche visivamente: struttura leggibile, etichette Competitor, limite mensile esplicito, nessuna sovrapposizione/overflow evidente. Sono **fixture di verifica** con 1.000.000 S e due valori modificati per rendere evidente il disallineamento prezzo/baseline, non screenshot presentati come una partita standard. La UI ordinaria e il finale stretto sono coperti anche dai test esistenti. Lo script generale `tests/capture-screens.mjs` è aggiornato per completare tutti i cicli senza RNG, ma non è stato rieseguito per non sovrascrivere le precedenti catture storiche `reports/after/`.

Restano: euristica del Competitor non ottimale (penalità di rischio senza shock reali), vantaggio temporale del primo compratore, terreni/villa sbilanciati senza interventi sui dati, impossibilità di vendita, nessuna cronologia completa, registro di sole 30 righe, limitazioni storage/multischeda sopra descritte. Il pareggio da doppia insolvenza artificiale non è stato introdotto: resta la priorità del controllo giocatore, irraggiungibile normalmente. Verifica su Chromium locale, non Firefox/WebKit/dispositivi fisici. Nessun errore bloccante residuo nei test richiesti.

## File esatti modificati o creati

Il manifest machine-readable è `reports/economy-changed-files.json`. I file applicativi non elencati (in particolare `js/app.js`, asset e package/lock) restano non toccati. Nessuna modifica a skills fuori progetto.

### Modificati preesistenti

- `GAME_DESIGN.md`
- `README.md`
- `index.html`
- `css/style.css`
- `js/data.js`
- `js/game.js`
- `js/cpu.js`
- `js/market.js`
- `js/presentation.js`
- `js/ui.js`
- `tests/game.test.js`
- `tests/integrity.test.js`
- `tests/presentation.test.js`
- `tests/browser/ui.spec.js`
- `tests/capture-screens.mjs`
- `scripts/verify-evidence.mjs`
- `reports/browser-results.json`

### Creati

- `tests/economy.test.js`
- `tests/browser/economy.spec.js`
- `scripts/analyze-economy.mjs`
- `reports/initial-properties-baseline.json`
- `reports/economy-analysis.json`
- `reports/economy-analysis.md`
- `reports/economy-verification.json`
- `reports/economy-test-output.txt`
- `reports/economy-browser-progress.txt`
- `reports/economy-node-progress.txt`
- `reports/economy-test-all-progress.txt`
- `reports/economy-1280-cap.png`
- `reports/economy-1280-portfolio.png`
- `reports/economy-390-cap.png`
- `reports/economy-390-portfolio.png`
- `reports/ECONOMY-REVISION.md`
- `reports/economy-changed-files.json`

Il runner rigenera inoltre `reports/test-artifacts/.last-run.json` come stato transitorio e rimuove le tracce dei fallimenti intermedi al run successivo. Non fa parte del codice distribuito. `reports/TEST-REPORT.md`, `reports/DESIGN-AUDIT.md`, le vecchie baseline hash e catture preesistenti restano **evidenze storiche**; README indica quale report è attuale.
