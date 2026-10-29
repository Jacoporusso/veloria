# Piano per direzioni e animazioni NPC

## Aggiornamento del 28 ottobre

La tranche Nives/Aurel porta a undici i profili con quattro viste idle; le otto palestre sono tutte coperte. Le sezioni successive conservano la storia e i conteggi delle tranche precedenti. La camminata autentica di Ada resta un deliverable aperto: almeno due disegni per direzione, contratto idle/walk, avanzamento frame, test e scena isolata dove manca una rotta reale. Non viene considerata soddisfatta dalle pose idle, né richiede di inventare pattuglie nella campagna. Ogni identità restante conserva il proprio obbligo di produzione e verifica. Dettaglio del lotto in `105_NIVES_AUREL_DIRECTIONAL_IDLE_v0.1.md`.

## Stato verificato

L’inventario `docs/art/full-redesign-inventory.json` censisce48 profili/identità e51 presenze NPC. Il catalogo `content/characters/appearances.v2.json` ha48 profili e18 asset immagine. I profili collegano identità, apparizioni, asset e origine; Ada dichiara ora quattro viste idle indipendenti. Il descrittore di atlante dei profili statici specifica righe e colonne.

In `src/game/rendering/MapRenderer.ts`, i profili statici continuano a usare immagine/frame, dimensione60×60 e origine dichiarata. Ada usa `idleViews`: immagine, scala e origine per direzione. All’interazione `WorldScene` sceglie la posa rivolta al protagonista senza spostare NPC o collider. Non vengono ancora avanzati fotogrammi di camminata. Un profilo condiviso da più presenze canoniche conserva la medesima identità.

`src/game/rendering/npc-idle-motion.ts` applica ai profili statici un tween sinusoidale che varia `scaleY` dell’1,2% e mantiene posizione e origine. La preferenza per animazioni ridotte omette il tween; il test dedicato su Elia verifica variazione, ancoraggio e arresto. I profili con viste calibrate, oggi Ada, non ricevono quel tween per evitare che sovrascriva la scala della nuova posa. Il respiro non è un ciclo di camminata.

`tests/world/npc-identities.test.ts` controlla riferimenti, associazioni, unicità asset/frame e origini, oltre a tutte le immagini direzionali e agli hash delle sorgenti. La galleria E2E delle51 presenze verifica la posa base nei due orientamenti; il nuovo `npc-directional-idle.spec.ts` verifica separatamente quattro lati, ancoraggio, scala, ordine visivo e dialogo di Ada, con movimento reale. Mancano ancora camminate e copertura direzionale degli altri47 profili richieste dai documenti58 e61.

## Prima tranche proposta: Ada

Usare il profilo reale `ranger-ada` in `appearances.v2.json`: NPC `forest_ranger_ada`, dialogo `ada_quest`. Prima del collegamento delle nuove viste usava `veloria-npcs-v3`, frame1 e origine `{x:0.5332,y:0.998}`; quel disegno resta il riferimento di identità della produzione. La fonte narrativa è `content/dialogue/world.v1.json#/ada_quest`; il profilo la identifica come guardaboschi e ricercatrice sul campo, con giacca prugna e misuratore. Non aggiungere età o genere non documentati. Ha una singola apparizione/ID NPC e un ruolo di campo adatto a verificare fronte, retro e profili laterali.

Produrre artwork dedicato di Ada in quattro viste ortogonali autentiche (nord, sud, est, ovest), mantenendo volto, acconciatura, giacca e strumento coerenti. Per la prima tranche aggiungere un ciclo di camminata con almeno due disegni effettivi per direzione. Non ricavare le viste laterali da una rotazione o da un flip della figura frontale; non simulare passi scalando, traslando o deformando un’unica immagine. Tenere identiche dimensioni di cella e scala ottica; disegnare ogni posa con i piedi allineati alla stessa linea di appoggio e registrare un’origine normalizzata stabile, misurata sul contenuto visibile.

## Contratto dati e renderer da verificare nella tranche

Estendere il catalogo in modo esplicito e graduale: ogni asset/appearance deve poter descrivere le dimensioni della cella e i frame per `idle`/`walk` e direzione, con riferimenti controllabili entro i limiti dell’atlante. I frame devono provenire da artwork distinto. Conservare una modalità statica esplicita per i profili legacy finché non hanno nuove pose; un frame statico non va interpretato come se coprisse quattro direzioni. La mappa continua a selezionare il profilo d’identità e il punto di spawn, mentre la direzione e l’avanzamento dei frame sono responsabilità del renderer.

Il renderer deve ricevere la direzione effettiva del movimento o dell’interazione, selezionare la posa corrispondente e mantenere l’ancoraggio dei piedi durante il cambio di cella. Arresto, cambio direzione e movimento non devono alterare collisioni, posizione giocabile, dialoghi o RNG. Con animazioni ridotte si può fermare l’avanzamento del ciclo su una posa autentica; il cambio di direzione deve comunque mostrare la vista disegnata corretta. I test devono provare tutti e quattro i mapping, l’intervallo dei frame, il ritorno a idle, l’origine stabile e la modalità ridotta, senza accettare trasformazioni geometriche come sostituti dei disegni.

Ada oggi occupa un punto fisso: non introdurre una pattuglia o passi sul posto solo per esporre il ciclo. Nella scena reale la prima tranche verifica le quattro viste di attesa durante l'interazione. Se il contenuto non definisce un tragitto NPC, i frame di camminata vengono verificati in una scena di prova isolata con movimento controllato, senza presentarli come movimento già presente nella campagna.

## File e verifiche per il prossimo incremento

- Nuovo artwork e prompt/provenienza dedicati ad Ada, senza sovrascrivere l’atlante legacy condiviso.
- `content/characters/appearances.v2.json` e `content/characters/README.md` per dichiarare la capacità animata mantenendo gli altri profili statici.
- `src/game/rendering/MapRenderer.ts` e un modulo circoscritto di selezione/avanzamento pose per legare movimento e frame; conservare l’origine dei piedi anche tra pose di altezza variabile.
- Nuovi test unitari `tests/world/npc-animation.test.ts`, più l’aggiornamento mirato dei controlli catalogo in `tests/world/npc-identities.test.ts`.
- Un E2E mirato in `tests/e2e/npc-identities.spec.ts` o `tests/e2e/npc-animation.spec.ts`: muovere davvero il protagonista attorno ad Ada e interagire per osservare le quattro viste di attesa, anche con animazioni ridotte; verificare il cammino separatamente nella scena di prova se non è previsto dai contenuti reali.

Questa tranche dimostra la pipeline e il contratto per un NPC solo. Non completa le animazioni degli altri 47 profili, non certifica tutte le 51 presenze e non chiude la review delle 48 mappe. Ogni profilo restante richiede pose e verifica proprie; eventuali apparizioni collegate condividono l’animazione solo quando il profilo d’identità è esplicitamente condiviso.

## Misure candidate e contratto di orientamento — 27 ottobre

Le quattro immagini idle Ada v2 sono ora registrate e collegate al runtime. La revisione del composito Chrome conferma fronte, retro e due profili distinti, con identità coerente; il conteggio globale dei pixel rossi non distingue un alone da dettagli leciti come i lacci e non è un criterio autonomo di rifiuto. Misurando alpha≥128 e la mediana delle suole nel5% finale del bbox opaco, un’altezza ottica56px usa queste calibrazioni per frame quadrato1254px:

| Vista | Origine x/y | Dimensione di visualizzazione quadrata |
|---|---|---:|
| Sud | .55423 / .87440 | 75.51 |
| Ovest | .50399 / .87281 | 77.60 |
| Est | .51754 / .87998 | 73.76 |
| Nord | .54944 / .89673 | 70.44 |

Le misure sono state verificate nei quattro approcci reali nei due orientamenti. Il renderer rispetta origine e dimensione per vista senza riapplicare una scala cosmetica catturata dalla posa precedente. Mancano i fotogrammi autentici di camminata. Asset e prove in [documento72](72_ADA_DIRECTIONAL_IDLE_v0.1.md).

`src/core/world/npc-facing.ts` calcola la direzione NPC→osservatore: asse prevalente, parità verticale, stessa cella conserva la posa tramite `undefined`, coordinate non finite rifiutate. Quattro test passano; non usa RNG né modifica coordinate. Il contratto `npc-idle-views.ts` ha cinque test di validazione e l’adattatore Phaser seleziona la vista al dialogo; nessun flip o movimento artificiale.

## Elia: secondo profilo direzionale

Quattro immagini verticali2:3 di Elia collegate alle tre presenze narrative, con calibrazione per vista e scala uniforme. Il contratto `displaySize` indica l’altezza dell’immagine completa; le pose quadrate Ada mantengono il comportamento precedente. [Provenienza, prove e limiti](81_ELIA_DIRECTIONAL_IDLE_v0.1.md). Due profili idle direzionali non completano le46 identità rimanenti, le camminate o il budget texture.

## Nilo: terzo profilo direzionale

Quattro pose verticali indipendenti condivise da Borgofonte e Passo delle Due Luci. La review corregge il lato della borsa nel retro e la sua occlusione nel profilo est. Borgofonte verifica i quattro approcci; R15 conserva i due approcci reali, sud e ovest, con nord/est bloccati dal bordo esistente. La regressione del respiro statico usa ora Sera, senza applicare deformazioni alle pose calibrate. Tre profili direzionali lasciano45 identità e tutti i cicli di camminata da completare. Dettagli in [documento87](87_NILO_DIRECTIONAL_IDLE_v0.1.md).

## Prototipo walk Ada — 28 ottobre, versione 0.4.30

Otto disegni autentici registrati (due per direzione), contratto validato, selettore puro e controller Phaser integrati. Prova separata DEV con movimento reale, arresto, movimento ridotto e salvataggio invariato; due casi Chrome passati dopo la stabilizzazione degli ancoraggi. Primo decode offline delle12pose e quattro interazioni Ada passati. Nord/est idle sostituiti con correzioni anatomiche v3; le calibrazioni precedenti della tabella restano storiche. Dettagli, provenienza, scarti e limiti in [documento106](106_ADA_WALK_PIPELINE_v0.1.md). Il ciclo a due fasi resta un prototipo da rifinire. Undici identità hanno ora quattro idle;37 restano da migrare, gli altri47 profili non hanno un ciclo walk verificato. Nessun nuovo percorso automatico nella campagna.

## Avanzamento 0.4.34

I lotti successivi portano le idle direzionali a 19 identità su 48: Sera, Timo, Rami, Leda, Lea, Nila, Oren e Iris R06 si aggiungono alle undici precedenti. Restano 29 identità da migrare e 47 profili senza ciclo walk verificato. Le candidate private dei prossimi personaggi non contano come integrazioni completate. Ruoli, geometrie e progressione restano separati dalle sostituzioni grafiche.

La minificazione WebGL usa una superficie POT con frame utile nel rapporto originale e filtro trilineare, senza deformare pose o origini. Verificati cambi direzione, rilascio/ricostruzione delle texture, ripristino del contesto a DPR 3, preview walk Ada e disponibilità offline. Il padding e le mipmap aggiungono memoria: il budget GPU e la QA su telefono fisico rimangono da misurare. Prove, provenienza e limiti in [documento110](110_NILA_OREN_IRIS_DIRECTIONAL_IDLE_v0.1.md).

## Avanzamento 0.4.35

Dario e i tre profili di Ferraluce portano le idle direzionali a 23 identità su 48. Restano 25 identità e i cicli walk non ancora verificati. Nove casi nativi e sette offline finali controllano anche i cinque map renderAssets ripuliti dai due atlanti inutilizzati, conservati globalmente per precache e provenienza. Non è una misura di risparmio PWA o GPU. Dettagli in [documento111](111_DARIO_FERRALUCE_DIRECTIONAL_IDLE_v0.1.md).

## Avanzamento 0.4.37

Viola, Marina, Tessa e Iris del Delta portano le idle direzionali a 27 identità su 48; 21 restano da migrare. Le quattro viste sono indipendenti, con origini e scala calibrate e trasparenza verificata. La posa ovest di Iris conserva il proprio rapporto originale. Non sono cicli walk: 47 profili non hanno ancora una camminata verificata. Prove, provenienza, correzioni anatomiche e limiti in [documento113](113_COASTAL_DIRECTIONAL_IDLE_v0.1.md). QA su telefono fisico, budget e allineamento del bordo del molo di Marina restano aperti.
