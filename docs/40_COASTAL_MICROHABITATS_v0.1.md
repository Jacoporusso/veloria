# Habitat costieri, dune e delta

Content0.3.123 · cache PWA v144 ·23 ottobre2026.

## Esperienza e distribuzione

La revisione prosegue l’audit38 e i microhabitat industriali39. Nessuna nuova specie o mossa viene creata: si usano le specie già presenti con dati/artwork importati. Assegnazioni alle aree e pesi restano scelte prototipali di Veloria, non dati ufficiali PokéAPI.

| Zona e metodo | Specie, unione degli orari |
|---|---|
| Costa, foglie nordovest fra le turbine | Pidgeotto, Flaaffy, Pikachu; Noctowl al posto di Pidgeotto di notte |
| Costa, foglie nordest presso la riva | Krabby, Tentacool, Chinchou |
| Costa, pesca dalla riva | Tentacool35%, Horsea30%, Chinchou25%, Krabby10% |
| Dune, habitat asciutto ovest | Furret, Krabby, Geodude; Noctowl al posto di Furret di notte |
| Dune, canneti est | Wooper, Poliwag, Slowpoke, Gloom |
| Dune, pesca nella laguna | Krabby35%, Horsea30%, Chinchou25%, Lanturn10% |
| Delta, pesca | Poliwag40%, Wooper35%, Slowpoke20%, Poliwhirl5% |

La Costa passa da4 a8 specie complessive, le Dune da7 a11; il Delta mantiene4 specie con un gruppo differente dalla pesca marina. Le percentuali da pesca sono condizionate all’abboccata. Tassi di incontro per passo e abboccata non cambiano.

Livelli: Costa20–23, Dune24–27, Delta25–28. Lanturn in laguna è soltanto27. Chinchou resta disponibile nella riva nordest della Costa a tutte le ore (45% mattino,25% giorno,55% notte), e pescando25%. Il precedente checkpoint guadagnato resta valido; non si alterano squadra, inventario, RNG o catture precedenti.

I trigger esistenti vengono collegati a nuove tabelle dichiarate nei metadata. Non si spostano foliage, collisioni, uscite, servizi o missioni. Il Pokédex deriva le zone dai metadata e mostra automaticamente i nuovi collegamenti. Rimane aperta la revisione dei sentieri iniziali e la riconoscibilità visiva più specifica dei microhabitat.

## Verifica

551 test dominio/persistenza passati. Un nuovo controllo attraversa tutte le tabelle selvatiche e crea ogni specie ai livelli minimo/massimo, verificando che le mosse appartengano ai learnset importati e che i PP siano coerenti. Nessun fallback di mosse inventato per riempire il roster. Validatore e build passati.

Browser: Pokédex in390×844 e844×390 con risorse invariate; pesca della Costa con canna non consumata; andata/ritorno Portolume–Dune–Delta con gate Marea e reload. Le due viste Pokédex e la prima pesca passate in30,5s; pesca riallineata alla tabella sorgente e percorso Dune passati in52,5s. Non equivalgono al bilanciamento naturale della quinta/sesta palestra o a verifica su telefoni fisici.
