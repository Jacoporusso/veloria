# Veloria — Specifica funzionale MVP (v0.3)

## 1. Goal misurabile

Consentire una partita completa su iPhone in verticale: **Nuova partita → scelta starter → Borgofonte → Sentiero dell'Alba → Bosco dei Veli → Brumalta → prima Palestra → salvataggio della Medaglia Aurora**. Target di design: **30–45 minuti**. È una stima della durata del gameplay, non dei tempi di sviluppo.

### In scope

| Sistema | Obbligatorio nel vertical slice | Criterio di accettazione |
|---|---|---|
| Installazione | PWA con icona e avvio standalone su iPhone | Si avvia dalla Home, non richiede account |
| Offline | Precache dati e asset utilizzati | Una sessione completa funziona in modalità aereo **dopo** installazione/caricamento e verifica della cache |
| Controlli | D-pad touch, A/B, menu; frecce/WASD da desktop | Movimento coerente; nessuno scroll involontario pagina durante il gioco |
| Esplorazione | Movimento grid-based o tile-to-tile, camera, ostacoli | Non si attraversano collisioni; i passaggi fra mappe mantengono spawn coerenti |
| NPC | Dialoghi multilinea e flag | Ada cambia dialogo dopo missione; il professore non consegna più starter |
| Starter | Pikachu, Charmander, Squirtle, Bulbasaur | Esattamente uno, livello 5, registrato in squadra e Pokédex |
| Incontri | Erba alta e tabelle di incontro giorno/notte | Nessun incontro in città; differenza osservabile nei pool giorno/notte |
| Battaglia | 1 vs 1 a turni con quattro mosse, PP, tipi, danni, XP, sconfitta | Esiti riproducibili con random seed fissato |
| Cattura | Oggetto cattura, probabilità, aggiunta a squadra/box | Mai >6 nel party; nessuna duplicazione salvando/ricaricando |
| Centro Pokémon | Cura completa squadra | HP/PP ripristinati; eventuali stati guariti |
| Negozio | 2–3 consumabili (cura, cattura, antidoto) | Acquisto vincolato a disponibilità denaro e capacità inventario |
| Palestra | Puzzle breve, allenatore, Mira tipo Normale | Una sola medaglia; dialoghi e ricompensa coerenti dopo la vittoria |
| Salvataggio | Auto/manuale, IndexedDB, export/import JSON | Reload e update non azzerano la squadra o le medaglie |
| Audio | Musica/FX originali o licenziati, impostazioni mute | Avvio audio dopo gesto utente; mute persistente |
| Accessibilità | Testi leggibili, scelta velocità testo, feedback non solo cromatico | Nessuna azione essenziale dipende da un colore solamente |

### Fuori scope iniziale

251 specie giocabili immediatamente; metropoli Vetracielo completa; altri sette badge; trading online; multiplayer; multiplayer locale; multiplayer offline; breeding; shiny hunting; breeding, gioco competitivo e PvP; Pokémon seguace; cloud save; account; meteo avanzato; localizzazione multilingua; distribuzione in store.

## 2. Aree e passaggi di stato

- `veloria/borgofonte`: prologo, casa, laboratorio, prof.ssa Elia, Nilo; senza incontri.
- Interni collegati al borgo: `veloria/borgofonte_home` (camera, letto per riposare, diario) e `veloria/borgofonte_lab` (Elia, scelta starter, rilevazioni e strumenti). La partita iniziale parte ancora nella piazza; Elia riceve nel laboratorio. Si entra camminando sulla soglia e si interagisce con A.
- `veloria/r01_sentiero_alba`: erba alta, due allenatori, un oggetto, checkpoint di tutorial.
- `veloria/d01_bosco_veli`: missione di Ada, oggetto chiave, blocco narrativo rimovibile, incontri selezionati.
- `veloria/brumalta`: Centro Pokémon, bottega, NPC, accesso alla Palestra.
- `veloria/gym01_brumalta`: puzzle a passaggi, sfida a Mira, consegna Medaglia Aurora.

I passaggi `R02` o "Viale delle Fronde" possono essere modellati come segmento di collegamento distinto, ma non aumentare lo scope artistico finché non verificato il loop.

### Quest principale: prologo

1. `q_prologue_started` quando si avvia la partita.
2. `q_starter_selected` quando lo starter è scelto; la scena blocca la doppia assegnazione.
3. `q_research_sample_received` con dialogo della prof.ssa Elia.
4. `q_ada_helped` al termine della mini-missione nel bosco.
5. `q_brumalta_visited` al primo ingresso in città.
6. `badge_aurora_awarded` dopo la vittoria contro Mira.

Eventi: idempotenti e scritti su save versionato; un evento ripetuto non crea ricompense duplicate.

## 3. Starter

| Pokémon | id nazionale | Livello | Disponibilità |
|---|---:|---:|---|
| Pikachu | 25 | 5 | Scelta iniziale |
| Charmander | 4 | 5 | Scelta iniziale |
| Squirtle | 7 | 5 | Scelta iniziale |
| Bulbasaur | 1 | 5 | Scelta iniziale |

Specie di lancio aggiuntive del vertical slice: Rattata, Pidgey, Sentret, Hoothoot, Caterpie, Metapod, Butterfree, Weedle, Kakuna, Beedrill, Bellsprout, Oddish, Spinarak, Mareep, Wooper, Poliwag. La lista è **design target**, non una tabella completa di spawn. Nel prototipo le linee Caterpie → Metapod → Butterfree e Weedle → Kakuna → Beedrill sono attive alle soglie di livello 7 e 10. Tutte le sei specie sono nel registro e hanno artwork runtime; frequenza e soglie restano da validare con playtest.

## 4. Flusso UX e controlli

- Orientamento: verticale con rendering adattabile; viewport logica candidata **360 × 640**, da convalidare con safe area e proporzioni iPhone.
- D-pad semitrasparente sul basso a sinistra, A (interagisci/conferma), B (annulla/corri se la scena lo consente), Menu/Start.
- Nella battaglia UI a scelte grandi: Lotta / Borsa / Pokémon / Fuga; sottomenu Mosse con PP e tipo.
- Tutti i dialoghi e controlli vitali in un'area sicura; non sovrapporre i controlli agli elementi narrativi.
- Input separato dal game loop: il dominio riceve comandi astratti `Move`, `Interact`, `ChooseMove`, `UseItem`, `SwitchCreature`, `Save`.

## 5. Scenari di accettazione (E2E)

**E2E-01 — Starter:** avvia nuova partita, entra nel laboratorio di Borgofonte dalla porta, parla con Elia e scegli Charmander; verifica party con una sola entità e impossibilità di ricevere un secondo starter.

**E2E-02 — Navigazione:** cammina da Borgofonte al bosco, ricarica durante un percorso, verifica coordinate/spawn validi e assenza di blocco irreversibile.

**E2E-03 — Combattimento:** affronta un Pidgey selvatico, esaurisci i PP di una mossa, usa un'altra mossa, termina la battaglia; HP/PP/XP persistono. La porzione Playwright gira anche a 320×568 portrait e verifica che il canvas di battaglia resti dentro il viewport senza overflow di pagina; safe area e leggibilità su hardware restano da confermare sul dispositivo reale.

**E2E-04 — Cattura e deposito:** con squadra piena cattura un Pokémon; entra nel deposito, verifica la nuova istanza e l'assenza di duplicazione dopo il reload.

**E2E-05 — Badge:** sconfiggi Mira, ottieni una sola Medaglia Aurora; il capopalestra cambia dialogo; riavvia la PWA e verifica stato persistente.

**E2E-06 — Offline:** su iPhone, apri almeno una volta il gioco installato online, conferma tutte le risorse necessarie, attiva modalità aereo, riapri e completa il loop fondamentale senza richieste remote. La porzione Playwright desktop copre precache, nuovo gioco/starter, percorso Borgofonte–Bosco, pickup, transizioni mappa, incontro e cattura con squadra e inventario persistiti, verificando zero richieste fallite; non sostituisce la prova manuale su iPhone standalone in modalità aereo.

**E2E-07 — Backup:** esporta un JSON, cancella lo stato, reimporta e conferma identità univoche, mappa, progressione, party e inventario.

**E2E-08 — Migrazione:** apri un salvataggio `schemaVersion=1` in una build successiva con migration test, senza perdita di medaglie o Pokémon.

**E2E-13 — Interni di Borgofonte:** entra nel laboratorio e nella casa dal paese, verifica il ritorno davanti alle rispettive porte e la posizione dopo il reload. Al letto, cura una squadra con HP/PP ridotti e avvelenamento valido nello schema; la guarigione deve essere persistita. Una soglia rimane utilizzabile anche quando si sovrappone a una zona con messaggio ambientale.

## 6. Criteri di uscita (release gate)

- Nessun blocker E2E-01..08.
- Playtest completato su almeno un iPhone reale in Safari standalone e su Android Chrome/PWA o emulator se non disponibile.
- Nessuna risorsa remota richiesta durante il loop offline.
- Asset ownership/licenza verificata; nessun asset di terzi copiato dal codice sorgente di giochi commerciali senza permesso.
- Backup documentato e codice/log privi di dati personali non necessari.

**Non incluso:** tempi o effort certi. Le stime si faranno dopo prototipo di movimento/asset performance.

## Avvio e conclusione del primo capitolo — aggiornamento 17/10/2026

- Titolo Atlante: Nuova partita e, quando esiste un salvataggio valido, Continua partita con riepilogo nome/luogo. Nuova partita richiede una conferma esplicita prima di sostituire il viaggio attuale.
- Nome allenatore: 1–16 caratteri visibili, Unicode normalizzato, errore leggibile per nomi vuoti/invalidi. Nome e prima posizione vengono salvati prima di entrare nel mondo; nessuna migrazione perché player.name esiste già nello schema v2.
- Introduzione di Borgofonte con nome del giocatore, motivo del viaggio e istruzioni per il laboratorio. La conclusione dell’introduzione è persistita; ricaricare durante l’introduzione consente di riprenderla.
- Indicazioni sul laboratorio e su Elia; comando contestuale A vicino a NPC e oggetti. Pikachu, Charmander, Squirtle e Bulbasaur sono selezionabili una sola volta nel laboratorio. L’uscita verso R01 richiede lo starter; casa e laboratorio restano accessibili.
- Dopo la prima vittoria su Mira, riepilogo Primo capitolo completato con Medaglia Aurora, nome, squadra e specie effettivamente possedute. Continua a esplorare salva la presa visione. È la conclusione del prologo MVP, non dell’avventura a otto Palestre.
- Portrait e landscape entrambi richiesti; pad originale a destra e A/B/S a sinistra, secondo approvazione utente del 17/10. Il precedente posizionamento a sinistra descritto nella bozza è superato.

La giocabilità completa senza dati di scenario artificiali resta un gate separato: i test di sistemi e le prove che preparano scenari mirati non sostituiscono il playtest di progressione naturale fino a Mira.

### Scontri prolungati, prototipo v4

A PP esauriti LOTTA resta utilizzabile tramite Scontro d’emergenza, con avviso del contraccolpo; gli slot salvati non cambiano. Doppio KO gestito come pareggio, con soccorso se tutta la squadra è esausta. Il flusso non sostituisce la verifica del bilanciamento naturale fino a Mira.
