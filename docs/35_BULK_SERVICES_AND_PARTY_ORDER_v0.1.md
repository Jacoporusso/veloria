# Deposito, ordine squadra e acquisti multipli

Implementazione23/10/2026 · content0.3.118 · cache PWA139.

## Comportamento

- **Deposito**: finestra persistente con squadra e box, ritratti, livello e HP. Ogni carta seleziona/deseleziona un membro. “Sposta selezionati” applica contemporaneamente depositi e ritiri; “Deseleziona tutti” annulla la selezione. È possibile continuare con altri spostamenti senza riaprire il servizio. La selezione non cambia il salvataggio fino alla conferma. Il numero finale deve essere compreso tra uno e sei Pokémon; uno scambio completo con il box è consentito se il risultato rispetta questi limiti.
- **Squadra**: trascinare la maniglia a destra della carta con mouse o touch per inserire il membro nella posizione desiderata. Il resto della squadra mantiene il proprio ordine relativo. Freccia su/giù sulla maniglia offre lo stesso comando da tastiera e conserva il focus dopo il salvataggio. Restano disponibili i dettagli e “Metti in testa”. Il Pokédex non riordina la squadra.
- **Negozio**: quantità per articolo, prezzo unitario, possesso attuale, limite acquistabile e totale prima della conferma. Un acquisto applica costo e quantità insieme. Il negozio rimane aperto con denaro e disponibilità aggiornati. Quantità non intere, mancanti, negative, superiori al budget o alla capienza non sono acquistabili.
- Titolo, chiusura e riepilogo restano visibili; gli elenchi scorrono all’interno. Layout adattato a portrait e landscape. Escape chiude la finestra inattiva; durante il salvataggio i comandi sono bloccati e un errore apre la riprova, senza eseguire nuovamente l’acquisto o il trasferimento.

## Architettura

`transferSelectedCreatures` valida l’intera selezione e produce un nuovo salvataggio senza trasferimenti parziali. `moveCreatureToSlot` mantiene identità e record dei membri. `purchaseShopItem` riceve una quantità e applica una transazione immutabile. I servizi non scrivono nel database.

`StorageMenu` e `ShopMenu` gestiscono selezioni e presentazione; `ManagementDialog` condivide focus, chiusura, isolamento della tastiera e pulizia all’interruzione. WorldScene resta responsabile del salvataggio serializzato e della riprova. La modalità anteprima resta senza scrittura persistente.

## Evidenze

- Test di dominio: quantità, costo, capienza, selezioni invalide, trasferimenti simultanei, scambio dell’intera squadra, record incompleti e riordino in entrambe le direzioni.
- `management.spec.ts`: deposito multiplo e acquisti ripetuti su390×844 e844×390; persistenza dopo reload; mouse, sequenza touch reale Chromium e tastiera; riprova del salvataggio con un solo acquisto applicato.
- Suite pannelli, icone e distribuzione pietre: dettagli strategici, accessibilità e acquisti/evoluzioni esistenti.
- `offline.spec.ts`, “bulk storage and market”: build di produzione, rete disabilitata, deposito/ritiro consecutivi, acquisto di tre Pozioni e ricaricamento con confronto di squadra, box, inventario e denaro; nessuna richiesta fallita.
- Percorsi esistenti di Ferraluce, Vetracielo, Petalora e cattura a squadra piena: quattro prove passate con il nuovo negozio persistente. Il driver di gioco naturale usa gli stessi controlli quantità/acquisto.

La pipeline della versione117 aveva fallito soltanto l’attesa dell’elenco artwork delle evoluzioni con pietra, rimasta alle quattro specie precedenti. L’elenco del test ora include Poliwrath62; la verifica controlla la decodifica offline di tutte e cinque le immagini.

Le squadre di queste prove sono checkpoint di integrazione espliciti. Non provano il bilanciamento naturale di Nerea né costituiscono una verifica su dispositivi fisici iOS/Android.
