# Ricerche ambientali dei Pokémon rari — 0.4.47

## Comportamento

Articuno, Zapdos, Moltres, Mewtwo e Mew hanno una ricerca distinta, descritta in `content/encounters/legendary-research.v1.json`. La Lega sblocca la conclusione delle ricerche; gli indizi si possono annotare anche prima, in qualunque ordine. Le cinque mappe contengono 12 indizi e cinque prove ambientali, senza collisioni aggiuntive. I punti finali e i loro ostacoli compaiono soltanto dopo la prova risolta.

Diario, mappa regionale e Pokédex indicano inizialmente una macrozona. Il diario conserva il testo degli indizi raccolti. Quando tutti gli indizi sono disponibili, permette di localizzare la prova; il rifugio viene localizzato soltanto dopo averla risolta. Un errore azzera la sequenza della prova, senza cancellare gli indizi. Anche una sequenza parziale è salvata.

Le prove sono: correnti NORD/OVEST/EST per Articuno, circuito terra/bobina/antenna per Zapdos, alba/vento/fiamma/alba per Moltres, riflessione stella/onda/cerchio/stella per Mewtwo, acqua/foglia/vento per Mew. Le risposte si deducono dai testi ambientali, senza attese reali o obblighi giornalieri.

La ricompensa della ricerca è una tantum: rispettivamente 800, 900, 900, 1200 e 1000 monete. I salvataggi con catture già registrate conservano i Pokémon; possono completare la ricerca d'archivio, senza generare un'altra copia. Snorlax mantiene il proprio funzionamento precedente.

## Architettura e verifica

Il modello di ricerca è indipendente da Phaser. I dati collegano eventi missione, flag, mappe e sequenze; il validatore offline verifica questi collegamenti insieme ai punti Tiled e alle collisioni condizionali. L'indice statico degli obiettivi viene rigenerato dai dati Tiled. Il mondo salva ogni indizio e ogni passo della sequenza prima di confermare il risultato nell'interfaccia.

Verifiche eseguite: TypeScript; 831 test dominio, 31 persistenza, 5 budget; 154 test Python; validatore completo (48 mappe, 67 missioni, 1098 media). Le sei nuove prove browser sono passate: cinque ricerche complete con movimento/interazione reale, errore e soluzione; Articuno con reload a sequenza parziale e rilettura; archivio di cattura precedente con indizio pre-Lega, ricompensa unica e squadra invariata. Le dieci regressioni browser sono passate: diario Snorlax, stati di ricerca/scoperta/cattura di Zapdos, pesca costiera, percorsi R13/R15 e tre stati del santuario. Dopo la verifica congiunta è stata mantenuta la precedenza dell’interazione davanti al personaggio, evitando che un indizio sotto i piedi intercetti la lettura di una missione precedente. La ricerca completa di Articuno è passata anche offline sulla build di produzione: risorse scaldate online, connessione disattivata, indizi con azione A, reload dopo il primo indizio e dopo il primo simbolo, soluzione e ricompensa800, nessuna cattura duplicata né errori/reti fallite. Copertura CI verificata:457 casi browser assegnati una sola volta;90 casi offline (1 percorso +89 risorse in quattro shard23/22/22/22). Build e TypeScript passano. Versione0.4.47, service worker v211; pubblicazione in corso.

## Lavoro successivo

La probabilità di cattura basata sul `capture_rate` ufficiale della specie non è modificata da questa tranche. Coppe, rivincite itineranti, ulteriori attività del dopogioco e le restanti animazioni di camminata dei personaggi restano nel piano generale.

Il precedente rilascio0.4.46 è pubblico: Deploy41051063886 riuscito e service worker pubblico v210 verificato. Verify41051063958 ha completato32/33job: lo shard chapters9 aveva29 casi passati prima del timeout di step24minuti, senza un errore di asserzione. Il limite dello step browser è36minuti, entro il limite job50, mantenendo un solo worker.
