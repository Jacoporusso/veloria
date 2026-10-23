# Verifica della varietà degli incontri

Stato del repository `618da24`, 23 ottobre 2026. Audit delle tabelle collegate dai metadata alle mappe runtime e dei riferimenti effettivi negli oggetti Tiled. Nessuna distribuzione modificata.

## Risultato

- 48 mappe runtime; 20 hanno incontri selvatici dichiarati, con 22 tabelle collegate. Tutte le 22 tabelle hanno almeno un punto Tiled che le usa; nessuna tabella di incontri orfana.
- 43 specie differenti incontrabili allo stato selvatico su 80 nel catalogo. Le altre includono starter ed evoluzioni: il numero non implica che tutte debbano comparire selvatiche.
- Mareep compare in 10 tabelle, Hoothoot in 9, Wooper e Pidgey in 7, Spinarak in 6. Il conteggio è per tabella, non una probabilità globale di incontro.
- Anello Magnetico e Condotto Risonante: stesse quattro specie, stessi pesi in ogni fascia; cambiano i livelli. Nelle foglie della Costa il 85% del peso diurno è sulle stesse tre specie della pesca (Tentacool, Krabby, Chinchou).
- Nella stessa mappa le diverse patch generalmente riusano una sola tabella: spostarsi da una macchia di foglie all’altra non cambia il gruppo di specie. Dune e Costa distinguono erba e pesca.
- Per chi gioca alla stessa ora la varietà effettiva è inferiore all’unione delle tre fasce. Le prime mappe condividono ripetutamente Pidgey, Mareep, Hoothoot, Spinarak e Wooper.

## Specie per zona

Unione di mattino/giorno/notte e dei metodi presenti. Non tutte sono disponibili simultaneamente. Livelli e pesi precisi nell’appendice.

| Zona | Specie presenti |
|---|---|
| Bosco dei Veli | Caterpie, Metapod, Butterfree, Weedle, Kakuna, Beedrill, Pidgey, Oddish, Poliwag, Bellsprout, Hoothoot, Spinarak, Mareep, Wooper |
| Delta degli Specchi | Poliwag, Krabby, Chinchou, Wooper |
| Grotte del Cristallo | Zubat, Golbat, Geodude, Graveler, Onix |
| Sentiero dell'Alba | Pidgey, Rattata, Sentret, Hoothoot, Spinarak |
| Viale delle Fronde | Pidgey, Rattata, Bellsprout, Sentret, Hoothoot, Spinarak, Mareep |
| Terrazze del Muschio | Pidgey, Oddish, Poliwag, Bellsprout, Hoothoot, Spinarak, Mareep, Wooper |
| Salita dei Petali | Pidgey, Oddish, Bellsprout, Hoothoot, Spinarak, Mareep |
| Viadotto dei Ciliegi | Pidgey, Pikachu, Hoothoot, Spinarak, Mareep, Wooper |
| Anello Magnetico | Magnemite, Voltorb, Mareep, Wooper |
| Condotto Risonante | Magnemite, Voltorb, Mareep, Wooper |
| Costa delle Turbine | Tentacool, Krabby, Chinchou, Mareep |
| Dune Salmastre | Tentacool, Krabby, Hoothoot, Chinchou, Lanturn, Mareep, Wooper |
| Sentiero delle Canne | Drowzee, Eevee, Hoothoot, Natu |
| Via delle Cascate | Pidgeotto, Drowzee, Eevee, Natu, Flaaffy |
| Valle del Vento | Pidgeotto, Natu, Sneasel, Swinub |
| Tornanti Bianchi | Seel, Jynx, Sneasel, Swinub, Piloswine |
| Varco di Cristallo | Onix, Sneasel, Piloswine, Skarmory |
| Passo delle Due Luci | Graveler, Dratini, Natu, Xatu, Sneasel |
| Cammino dell’Equilibrio | Dratini, Dragonair, Xatu, Ampharos, Sneasel, Piloswine |
| Vetracielo · Piazza della Monorotaia | Pidgey, Pikachu, Magnemite, Voltorb, Hoothoot, Mareep |

## Selezione e ripetizioni

Il selettore estrae una specie in base ai pesi della fascia oraria locale: mattino05–10, giorno11–19, notte20–04. Il cursore RNG viene avanzato per controllo, specie e livello e passa alla battaglia; lo stato aggiornato viene conservato. Non è presente una regola che escluda le specie appena incontrate: ripetizioni consecutive sono possibili e coerenti con l’estrazione indipendente. Dal controllo del codice la causa principale della somiglianza è il contenuto delle tabelle, non una selezione fissata sulla stessa specie. Questo audit non è una prova statistica della qualità del PRNG.

Le percentuali seguenti sono condizionate all’incontro già avvenuto. Non sono probabilità per passo o per lancio della canna; quelle dipendono dal punto Tiled e dal controllo di incontro/abboccata.

## Intervento consigliato

1. Dare identità ai biomi iniziali, riducendo le specie onnipresenti e preservando risposte accessibili ai quattro starter.
2. Separare microhabitat nella stessa mappa (bosco, radura, sponda, area tecnica) con tabelle distinte e segnali grafici coerenti.
3. Differenziare Anello/Condotto e Costa/Dune/Delta, compresi i gruppi da pesca.
4. Aggiungere specie soltanto dopo importazione di dati/mosse/artwork ufficiali e verifica di compatibilità con il core; mantenere alcune comuni, alcune caratteristiche e rare per zona.
5. Verificare disponibilità delle strategie e crescita con partite reali, prima di dichiarare il bilanciamento approvato.

PokéAPI fornisce dati sulle specie e luoghi dei giochi originali; l’assegnazione alle zone di Veloria resta progettazione del nostro mondo. Non si deve presentare una nuova distribuzione di Veloria come dato ufficiale PokéAPI.

## Appendice: distribuzioni attuali

### Bosco dei Veli · woodland-understory

Tabella `veloria/d01_woodland` · 2 punti Tiled.

- morning: Caterpie 25% Lv3-5, Weedle 20% Lv3-5, Oddish 30% Lv3-5, Bellsprout 20% Lv3-5, Metapod 5% Lv6-7
- day: Pidgey 20% Lv3-5, Mareep 25% Lv3-5, Wooper 20% Lv3-5, Butterfree 5% Lv8-9, Beedrill 5% Lv8-9, Kakuna 5% Lv6-7, Caterpie 20% Lv3-5
- night: Hoothoot 30% Lv3-6, Spinarak 25% Lv3-6, Wooper 20% Lv3-5, Poliwag 25% Lv5-5

### Delta degli Specchi · fishing

Tabella `veloria/d04_delta_fishing` · 1 punti Tiled.

- morning: Poliwag 35% Lv25-28, Wooper 30% Lv25-28, Chinchou 25% Lv25-28, Krabby 10% Lv25-28
- day: Poliwag 35% Lv25-28, Wooper 30% Lv25-28, Chinchou 25% Lv25-28, Krabby 10% Lv25-28
- night: Poliwag 35% Lv25-28, Wooper 30% Lv25-28, Chinchou 25% Lv25-28, Krabby 10% Lv25-28

### Grotte del Cristallo · cave

Tabella `veloria/d05_crystal_patch` · 1 punti Tiled.

- morning: Geodude 15% Lv39-44, Graveler 25% Lv39-44, Onix 20% Lv39-44, Zubat 15% Lv39-44, Golbat 25% Lv39-44
- day: Geodude 15% Lv39-44, Graveler 25% Lv39-44, Onix 20% Lv39-44, Zubat 15% Lv39-44, Golbat 25% Lv39-44
- night: Geodude 15% Lv39-44, Graveler 25% Lv39-44, Onix 20% Lv39-44, Zubat 15% Lv39-44, Golbat 25% Lv39-44

### Sentiero dell'Alba · tall-grass

Tabella `veloria/r01_tall_grass` · 4 punti Tiled.

- morning: Pidgey 50% Lv2-4, Rattata 30% Lv2-3, Sentret 20% Lv2-4
- day: Pidgey 40% Lv2-4, Sentret 30% Lv2-4, Rattata 30% Lv2-4
- night: Hoothoot 50% Lv3-5, Spinarak 30% Lv2-4, Rattata 20% Lv2-3

### Viale delle Fronde · woodland-understory

Tabella `veloria/r02_grove` · 2 punti Tiled.

- morning: Pidgey 35% Lv4-6, Sentret 35% Lv4-6, Bellsprout 30% Lv4-6
- day: Pidgey 35% Lv4-6, Mareep 35% Lv4-6, Sentret 30% Lv4-6
- night: Hoothoot 40% Lv4-6, Spinarak 35% Lv4-6, Rattata 25% Lv4-6

### Terrazze del Muschio · woodland-understory

Tabella `veloria/r03_moss_terraces` · 2 punti Tiled.

- morning: Oddish 35% Lv6-8, Bellsprout 30% Lv6-8, Pidgey 25% Lv6-8, Mareep 10% Lv7-9
- day: Pidgey 30% Lv6-8, Oddish 25% Lv6-8, Wooper 25% Lv6-8, Mareep 20% Lv7-9
- night: Hoothoot 35% Lv6-9, Spinarak 25% Lv6-8, Poliwag 25% Lv6-8, Wooper 15% Lv6-8

### Salita dei Petali · woodland-understory

Tabella `veloria/r04_petal_ascent` · 4 punti Tiled.

- morning: Oddish 30% Lv8-10, Bellsprout 25% Lv8-10, Pidgey 25% Lv8-10, Mareep 20% Lv9-11
- day: Pidgey 30% Lv8-10, Oddish 25% Lv8-10, Bellsprout 25% Lv8-10, Mareep 20% Lv9-11
- night: Hoothoot 30% Lv8-10, Spinarak 25% Lv8-10, Oddish 25% Lv8-10, Mareep 20% Lv9-11

### Viadotto dei Ciliegi · woodland-understory

Tabella `veloria/r05_cherry_viaduct` · 4 punti Tiled.

- morning: Pidgey 25% Lv11-13, Mareep 25% Lv11-13, Wooper 30% Lv12-14, Pikachu 20% Lv12-14
- day: Pidgey 25% Lv11-13, Mareep 25% Lv11-13, Wooper 30% Lv12-14, Pikachu 20% Lv12-14
- night: Hoothoot 25% Lv11-13, Spinarak 20% Lv11-13, Wooper 30% Lv12-14, Mareep 25% Lv11-13

### Anello Magnetico · tall-grass

Tabella `veloria/r06_magnetic_patch` · 4 punti Tiled.

- morning: Magnemite 30% Lv15-17, Voltorb 25% Lv15-18, Mareep 25% Lv15-17, Wooper 20% Lv16-18
- day: Magnemite 30% Lv15-17, Voltorb 25% Lv15-18, Mareep 25% Lv15-17, Wooper 20% Lv16-18
- night: Magnemite 25% Lv15-17, Voltorb 30% Lv15-18, Mareep 15% Lv15-17, Wooper 30% Lv16-18

### Condotto Risonante · tall-grass

Tabella `veloria/r07_conduit_patch` · 2 punti Tiled.

- morning: Magnemite 30% Lv18-21, Voltorb 25% Lv18-21, Mareep 25% Lv18-21, Wooper 20% Lv18-21
- day: Magnemite 30% Lv18-21, Voltorb 25% Lv18-21, Mareep 25% Lv18-21, Wooper 20% Lv18-21
- night: Magnemite 25% Lv18-21, Voltorb 30% Lv18-21, Mareep 15% Lv18-21, Wooper 30% Lv18-21

### Costa delle Turbine · tall-grass

Tabella `veloria/r08_coastal_grass` · 2 punti Tiled.

- day: Tentacool 35% Lv20-23, Krabby 35% Lv20-23, Chinchou 15% Lv20-23, Mareep 15% Lv20-23
- morning: Tentacool 25% Lv20-23, Krabby 20% Lv20-23, Chinchou 40% Lv20-23, Mareep 15% Lv20-23
- night: Tentacool 25% Lv20-23, Krabby 20% Lv20-23, Chinchou 40% Lv20-23, Mareep 15% Lv20-23

### Costa delle Turbine · fishing

Tabella `veloria/r08_shore_fishing` · 1 punti Tiled.

- day: Tentacool 40% Lv20-23, Krabby 35% Lv20-23, Chinchou 25% Lv20-23
- morning: Tentacool 40% Lv20-23, Krabby 35% Lv20-23, Chinchou 25% Lv20-23
- night: Tentacool 40% Lv20-23, Krabby 35% Lv20-23, Chinchou 25% Lv20-23

### Dune Salmastre · tall-grass

Tabella `veloria/r09_dune_patch` · 2 punti Tiled.

- morning: Krabby 35% Lv24-27, Wooper 30% Lv24-27, Mareep 25% Lv24-27, Hoothoot 10% Lv24-27
- day: Krabby 40% Lv24-27, Wooper 30% Lv24-27, Mareep 30% Lv24-27
- night: Krabby 30% Lv24-27, Wooper 30% Lv24-27, Hoothoot 40% Lv24-27

### Dune Salmastre · fishing

Tabella `veloria/r09_lagoon_fishing` · 1 punti Tiled.

- morning: Tentacool 35% Lv24-27, Krabby 30% Lv24-27, Chinchou 30% Lv24-27, Lanturn 5% Lv24-27
- day: Tentacool 35% Lv24-27, Krabby 30% Lv24-27, Chinchou 30% Lv24-27, Lanturn 5% Lv24-27
- night: Tentacool 35% Lv24-27, Krabby 30% Lv24-27, Chinchou 30% Lv24-27, Lanturn 5% Lv24-27

### Sentiero delle Canne · tall-grass

Tabella `veloria/r10_reed_patch` · 2 punti Tiled.

- morning: Natu 35% Lv27-31, Eevee 10% Lv27-31, Hoothoot 20% Lv27-31, Drowzee 35% Lv27-31
- day: Natu 45% Lv27-31, Eevee 10% Lv27-31, Drowzee 45% Lv27-31
- night: Drowzee 50% Lv27-31, Hoothoot 35% Lv27-31, Natu 15% Lv27-31

### Via delle Cascate · tall-grass

Tabella `veloria/r11_cascade_patch` · 2 punti Tiled.

- morning: Pidgeotto 30% Lv28-32, Flaaffy 30% Lv28-32, Natu 25% Lv28-32, Eevee 15% Lv28-32
- day: Pidgeotto 35% Lv28-32, Flaaffy 35% Lv28-32, Natu 15% Lv28-32, Eevee 15% Lv28-32
- night: Drowzee 45% Lv28-32, Flaaffy 30% Lv28-32, Natu 25% Lv28-32

### Valle del Vento · tall-grass

Tabella `veloria/r12_wind_patch` · 2 punti Tiled.

- morning: Swinub 35% Lv33-37, Sneasel 25% Lv33-37, Natu 40% Lv33-37
- day: Swinub 45% Lv33-37, Sneasel 20% Lv33-37, Natu 35% Lv33-37
- night: Sneasel 45% Lv33-37, Swinub 35% Lv33-37, Pidgeotto 20% Lv33-37

### Tornanti Bianchi · tall-grass

Tabella `veloria/r13_snow_patch` · 2 punti Tiled.

- morning: Swinub 40% Lv35-39, Sneasel 25% Lv35-39, Seel 25% Lv35-39, Jynx 10% Lv35-39
- day: Swinub 40% Lv35-39, Sneasel 25% Lv35-39, Seel 25% Lv35-39, Jynx 10% Lv35-39
- night: Sneasel 40% Lv35-39, Piloswine 15% Lv35-39, Seel 25% Lv35-39, Jynx 20% Lv35-39

### Varco di Cristallo · tall-grass

Tabella `veloria/r14_crystal_patch` · 1 punti Tiled.

- morning: Piloswine 30% Lv38-42, Sneasel 30% Lv38-42, Onix 25% Lv38-42, Skarmory 15% Lv38-42
- day: Piloswine 30% Lv38-42, Sneasel 30% Lv38-42, Onix 25% Lv38-42, Skarmory 15% Lv38-42
- night: Piloswine 30% Lv38-42, Sneasel 30% Lv38-42, Onix 25% Lv38-42, Skarmory 15% Lv38-42

### Passo delle Due Luci · tall-grass

Tabella `veloria/r15_garden_patch` · 1 punti Tiled.

- morning: Dratini 10% Lv42-46, Xatu 20% Lv42-46, Natu 25% Lv42-46, Sneasel 25% Lv42-46, Graveler 20% Lv42-46
- day: Dratini 10% Lv42-46, Xatu 20% Lv42-46, Natu 25% Lv42-46, Sneasel 25% Lv42-46, Graveler 20% Lv42-46
- night: Dratini 10% Lv42-46, Xatu 20% Lv42-46, Natu 25% Lv42-46, Sneasel 25% Lv42-46, Graveler 20% Lv42-46

### Cammino dell’Equilibrio · tall-grass

Tabella `veloria/r16_garden_patch` · 3 punti Tiled.

- morning: Dratini 15% Lv45-49, Dragonair 5% Lv45-49, Xatu 20% Lv45-49, Sneasel 20% Lv45-49, Piloswine 20% Lv45-49, Ampharos 20% Lv45-49
- day: Dratini 15% Lv45-49, Dragonair 5% Lv45-49, Xatu 20% Lv45-49, Sneasel 20% Lv45-49, Piloswine 20% Lv45-49, Ampharos 20% Lv45-49
- night: Dratini 15% Lv45-49, Dragonair 5% Lv45-49, Xatu 20% Lv45-49, Sneasel 20% Lv45-49, Piloswine 20% Lv45-49, Ampharos 20% Lv45-49

### Vetracielo · Piazza della Monorotaia · woodland-understory

Tabella `veloria/vetracielo_park` · 1 punti Tiled.

- morning: Magnemite 25% Lv12-15, Voltorb 25% Lv12-15, Pikachu 20% Lv12-14, Mareep 15% Lv12-14, Pidgey 15% Lv11-13
- day: Magnemite 25% Lv12-15, Voltorb 25% Lv12-15, Pikachu 20% Lv12-14, Mareep 15% Lv12-14, Pidgey 15% Lv11-13
- night: Magnemite 25% Lv12-15, Voltorb 25% Lv12-15, Pikachu 20% Lv12-14, Mareep 15% Lv12-14, Hoothoot 15% Lv11-13

