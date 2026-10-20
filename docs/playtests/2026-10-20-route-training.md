# Allenamenti intermedi — 0.3.98, 20/10/2026

## Contenuti giocabili

| Percorso | Allenatore | Livelli | Premio unico | Posizione Tiled |
|---|---|---|---|---|
| R06 Anello Magnetico | Iris | 17–18 | 650 | 21,16 |
| R07 Condotto Risonante | Dario | 21–22 | 850 | 18,18 |
| R08 Costa Turbine | Viola | 24–25 | 1.050 | 20,11 |
| R11 Via delle Cascate | Celia | 33–35 | 1.500 | 15,17 |

Specie presenti nei rispettivi habitat; mosse supportate e apprese per livello in HGSS. Profilo `route_cautious`. L'interazione presenta SFIDA/NON ORA, senza agguato automatico o gate narrativo aggiunto. Le caselle occupate hanno collisione; esiste spazio per aggirarle. Ogni evento completa una missione separata e il blocco dell'allenatore impedisce la ripetizione del premio. Nessun asset nuovo: atlante NPC condiviso già registrato, con definizione coerente 3×2.

## Misura della crescita

`node --experimental-strip-types tools/audit_progression.ts` include ora i quattro allenatori nell'ordine dei capitoli. Report: `2026-10-20-route-training-budget.json`. Restano valide tutte le limitazioni del precedente budget: vittorie perfette, XP liberamente assegnabili, resa del miglior habitat applicata ottimisticamente all'intero deficit, nessuna simulazione di catture o battaglia.

| Sfida | KO selvatici equivalenti precedenti | Nuovo budget |
|---|---:|---:|
| Rhea | 46 | 43 |
| Nerea | 70 | 59 |
| Selene | 125 | 108 |

Questi deficit sono cumulativi e non vanno sommati. Il risultato non dimostra che l'intera squadra cresca a un ritmo soddisfacente. Restano necessarie ulteriori occasioni di allenamento e una partita con risorse e livelli guadagnati normalmente. Nessun moltiplicatore XP nascosto è stato introdotto.

## Verifiche

Validatore: 48 mappe, 48 missioni, 27 allenatori, 11 negozi, 270 asset. 451 test dominio e 25 persistenza passati. Quattro scenari browser passati in 1,5 minuti (Iris21,1s, Dario25,7s, Viola23,4s, Celia20,8s): rifiuto, vera lotta touch, premio, reload, dialogo dopo vittoria e cammino fino all'uscita senza incontri selvatici. Fixture Raticate80 con Sgranocchio legale: verifica d'integrazione, non bilanciamento naturale. Ritratto mobile di Celia controllato visivamente.

Esito offline, pubblicazione e pipeline Linux nel CI_STATUS.
