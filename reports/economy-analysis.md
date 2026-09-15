# Analisi riproducibile

Single-asset initial purchase held for 60 full cycles: net cash is not reinvested; all monthly integer rounding included. Category returns are capital-weighted. Scenarios use real game engine, deterministic heuristics, not optimal play or win-rate estimates.

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
