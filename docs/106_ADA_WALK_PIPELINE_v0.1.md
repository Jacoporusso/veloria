# Ada: pipeline di camminata e prova isolata

## Estensione dello strumento — 30 ottobre

La scena di prova accetta ora qualsiasi profilo con ciclo validato tramite `?npcAnimationPreview=<id>`, con nome, immagini e fasi dal catalogo; Ada resta il ciclo già integrato. Il parametro continua a essere ignorato in produzione. Test e limiti in `124_GENERIC_NPC_WALK_PREVIEW_v0.1.md`. Le sezioni successive descrivono la tranche storica0.4.30.

## Ambito della versione 0.4.30

Ada dispone di otto disegni di movimento indipendenti: due passi per ciascuna delle quattro direzioni. È un prototipo della pipeline, non una camminata definitiva per tutto il cast. Nella campagna Ada resta nella posizione e nel ruolo previsti: nessuna pattuglia, modifica a collisioni, missioni o dialoghi.

La scena di prova è disponibile solo nel server di sviluppo con `?npcAnimationPreview=ranger-ada`. Permette movimento reale nelle quattro direzioni, arresto e preferenza di movimento ridotto, in portrait e landscape. Il query parameter è ignorato in produzione. La scena non carica o scrive il salvataggio della campagna.

## Immagini e ancoraggio

Generazione con ImageGen integrato. Fonti PNG immutate in `assets/sources/veloria-ada-walk-*-v1.png`; runtime WebP lossless con gli stessi pixel RGBA. Prompt, identificativi di generazione, hash, candidati scartati e motivazioni sono in `assets/prompts/ada-walk-views-v1.json`. I due primi passi laterali B non alternavano realmente le gambe e sono stati sostituiti; un successivo candidato est perdeva il misuratore ed è stato scartato. Il frame zero rappresenta la gamba anatomica sinistra in avanti.

Corrette anche le idle nord/est: borsa e misuratore rimangono sul lato anatomico sinistro. Originali e provenienza in `assets/prompts/ada-idle-side-corrections-v3.json`; sud/ovest conservati. Nessuna immagine è stata specchiata, ritagliata o ripulita per ottenere una direzione.

La calibrazione mantiene il corpo a circa 56 worldpx e l'origine verticale ai piedi. L'origine orizzontale stabilizza la testa fra le due fasi conservando lo scostamento medio della coppia: il solo centro del piede avanzato produceva salti laterali fino a circa 4,77 worldpx. Misure prima/dopo in `anchorReview` del documento prompt; i pixel sorgente restano invariati. La naturalezza del ciclo a due fasi resta migliorabile.

## Contratto estendibile

`walkCycle` contiene `frameDurationMs` e `views` con `up`, `down`, `left`, `right`. Ogni direzione contiene almeno due pose `{assetKey, origin, displaySize}`. Il validatore richiede asset distinti fra loro e dalle idle, riferimenti esistenti, durata positiva finita e geometria valida. Le direzioni possono avere quantità diverse di frame.

Il selettore puro sceglie idle o passo senza modificare posizione, collisioni, dialoghi o RNG. Il controller Phaser gestisce il tempo e applica la posa; il chiamante conserva la responsabilità del movimento. Arresto e cambio direzione ripartono dalla fase iniziale. Con movimento ridotto la traslazione resta disponibile e la posa di camminata rimane fissa. Preparazione delle texture e applicazione della posa sono comuni alle idle, con scala uniforme e superfici entro 512px. Questo limite non costituisce una misura della memoria GPU o dei picchi di caricamento.

`assets/npc-walk-cycles-v1.json` registra le otto fonti, hash, dimensioni e pose; tutti gli asset sono dichiarati nel catalogo e nella MapDefinition D01. Rimosso soltanto da D01 il riferimento inutilizzato al vecchio atlante NPC, conservato altrove e nel precache.

## Evidenze locali

- Due prove Chrome della scena: quattro direzioni, alternanza reale delle chiavi, arresto, movimento ridotto, orientamenti, scala uniforme, salvataggio invariato. Ripetute dopo la stabilizzazione delle origini: `.tmp/ada-motion-preview-final.log`, due passate.
- Prove di Ada nella campagna e delle 51 presenze nei due orientamenti già passate: `.tmp/ada-motion-native.log` (i due casi iniziali della nuova scena fallivano per un confronto del gancio test `null`/`false`, corretto e ripetuto separatamente).
- Primo accesso offline a quattro idle e otto passi, decode alle dimensioni originali e quattro approcci reali al dialogo: `.tmp/ada-atlas-offline-final.log`. Non equivale a una camminata offline nella campagna.
- 828 test dominio/persistenza, 154 Python e validatore 786 media/48 fondali/48 mappe passati. Build passata, con avviso sulle dimensioni del chunk Phaser.

Restano 37 identità senza quattro idle dedicate, la produzione/verifica delle animazioni degli altri personaggi e la partita naturale corrente dopo la prima medaglia fino alla Lega. Nessuna dichiarazione di completamento del progetto deriva dai conteggi del catalogo.
