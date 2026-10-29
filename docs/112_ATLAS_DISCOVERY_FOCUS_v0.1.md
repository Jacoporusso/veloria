# Mappa: selezione e leggibilità — 0.4.36

I filtri Doni, Pesca e Incontri ora inquadrano tutta la regione, anziché conservare un ritaglio che poteva lasciare i simboli fuori schermo. Le altre categorie, i nodi e i collegamenti restano nascosti durante il filtro. Il pannello elenca i punti della categoria: ogni voce apre la pianta del luogo con il solo punto selezionato. Il diario conserva il collegamento al prossimo oggetto fisico della missione.

Il fondo illustrato è scurito maggiormente durante il filtro e sulla pianta locale. Il bersaglio ha un alone chiaro. I raggi dei simboli sono dichiarati anche come attributi SVG, conservando bersagli touch da 46 pixel. Nessuna modifica a posizione del giocatore, missioni, incontri o salvataggi.

Verifica locale: cinque casi Chrome passati in `atlas-exact-targets.spec.ts` e `region-map.spec.ts`, inclusi diario, filtraggio durante caricamento, errore parziale del catalogo, ritorno alla regione, conservazione del salvataggio e portrait/landscape. Aggiunte verifiche sulle dimensioni della regione filtrata e sull'elenco selezionabile. Screenshot portrait del punto pesca rivisto. Non equivale a una prova su dispositivo fisico.

Le modifiche ai test grafici del cast e alla preparazione naturale della squadra restano separate da questo rilascio.
