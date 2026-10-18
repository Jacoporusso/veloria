# VELORIA — Game Design Document

**Titolo di lavoro:** Pokémon: New Journey — Veloria  
**Versione:** 0.1 (concept e vertical slice)  
**Data:** 09/10/2026  
**Stato:** Baseline di progetto, da validare con prototipo  
**Piattaforma:** PWA mobile-first, iPhone e Android; giocabile anche da browser desktop  
**Tecnologie previste:** TypeScript, Phaser, Vite, Tiled, IndexedDB  
**Distribuzione:** esclusivamente personale, senza pubblicazione né monetizzazione

**Aggiornamento direzione visiva — 17/10/2026:** la direzione approvata è 2D illustrato moderno con profondità pittorica morbida, definita in `docs/05_ART_DIRECTION_v0.3.md`. Questo aggiornamento prevale sui riferimenti HD pixel art presenti nella baseline iniziale del GDD.

> **Nota su proprietà intellettuale.** Il progetto utilizza, come obiettivo privato, Pokémon delle generazioni 1 e 2. Nomi, creature, artwork, musiche e marchi Pokémon appartengono ai rispettivi titolari. L'uso personale non attribuisce una licenza di riproduzione; PokéAPI non concede diritti sui contenuti. Non incorporare ROM, asset estratti dai giochi o risorse di terzi prive di permesso. Produrre mappe, storia, interfacce e audio originali/licenziati. Per una futura pubblicazione serviranno un'analisi dei diritti e verosimilmente creature e marchio originali.

---

## 1. Visione

Creare un RPG di cattura e allenamento di creature con il **ritmo esplorativo di Pokémon Oro/Argento**, ma con una **regione inedita** e una presentazione **2D illustrata moderna**, ispirata per densità ambientale, palette, illuminazione e fluidità a *Sea of Stars*, senza replicarne gli asset.

### 1.1 Promessa al giocatore

«Scelgo il mio compagno preferito, esploro una regione mai vista, catturo i Pokémon delle prime due generazioni, alleno una squadra e conquisto otto medaglie, anche offline sul telefono.»

### 1.2 Pilastri di design

1. **Nostalgia del gameplay, non della risoluzione.** Esplorazione a griglia, incontri, dialoghi e combattimenti a turni; interfaccia, animazioni e leggibilità moderne.
2. **Scoperta.** Habitat riconoscibili, oggetti nascosti, eventi ambientali e Pokémon diversi per area/orario.
3. **Squadra personale.** Tutti i primi 251 Pokémon nel piano completo, con sei membri in squadra e un percorso per ottenerli senza scambi online.
4. **Mobile prima di tutto.** Sessioni da 5–15 minuti, comandi touch precisi, pausa immediata, salvataggi solidi.
5. **Offline by design.** Nessuna chiamata API necessaria mentre si gioca e nessun account.

### 1.3 Target e piattaforme

- Giocatore singolo, interessato a un'avventura classica.
- Orientamento **verticale** prioritario, portrait first; controlli desktop con frecce/WASD, Invio/Z/X per debug e test.
- Non sono previsti multiplayer, PvP, monetizzazione o cloud save.

---

## 2. Perimetro prodotto

| Funzione | Visione completa | MVP / vertical slice |
|---|---|---|
| Regione | Veloria, originale | Borgofonte, Sentiero dell'Alba, Bosco dei Veli, Brumalta |
| Pokémon | Specie #001–#251, tutte ottenibili | 20 specie implementate (4 starter + 16 nell'ecosistema iniziale) |
| Starter | Pikachu, Charmander, Squirtle, Bulbasaur | Tutti e quattro selezionabili al livello 5 |
| Palestre | 8 + Lega | 1 Palestra, tipo Normale |
| Combattimento | Turni, mosse, PP, stati, cattura, evoluzioni | Flusso completo, per un insieme ristretto di mosse e stati |
| Esplorazione | Città, biomi, dungeon, segreti | 4 mappe interconnesse, collisioni, NPC, raccolta oggetti |
| Pokédex | 251 voci viste/catturate | 20 voci predisposte, dati completi delle 251 specie nel catalogo tecnico |
| Progressione | Storia, missioni, 8 medaglie | Tutorial, breve missione bosco, prima medaglia |
| Tempo | Giorno/notte e incontri dedicati | Giorno/notte con almeno una differenza verificabile negli incontri |
| Salvataggio | Locale e backup | Auto/manuale, export/import JSON |
| Seguace Pokémon | Primo membro visibile sulla mappa | Post-MVP: non blocca la prima uscita |

**Durata obiettivo dell'MVP:** 30–45 minuti per completare la prima medaglia.  
**Definizione di successo:** il giocatore inizia, sceglie uno starter, percorre le mappe, combatte, cattura, cura, salva, ricarica e vince la prima medaglia su iPhone in modalità aereo dopo l'installazione.

---

## 3. Ambientazione e narrazione

### 3.1 Regione di Veloria

Veloria è una regione di vallate, foreste e città costruite attorno a sorgenti di energia naturale chiamate **Vene Luminose**. Nei suoi biomi convivono specie di Kanto e Johto, senza separarle artificialmente in due Pokédex. Il mistero principale riguarda alterazioni del comportamento di alcuni Pokémon nei luoghi dove le Vene vengono sfruttate intensivamente.

**Temi:** scoperta, equilibrio tra ecosistema e tecnologia, legami con i compagni di viaggio.  
**Tono:** luminoso, avventuroso, rassicurante; mistero crescente, non horror.

### 3.2 Premessa

Il protagonista vive a **Borgofonte**. Durante una piccola anomalia luminosa, il ricercatore locale invita il giocatore a scegliere un compagno di viaggio per consegnare a Brumalta alcune rilevazioni. Il percorso attraversa prima il Sentiero dell'Alba e poi il Bosco dei Veli, dove alcuni Pokémon appaiono più irrequieti del normale. Il primo capopalestra verifica anche le capacità del giovane allenatore e concede la **Medaglia Aurora**.

### 3.3 Cast MVP

| Personaggio | Funzione | Caratterizzazione |
|---|---|---|
| Protagonista | Avatar | Nome modificabile; aspetto base scelto da pochi preset |
| Prof.ssa Elia | Starter e tutorial | Ricercatrice dell'equilibrio ambientale |
| Nilo | Rivale/amico | Competitivo ma rispettoso; primo incontro guidato |
| Ada | Guardaboschi | Affida la breve missione del Bosco dei Veli |
| Mira | Capopalestra di Brumalta | Specialista del tipo Normale; premia preparazione e adattamento |

I nomi e i dialoghi sono **provvisori** e originali; saranno revisionati dopo la prima prova giocabile.

### 3.4 Macroprogressione futura (non MVP)

Otto Palestre, otto biomi principali, una Lega Pokémon, epilogo che risolve il mistero delle Vene Luminose. I dettagli di città successive, squadra antagonista e Pokémon leggendari sono lasciati volutamente aperti: non definire asset costosi finché il loop principale non funziona.

---

## 4. World design e vertical slice

### 4.1 Itinerario iniziale

```text
BORGOFONTE (start, laboratorio, casa)
      |
SENTIERO DELL'ALBA (erba, oggetti, 2 allenatori)
      |
BOSCO DEI VELI (bivi brevi, missione ambientale)
      |
BRUMALTA (Centro Pokémon, negozio, Palestra Normale)
```

- **Borgofonte:** area senza incontri casuali; introduzione, scelta starter, introduzione ai controlli, uscita bloccata prima della scelta.
- **Sentiero dell'Alba:** erba alta, incontri lv 2–5, 2 allenatori; insegna cattura e cambio Pokémon.
- **Bosco dei Veli:** incontri lv 4–8, un piccolo oggetto-chiave da raccogliere, un NPC da aiutare, un accesso inizialmente limitato e poi sbloccato.
- **Brumalta:** Centro Pokémon con cura completa, negozio di consumabili, dialoghi, Palestra con mini puzzle di interruttori a terra e capopalestra.

### 4.2 Principi di layout

- Tilemap ortogonali; 32×32 px come **base artistica proposta** (da validare nel prototipo).
- Avatar 32×48 px circa, ombre semplici, profondità tramite ordinamento Y, livelli foreground/background.
- Percorsi leggibili e corti; evitare labirinti lunghi o passaggi invisibili su schermi piccoli.
- Ogni transizione registra **mapId** e **spawnPointId**, non coordinate hardcoded tra scene.
- Zone con tag semantici: `grass`, `blocked`, `door`, `interact`, `water`, `event`, `spawn`.

### 4.3 Incontri per fascia oraria

Tre fasce (ora locale del dispositivo): mattino 05:00–10:59, giorno 11:00–19:59, notte 20:00–04:59. Almeno Hoothoot e Spinarak devono essere più comuni di notte. L'orario è una variabile di contenuto; se il giocatore cambia fuso/orologio, il gioco non deve corrompersi.

---

## 5. Pokémon, starter e sistema di squadra

### 5.1 Pokédex

- Roster di riferimento: numeri nazionali **#001–#251**, le prime due generazioni.
- Inclusi tipi **Buio** e **Acciaio**; **Folletto** non previsto perché si cerca un'identità vicina alla seconda generazione.
- La disponibilità dei 251 in gioco è un obiettivo del rilascio completo, non dell'MVP.
- Il catalogo dati delle 251 specie si può importare prima; **sprite, mosse effettive, incontri ed evoluzioni devono essere esplicitamente validati**.
- Esempio di modernizzazione deliberata: la distinzione fisico/speciale è associata alla **singola mossa**; non si replica necessariamente il comportamento identico a Oro/Argento. Tale regola resta versionata.

### 5.2 Starter

| Starter | Tipo | Livello iniziale | Nota di bilanciamento |
|---|---|---:|---|
| Pikachu | Elettro | 5 | Accesso a mosse neutrali all'inizio; evoluzione tramite Pietratuono in futuro |
| Charmander | Fuoco | 5 | Buono contro molti insetti nel bosco |
| Squirtle | Acqua | 5 | Maggiore resistenza difensiva |
| Bulbasaur | Erba/Veleno | 5 | Utilità contro incontri iniziali, potenziale controllo degli stati |

Gli starter non sono equivalenti per statistiche o copertura: il bilanciamento avviene tramite nemici, disponibilità di nuovi Pokémon e mosse accessibili. La Palestra di tipo Normale evita un muro di tipo per uno starter specifico.

### 5.3 Le 20 specie dell'MVP

**Starter (4):** Pikachu, Charmander, Squirtle, Bulbasaur.  
**Fauna delle aree iniziali e relative evoluzioni (16):** Rattata, Pidgey, Sentret, Hoothoot, Caterpie, Metapod, Butterfree, Weedle, Kakuna, Beedrill, Bellsprout, Oddish, Spinarak, Mareep, Wooper, Poliwag.

Le 16 specie non devono apparire tutte in un solo percorso: la tabella incontri deve distribuire la varietà fra erba, bosco, acqua (quando accessibile) e orario. Le forme evolute possono essere ottenibili per evoluzione e non necessariamente come incontro selvatico. **I tre starter non scelti non devono essere catturabili durante l'MVP**; nel gioco completo saranno acquisibili tramite quest/ricompense senza scambi online.

### 5.4 Squadra e progressione

- Massimo 6 Pokémon attivi; eccedenze nel deposito (PC virtuale del Centro Pokémon).
- Ogni Pokémon possiede specie, livello, esperienza, HP attuali, statistiche derivate, mosse (massimo 4), PP, stato, identificativo univoco.
- Crescita tramite XP; riepilogo a fine incontro; cambio mosse gestito con UI chiara.
- Evoluzione al raggiungimento delle condizioni, senza interrompere o perdere il salvataggio.
- Le evoluzioni tramite scambio, nel prodotto finale, avranno una **Pietra Legame** o missioni equivalenti, per mantenere l'obiettivo di completare il Pokédex offline.

---

## 6. Core gameplay loop

1. **Esplorare** una mappa, parlare con NPC, raccogliere oggetti.
2. **Incontrare** Pokémon selvatici/allenatori tramite trigger e zone.
3. **Combattere** scegliendo una fra quattro mosse o un'altra azione disponibile.
4. **Catturare** Pokémon e comporre la squadra oppure ottenere XP/denaro.
5. **Curare, organizzare, migliorare** la squadra in città.
6. **Sbloccare** nuova area, evento narrativo o medaglia e ripartire.

L'utente deve poter interrompere dopo un incontro senza perdere progressi rilevanti.

### 6.1 Esplorazione

- Movimento a quattro direzioni, prevalentemente a griglia con interpolazione fluida.
- Interazione con oggetti/NPC nella casella frontale mediante tasto contestuale A.
- Collisioni con blocco netto e feedback sonoro opzionale.
- Incontri in erba con probabilità parametrica per passi percorsi, non per frame.
- L'utente può disabilitare effetti particellari avanzati e regolare velocità del testo.

### 6.2 Combattimento

**Regole MVP:**

- Turn-based 1 vs 1 (un Pokémon attivo per parte).
- Comandi: **Lotta**, **Borsa**, **Pokémon**, **Fuga** (Fuga disabilitata contro allenatori).
- Selezione fra massimo quattro mosse; consumo PP, accuratezza, efficacia dei tipi, bonus STAB, colpi critici, priorità e velocità.
- Danno derivato da livello, potenza, attacco/difesa appropriati e moltiplicatori; algoritmo deterministico con RNG iniettabile nei test.
- Stati dell'MVP: avvelenamento, paralisi, sonno; bruciatura/congelamento nel backlog successivo se non necessari agli incontri iniziali.
- K.O. → cambio automatico se esiste un membro vivo; game over 'blackout' con ritorno al Centro/casa, senza cancellare progressi.
- Vittoria → XP, eventuali livelli, valuta e flag di progressione.
- Cattura solo su Pokémon selvatici, influenzata da HP rimanenti, tasso di cattura della specie e tipo di ball.

**Scelta dichiarata:** battle system semplificato e ispirato alla seconda generazione, non replica binaria della ROM. Le formule saranno raccolte in un file di regole testato; eventuali differenze dai titoli canonici saranno deliberate.

### 6.3 Inventario ed economia

- Categorie: Poké Ball, cure, strumenti chiave.
- MVP: Poké Ball, Pozione, Antidoto, strumento-chiave della quest.
- Denaro ottenuto negli incontri con allenatori, nessuna microtransazione.
- Oggetti univoci non acquistabili dalla prima bottega finché non sbloccati.

### 6.4 Missioni ed eventi

- Eventi guidati da flag (`starter_selected`, `forest_signal_found`, `gym1_defeated`).
- Dialoghi data-driven con nodi, scelte e precondizioni.
- NPC, bivi e trigger non devono introdurre codice applicativo dentro i JSON di mappa.
- La storia avanza solo se le precondizioni di dominio sono soddisfatte.

---

## 7. Direzione artistica e audio

### 7.1 Visual identity

**Illustrazione 2D moderna** con asset originali/licenziati:

- Proporzioni leggibili, silhouette nette, palette calde per Borgofonte e fredde per Bosco dei Veli.
- Tiles di base 32×32, dettagli extra sovrapposti; parallax leggero, luci morbide, acqua e fogliame animati.
- Ambienti con microanimazioni (onde, lucciole, fili d'erba), senza sacrificare il frame rate.
- Sprite battle placeholder consentiti durante lo sviluppo; scegliere una pipeline coerente prima di produrre 251 creature finali.
- La qualità di *Sea of Stars* è un **riferimento stilistico**, non una fonte di asset da copiare.

### 7.2 Interfaccia mobile

- Layout portrait di riferimento **384×640 unità logiche** adattato tramite `FIT`, `safe-area` e test di diversi aspect ratio.
- Area mondo nella parte superiore, controlli touch sovrapposti/area inferiore secondo contesto; non coprire NPC/dialoghi.
- D-pad opzionale lato sinistro; **A**, **B**, Menu lato destro. Pulsanti grandi, zone sensibili non troppo piccole.
- Durante battaglie sostituire il D-pad con pulsanti grandi delle azioni.
- Testo localizzato inizialmente in **italiano**; nessun testo incorporato negli sprite.
- Impostazioni: volume, velocità dialoghi, qualità effetti, grandezza controlli.

### 7.3 Audio

- Musiche originali royalty-free o commissionate; loop seamless per campo, città, battaglia, Palestra.
- SFX brevi per passi/menù/cattura, controllabili separatamente dalla musica.
- Riproduzione audio iniziata dopo interazione dell'utente, compatibilmente con policy mobile.
- **No estrazione delle tracce originali** dai giochi commerciali.

---

## 8. UX, salvataggi e offline

- Nuova partita / Continua / Opzioni / Esporta / Importa salvataggio.
- Autosave dopo scelta starter, cambio area, battaglia, evento importante; salvataggio manuale nel menu nei luoghi sicuri.
- IndexedDB con versione schema, backup automatico a due slot/record e controllo dei dati importati.
- Esportazione JSON scaricabile e reimportazione per proteggersi dall'eventuale eliminazione dei dati del browser.
- Tutti gli asset indispensabili all'MVP precaricati o messi in cache prima di indicare **Offline pronto**.
- Nessuna dipendenza da PokéAPI durante il runtime: dati statici derivati da un'importazione effettuata in sviluppo.
- Ripristino corretto dopo chiusura/riapertura dell'app, perdita di connessione e update del Service Worker.

---

## 9. Accessibilità e qualità

- Testo ad alto contrasto, interfaccia scalabile, niente informazione veicolata solo dal colore.
- Animazioni non indispensabili riducibili, niente input basato su riflessi rapidi.
- Obiettivo prestazionale: **60 fps** su iPhone moderno, degrado accettabile a **30 fps** durante gli effetti più intensi.
- Niente scroll involontario della pagina durante il movimento; evitare perdita focus con swipe.
- Telemetria non prevista nel MVP; eventuali errori di sviluppo visibili solo in debug.

---

## 10. Cosa NON realizziamo nell'MVP

Multiplayer; account; scambi; breeding; Pokémon oltre #251; mosse/abilità di generazioni successive; Safari push; GPS; multiplayer; cloud save; microtransazioni; mondo completamente aperto; Lega; 8 Palestre; Pokédex completabile; follower sprite animati; cutscene complesse; tornei; editor di personaggi avanzato.

Questi elementi non devono diventare dipendenze tecniche per completare il vertical slice.

---

## 11. Rischi di prodotto

| Rischio | Impatto | Mitigazione |
|---|---|---|
| Art pipeline per 251 Pokémon | Molto alto | 20 specie nell'MVP, stile guida, placeholder sostituibili, atlas e manifest |
| IP di Nintendo/Pokémon | Alto | Uso personale, non pubblicare, verificare licenze di tutti gli asset; contenuti originali per mondo/audio/UI |
| Fedeltà e dati non uniformi di PokéAPI | Medio-alto | Importer, normalizzazione per gen I/II, file di regole curato, test |
| Persistenza browser/iPhone | Alto | Export/import, schema versionato, test su Safari installato, backup |
| Crescita incontrollata dello scope | Alto | Gate MVP e backlog post-MVP distinto |
| Fluidità mobile e UI touch | Medio | Prototipo immediato su device reale; budget di texture e memoria |

---

## 12. Decisioni approvate / da validare

### Confermate

- PWA con Phaser + TypeScript.
- Mondo nuovo (Veloria), stile 2D illustrato moderno, esplorazione ortogonale.
- Prima e seconda generazione, 251 specie nella visione completa.
- Starter: Pikachu, Charmander, Squirtle, Bulbasaur.
- Single-player e uso personale.

### Assunzioni di design (modificabili dopo playtest)

- Orientamento portrait prioritario, UI italiana.
- 8 Palestre nella campagna completa.
- Distinzione fisico/speciale per mossa, 17 tipi e niente abilità/nature.
- Primo capopalestra di tipo Normale; 30–45 minuti per il vertical slice.
- Nomi Veloria/Borgofonte/Brumalta/Nilo/Ada/Mira.
- 20 specie MVP e follower Pokémon rinviato.

---

## 13. Criteri di validazione design

1. Tutti e quattro gli starter possono completare il vertical slice senza grind obbligatorio sproporzionato.
2. I giocatori comprendono come catturare, curare, cambiare Pokémon e salvare senza documentazione esterna.
3. Non ci sono softlock: attraversamento mappe, esaurimento risorse, Pokémon KO e ripresa del save portano a stati recuperabili.
4. Le quattro mappe risultano chiaramente diverse e leggibili su uno schermo verticale.
5. Il gioco completo rimane possibile offline dopo la preparazione iniziale dei file necessari.
6. Il data model non limita il futuro ampliamento a 251 specie, più Palestre e habitat.

---

## 14. Glossario e documenti collegati

- **Vertical slice:** percorso breve ma rifinito che attraversa tutti i sistemi essenziali del prodotto.
- **MVP:** rilascio minimo giocabile, finito e verificabile; non una sola schermata di combattimento.
- **Pokédex catalogo:** dataset delle specie, anche non ancora ottenibili.
- **Encounter table:** specie/livello/probabilità/orario associati a una zona.
- **Rule set:** definizione versionata delle regole di battaglia e progressione.

Per architettura, epiche, backlog, contratti e criteri di completamento si veda **MVP_Technical_Plan_v0.1.md**.

## Riferimenti tecnici

- PokéAPI v2: https://pokeapi.co/docs/v2
- Phaser API e Tilemap: https://docs.phaser.io/api-documentation/3.90.0/namespace/tilemaps
- Vite PWA: https://github.com/vite-pwa/vite-plugin-pwa
- WebKit, storage e installazione app: https://webkit.org/blog/14403/updates-to-storage-policy/

### Decisione esplicita dell’utente — 17/10/2026

Per il prototipo privato l’utente ha richiesto gli artwork dei quattro starter distribuiti tramite PokéAPI. Questa eccezione sostituisce per quei quattro file il precedente vincolo sui soli artwork originali/autorizzati: fonti e checksum in assets/pokeapi-starter-artwork-v1.json e registro asset. I diritti delle immagini restano a The Pokémon Company; la decisione di prototipo non dichiara diritti per una diffusione pubblica.

Nella richiesta successiva sugli incontri invisibili, incluso Pidgey, lo stesso metodo locale è stato esteso alle altre otto specie mancanti. Registro separato assets/pokeapi-route-artwork-v1.json, con fonti e checksum; stesso perimetro privato e stessi diritti.
