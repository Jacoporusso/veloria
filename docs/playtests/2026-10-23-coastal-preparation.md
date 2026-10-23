# Preparazione naturale a Nerea: cattura e primi allenamenti

Runtime0.3.118,23/10/2026. Il salvataggio importato mantiene correttamente `contentVersion`0.3.114: non viene riscritto per farlo apparire nuovo. Questa prova continua la partita Charmander con quattro medaglie; non attesta ancora una quinta medaglia o una campagna completa.

## Ricerca sulla costa

Partenza dal backup Portolume realmente guadagnato: Charmeleon23, Rattata3/7,1490 monete, una Sfera, quattro Pozioni e una Canna da pesca. Il driver importa il file dall’interfaccia e confronta squadra, inventario, denaro e RNG prima di agire. Nessuna modifica a Pokémon, livelli, strumenti, progressione o casualità.

Acquistate quattro Sfere dal mercato con il nuovo selettore quantità, spendendo600 monete. Raggiunta R08 attraverso l’uscita effettiva occidentale di Portolume(0,17). Pesca al pontile con pad e tasto azione. Politica esplicita: cercare Chinchou, tentare la fuga dagli altri selvatici e usare il Centro tra i tentativi. Le fughe fallite non vengono saltate.

In4,5min automatizzati si registrano sette lanci, sei battaglie: cinque fughe e una cattura. Charmeleon va KO due volte; nessuna sconfitta dell’intera squadra. Chinchou21 catturato al settimo lancio dopo tre Sfere, due tentativi falliti e uno riuscito. Stato finale della cattura:890 monete, due Sfere, quattro Pozioni; Chinchou32/62 HP con mosse/PP realmente usati nell’incontro. RNG3297684299 →1666587797. Nessun errore JavaScript.

Il driver si interrompe dopo la cattura perché il menu pesca è aperto e la successiva attesa di movimento non può riuscire. Questo tratto **non è un test interamente passato**. Il risultato di cattura proviene dagli eventi del motore; il problema è nel pilotaggio automatico della continuazione. Due tentativi preliminari avevano corretto soltanto coordinate del driver prima della prima pesca, senza essere considerati partite di bilanciamento.

## Ripresa senza ripetere la cattura

Lo stato completo viene recuperato dall’ultima osservazione in sola lettura della trace Playwright, confrontando esattamente squadra, inventario, flag e denaro con il report finale. `2026-10-23-coastal-capture-source.json` conserva evento grezzo, callId e SHA256 dell’archivio temporaneo; l’archivio completo non è conservato. I campi JavaScript `undefined` vengono omessi come farebbe `JSON.stringify`, senza cambiare i valori persistenti. Il normale `exportSave` genera il backup e `importSave` ne verifica checksum e uguaglianza dello stato.

La continuazione importa questo backup dalla UI e ricontrolla il cursore RNG. Chiude il menu pesca quando necessario, torna al Centro e mette Chinchou in testa attraverso Squadra. Nessun nuovo acquisto o cattura assegnata artificialmente.

Continuazione **passata in2,3min**: tre lanci di allenamento, due incontri realmente avvenuti e vinti, contro Tentacool e Chinchou.398 XP guadagnati; Chinchou resta al21. Due Pozioni consumate durante le lotte e cure gratuite al Centro tra i giri. Finale a Portolume: Chinchou21 in testa, Charmeleon23 e Rattata3/7; tutti curati,890 monete, due Sfere e due Pozioni. RNG finale453249528. Backup finale esportato dall’app e confrontato con il report; checksum valido. Nessun errore JavaScript.

## Cosa dimostra e seguito

Cattura costiera, disponibilità delle risorse, acquisto multiplo, ordine squadra, cure, battaglie, XP e backup funzionano in una continuazione con progressi reali. Ricerca e allenamento sono tratti consecutivi dello stesso stato, non campioni indipendenti o una singola esecuzione senza interruzioni.

La crescita lenta ufficiale di Chinchou richiede1734 XP dal21 al22: questi due incontri coprono soltanto398 XP. Nerea usa livelli26–28; prima di dichiarare la palestra bilanciata occorre provare gli allenatori disponibili, la composizione e le mosse della squadra e il tentativo effettivo. Non si modificano soglie, probabilità o ricompense per trasformare questa evidenza parziale in una vittoria.

Artefatti: report cattura e allenamento, osservazione grezza di provenienza, backup dopo cattura e backup finale con prefisso `2026-10-23-natural-coastal-` in questa cartella. Il driver usa `PLAYTEST_RESUME_NEREA_BACKUP` con il checkpoint Portolume o con il backup guadagnato sulla costa.
