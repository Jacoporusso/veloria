# Atlante: punti esatti e selezione isolata

Il diario apriva solo la regione e la priorità fra categorie nascondeva alcuni simboli. Ora la panoramica mostra separatamente doni, incontri speciali e pesca. Selezionare un simbolo o un obiettivo nel diario apre il fondale della mappa locale e mostra soltanto il punto scelto e la sua scheda. «Tutti i punti» ripristina la panoramica; «Sei qui» torna alla zona attuale. Nessun teletrasporto o cambiamento al salvataggio.

## Coordinate e sorgenti

`atlas-discoveries.ts` carica i Tiled pubblici su richiesta e ricava le coordinate dagli oggetti reali: NPC per i doni, oggetti degli incontri speciali e tutti i punti pesca delle mappe con tabella pesca. Il fondale locale usa la stessa estensione della mappa del gioco. Il pin indica il punto fisico dell’oggetto, non il centro generico della regione.

Per le missioni ordinarie, `content/journey/atlas-quest-targets.v1.json` contiene 150 collegamenti fra eventi e oggetti, ricavati da Tiled, dialoghi, regolatori, allenatori e puzzle. Il selettore puro sceglie il prossimo passo incompleto con requisiti soddisfatti e preferisce la mappa attuale quando esistono più sorgenti. Un obiettivo parallelo esplicito conserva il proprio flag nella navigazione.

Rigenerazione e verifica:

```powershell
python tools/build_atlas_quest_targets.py
python tools/build_atlas_quest_targets.py --check
```

Il validatore generale controlla che l’indice sia aggiornato. Gli eventi di ingresso usano lo spawn reale etichettato «Ingresso»; i sei eventi di cattura speciale usano i punti del catalogo incontri. Gli eventi non spaziali della cerimonia e dell’epilogo non ricevono coordinate inventate. La navigazione ai puzzle indica un loro controllo reale, non risolve il puzzle per il giocatore.

## Contrasto e interazione

Sfondo blu notte, velo scuro sulla cartografia, simboli chiari con bordo a contrasto. I bersagli touch della panoramica misurano circa 46 pixel e restano stabili allo zoom. La vista selezionata nasconde altri punti, percorsi regionali, legenda e selettore della regione. I controlli funzionano in portrait e landscape; gli elementi nascosti sono esclusi dal ciclo del focus.

## Verifiche

### Revisione del 28 ottobre 2026

Il catalogo usa risultati indipendenti: una pianta non disponibile non elimina i simboli delle altre mappe. Durante il caricamento compare un messaggio; in caso di dati parziali compare un avviso con l'indicazione di riaprire la mappa per riprovare. Le richieste fallite non restano nella cache delle piante. Quando il telefono cambia orientamento, la vista locale ricentra il punto selezionato senza modificare posizione o progresso del giocatore.

Verifica corrente: TypeScript e quattro casi browser passati (`.tmp/atlas-resilient-review.log`), inclusa una risposta HTTP 503 del laboratorio, isolamento delle categorie, coordinate reali di una missione e centratura del bersaglio nei due orientamenti. Screenshot controllati a 390×844 e 844×390. Questa verifica riguarda il codice locale e non certifica un nuovo rilascio su GitHub Pages.

814 test dominio/persistenza passati; tre controlli Python sull’indice, incluse le sorgenti dei puzzle. Nove casi browser passati su atlante, diario, doni reali, pesca e incontri speciali. Due casi aggiuntivi controllano isolamento, coordinate della stazione D05 (176,451), dimensioni touch, orientamenti e salvataggio invariato. Il laboratorio viene verificato sul punto di Elia (400,259).

Produzione offline: quattro casi passati per R15, diario incontri, doni/pesca/missione ordinaria e prima decodifica dei 29 fondali non iniziali; ripetizione finale dei due casi di navigazione passata. Build passata. Log locali in `.tmp/atlas-final-native.log`, `.tmp/atlas-final-offline.log` e `.tmp/atlas-release-offline.log`. Le verifiche non certificano una partita naturale completa o il completamento della revisione delle 48 mappe.
