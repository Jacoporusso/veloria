# Incontri speciali e pesca leggibili

Feedback del26 ottobre: le sfide speciali erano elencate senza indicazioni utili e i punti pesca funzionavano ma non venivano disegnati dal renderer.

## Incontri speciali

Il diario mostra luogo, condizione, percorso da un centro vicino e stato «Da sbloccare», «Da raggiungere» o «Catturato». Il pulsante «Vedi sulla mappa» apre l'atlante sul luogo selezionato senza spostare il giocatore. I dettagli dell'atlante usano lo stesso catalogo e la stessa funzione pura del diario; le icone delle aree indicano soltanto gli incontri sbloccati e non catturati.

Snorlax: rapporto di Acquariva, poi accesso alla Valle del Vento con la Medaglia Riflesso. Gli altri cinque incontri richiedono la vittoria alla Lega. La nuova funzione di presentazione tiene conto anche dei requisiti del percorso; non altera `specialEncounterAvailability`, i flag di comparsa o gli sblocchi delle lotte. Le rotte brevi sono controllate rispetto ai collegamenti delle MapDefinition.

## Pesca

Un unico indicatore condiviso 🎣 PESCA viene disegnato per ciascuna postazione Tiled, senza collisione o cambiamenti agli incontri. L'atlante segnala Costa delle Turbine, Dune Salmastre e Delta degli Specchi usando il metodo delle tabelle reali. Se manca la Canna da pesca, il menu e l'atlante rimandano alla Capitana Marina a Portolume. I pulsanti del mondo usano «Pesca» e «Incontra» invece del generico «Esamina».

## Valle del Vento

Il vecchio ramo che scende alla radura di Snorlax era logicamente raggiungibile ma poco leggibile nel dipinto. Il fondale viene rifatto in2D illustrato con percorso continuo, partendo dalla geometria Tiled. I due strumenti meteo sono ora prop vettoriali condivisi, ancorati alle interazioni reali; vengono rimossi dal fondale per evitare duplicazioni o disallineamenti. Collisioni, uscite, habitat e missioni non cambiano.

Sorgente [PNG](../assets/sources/veloria-r12_valle_vento-illustrated-v3.png), [runtime WebP lossless](../public/assets/scenery/veloria-r12_valle_vento-illustrated-v3.webp), [prompt ImageGen](../assets/prompts/r12_valle_vento-illustrated-v3.md), [guida geometrica](../assets/prompts/r12-layout-guide-v1.svg). PNG raw senza crop o resize; modalità built-in ImageGen. Il manifest contiene ora23 fondali e609 asset registrati, senza attestare il completamento di tutte48 mappe.

## Verifiche

767 test dominio e31 persistenza passati. Quattro casi browser nuovi passati: diario→mappa senza spostamento; stati Zapdos prima/dopo Lega e cattura; simbolo unico e guida pesca nelle tre mappe; percorso reale dall'uscita di Acquariva fino a Snorlax e apertura di INCONTRA. Ripetuta anche una pesca reale fino all'avvio della lotta. Atlante esistente in portrait/landscape passato. Build, guida diario→atlante e prima richiesta dei22 fondali non iniziali passati senza rete. Asset e collegamenti validati. Ricevuta di pubblicazione e stato CI in `CI_STATUS.md`.

I17 casi dei cinque file con percorsi lunghi sono assegnati a quattro shard dedicati `journeys`, fuori dai12 shard `chapters`. Il confronto delle liste Playwright verifica305 casi browser, tutti presenti una sola volta fra chapters, journeys, MVP, controls e league: nessuna omissione o duplicazione. Offline resta separato. Timeout dei test e limite di24 minuti del passo browser invariati; nuova pipeline completa da attestare.
