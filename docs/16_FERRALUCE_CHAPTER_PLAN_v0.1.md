# Piano del capitolo di Ferraluce

**Versione:** 0.1 — piano di contenuto implementabile  
**Stato:** R06 e primo arrivo a Ferraluce implementati nei contenuti 0.3.73; Palestra 4, R07 e Centrale ancora assenti. Esiti delle verifiche in CI_STATUS.md.  
**Ambito:** prosecuzione dopo la Medaglia Circuito, con R06, primo distretto di Ferraluce e Palestra 4 Acciaio. R07 e la Centrale Risonante diventano accessibili soltanto dopo P4.

## 1. Scopo e stato delle decisioni

Questo piano separa i **requisiti documentati** nei documenti di progetto, le **scelte proposte** per una consegna concreta e i **contenuti ancora assenti** nel runtime. Le coordinate indicate sono ipotesi di authoring, non dati approvati. Il capitolo implementato dovrà aggiungere le mappe alla topologia dichiarativa e conservare la possibilità di espandere Ferraluce fino alla città completa prevista dal world design.

## 2. Requisiti documentati

Da `docs/02_WORLD_MAP_DESIGN_Veloria_v0.2.md`:

- **R06 — Anello Magnetico** collega Vetracielo a Ferraluce; mostra infrastrutture e anomalie della Rete di Risonanza.
- **Ferraluce** è un distretto orientale di acciaio, vetro, passerelle industriali e reattori sostenibili. Ospita la **Palestra 4 Acciaio** e la **Centrale Risonante**.
- La lezione di P4 riguarda difesa e scelta delle mosse. Il puzzle proposto riorienta nastri e campi magnetici.
- **R07 — Condotto Risonante** collega Ferraluce alla Centrale Risonante. Il dungeon D03 è previsto **dopo P4** e serve alla quest principale e alla rivelazione narrativa.
- La topologia regionale continua da Ferraluce verso Portolume tramite R08. R08 non è parte necessaria di questo capitolo.
- Il mondo è espandibile tramite mappe e contenuti dichiarativi; la progressione deve seguire flag ed eventi persistenti.
- L'identità di una città non equivale alla sola fetta minima giocabile di una sua piazza: Ferraluce rimane una città da completare oltre questa consegna.

Da `docs/14_VETRACIELO_CHAPTER_PLAN_v0.1.md` e `docs/15_VETRACIELO_GYM_v0.1.md`:

- Il capitolo precedente arriva alla Medaglia Circuito tramite `badge_circuito_awarded`. Vetracielo dispone oggi di una piazza di 40×30 caselle, della Stazione Giardino, del parco, dei servizi e della palestra; non è la metropoli completa.
- La palestra è accessibile dopo l'orientamento di Lea (`q_vetracielo_orientation`). La sequenza Giardini → Vetro → Cielo termina in `gym03_lines_connected`.
- Il ritorno a R05 passa dal bordo ovest sud della città. Il bordo est è attualmente chiuso da collisioni. La stazione occupa la fascia settentrionale centrale e il parco d'incontri è a nord-ovest.
- Medaglia Circuito e missioni di Vetracielo sono persistenti. Il nuovo varco deve usare il sistema di mappe e flag corrente senza alterare questi collegamenti.

## 3. Topologia e varco candidato su Vetracielo

`content/maps/vetracielo.map.json` dichiara le connessioni alla Palestra 3 e a R05. `public/tilemaps/vetracielo.tmj` misura 40×30 caselle da 32 px. L'uscita di ritorno a R05 è sul bordo ovest, da y=24 a y=26; il suo trigger occupa x=0, y=768–864 px. Le collisioni del bordo est sono continue, incluse le caselle 24–26. La stazione e la sua fondazione occupano x=8–31, y=1–15 circa; il parco d'incontri occupa x=3–6, y=14–17. Il bordo est sud è distante da entrambi.

**Proposta geometrica da verificare in Tiled:** aprire sul bordo est x=39, y=24–26 (pixel x=1248, y=768–864), sostituendo soltanto le tre collisioni di bordo corrispondenti con un trigger d'uscita. Posizionare uno spawn d'arrivo provvisorio sulla casella interna (38,25), previa verifica di camminabilità, collisioni e spazio d'innesto in R06. Usare un gate `badge_circuito_awarded` sull'uscita Vetracielo→R06; il ritorno R06→Vetracielo resta sempre disponibile. Il varco è a sud della stazione e del parco e non riusa l'uscita ovest verso R05.

Queste coordinate sono candidate, non una richiesta di allargare il varco o di cambiare la mappa senza prova. In fase Tiled verificare gli ostacoli scenici, l'accesso a piedi dal centro della piazza, le dimensioni del personaggio e l'eventuale trigger di ritorno; se una collisione o decorazione la rende poco leggibile, scegliere una posizione adiacente equivalente e aggiornare il documento con coordinate rilevate. Il messaggio di gate deve nominare la Medaglia Circuito. Non spostare né riutilizzare `from_r05`, `from_gym03`, l'uscita a R05 o l'accesso alla Palestra 3.

## 4. Perimetro proposto e stato dei contenuti

La consegna minima di questo capitolo comprende:

1. **R06 — Anello Magnetico:** percorso completo e percorribile in entrambe le direzioni, con identità visiva industriale leggibile, transizione da metropoli a distretto energetico e segnali iniziali dell'anomalia. Gli ostacoli e le passerelle non devono formare un labirinto gratuito.
2. **Primo distretto di Ferraluce:** mappa esterna contenuta ma riconoscibile come nuova città; landmark industriali, NPC e missioni introduttive, un Centro Pokémon o servizio di cura equivalente, rifornimenti e accesso alla Palestra 4. Deve includere il collegamento di ritorno a R06. Le funzioni dei servizi devono essere dichiarate chiaramente.
3. **Palestra 4 Acciaio:** area distinta con puzzle comprensibile di nastri/campi magnetici e capopalestra. Progressione, blocchi, sfida e medaglia devono essere persistenti e idempotenti. Nessun requisito di possedere un Pokémon o una mossa specifici senza una motivazione di progressione documentata e accessibile.
4. **Gating di R07 e della Centrale:** dopo P4, `badge_acciaio_awarded` (ID da confermare con il catalogo delle medaglie) costituirà il prerequisito della prosecuzione verso R07 quando quella mappa sarà implementata. Questa consegna può predisporre segnaletica o un punto d'accesso visibile, ma **non implementa né rende attraversabile R07, la Centrale Risonante o D03**. Il dungeon e la quest che lo accompagna sono il capitolo successivo.
5. **Limite cittadino dichiarato:** il primo distretto è una fetta di Ferraluce. Non soddisfa da solo il requisito della città completa del world design. Restano espansioni future di quartieri, passerelle, servizi e collegamenti urbani; registrarle nel backlog, non marcarle come completate.

**Ancora assenti:** le mappe/metadata R06 e Ferraluce, la mappa e la quest di P4, il puzzle magnetico, capopalestra e team, encounter table, missioni, dialoghi, nuovi flag, emblema, asset e relativi manifest. Le fonti di questo piano non approvano una squadra, un roster o una lista di mosse.

## 5. Dati di specie, mosse e asset

Non scegliere o dichiarare specie, statistiche, mosse, squadra della palestra, livelli, tassi o pesi d'incontro in questo documento. Il world design cita Magnemite e Grimer/Koffing come possibili specie dell'industria sostenibile; sono esempi di habitat e non contenuti assegnati a R06, Ferraluce o P4. Non dichiarare nuovi Pokémon o immagini come già disponibili.

Prima di selezionare roster o avversari:

- derivare candidati da habitat e progressione effettiva; controllare forma e generazione nei dati locali PokéAPI e limitare i metodi di apprendimento al gruppo HGSS previsto dal progetto;
- verificare se specie e mosse sono già nel catalogo runtime. Una risposta API o una cache sorgente da sola non rende un contenuto giocabile;
- se serve importare una specie, usare la pipeline e i manifest esistenti (`tools/import_pokeapi_battle.py`, `tools/import_pokeapi_species.py`) e mantenere intatti i valori ufficiali; se serve una mossa non supportata, documentare prima l'effetto mancante e implementare un effetto esplicito, senza sostituirla con una mossa generica;
- verificare la provenienza e l'uso consentito di ogni asset. Registrare fonte, licenza/permesso, file runtime e precache secondo la pipeline del progetto. Un'illustrazione non disponibile va indicata come assente, senza URL rotte o placeholder opachi;
- definire una prima configurazione di team, livelli e incontri; poi playtestare accessibilità e bilanciamento con tutti e quattro gli starter e calibrare la configurazione. I numeri finali sono scelte prototipali da registrare, non dati canonici PokéAPI.

## 6. Criteri di accettazione

- [ ] Senza `badge_circuito_awarded`, il varco candidato verso R06 spiega il requisito e non cambia mappa; dopo il badge, la traversata conduce a uno spawn valido e raggiungibile di R06.
- [ ] R06↔Vetracielo e R06↔Ferraluce funzionano in entrambi i sensi con spawn e connessioni reciproci; le collisioni lasciano un percorso completo e visibile. Il ritorno alla piazza conserva stazione, parco e uscita verso R05.
- [ ] Il primo distretto offre cura gratuita, accesso ai rifornimenti, missioni e orientamento verso palestra/uscite; una partita può curarsi prima e dopo gli scontri previsti senza softlock o consumo di una risorsa obbligatoria.
- [ ] La progressione della missione e del puzzle P4 resta corretta dopo salvataggio, ricaricamento e rientro nelle mappe. Le interazioni fuori ordine spiegano il passo necessario; non duplicano flag, denaro, oggetti o medaglia.
- [ ] P4 non si può sfidare prima dei prerequisiti dichiarati; la vittoria concede una sola volta la ricompensa e registra il prerequisito della futura prosecuzione a R07. La segnaletica distingue il requisito della medaglia dal contenuto non ancora disponibile. R07 e la Centrale non sono attraversabili in questo pacchetto.
- [ ] La partita naturale iniziata dal prologo può raggiungere il capitolo con ciascuno dei quattro starter; il playtest documenta arrivo, risorse, cure, missioni, P4, sconfitta/riprova, vittoria e ritorno, senza creature preparate artificialmente come unica prova.
- [ ] Tutte le interazioni principali funzionano da tastiera e touch su viewport mobile; testi, trigger e puzzle restano leggibili e raggiungibili in verticale e orizzontale. Registrare il QA su dispositivi reali come gate umano.
- [ ] Il capitolo avviato offline include mappe, dati e asset dichiarati disponibili senza richieste remote; salvare, ricaricare e tornare a Vetracielo non richiede rete.
- [ ] La scheda di stato distingue la fetta giocabile dalla **Ferraluce completa**. Quest'ultima resta nel backlog fino a quando il requisito cittadino più ampio non è soddisfatto.

## 7. Sequenza di authoring proposta

1. Prototipare in Tiled l'innesto a est di Vetracielo e l'imbocco di R06; verificare passabilità e ritorno con la geometria corrente prima di attribuire ID permanenti.
2. Definire ID stabili, metadata, spawn reciproci, gate per badge e servizi della prima area di Ferraluce. Tenere R07 fuori dalle connessioni giocabili di questa consegna.
3. Scrivere missioni e dialoghi per R06 e il distretto usando flag dichiarativi; costruire la mappa P4 e la sequenza del puzzle con feedback di stato e reset/ripresa coerenti.
4. Solo dopo aver selezionato candidati e validato fonti, importare i dati necessari e comporre encounter e team. Documentare i numeri prototipali e i risultati dei playtest naturali.
5. Registrare asset e precache offline, aggiornare manifest, diario e changelog; verificare i criteri d'accettazione e lasciare esplicitamente aperta la città completa.

## 8. Riferimenti

- `docs/02_WORLD_MAP_DESIGN_Veloria_v0.2.md` — geografia regionale, Ferraluce, P4, R06/R07, Centrale e identità industriale.
- `docs/14_VETRACIELO_CHAPTER_PLAN_v0.1.md` — perimetro dichiarato della fetta giocabile di Vetracielo e precedenti connessioni.
- `docs/15_VETRACIELO_GYM_v0.1.md` — stato reale della piazza, stazione, palestra, specie e limiti del capitolo precedente.
- `content/maps/vetracielo.map.json` e `public/tilemaps/vetracielo.tmj` — metadata, dimensioni, collisioni, uscite e coordinate verificate.
- `content/maps/README.md`, `src/game/maps/map-registry.ts`, `src/game/maps/map-types.ts` — schema mappe e connessioni.
- `content/sources/pokeapi/README.md`, `tools/import_pokeapi_battle.py`, `tools/import_pokeapi_species.py` — provenienza e import dei dati locali.
- `assets/ASSET_REGISTER.csv`, `public/sw.js` — registrazione asset e disponibilità offline.


## 9. Prima integrazione — contenuti 0.3.73

La prima parte è ora nei file runtime: `veloria/r06_anello_magnetico` (40×30) e `veloria/ferraluce` (40×30), aggiunti al registro automatico. Non completa l’intero perimetro del capitolo sopra.

| Tratto | Soglia / arrivo |
|---|---|
| Vetracielo → R06 | Est (39,24–26), richiede `badge_circuito_awarded`; R06 `from_vetracielo` (1,15) |
| R06 → Vetracielo | Ovest (0,14–16), nessun requisito; Vetracielo `from_r06` (38,25) |
| R06 → Ferraluce | Est (39,24–26), nessun requisito; Ferraluce `from_r06` (1,15) |
| Ferraluce → R06 | Ovest (0,24–26), nessun requisito; R06 `from_ferraluce` (38,25) |

Il sensore è a (18,15); Ivo (20,20), cure/deposito (9,21), bottega (30,21). La Sala delle Dinamo è uno scenario non attraversabile di 24×16 tile da (8,1), con collider pieno; il suo disegno non promette un interno esplorabile. Il cartello della palestra segnala che non è ancora visitabile.

Ordine narrativo: misurazione `r06/sensor/read` → arrivo automatico `area/veloria/ferraluce/enter` → rapporto `ferraluce/ivo/report`. L’arrivo può precedere la misura: Ivo e la guida rimandano allora al misuratore, senza ricompensa anticipata. I flag finali sono `q_r06_measurement`, `q_ferraluce_visited`, `q_ferraluce_report`. La ricompensa unica del rapporto è due Pozioni e un Antidoto.

Quattro aree con foglie usano Magnemite, Voltorb, Mareep e Wooper, già nel catalogo. Livelli 15–18 e pesi sono scelte di bilanciamento prototipali, non numeri canonici di PokéAPI; le mosse e i parametri restano quelli importati. Nessun allenatore nuovo o nuova medaglia in questa consegna. I corridoi principali e le uscite sono percorribili senza entrare negli habitat.

Due originali ImageGen (`assets/prompts/ferraluce-energy-hall-v1.md` e `industrial-floor-v1.md`) forniscono il landmark trasparente e il terreno continuo, PNG più derivati lossless. La base industriale viene mostrata una sola volta; le strisce `paved-walkway` sono oggetti Tiled cosmetici a colore continuo, indipendenti dalle collisioni. Il resto degli NPC e delle piante riusa gli asset illustrati registrati. La prima revisione ha scartato il terreno giallo ripetitivo, sostituendolo senza cambiare le geometrie giocabili.

Restano aperti P4/puzzle magnetico/leader/emblema, dungeon e città completa, QA fisico e playtest naturale fino a questa tappa con tutti gli starter. I test con salvataggi preparati attestano integrazione e persistenza, non il bilanciamento della partita completa.


### Fonti preparatorie della Palestra 4

`content/sources/pokeapi/ferraluce-source-preview.json` registra otto risposte grezze con SHA-256 verificati: Pokémon e specie di Magneton, Steelix e Skarmory, più le mosse candidate Ferrartigli e Sassata. È un’anteprima separata dal runtime: non approva una squadra, non aggiunge incontri e non abilita mosse. I learnset HGSS vanno controllati ai livelli effettivamente scelti; una mossa Acciaio non è automaticamente apprendibile da qualunque Pokémon Acciaio. In particolare Ferrartigli non compare nei learnset fino al 25 dei tre candidati: non va assegnata per analogia di tipo. Prima di P4 resta da verificare la disponibilità di risposte strategiche per tutti gli starter, anche con nuove specie catturabili se necessarie.

Il record API di Ferrartigli descrive un attacco al Pokémon scelto ma anche un possibile aumento dell’Attacco dell’utilizzatore: il destinatario dell’effetto secondario va distinto dal destinatario del danno nell’adattatore. La sola proprietà `target` della mossa non basta per assegnare quel bonus; nessun effetto viene attivato in questo aggiornamento.


### Trasporto regionale dopo P3

La monorotaia è implementata nel prototipo tra Brumalta, Petalora, Vetracielo e Ferraluce già visitate, dopo la Medaglia Circuito. Terminali e arrivi sono dichiarativi; il viaggio è gratuito e mantiene risorse e progressione. Contratto, verifiche e limiti in `17_MONORAIL_v0.1.md`. Le future fermate e gli altri trasporti regionali restano da implementare; le console della palestra mantengono la loro funzione di puzzle.
