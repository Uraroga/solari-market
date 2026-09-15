# Verifica responsive smartphone

## Ambito

- Repository inizialmente pulito (`git status --short`).
- Unico file applicativo modificato: `css/style.css`, 145 righe aggiunte esclusivamente in `@media (max-width: 600px)`.
- Verificato automaticamente che, rimuovendo quel blocco, il CSS coincide esattamente con il contenuto iniziale di Git.
- Nessuna modifica a HTML, JavaScript, dati, economia, storage, contenuti o logica Competitor. Nessun commit, push, pubblicazione o scrittura remota.
- I report preesistenti rigenerati dalla suite sono stati ripristinati; il risultato della nuova suite è conservato qui.

## Modifiche verificate

Header/HUD più compatti (203 px a 320 e 390, 206 px a 430, prima 234 px); navigazione e mese successivo restano raggiungibili. Catalogo, opportunità e confronto portafoglio a colonna singola. Immagini proporzionate, filtri a colonna singola con input a 16 px, metriche e dialoghi adattati alla larghezza e all'altezza disponibile. Nessun contenuto nascosto per accorciare la pagina.

## Test reali

- `npm run test:all`: **27 test Node + 25 test Playwright superati**, zero fallimenti. Include accessibilità, economia e flussi esistenti.
- `npx playwright test tests/browser/smartphone.spec.js --reporter=list`: **6/6 superati**.
- Test RED prima del CSS: fallimento atteso a tutte e tre le larghezze per header di 234 px contro massimo 210 px (`red.txt`).
- Chromium headless reale: viewport **320×568, 390×844, 430×932**, caricamento fresco per ciascuno.
- Verifiche DOM: nessun overflow orizzontale della pagina, nessun elemento fuori larghezza, nessun contenuto con overflow interno orizzontale; controlli verificati almeno 44×44 px.
- Interazioni reali: onboarding, ricerca, categoria, rischio, ordinamento, dettaglio, acquisto, ricevuta, immobili posseduti, mese successivo, portafoglio, Competitor/archivio, nuova partita/annulla. Tutti i 60 turni eseguiti tramite pulsante in ciascun test smartphone; finale, annullamento e conferma riavvio funzionanti.
- Nessun errore JavaScript/console o richiesta fallita nella cattura evidence.
- `git diff --check`: superato.

## Screenshot e parità tablet/desktop

`node tests/smartphone-evidence.mjs before` eseguito sul CSS originale **prima** delle modifiche; `node tests/smartphone-evidence.mjs after` dopo.

- **70 screenshot prima + 70 dopo**, 14 stati per ciascuna delle 5 viewport.
- Stati: onboarding, home, catalogo, filtro, dettaglio, acquisto CTA, ricevuta, immobili, portafoglio, Competitor, archivio, reset, finale, azione finale.
- **28/28 coppie tablet/desktop identiche byte per byte** a **768×1024 e 1280×800**, stessi stati e sequenza di azioni. Hash SHA-256 prima/dopo in `after.json`. L'identità del PNG è una verifica più forte della sola identità dei pixel.
- Prima esecuzione after: una piccola differenza transitoria di rasterizzazione nel testo HUD dietro onboarding a 768 px; nuova esecuzione senza cambiamenti CSS ha prodotto 28/28 PNG identici.
- Screenshot ispezionati visivamente: 320 home/catalogo/immobili/ricevuta/finale, 390 portafoglio/Competitor, 430 dettaglio/onboarding, confronto onboarding tablet prima/dopo. Nessun problema visivo bloccante rilevato; dialoghi lunghi scorrono verticalmente e le azioni sono operabili.

Percorsi assoluti:

- `/home/sergio/Progetti/solari-market/reports/smartphone/before/`
- `/home/sergio/Progetti/solari-market/reports/smartphone/after/`
- `/home/sergio/Progetti/solari-market/reports/smartphone/after.json`
- `/home/sergio/Progetti/solari-market/reports/smartphone/test-all.txt`
- `/home/sergio/Progetti/solari-market/reports/smartphone/test-all-browser-results.json`
- `/home/sergio/Progetti/solari-market/reports/smartphone/green.txt`
- `/home/sergio/Progetti/solari-market/reports/smartphone/red.txt`

## Riproduzione locale

Avviare `npm start`, poi `node tests/smartphone-evidence.mjs after` e `npm run test:all`. Conservare `before/`: non sovrascriverlo sul CSS modificato. La suite standard rigenera i propri report preesistenti; questa verifica li ha ripristinati per evitare modifiche estranee.
