# Mosse, cattura ed evoluzione — design v0.1

## Decisioni confermate

Branding moderno menta/lilla e 2D illustrato. Efficacia sulla selezione delle mosse e, soprattutto, nel dettaglio. Evoluzione celebrativa: attesa, luce, silhouette e rivelazione; prima visione circa 6–7 secondi, saltabile dopo l’inizio. Cattura più breve: lancio, oscillazioni, conferma e artwork. L’ispirazione indicata dall’utente è il senso di attesa e rivelazione di un evento sportivo; non realizzare pacchetti da aprire. Animazioni ridotte rispettate. Nessuna celebrazione di successo prima dell’esito del core.

## Dettaglio mosse proposto

- Nome, icona tipo, classe fisica/speciale/supporto.
- Sezione prioritaria «Contro [avversario]»: ×0/¼/½/1/2/4 e spiegazione rispetto ai due tipi.
- Effetti secondari con bersaglio e probabilità: «10% di probabilità di ridurre di 1 stadio la Difesa speciale avversaria». Precisione ed effetto secondario distinti.
- Potenza, precisione e PP espliciti; danno previsto indicato come stima. Eccezioni per danno fisso e supporto.
- Nessun turno consumato consultando i dettagli o tornando indietro.

## Indietro mobile

Correzione funzionale 0.3.100: superficie 124×44, footer riservato, prove sul margine in portrait/landscape e stato della battaglia identico dopo ritorno. Nuova presentazione dei dettagli ancora da implementare.

## Pietre evolutive: proposta da definire

PokéAPI distingue trigger, item, held_item e condizioni aggiuntive. Usare una pietra e tenere uno strumento sono regole diverse. Importare condizioni versionate per HGSS, senza aggiungere livelli minimi assenti nella fonte. Il runtime attuale supporta evoluzioni per livello: pietre non operative e alcuni bersagli, come Flareon, non ancora giocabili.

Flusso proposto fuori lotta: Zaino → Pietre → pietra → compatibilità dei compagni → anteprima e requisiti → conferma → salvataggio atomico di consumo/evoluzione → cerimonia. Annullamento e incompatibilità non consumano strumenti. Identità, livello e mosse conservati; statistiche/HP ricalcolati con regole esplicite e nuovi apprendimenti gestiti senza tagli silenziosi. Anteprima raggiungibile anche dalla scheda del compagno. Pokédex distingue requisito ufficiale e disponibilità effettiva nel gioco.

Distribuzione proposta, non concordata: prima pietra come premio di esplorazione/missione; disponibilità successiva presso un emporio dedicato. Prezzi e punti della storia appartengono all’economia di Veloria. Prima di offrire una pietra, importare specie bersaglio, artwork e apprendimenti: nessun oggetto utilizzabile verso una forma non implementata.

Fonti: [tipi](https://pokeapi.co/docs/v2#types), [evoluzioni](https://pokeapi.co/docs/v2#evolution-chains).
