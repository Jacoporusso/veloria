# Allenamenti costieri e montani — 0.3.108, 21/10/2026

## Quattro sfide facoltative

| Percorso | Allenatore | Livelli | Premio unico | Casella |
|---|---|---|---|---|
| R09 Dune Salmastre | Noemi | 28/28/28 | 1.250 | 28,9 |
| R10 Sentiero delle Canne | Bruno | 31/31/31 | 1.450 | 16,13 |
| R12 Valle del Vento | Ruben | 36/36/37 | 1.700 | 24,7 |
| R13 Tornanti Bianchi | Alma | 39/39/39 | 1.900 | 25,13 |

Dodici Pokémon da specie presenti negli habitat locali. Ogni assegnazione di mossa è validata sul learnset HGSS della specie al livello indicato. Nessuna mossa inventata né moltiplicatore XP aggiunto. Restano la formula di ricompensa e la curva provvisoria del motore.

SFIDA/NON ORA, collisione reale del personaggio aggirabile, diario facoltativo, dialogo e premio una sola volta. Riutilizzato l’atlante NPC illustrato registrato: i fondali e i passaggi esistenti restano invariati. I quattro allenatori non diventano prerequisiti per le medaglie o per uscire dalla mappa.

## Misura riproducibile e limiti

Comando: `node --experimental-strip-types tools/audit_progression.ts`. Dati versionati nel JSON omonimo. Rispetto al report0.3.98:

| Ingresso | KO selvatici equivalenti prima | Dopo |
|---|---:|---:|
| Selene | 108 | 99 |
| Nives | 91 | 78 |
| Aurel | 109 | 97 |
| Primo Consiglio | 83 | 75 |

Valori cumulativi, da non sommare. Il budget presume tutte le vittorie, nessuna perdita e assegnazione libera dell’esperienza; il runtime assegna ancora XP al destinatario del KO. Applica ottimisticamente il miglior habitat tardivo all’intero deficit. Non simula catture, cure, sconfitte, scelte delle mosse o crescita reale di sei compagni. Il miglioramento non prova il bilanciamento naturale: il deficit rimane elevato e richiede altre occasioni di allenamento e playtest dall’inizio al finale.

## Verifiche

Quattro prove browser passate in1,9min: rifiuto senza flag, vera lotta touch, banner, ricompensa unica, reload e dialogo già sconfitto, cammino fino all’uscita della mappa. Fixture Raticate80 con Sgranocchio legale: prova di integrazione, non misura di difficoltà. Posizionamento di Noemi controllato anche nello screenshot portrait. Quattro test geometrici verificano collisioni reali, accesso al personaggio e collegamento fra tutti gli spawn senza attraversare habitat o soglie.513 test dominio/persistenza e TypeScript passati; validatore controlla31 allenatori e53 missioni. Esito offline e pubblicazione in CI_STATUS.
