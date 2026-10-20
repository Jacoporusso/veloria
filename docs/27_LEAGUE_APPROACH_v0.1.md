# Cammino dell’Equilibrio e piazzale della Lega —0.3.95

## Stato

Integrazione locale in verifica.43 mappe, 42 quest, 18 allenatori, 11 negozi, 260 asset; 69 specie e 76 mosse. R16 e piazzale sono giocabili; le sale interne, i cinque incontri consecutivi, la vittoria finale e l’epilogo non sono ancora collegati. La ricerca sulla Risonanza è già conclusa dal Santuario. Questo capitolo non viene presentato come partita completa.

## Geografia e ritorni

Concordia apre l’uscita39,15 solo dopo `q_resonance_restored`; arrivo di ritorno38,15. R16 è40×30, con tre piazzette su un sentiero continuo da ovest (uscita0,19–20,arrivo1,19) a nord-est (uscita39,1–2,arrivo38,2). Il disegno originale separa pietra, erba secca laterale e precipizi/acqua. Collisioni Tiled seguono i bordi reali. Tre habitat facoltativi:8,15 di3×2;20,18 di3×2;32,10 di3×2. Tutti i passaggi restano raggiungibili evitando gli incontri casuali.

Il piazzale40×30 offre Centro con cure/deposito (porta9,14,approccio9,15), mercato (31,14/31,15), accoglienza20,7 (20,8) e portale informativo20,5 (20,6). L’arrivo1,15 è esterno all’uscita0,14 di1×4, che riporta a R16. Acqua, padiglioni e pareti restano solidi. Il portale informa chiaramente che la sfida interna è in preparazione, senza finti ingressi verso mappe mancanti.

## Allenamenti e habitat

Maia sulla prima piazzetta: Steelix47, Dewgong48, Ampharos48;1800monete uniche. Tobia sulla piazzetta centrale: Hypno50, Charizard49, Quagsire49;2200monete uniche. Entrambi facoltativi e rifiutabili. Le squadre usano esclusivamente mosse HGSS disponibili al livello dichiarato; Psichico, Lanciafiamme e Sgranocchio arricchiscono le scelte oltre al primo catalogo. Feedback su doppi tipi, immunità, difese fisiche/speciali e preparazione.

Habitat45–49, distribuzione prototipale: Dratini15,Dragonair5,Xatu20,Sneasel20,Piloswine20,Ampharos20 percento, mattina/giorno/notte. Le foglie indicano le zone. Non si assegnano mosse fuori dagli apprendimenti ufficiali: nuovi selvatici usano il normale selettore per livello. Quantità e livelli restano da bilanciare nella progressione naturale.

## Mosse ufficiali

Cinque nuove mosse importate da PokéAPI locale, version groupHGSS: Lanciafiamme95 (valore storico, moderno90), Psichico90 con10%riduzione DifesaSpeciale, Sgranocchio80 con20%riduzione Difesa, PallaOmbra80 con20%riduzione DifesaSpeciale, Fangobomba90 con30%avvelenamento. Tutti69apprendimenti aggiornati e verificati;505voci non implementate restano esplicite. PallaOmbra/Fangobomba non hanno destinatari per livello nel roster attuale: non vengono assegnate artificialmente; insegnamento MT ancora assente.

## Fondazione delle sfide

`challenge-sequence.ts` è un core puro riusabile con requisiti, tappe ordinate, pending, reset, checkpoint e ricevute permanenti dei premi. Nove test ne verificano invarianti e salvataggi logici. Non modifica risorse, coordinate o disco. Registry, adattatore WorldScene, sale e avversari della Lega restano da integrare secondo documento26. Nessun campionato è dichiarato giocabile dal solo core.

## Verifiche locali

446 test dominio + 16 persistenza e 88 Python riusciti, build e validatore passati. Geometria reale, percorsi senza habitat, accessibilità, tutti i ritorni e legalità delle due squadre coperti da5test dedicati. Browser: percorso completo con blocco iniziale, cure HP/PP, acquisti, accoglienza e ritorni1minuto. Due lotte touch con contromosse legali e squadre potenziate fresche passate30,6s/23,9s; premi unici e reload. Non sono prove di bilanciamento naturale. Un primo tentativo riutilizzava Quagsire ferito e perdeva contro Hypno: le prove di integrazione ora isolano i due allenamenti con checkpoint freschi e contromosse diverse, senza cambiare i trainer. R16 e piazzale esaminati in landscape; Primo accesso offline a due ambienti e Tiled, servizi e ritorno completo passato in 49 secondi (1 minuto con build). Pubblicazione e nuova CI in CI_STATUS.
