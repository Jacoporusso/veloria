# Completamento delle viste idle delle48 identità

## Contenuto0.4.44

Enea, l'accoglienza della Lega, Ivo di Petalora, Maia e Tobia ricevono quattro immagini indipendenti ciascuno. Il catalogo e il manifest idle coprono ora48 identità e192 viste; le apparizioni restano51. Questo completa la migrazione delle idle, non la produzione delle47 camminate restanti, le mappe, il budget su dispositivo o la campagna naturale completa.

Le fonti sono `veloria-cast-opening-and-champion-v1.png` frame3 per Enea e `veloria-league-and-cammino-cast-v1.png` frame0/1/2/3 per accoglienza, Ivo, Maia e Tobia. Ivo di Petalora resta distinto da Ivo di Ferraluce. Copie PNG immutate dagli originali del generatore, WebP lossless con identico RGBA decodificato. Prompt completi, riferimenti, tentativi conservati, output ID, hash, dimensioni, origine e calibrazioni in `assets/prompts/final-cast-directional-idles-v1.json` e `assets/npc-idle-views-v1.json`.

Le tavole opache e gli atlanti originali sono stati rivisti. Maia conserva capelli ricci ramati e abbigliamento sportivo blu/giallo; Tobia giacca navy e nodo della fascia sul lato anatomico destro; Ivo cappotto verde, barba argento e pantaloni ruggine; l'accoglienza completo prugna e foulard. La prima vista est di Enea troppo frontale è scartata; quella selezionata è un vero profilo verso destra. I tentativi con accessorio nei capelli non referenziato sono conservati ma esclusi. L'input ritagliato usato per la correzione è esattamente la cella3 a627,627 di627×627, senza ricampionamento, con hash nella provenienza.

Tutte le20 sorgenti hanno margini ad alpha>=128, corpi calibrati a56 pixel mondo e piedi ancorati senza flip. Verificati byte identici agli originali/candidate, hash e RGBA di ogni coppia. L'audit rispetto al commit precedente preserva geometria/proprietà di gioco delle quattro mappe interessate, metadati non grafici di sei mappe e gli altri43 profili. I WebP del lotto sommano15.099.920 byte.

## Collegamenti e interazioni

Mappe: `league_champion`, `league_forecourt`, `petalora`, `r16_cammino_equilibrio`. Maia e Tobia condividono la stessa mappa: l'integrazione accumula le due serie di risorse e i due oggetti Tiled prima di scriverli. Non cambia collisioni, percorsi, coordinate, allenatori, mosse, ricompense o missioni.

Enea usa la vera sequenza di Lega: fixture con quattro vittorie precedenti, accesso e otto medaglie; test apre SFIDA e chiude NON ORA senza avviare una lotta. L'accoglienza usa il dialogo NPC, distinto dal portale di accesso; Ivo il dialogo ordinario. Maia/Tobia sono preparati al dialogo dopo la vittoria per provare le pose senza consumare risorse. Queste fixture non attestano una vittoria naturale della campagna.

Audit globale a zero usi Tiled per entrambi gli atlanti precedenti, ritirati soltanto dai renderAssets delle quattro mappe e dei pre-caricamenti residui R01/R03. Fonti, catalogo globale e precache storico conservati; nessun risparmio offline attribuito a questa sola rimozione. Ricevuta in `art/retired-final-cast-atlases-0.4.44.json`.

## Verifiche

- Cinque casi Chrome mirati passati in1,1min: quattro approcci, qualità ridotta/completa, ancoraggio e ordine, scala uniforme, superfici entro512, menu/dialoghi reali e stato conservato, screenshot portrait/landscape. Rivisti i cinque fronti alla scala di gioco.
- Cinque casi produzione offline passati in57,3s: primo decode, dimensioni, trasparenza, direzioni, interazioni e ricaricamento.
- 840 test dominio/persistenza e cinque test budget passati;154 Python passati. Validatore1082 risorse,48 fondali,48 mappe,62 missioni,31 allenatori,12 negozi passato.
- TypeScript e build produzione offline passati. Discovery443 browser e88 offline assegnati una volta: un viaggio e87 risorse in shard22+22+22+21.
- Nuovo contratto di regressione: tutte48 le identità devono avere un solo manifest e quattro chiavi direzionali distinte. Il primo giro dominio aveva rilevato un'aspettativa statica obsoleta per Enea; aggiornata al contratto direzionale, poi suite completa passata. Log iniziale conservato in `.tmp/final-cast-domain.log` e finale in `.tmp/final-cast-domain-final.log`.

Ricontrollo globale sulle51 presenze passato nei due orientamenti: due casi Chrome in2,3min, `.tmp/final-cast-global.log`. Totale sette casi Chrome distinti e cinque produzione offline. Rilascio/cachev208 da attestare separatamente. Report budget aggiornato in `art/art-budget-0.4.44.json`:175.219.260 byte per le192 pose idle;342.431.448 byte del solo sottoinsieme sorgente statico del precache. Stesse esclusioni e limiti del documento122: non sono misure complete del trasferimento, cache o memoria del telefono.
