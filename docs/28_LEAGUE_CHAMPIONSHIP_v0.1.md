# Lega di Veloria: campionato ed epilogo

## Stato e perimetro

Implementazione locale **0.3.96**, non ancora attestata come pubblicata da questo documento. Catalogo integrato: 48 mappe, 44 missioni, 23 allenatori, 11 negozi, 270 asset, 69 specie e 78 mosse supportate. Le nuove stanze proseguono lo stile 2D illustrato del piazzale; l’interfaccia resta fruibile in portrait e landscape.

Questa consegna collega il finale della storia alla vittoria della Lega e alla cerimonia. Non certifica il completamento di tutto il progetto: bilanciamento con una squadra cresciuta naturalmente, catalogo delle 251 specie, post-game, abilità e tutte le evoluzioni previste restano lavori aperti.

## Accesso e percorso

Il catalogo autorevole è `content/challenges/veloria_league.sequence.json`, ID `velorialeague`. Per iniziare occorrono:

- `q_resonance_restored`, ottenuto al Santuario;
- le otto medaglie effettive nell’array del salvataggio: `badge_aurora`, `badge_corolla`, `badge_circuito`, `badge_acciaio`, `badge_marea`, `badge_riflesso`, `badge_brina`, `badge_armonia`;
- almeno un Pokémon cosciente.

Dal terminale del piazzale il giocatore sceglie **INIZIA IL TENTATIVO** oppure **MI PREPARO ANCORA**. Il primo comando avvia il tentativo e porta alla prima stanza; non avvia automaticamente la battaglia. Si parla con l’avversario e si sceglie **SFIDA**. Dopo ciascuna vittoria il terminale offre **PROSEGUI ALLA PROSSIMA PROVA**: la progressione è esplicita e ordinata.

Le cinque tappe sono:

| Tappa | Mappa | Avversario | Squadra e livelli | Premio allenatore, prima vittoria |
| --- | --- | --- | --- | --- |
| `council1` | `veloria/league_council01` | Nerea | Blastoise 50, Quagsire 51, Dewgong 52 | 3.000 monete |
| `council2` | `veloria/league_council02` | Silvo | Butterfree 51, Beedrill 52, Venusaur 53 | 3.000 monete |
| `council3` | `veloria/league_council03` | Brando | Magneton 53, Steelix 53, Ampharos 54 | 3.000 monete |
| `council4` | `veloria/league_council04` | Luce | Hypno 54, Slowbro 55, Espeon 56 | 3.000 monete |
| `champion` | `veloria/league_champion` | Enea | Venusaur 57, Charizard 57, Blastoise 57, Ampharos 58, Steelix 58, Dragonite 60 | 5.000 monete |

I set completi sono nei cinque file `content/trainers/league_*.trainer.json`. La validazione controlla ogni mossa contro il learnset ufficiale HGSS della specie e il livello assegnato. Ronzio e Velenpuntura ampliano le opzioni di Butterfree e Beedrill senza introdurre mosse inventate. Espeon usa Psicoraggio: Psichico arriva al livello 64 e non viene anticipato. Dragonite è sopra la soglia di evoluzione 55.

## Regole del tentativo

- HP, PP, stati, esperienza e strumenti consumati attraversano le tappe: nessuna cura automatica tra gli avversari.
- Cure gratuite e deposito sono vietati durante il tentativo. Gli oggetti utilizzabili in battaglia restano consentiti.
- Le stanze non contengono centri, punti di riposo, deposito o terminali di trasporto. Il controllo dei servizi è applicato anche nell’adattatore di gioco.
- **INTERROMPI IL TENTATIVO** richiede una conferma esplicita; il ritorno delle stanze interrompe la sequenza.
- Sconfitta o pareggio interrompono il tentativo. Il checkpoint è `veloria/league_forecourt`, spawn `league_checkpoint`, sulla casella (20, 8).
- Dopo un’interruzione si ricomincia dalla prima tappa. HP, PP, strumenti, denaro ed esperienza correnti non vengono ripristinati a una fotografia precedente: il giocatore può prepararsi nuovamente al piazzale.

## Salvataggi e recupero

`src/core/world/challenge-sequence.ts` gestisce la macchina a stati senza dipendenze da Phaser. I flag del tentativo comprendono attività, battaglia pendente, vittorie ordinate e blocchi temporanei degli allenatori. Le ricevute `firstRewardFlag` rimangono permanenti.

Il gioco salva prima di spostarsi e prima di avviare una battaglia. Se il salvataggio fallisce, mostra **RIPROVA SALVATAGGIO** e blocca l’avanzamento dipendente dal commit. Non basta chiudere la finestra per considerare persistita una vittoria.

Al caricamento:

- un tentativo attivo valido tra due incontri può essere ripreso;
- una battaglia marcata pendente non viene ricostruita: il tentativo viene interrotto e il giocatore torna al checkpoint;
- stati incoerenti, tentativi rimasti fuori dalle stanze o stanze raggiunte senza tentativo valido vengono recuperati secondo le regole del core;
- una vittoria finale già registrata conserva il titolo e rende disponibile la cerimonia, anche se non era stata ancora letta.

Il salvataggio usa revisioni crescenti e seleziona il candidato valido più recente tra IndexedDB e fallback locale, inclusi i backup. Il fallback non deve far prevalere una copia IndexedDB più vecchia dopo un errore di scrittura. I test della persistenza verificano questo contratto; non è un rollback delle risorse di gioco.

## Ricompense e completamento

`src/game/battle/challenge-settlement.ts` riceve il salvataggio con gli esiti della battaglia già applicati e produce un unico snapshot con vittoria della tappa, eventuale premio allenatore e avanzamento finale.

Ogni premio allenatore è riconosciuto una sola volta tramite la ricevuta permanente della tappa. Interrompere e ripetere la prima prova non genera nuovamente il denaro. Il totale dei premi allenatori, se mai riscossi prima, è 17.000 monete.

Solo l’ultima vittoria emette `league/championship/won`. La missione `veloria/q_league_championship` richiede le cinque vittorie e la Risonanza ripristinata, imposta `q_league_completed` e assegna una volta **10.000 monete e 3 Iperpozioni**. Gli eventi dei singoli allenatori non rappresentano missioni permanenti delle tappe: l’ordine e il tentativo sono responsabilità della sequenza.

Dopo il completamento il tentativo viene ripulito dai flag temporanei; le ricevute, il titolo e le ricompense rimangono.

## Cerimonia ed epilogo

`src/game/ui/LeagueCompletion.ts` presenta un traguardo già salvato. Non assegna denaro né modifica autonomamente il salvataggio. Testi e conclusione narrativa sono in `content/story/league_epilogue.v1.json`.

La cerimonia mostra il nome dell’allenatore e **la squadra attualmente con il giocatore**, poi passa all’epilogo con Elia e al ritorno a Veloria. Non è implementato un albo storico delle squadre vincitrici: rivedere il traguardo dopo avere modificato la squadra mostra quella corrente.

Al termine della lettura `league/epilogue/seen` imposta `q_league_epilogue_seen`, senza ricompense aggiuntive. Il terminale offre **RIVEDI IL TRAGUARDO** ai campioni; la revisione non riapre premi già riscossi. L’epilogo dichiara esplicitamente che nuove aree e missioni post-game sono ancora future.

## Estensione e controlli

Per aggiungere una sequenza:

1. Creare un documento `content/challenges/*.sequence.json` conforme a `ChallengeSequence`, con ID univoco, requisiti, mappe membro, checkpoint esterno, politica dei servizi e tappe ordinate.
2. Registrare mappe e spawn sicuri; ogni stanza deve avere un ritorno accessibile. Collocare esattamente un NPC della tappa con `challengeId`, `challengeStageId` e `trainerId` coerenti. Il blocco dell’allenatore deve corrispondere a `battleOnceFlag` della tappa.
3. Usare flag di tentativo e ricevute univoci, senza sovrapporli ai flag delle missioni. Solo `completedFlag` deve essere registrato dalla missione finale con il corrispondente `completionEvent`.
4. Definire squadre con specie registrate e mosse supportate, disponibili nei learnset ufficiali ai livelli indicati. Aggiungere immagini e fonti attraverso la pipeline degli asset.
5. Collegare l’ingresso al registro dichiarativo e alla presentazione del gioco. Non aggiungere cure, deposito o trasporto nelle stanze del tentativo.
6. Verificare ordine, interruzione, ricaricamento pendente, premi unici, recupero da errori di salvataggio, orientamenti mobili e primo accesso offline.

`tools/challenge_sequence_validation.py`, integrato in `tools/validate_examples.py`, verifica i riferimenti e le collisioni tra cataloghi, requisiti delle medaglie, completamento, spawn, NPC, ritorni, servizi vietati e legalità delle mosse. Non contiene un numero fisso di otto medaglie: usa il registro e i requisiti del documento. I flag posseduti dal core vengono aggiunti all’insieme dei flag noti solo dopo aver escluso sovrapposizioni con quelli delle missioni.

## Evidenza disponibile

Sette test browser passati dopo la correzione del fallback: tutti i cinque incontri, premi unici dopo ripetizione, interruzione, sconfitta senza cure, ripresa dopo battaglia pendente, blocco con entrambi gli archivi indisponibili, recupero della riserva locale più recente, cerimonia dopo reload ed epilogo persistente. Sono passati anche 451 test di dominio, 25 della persistenza e 103 Python. Stato offline e pubblicazione aggiornati in `docs/CI_STATUS.md`.

Le prove con fixture di squadra servono a verificare funzionalità e persistenza; non dimostrano il bilanciamento dell’intera avventura dall’inizio al finale.
