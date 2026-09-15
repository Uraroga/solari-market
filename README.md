# Solari Market

Solari Market è un gioco gestionale immobiliare per browser.

Sfida il **Competitor** per 60 mesi: compra immobili, conserva liquidità e cerca di concludere la partita con il patrimonio più alto.

I **Solari (S)** sono una valuta completamente fittizia.  
Il gioco non rappresenta investimenti reali e non fornisce consigli finanziari.

## Gioca online

https://uraroga.github.io/solari-market/

## Come si gioca

Tu e il Competitor iniziate con:

- 100.000 S di liquidità
- 0 immobili
- 60 mesi di gioco

Ogni mese puoi acquistare fino a **3 immobili**.

Per effettuare un acquisto devi sempre mantenere almeno:

**20.000 S di riserva**

La stessa regola vale anche per il Competitor.

Gli immobili producono ogni mese:

- rendite
- costi di gestione
- un guadagno netto

Il guadagno netto è:

rendita mensile - costo mensile

## Inflazione

Ogni mese il valore di tutti gli immobili aumenta dello:

**0,25%**

Questo vale sia per gli immobili già acquistati sia per quelli ancora disponibili.

Il prezzo di acquisto di un immobile è sempre il suo **valore corrente**.

Quindi aspettare troppo può significare pagare di più.

Le rendite e i costi mensili rimangono invece invariati.

## Competitor

Il Competitor è un avversario automatico basato su regole JavaScript.

Non utilizza:

- intelligenza artificiale generativa
- LLM
- API
- servizi cloud

Può effettuare da 0 a 3 acquisti per mese e, dopo ogni acquisto, rivaluta gli immobili ancora disponibili.

Giocatore e Competitor seguono le stesse regole economiche.

## Come si vince

Alla fine del mese 60 viene calcolato il patrimonio di entrambi:

**Patrimonio = liquidità + valore corrente degli immobili posseduti**

Vince chi possiede il patrimonio più alto.

Se i patrimoni sono uguali, la partita termina in **pareggio**.

## Immobili

Nel gioco sono presenti 20 immobili suddivisi in cinque categorie:

- Terreni
- Appartamenti
- Negozi
- Uffici
- Ville

Ogni immobile ha:

- prezzo corrente
- rendita mensile
- costo di gestione
- guadagno netto
- livello di rischio

## Salvataggio

La partita viene salvata automaticamente nel browser tramite `localStorage`.

Non sono necessari:

- account
- login
- backend
- database

## Tecnologia

Solari Market è realizzato con:

- HTML
- CSS
- JavaScript ES Modules

Il gioco funziona interamente nel browser.

## Avvio locale

Dalla cartella del progetto:

```bash
npm start
