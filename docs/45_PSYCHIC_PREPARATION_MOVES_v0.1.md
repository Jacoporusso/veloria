# Morso, Bottintesta e apprendimenti ripetuti — 0.3.128

## Mosse ufficiali disponibili

| Mossa | Tipo / categoria | Potenza | Precisione | PP | Effetto supportato |
|---|---|---:|---:|---:|---|
| Morso | Buio / Fisica |60|100%|25|30% di tentennamento |
| Bottintesta | Normale / Fisica |70|100%|15|30% di tentennamento |

Parametri, nomi italiani e livelli HGSS sono importati dai record PokéAPI locali. Il tentennamento usa il motore esistente: può fermare la mossa del turno solo se il bersaglio deve ancora agire e resta in campo; immunità, mancato colpo, KO e azioni già concluse conservano le regole già verificate. Le descrizioni condivise mostrano probabilità e condizioni in lotta, dettagli e schede.

Morso è disponibile, tra gli altri, per Rattata al10 ed Eevee al29. Tutti gli83 learnset sono rigenerati;83 mosse supportate,546 apprendimenti ancora esclusi per effetti non implementati. Il rapporto sorgente conserva gli apprendimenti esclusi. Nessuna mossa viene assegnata retroattivamente ai Pokémon del salvataggio.

## Correzione degli apprendimenti

L'importer eliminava le ripetizioni dello stesso ID anche a livelli diversi. Ora deduplica soltanto la stessa coppia livello/mossa. Drowzee conserva quindi Bottintesta al15 e al32, Hypno al15 e al38. Un compagno che non conosce più la mossa può riceverne la proposta al livello successivo ufficiale; se la conosce, conserva slot e PP. Due prove con il core e il catalogo effettivi verificano Drowzee al32 in entrambe le condizioni.

La scheda di dettaglio Squadra/Pokédex ora mostra nome, livello quando noto e tipi nell'intestazione compatta. Le istruzioni per selezionare/riordinare restano nella lista: quando si studiano le mosse, il contesto del Pokémon rimane visibile durante lo scorrimento.

## Verifiche

- 563 test di dominio/persistenza passati, inclusi parametri ufficiali, tutti gli apprendimenti delle due mosse, livelli ripetuti e PP conservati.
- 111 test Python, importer offline, validatore e build TypeScript/Vite passati. L'audit montano ora distingue Bottintesta supportata dall'effetto combinato di Gelodenti ancora non importato/verificato.
- Drowzee29 catturato nella partita naturale con Bottintesta e dettagli30% verificati dalla UI; Eevee28 catturato con le sue mosse attuali, Morso ancora da apprendere. Report e limiti in `playtests/2026-10-24-acquariva-preparation.md`.
- Importazione del backup guadagnato nella PWA senza rete, consultazione di Bottintesta e Morso al29, intestazione compatta e integrità di squadra/box/risorse/RNG verificati nel caso offline dedicato. Caso passato in4,1s (17,6s inclusa build), screenshot controllato visivamente; nessuna chiamata PokéAPI runtime.

Restano catalogo001–251, effetti/evoluzioni non implementati, progressione naturale P6–P8/Lega/finale e QA fisico Android/iOS. Queste prove non attestano il completamento della campagna.
