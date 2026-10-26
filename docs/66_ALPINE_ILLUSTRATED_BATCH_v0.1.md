# Lotto alpino — Passobrina e Tornanti Bianchi

Direzione comune: illustrazione2D moderna, neve dipinta, materiali opachi e percorsi leggibili. Collisioni, sblocchi, habitat, personaggi e collegamenti Tiled restano invariati. Il lotto prosegue il rifacimento delle48 mappe del documento58; non chiude l'obiettivo completo.

## Passobrina

Il primo candidato, derivato dal vecchio dipinto, manteneva le porte fuori dalle coordinate dei servizi e viene scartato. Il candidato integrato nasce invece dalla [maschera geometrica di produzione](../assets/prompts/passobrina-production-layout-v1.md). I volumi edilizi sono proposte artistiche nelle aree bloccate, non sagome dedotte come fatti da Tiled. La [guida annotata](../assets/prompts/passobrina-layout-guide-v1.md) separa collisioni e punti d'accesso dalle decisioni artistiche.

I pittogrammi vettoriali di cure, bottega, osservazione e funivia sono associati ai quattro hotspot attraverso `wayfindingIcon`. Il renderer condiviso li ancora alle coordinate reali senza nuove collisioni o etichette persistenti. Il fondale non incorpora questi segni.

Asset: [PNG raw](../assets/sources/veloria-passobrina-illustrated-v3.png), [WebP lossless](../public/assets/scenery/veloria-passobrina-illustrated-v3.webp), [prompt e provenienza](../assets/prompts/passobrina-illustrated-v3.md). Generazione built-in ImageGen; PNG1448×1086 conservato senza crop o resize.

Prove locali passate: percorso a piedi verso quattro servizi, prompt e quattro segni distinti; acquisizioni portrait/landscape dei servizi e della soglia orientale; attraversamento ovest e ritorno da R12, poi uscita verso R13. Verificata funivia bloccata prima della medaglia e percorribile in entrambi i sensi dopo, senza consumare denaro, strumenti o PS. Due casi finali passati, nessun errore JavaScript; screenshot revisionati. Log `.tmp/passobrina-wayfinding-final.log`.

## Tornanti Bianchi

Il [diagramma](../assets/prompts/r13-production-layout-v1.md) deriva dalla maschera Tiled e conserva i due habitat; soltanto gli ingombri dinamici di Alma e Articuno vengono esclusi dal riferimento per non dipingerli come ostacoli statici. Margine visivo di20px verso sud per i piedi. Il fondale ammorbidisce i bordi a gradini senza restringere il pavimento logico.

Asset: [PNG raw](../assets/sources/veloria-r13_tornanti_bianchi-illustrated-v3.png), [WebP lossless](../public/assets/scenery/veloria-r13_tornanti_bianchi-illustrated-v3.webp), [prompt e provenienza](../assets/prompts/r13_tornanti_bianchi-illustrated-v3.md). Generazione built-in ImageGen; PNG1448×1086 conservato senza crop o resize. Il fondale usa ora un oggetto `scenery-image` a copertura della mappa, sostituendo il precedente compositing `terrainBase` per questa scena; nessuna duplicazione dell'immagine nel render texture del terreno.

Percorso reale da Passobrina alle due radure, indicazioni, Alma, Articuno e uscita Biancavetta passato. Non è stata avviata la lotta speciale. Dodici schermate portrait/landscape acquisite e punti chiave revisionati: piedi sul terreno libero e habitat allineati. I due controlli globali sui26 fondali verificano rendering, dimensioni e identità NPC/uscite nei due orientamenti: passati insieme al percorso R13 (`.tmp/alpine-final-render.log`,3 casi).

## Ambito ancora aperto

Build finale e due casi offline passati: tutti i25 fondali non iniziali decodificati alla prima richiesta senza rete, viaggio in funivia e ritorno con reload e risorse invariate.767 test dominio e31 persistenza passati; validatore618 asset,26 fondali con provenienza e48 mappe passato. Cache PWA v168, contenuti0.4.5. Log `.tmp/alpine-production-final.log`, `.tmp/alpine-final-domain.log`, `.tmp/alpine-validated.log`. Inventario completo rigenerato dai dati attuali; nessuna accettazione automatica delle mappe o del cast.

Biancavetta, le altre mappe non accettate, direzioni e animazioni del cast, e la verifica naturale della campagna completa restano parte dell'obiettivo. Verifiche di produzione, asset e pubblicazione saranno registrate dopo l'esecuzione in `CI_STATUS.md`.
