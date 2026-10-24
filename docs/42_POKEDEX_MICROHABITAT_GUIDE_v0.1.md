# Indicazioni dei microhabitat nel Pokédex

Content0.3.125 · cache PWA v146 ·24 ottobre2026.

Il dettaglio Pokémon in Squadra e Pokédex ora indica il posto nella zona: sponda orientale, muschio occidentale, binari, rive, postazione di pesca. Per una specie presente in più microhabitat della stessa mappa, ogni indicazione conserva i propri livelli e orari. La carta resta raggruppata per mappa/metodo, evitando una carta identica per ciascuna tabella.

Le32 tabelle runtime hanno `habitatLabel`, testo per il giocatore. Non si espongono gli ID tecnici. Il validatore dei contenuti richiede un’etichetta leggibile; il selettore puro controlla la forma del campo quando presente. Il campo descrittivo non cambia sorteggio, pesi, incontri, progressione o salvataggi.

`findSpeciesHabitats` mantiene i riepiloghi per mappa/metodo e raccoglie le aree dai soli collegamenti reali; conserva per ciascuna area la sua fascia oraria e i livelli. Deduplica gli ID dichiarati più volte. Il dominio non importa dati grafici o mappe Tiled; i dettagli arrivano dalle tabelle già caricate, anche offline.

Esempio Pikachu: Costa fra le turbine nordovest, Parco della Monorotaia, e due aree nel Viadotto — Giardino dei Binari a ovest e Sponde a est. Esempio Wooper nel Condotto: muschio occidentale. Non viene suggerito che una specie sia presente in tutte le macchie della mappa.

Verifiche:552 test dominio/persistenza e109 test Python passati, validatore e build passati. Nuovo test puro mantiene separati un habitat mattutino10–12 e uno notturno20–22, verificando anche la deduplica. Due prove browser reali con il checkpoint guadagnato dopo Iris, in390×844 e844×390, controllano etichette, livelli/orari e risorse invariate; passate in5,7s. Screenshot portrait controllato: testo leggibile e aree distinte nella stessa carta.

PWA: prova con rete disabilitata, nome del microhabitat di Wooper, deposito multiplo, acquisto e reload passata in6,6s (20,1s inclusa build). Questi risultati non attestano prove fisiche iOS/Android né completamento della campagna naturale.
