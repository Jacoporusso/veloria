# Changelog — Veloria Project Pack

## v0.3 — 09/10/2026

- Consolidati GDD v0.1 e World Map Design v0.2 originali senza sovrascriverli.
- Inclusa mappa illustrata della regione, concept approvato come direzione grafica.
- Aggiunte specifiche MVP, architettura, art direction, ruleset decision log, content pipeline, backlog, playbook AI, note diritti, revisione mappa.
- Aggiunti dati di esempio e validatore locale senza dipendenze.
- Esplicitato che lo ZIP non è ancora il gioco, e che la mappa artistica non è una tilemap Tiled.
- Chiarito il perimetro delle specie MVP e il tema delle evoluzioni raggiungibili.

## v0.2 — 09/10/2026

- Definita geografia regionale, città, otto Palestre, dungeon e 16 percorsi.

## v0.1 — 09/10/2026

- Stabilita visione di progetto PWA Phaser e vertical slice.

## 17/10/2026 — Atlante immersivo approvato

- Integrato il prototipo approvato: mappa a tutto schermo, menu compatto, obiettivo richiudibile, dialoghi e pannelli blu con gradienti.
- Ripristinati esattamente aspetto e griglia del pad originale; azioni A/B/S a sinistra e movimento a destra.
- Camera adattiva a stanze, mappe ampie e rotazione del dispositivo; PWA shell v33.

## 17/10/2026 — Nuova partita e prologo

- Schermata titolo Atlante con continua, conferma nuova partita e nome allenatore.
- Introduzione personalizzata, indicazioni a laboratorio/Elia, comando A contestuale e descrizioni degli starter.
- Riepilogo del primo capitolo dopo Mira, con dati reali di squadra e salvataggio.
- Contenuti 0.3.19, cache PWA v34; i vecchi salvataggi restano compatibili.

- Salvataggio iniziale con errore visibile e riprova; ritorno al titolo solo dopo scrittura riuscita, con test browser di memoria esaurita.

## 17/10/2026 — Effetti delle mosse di stato

- Ruleset prototipo v2: Growl, Tail Whip e Defense Curl modificano le statistiche durante la battaglia.
- Effetti definiti nei dati, limiti e reset al cambio/cattura; nessuna modifica allo schema dei salvataggi.
- Contenuti 0.3.20 e cache PWA v35.

## 17/10/2026 — Efficacie dei tipi e IA

- Matrice locale completa di 17 tipi con provenienza PokéAPI registrata; ruleset prototipo v3.
- IA pura collegata ai profili allenatore: efficacie, mosse di preparazione utili e rotazione dei selvatici.
- Contenuti 0.3.21, cache PWA v36; nessuna modifica allo schema save.
- CI: i nuovi commit attendono la verifica in corso invece di cancellarla; resta in coda la revisione più recente.

## 17/10/2026 — Battaglie senza PP

- Scontro d’emergenza per entrambe le squadre: nessun PP aggiunto, contraccolpo e gestione del doppio KO.
- Corretti i cambi infiniti tra riserve senza PP e il ripristino errato di sonno/congelamento dopo il recupero.
- Ruleset prototipo v4; contenuti 0.3.22 e cache PWA v37.

## 17/10/2026 — Starter visibili e uscita verso R01

- Quattro artwork PokéAPI locali su richiesta dell’utente per il prototipo privato, con fonti e checksum registrati.
- Indicazioni dopo la scelta e soglia nord del villaggio corrette; test reale fino al Sentiero dell’Alba.
- Contenuti 0.3.23, cache PWA v38.

## 17/10/2026 — Progressione e playtest naturale

- Apprendimento al livello 6 dei quattro starter, con eventi UI e persistenza negli slot esistenti.
- Prima calibrazione di Mira basata su partite senza preparazione artificiale.
- Playtest lungo separato dalla CI, con rapporto di battaglie/progressi e verifica del salvataggio finale.
- Ruleset prototipo v5; contenuti 0.3.24 e cache PWA v39.

- Cattura raggiungibile da tastiera anche con opzioni adiacenti disabilitate; riepilogo capitolo protetto dal tasto ancora premuto.
- Prologo completato tramite controlli reali con tutti e quattro gli starter, cattura e salvataggio/ripresa verificati.

## 17/10/2026 — Personaggi e mondo più definiti

- Sei NPC illustrati, quattro varianti di chioma, terreno HD a Borgofonte/R01/Bosco e rendering indipendente dalla griglia 32 px.
- Pidgey e altre sette specie ora visibili con artwork locali registrati; tutte le 20 specie MVP coperte.
- Pulsanti battaglia navy a gradiente e icone, ridimensionamento osservato per rotazione mobile.
- Sensore riconoscibile e utilizzabile anche dalla sua casella; guida contestuale e indicazioni precise di Ada.
- Contenuti 0.3.25, cache PWA v40; prompt originali conservati.
