# Veloria — Art direction e produzione asset (v0.3)

## 1. Reference approvata

La mappa in `assets/concept/Veloria_World_Map_Concept_v0.1.png` definisce **l'atmosfera desiderata**. Particolare riferimento all'area di **Petalora**: ciliegi rosa, architetture tradizionali eleganti, cascate, terrazze verdi, ponti e luminosità calda. Estendere la stessa cura a natura, città moderne e neve, senza copiare direttamente lo stile proprietario o i singoli sprite di altri giochi.

**Direzione approvata dall’utente:** gioco ortogonale **2D illustrato moderno**, con profondità morbida 2.5D, personaggi e ambiente dipinti, luce calda e superfici leggibili. La pixel art ad alta densità resta un asset legacy, non il riferimento visivo per i nuovi contenuti. Viste isometriche nella mappa regionale **non obbligano** a una prospettiva isometrica nel gioco: mantenere la camera dall’alto per movimento e collisioni semplici.

## 2. Biomi e palette orientative

| Area | Impressione visiva | Elementi ambientali chiave |
|---|---|---|
| Borgofonte | caldo, rassicurante, verde rurale | tetti chiari, ruscelli, giardini, laboratorio leggermente tecnologico |
| Bosco dei Veli | verde profondo, monumentalità | alberi altissimi, vegetazione stratificata, muschi, raggi di luce, ombra |
| Brumalta | naturalità e modernità | edifici piccoli in vetro/legno, parchi urbani, passerelle pulite |
| Petalora | poetico, rosa, oro, acqua | ciliegi, petali animati, ponti, terrazze, piccoli santuari originali |
| Vetracielo | acciaio chiaro, blu, verde | grattacieli, monorotaia, parchi verticali, luci notturne |
| Ferraluce | tecnologico sobrio | torri energetiche, condotti, strutture industriali sostenibili |
| Portolume | luminoso mediterraneo | acqua turchese, moli, spiagge, skyline, fari |
| Acquariva | verde acqua / riflessi | laghi, canneti, pontili, canali |
| Biancavetta | bianco/blu con luci calde | neve, conifere, funicolari, vetro, chalet |
| Concordia | sublime, armonico | architettura futuristica integrata in pareti rocciose e vegetazione |

## 3. Standard game-art PROPOSTI

### Interfaccia approvata — Atlante immersivo, 17 ottobre 2026

Il prototipo in `layout-prototype.html` è il riferimento approvato dall’utente. L’app usa la mappa a tutto schermo, senza cornici gialle, bordi da console o margini celesti. Il marchio V con stella e gradiente menta/cielo/lilla accompagna una tipografia di sistema. Le superfici sovrapposte sono blu profondo, con gradienti e trasparenze leggere, testo chiaro e bordi sottili. Token condivisi in `src/ui-theme.css`.

Header compatto: marchio, luogo e menu. Diario, Pokédex, impostazioni, backup e aiuto si aprono dal menu; il selettore mappe di sviluppo è raccolto nello stesso pannello. Nessuna frase decorativa fissa sotto la mappa. L’obiettivo si riduce a icona al movimento e resta richiamabile; cambia tappa usando esclusivamente i progressi reali.

**Controlli approvati:** pad azzurro dell’app, con su/giù/sinistra/destra su due righe, a destra; pulsanti circolari A/B/S a sinistra, con colori e rilievo originali. A 320 px il salvataggio si dispone sopra A per mantenere bersagli da 44 px e spazio tra i gruppi. Portrait e landscape sono entrambi obbligatori. Le safe area contengono HUD e input. La camera copre lo schermo anche nelle stanze piccole, segue il giocatore e mantiene collisioni e coordinate indipendenti dallo zoom.

Dialoghi, diario, Pokédex, caricamento e pannelli di battaglia condividono le superfici dell’Atlante. Focus, etichette e forme rendono comprensibili gli stati oltre al colore; le animazioni rispettano la preferenza di movimento ridotto. Le mappe convergono verso illustrazione 2D moderna: volumi dipinti coerenti, palette naturale controllata, texture del terreno meno ripetitive e separazione netta fra scenario, personaggi e comandi. Questo design non introduce specie, premi o campi di salvataggio.

- **Tile base:** 32×32 pixel (da confermare con giocabilità mobile).
- **Personaggio:** footprint di collisione ~1 tile; sprite figurativo circa 32×48 o 48×64 a seconda del look.
- **Animazioni player:** idle e camminata nelle quattro direzioni; minimo 4 frame per direzione in prima fase; più frame in fase polish.
- **Layer Tiled:** `ground`, `terrain_detail`, `collision`, `shadows`, `characters`, `canopy_overhead`, `interactions`, `triggers`.
- **Asset atlases:** raggruppati per area per ridurre memoria e draw calls.
- **Erba alta, neve, petali e particelle:** gli effetti decorativi sono disattivabili o riducibili dalla qualità animazione; mai indispensabili per comprendere un puzzle. Le patch d’erba animate seguono i trigger Tiled di tipo `encounter-zone` senza alterarne incontri o collisioni.
- **Acqua del Bosco:** la pozza usa un’illustrazione originale con bordo muschio/roccia; i riflessi restano delicati e si fermano in modalità animazioni ridotte. Le collisioni rimangono negli oggetti Tiled, separate dall’immagine decorativa. La resa attuale è un placeholder stilistico da armonizzare.
- **UI:** pulsanti abbastanza grandi, simboli + testo, contrasto leggibile su cielo/foresta/acqua.

## 4. Asset list MVP (production checklist)

### Borgofonte

- 2 varianti di suolo, 5 erbe/cespugli, 3 alberi, rocce, corsi d'acqua, ponticello, recinti, tetti e pareti per 4–6 edifici.
- Laboratorio ricercatrice (esterno/interno semplice), camera del protagonista (interno), 3–5 NPC, avatar giocatore.
- Primo prototipo degli interni: camera con legno miele, intonaco crema e tessuti salvia; laboratorio con la stessa architettura, pavimento chiaro e strumenti botanici in vetro/ottone. Fondali originali ImageGen con collisioni e hotspot separati in Tiled; prompt archiviati in `assets/prompts/borgofonte-interiors-v1.md`. Sono asset di prototipo in attesa di accettazione visiva umana, non una modifica alla direzione approvata.

### Sentiero dell'Alba

- Erba alta animata, sentiero, cartelli, rocce, alberi/cespugli, punti d'interazione/oggetti, segnaposto ostacoli.

### Bosco dei Veli

- 2–3 alberi monumentali con chioma sovrapposta al personaggio, tronchi, radici, funghi, muschi, ponti, acqua, raggi luminosi, foglie.

### Brumalta

- Centro cura, negozio, Palestra, illuminazione parchi, vetrate, panchine, fontane, selciato, NPC urbani.

### Battaglia/UI

- Schermata di selezione starter (nel prototipo usa artwork PokéAPI locali; diritti e uso pubblico da risolvere), campi battaglia per bosco/prato/città, elementi UI, effetti attacco generici originali, cursori, transizioni, feedback danno e cattura.
- Fondale originale del bordo-bosco, riusabile dalle mappe di prato e foresta tramite `battleBackgroundKey`; i fondali di città e palestra restano da produrre e armonizzare alla direzione illustrata.

### Audio

- Tracce originali/licenziate per borgo, percorso, bosco, città e combattimento; SFX di menu, interazione, raccolta oggetti, colpi, cura, successo.

## 5. Perimetro diritti

L'illustrazione regionale è un **concept del progetto**; non dimostra licenza per sprite Pokémon, effetti, loghi o colonne sonore di altri titoli. Mantenere in `assets/ASSET_REGISTER.csv` registro con `asset_id,filename,creator,source_url,license,usage_permission,status`. Nessun asset esterno entra nella build senza revisione. Per un futuro rilascio pubblico, sostituire elementi Pokémon con creature/nomi originali o ottenere le autorizzazioni necessarie.

## 6. Asset production priority

### Aggiornamento implementato 17 ottobre 2026

- Il protagonista usa un atlas originale a sedici frame: quattro direzioni e quattro fasi di camminata, con movimento visivo continuo e collisioni sempre su griglia. Le animazioni ridotte mantengono una posa leggibile.
- Creature illustrate e UI sono separate dai dati e dal motore: `game/battle/creature-art.ts` associa ID stabili a celle di atlante. Lo stato corrente è aggiornato nella sezione «Comandi battaglia e artwork creature»; le note di copertura precedenti sono storiche.
- La presentazione della battaglia consuma gli eventi già risolti: affondo/proiettile, impatto con danno numerico, HP, cure, cattura, KO, XP e livello. Saltare il testo interrompe solo gli effetti. I comandi touch sono ingranditi e i layout distinguono portrait compatto e landscape.
- Diario e HUD mostrano flag e ricompense del catalogo esistente; non inventano premi, progressi o nuovi campi di salvataggio.
- Prompt esatti in `assets/prompts/character-modernization-v1.md`, modalità ImageGen integrata. Asset di prototipo privato con revisione visiva e dei diritti ancora da svolgere; questa integrazione non approva una nuova direzione artistica né l’intero gioco.

Prima **un quadrato giocabile di Borgofonte con placeholder coerenti**, poi avatar/animazioni, collisioni, erba e vegetazione alta, Brumalta, UI combattimento. Gli screenshot di concept servono come guida visiva, non come asset di gioco da ritagliare in modo casuale.

### Artwork starter del prototipo — 17/10/2026

Su decisione esplicita dell’utente, i quattro starter usano artwork PokéAPI locali, senza elaborazioni, nella scelta, nei ritratti e in battaglia. Sono una soluzione temporanea per il prototipo privato, con resa non ancora armonizzata alla direzione illustrata originale. Fonte e diritti nel registro asset e `assets/pokeapi-starter-artwork-v1.json`.

### Iterazione visiva 0.3.25 — richiesta utente 17/10/2026

Otto NPC originali illustrati sostituiscono i disegni geometrici (sprite/spriteFrame nei dati Tiled); Rami e Leda usano file autonomi dichiarati nei renderAssets delle loro mappe. Quattro chiome dipinte variano la vegetazione. Borgofonte, R01, Bosco, R02, R03 e Radicelmo usano ora lo stesso terreno ad alta risoluzione v5, con sorgenti indipendenti dalla griglia 32 px. Fonte e prompt in assets/prompts/world-modernization-v2.md e assets/prompts/npc-rami-v1.md / npc-leda-v1.md. Brumalta mantiene il suo atlante urbano; protagonista e interni restano da armonizzare e richiedono revisione visiva dell’utente.

### Comandi battaglia e artwork creature — 17/10/2026

Comandi battaglia con superfici navy sfumate, icone geometriche e focus menta/cielo/lilla. Dodici specie usano artwork locali PokéAPI (starter e otto precedentemente mancanti), otto gli atlanti originali esistenti: tutte le 20 specie MVP hanno una resa visibile. Fonti, diritti e hash nei registri artwork; uso del prototipo privato richiesto dall’utente, nessuna licenza generale di pubblicazione dedotta da PokéAPI. Armonizzazione illustrata delle creature e dei fondali resta aperta.


### Borgofonte illustrata v1 — 17 ottobre 2026

Le quattro facciate di Casa di Borgofonte, Emporio, Laboratorio di Elia e Officina usano veloria-borgofonte-buildings-v1.png: atlas 2×2 con illustrazione hand-painted 2D e alfa trasparente. Gli oggetti Tiled assegnano frame stabili 0–3 e conservano geometria d’interazione e passaggi; MapRenderer legge le stesse proprietà anche per atlanti futuri. Asset prototipo in attesa di revisione visiva, registrato in ASSET_REGISTER.csv.

### Vegetazione illustrata Borgofonte v1 — 17 ottobre 2026

Quattro gruppi di arbusti, fiori e pietre con muschio provengono da veloria-borgofonte-plants-v1.png. Otto istanze stabili nel layer Tiled decorations riempiono i prati senza alterare collisioni o guide di movimento. La mappa dichiara l'atlas nei propri renderAssets; ogni specie di decorazione è registrata in assets/ASSET_REGISTER.csv. Le tile HD usano riflessioni deterministiche derivate da mappa e coordinate: la distribuzione non ripete uno schema a scacchiera, e i bordi preallineati mantengono la continuità senza alterare collisioni o contenuti.


### Oggetti di campo illustrati v1 — 17 ottobre 2026

Cartelli, rocce muschiose, oggetti raccolti e misuratore di risonanza usano `veloria-field-props-v1.png`, atlante originale 2×2. I dati Tiled assegnano frame e sprite; ogni mappa dichiara l'asset e la griglia nell'entry `renderAssets`. La selezione dei frame deriva dai metadati dell'asset per facciate, piante, NPC e oggetti di campo, senza controlli legati a una specifica chiave di texture. Immagini decorative, interazioni e collisioni rimangono distinte.


### Terreno illustrato v3 — 17 ottobre 2026

La v3 è stata una prova applicata inizialmente a Borgofonte, Sentiero dell’Alba e Bosco dei Veli. L’atlante ridipinge i 12 materiali mantenendo canvas, griglia 6×2 e indici Tiled dell’asset precedente. È archiviata in `assets/archive/tilesets/`; prompt e checksum sono in `assets/prompts/ground-hd-v3.md`.

### Terreno a forme ampie per il Bosco — 17 ottobre 2026

La v4 ha provato una base verde muschio più uniforme, chiazze e fronde più ampie, con meno dettaglio fine. Canvas, celle Tiled 254×510, margine, spaziatura e indici sono rimasti invariati. È stata una variante di prototipo, poi sostituita da v5 e archiviata in `assets/archive/tilesets/`; prompt e checksum sono in `assets/prompts/ground-hd-v4.md`.

La v4 non ha ridotto abbastanza il rumore visivo a scala di gioco. Borgofonte, Sentiero, Bosco, Viale delle Fronde, Terrazze del Muschio e Radicelmo adottano quindi `veloria-ground-hd-v5.png`: campiture più uniformi, pochi gruppi ampi di muschio e nessuna micro-texture protagonista. Il renderer allinea i bordi e riempie i gutter ricavati dai metadati Tiled, poi compone `ground` e `terrain_detail` in una superficie statica a risoluzione di mappa. Dove la tile di prato ombreggiato resta visibile, riceve una variazione cromatica continua, deterministica e a bassa frequenza. Griglia, collisioni e passaggi restano invariati. Test browser controlla asset e superficie composta; prompt e checksum in `assets/prompts/ground-hd-v5.md`.

### Fondale forestale completo — 17 ottobre 2026

Bosco dei Veli, Viale delle Fronde, Terrazze del Muschio e Radicelmo dichiarano `terrainBase` con l’illustrazione originale `veloria-forest-floor-v1.png`, mostrata una volta e scalata ai limiti della mappa: così il sottosuolo non ripete la stessa tile. La base contiene solo campiture di terreno: non deve includere sentieri, alberi o altri elementi che appartengono ai dati Tiled. `terrainBase.tileIndex` identifica il materiale Tiled che il fondale sostituisce; il renderer rifiuta layer `ground` con materiali diversi. `terrain_detail` mantiene sentieri e superfici locali sopra il fondale; oggetti, collisioni e passaggi restano indipendenti. Prompt e checksum in `assets/prompts/forest-floor-v1.md`.

Con una base continua, `terrain_detail` deve contenere percorsi e dettagli locali; rimuovere le tile di prato scuro usate come riempimento a blocchi, che producono rettangoli visibili sopra il fondo illustrato. Nel Bosco sono state eliminate 91 celle GID 10; i GID di sentiero e acqua sono conservati.


### Continuità illustrata delle prime mappe — 21 ottobre 2026

Quattordici fondali completi sostituiscono composizioni a tile e fondali parziali dal Sentiero dell’Alba a Ferraluce. Riferimento qualitativo: Centrale Risonante, mantenendo identità forestale, floreale e tecnologica dei luoghi. Gli oggetti statici già dipinti usano `visualBaked`; le interazioni rimangono dati indipendenti. Un anello di prossimità aiuta a riconoscere il bersaglio attivo. Collisioni e uscite restano identiche: confronto normalizzato documentato nell’audit31. Prompt e fonti di tutte le varianti selezionate sono in `assets/map-parity-v2.json`.

Le chiome dipinte nel fondale non forniscono occlusione dinamica del personaggio. Un eventuale livello separato per fronde e tetti richiederà artwork dedicati e verifica della leggibilità; non è compreso in questa revisione.
