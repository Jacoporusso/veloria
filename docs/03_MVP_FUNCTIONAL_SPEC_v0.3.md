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
- `veloria/r01_sentiero_alba`: erba alta, due allenatori, un oggetto, checkpoint di tutorial.
- `veloria/d01_bosco_dei_veli`: missione di Ada, oggetto chiave, blocco narrativo rimovibile, incontri selezionati.
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

Specie di lancio aggiuntive del vertical slice: Rattata, Pidgey, Sentret, Hoothoot, Caterpie, Metapod, Butterfree, Weedle, Kakuna, Beedrill, Bellsprout, Oddish, Spinarak, Mareep, Wooper, Poliwag. La lista è **design target**, non una tabella completa di spawn. Quando si attivano evoluzioni di specie presenti, i loro target devono essere caricati con grafica appropriata; l'import automatico non basta a renderli pronti alla pubblicazione.

## 4. Flusso UX e controlli

- Orientamento: verticale con rendering adattabile; viewport logica candidata **360 × 640**, da convalidare con safe area e proporzioni iPhone.
- D-pad semitrasparente sul basso a sinistra, A (interagisci/conferma), B (annulla/corri se la scena lo consente), Menu/Start.
- Nella battaglia UI a scelte grandi: Lotta / Borsa / Pokémon / Fuga; sottomenu Mosse con PP e tipo.
- Tutti i dialoghi e controlli vitali in un'area sicura; non sovrapporre i controlli agli elementi narrativi.
- Input separato dal game loop: il dominio riceve comandi astratti `Move`, `Interact`, `ChooseMove`, `UseItem`, `SwitchCreature`, `Save`.

## 5. Scenari di accettazione (E2E)

**E2E-01 — Starter:** avvia nuova partita, scegli Charmander, verifica party con una sola entità e impossibilità di ricevere un secondo starter.

**E2E-02 — Navigazione:** cammina da Borgofonte al bosco, ricarica durante un percorso, verifica coordinate/spawn validi e assenza di blocco irreversibile.

**E2E-03 — Combattimento:** affronta un Pidgey selvatico, esaurisci i PP di una mossa, usa un'altra mossa, termina la battaglia; HP/PP/XP persistono.

**E2E-04 — Cattura e deposito:** con squadra piena cattura un Pokémon; entra nel deposito, verifica la nuova istanza e l'assenza di duplicazione dopo il reload.

**E2E-05 — Badge:** sconfiggi Mira, ottieni una sola Medaglia Aurora; il capopalestra cambia dialogo; riavvia la PWA e verifica stato persistente.

**E2E-06 — Offline:** su iPhone, apri almeno una volta il gioco installato online, conferma tutte le risorse necessarie, attiva modalità aereo, riapri e completa il loop fondamentale senza richieste remote.

**E2E-07 — Backup:** esporta un JSON, cancella lo stato, reimporta e conferma identità univoche, mappa, progressione, party e inventario.

**E2E-08 — Migrazione:** apri un salvataggio `schemaVersion=1` in una build successiva con migration test, senza perdita di medaglie o Pokémon.

## 6. Criteri di uscita (release gate)

- Nessun blocker E2E-01..08.
- Playtest completato su almeno un iPhone reale in Safari standalone e su Android Chrome/PWA o emulator se non disponibile.
- Nessuna risorsa remota richiesta durante il loop offline.
- Asset ownership/licenza verificata; nessun asset di terzi copiato dal codice sorgente di giochi commerciali senza permesso.
- Backup documentato e codice/log privi di dati personali non necessari.

**Non incluso:** tempi o effort certi. Le stime si faranno dopo prototipo di movimento/asset performance.
