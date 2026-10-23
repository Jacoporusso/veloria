# Microhabitat di Anello Magnetico e Condotto Risonante

Content0.3.122 · cache PWA v143 ·23 ottobre2026.

## Cambiamento per il giocatore

Prima le due mappe usavano le stesse quattro specie con gli stessi pesi, variando soltanto i livelli. Ora ogni mappa distingue due gruppi di habitat già presenti e percorribili. Le probabilità per passo restano8%; cambiano i gruppi e i pesi condizionati all’incontro. Nessuna nuova specie, mossa o formula è inventata: si riusano dati e artwork già importati. La distribuzione geografica e i pesi sono scelte prototipali di Veloria.

| Area | Gruppo di specie, unione degli orari |
|---|---|
| Anello, due patch nord | Magnemite, Voltorb, Mareep |
| Anello, due patch sud | Wooper, Mareep, Geodude, Oddish |
| Condotto, muschio ovest | Wooper, Poliwag, Oddish, Geodude; Zubat di notte |
| Condotto, felci est | Magnemite, Voltorb, Geodude, Onix; Zubat di notte |

Anello passa da4 a6 specie complessive; Condotto da4 a8. Non si sommano queste cifre come nuove specie del catalogo: alcune sono condivise. I livelli restano nella fascia15–18 per Anello,18–21 per Condotto; Magnemite e Mareep nell’area tecnica dell’Anello conservano15–17. Wooper resta disponibile nel muschio ovest del Condotto a tutte le ore,35% del peso,18–21. Le catture del precedente checkpoint restano valide e non vengono alterate.

I sentieri, collisioni, probabilità per passo e condizioni di avanzamento non cambiano. Si assegnano i trigger esistenti a nuove tabelle dichiarate nei metadata. Il Pokédex deriva gli habitat da questi collegamenti senza una seconda lista manuale. Resta da estendere la revisione alle altre zone ripetitive dell’audit38, in particolare mappe iniziali e costa/dune/delta; questo intervento non risolve l’intera biodiversità della regione.

## Verifiche e limiti

550 test dominio/persistenza passati, inclusa raggiungibilità degli habitat e collegamento dei trigger. Validatore passato. Tre prove browser: percorso R07/Centrale con premi unici e ritorno, Pokédex portrait e landscape con risorse invariate, passate in1,3min complessivi. Questi test non provano ancora il nuovo bilanciamento naturale o l’esperienza su telefoni fisici.

La suite completa120 è terminata con20 job riusciti e un fallimento nella prova isolata Selene. Screenshot: la squadra preparata aveva perso contro Espeon38, senza banner medaglia. Il driver di integrazione usava il seed casuale della nuova partita e sceglieva Tuonoshock pur avendo Scintilla. Ora soltanto quella fixture controlla il seed e usa Scintilla già presente; partita reale e IA non sono cambiate. Prova puzzle/medaglia/persistenza passata in54,9s (55,9s totale). Non viene presentata come vittoria naturale su Selene.
