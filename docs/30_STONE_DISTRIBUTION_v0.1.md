# Pietre evolutive: distribuzione iniziale

## Ricompensa di esplorazione

La ricerca facoltativa della serra di Radicelmo rimane invariata: seme delle Terrazze → Leda → acqua → luce → vaso → rapporto a Leda. Dopo `q_radicelmo_greenhouse_complete`, raccogliere la Pietrafocaia del vivaio completa la nuova missione `veloria/q_radicelmo_evolution_stone` e concede una sola `fire-stone`.

- Mappa `veloria/radicelmo`, coordinate tile a base zero, tile 32 px.
- Pietra: **(26,14)**; interagire da **(26,15)** guardando a nord.
- Leda: **(25,11)**; la pietra è un tile a est e tre a sud, sopra il vaso **(25,16)**.
- Evento `pickup/radicelmo/greenhouse_fire_stone`; ricevuta `q_radicelmo_fire_stone_found`, usata anche come `collectedFlag`.
- Prima del completamento della ricerca, l'interazione spiega il requisito e non concede oggetti. Il servizio quest esistente impedisce premi ripetuti.
- Il dialogo di Leda indica posizione, comando di raccolta e uso dallo zaino.

## Bottega dedicata

Il banco **Bottega delle Pietre**, davanti alla serra e a est di Leda, è a **(28,11)**. Interagire da **(28,12)** guardando a nord. Il catalogo `veloria/radicelmo_stones` contiene Pietrafocaia, Pietraidrica e Pietratuono; ciascuna costa 3000 monete secondo l'economia di Veloria, senza attribuire questo prezzo a PokéAPI.

Il banco usa `serviceRequiredFlag: badge_corolla_awarded` e un messaggio esplicito: prima superare la prova di Selene a Petalora. Nessuna modifica all'erboristeria o ai suoi rifornimenti.

## Accessibilità geometrica e verifica

Entrambi gli oggetti sono fuori dai rettangoli degli edifici e non sostituiscono uscite o stazioni della ricerca. Una visita BFS sulle celle della mappa, considerando collisioni e oggetti solidi, conferma la raggiungibilità dall'ingresso occidentale **(1,14)** alle celle di approccio della pietra, del banco e di Leda. Questa verifica geometrica non sostituisce la prova browser delle interazioni, dei premi e della persistenza.

Solo i quattro rami con bersagli, artwork e apprendimenti importati possono essere eseguiti. La cerimonia presenta un'evoluzione già salvata e non concede né consuma strumenti.

## Verifica browser

Passate raccolta bloccata prima della ricerca, premio una volta con reload, bottega bloccata prima di Corolla e acquisto delle tre pietre. Percorso reale Zaino → anteprima → annullamento → conferma Flareon, salvataggio con consumo e ricevuta prima della cerimonia e ripresa dopo reload senza secondo costo. Il banco ha una collisione propria per mantenere la posizione di interazione durante acquisti ripetuti.
