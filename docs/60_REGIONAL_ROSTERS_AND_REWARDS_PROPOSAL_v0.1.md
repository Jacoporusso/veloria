# Proposta — Veloria Gen I, disponibilità e ricompense Pokémon

Vincolo espresso dall’utente il 25/10/2026: prima lega Veloria dedicata alla prima generazione; città, regioni e leghe successive introdurranno le generazioni successive. Questa proposta raccoglie la discussione richiesta prima di cambiare la distribuzione. Non attesta implementazione del roster o disponibilità delle specie mancanti.

Preparata una [matrice proposta delle 151 specie](art/veloria-gen1-availability-proposal.md), distinguendo disponibilità diretta attuale, evoluzioni da verificare e metodi proposti. Contiene anche le 23 specie Gen II da riservare alle future regioni. Il vincolo Gen I non richiede di rimuovere Pikachu dalla scelta iniziale attuale.

## Veloria

Pokédex regionale: ID 1–151. Ogni specie deve avere un percorso reale d’ottenimento documentato: habitat, pesca, regalo, incontro speciale, evoluzione o scambio con NPC. La scheda di disponibilità deve includere fase narrativa, mappa/metodo, livelli, prerequisiti e possibilità di riprovare. Una voce nel catalogo o un artwork non costituiscono disponibilità giocabile.

Il filtro di regione deve coprire incontri, allenatori/palestre/Consiglio/Campione, regali ed evoluzioni. Le evoluzioni di specie Gen I verso generazioni successive si sbloccano nelle relative espansioni. Parametri, learnset ed evoluzioni rimangono basati su fonti ufficiali; ambientazione e distribuzione sono scelte di design di Veloria. La versione delle regole di combattimento è una scelta separata dalla generazione delle specie.

## Metodi proposti

| Metodo | Funzione | Esempio da definire |
|---|---|---|
| Habitat nell’erba | Esplorazione e identità dei biomi | Piccoli gruppi coerenti, comuni e rari distinguibili fra zone |
| Pesca/acqua | Rendere utile l’equipaggiamento e variare la ricerca | Magikarp; Gyarados tramite evoluzione e successivi incontri acquatici rari |
| Missioni con regalo | Legare un nuovo compagno a un personaggio e a un momento memorabile | Bulbasaur al giardino di Radicelmo; Squirtle in una missione d’acqua; Charmander presso Ferraluce |
| Incontri visibili | Un evento riconoscibile invece di ricerca casuale ripetuta | Snorlax in un luogo dedicato, con possibilità di riprovare |
| Evoluzioni/scambi NPC | Completare le famiglie nel gioco in solitaria | Famiglie evolutive e scambi necessari per Alakazam/Machamp/Golem/Gengar |
| Missioni speciali/post-lega | Obiettivi finali e leggendari | Percorsi dedicati, con indizi e nessuna perdita definitiva per un errore |

Le missioni regalo sono opzionali e sempre recuperabili; suggerimento: pochi passi significativi e ricompensa mostrata prima. Nessun blocco della storia per chi non le svolge. Il compagno viene presentato con nome, tipo, livello e mosse; una squadra piena lo invia al deposito con conferma leggibile. Ricompensa atomica e ricevuta persistente impediscono duplicazioni dopo reload. Se la specie è già posseduta, va definita una ricompensa alternativa coerente.

I tre starter classici, oltre alla scelta iniziale, devono essere ottenibili nella stessa campagna: proposta principale con missioni regalo a tappe, eventuali habitat rari dopo il relativo sblocco. Gli animali evoluti non devono tutti occupare una voce nelle zone d’erba: l’evoluzione è già un percorso di ottenimento.

## Regioni successive

Separare dati di specie e regole dal roster di ciascuna regione: `regionalDex`, disponibilità incontri/regali, squadre, regole evolutive, medaglie e progressione narrativa. Proposta: conservare identità dell’allenatore e collezione; un Pokédex regionale distinto descrive ciascuna nuova campagna. Il bilanciamento delle future leghe (postgame oppure squadra locale) rimane una decisione da discutere.

## Ordine di lavoro proposto

1. Correggere il feedback squadra KO e il simbolo habitat unico approvato.
2. Preparare dati ufficiali completi della Gen I e audit di copertura di tutte le 151 specie.
3. Definire insieme la matrice disponibilità: riequilibrare anche le specie già importate ma non ottenibili.
4. Implementare le mosse/evoluzioni necessarie e inserire specie per famiglie complete, con artwork e verifiche offline.
5. Convertire il roster di Veloria a Gen I in tutti i canali e verificare la campagna; trattare esplicitamente i Pokémon Gen II già presenti nei salvataggi di test.
6. Aggiungere missioni regalo e incontri speciali con presentazione dedicata.

Le nuove distribuzioni e la conversione delle squadre non sono ancora applicate: l’utente ha chiesto di ragionare insieme sul piano. Restano aperti anche tutti gli obblighi del rifacimento mondo/cast nel documento58.
