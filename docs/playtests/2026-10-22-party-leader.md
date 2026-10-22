# Scelta del primo Pokémon — content0.3.117

Dal menu Squadra, aprire un compagno e premere **Metti in testa**. La lista identifica il primo con **IN TESTA**. L’ordine viene salvato; il motore avvia l’incontro con il primo membro con HP maggiori di zero. Il Pokédex resta un registro consultabile e non permette di riordinare la squadra. La modalità anteprima non offre il comando.

Il servizio immutabile `party-order.ts` conserva tutti i record delle creature e gli altri campi del salvataggio. Il controller WorldScene salva attraverso la coda esistente e usa il dialogo di riprova in caso di errore; la UI non scrive direttamente nel database.

Verifiche: quattro test di servizio per ordine, immutabilità, membro esausto, identità già in testa e ID assente. Due prove browser con il backup guadagnato a Portolume aprono il menu reale, spostano il terzo compagno e ricaricano la partita: ordine, creature, zaino, box, RNG, medaglie e denaro sono confrontati con il checkpoint. Formati390×844 e844×390. Il backup originale non viene modificato. Sono prove di gestione squadra, non della difficoltà di Nerea o di cattura/allenamento naturale.
