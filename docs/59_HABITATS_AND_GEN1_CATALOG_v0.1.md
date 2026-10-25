# Habitat, squadra KO e completamento del catalogo Gen I

25 ottobre 2026. Feedback dell’utente sulla versione pubblicata: assenza di incontri in Via delle Cascate e vicino alla Lega, simboli diversi dal prototipo e specie Gen I mancanti. L’utente ha confermato che tutta la squadra era KO.

## Correzione degli habitat

Il controllo incontri richiede almeno un Pokémon con PS positivi. Con tutta la squadra KO usciva senza spiegazione. Ora mostra «La squadra è tutta KO: cura almeno un Pokémon al Centro Pokémon per cercare nuovi incontri», con limite di frequenza per evitare messaggi a ogni passo. Non consuma RNG quando non può avviare una lotta. Le probabilità degli incontri rimangono quelle delle tabelle.

Le tabelle Tiled pubblicate di Via delle Cascate, Cammino dell’Equilibrio e Piazzale della Lega sono state confrontate con quelle locali: identiche. Sei prove di gioco normale, con salvataggi preparati e seed deterministici, verificano un primo passo senza incontro e un secondo passo che avvia una vera lotta nelle zone R01, Bosco, R09, R13, R11 e R16. Un’altra prova verifica squadra KO, messaggio, RNG invariato e ripresa dell’incontro con un salvataggio curato. Questa seconda fixture non attesta il percorso del servizio di cura.

La forma del simbolo è ora lo stesso path SVG del prototipo approvato. Su richiesta esplicita dell’utente viene mostrata **una sola sagoma per zona**, senza badge e senza ripetizione per cella. L’ancoraggio sceglie una cella percorribile vicina al centro: prima il marker di «Erba alta ovest» in R01 cadeva nella collisione dell’acqua. Zone con lo stesso nome rimangono distinte: R16 ha tre «Habitat del Cammino» e riceve tre sagome. La guida spiega movimento, probabilità e necessità di un compagno in forze.

## Catalogo Gen I ancora incompleto

Il runtime contiene 83 specie, di cui 60 Gen I. Mancano 91 dei 151 ID; fra questi Magikarp, Gyarados e Snorlax. [Audit e procedura ufficiale](art/gen1-catalog-gap-audit.md). Questo è un limite reale del catalogo, distinto dal problema della squadra KO.

Il completamento richiede dati e nomi italiani ufficiali, learnset HGSS, meccaniche delle mosse supportate, crescita, evoluzioni, artwork locali e distribuzione negli habitat appropriati. Le risposte PokéAPI vanno conservate in cache con URL e SHA-256. Le specie non diventano disponibili nel gioco soltanto perché la risposta API è stata scaricata. Nessuna mossa va inventata o assegnata come fallback generico per aggirare una regola mancante.

Il catalogo completo della prima generazione resta un lavoro aperto, insieme al rifacimento di tutte le mappe e del cast. Il lotto grafico parallelo introduce R01/R03/Radicelmo v3 e le quattro identità del Consiglio; non modifica squadre, missioni, condizioni di passaggio o salvataggi del giocatore.
