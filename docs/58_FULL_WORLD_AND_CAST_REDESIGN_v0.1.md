# Rifacimento completo di mappe e personaggi

Obiettivo richiesto dall’utente il 24 ottobre 2026: rifare tutte le mappe e tutti i personaggi. Questa è la priorità operativa; il precedente obiettivo del gestore resta aperto perché lo strumento non consente di sostituirlo senza dichiararlo completato.

## Ambito e fonti

L’[inventario derivato dai dati](art/full-redesign-inventory.json), rigenerabile con `tools/audit_redesign_inventory.py`, censisce 48 mappe e 51 presenze NPC. Le identità vengono accorpate soltanto attraverso profili espliciti: un nome uguale non prova che due apparizioni siano la stessa persona. I [brief del cast](art/cast-redesign-briefs.md) distinguono fatti narrativi e proposte artistiche.

## Direzione comune

Illustrazione 2D moderna, camera ortogonale, forme leggibili e luce morbida. Sentieri leggeri, margini naturali e pochi dettagli ad alto contrasto vicino alle interazioni. Colori caratteristici per ciascun bioma, coordinati con la UI approvata. Nessun ritorno alla pixel art o a fondali con prospettiva 3D incoerente con il movimento.

Personaggi con volto, silhouette, abiti e accessori distintivi, coerenti fra apparizioni. Elia è una professoressa secondo GDD e dialoghi. Genere ed età non si deducono dal nome. Wizard e protagonista personalizzato rimangono parte della direzione comune.

## Lotti

1. Casa e laboratorio, Borgofonte, R01, Bosco dei Veli, R02, Brumalta e palestra, R03 e Radicelmo: stabilire il linguaggio comune e correggere i raccordi più evidenti.
2. Petalora, Vetracielo, Ferraluce e relativi percorsi, interni e strutture: estendere lo stile mantenendo identità regionali.
3. Portolume, Acquariva, delta, costa e infrastrutture: conservare chiarezza di acqua, attraversamenti e servizi.
4. Biancavetta, Passobrina, Concordia, itinerari finali, Santuario, Lega e ogni mappa restante dell’inventario.
5. Cast: protagonisti ricorrenti, otto capipalestra, Consiglio/Campione, allenatori, abitanti e addetti ai servizi; verificare tutte le 51 presenze.

Il cast può avanzare in parallelo alle mappe con file assegnati separatamente. Ogni lotto viene verificato e pubblicato senza far passare per concluso l’intero obiettivo.

## Accettazione per ogni mappa e personaggio

- Artwork e asset runtime salvati nel repository, provenienza e prompt registrati.
- Geometria di collisioni, ingressi, uscite, servizi e missioni rispettata; nessuna porta o strada dipinta senza un passaggio reale.
- Habitat riconoscibili attraverso il segnale comune già implementato.
- Passaggi percorsi con i comandi reali, incluse le condizioni di sblocco.
- Rendering e interazioni verificati in portrait e landscape; cache PWA e funzionamento offline verificati per gli asset nuovi.
- Per NPC: identità stabile, scala e ancoraggio dei piedi corretti; direzioni/animazioni esplicitamente verificate o indicate come mancanti.

La presenza di un fondale o di una riga nel registro non equivale ad accettazione. Nessuna delle 48 mappe è automaticamente completata per questo nuovo obiettivo. Test di dominio, validatore contenuti e build devono restare verdi; le ricevute di pubblicazione restano in `CI_STATUS.md`.

## Primo incremento — 0.3.138

Casa e laboratorio di Borgofonte hanno nuovi fondali illustrati, registrati con sorgenti e conversioni WebP lossless. Binding grafici sostituiti senza modificare collisioni, hotspot, missioni o spawn. Rendering dei personaggi principali verificato nelle sei apparizioni in entrambi gli orientamenti; casa e laboratorio percorsi con i comandi reali fino a scrittoio/Elia e poi all’uscita. Cache PWA aggiornata a v159: entrambi i nuovi fondali decodificati dopo reload offline, progressi invariati.

Verifiche locali: 615 test dominio/persistenza, validatore dei contenuti, build, due prove browser NPC, due prove browser interni e una prova offline passati. Le prove degli interni usano un salvataggio preparato prima del percorso, non attestano un’intera campagna naturale. Le direzioni e animazioni del cast restano aperte. Borgofonte esterno e primo atlante capipalestra in lavorazione separata.
