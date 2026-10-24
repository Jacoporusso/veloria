Aggiornamento24/10/2026: analisi storica eseguita sul catalogo del20/10. Il runtime0.3.128 include Morso, oltre a Finta/Sgranocchio già introdotte successivamente; le indicazioni sull'assenza di mosse Buio sotto non descrivono il catalogo attuale. Per livelli ufficiali e limiti vedere [documento45](../45_PSYCHIC_PREPARATION_MOVES_v0.1.md), per la preparazione guadagnata ad Acquariva [report24/10](2026-10-24-acquariva-preparation.md).

# Acquariva — audit della progressione

## Baseline osservata

Revisione locale `06544cb`, ruleset v7: P5 termina con avversari26–28; P6 schiera35/37/38. Nessun allenatore intermedio tra le due palestre. Gli habitat del percorso arrivano a27,28 e31. Ricerca e kit assegnano strumenti o denaro, senza esperienza. Il core accreditava la sola resa della specie, indipendentemente dal livello dell'avversario.

La curva cubica richiede20.923 XP per un membro da28 a35. Con le rese e i pesi diurni dei dati locali, l'audit stimava circa378 KO nell'erba R09,296 pescando in R09,370 pescando nel Delta o322 nell'erba R10. Queste stime descrivono la vecchia ricompensa costante, non il ruleset v8 corretto.

## Simulazione conservativa della lotta

Il subagente ha eseguito100 seed per squadra/livello con core, matrice tipi e AI `gym_beginner` effettivi. Squadre ripristinate a HP/PP pieni, senza strumenti, nessun cambio preventivo o strategia sugli status; il giocatore automatico sceglie il danno visibile migliore. Le mosse precedenti utili sono conservate quando esplicitamente indicate, con verifica dei learnset. Output esaminato in `.tmp/acquariva-balance/retained.txt`; script in `.tmp/acquariva-balance/audit.mjs`.

| Squadra | Livello uniforme | Vittorie su100 |
|---|---:|---:|
| Hypno, Lanturn, Quagsire, Flaaffy, Noctowl, Raticate |30|2|
| Stessa squadra |32|32|
| Stessa squadra |35|88|
| Ivysaur, Flaaffy, Quagsire, Hypno, Lanturn, Noctowl |30|1|
| Charmeleon con gli stessi cinque compagni |30|6|
| Wartortle con gli stessi cinque compagni |30|3|

Non sono probabilità di vittoria umane, né una partita naturale verificata. Non provano che una specie sia obbligatoria. L'analisi conferma soprattutto la necessità di un percorso di crescita sostenibile. La prova di sensibilità con tutti i livelli del boss abbassati di5 non è una proposta valida: Espeon non può avere Psicoraggio al livello33, perché il learnset HGSS lo assegna al36.

Nel catalogo runtime non ci sono ancora Pokémon Buio o mosse offensive Buio/Spettro. Sanguisuga è l'unica mossa Coleottero offensiva supportata. Le indicazioni pratiche devono quindi valorizzare contromisure ottenibili, come resistenze Psico/Acciaio e mosse Elettro contro Slowbro, senza richiedere contenuti futuri.

## Correzioni e lavoro aperto

- Ruleset v8: ricompensa scalata con livello e bonus allenatore; formula e limiti nel documento06.352 test dominio/persistenza e quattro regressioni browser della lotta passati dopo la modifica; la partita offline estesa è in verifica.
- Integrati tre allenatori facoltativi Lina, Teo e Maya, con 24 assegnazioni di mosse verificate nei dati HGSS locali. I dati runtime sono in `content/trainers/`; le bozze originali restano in `content/drafts/acquariva/training/`. Tre prove touch verificano rifiuto, battaglia, banner, premio e flag unici dopo reload. I checkpoint potenziati verificano l'integrazione e non la crescita naturale.
- Posizioni proposte in `training/placements.json`: Lina18,8 nelle Dune, Teo24,6 nel Delta, Maya20,8 nelle Canne. Verificata in bozza la raggiungibilità da entrambi i ritorni evitando habitat, anche bloccando la casella del nuovo allenatore. L'illustrazione e il personaggio vanno ancora controllati nel gioco.
- Corretto il difetto di collisione di Iris, Tessa e Selene: il renderer usa esclusivamente il layer collisioni e non rende automaticamente solidi gli NPC. Le vecchie prove geometriche aggiungevano manualmente le caselle, senza verificarne la solidità reale. Ora gli ingombri sono nei Tiled, i test ne asseriscono la presenza e i sette percorsi touch del capitolo passano con le collisioni effettive.
- Rivedere quantità e distribuzione dell'esperienza lungo il percorso dopo l'integrazione delle sfide; non dichiarare chiuso il bilanciamento con i checkpoint P6 di livello55.
- Restano necessarie prove con squadra cresciuta normalmente, più starter, cure e cambi scelti dal giocatore. Nessun abbassamento automatico del boss che anticipi mosse ufficiali o elimini il contenuto previsto.
