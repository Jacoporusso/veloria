# Piano per direzioni e animazioni NPC

## Stato verificato

L’inventario `docs/art/full-redesign-inventory.json` censisce 48 profili/identità e 51 presenze NPC. Il catalogo `content/characters/appearances.v2.json` ha 48 profili e 14 asset immagine. I profili collegano identità, apparizioni, asset, frame statico ed origine; il descrittore di atlante specifica solo righe e colonne.

In `src/game/rendering/MapRenderer.ts`, `atlasFrame` ritaglia una cella e `renderNpc` crea un’immagine Phaser con quel frame, una dimensione di visualizzazione di 60×60 e l’origine dichiarata. Il rendering non sceglie pose secondo la direzione del giocatore e non avanza frame di movimento. Un singolo profilo può essere condiviso da più presenze canoniche, ma ognuna mostra la stessa immagine statica.

`src/game/rendering/npc-idle-motion.ts` applica un tween sinusoidale che varia `scaleY` del personaggio dell’1,2% e mantiene posizione e origine. La preferenza per animazioni ridotte omette il tween; `tests/e2e/npc-idle-motion.spec.ts` verifica variazione della scala, ancoraggio invariato e arresto. È un effetto cosmetico di attesa, non una posa aggiuntiva né un ciclo di camminata.

`tests/world/npc-identities.test.ts` controlla riferimenti, associazioni, unicità asset/frame e origini. `tests/e2e/npc-identities.spec.ts` attraversa le 51 presenze in portrait e landscape e verifica asset, frame, origine, identità e visibilità; non verifica cambi di direzione o animazioni. Di conseguenza la copertura corrente attesta identità e rendering della posa statica, non la completezza direzionale richiesta da `docs/58_FULL_WORLD_AND_CAST_REDESIGN_v0.1.md` e lasciata aperta da `docs/61_GRAPHICS_AND_GEN1_MIGRATION_v0.1.md`.

## Prima tranche proposta: Ada

Usare il profilo reale `ranger-ada` in `appearances.v2.json`: NPC `forest_ranger_ada`, dialogo `ada_quest`, sprite attuale `veloria-npcs-v3`, frame 1 e origine `{x: 0.5332, y: 0.998}`. La fonte narrativa registrata è `content/dialogue/world.v1.json#/ada_quest`; la descrizione del profilo la identifica come guardaboschi e ricercatrice sul campo, con giacca prugna e misuratore. Questi ultimi dettagli descrivono il profilo artistico già catalogato; non aggiungere età o genere non documentati. Ada è una buona prova perché ha una singola apparizione/ID NPC e un ruolo di campo che rende leggibili fronte, retro e profili laterali.

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

Le quattro immagini idle Ada v2 sono ancora studi privati, non asset runtime. La revisione del composito Chrome conferma fronte, retro e due profili distinti, con identità coerente; il conteggio globale dei pixel rossi non distingue un alone da dettagli leciti come i lacci e non è un criterio autonomo di rifiuto. Misurando alpha≥128 e la mediana delle suole nel5% finale del bbox opaco, un’altezza ottica56px richiede queste calibrazioni per frame quadrato1254px:

| Vista | Origine x/y | Dimensione di visualizzazione quadrata |
|---|---|---:|
| Sud | .55423 / .87440 | 75.51 |
| Ovest | .50399 / .87281 | 77.60 |
| Est | .51754 / .87998 | 73.76 |
| Nord | .54944 / .89673 | 70.44 |

Sono misure candidate: nessun binding accettato prima della prova di contatto al suolo nell’interazione reale. Il renderer dovrà rispettare origine e dimensione per vista, senza riapplicare una scala cosmetica catturata dalla posa precedente. Mancano i fotogrammi autentici di camminata.

`src/core/world/npc-facing.ts` introduce il calcolo puro della direzione NPC→osservatore: asse prevalente, parità verticale, stessa cella conserva la posa corrente tramite `undefined`, coordinate non finite rifiutate. Quattro test passano; non usa RNG né modifica coordinate. Questo contratto da solo non cambia la grafica: adattatore Phaser e collegamento delle quattro viste restano da implementare e verificare.
