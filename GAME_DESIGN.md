# Solari Market — Game design implementato

Documento della revisione economica deterministica. Descrive il codice attuale, non funzionalità ipotetiche. La baseline dei 20 immobili è conservata integralmente in `reports/initial-properties-baseline.json`; nessun bilanciamento dei dati iniziali è stato applicato.

## 1. Idea generale

Gioco immobiliare locale in italiano, HTML/CSS e moduli JavaScript, senza backend. Sergio e Competitor iniziano con 100.000 Solari ciascuno e competono su 20 immobili esclusivi. Il mese visualizzato è il mese ancora da elaborare: si inizia a 1 e si completano 60 cicli, salvo insolvenza. Il giocatore compra nella fase iniziale del mese; Competitor decide nella fase finale. Non è multiplayer né un modello economico realistico.

## 2. Condizione di vittoria

Alla chiusura completa del mese 60 si confronta `liquidità + somma dei valori correnti posseduti`. Vince il patrimonio maggiore; uguaglianza esatta → `winner: 'draw'`, schermata **Pareggio**. Gli identificativi interni degli altri esiti restano `player` e `cpu`.

`checkInsolvency` conclude anticipatamente se un partecipante ha liquidità negativa e patrimonio non positivo. Il controllo del giocatore precede quello del Competitor; in un salvataggio alterato con entrambi insolventi prevale questa priorità storica. Non è raggiungibile da una partita regolare con i dati attuali: acquisti senza credito, netti positivi, nessuno shock.

A partita conclusa acquisti e avanzamento sono bloccati; un'altra chiamata ad `advanceMonth` o `updateMarketValues` non cambia lo stato. L'interfaccia permette ancora l'ispezione o una nuova partita confermata.

## 3. Valuta

**Solari**, simbolo **S**, valuta esclusivamente ludica. `formatSolari` arrotonda la visualizzazione all'intero e usa il formato italiano. Prezzi e valori regolari sono interi; l'inflazione viene arrotondata nel dato, non solo sullo schermo. Nessun denaro reale, conversione, credito o interesse sulla liquidità.

## 4. Il giocatore

Sergio esplora opportunità, catalogo, ricerca per nome, filtri categoria/rischio e ordinamento per prezzo attuale. Ogni mese può effettuare **0–3 acquisti**. `buyProperty` è l'unico percorso di acquisto, anche per Competitor: controlla proprietario valido, contatore intero valido inferiore a 3, bene disponibile, partita attiva e liquidità residua almeno pari a `CONFIG.minimumCashReserve` (**20.000 S**). Fallimento → `false` senza addebiti, log o consumo dello slot; successo → addebito del prezzo corrente, assegnazione, incremento contatore e una riga di log.

Il quarto acquisto viene rifiutato anche tramite chiamata diretta e dopo reload. Il vincolo non dipende dal pulsante disabilitato. La stessa riserva obbligatoria vale per Sergio e Competitor: l'acquisto è consentito solo se dopo l'addebito restano almeno **20.000 S**. Gli slot non usati non si accumulano. Non si può vendere un bene.

## 5. Competitor

Avversario deterministico, non LLM. Il file `js/cpu.js` e gli identificativi interni conservano il nome storico, ma etichette, profili, onboarding, confronto, risultati e log mostrano **Competitor**.

A fine mese effettua **0, 1, 2 o 3 acquisti**, nel limite centrale condiviso e lasciando almeno **20.000 S** secondo `CONFIG.minimumCashReserve`, la stessa regola usata dal giocatore. `runCpuTurn` restituisce un array degli acquisti. Dopo **ogni** successo ricostruisce i candidati e ricalcola i punteggi da liquidità e portafoglio aggiornati: non usa una graduatoria mensile congelata.

Per un candidato libero:

```text
prezzo = purchasePrice(immobile) = valore corrente
rendimento = (rendita - costo) / prezzo
bonus categoria = 0,012 se la categoria non è ancora posseduta, altrimenti 0
margine = max(0, (liquidità - prezzo - CONFIG.minimumCashReserve) / 100.000)
penalità rischio = 0 (Basso), 0,015 (Medio), 0,045 (Alto)
penalità concentrazione = 0,018 × numero beni Alto già posseduti, solo per candidati Alto
punteggio = rendimento + bonus categoria + 0,01 × margine
            - penalità rischio - penalità concentrazione
```

Richiede netto positivo e punteggio almeno 0,006. Un bene Alto è scartato se liquidità <115.000 S e rendimento <0,028. Fra candidati ammessi sceglie punteggio decrescente, poi prezzo crescente, poi ID. Se nessuno è ammissibile conserva liquidità. Il rischio non causa perdite o volatilità: resta un criterio euristico; il bonus diversificazione non protegge da shock inesistenti. Sono limiti strategici deliberatamente conservati, non una promessa di gioco ottimale.

## 6. Ciclo mensile

Un clic su **Mese successivo** chiude il mese corrente in questo ordine:

1. Se `gameOver`, nessun effetto.
2. Accredita rendite e sottrae costi del giocatore; registra entrambi.
3. Accredita rendite e sottrae costi del Competitor; registra entrambi.
4. Applica una sola inflazione mensile a tutti i beni, liberi o posseduti; registra una sintesi.
5. Competitor rivaluta e compra 0–3 immobili tramite la funzione centrale. Ogni acquisto ha una sola ricevuta nel log; se non compra viene registrato.
6. Controlla insolvenza.
7. Dopo il ciclo 60 conclude e confronta patrimoni; altrimenti incrementa `month` e azzera entrambi i contatori.
8. La UI salva e ridisegna.

Le attività portano il mese appena elaborato, non quello seguente. L'acquisto iniziale del giocatore incassa già nel ciclo corrente; quello finale del Competitor incassa dal ciclo seguente ed è pagato dopo l'inflazione. Questa asimmetria di ordine è esplicita e conservata. Un acquisto al termine del mese 60 non genera reddito né inflazione retroattivi e scambia pari liquidità/valore. Partendo da mese 1 servono **60 clic**, non 59.

## 7. Immobili

20 immobili, 4 per categoria: Terreni, Appartamenti, Negozi, Uffici, Ville. Tutti inizialmente liberi. `prezzo` resta il dato iniziale di baseline; **non** è il prezzo usato per le transazioni. `valore` è il prezzo corrente e il contributo patrimoniale. Rendite, costi, rischio, descrizioni e catalogo iniziale restano invariati.

Le descrizioni originali hanno linguaggio narrativo anche su rischio e cicli: non sono meccaniche. Il dettaglio chiarisce esplicitamente crescita uniforme e assenza di probabilità di perdita. Tutti i valori nella tabella seguente sono Solari; rendita/costo/netto sono mensili.

| Immobile | Categoria | Prezzo/valore iniziale | Rendita | Costo | Netto | Rischio |
|---|---|---:|---:|---:|---:|---|
| Terreno Aurora | Terreni | 12000 | 80 | 40 | 40 | Basso |
| Campo Lunare | Terreni | 15000 | 60 | 35 | 25 | Basso |
| Lotto Zenit | Terreni | 21000 | 120 | 70 | 50 | Medio |
| Podere Cristallo | Terreni | 28000 | 160 | 90 | 70 | Medio |
| Residenza Solaris | Appartamenti | 22000 | 760 | 210 | 550 | Basso |
| Loft Prisma | Appartamenti | 26000 | 880 | 260 | 620 | Medio |
| Attico Nuvola | Appartamenti | 34000 | 1080 | 360 | 720 | Medio |
| Casa Miraggio | Appartamenti | 18000 | 570 | 170 | 400 | Basso |
| Bottega Centrale | Negozi | 30000 | 1350 | 520 | 830 | Medio |
| Emporio Vela | Negozi | 24000 | 1040 | 440 | 600 | Medio |
| Galleria Orione | Negozi | 42000 | 2050 | 860 | 1190 | Alto |
| Chiosco Riviera | Negozi | 16000 | 620 | 250 | 370 | Medio |
| Uffici Zenith | Uffici | 28000 | 1260 | 500 | 760 | Medio |
| Studio Cometa | Uffici | 19000 | 760 | 260 | 500 | Basso |
| Torre Meridiana | Uffici | 52000 | 2450 | 1100 | 1350 | Alto |
| Hub Eclisse | Uffici | 36000 | 1600 | 660 | 940 | Medio |
| Villa Orizzonte | Ville | 65000 | 1750 | 760 | 990 | Medio |
| Dimora Alba | Ville | 72000 | 1900 | 850 | 1050 | Medio |
| Villa Sirena | Ville | 88000 | 2450 | 1220 | 1230 | Alto |
| Casa Giardino | Ville | 48000 | 1320 | 540 | 780 | Basso |

## 8. Calcoli economici

```text
netto immobile = rendita - costo
netto proprietario = somma rendite - somma costi
patrimonio = liquidità + somma valori correnti posseduti
prezzo acquistabile = purchasePrice(immobile) = immobile.valore
rendimento di confronto = netto / purchasePrice(immobile)
```

L'acquisto da solo non aumenta il patrimonio: toglie la stessa cifra che aggiunge nei beni. Nessun arbitraggio col vecchio prezzo iniziale. Il helper condiviso è usato da acquisto, Competitor, ranking opportunità, classificazione/profilo, card, ricerca filtrata, ordinamento, dettaglio, disponibilità del pulsante e ricevuta.

Opportunità: beni liberi alla portata della liquidità, ordinati per netto/prezzo decrescente, poi prezzo crescente, primi tre. È un consiglio informativo anche quando gli slot sono esauriti; il contatore e il dettaglio impediscono nuovi acquisti.

Etichette, in ordine: Alto con rendimento ≥0,025 → Alto potenziale; altro Alto → Rischioso; Terreni sotto 0,008 → Crescita lenta; rendimento ≥0,032 → Redditizio; prezzo >60.000 e rendimento <0,018 → Costoso; Basso → Prudente; altrimenti Bilanciato. I testi dei profili distinguono criterio prudenziale da rischio di perdita.

Crescita in Portafoglio: patrimonio meno 100.000 S; percentuale rispetto a 100.000. Nessuna serie storica. Copertura dei soli costi: `max(0, floor(liquidità/costi))`, senza considerare rendite; non è una previsione d'insolvenza.

## 9. Mercato

`CONFIG.monthlyInflationRate = 0.0025`, cioè **+0,25% mensile**, identica per tutti i 20 immobili, anche disponibili. Formula effettiva:

```js
valore = Math.round(valore * (1 + CONFIG.monthlyInflationRate));
```

Si compone sul valore corrente, arrotondando **ogni mese** al Solaro più vicino; metà verso l'alto (`Math.round`, valori positivi). Il risultato intero è salvato. Le piccole differenze percentuali fra beni sono solo l'arrotondamento. Nessun deprezzamento nei dati di gioco.

`lastInflationMonth` parte da 0. L'aggiornamento non fa nulla se il mese è già applicato o la partita è finita. Il marker persiste insieme ai valori, quindi reload o chiamata doppia non duplicano inflazione. Al termine è 60. Non ricalcola retroattivamente mesi storici.

Non esistono eventi mensili, manutenzione straordinaria, estrazioni, probabilità di mercato o chiamate a `Math.random` nel runtime economico. Nessuna variazione di rendite/costi. I log pre-migrazione possono descrivere vecchi eventi, ma sono marcati **Storico precedente** e non vengono rieseguiti. Il callout dell'ultimo evento e il relativo CSS sono rimossi.

## 10. Interfaccia

Header persistente con marchio, tre viste, supporto, nuova partita, HUD e avanzamento. Home con suggerimento **Acquisti: n / 3**, opportunità, categorie, ricerca/filtri e catalogo. Tutti i prezzi visibili sono correnti.

Dettaglio: immagine, nome, categoria, badge, prezzo, netto, pulsante, saldo dopo acquisto, descrizione, spiegazione del rischio, profilo, rendita, costo, valore e proprietario. A cap raggiunto il pulsante è disabilitato e compare **Limite mensile**; se l'acquisto scenderebbe sotto la riserva compare **Devi mantenere almeno 20.000 S di riserva.** Ricevuta con costo corrente effettivamente addebitato, netto aggiunto e residuo.

I miei immobili: conteggio, valore, rendite, costi, netto e righe ispezionabili. Portafoglio: TU/Competitor, vantaggio o parità, crescita e riserva minima obbligatoria. Pannello avversario: dati reali, regola 0–3 acquisti e riserva condivisa. Notizie: ultime tre attività, archivio espandibile per mese; massimo 30 righe totali. Nessun evento attivo o grafico sintetico.

Dialoghi nativi per onboarding, ricevuta, reset e finale; gestione Tab/focus/Escape. La conferma reset è richiesta anche dal finale. Pareggio ha un titolo dedicato.

## 11. Onboarding

**La città parte da te** spiega capitale, 60 mesi, patrimonio, massimo 3 acquisti per ciascuno, crescita 0,25%, prezzo uguale al valore, flussi fissi, turno del Competitor e pareggio. Pulsante **Esplora il mercato** o Escape lo chiude.

`onboardingDismissed` persiste; nuova partita conserva questa preferenza. Il vecchio booleano `playerBoughtThisMonth` non è più usato e viene eliminato durante caricamento. I suggerimenti dipendono dal contatore economico reale, dalla liquidità, dai beni e dalla fine partita.

## 12. Salvataggio

Chiave invariata: `solari-market-save-v1`; nuovo contenuto **`schemaVersion: 2`**. Persistono mese, capitali, proprietà, valori, log, esito, `purchasesThisMonth: {player,cpu}`, `lastInflationMonth` e preferenza onboarding. Salvataggio dopo inizializzazione, onboarding, acquisto, mese e nuova partita. Nessun backend; host/porta/browser diversi hanno archivi diversi.

### Migrazione conservativa

Salvataggi senza versione o versione 1: conserva mese, liquidità, proprietari e valori storici effettivi, anche se prima deprezzati; non riporta il mondo ai valori iniziali né simula inflazione arretrata. I flussi fissi originali restano invariati.

**Non è possibile ricostruire con certezza gli acquisti del mese dai 30 log o da un booleano.** La migrazione riserva tutti e tre gli slot a entrambi per il solo mese in corso. Non afferma che siano avvenuti tre acquisti: è un blocco prudenziale temporaneo, spiegato nel log. Al prossimo avanzamento si elaborano flussi e inflazione, ma Competitor non compra nel mese transitorio; all'apertura del seguente entrambi ripartono da zero. Anche un vecchio mese 1 non è arbitrariamente considerato vergine. Al mese 60 non ci sarà un mese aggiuntivo per recuperare gli slot.

`lastInflationMonth` diventa mese−1 per partite attive, mese per concluse. I log sono rinominati Competitor e marcati Storico precedente mantenendo il mese originale; la nota di migrazione occupa una delle 30 righe. Un vecchio risultato a mese 60 con patrimoni uguali viene corretto in pareggio, senza rielaborare i mesi. Dopo il primo salvataggio lo schema 2 non ripete la migrazione.

### Validazione e limiti

Il loader controlla mese intero 1–60, capitali finiti, stato finale booleano, log testuali, tutti i 20 ID distinti della baseline, campi statici originali, proprietario valido e valore intero positivo. Per schema 2 controlla contatori interi 0–3 e marker intero 0–mese. Versioni sconosciute/corruzione vengono rifiutate; il normale avvio crea poi una nuova partita e la salva. Non esiste backup automatico del JSON rifiutato: esportarlo prima di sperimentare manualmente.

Non è un sistema anti-cheat: modifiche coerenti tramite strumenti del browser restano possibili, e schede concorrenti non sono sincronizzate. Se lo storage è negato, l'app continua in memoria con avviso; nessuna promessa di persistenza. Vista, filtri e chiusura temporanea del finale non persistono. Nuova partita sostituisce lo stato dopo conferma; l'export inutilizzato `clearSavedState` è stato rimosso.

## 13. Donazioni

L'header mantiene invariato **Sostieni il progetto** verso `https://paypal.me/uraroga`, `target="_blank"`, `rel="noopener noreferrer"`. Testo abbreviato sui piccoli schermi, nome accessibile completo. È volontario, esterno e indipendente dalla partita. Nessun pagamento o vantaggio ludico integrato. I test intercettano solo la navigazione esterna per non dipendere dalla rete PayPal; il link reale non è modificato.

## 14. Design attuale

Marketplace illustrato con verde petrolio `#123e3c`, scuro `#0c2c2b`, giallo `#edb653`, carta `#f5f3ed`, superficie `#fffefa`, testo `#1a3432`, secondario `#586864`, Competitor `#78534b` e pericolo `#963e31`. Font Trebuchet MS/Segoe UI, titoli Georgia.

Header sticky, card, badge, riepiloghi e dialoghi conservati; nessun redesign in questa revisione. Rimosso soltanto il callout ormai privo di funzione. 26 SVG locali: marchio, cinque categorie, venti proprietà. Layout responsive, focus visibile, target tattili e `prefers-reduced-motion`. Verifica Chromium a 1280, 390 e 320 px; non implica certificazione universale d'accessibilità.

## 15. File principali del progetto

| Percorso | Responsabilità |
|---|---|
| `index.html`, `css/style.css` | Shell, testi, controlli, palette e responsive |
| `js/data.js` | CONFIG, categorie/rischi e baseline immutata |
| `js/game.js` | Stato, transazione centrale, ciclo, finale, validazione/migrazione e storage |
| `js/cpu.js` | Valutazione e ciclo sequenziale del Competitor |
| `js/market.js` | Prezzo condiviso, netto, inflazione, profili e aggregati |
| `js/presentation.js` | Ranking informativo delle opportunità |
| `js/ui.js`, `js/app.js` | Rendering, interazioni, caricamento e avvio |
| `assets/` | SVG locali originali |
| `tests/*.test.js` | Test Node di economia, baseline e presentazione |
| `tests/browser/`, `playwright.config.js` | Chromium, interazioni reali, responsive, axe e screenshot |
| `scripts/analyze-economy.mjs` | Analisi deterministica riproducibile di tutti i beni e tre strategie |
| `reports/ECONOMY-REVISION.md` | Esiti, limiti, file e prove della revisione |
| `reports/economy-analysis.{json,md}` | Numeri misurati e metodo |

`game.js` e `cpu.js` si importano reciprocamente solo per funzioni dichiarate, senza esecuzione al caricamento: il ciclo ESM permette al Competitor di usare la stessa transazione. Verificato in Node e browser; non duplicare l'addebito nel motore avversario.

## 16. Funzionalità NON presenti

Multiplayer, account, cloud, API, LLM, prestiti, mutui, aste, rivendita, sviluppo terreni, ristrutturazioni, trattativa, tassazione, vacancy, difficoltà selezionabili, eventi casuali, variazioni rendita/costo, bonus di categoria effettivi, audio, serie patrimoniale o classifica online. Nessun riequilibrio automatico dei dati.

## 17. Problemi o limiti tecnici conosciuti

- Competitor è euristico: penalizza rischi che non generano più perdite ed è meno aggressivo dei soli rendimenti. Non viene presentato come ottimo.
- Ordine dei turni favorevole al primo acquisto del giocatore: reddito corrente prima del turno avversario.
- Terreni hanno flussi molto deboli senza crescita privilegiata o possibilità di sviluppo. Il nome Crescita lenta indica qui il rendimento complessivo, non un tasso di inflazione diverso.
- Ville impegnano molto capitale con rendimento percentuale inferiore a negozi/uffici/appartamenti; valore assoluto alto non è rendimento migliore.
- Nessuna vendita: la rivalutazione conta nel patrimonio ma non può essere convertita in liquidità. La riserva minima è un vincolo d'acquisto centrale, non un evento nascosto.
- Migrazione blocca il solo mese sconosciuto; registro troncato, nessun backup automatico, nessuna sincronizzazione fra schede o protezione anti-manomissione.
- I salvataggi storici conservano risultati di un'economia diversa; non sono confrontabili con nuove partite deterministiche come se fossero equivalenti.

Misure: rendimento mensile netto ponderato Terreni **0,243%**, Appartamenti **2,290%**, Negozi **2,670%**, Uffici **2,630%**, Ville **1,484%**. Ritorno totale nominale su 60 mesi, acquisto iniziale singolo mantenuto senza reinvestimento: rispettivamente **30,770% / 153,557% / 176,338% / 173,941% / 105,173%**. Include rivalutazione intera mensile; non è un tasso annualizzato né una probabilità di vittoria. Metodo, ogni bene e scenari in `reports/economy-analysis.md`.

**Proposta non applicata:** valutare in una revisione separata un netto terreni intorno all'1% del prezzo iniziale (Aurora 120, Campo 150, Lotto 210, Podere 280 S/mese), mantenendo inflazione comune e flussi poi fissi. Sono obiettivi ipotetici da playtest, non nuovi dati. In alternativa progettare sviluppo dei terreni esplicito, ma introdurrebbe nuove meccaniche fuori ambito. Nessuna modifica a `INITIAL_PROPERTIES` è autorizzata o effettuata qui.

## 18. Riassunto del gameplay

Sergio e Competitor iniziano con 100.000 S. Sergio può comprare fino a tre beni al prezzo corrente. Chiudendo il mese, entrambi ricevono i netti fissi dei beni già posseduti; tutti i valori crescono dello 0,25% arrotondato; Competitor valuta fino a tre acquisti, rifacendo il ranking dopo ciascuno. Il mese seguente riapre tre slot per ciascuno. Stato e limiti persistono al reload.

Il ciclo si ripete per mesi 1–60 completi. Alla fine conta liquidità più valore corrente, con pareggio effettivo quando i patrimoni coincidono. Non ci sono shock, rendite variabili, valore regalato comprando al prezzo originario o acquisti illimitati. I terreni restano nel catalogo originale, senza vantaggi inventati: la revisione espone e misura questo limite invece di alterare silenziosamente il bilanciamento.
