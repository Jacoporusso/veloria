# Piano di miglioramento del mondo e dell’allenatore

24 ottobre 2026. Piano approvato nella direzione visiva dall’utente; implementazione runtime da eseguire per lotti verificabili. Non sostituisce i requisiti aperti della roadmap generale.

## Decisioni e riferimenti

- Mantenere il gioco **2D illustrato moderno**, con camera ortogonale dall’alto e profondità dipinta morbida.
- Concept del mondo approvato; successiva revisione approvata con sentieri più leggeri, terra chiara, pietre rade e margini morbidi. Riferimenti: `assets/prompts/world-readability-v1.md`, `world-readability-v2.md`.
- Tavola dei personaggi approvata come direzione: `assets/prompts/characters-direction-v1.md`.
- Prototipo consultabile: `world-design-prototype.html`. Tavole non pronte per il runtime: prospettiva del borgo da correggere, livelli da separare e geometria da allineare ai Tiled; i personaggi non sono atlanti animati.
- Aggiungere il wizard dell’allenatore. La foto è un’estensione futura che suggerisce opzioni del wizard, non una dipendenza per iniziare.

## Lotti e ordine

| Lotto | Risultato concreto | Dipendenze |
|---|---|---|
| A — Inventario | Elenco di habitat, NPC, servizi, ingressi e uscite; identità e riferimenti grafici espliciti | Dati delle mappe e documenti narrativi |
| B — Wizard | Prototipo cliccabile con nome, preset e personalizzazione, anteprima immediata | Catalogo di opzioni e studio dei livelli grafici |
| C — Linguaggio degli habitat | Ciuffo a tre foglie riconoscibile su tutti i biomi; legenda e introduzione contestuale | Zone incontri reali, non vegetazione decorativa |
| D — Personaggi | Asset separati e coerenti con il ruolo, animazioni e identità stabili | Inventario A; geometria animazioni comune al wizard |
| E — Navigabilità | Percorsi, porte e transizioni coerenti con collisioni e destinazioni reali | Audit A e stile dei sentieri approvato |
| F — Integrazione | Wizard persistente e primo lotto Borgofonte/Sentiero/Bosco verificato | B–E, asset validi e verifiche |
| G — Estensione | Stesso contratto applicato alle altre mappe in gruppi geografici | Primo lotto approvato e verificato |

Inventari, definizione del wizard e contratti dati possono procedere in parallelo con subagent Luna. Modifiche al renderer condiviso e allo schema salvataggi vanno integrate in sequenza. Una sola sessione di test browser alla volta; nessuna modifica al runtime durante la prova.

## Wizard allenatore — incluso nel piano

Flusso: nome → aspetto → riepilogo/anteprima → conferma → avventura. Preset iniziali **ragazzo/ragazza**; le successive scelte estetiche restano libere. Nome e validazione esistenti conservati.

Opzioni previste: carnagione, taglio e colore capelli, occhi, barba opzionale, abbigliamento e zaino. Pulsante casuale e ritorno alle fasi precedenti senza perdere la selezione. Anteprima grande e anteprima alla dimensione di gioco; valutare quali dettagli degli occhi siano davvero distinguibili sulla mappa. Numero di varianti definito dal catalogo di asset effettivamente prodotti, non da combinazioni promesse senza animazioni.

Aspetto modificabile successivamente dalle impostazioni senza azzerare nome, squadra, inventario o missioni. Salvare ID stabili delle opzioni; separare profilo, catalogo grafico, composizione e UI. Usare gli stessi elementi nell’anteprima e nel mondo: corpo, capelli, vestiti e accessori devono condividere griglia, ancoraggio e sequenza di animazione nelle quattro direzioni. Nessuna opzione solo nominale che lasci invariato il personaggio mostrato.

Verificare il formato del salvataggio e la sua validazione prima di scegliere tra estensione opzionale con valori predefiniti e cambio versione. I backup reali e i progressi esistenti non devono essere cancellati per introdurre una personalizzazione estetica. Riferimento tecnico: `54_AVATAR_WIZARD_TECHNICAL_PLAN_v0.1.md`.

### Foto — fase futura, separata

Foto facoltativa → proposta di opzioni già disponibili → correzione manuale → conferma. Scelta ragazzo/ragazza sempre esplicita. Non promettere una somiglianza fotografica o la generazione automatica di tutte le animazioni.

Prima della fase foto decidere elaborazione locale o servizio, trattamento e cancellazione della foto, funzionamento offline e costo. Non introdurre caricamenti o conservazione immagini implicitamente. Verificare accesso alla camera e contesto sicuro su browser/PWA e telefono: il semplice accesso LAN HTTP usato per il mockup non attesta la disponibilità della camera. Il wizard manuale deve funzionare indipendentemente dalla foto.

## Habitat e orientamento

- Stessa sagoma del ciuffo su tutte le zone incontri; colori adattabili al bioma, distinzione anche senza animazione e senza affidarsi solo al colore.
- Visualizzare il segnale soltanto dove i dati autorizzano incontri. Non alterare specie, pesi o frequenze per ragioni decorative.
- Prima spiegazione breve e legenda richiamabile; segnale pesca distinto nei punti realmente utilizzabili.
- Insegne coerenti per servizi e trasporti; porte visibili e libere, sentiero continuo fino alla soglia.
- Transizione lungo il passaggio rappresentato, senza obbligare a scoprire una singola casella invisibile. Chiusure narrative spiegate e coerenti con lo stato della missione.
- Guida all’obiettivo su richiesta; niente frecce permanenti o nuovo rumore sullo schermo.

## Identità degli NPC

Assegnare aspetto in base alla scheda narrativa, non dedurre genere dal nome. Ogni personaggio importante ha ID grafico, silhouette, capelli, abiti, palette e ruolo riconoscibili. Varianti delle comparse distinguibili anche per forma e accessori. Verificare corrispondenza tra mappa, dialogo e ritratto ove presente. Elia/Ada della tavola sono proposte approvate di direzione, da riportare esplicitamente nelle schede prima della sostituzione runtime.

## Criteri di completamento per lotto

1. Asset dichiarati e registrati, nessuna chiave di rendering conflittuale; dati e grafica separati.
2. Spawn → servizi/missione → uscita → ritorno provati sulle mappe interessate, con stato narrativo aperto e bloccato dove previsto.
3. Habitat coincidenti con le zone incontri reali; personaggi e porte non coperti da illustrazioni decorative.
4. Wizard usabile con touch e tastiera, portrait e landscape; selezione visibile, riepilogo coerente, modifica successiva e ripresa/backup verificati.
5. Nessuna perdita di progressi o mutazione delle regole di battaglia e degli incontri.
6. Animazioni ridotte, prestazioni mobili e disponibilità offline degli asset verificati. QA su telefono fisico separato dall’emulazione browser.

## Stato attuale

Realizzati e visionati: concept del mondo v2, tavola personaggi e mockup con legenda/overlay. Approvazione estetica ricevuta. Audit tecnici avviati in parallelo con Luna. Wizard, nuovi asset animati, correzione percorsi e segnali uniformi **non ancora implementati nel gioco**. Le modifiche locali al catalogo mosse appartengono a un lotto distinto.


### Avanzamento primo lotto

Wizard e segnali habitat ora implementati localmente; tre atlanti illustrati del protagonista integrati, con palette e accessori personalizzabili. Contratto e verifiche nel documento `55_TRAINER_WIZARD_AND_HABITATS_v0.1.md`. Le correzioni dei percorsi e gli NPC restano i lotti successivi: lo stato storico sopra descriveva la proposta prima dell’avvio. L’obiettivo include tutto il piano oltre ai requisiti preesistenti della campagna completa.
