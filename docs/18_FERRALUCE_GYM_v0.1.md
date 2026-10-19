# Palestra 4 — Officina Magnetica di Ferraluce

## Ambito implementato localmente

Quarta palestra Acciaio, dopo il rapporto a Ivo (`q_ferraluce_report`). Rhea è un personaggio originale di questa implementazione. La piazza e l'Officina costituiscono una fetta di Ferraluce: R07, Centrale Risonante, quartieri cittadini, quattro Palestre successive e Lega restano da realizzare. Questa consegna non conclude l'avventura.

## Accesso e mappa

- Pedana ascensore P4 a (34,18) nella piazza; cartello a (34,20), ritorno `from_gym04` (34,19), orientato a sud per non riattivare subito l'ingresso.
- `gym04_ferraluce.tmj`: 32×24 tile da 32 px; arrivo `from_city` (15,22), uscita a sud x=12–19, y=23. Il ritorno non richiede flag.
- Nuova illustrazione ImageGen con alpha, PNG conservato e WebP lossless; prompt/hashes in `assets/prompts/gym04-magnetic-room-v1.md`. Collisioni, personaggi e circuito sono dati separati. Il disegno dell'ascensore è codice nativo, non una porta dipinta su un landmark chiuso.
- Rhea a (15,10), sorgente (6,15), primo nastro (10,15), secondo (20,15), campo (20,8), ricevitore (10,8). Le impronte dei controlli sono bloccate; le linee sul pavimento sono soltanto visuali e attraversabili.

## Puzzle estendibile

`content/puzzles/gym04_magnetic.v1.json` definisce nodi, posizioni, orientamenti, collegamenti ed evento finale. Il motore puro `src/core/world/signal-router.ts` segue il segnale fino al ricevitore, rileva cicli e rifiuta riferimenti inesistenti. Le scene non contengono condizioni per Ferraluce.

Premere A davanti a un comando, scegliere RUOTA, poi CHIUDI. Soluzione: primo nastro est, secondo nord, campo ovest. Non è una sequenza: i tre comandi possono essere regolati in qualsiasi ordine. Linee e frecce mostrano il tragitto alimentato; il menu indica fin dove arriva il segnale. Le istruzioni si trovano anche nel diario, nella guida interna e parlando con Rhea.

Ogni orientamento occupa un flag `router_<circuito>_<nodo>_<stato>`; ruotare rimuove soltanto il precedente stato di quel nodo, conservando gli altri progressi. La quest ascolta `gym04/magnetic/aligned` e assegna `gym04_magnetic_aligned`. Dopo il completamento il circuito rimane stabile. Il motore del puzzle non assegna medaglie o premi.

Il validatore incrocia comandi Tiled e nodi, posizione/impronta di collisione, direzione dei collegamenti, soluzione raggiungibile e corrispondenza tra evento e flag quest. Per una nuova palestra aggiungere dati e mappa; il renderer e il controller condivisi non richiedono controlli sul nome della città.

## Sfida, fonti e ricompensa

| Pokémon | Livello | Mosse HGSS supportate e legali al livello |
|---|---:|---|
| Magnemite | 20 | Tuonoshock, Tuononda, Ferrostrido, Sonicboom |
| Skarmory | 21 | Beccata, Agilità, Furia, Turbosabbia |
| Steelix | 22 | Azione, Sassata, Rafforzatore, Stridio |

I livelli, il roster e il premio sono bilanciamento prototipale di Veloria. Parametri e mosse provengono dai file PokéAPI locali e dagli import riproducibili. Non sono state assegnate mosse soltanto per analogia di tipo: Scintilla richiede il livello 22 per Magnemite, mentre Ferrartigli non compare nei learnset candidati fino al 25. Il livello 22 di Steelix non abilita Schianto, appreso al 25.

La sfida richiede il circuito completato. Vittoria unica: 1.100 monete, Medaglia Acciaio, feedback di Rhea. Il badge usa un emblema originale vettoriale a magnete, condiviso tra banner e medagliere. Flag e premio non si duplicano al ritorno o dopo reload.

Le difese hanno risposte diverse: Skarmory è immune a Terra, Steelix a Elettro. Il Wooper catturabile sull'Anello offre un'opzione accessibile indipendentemente dallo starter; non è obbligatorio possedere una specie specifica per entrare. Non è ancora provato il bilanciamento di una partita naturale con tutti gli starter. Magnemite → Magneton al 30 e le condizioni speciali di Magneton restano riferimenti, non nuove evoluzioni abilitate in questa consegna.

## Verifiche e limiti

- Dominio puzzle: connessione in ordini diversi, salvataggio serializzato, rotazione inversa, blocco dopo completamento, cicli e riferimenti errati.
- Python: authoring coerente, frecce errate, nodo mancante, comando assente, ricevitore irraggiungibile, evento quest inesistente e nodi fuori mappa.
- Browser: accesso bloccato prima del rapporto, tre orientamenti con reload intermedio, portrait/landscape, uscita; seconda prova sfida bloccata, vittoria, banner, premio unico e quattro medaglie dopo reload.
- La battaglia di integrazione usa Quagsire 35 preparato: certifica le interazioni, non la difficoltà naturale. QA su smartphone fisico, collisioni visive ai bordi e playtest con tutti gli starter restano aperti.
- Esiti delle prove e stato GitHub in `CI_STATUS.md`. P4 è stata pubblicata; la prosecuzione R07/D03 è descritta nel contratto `19_CENTRALE_RISONANTE_v0.1.md`.
