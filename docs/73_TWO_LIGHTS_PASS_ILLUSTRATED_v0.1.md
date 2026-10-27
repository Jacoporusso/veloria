# Passo delle Due Luci illustrato

## Fondale e geometria

R15 collega l’uscita innevata delle Grotte del Cristallo a un giardino d’altura più caldo verso Concordia. Il nuovo fondale conserva ponte occidentale, raccordo centrale, belvedere settentrionale, terrazza meridionale e unico habitat. Nilo, Moltres e i due strumenti restano oggetti del runtime.

[Brief Tiled](../assets/prompts/r15-production-layout-v1.md), [prompt e provenienza](../assets/prompts/r15_passo_due_luci-illustrated-v3.md). PNG raw1448×1086 e WebP lossless con RGB decodificato identico. Un solo `scenery-image` sostituisce `terrainBase`; coordinate, collisioni, probabilità incontri, missioni e uscite restano originali. Le letture usano il misuratore e il pittogramma condivisi, senza nuove immagini di strumenti.

Il primo candidato aveva12 campioni cromatici sospetti sotto i piedi; la correzione locale ne conservava14 e non viene selezionata. Un riferimento canvas con pavimento sulle celle esatte e margine20px guida la rifinitura ImageGen. Il candidato selezionato ha0 campioni blu fra le celle considerate dal controllo: è un indizio di allineamento, non un criterio automatico di accettazione. Il vero contatto viene verificato nelle schermate del gioco.

## Riferimenti di authoring riproducibili

`tools/render_map_floor_reference.mjs` crea un riferimento geometrico, non un asset finale. Accetta Tiled, candidato, output, rettangolo sorgente del materiale pavimento e opzionalmente dell’habitat:

```powershell
node tools/render_map_floor_reference.mjs public/tilemaps/r15_passo_due_luci.tmj path/to/candidate.png path/to/reference.png 790,440,64,64 950,180,32,32
```

Per questa produzione il candidato è `exec-41506d8e-0e60-4843-bc1a-b6fe2beb29c1.png`. Il riferimento risultante è registrato in `assets/prompts/r15-exact-floor-reference.png`; il prompt di rifinitura conserva la sagoma del pavimento, rende organici i raccordi e elimina le giunzioni tecniche. Il codice non modifica gli input, rifiuta sovrascritture dirette e collisioni condizionali non associate ad attori, non disegna NPC o Pokémon. Il risultato finale resta un raw ImageGen, non il composito tecnico.

## Verifiche e limiti

La nuova regressione attraversa R15 da un solo checkpoint: margine sud del ponte, entrambe le letture con eventi reali, avvicinamento a Nilo, radura prima della Lega, bordo habitat, margine est, Concordia e ritorno fino a D05. Percorso passato49,2s; screenshot portrait/landscape. Nilo non viene sfidato in questo test: la sua battaglia conserva il caso dedicato in `concordia.spec.ts`.

Due casi separati verificano che Moltres e il suo collider siano presenti dopo Lega/epilogo e assenti dopo cattura, con radura nuovamente percorribile. Il primo caso apre INCONTRA e sceglie MI PREPARO senza alterare RNG o catturare. Questi checkpoint verificano gli stati visivi e il menu, non la vittoria nella Lega o una cattura reale. La prima esecuzione si fermava sulla cerimonia del Campione perché mancava il flag dell’epilogo nel checkpoint; corretta la preparazione, entrambi i casi passano18,5s/3,5s. Due casi camera nei due orientamenti passati (`.tmp/r15-final-states.log`). Nessuna regola del finale è stata cambiata.

783 test dominio più31 persistenza passati; validatore640 asset/30 fondali/48 mappe passato. Build finale passata. Tre prove produzione offline passate: prima visita R15 con Moltres e lettura della rete, regressione relè/cristallo/ferrovia, prima decodifica dei29 fondali non iniziali (`.tmp/r15-offline.log`). Pubblicazione da attestare dopo il push. Cache v174, contenuti0.4.11. L’inventario di30 fondali non completa la revisione delle48 mappe o le direzioni/camminate del cast.

## Correzione del checkpoint Vetracielo

La CI di0.4.10 ha24 job passati e un fallimento: il test di Oren aspetta un banner di vittoria mentre la schermata mostra Ivysaur20 a0/54PS, paralizzato, e Sandshrew14 a2/38PS. È una sconfitta effettiva. Il checkpoint di integrazione usa ora Venusaur40 con Frustata verificata nel learnset ufficiale locale e controlla vittoria persistita/PS residui prima del banner; avversari, motore, timeout, percorso e ricompensa240 non cambiano. La prova completa passa circa1,1min (`.tmp/r15-vetracielo.log`). Non è una prova del bilanciamento naturale della campagna.
