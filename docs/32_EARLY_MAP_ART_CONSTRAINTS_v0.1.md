# Vincoli grafici delle prime mappe — v0.1

> Aggiornamento 0.3.137: le otto soglie laterali di R01/Bosco/R02/Brumalta sono ampliate alla larghezza stradale. R01 ovest y9–11, est y8–11; Bosco entrambi y9–11; R02 entrambi y8–10; Brumalta entrambi y11–13. Flag, destinazioni e spawn invariati. Le coordinate puntuali delle descrizioni storiche sotto sono ora incluse in questi corridoi, non rappresentano più l’unica casella di attivazione. Contratto e prove nel documento57.


Audit dei file MapDefinition e Tiled correnti, 21/10/2026. Nessuna modifica a geometria o runtime. Coordinate in celle, origine in alto a sinistra; rettangoli `[x,y,w,h]`, estremi superiori esclusi. Per un punto centrale nel prompt: `100*(x+0.5)/width`, `100*(y+0.5)/height`. Le immagini devono rispettare questi rapporti, senza comprimere una mappa 3:2 in 4:3.

## Direzione comune

2D illustrato moderno ortografico, terreno materico chiaro e leggibile, natura ricca ai margini, dettagli botanici/civici contemporanei, accenti acqua menta e lilla. Niente pixel art, contorni retrò, prospettiva isometrica, cornici, testo, HUD, NPC o Pokémon incorporati. I sentieri devono continuare fino al bordo in corrispondenza degli accessi reali. Nessuna strada decorativa che sembri uscire altrove. Gli spazi liberi fra gli oggetti sono percorribili: disegnare un grande muro, una scarpata o un albero pieno sopra questi spazi crea una falsa collisione visiva.

Edifici, tronchi, cartelli, pickup, console e personaggi hanno già sprite runtime: decidere esplicitamente quali restano sovrapposti. Non duplicarli nell'immagine. Per un primo passaggio conservativo generare il terreno e gli elementi non interattivi; lasciare le impronte degli edifici e i rispettivi accessi disponibili agli sprite esistenti. Per includere edifici illustrati occorre spegnere solo la loro rappresentazione, conservando l'oggetto interattivo/collisione.

## Percorsi vincolanti per i prompt

### Sentiero dell'Alba (30×20, 3:2)

Asse principale orizzontale x0–29, y9–11, ingresso ovest al centro di y10; uscita est a y8, quindi raccordare gli ultimi 3–4 passi verso nord fino al bordo est, senza interrompere la strada a x28. Il ruscello bloccato è SOLO x10–12,y3–8: non prolungare acqua bloccante oltre y8; la fascia y9–11 deve restare attraversabile. Il trigger narrativo «Ruscello» [9,9,5,4] NON è una collisione né richiede acqua dipinta su tutta la sua superficie. Quattro habitat laterali: ovest [8,5,4,3] parzialmente sovrapposto al ruscello esistente, nordest [20,5,4,3], sudovest [13,12,4,4], sudest [22,13,3,3]. Non nascondere la strada sotto felci alte. Sera(7,9), Timo(18,12), primo soccorso(15,9), cartello(27,8) richiedono avvicinamento adiacente libero. Alberi solidi soltanto (3,3),(6,15),(18,3),(27,15); rocce (4,13),(28,4).

### Bosco dei Veli (30×20, 3:2)

Passaggio ovest→est x0–29,y9–11; radura centrale ampliata x8–22,y8–12. Ada(13,10), misuratore(17,10), sua targa(16,9) restano runtime: radura ariosa con accesso inferiore y11 e aggiramento degli oggetti. Il cartello iniziale(2,10) non deve chiudere l'ingresso. Uscita est(29,10) è un vero passaggio, ma richiede q_ada_helped: evitare un muro dipinto permanente. Pozza nordest: acqua x22–26,y3–5; bordi solidi nord y2 e sud y6 x22–26, lati x21/27,y3–5. Non ampliare la pozza. Habitat [2,7,4,2] e [20,13,4,2], felci e alberi ai lati della radura. I tronchi esistenti sono elencati nell'appendice collisioni; non creare nuovi tronchi apparentemente solidi sul piano libero.

### Viale delle Fronde (28×20, 7:5)

Un viale continuo x0–27,y8–10, ingressi ovest/est entrambi y9. Soglia materiale verso Brumalta già prevista a x18: terreno naturale a ovest, pietra chiara a est, raccordo armonico senza scalino o muro. Habitat [4,6,4,2] a nordovest e [20,11,4,2] a sudest; cartello(20,7) runtime. Niente grandi laghi o edifici: non esistono collisioni corrispondenti. Filari sparsi nei soli punti di collisione dell'appendice, chiome decorative ammesse senza nascondere l'asse.

### Brumalta (36×24, 3:2)

Asse città ovest→est y11–13 fino a (0,12) e (35,12). Centro cure impronta [3,2,6,5], mercato [3,15,6,5], palestra [25,2,6,5]; accesso palestra esatto(28,7), spawn ritorno immediatamente a sud. Collegare visivamente la piazza alla palestra e alle soglie dei servizi, senza sentieri troncati davanti a un prato. Fontana [13,4,5,3], bordo solido perimetrale e piccolo centro a y5; niente acqua nel corridoio y7+. Monorotaia(21,10), arrivo(21,11), cartelli(10,11)/(17,8). Giardini laterali morbidi, pietra chiara prevalente nell'area centrale; nessuna cinta invalicabile inventata sui bordi attualmente liberi. L'uscita est richiede Aurora: eventuale segnale di chiusura deve essere dinamico, non parte del fondale.

### Radicelmo (36×24, 3:2)

Ingresso ovest(0,14), piazza/sentiero largo y13–15; salita nord a x17–19,y0, asse verso spawn(18,1). La strada attuale dipinta non raggiunge bene questo accesso: la nuova immagine deve raccordare l'asse x18 al nord, senza modificare collisioni. Edifici [2,3,6,5] cure, [10,3,6,5] erboristeria, [21,2,8,6] serra. Lasciare tutto il giardino della ricerca x21–29,y10–18 leggibile: Leda(25,11), bottega pietre(28,11), pickup(26,14), regolatore(22,16), vaso(25,16), misuratore luce(28,16). Questi elementi NON vanno incorporati né coperti da serra disegnata più grande. Collegamenti di pavimento fra piazza, Leda e i tre strumenti. Non aggiungere acqua profonda nel vivaio: non c'è collisione corrispondente.

### Petalora (38×28, 19:14)

Asse verticale x17–19 da y0 a27, rami orizzontali y11–13 verso est fino al bordo x37. Ingresso sud e palestra nord sono entrambi larghi3celle: renderli chiari senza recinto che attraversi la strada. A y17–18 c'è una fascia d'acqua bloccata x1–16 e20–36, attraversamento SOLO ponte x17–19. Il ponte collega realmente le due metà della città: non spostarlo o aggiungerne altri decorativi. Cure [7,3,6,5] e negozio [25,3,6,5], collegamenti a sud fino al viale, Ivo(19,8), cartello(17,9), monorotaia(24,13) con arrivo(24,14). Ciliegi e rive ricche, ma il centro x16–20,y1–16 rimane piazza e percorso aperto. La palestra è oltre il bordo nord: nessun edificio grande al centro della piazza. Uscita est sbloccata con Corolla, mai murata nel dipinto.

## Pattern di integrazione effettivo: Centrale

`assets/prompts/centrale-room-v1.md`: fonte PNG1448×1086, WebP lossless, stanza32×24. `content/maps/d03_centrale_risonante.map.json` registra `veloria-centrale-room-v1` come image. Il Tiled usa un oggetto `kind:scenery-image` a mappa intera, `sprite` corrispondente e `renderDepth` basso. `MapRenderer.ts` visualizza l'immagine nell'esatto rettangolo dell'oggetto, senza creare collisioni; queste restano nel layer collision e console/NPC rimangono separati. `terrain_detail` ha depth−5: un'immagine a−4 lo copre, quindi evitare strade decorative residue che dipendano da quel layer o scegliere un fondo sottostante appropriato. `terrainBase`, ove usato, sostituisce solo il ground e conserva terrain_detail: è un'altra scelta, non equivalente al fondale completo.

Per ciascuna nuova immagine: asset key univoca, percorso identico in tutte le mappe che condividono la key (il resolver rifiuta definizioni discordanti), registro asset+checksum/provenienza, precache PWA e versione contenuti. Ispezione visiva sui passaggi, poi prova reale spawn→uscite/servizi/missione, portrait e landscape; un'immagine bella da sola non prova allineamento o navigabilità.

## Appendice: coordinate autorevoli

Estratte dai file sotto `content/maps` e `public/tilemaps`. Nessun pathfinding o nuovo test browser eseguito in questo audit. Tutti i rettangoli sotto rimangono vincoli separati dalla grafica.

### r01_sentiero_alba

Spawn: `from_borgofonte` (1,10,right); `to_bosco` (29,8,down).

| Oggetto | Rettangolo | Regola |
|---|---|---|
| Sera | 7,9,1,1 | npc  |
| Timo | 18,12,1,1 | npc  |
| r01-rock-1 | 4,13,1,1 | rock  |
| r01-rock-2 | 28,4,1,1 | rock  |
| Bosco dei Veli | 27,8,1,1 | sign  |
| Fascia di primo soccorso | 15,9,1,1 | pickup  |
| Ritorno a Borgofonte | 0,10,1,1 | map-exit  → veloria/borgofonte |
| Ingresso al Bosco dei Veli | 29,8,1,1 | map-exit  → veloria/d01_bosco_veli |
| Erba alta ovest | 8,5,4,3 | encounter-zone  |
| Erba alta nord-est | 20,5,4,3 | encounter-zone  |
| Erba alta sud-ovest | 13,12,4,4 | encounter-zone  |
| Erba alta sud-est | 22,13,3,3 | encounter-zone  |

Collisioni Tiled: [3,3,1,1], [6,15,1,1], [18,3,1,1], [27,15,1,1], [4,13,1,1], [28,4,1,1], [7,9,1,1], [18,12,1,1], [27,8,1,1], [10,3,1,1], [11,3,1,1], [12,3,1,1], [10,4,1,1], [11,4,1,1], [12,4,1,1], [10,5,1,1], [11,5,1,1], [12,5,1,1], [10,6,1,1], [11,6,1,1], [12,6,1,1], [10,7,1,1], [11,7,1,1], [12,7,1,1], [10,8,1,1], [11,8,1,1], [12,8,1,1], [15,9,1,1].

### d01_bosco_veli

Spawn: `from_r01` (1,10,right); `to_brumalta` (29,10,right); `to_r02` (29,10,left).

| Oggetto | Rettangolo | Regola |
|---|---|---|
| Ada | 13,10,1,1 | npc  |
| Misuratore di risonanza | 17,10,1,1 | rock  |
| Il Bosco dei Veli | 2,10,1,1 | sign  |
| Radici antiche | 9,15,1,1 | rock  |
| Targa del misuratore | 16,9,1,1 | sign  |
| Ritorno al Sentiero dell’Alba | 0,10,1,1 | map-exit  → veloria/r01_sentiero_alba |
| Verso Brumalta | 29,10,1,1 | map-exit q_ada_helped → veloria/r02_viale_fronde |
| Sottobosco occidentale | 2,7,4,2 | encounter-zone  |
| Sottobosco orientale | 20,13,4,2 | encounter-zone  |

Collisioni Tiled: [2,2,1,1], [7,2,1,1], [15,1,1,1], [20,1,1,1], [28,2,1,1], [1,6,1,1], [5,6,1,1], [10,5,1,1], [17,6,1,1], [28,6,1,1], [2,13,1,1], [6,18,1,1], [10,13,1,1], [17,14,1,1], [21,17,1,1], [27,13,1,1], [28,18,1,1], [4,17,1,1], [22,2,1,1], [22,6,1,1], [23,2,1,1], [23,6,1,1], [24,2,1,1], [24,6,1,1], [25,2,1,1], [25,6,1,1], [26,2,1,1], [26,6,1,1], [21,3,1,1], [27,3,1,1], [21,4,1,1], [27,4,1,1], [21,5,1,1], [27,5,1,1], [22,3,1,1], [23,3,1,1], [24,3,1,1], [25,3,1,1], [26,3,1,1], [22,4,1,1], [23,4,1,1], [24,4,1,1], [25,4,1,1], [26,4,1,1], [22,5,1,1], [23,5,1,1], [24,5,1,1], [25,5,1,1], [26,5,1,1].

### r02_viale_fronde

Spawn: `from_bosco` (1,9,down); `to_brumalta` (26,9,down).

| Oggetto | Rettangolo | Regola |
|---|---|---|
| Indicazione per Brumalta | 20,7,1,1 | sign  |
| Ingresso dal Bosco dei Veli | 0,9,1,1 | map-exit  → veloria/d01_bosco_veli |
| Ingresso a Brumalta | 27,9,1,1 | map-exit q_ada_helped → veloria/brumalta |
| Felci occidentali | 4,6,4,2 | encounter-zone  |
| Felci orientali | 20,11,4,2 | encounter-zone  |

Collisioni Tiled: [3,3,1,1], [8,2,1,1], [13,3,1,1], [18,2,1,1], [23,3,1,1], [4,15,1,1], [10,16,1,1], [16,15,1,1], [22,16,1,1], [20,7,1,1].

### c01_brumalta

Spawn: `from_r02` (1,12,right); `to_gym` (28,9,down); `from_r03` (34,12,left); `metro_arrival` (21,11,up).

| Oggetto | Rettangolo | Regola |
|---|---|---|
| Centro Pokémon | 3,2,6,5 | house  |
| Bottega del Parco | 3,15,6,5 | house  |
| Palestra di Brumalta | 25,2,6,5 | house  |
| Mappa della città | 10,11,1,1 | sign  |
| Pannello del parco | 17,8,1,1 | sign  |
| Monorotaia di Brumalta | 21,10,1,1 | transit-terminal  |
| Ingresso Palestra | 28,7,1,1 | map-exit  → veloria/gym01_brumalta |
| Verso il Bosco dei Veli | 0,12,1,1 | map-exit  → veloria/r02_viale_fronde |
| Sentiero per Radicelmo | 35,12,1,1 | map-exit badge_aurora_awarded → veloria/r03_terrazze_muschio |

Collisioni Tiled: [13,4,1,1], [14,4,1,1], [15,4,1,1], [16,4,1,1], [17,4,1,1], [13,5,1,1], [17,5,1,1], [13,6,1,1], [14,6,1,1], [15,6,1,1], [16,6,1,1], [17,6,1,1], [1,2,1,1], [11,2,1,1], [19,2,1,1], [22,3,1,1], [32,2,1,1], [2,19,1,1], [10,20,1,1], [22,19,1,1], [31,18,1,1], [34,3,1,1], [34,20,1,1], [3,6,1,1], [4,6,1,1], [5,6,1,1], [7,6,1,1], [8,6,1,1], [3,19,1,1], [4,19,1,1], [5,19,1,1], [7,19,1,1], [8,19,1,1], [25,6,1,1], [26,6,1,1], [27,6,1,1], [29,6,1,1], [30,6,1,1], [21,10,1,1].

### radicelmo

Spawn: `from_r03` (1,14,right); `from_r04` (18,1,down).

| Oggetto | Rettangolo | Regola |
|---|---|---|
| Custode Leda | 25,11,1,1 | npc  |
| Centro della Comunità | 2,3,6,5 | house  |
| Erboristeria delle Fronde | 10,3,6,5 | house  |
| Serra e Archivio dei Semi | 21,2,8,6 | house  |
| Mappa di Radicelmo | 18,13,1,1 | sign  |
| Regolatore dell’acqua | 22,16,1,1 | rock  |
| Vaso del seme ancestrale | 25,16,1,1 | rock  |
| Misuratore di luce | 28,16,1,1 | rock  |
| Pietrafocaia della serra | 26,14,1,1 | pickup  |
| Bottega delle Pietre | 28,11,1,1 | sign badge_corolla_awarded |
| Ritorno alle Terrazze | 0,14,1,1 | map-exit  → veloria/r03_terrazze_muschio |
| Valico verso Petalora | 17,0,3,1 | map-exit badge_aurora_awarded → veloria/r04_salita_petali |

Collisioni Tiled: [2,3,6,5], [10,3,6,5], [21,2,8,6], [1,1,1,1], [9,1,1,1], [16,1,1,1], [33,1,1,1], [1,21,1,1], [9,21,1,1], [18,21,1,1], [31,21,1,1], [34,10,1,1], [28,11,1,1].

### petalora

Spawn: `from_r04` (18,26,up); `from_gym02` (18,1,down); `from_r05` (36,12,left); `metro_arrival` (24,14,up).

| Oggetto | Rettangolo | Regola |
|---|---|---|
| Custode Ivo | 19,8,1,1 | npc  |
| Padiglione delle Cure | 7,3,6,5 | house  |
| Bottega dei Ciliegi | 25,3,6,5 | house  |
| Piazza dei Ciliegi | 17,9,1,1 | sign  |
| Monorotaia di Petalora | 24,13,1,1 | transit-terminal  |
| Ritorno alla Salita dei Petali | 17,27,3,1 | map-exit  → veloria/r04_salita_petali |
| Palestra dei Ciliegi | 17,0,3,1 | map-exit badge_aurora_awarded → veloria/gym02_petalora |
| Viadotto dei Ciliegi | 37,11,1,3 | map-exit badge_corolla_awarded → veloria/r05_viadotto_ciliegi |

Collisioni Tiled: [0,0,1,28], [37,0,1,11], [37,14,1,14], [1,27,1,1], [1,0,1,1], [2,27,1,1], [2,0,1,1], [3,27,1,1], [3,0,1,1], [4,27,1,1], [4,0,1,1], [5,27,1,1], [5,0,1,1], [6,27,1,1], [6,0,1,1], [7,27,1,1], [7,0,1,1], [8,27,1,1], [8,0,1,1], [9,27,1,1], [9,0,1,1], [10,27,1,1], [10,0,1,1], [11,27,1,1], [11,0,1,1], [12,27,1,1], [12,0,1,1], [13,27,1,1], [13,0,1,1], [14,27,1,1], [14,0,1,1], [15,27,1,1], [15,0,1,1], [16,27,1,1], [16,0,1,1], [20,27,1,1], [20,0,1,1], [21,27,1,1], [21,0,1,1], [22,27,1,1], [22,0,1,1], [23,27,1,1], [23,0,1,1], [24,27,1,1], [24,0,1,1], [25,27,1,1], [25,0,1,1], [26,27,1,1], [26,0,1,1], [27,27,1,1], [27,0,1,1], [28,27,1,1], [28,0,1,1], [29,27,1,1], [29,0,1,1], [30,27,1,1], [30,0,1,1], [31,27,1,1], [31,0,1,1], [32,27,1,1], [32,0,1,1], [33,27,1,1], [33,0,1,1], [34,27,1,1], [34,0,1,1], [35,27,1,1], [35,0,1,1], [36,27,1,1], [36,0,1,1], [2,5,1,1], [6,9,1,1], [14,3,1,1], [23,3,1,1], [33,5,1,1], [35,15,1,1], [4,16,1,1], [8,21,1,1], [13,23,1,1], [24,23,1,1], [30,21,1,1], [34,25,1,1], [7,3,6,5], [25,3,6,5], [1,17,1,1], [2,17,1,1], [3,17,1,1], [4,17,1,1], [5,17,1,1], [6,17,1,1], [7,17,1,1], [8,17,1,1], [9,17,1,1], [10,17,1,1], [11,17,1,1], [12,17,1,1], [13,17,1,1], [14,17,1,1], [15,17,1,1], [16,17,1,1], [1,18,1,1], [2,18,1,1], [3,18,1,1], [4,18,1,1], [5,18,1,1], [6,18,1,1], [7,18,1,1], [8,18,1,1], [9,18,1,1], [10,18,1,1], [11,18,1,1], [12,18,1,1], [13,18,1,1], [14,18,1,1], [15,18,1,1], [16,18,1,1], [20,17,1,1], [21,17,1,1], [22,17,1,1], [23,17,1,1], [24,17,1,1], [25,17,1,1], [26,17,1,1], [27,17,1,1], [28,17,1,1], [29,17,1,1], [30,17,1,1], [31,17,1,1], [32,17,1,1], [33,17,1,1], [34,17,1,1], [35,17,1,1], [36,17,1,1], [20,18,1,1], [21,18,1,1], [22,18,1,1], [23,18,1,1], [24,18,1,1], [25,18,1,1], [26,18,1,1], [27,18,1,1], [28,18,1,1], [29,18,1,1], [30,18,1,1], [31,18,1,1], [32,18,1,1], [33,18,1,1], [34,18,1,1], [35,18,1,1], [36,18,1,1], [24,13,1,1].
