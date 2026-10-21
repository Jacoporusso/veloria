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

Correzione funzionale 0.3.100: superficie 124×44, footer riservato, prove sul margine in portrait/landscape e stato della battaglia identico dopo ritorno. Dettagli aggiornati con paginazione misurata, fattori per tipo avversario, precisione base/effettiva, PP, stima danno ed effetti completi.

## Pietre evolutive: implementazione approvata

PokéAPI distingue trigger, item, held_item e condizioni aggiuntive. Usare una pietra e tenere uno strumento sono regole diverse. Importare condizioni versionate per HGSS, senza aggiungere livelli minimi assenti nella fonte. Il runtime supporta Pietrafocaia, Pietraidrica e Pietratuono per Eevee, e Pietratuono per Pikachu. Raichu, Vaporeon, Jolteon e Flareon hanno dati e artwork locali. Altri metodi e condizioni restano consultabili come riferimento, senza essere offerti come utilizzabili.

Flusso implementato fuori lotta: Zaino → Pietre → pietra → compatibilità dei compagni → anteprima e requisiti → conferma → salvataggio atomico di consumo/evoluzione → cerimonia. Annullamento e incompatibilità non consumano strumenti. Identità, livello e mosse conservati; statistiche/HP ricalcolati con regole esplicite e nuovi apprendimenti gestiti senza tagli silenziosi. Anteprima raggiungibile anche dalla scheda del compagno. Pokédex distingue requisito ufficiale e disponibilità effettiva nel gioco.

Distribuzione approvata: prima Pietrafocaia dopo la ricerca della serra di Radicelmo, bottega dedicata dopo la Medaglia Corolla (documento30). Prezzi e punti della storia appartengono all’economia di Veloria. Prima di offrire una pietra, importare specie bersaglio, artwork e apprendimenti: nessun oggetto utilizzabile verso una forma non implementata.

Fonti: [tipi](https://pokeapi.co/docs/v2#types), [evoluzioni](https://pokeapi.co/docs/v2#evolution-chains).

## Persistenza e presentazione

Le evoluzioni per livello si applicano alla vittoria, dopo la conclusione della lotta; nessun cambio di specie durante lo scontro. Consumo della pietra, nuova creatura e ricevuta della cerimonia vengono salvati insieme. La cerimonia parte dopo il salvataggio; un errore offre un tentativo esplicito e blocca la prosecuzione. Ricaricare ripresenta le ricevute pendenti senza ripetere il consumo. La ricevuta viene rimossa dopo la chiusura e un nuovo salvataggio. Le evoluzioni mantengono livello, esperienza e mosse/PP; le mosse di livello1 della forma finale non vengono assegnate automaticamente.

Cerimonia evoluzione6,2s con salto dopo1s; cattura2,8s con rivelazione anticipabile e dettagli. Movimento ridotto rispettato. Nessun suono aggiuntivo introdotto in questa iterazione.

## Animazioni 0.3.102

`BattleEffects` separa la presentazione delle mosse dalle regole. Fisiche: preparazione/affondo e scie, tre graffi per mosse con artigli. Speciali: fulmini, getti luminosi, foglie, cristalli e anelli secondo tipo; colori funzionali del tipo. Un tentativo di mossa non genera un impatto di danno: colpo, immunità, schivata, cura e cambi di stato/statistiche seguono i rispettivi eventi risolti. La modalità ridotta mantiene indicatori fermi e testo.

Effetti vettoriali nel container della UI: ridimensionamento, salto messaggi e chiusura eliminano anche i tween dei figli. Il lancio della sfera segue un arco. Le cerimonie mantengono i tempi e il salto approvati, aggiungendo orbite, raggi morbidi e particelle con una rivelazione progressiva. Nessun esito o premio dipende dall'animazione.


## Layout approvato e integrato — 0.3.105

Riferimento approvato: `battle-layout-prototype.html`. La barra sopra le mosse è eliminata. Il selettore mostra nome, icona del tipo, categoria, potenza/danno fisso, precisione attuale, PP e risultato del confronto col bersaglio; per il supporto indica il cambiamento o lo stato, senza promettere effetti impediti. La previsione numerica del danno è riservata ai dettagli ⓘ di ciascuna mossa, con spiegazioni complete paginate e pulsante Usa. L’ispezione rimane disponibile a zero PP; l’utilizzo resta disabilitato.

La barra inferiore contiene Lotta, Borsa, Cattura, Squadra e Fuga. La navigazione non esegue turni; Fuga apre la conferma. Tab non utilizzabili restano visibili e disabilitate, comprese tutte quelle durante la risoluzione o il cambio obbligatorio. Tastiera: Invio apre Lotta dal menu, frecce scelgono mosse o azioni, I ispeziona, B/Esc torna. Il tocco su una carta usa direttamente la mossa.

Responsabilità separate: `battle-command-layout` calcola campo/pannelli; `move-card` deriva i dati esclusivamente dal catalogo e dalle regole; `BattleMoveCard` e `BattleCommandNavigation` disegnano e notificano i comandi; `BattleScene` conserva flusso e input. Il motore non cambia. Layout verificati a320×568,390×844,568×320,844×390; densità dei testi preservata anche nel renderer Canvas.
