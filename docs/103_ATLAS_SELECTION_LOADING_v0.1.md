# Atlante: ultima selezione durante il caricamento

Il diario apre il prossimo oggetto fisico della missione sulla pianta locale. Doni, pesca e incontri hanno pin sulla regione; la categoria selezionata nasconde le altre categorie, i nodi e i collegamenti. Il singolo punto apre una pianta con un solo indicatore. Il fondale scuro conserva il contesto e aumenta il contrasto. Queste funzionalità erano già presenti e sono state ricontrollate.

Corretto un conflitto asincrono: se il giocatore cambia filtro mentre il catalogo dei punti viene caricato, la destinazione iniziale del diario non deve sovrascrivere la nuova scelta. La generazione della selezione invalida sia il focus iniziale sia le richieste precedenti ancora in attesa. Anche il ritorno alla posizione corrente invalida una destinazione pendente.

Tre casi Chrome passati: categorie esclusive e punto pesca con screenshot portrait/landscape; prossimo misuratore della ricerca con coordinate esatte; caricamento del catalogo deliberatamente sospeso mentre si seleziona Pesca, poi ripreso senza ripristinare la missione precedente. TypeScript senza errori. Nessun cambiamento a posizione, squadra, inventario, flag o RNG dai normali comandi dell'atlante.
