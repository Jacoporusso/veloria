# Audit di parità visiva delle mappe v0.1

**Stato:** audit statico dei dati, 21 ottobre 2026. Non è stata eseguita una revisione visiva di screenshot o asset.

## Scopo e metodo

Inventario delle 48 definizioni in `content/maps/*.map.json`, confrontate con il rispettivo Tiled `.tmj` in `public/tilemaps/` e con i file immagine WebP referenziati. La copertura è classificata come `FULL` quando un asset scena usato da `terrainBase` risiede in `assets/scenery/`, oppure quando il rettangolo di un oggetto Tiled `scenery-image` copre almeno l’intero mondo; `PARTIAL` quando l’immagine di scena copre solo una parte; `COMPOSED` quando il fondo è composto dalle tile/terrain di base e props, senza un artwork di scena full-map. `HD v5` e `legacy` indicano invece il `key` del tileset: sono una classificazione indipendente dalla copertura. `FULL` descrive l’estensione dei dati di artwork, non certifica qualità, allineamento o approvazione visiva.

### Riferimenti grafici e di gioco

- `docs/05_ART_DIRECTION_v0.3.md` approva un RPG ortogonale 2D illustrato moderno, con profondità morbida, superfici dipinte e leggibili, palette coerenti per bioma, texture meno ripetitive e separazione chiara fra scenario, personaggi e comandi. Richiede inoltre prove portrait e landscape e riporta il prototipo approvato come riferimento dell’interfaccia.
- `docs/04_TECHNICAL_ARCHITECTURE_v0.3.md` fissa la griglia logica a 32×32 unità. Gli strati di terreno possono usare sorgenti HD scalate a 32 unità; oggetti, collisioni, trigger e salvataggi restano in coordinate mondo. La mappa concettuale regionale non è una tilemap di collisione.
- `content/maps/README.md` assegna la grafica non interattiva al livello Tiled `decorations`, con `kind: scenery-image`; collisioni e navigazione vanno definite separatamente.
- `docs/03_MVP_FUNCTIONAL_SPEC_v0.3.md` e `docs/02_WORLD_MAP_DESIGN_Veloria_v0.2.md` danno priorità al percorso iniziale Borgofonte → R01 → Bosco dei Veli → R02 → Brumalta → Palestra 1. La specifica MVP richiede inoltre test mobili in portrait.
- `docs/08_ROADMAP_BACKLOG_v0.3.md` registra esplicitamente la parità visiva delle prime zone come lavoro aperto e chiede di conservare porte, NPC, collisioni, missioni e percorsi iniziali durante l’aggiornamento artistico.

## Risultato sintetico

- **48 mappe** sono presenti in `content/maps/` e hanno un Tiled associato.
- **34/48** hanno un artwork full-map secondo il criterio dati; **3/48** hanno solo artwork di scena parziale; **11/48** sono composte da terreno base/tile e props senza artwork full-map.
- **44/48** dichiarano il tileset `veloria-ground-hd-v5`. Quattro usano una base legacy: tre `veloria-ground` (interni di Borgofonte e Palestra 1) e una `veloria-brumalta-ground` (Brumalta).
- **20/48** dichiarano un asset sotto `assets/scenery/`; 4 sono collocati come `scenery-image`, 17 sono usati da `terrainBase` (R12 li usa in entrambi i modi). Il percorso da solo non distingue la funzione.
- Le **14 mappe senza copertura full-map** sono i candidati da rinnovare per ottenere un’immagine di scena completa. La presenza di una tile HD o di un’immagine parziale non equivale a copertura full-map.
- Borgofonte ha già un’immagine full-map; Bosco dei Veli ha un’immagine parziale dello stagno sopra il terreno. R01, R02, Brumalta e Palestra 1 sono composte senza artwork full-map.

## Inventario delle 48 mappe

Priorità: **A** è il percorso MVP e gli interni iniziali; **B** è la prima espansione dopo il primo badge; **C** comprende i capitoli intermedi; **D** comprende il blocco montano, Concordia e la Lega. Le priorità ordinano la revisione artistica, non attestano che il gioco o le mappe siano completi.

`FULL`, `PARTIAL` e `COMPOSED` seguono la regola di copertura nella sezione precedente. `HD v5` = `veloria-ground-hd-v5`; `legacy` = altro tileset base.

| Prio. | ID | Nome visualizzato | Copertura | Tileset |
|---|---|---|---|---|
| A | `veloria/borgofonte` | Borgofonte | FULL | HD v5 |
| A | `veloria/borgofonte_home` | Casa di Borgofonte | FULL | legacy |
| A | `veloria/borgofonte_lab` | Laboratorio di Elia | FULL | legacy |
| A | `veloria/r01_sentiero_alba` | Sentiero dell’Alba | COMPOSED | HD v5 |
| A | `veloria/d01_bosco_veli` | Bosco dei Veli | PARTIAL | HD v5 |
| A | `veloria/r02_viale_fronde` | Viale delle Fronde | COMPOSED | HD v5 |
| A | `veloria/brumalta` | Brumalta | COMPOSED | legacy |
| A | `veloria/gym01_brumalta` | Palestra di Brumalta | COMPOSED | legacy |
| B | `veloria/r03_terrazze_muschio` | Terrazze del Muschio | COMPOSED | HD v5 |
| B | `veloria/radicelmo` | Radicelmo | COMPOSED | HD v5 |
| B | `veloria/r04_salita_petali` | Salita dei Petali | COMPOSED | HD v5 |
| B | `veloria/petalora` | Petalora | COMPOSED | HD v5 |
| B | `veloria/gym02_petalora` | Palestra di Petalora | COMPOSED | HD v5 |
| B | `veloria/r05_viadotto_ciliegi` | Viadotto dei Ciliegi | COMPOSED | HD v5 |
| B | `veloria/vetracielo` | Vetracielo | PARTIAL | HD v5 |
| B | `veloria/gym03_vetracielo` | Palestra di Vetracielo | FULL | HD v5 |
| C | `veloria/r06_anello_magnetico` | Anello Magnetico | COMPOSED | HD v5 |
| C | `veloria/ferraluce` | Ferraluce | PARTIAL | HD v5 |
| C | `veloria/gym04_ferraluce` | Palestra di Ferraluce | FULL | HD v5 |
| C | `veloria/r07_condotto_risonante` | Condotto Risonante | FULL | HD v5 |
| C | `veloria/d03_centrale_risonante` | Centrale Risonante | FULL | HD v5 |
| C | `veloria/d04_delta_specchi` | Delta degli Specchi | FULL | HD v5 |
| C | `veloria/r08_costa_turbine` | Costa delle Turbine | FULL | HD v5 |
| C | `veloria/portolume` | Portolume | FULL | HD v5 |
| C | `veloria/gym05_portolume` | Palestra di Portolume | FULL | HD v5 |
| C | `veloria/r09_dune_salmastre` | Dune Salmastre | FULL | HD v5 |
| C | `veloria/acquariva` | Acquariva | FULL | HD v5 |
| C | `veloria/gym06_acquariva` | Palestra di Acquariva | FULL | HD v5 |
| C | `veloria/r10_sentiero_canne` | Sentiero delle Canne | FULL | HD v5 |
| C | `veloria/r11_via_cascate` | Via delle Cascate | FULL | HD v5 |
| C | `veloria/r12_valle_vento` | Valle del Vento | FULL | HD v5 |
| D | `veloria/passobrina` | Passobrina | FULL | HD v5 |
| D | `veloria/biancavetta` | Biancavetta | FULL | HD v5 |
| D | `veloria/r13_tornanti_bianchi` | Tornanti Bianchi | FULL | HD v5 |
| D | `veloria/r14_varco_cristallo` | Varco di Cristallo | FULL | HD v5 |
| D | `veloria/gym07_biancavetta` | Palestra di Biancavetta | FULL | HD v5 |
| D | `veloria/r15_passo_due_luci` | Passo delle Due Luci | FULL | HD v5 |
| D | `veloria/d06_santuario_due_luci` | Santuario delle Due Luci | FULL | HD v5 |
| D | `veloria/concordia` | Concordia | FULL | HD v5 |
| D | `veloria/d05_grotte_cristallo` | Grotte del Cristallo | FULL | HD v5 |
| D | `veloria/gym08_concordia` | Palestra di Concordia | FULL | HD v5 |
| D | `veloria/r16_cammino_equilibrio` | Cammino dell’Equilibrio | FULL | HD v5 |
| D | `veloria/league_forecourt` | Piazzale della Lega | FULL | HD v5 |
| D | `veloria/league_council01` | Sala di Nerea | FULL | HD v5 |
| D | `veloria/league_council02` | Sala di Silvo | FULL | HD v5 |
| D | `veloria/league_council03` | Sala di Brando | FULL | HD v5 |
| D | `veloria/league_council04` | Sala di Luce | FULL | HD v5 |
| D | `veloria/league_champion` | Sala del Campione | FULL | HD v5 |

## Prima tranche e compatibilità geometrica

La tranche A è l’insieme di otto mappe MVP sopra elencate: tre sono già classificate `FULL`, una `PARTIAL` e quattro `COMPOSED`. I dati Tiled attuali forniscono una separazione utilizzabile: `collision`, `triggers`, `interactions` e `characters` restano oggetti distinti dalle immagini decorative. Un artwork di fondo può quindi essere introdotto mantenendo invariata la geometria funzionale, se il disegno si adatta al rettangolo mondo e ai punti di passaggio esistenti.

| Mappa | Griglia Tiled | Rettangoli collisione | Uscite | Stato immagine |
|---|---:|---:|---:|---|
| Borgofonte | 44×32 | 68 | 3 | FULL già presente |
| Casa di Borgofonte | 24×16 | 8 | 1 | FULL già presente |
| Laboratorio di Elia | 24×16 | 9 | 1 | FULL già presente |
| R01 Sentiero dell’Alba | 30×20 | 28 | 2 | COMPOSED |
| Bosco dei Veli | 30×20 | 49 | 2 | PARTIAL: immagine stagno; fondo generale da integrare |
| R02 Viale delle Fronde | 28×20 | 10 | 2 | COMPOSED |
| Brumalta | 36×24 | 39 | 3 | COMPOSED, tileset legacy |
| Palestra di Brumalta | 28×20 | 30 | 1 | COMPOSED, tileset legacy |

La prima lavorazione compatibile con la geometria è R01 e R02 (percorsi piccoli, passaggi e collisioni già definiti), poi Bosco dei Veli (integrando la pozza esistente), Brumalta e Palestra 1 (incluse le due basi legacy). Gli interni e Borgofonte forniscono confronti `FULL` già presenti. L’ordine non sostituisce il percorso A né implica che siano già eseguiti test visivi. La città e i sentieri richiedono che l’immagine rappresenti con precisione soglie, varchi, sentieri camminabili e landmark usati dagli oggetti di gioco.

### Elenco dei candidati per artwork full-map

Sono **14** le mappe senza fondo full-map nei dati attuali:

- **COMPOSED (11):** `veloria/r01_sentiero_alba`, `veloria/r02_viale_fronde`, `veloria/brumalta`, `veloria/gym01_brumalta`, `veloria/r03_terrazze_muschio`, `veloria/radicelmo`, `veloria/r04_salita_petali`, `veloria/petalora`, `veloria/gym02_petalora`, `veloria/r05_viadotto_ciliegi`, `veloria/r06_anello_magnetico`.
- **PARTIAL (3):** `veloria/d01_bosco_veli` (stagno), `veloria/ferraluce` (immagine ambientale più piccola della mappa), `veloria/vetracielo` (stazione della monorotaia).

Per i tre casi `PARTIAL`, l’asset esistente può essere integrato nell’illustrazione completa oppure mantenuto come livello di dettaglio, dopo verifica dell’allineamento e della profondità.

### Vincoli di geometria da preservare

Per ogni aggiornamento di scena, confrontare il TMJ prima e dopo e confermare:

1. Dimensioni e griglia del mondo restano identiche: **32×32 unità logiche per tile** e larghezza/altezza della mappa invariate.
2. Coordinate, dimensioni e proprietà di tutti gli oggetti in `collision`, `triggers`, `interactions`, `characters` e `canopy_overhead` restano identiche, salvo una modifica funzionale esplicitamente registrata.
3. Ogni immagine di sfondo copre il rettangolo del mondo visibile e mantiene allineati ingressi, uscite, scale, ponti e percorsi; nessuna fascia vuota, fessura di campionamento o landmark chiave fuori posto negli screenshot.
4. Il percorso resta leggibile in portrait e landscape agli viewport già usati dal progetto (inclusi 390×844 e 320×568); la camera copre il viewport senza rendere invisibili gli accessi o gli obiettivi.
5. Gli attori e le chiome continuano a rispettare la profondità disegnata: personaggio leggibile sul terreno, elementi sopraelevati sopra il personaggio solo dove dichiarato.
6. Il contrasto fra area camminabile, acqua, ostacoli e decorazione è controllabile senza affidarsi al colore soltanto; incontri e interazioni restano comprensibili anche a movimento ridotto.
7. Asset originali e derivati WebP hanno provenienza, licenza, dimensioni, checksum e registrazione/cache coerenti con `docs/04_TECHNICAL_ARCHITECTURE_v0.3.md` e il registro asset.

Questi sono criteri di accettazione proposti e verificabili; il presente audit non afferma che alcuno sia già superato. La verifica conclusiva richiede screenshot renderizzati a più viewport e confronto da una persona con la direzione approvata in `docs/05_ART_DIRECTION_v0.3.md`.

## Dettaglio degli asset scenery

Il controllo dei JSON ha trovato **20 asset** il cui percorso è sotto `assets/scenery/`: `acquariva`, `biancavetta`, `borgofonte`, `concordia`, `d05_grotte_cristallo`, `d06_santuario_due_luci`, `gym07_biancavetta`, `gym08_concordia`, `league_champion`, `league_council01`–`league_council04`, `league_forecourt`, `passobrina`, `r12_valle_vento`, `r13_tornanti_bianchi`, `r14_varco_cristallo`, `r15_passo_due_luci`, `r16_cammino_equilibrio`.

Quattro di questi sono collegati a oggetti `scenery-image` in Tiled: **Acquariva, Borgofonte, Passobrina e R12 Valle del Vento**. Diciassette sono collegati a `terrainBase` (R12 li usa anche come oggetto immagine). Il renderer stende `terrainBase` su tutta la superficie mondo; gli asset dedicati sotto `assets/scenery/` sono classificati come full-map, mentre le texture riutilizzabili sotto `assets/tilesets/` rimangono base di composizione. Altre mappe hanno oggetti `scenery-image` registrati in percorsi diversi, per esempio gli interni di Borgofonte, la sala della Centrale e alcuni scenari di capitolo. Il controllo delle dimensioni dell’oggetto contro il mondo Tiled distingue i fondi completi da quelli parziali.

## Limiti dell’audit

L’inventario ha letto metadata JSON, dati Tiled e dimensioni WebP, senza avviare il gioco, creare screenshot o valutare a occhio la qualità artistica. `FULL` prova che l’artwork è dimensionato/assegnato per coprire il mondo secondo i criteri dati, non che riempia correttamente ogni viewport, che sia artisticamente coerente, o che i dettagli di collisione siano percepibili. Nessuna conclusione di “parità raggiunta” è quindi formulata.

## Verifica geometrica delle 14 mappe illustrate

Il **21 ottobre 2026** i TMJ attuali delle 14 mappe candidate sono stati confrontati con `HEAD d46aeb31c3e77017538adb0ab1fc06b323a7950a`. Prima del confronto sono stati rimossi dal JSON soltanto: `nextobjectid` e `nextlayerid` (contatori Tiled); la proprietà `visualBaked`; gli oggetti `scenery-image` aggiunti per il nuovo fondo, identificati dalla proprietà sprite con suffisso `-illustrated-v2` e origine `(0, 0)`; un livello `decorations` rimasto vuoto dopo la rimozione del fondo. È stato serializzato il JSON canonico UTF-8 con chiavi ordinate e SHA-256. In tutti i casi l’hash canonico normalizzato di HEAD coincide con quello attuale: il controllo non ha rilevato variazioni nei dati TMJ rimanenti, incluse collisioni, trigger, interazioni, personaggi, layer, coordinate, spawn e proprietà.

| Mappa | SHA-256 canonico normalizzato (HEAD = attuale) |
|---|---|
| `r01_sentiero_alba` | `0405cc21125f74ad6cdbdcedd05aba2753ac9aaaa3d09947673b09f1091db26d` |
| `d01_bosco_veli` | `4a69fdd8c80416f58eb464ef055c9347b761a7f1a5c0efd1587de423fbf6cc17` |
| `r02_viale_fronde` | `a382067f5f99022078e4be70c5652cd8e31da4b1a308676b663403668e1c54b1` |
| `c01_brumalta` | `df50a3947b88c26dc2505d9560216e211acf46bceed18cb81b86e2ab375ac6a6` |
| `gym01_brumalta` | `648fe9a4417150f99000b6ec1278aacb6deac3b1cf0184d7cdb34d191f6377eb` |
| `r03_terrazze_muschio` | `33fe92a23bc103fac841ac72b9beb537cc84f8452b11ac2630b960b830257ee2` |
| `radicelmo` | `0cb1c60695f55c27085553a02c496313f85c9fe8047c3da2216ba28e8bb7f8cc` |
| `ferraluce` | `1ea51c02825e77d8efd9c3af5e2120f790741f69bba962ee44459781cf60f977` |
| `gym02_petalora` | `c6eb6afc9e0ad4466e73d3502b8361b14dc68da728417ddf0a0f16fe9ff9f957` |
| `petalora` | `8744bd0b97a527ebbb230bed1c96592742404bb4597064f491bf5f953f4df352` |
| `r04_salita_petali` | `5c2006e712b62c2b46fccf7864b3713e81177a54c39dda02e39bc069d55ebe52` |
| `r05_viadotto_ciliegi` | `66742fa1a6099301725f2b8d6d16bac2532d26e774c30069faa8f80a9b2432e7` |
| `r06_anello_magnetico` | `d0ef150f12dd4ba7acf8cc28bad9a6f0a313034df8b6fce124275de55d751346` |
| `vetracielo` | `8826987049286827391f97619e72a9d940eaec9a337ffb464d7c55c93ef23358` |

Questa verifica attesta l’uguaglianza strutturale dei dati TMJ fuori dalle aggiunte grafiche elencate. Non sostituisce una prova del rendering o una revisione visiva degli asset.


## Integrazione e verifiche 0.3.103 — 21 ottobre 2026

Tutte14 candidate sono ora collegate a fondali illustrati completi. L’inventario passa quindi da34 FULL +14 parziali/composizioni a48 mappe con fondale completo;34 artwork esistenti sono conservati e14 sono nuovi. La copertura non certifica da sola la qualità di ogni scenario. Browser: tutte14 renderizzate nei due orientamenti, NPC/uscite presenti, nessun errore; percorso iniziale al Bosco e prima medaglia passati. PWA:14 immagini decodificate alla prima richiesta offline. FontiPNG, WebPlossless, prompt, revisioni e SHA256 in assets/map-parity-v2.json;35,5MiB di nuovi WebP nella cache.

Miglioria di leggibilità: alone locale sul bersaglio interagibile vicino al personaggio. Limite: fronde e tetti dipinti nel fondale non occludono dinamicamente il protagonista; un futuro livello separato richiede asset dedicati.
