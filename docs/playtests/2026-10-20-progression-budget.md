# Budget di esperienza della progressione — 20/10/2026

## Metodo riproducibile

`node --experimental-strip-types tools/audit_progression.ts` legge squadre, rese, curve e habitat correnti e usa le funzioni XP del motore. Risultato versionato nel JSON omonimo. L'ordine dei capitoli è esplicito nello script. Non è una simulazione delle battaglie né una prova di partita completabile.

Si concedono tutte le vittorie facoltative e si assegna liberamente tutta l'esperienza: ipotesi più favorevole del runtime, dove solo il destinatario del KO cresce. Il capopalestra corrente non contribuisce al budget precedente al proprio incontro. Si parte da livello5 senza residuo, con la curva cubica del prototipo. Per il deficit si usa la fascia oraria più redditizia dell'habitat vicino e si applica persino quella resa tardiva a tutto il deficit accumulato: il numero stimato è un limite ottimistico, non un itinerario realizzabile. Non comprende catture a livelli alti, sconfitte, PP, strumenti o spostamenti.

## Evidenza

| Ingresso sfida | Livello minimo avversario | Livello massimo teorico di un solo starter con tutti gli XP allenatore | Ulteriori KO selvatici stimati per portarlo al livello minimo |
|---|---:|---:|---:|
| Mira | 7 | 6 | 3 |
| Dalia | 12 | 8 | 13 |
| Aster | 16 | 11 | 27 |
| Rhea | 20 | 12 | 46 |
| Nerea | 26 | 15 | 70 |
| Selene | 35 | 21 | 125 |
| Nives | 41 | 23 | 99 |
| Aurel | 46 | 28 | 116 |
| Primo Consiglio | 50 | 34 | 87 |

Le righe non vanno sommate: ciascun deficit riparte dal budget cumulativo degli allenatori. La discesa di alcuni conteggi riflette la resa degli habitat più avanzati. Allenare più compagni dal principio costa ulteriormente: lo scenario diagnostico di tre membri livello5 richiede 443 KO equivalenti all'ingresso da Selene. Catture tardive accorciano quel percorso ma non sostituiscono la verifica dei compagni cresciuti dall'inizio.

Il tratto P5→P6 è il primo salto particolarmente forte: Nerea26–28 → Selene35–38. Lina28, Teo30 e Maya32–33 fanno da ponte, ma sono solo tre lotte. R11 è accessibile prima di Selene; non si deve contare automaticamente su R12/R13 come contenuti precedenti alla sesta medaglia. Il suggerimento del sotto-agente di collocare altri allenatori su R12/R13 va valutato con questi gate e non risolve da solo la preparazione a P6.

## Correzione dei rifornimenti 0.3.97

Ferraluce, Portolume e Acquariva aggiungono Superpozione e Antiparalisi; Passobrina e Biancavetta aggiungono anche Iperpozione. Oggetti, cure e prezzi restano quelli del catalogo ufficiale già importato, senza nuove formule o premi sintetici. I mercati precedenti conservano il loro assortimento. Questa correzione rende disponibili cure adeguate durante il percorso: non è una soluzione al deficit XP e non costituisce un bilanciamento attestato.

## Prossima implementazione richiesta

Distribuire più incontri allenatore facoltativi nei capitoli intermedi, iniziando da R06/R07/R08/R11, con collocazioni raggiungibili e squadre legali per livello. Misurare poi squadre cresciute realmente e catture disponibili, includendo HP/PP, cure gratuite, denaro e strategie. Valutare esplicitamente l'accessibilità della crescita degli altri membri; non introdurre un moltiplicatore XP o un Condividi Esperienza implicito per far tornare il report.
