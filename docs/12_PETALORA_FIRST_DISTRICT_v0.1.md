# Salita dei Petali e primo quartiere di Petalora

## Perimetro — contenuti 0.3.64

Segue il collegamento R04 Radicelmo → Petalora definito nel world design v0.2. Non rappresenta ancora tutta la città né la Palestra 2 Erba. La Palestra, il suo puzzle d’irrigazione e l’uscita successiva restano da realizzare; i dialoghi non ne promettono l’accesso.

Il passaggio nord di Radicelmo richiede soltanto la Medaglia Aurora. Archivio del seme e vivaio restano missioni facoltative, accessibili anche dopo aver visitato Petalora. Il diario dà priorità alle tappe principali e contrassegna quelle facoltative.

## Mappe e percorso

| Mappa | Dimensioni | Arrivo | Ritorno / prosecuzione |
| --- | --- | --- | --- |
| Radicelmo | 36×24 | R04 → `from_r04`, (18,1) | soglia nord larga tre caselle (17–19,0), gate Aurora |
| `veloria/r04_salita_petali` | 42×30 | `from_radicelmo`, (18,28) | sud → Radicelmo; nord (29–31,0) → Petalora |
| `veloria/petalora` | 38×28 | `from_r04`, (18,26) | sud (17–19,27) → R04 `from_petalora`, (30,1) |

Il sentiero principale R04 passa per (18,23), (7,23), (7,14), (30,14) e la soglia nord. Due ponti di legno attraversano il torrente. Collisioni dell’acqua, tronchi e confini restano oggetti Tiled; nessuna navigazione specifica per mappa nel controller.

Quattro habitat di foglie ai lati del sentiero usano la tabella locale `veloria/r04_petal_ascent`, probabilità per controllo 0,14 e fasce mattina/giorno/notte. Il sentiero offre un percorso completo senza incontri obbligatori. Specie del catalogo esistente, livelli 8–11; nessuna nuova mossa o specie inventata.

## Incontri e servizi

- Nila, (10,16): sfida opzionale, Pidgey 9 e Mareep 10, mosse disponibili nei learnset HGSS importati. Ricompensa 180 monete una sola volta; banner e feedback condividono il flusso degli altri allenatori.
- Padiglione delle Cure: facciata (7,3)–(12,7), accesso dal lato sud; cura gratuita e deposito.
- Bottega dei Ciliegi: facciata (25,3)–(30,7), accesso dal lato sud; Pozioni, Antidoti e Sfere ai prezzi del catalogo esistente.
- Custode Ivo: (19,8), introduce canali, servizi e futura prova Erba.
- Arrivo: evento generico `area/veloria/petalora/enter`, flag `q_petalora_visited`, senza denaro o oggetti gratuiti. Il sistema di transizione emette lo stesso contratto per tutte le mappe, conservando l’evento di Brumalta.

## Direzione visiva

Ciliegi rosa/corallo illustrati, terreno pittorico, corsi d’acqua turchesi, ponti caldi e fioriture laterali. Riutilizzo degli edifici e NPC illustrati esistenti per i servizi del primo quartiere; architettura esclusiva di Petalora ancora da sviluppare. Il nuovo ciliegio è registrato con PNG sorgente, WebP e prompt in `assets/prompts/petalora-cherry-tree-v1.md`.

Il profilo ambientale `petals` dichiara area, conteggio e palette nei metadata. Posizioni cosmetiche deterministiche, senza consumo del RNG degli incontri; in animazione ridotta i petali restano statici. Tween e oggetti vengono rimossi con il resto delle visuali al cambio mappa.

## Verifiche e limiti

Il test di connettività esegue BFS da ogni spawn e verifica uscite, servizi, habitat evitabili e gate senza prerequisito vivaio. Le prove browser usano comandi touch reali; la squadra preparata di Charmeleon 16 verifica integrazione e premio, non il bilanciamento naturale di Nila. Resta da fare il playtest naturale dopo Mira con tutti gli starter e la verifica su smartphone fisico.
