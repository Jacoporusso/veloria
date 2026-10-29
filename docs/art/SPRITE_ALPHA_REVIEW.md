# Review della trasparenza degli sprite

Un'immagine RGBA può conservare colori RGB nei pixel con alpha zero. Alcune anteprime mostrano questi colori: un alone apparente nella vista del file non dimostra che lo sprite abbia uno sfondo visibile nel gioco. Anche il solo minimo alpha pari a zero non prova che l'intero fondale sia trasparente.

Prima di rigenerare una candidata, confrontare il composito su fondo opaco e il canale alpha. Il comando seguente produce esclusivamente una tavola QA e un JSON con hash, dimensioni, estremi alpha, limiti e angoli delle sorgenti. Non riscrive i file di input; il ridimensionamento riguarda solo l'anteprima.

```powershell
python tools/sprite_review_board.py percorso/south.png percorso/north.png percorso/west.png percorso/east.png --output .tmp/review/personaggio.png
```

Usare il percorso dell'interprete Python configurato se il comando `python` non è disponibile. Conservare le candidate originali e i riferimenti di generazione. L'hash della sorgente nella tavola deve corrispondere a quello dell'immagine selezionata; un'immagine modificata richiede una nuova review.

La tavola serve alla review, non assegna automaticamente un'approvazione. Controllare identità, accessori, lati anatomici, piedi completi, bordo del corpo e spazi tra arti e busto. West mostra il lato anatomico sinistro vicino; East quello destro. Completare poi il controllo nello scenario effettivo alla scala di gioco e nei due orientamenti.

Nella review del 29 ottobre 2026, le quattro originali di Teo e Celia risultano pulite sul composito opaco: gli aloni delle anteprime erano RGB nascosto sotto alpha zero. Gli edit di sfondo avviati prima di questa verifica sono stati scartati e non sostituiscono le originali. Ruben West v2 aveva invece un fondale grigio realmente visibile sul composito: la correzione generata West v3 è stata verificata separatamente. Nessuna soglia o pulizia distruttiva è stata applicata agli sprite per ottenere questi risultati.
