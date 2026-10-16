# Veloria — Battle engine e progressione (decision log v0.3)

## 1. Obiettivo

Mantenere il ritmo di Oro/Argento con comandi moderni e bilanciamento adatto a 4 starter. Le meccaniche precise devono essere **versionate** e formalizzate, perché PokéAPI contiene dati di generazioni molto diverse e non determina da sola quale versione delle regole usare.

## 2. Regole base confermate

- Battaglia uno contro uno, a turni; max 6 Pokémon in squadra, 4 mosse per individuo.
- Tipi iniziali: 17 delle prime due generazioni; includono Buio e Acciaio, escludono Folletto.
- Possibilità di scegliere attacco, strumento, cambio Pokémon o fuga (ove consentita).
- Priorità delle mosse, velocità, HP/PP, efficacia di tipo, mosse di stato, esperienza e evoluzioni.
- Combattimenti allenatore distinti da incontri selvatici; cattura solo dove regole lo permettono.
- Seed pseudo-casuale in test; log deterministico delle mosse/effetti per replay.

## 3. Scelte di design aperte, NON ancora approvate

| Area | Alternativa A | Alternativa B | Proposta |
|---|---|---|---|
| Fisico/speciale | Per tipo come generazione 2 | **Per singola mossa** (modernizzato) | B: favorisce bilanciamento e comprensione; esplicitarlo nel GDD |
| Statistiche | Formula/stats classic Gen II | Stat moderne normalizzate | B per gestione semplificata con dati PokéAPI; calibrare su 4 starter |
| Natura/abilità | Introdotte | Escluse | Escluse MVP; nessun effetto mascherato da PokéAPI |
| Metodi evoluzione trade-only | Scambio necessario | Quest/oggetti alternativi | B: 251 ottenibili in single player |
| Esperienza | Scala classica | Curva lievemente modernizzata | Da prototipare con leader lv target |
| Split generazioni mosse | Learnset storico | Learnset curato per Veloria | Mix controllato: dati origine + override espliciti |

**Nota di coerenza:** l'originale Gen II lega fisico/speciale al tipo; un ruleset moderno per mossa è una modifica consapevole e non va presentato come emulazione fedele.

## 4. Risoluzione turno (ordine suggerito)

1. Valida comando e precondizioni (PP, item, bersaglio, condizioni fuga).
2. Determina ordine per priorità, eventuali modificatori e velocità; pareggio da RNG.
3. Per ogni attore ancora attivo: verifica status/impossibilità, consumo PP, accuratezza, determinazione del danno/effetto e applicazione eventi.
4. Controlla KO, richiesta cambio forzato, sconfitta/vittoria, ricompense XP, oggetti, denaro, flag trainer.
5. Emissione eventi semantici (`moveUsed`, `damageApplied`, `statusApplied`, `creatureFainted`, `battleEnded`) per animazioni.

Non codificare un'animazione prima che l'evento del core sia già stato determinato. Le animazioni possono essere interrotte senza alterare lo stato di battaglia.

## 5. Piano test minimi

- Danno mai negativo, HP sempre `0..maxHp`, PP mai negativi, efficienza tipo effettiva anche su doppio tipo.
- Immunità tipo rispettate; status hanno durata/effetti coerenti e turn ordering documentato.
- Vittoria/KO, fallimento cattura e fuga non producono duplicazioni.
- Cambio Pokémon forzato valido con alleato disponibile, game over se nessuno disponibile.
- Resistenza critici/accuracy verificati su RNG seedabile.
- Evoluzione si attiva **solo** se target species è supportata e asset/data sono presenti; per non spezzare il gameplay, progettare le forme evolute richieste dal livello realistico dell'MVP o ampliare l'elenco di specie implementate. Non introdurre un cap nascosto del livello.

## 6. Starter/Palestra primo atto

Quattro starter lv5; palestra di Mira tipo Normale. Evitare che un solo starter disponga dell'unica contromisura per la sfida. Usare una squadra leader di 2 Pokémon con livello target calibrato dopo playtest: definire species/skills e difficoltà **solo dopo** il prototipo del battle engine. `content/examples/gym01_mira.trainer.json` è quindi un esempio tecnico, non la squadra canonica definitiva.

## 7. Progressione e scala futura

- Livello massimo iniziale **100**, soglia configurabile (estenderla oltre 100 richiede formule e bilanciamento dedicati).
- ID numerico nazionale per specie e UUID per istanze; XP accumulata/curva per specie, statistiche ricalcolate da parametri originali persistenti.
- Acquisizione ed evoluzione in single player anche per linee storicamente legate a trade/eventi: sostituire con percorsi/oggetti/missioni locali.
- L'innesto della terza generazione aumenta il totale teorico a 386 specie, **ma** va pianificata la compatibilità di tipi, mosse, ability/rules, asset e progressione.

## 8. Ottimizzazione del lavoro

Prima implementare un battle core testabile con due creature fittizie originali e tre mosse base; poi importare dati Pokémon; soltanto dopo aggiungere UI/belle animazioni e asset definitivi. Questo riduce il rischio di bug non riconducibili alla grafica.
