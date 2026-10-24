# Veloria — brief di redesign del cast

Documento di lavoro per il rifacimento del mondo e dei personaggi. È una guida visiva fondata sulle fonti esistenti, non una revisione narrativa o una modifica ai dati di gioco. Il disegno di riferimento è 2D illustrato moderno, forme morbide e dipinte, profondità leggera, luce calda, silhouette leggibili e palette controllate (`docs/05_ART_DIRECTION_v0.3.md`). Nessun costume deve spostare NPC, interazioni, collisioni, puzzle, passaggi o progressione.

## Regole d’identità e rappresentazione

- Per questo brief il conteggio normalizzato è 48 MapDefinition, 51 presenze NPC con `npcId` e 48 identità contenuto distinte; sono esclusi due hotspot di servizio senza `npcId`. Il file inventario grezzo include anche quei due hotspot nel totale presenze/chiavi. Restano tre profili d’apparenza registrati e tre studi non associati. Una scena presente non equivale a una scena approvata.
- Un’identità condivisa si assegna solo se lo stesso `npcId` ricorre o se `characterAppearanceId`/profilo collega le apparizioni. Il solo nome visualizzato non prova che due NPC siano la stessa persona.
- Elia è canonicamente una donna: il GDD la definisce professoressa e ricercatrice; il documento 57 precisa che il precedente concept maschile era errato. Ada è ricercatrice sul campo (femminile nel profilo d’apparenza); Nilo è descritto nel GDD come amico. Questi tre profili hanno già identità visive stabili in `content/characters/appearances.v1.json` e vanno conservati.
- Per gli altri personaggi, le fonti consultate non dichiarano in modo affidabile il genere. Registrare «non specificato nel canone» e lasciare la scelta visiva aperta; non dedurlo dal nome, dall’occupazione o dai Pokémon. Evitare codici di genere stereotipati.
- L’abbigliamento comunica ruolo, clima, luogo e personalità; non aggiunge gradi, relazioni familiari, biografie o motivazioni non scritte. Proporre contrasti di forma e valore oltre al colore, adatti a sprite piccoli e ritratti.

## Otto capipalestra

Ogni palette è una proposta d’art direction per la persona, distinta dalla palette ambientale della palestra. Conservare tipo, medaglia, prova, battaglia e funzione narrativa.

| Leader / luogo | Canone verificato | Genere in fonte | Brief di silhouette, palette e accessorio distintivo |
|---|---|---|---|
| **Mira**, Brumalta · Normale · Medaglia Aurora | Prima leader; sigilli a terra, ritmo di squadra e adattamento. | Non specificato esplicitamente. | Figura composta e accessibile, giacca corta color crema con pannelli verde parco, pantaloni pratici; un piccolo sigillo-luce al bavero. Linee tonde e postura aperta, senza uniforme da arbitro. |
| **Dalia**, Petalora · Erba · Medaglia Corolla | Irrigazione/fonte; insegna effetti di mosse, status e contromisure. | Non specificato esplicitamente. | Sagoma a petalo ma adulta e funzionale: soprabito verde salvia con fodera rosa tenue, maniche raccolte, cintura porta-semi e piccolo attrezzo d’irrigazione. Petali solo come dettaglio, non costume floreale. |
| **Aster**, Vetracielo · Elettro · Medaglia Circuito | Prova di orientamento/rete; attiva la monorotaia. | Non specificato esplicitamente. | Linee verticali e asimmetriche, giacca tecnica blu profondo con inserti giallo circuito e pantaloni chiari; bracciale/clip da terminale con icona di rete. Evitare fulmini generici e armatura. |
| **Rhea**, Ferraluce · Acciaio · Medaglia Acciaio | Officina magnetica; la vittoria apre il Condotto e l’indagine alla Centrale. | Non specificato esplicitamente. | Sagoma robusta ma mobile: grembiule da officina corto sopra abiti blu ardesia, tocchi rame e acciaio opaco; guanto magnetico o chiave a fascia come unico segno. Niente sovraccarico industriale. |
| **Nerea**, Portolume · Acqua · Medaglia Marea | Prova delle chiuse; collega osservazioni del porto e della Centrale. | Non specificato esplicitamente. | Profilo fluido a mantella corta/cappotto da porto, turchese profondo, sabbia e corallo spento; fischietto da molo o piccolo registro impermeabile. Aspetto da allenatrice e osservatrice, non sirena/marinaia caricaturale. |
| **Selene**, Acquariva · Psico · Medaglia Riflesso | Allinea specchi e ricevitore; premia osservazione, adattamento e cambi tattici. | Non specificato esplicitamente. | Silhouette calma, forme lunghe e pulite, lilla fumé e verde acqua con accenti argento; pendente prismatico o lente piatta che richiami il puzzle. Evitare simboli mistici eccessivi: il suo tema è osservare. |
| **Nives**, Biancavetta · Ghiaccio · Medaglia Brina | Tre sigilli su piste scivolose; la medaglia riattiva la funivia. | Non specificato esplicitamente. | Abiti a strati per il freddo, silhouette compatta e diagonale, blu notte, bianco neve e una fodera ambra; guanti da presa o fibbia della funivia. Niente decorazioni che suggeriscano abilità di ghiaccio soprannaturali. |
| **Aurel**, Concordia · Drago · Medaglia Armonia | Ottava medaglia; prepara con Elia il riallineamento del Santuario. | Non specificato esplicitamente. | Presenza autorevole senza corona: soprabito geometrico avorio e petrolio, accenti oro antico, bordi curvi che richiamino convergenza/equilibrio; fermaglio a due archi. Evitare scaglie, corna o iconografia da drago indossabile. |

**Chiavi di associazione:** gli `npcId` sono quelli degli oggetti NPC Tiled; i filename sono in `public/tilemaps/`.

| Leader | `npcId` | `filenameTmj` |
|---|---|---|
| Mira | `mira` | `gym01_brumalta.tmj` |
| Dalia | `dalia_gym` | `gym02_petalora.tmj` |
| Aster | `aster_gym` | `gym03_vetracielo.tmj` |
| Rhea | `rhea_gym` | `gym04_ferraluce.tmj` |
| Nerea | `nerea_gym` | `gym05_portolume.tmj` |
| Selene | `selene_gym` | `gym06_acquariva.tmj` |
| Nives | `nives_gym` | `gym07_biancavetta.tmj` |
| Aurel | `aurel_gym` | `gym08_concordia.tmj` |

### Nerea della Palestra e Nerea del Consiglio

`gym05_nerea` e `league_council1` condividono nome e tema Acqua, ma sono record separati: NPC/dialogue ID diversi, squadre e ruoli distinti; non esiste un alias comune nei profili d’apparenza né una dichiarazione narrativa di identità. Quindi l’identità è **non determinabile dalle fonti**, non canonizzata come la stessa persona. Disegnarle come due personaggi distinguibili: Nerea di Portolume con abito da porto e registro delle maree; la Consigliera Nerea con silhouette più formale e distinta, blu notte/perla e accessorio da sala. Non inserire un’età o una parentela implicita.

## Consiglio e Campione

| Personaggio | Ruolo / squadra e tema documentati | Genere | Direzione visiva proposta |
|---|---|---|---|
| **Nerea (Consiglio 1)** | Prima sala; Acqua/Terra/Ghiaccio, correnti e gestione risorse. Identità distinta da leader Nerea per prudenza. | Non specificato. | Formalità da membro del Consiglio, lunga linea verticale blu notte/perla e motivo di corrente inciso; silhouette diversa dalla giacca pratica del porto. |
| **Silvo** | Consiglio 2; insetti, sonno/semi e gestione oggetti. | Non specificato. | Forme stratificate e leggere, verde bosco e ocra, mantellina corta o borsa da campo con astuccio per appunti; niente ali/costume da insetto. |
| **Brando** | Consiglio 3; Elettro/Acciaio e lettura di difese e rete. | Non specificato. | Taglio squadrato e basso, petrolio, grigio chiaro e ambra; una placca tecnica liscia o chiusura magnetica, senza duplicare Aster o Rhea. |
| **Luce** | Consiglio 4; Psico/Acqua, velocità e difese speciali. | Non specificato. | Silhouette slanciata ma distinta da Selene; avorio, prugna e argento, linee di luce controllate e una spilla ottica. Non basarsi sul nome per presentazione di genere o poteri. |
| **Enea** | Campione; squadra rappresentativa del viaggio (tre starter evoluti, Ampharos, Steelix, Dragonite); celebra l’intera squadra. | Non specificato. | Sagoma equilibrata e riconoscibile da lontano, mantello corto color petrolio e avorio con sei cuciture/segni discreti per il tema della squadra; medaglione semplice. Niente posa da antagonista o corona. |

## Personaggi nominati e ricorrenti

Identità e ruoli di seguito derivano da GDD, trainer JSON, dialoghi e presenze dell’inventario. Per le comparse con solo un nome/ruolo, l’aspetto è deliberatamente una proposta, non un fatto di trama.

| Identità | Evidenza di ruolo | Nota per il design |
|---|---|---|
| **Prof.ssa Elia** | Ricercatrice dell’equilibrio ambientale; botanica anziana, occhiali e capelli argento; appare in laboratorio, Concordia e Santuario con profilo unificato. | Conservare profilo v3: occhiali, argento, abiti da ricerca botanica con strumenti sobri; variazioni minime da lavoro sul campo senza cambiare persona. Donna canonica. |
| **Ada** | Guardaboschi/ricercatrice sul campo; guida la missione del Bosco. | Conservare profilo v3: giacca prugna e misuratore; equipaggiamento pratico, leggibile contro il verde. Donna secondo descrizione registrata. |
| **Nilo** | Rivale/amico del protagonista, competitivo ma rispettoso; incontro iniziale e apparizione al Passo delle Due Luci esplicitamente collegate. | Conservare profilo v3: felpa petrolio e borsa a tracolla; giovane, dinamico, stesso volto/abiti base nelle due tappe. |
| **Custode Leda** | Custode a Radicelmo. | Profilo autonomo, grembiule da vivaio e chiave/mazzetto di etichette come proposte; differenziarla dagli allenatori. Genere non specificato esplicitamente nella fonte consultata. |
| **Rami** | Guida sul percorso R03. | Segnale visivo da guida escursionistica, fascia/cordino mappa e palette muschio/terra; evitare confusione con Ada. Genere non specificato. |
| **Iris** | Biologa nel Delta; Iris è anche allenatrice facoltativa su R06, con ID e ruolo separati. Nessun alias esplicito unisce le due presenze. | Tenere **Biologa Iris** e **Iris di R06** distinte finché la storia non le collega: la prima con taccuino impermeabile e attrezzatura da campionamento; la seconda con tenuta da allenamento. Genere non specificato. |
| **Tessa** | Ricercatrice nell’osservatorio di Acquariva; confronta dati del lago col Delta. | Cappotto da osservatorio, lente o scheda di misurazione; verde acqua e grafite. Genere non specificato. |
| **Teo** | Naturalista nel Delta. | Abbigliamento da campo leggero e astuccio di campioni; distinguere da Iris tramite silhouette e strumento, non genere presunto. |
| **Ivo** | Presenza a Ferraluce; Custode Ivo separato a Petalora (ID distinti). | Non consolidare per il nome. Ivo di Ferraluce: addetto/abitante senza professione certa, look urbano-tecnico; Custode Ivo di Petalora: custode del luogo, abiti cerimoniali pratici e palette rosa/legno. |
| **Lea** | NPC a Vetracielo; dialogo locale. | Abitante urbana con accessorio legato a monorotaia/parco come proposta, non fatto. Genere non specificato. |
| **Guide** | Guida di Biancavetta, guida alpina di Passobrina, guida del Varco di Cristallo. ID diversi, persone distinte. | Tre profili da clima/luogo: mantella da neve e cartina; attrezzatura da funivia; guanti e lanterna da valico. Non riutilizzare un volto come se fosse una sola guida itinerante. |
| **Capitana Marina** | Personaggio nominato al porto; nessuna ulteriore biografia nel materiale consultato. | Segni da lavoro portuale (giacca cerata, fischietto o registro), palette corallo/navy; ruolo comunicato da postura e attrezzo. Non assumere che gestisca il battello se il dialogo non lo stabilisce. |
| **Allenatori di percorso nominati** | Sera, Timo, Nila, Oren, Dario, Viola, Lina, Noemi, Bruno, Maya, Celia, Ruben, Alma, Maia e Tobia sono record trainer; le battaglie indicano squadre e livello, non biografie complete. | Creare identità distinte per silhouette, età apparente non assertiva, capi e attrezzi coerenti con bioma (prato, città, costa, canneto, neve, passo). Genere non specificato: non usare nomi o specie squadra per dedurlo. Rendere gli allenatori facoltativi amichevoli e leggibili. |
| **Personale anonimo** | Addetta Centro Ferraluce, mercanti, tecnica Centrale, accoglienza Lega e ruoli di servizio. | Profili secondari leggibili con uniformi leggere/strumenti funzionali; non confondere studi non associati (negoziante, giardiniere, addetto ferrovia) con NPC canonici già collocati. |

### Casi di identità da mantenere aperti

- **Nerea palestra / Nerea Consiglio:** stesso nome, nessun collegamento identitario; trattarle come due persone finché una fonte narrativa non lo chiarisce.
- **Iris Delta / Iris R06** e **Ivo Ferraluce / Ivo Petalora:** ID separati e nessun profilo condiviso; niente fusione per nome.
- Studi non associati `shopkeeper`, `gardener`, `rail-attendant` nel catalogo d’apparenza sono studi grafici, non persone collocate né ruoli canonici assegnabili senza riscontro in dialoghi/mappa.

## Inventario delle 48 mappe da rifare o verificare

La colonna non descrive completezza artistica: tutte le scene richiedono controllo sul footprint, uscite, accesso ai servizi/NPC e leggibilità alla scala effettiva. I personaggi collocati sono elencati nella colonna finale; «—» indica nessuna presenza registrata nell’inventario, non assenza di ogni interazione di mappa.

| MapDefinition | Luogo | Presenze nominate |
|---|---|---|
| `acquariva` | Acquariva | Tessa |
| `biancavetta` | Biancavetta | Guida di Biancavetta |
| `borgofonte` | Borgofonte | Nilo |
| `borgofonte_home` | Casa di Borgofonte | — |
| `borgofonte_lab` | Laboratorio di Elia | Elia |
| `brumalta` | Brumalta | — |
| `concordia` | Concordia | Elia |
| `d01_bosco_veli` | Bosco dei Veli | Ada |
| `d03_centrale_risonante` | Centrale Risonante | Tecnica della Centrale |
| `d04_delta_specchi` | Delta degli Specchi | Biologa Iris, Naturalista Teo |
| `d05_grotte_cristallo` | Grotte del Cristallo | — |
| `d06_santuario_due_luci` | Santuario delle Due Luci | Elia |
| `ferraluce` | Ferraluce · Piazza dell’Energia | Ivo, addetta Centro, mercante |
| `gym01_brumalta` | Palestra di Brumalta | Mira |
| `gym02_petalora` | Palestra di Petalora | Dalia |
| `gym03_vetracielo` | Palestra di Vetracielo | Aster |
| `gym04_ferraluce` | Palestra di Ferraluce | Rhea |
| `gym05_portolume` | Palestra di Portolume | Nerea |
| `gym06_acquariva` | Palestra di Acquariva | Selene |
| `gym07_biancavetta` | Palestra di Biancavetta | Nives |
| `gym08_concordia` | Palestra di Concordia | Aurel |
| `league_champion` | Sala del Campione | Enea |
| `league_council01` | Sala di Nerea | Nerea (Consiglio) |
| `league_council02` | Sala di Silvo | Silvo |
| `league_council03` | Sala di Brando | Brando |
| `league_council04` | Sala di Luce | Luce |
| `league_forecourt` | Piazzale della Lega | Accoglienza |
| `passobrina` | Passobrina | Guida alpina |
| `petalora` | Petalora | Custode Ivo |
| `portolume` | Portolume · Porto delle Maree | Capitana Marina, servizi |
| `r01_sentiero_alba` | Sentiero dell’Alba | Sera, Timo |
| `r02_viale_fronde` | Viale delle Fronde | — |
| `r03_terrazze_muschio` | Terrazze del Muschio | Guida Rami |
| `r04_salita_petali` | Salita dei Petali | Nila |
| `r05_viadotto_ciliegi` | Viadotto dei Ciliegi | Oren |
| `r06_anello_magnetico` | Anello Magnetico | Iris (allenatrice) |
| `r07_condotto_risonante` | Condotto Risonante | Dario |
| `r08_costa_turbine` | Costa delle Turbine | Viola |
| `r09_dune_salmastre` | Dune Salmastre | Lina, Noemi |
| `r10_sentiero_canne` | Sentiero delle Canne | Maya, Bruno |
| `r11_via_cascate` | Via delle Cascate | Celia |
| `r12_valle_vento` | Valle del Vento | Ruben |
| `r13_tornanti_bianchi` | Tornanti Bianchi | Alma |
| `r14_varco_cristallo` | Varco di Cristallo | Guida del varco |
| `r15_passo_due_luci` | Passo delle Due Luci | Nilo |
| `r16_cammino_equilibrio` | Cammino dell’Equilibrio | Maia, Tobia |
| `radicelmo` | Radicelmo | Custode Leda |
| `vetracielo` | Vetracielo · Piazza della Monorotaia | Lea |

## Tavola atlanti: due composizioni 2×2

Usare due tavole concettuali 2×2 come presentazione compatta dei capipalestra, non come atlante runtime definitivo. Ogni riquadro contiene figura intera frontale a tre quarti, ritratto piccolo coerente, nome/luogo/tipo come etichetta di presentazione; non aggiungere statistiche o simboli che sembrino regole. Fondo chiaro caldo e ombre morbide, bordi/segni sottili ispirati al marchio Veloria menta–cielo–lilla, senza cornici pesanti. Mantenere lo stesso rapporto di scala e la stessa luce per confrontare le silhouette.

**Tavola A — inizio e città:**

| Mira · Normale · Brumalta | Dalia · Erba · Petalora |
|---|---|
| Forma aperta, crema/verde parco, sigillo | Sagoma petalo funzionale, salvia/rosa, attrezzo irrigazione |

| Aster · Elettro · Vetracielo | Rhea · Acciaio · Ferraluce |
|---|---|
| Verticale/asimmetrica, blu/giallo, clip rete | Squadrata/mobile, ardesia/rame, guanto magnetico |

**Tavola B — acque, neve e convergenza:**

| Nerea · Acqua · Portolume | Selene · Psico · Acquariva |
|---|---|
| Linea fluida, turchese/corallo, registro maree | Linee lunghe, lilla/acqua, pendente ottico |

| Nives · Ghiaccio · Biancavetta | Aurel · Drago · Concordia |
|---|---|
| Strati compatti, neve/blu/ambra, guanti | Geometria armonica, avorio/petrolio/oro, fermaglio a due archi |

### Produzione e controllo visivo

- In sprite da mappa, dare priorità a testa, capelli, spalle, accessorio e blocchi cromatici; niente dettagli fini che spariscono a dimensione di gioco. Piedi e origine restano coerenti con il contratto di appearance profile.
- Nei ritratti, mantenere la stessa forma del viso, acconciatura, accessorio e valori cromatici dello sprite. Esprimere personalità tramite posa/sguardo, non stereotipo di genere.
- Le otto palette dei leader devono essere leggibili anche in scala di grigi; i tipi sono supportati dall’icona/etichetta UI, non soltanto dalla tinta dell’abito.
- Per i 48 fondali, rispettare camera dall’alto, terreno dipinto e separazione dei layer. Mantenere chiari percorso giocabile, personaggi e target di interazione; verificare contro i dati Tiled, non ridisegnare la geometria per far combaciare un concept.
- Il catalogo stabile degli alias deve restare basato su ID. Nuove apparizioni della stessa persona richiedono profilo condiviso esplicito; nuove scelte di genere o relazioni richiedono conferma in una fonte narrativa prima di diventare canone.

## Fonti principali consultate

`docs/01_GDD_Veloria_v0.1.md`, `docs/02_WORLD_MAP_DESIGN_Veloria_v0.2.md`, `docs/05_ART_DIRECTION_v0.3.md`, `docs/28_LEAGUE_CHAMPIONSHIP_v0.1.md`, `docs/53_WORLD_AND_AVATAR_IMPROVEMENT_PLAN_v0.1.md`, `docs/57_NPC_IDENTITIES_AND_EARLY_PASSAGES_v0.1.md`, `content/region/veloria-atlas.v1.json`, `content/characters/appearances.v1.json`, `content/trainers/*.trainer.json`, `content/dialogue/*.json`, i dialoghi di capitolo in `content/drafts/`, `docs/art/full-redesign-inventory.json` e gli oggetti NPC nelle mappe Tiled corrispondenti.
