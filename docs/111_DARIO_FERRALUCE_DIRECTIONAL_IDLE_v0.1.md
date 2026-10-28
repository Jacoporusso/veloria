# Dario e i servizi di Ferraluce

Quattro profili mantengono ruoli e coordinate: Dario nel Condotto Risonante, Ivo, addetta del Centro e mercante a Ferraluce. Sedici pose idle indipendenti sostituiscono i frame degli atlanti per questi NPC, senza cambiare squadre, premi, collisioni, servizi o dialoghi. Ivo Ferraluce resta distinto dal custode di Petalora.

## Produzione e calibrazione

ImageGen integrato, con lavorazione parallela e revisione del coordinatore. PNG originali immutati in `assets/sources/veloria-dario-idle-*-v1.png` e `assets/sources/veloria-ferraluce-{ivo,care,shop}-idle-*-v1.png`. WebP lossless nei percorsi corrispondenti in `public/assets/sprites/`. Provenienza, prompt esatti, riferimenti, output, hash e scarti in `assets/prompts/dario-idle-views-v1.json` e `assets/prompts/ferraluce-service-idle-views-v1.json`.

Il primo retro Dario spostava tasca e pendente sul fianco sbagliato: sostituito con una nuova generazione. Tasca/anello rimangono a sinistra, pendente rosso e polsiera a destra. Ivo conserva il raccoglitore sul lato destro; l'addetta conserva la fascia sul sinistro; il mercante ha panno a sinistra e anello a destra. Nessun flip o ritocco creativo dei pixel. Le annotazioni sulla trasparenza e sulla fascia dei capelli dell'addetta restano nella provenienza.

Corpo alpha≥128 alto 56 unità mondo, origini misurate sulle suole e scala uniforme. Il coordinatore ha verificato nuovamente l'uguaglianza RGBA dei dodici derivati Ferraluce prima di sincronizzarne gli hash finali. Sistemati i binding base/frame legacy, le direzioni canoniche del manifest e i percorsi CSV relativi al registro; header UTF-8 senza BOM. I test non sono stati adattati per tollerare riferimenti o hash errati.

## Risorse per mappa

Rimossi soltanto dai `renderAssets` di R04/R05/R06/R07 e Ferraluce i due atlanti ormai inutilizzati. Non risultano riferimenti residui nei rispettivi Tiled; catalogo globale, file, studio non associato a NPC, registro, riferimenti di identità e precache conservati. Audit in `art/retired-route-service-atlases-0.4.35.json`. La rimozione non costituisce una riduzione del download PWA; memoria GPU e prestazioni non sono state misurate.

## Verifica

Sedici sorgenti selezionate riviste; compositi frontali portrait e laterali landscape dei quattro NPC controllati sul terreno effettivo. Nessun alone evidente a scala di gioco, ferma la limitazione dei dettagli sottili nella minificazione a DPR 1.

Prima verifica: quattro casi Chrome e due casi globali sulle 51 presenze passati. Centro e negozio verificano apertura e chiusura senza cure/acquisti, con squadra, inventario, denaro, flag e RNG conservati. Quattro casi produzione offline passati sulla build. Dopo la rimozione degli atlanti: nove casi nativi finali passati (`.tmp/ferraluce-cast-retired-native.log`), sette sulle identità coinvolte e due globali. Sette casi produzione offline finali passati (`.tmp/ferraluce-cast-retired-offline.log`), con assenza delle vecchie texture/richieste runtime e primo decode delle pose. TypeScript e build finale passati con avviso chunk Phaser.

832 test dominio/persistenza passati, inclusi quattro test della strategia visibile del driver; 154 Python e validatore 882 risorse/48 fondali/48 mappe passati. Discovery: 415 casi browser assegnati una sola volta e 62 risorse offline divise 31+31. TypeScript e build passati con avviso chunk Phaser. I fixture grafici non attestano una partita naturale.

## Prova della quinta palestra

Il driver Nerea ora accetta la squadra Gen I realmente guadagnata, riposa tramite il Centro, conserva checkpoint reali prima/dopo la sfida e fallisce dopo l'export se la medaglia non viene ottenuta. La scelta dei cambi usa soltanto tipi visibili, proprie mosse con PP e statistiche note, con margine minimo per evitare cambi marginali. Non legge i comandi avversari o le loro statistiche nascoste; non attribuisce danni, mosse, XP o risorse al salvataggio. La scelta delle mosse attive continua a usare le previsioni visibili del gioco. Il primo caso corrente si ferma con sconfitta contro Viola, prima di Nerea; risorse consumate e XP conservati nel checkpoint reale. Dettagli e limiti in [tentativo costiero](playtests/2026-10-28-gen1-viola-first-attempt.md). Nessuna quinta medaglia attestata.

23 identità direzionali su 48; 25 restano da migrare. Questo lotto aggiunge idle, non camminate. Le quattro palestre dopo Rhea e la Lega restano da verificare nella catena corrente.
