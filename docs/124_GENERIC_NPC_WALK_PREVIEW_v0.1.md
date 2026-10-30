# Scena di prova per ogni ciclo NPC validato

La scena di sviluppo `NpcAnimationPreviewScene` riceve ora l'ID del profilo invece di essere legata ad Ada. `?npcAnimationPreview=<id>` entra nella scena soltanto se il catalogo dichiara un ciclo accettato da `npcWalkCycle`: le quattro idle e le immagini del cammino restano sottoposte ai validatori esistenti. Un ID sconosciuto o un'identità senza passi mantiene l'ingresso normale della campagna.

Nome accessibile e titolo derivano dalla descrizione del profilo. Immagini, direzioni, numero di fasi e durata provengono dal catalogo. La scena continua a usare solo il personaggio su griglia isolata, senza importare mappe o salvataggi della campagna e senza inventare pattuglie. Il movimento appartiene alla scena di prova; arresto e animazioni ridotte conservano il comportamento del controller esistente.

Il parametro è letto soltanto in DEV. La build produzione è passata e il manifest non include `NpcAnimationPreviewScene`; l'app pubblica continua a ignorare il parametro. Non cambia la versione dei contenuti o il precache: questo incremento è una generalizzazione dello strumento di sviluppo, non un nuovo ciclo già consegnato.

L'E2E scopre i profili con `walkCycle` dal catalogo e ripete gli stessi controlli per ciascuno, confrontando il rapporto dell'immagine con le dimensioni del manifest invece di imporre2:3. Al momento è presente solo Ada. Due casi coprono animazioni normali/ridotte, due orientamenti, quattro direzioni, tutti i frame, arresto in idle, scala uniforme e salvataggio invariato. Un caso aggiuntivo controlla ID sconosciuto e profilo senza walk; il controllo lazy-load del motore resta passato.

Quattro casi Chrome passati in35,6s (`.tmp/generic-walk-preview.log`), TypeScript e build passati con il noto avviso dimensioni chunk. Questa è la fotografia prima dell'integrazione di Elia; la successiva correzione e le prove del secondo ciclo sono nel documento125. Ada ed Elia verificati,46 cicli restanti.
