# Condotto e Centrale Risonante — contratto di capitolo

**Stato: implementato e pubblicato nei contenuti 0.3.82; indagine completa verificata offline anche su GitHub Pages. Perimetro ed esiti in `CI_STATUS.md`.**

## Fonti e collocazione

Questo capitolo segue la Medaglia Acciaio: R07 collega Ferraluce alla Centrale Risonante D03, come previsto da `02_WORLD_MAP_DESIGN_Veloria_v0.2.md`. Prosegue il confronto delle letture dell'Anello, senza attribuire retroattivamente ai ricercatori una colpa collettiva. Tono luminoso e rassicurante del GDD, presentazione 2D illustrata moderna.

## Percorso giocabile

1. Dopo Rhea, uscita est della piazza di Ferraluce. Prima della medaglia il varco indica il requisito, senza spostare il personaggio.
2. Sul Condotto il misuratore registra impulsi che coincidono con intervalli di prova; gli habitat sono laterali al sentiero principale.
3. Nella Centrale, un tecnico indica un registro e distingue la rete ordinaria dalla linea sperimentale.
4. Il registro documenta prove energetiche avviate senza la necessaria autorizzazione. Non identifica ancora responsabili o organizzazioni.
5. Il giocatore isola soltanto la linea di prova da una console predisposta: non spegne la città e non distrugge tecnologia.
6. Il sensore di uscita conferma che gli impulsi sperimentali sono cessati. Questo risolve l'intervento locale, non il mistero di tutta Veloria.
7. Si torna da Ivo con il riscontro. Ricompensa unica e diario aggiornato; nessuna quinta medaglia o accesso alla Lega impliciti.

I dettagli di questa sequenza e i testi sono narrazione originale di Veloria. I dati Pokémon rimangono quelli del catalogo locale importato da PokéAPI; nessuna mossa o parametro ufficiale viene inventato per il capitolo.

## Contratti dei dati

| Elemento | Identificatore |
|---|---|
| Condotto | `veloria/r07_condotto_risonante` |
| Centrale | `veloria/d03_centrale_risonante` |
| Accesso | `badge_acciaio_awarded` |
| Misura R07 | `q_r07_measurement`, evento `r07/sensor/read` |
| Registro | `q_centrale_log`, evento `centrale/log/read` |
| Isolamento | `q_centrale_isolated`, evento `centrale/regulator/isolate` |
| Riscontro | `q_centrale_output`, evento `centrale/output/read` |
| Rapporto | `q_centrale_report`, evento `ferraluce/ivo/centrale_report` |

Ogni passo richiede quello precedente. Interagire fuori ordine spiega dove andare; non concede avanzamento o ricompense. Stato salvato nei flag esistenti, senza un secondo archivio parallelo. Le uscite di ritorno restano aperte anche durante l'indagine.

## Geometria e stile

- Ferraluce: collegamento orientale nella fascia bassa, senza alterare l'ascensore P4, i servizi o la monorotaia.
- R07: passerella a percorso leggibile, macchinari e giardini laterali; nessuna serie obbligatoria di incontri per attraversarla. Ingresso ovest e Centrale a est, con spawn reciproci distinti dai trigger.
- D03: percorso centrale e postazioni laterali accessibili; registro, console e sensore distinguibili per forma e testo. Palette acciaio chiaro, petrolio, ciano e verde botanico, usando asset originali già registrati.
- Nessuna cornice da sito o HUD persistente aggiuntivo. Controlli e dialoghi restano quelli dell'app in portrait e landscape.

## Prove richieste prima della pubblicazione

- Validazione dei collegamenti, spawn, asset e collisioni; tutti i punti di interazione raggiungibili senza attraversare oggetti solidi.
- Quest fuori ordine senza mutazione, sequenza completa, ripetizione senza doppio premio e persistenza a metà intervento.
- Percorso touch dalla piazza alla Centrale e ritorno; diario coerente a ogni passo; almeno portrait e landscape.
- Cache offline dei due ambienti e reload nella Centrale durante la missione.
- Ispezione visiva di entrambi gli ambienti. Un checkpoint preparato non dimostra il bilanciamento di una partita naturale.

Rimangono nel perimetro completo città successive, P5–P8, Lega, conclusione della storia, ampliamento del catalogo e verifica su telefono fisico. Questo capitolo non conclude il gioco.
