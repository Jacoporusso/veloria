# Doni Pokémon localizzabili e margini senza copie dello scenario

La foto dell'utente mostrava le missioni dei tre fossili con il solo nome della ricompensa e «0/1 passi». Quelle schede non spiegavano dove andare o perché il dono fosse ancora bloccato.

## Diario e atlante

Sei guide collegano le quest reali a mappa e NPC: tre fossili da Elia a Borgofonte, Bulbasaur da Leda, Charmander da Ivo e Squirtle da Tessa. I testi provengono da dialoghi e interazioni Tiled; la [sorgente](../content/journey/pokemon-rewards.v1.json) non duplica specie, livelli, ricompense o flag. Il requisito esterno viene derivato dai `requiresFlags` della quest, escludendo i flag che i suoi stessi passaggi producono. Non cambia alcuna regola di acquisizione.

Le schede mostrano luogo, requisiti, azione e stato «Da sbloccare», «Da completare/Da ricevere» o «Ricevuto». «Vedi sulla mappa» apre il dono selezionato nel luogo corretto, senza spostare il giocatore; ad esempio Omanyte apre la propria scheda, non quella di Aerodactyl. In portrait la scheda mirata dispone di più spazio. La normale selezione di un'area torna alla panoramica dei suoi contenuti. Il simbolo 🎁 segnala un dono disponibile e non ancora ricevuto.

Fossili: dopo la Lega, laboratorio con cupola azzurra a sud della piazza di Borgofonte; parlare con Elia e scegliere «Ridona vita a…». Tutti e tre possono essere ricevuti al20, uno alla volta. È stato verificato il dialogo reale, non soltanto il flag preparato in una fixture.

## Margini della camera

Il vecchio riempimento rifletteva tutta la mappa e poteva riproporre la cupola di Biancavetta sopra il bordo nord. Il nuovo modulo `map-edge-backdrop.ts` campiona soltanto24px di bordo in coordinate mondo, riduce il campione a32×4 e crea un campo colore sfumato256×64. Le due texture derivate vengono riutilizzate in memoria; nessun PNG/WebP sorgente viene modificato. Si sceglie il fondale completo più alto, oppure la base pittorica del terreno, e si disegnano due soli riempimenti dietro gli oggetti del mondo. Camera, coordinate, collisioni, soglie e salvataggio restano invariati.

Il test sintetico mette un oggetto rosso al centro e colori verdi/blu ai bordi: il rosso non deve apparire in nessun pixel del riempimento, che deve restare opaco e riusare le texture. Undici casi di camera coprono cinque mappe nei due orientamenti e Biancavetta anche a390×1100. Screenshot revisionati: nessuna cupola riflessa nel margine; controlli PWA ai DPR3/4 passati durante movimento, rotazione e passaggio di porta.

## Evidenza locale

- Quattro nuovi test di dominio su copertura di tutte le quest-dono, NPC reale, scelte di Elia, prerequisiti e passaggi interni.
- Tre casi browser sui fossili: guida prima della Lega e atlas senza mutazioni; stati singoli e simbolo del dono; ricezione effettiva di tutti tre al20 e persistenza dopo reload. Ripetuti con successo anche Snorlax e ciclo del focus nel Diario.
- Tredici casi browser sui margini, inclusa la modalità senza filtro blur, più tre regressioni su camera PWA e atlante nei due orientamenti, passati.
- Build e tre casi produzione offline passati: guida fossili, guida Snorlax e prima richiesta dei26 fondali non iniziali registrati. Quest'ultimo è il test specifico `registered illustrated environments decode on their first offline request`, distinto dal test più ristretto dei13 artwork canonici.
- 771 test dominio e31 persistenza passati; validatore621 asset/27 fondali/48 mappe passato.

Log ignorati: `.tmp/edge-ambience-review.log`, `.tmp/gift-guidance-focused.log`, `.tmp/guidance-camera-regression.log`, `.tmp/gift-edges-production.log`, `.tmp/gift-edges-domain.log`, `.tmp/gift-edges-validation.log`. Pubblicazione e CI in `CI_STATUS.md`.

Il rifacimento delle48 mappe e le pose del cast restano aperti. Lo studio locale iniziale di Ada non è stato integrato: frange rosse e viste di camminata ovest rivolte a est impediscono di considerarlo un atlante direzionale corretto.
