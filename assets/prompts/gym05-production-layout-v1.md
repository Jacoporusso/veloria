# Portolume — geometria della palestra delle chiuse

32×24 celle, 1024×768 worldpx. Guida dalle collisioni Tiled con margine piedi sud20px; nella sola copia di authoring sono omesse le due collisioni condizionali delle chiuse. Queste restano interamente runtime: il fondale deve mostrare entrambi i ponti liberi. Nessuna modifica al Tiled di gioco.

Tre terrazze: x5–26,y3–5; x5–26,y9–11; x5–26,y15–18. Due canali separano le terrazze, con ponte centrale x15–16; uscita sud x14–17,y23, corridoio x14–17 da y19. Parete nord nelle righe0–2. Il margine dei piedi amplia il solo riferimento visivo a sud, senza cambiare le celle percorribili.

Console: vasca(8,17), chiusa(24,10), stabilizzatore(8,4), approccio da sud. Nerea(16,3), approccio(16,4). Ordine: rapporto maree, vasca, chiusa, stabilizzatore, sfida. Chiuse a(15–16,14) e(15–16,7), aperte dai rispettivi flag. Nessun comando, disco, cancello, indicatore o personaggio deve essere dipinto nel fondale.

Fonti verificate anche tramite audit Luna: `public/tilemaps/gym05_portolume.tmj`, metadati, quest, test `portolume-gym.test.ts`, `portolume.spec.ts`. La guida SVG/PNG è un riferimento tecnico, non l'asset finale.
