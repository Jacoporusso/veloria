# Biancavetta — piste e geometria del labirinto

Mappa32×24,1024×768 worldpx. Tre piste: ovest x6–9, centro x13–18, est x22–26, tutte y5–16. Piazzole dei sigilli(8,3),(16,3),(24,3); console(18,3), Nives(16,1); cancello dinamico x14–18,y2; spawn(15,22), uscita x15–16,y23.

L'audit iniziale scopre una discrepanza di authoring:78 collisioni statiche hanno width/height reali32px ma dimensioni in celle solo nelle custom properties. Il runtime ignora quelle proprietà, quindi blocca83 celle col cancello chiuso, invece delle462 del progetto. Confronto con `content/drafts/mountain/gym07_ice.layout.json`: le proprietà dimensionali convertite in rettangoli coincidono con il set di progetto. Corretti i rettangoli nel Tiled runtime e nel Tiled di progetto, eliminate le proprietà ambigue. Cancello aperto:457 celle bloccate. Audit48 mappe: questo pattern era presente solo in P7.

La copia di authoring omette solo cancello, NPC e console: il loro disegno/stato resta runtime. Restano gli ostacoli sulle piste: centro x13–16,y9; est x24–26,y10. La guida SVG/PNG usa beige per pavimento asciutto con20px verso sud per i piedi, ciano per ghiaccio nelle celle effettive senza estenderlo sulle piazzole, blu-grigio per rocce/pareti.

Riferimento tecnico canvas da `exec-228ed253-576a-4246-8165-9c9361701971.png`: campione roccia(500,480,64,64), pietra(720,800,64,64), ghiaccio(680,300,64,64). Prima rocce nelle celle solide interne, poi pavimento nelle celle libere con margine piedi20px, infine ghiaccio nelle celle effettive. Questo composito è solo un riferimento, non l'asset finale. ImageGen rifinisce rocce e ostacoli, quindi elimina ripetizioni nei materiali mantenendo i confini.

Il renderer usa `terrainBase`, senza scenery-image sovrapposta; stesso asset anche per `battleBackgroundKey`. Il validatore di provenienza ora controlla entrambi i modi di collegamento realmente supportati, inclusa la corrispondenza del terreno base al suo GID dichiarato. Nessun duplicato aggiunto solo per soddisfare il validatore.
