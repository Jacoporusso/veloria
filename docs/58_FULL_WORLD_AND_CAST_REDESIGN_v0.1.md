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

## Secondo incremento — 0.3.139

Nuovi fondali per Borgofonte, Viale delle Fronde e Bosco dei Veli: meno microdettaglio, percorso continuo e contrasto più leggibile. Collisioni, missioni, habitat, servizi e posizioni dei personaggi conservati. Sono iterazioni grafiche: non attestano che lo stile finale di tutte le mappe sia completo.

Due atlanti 2×2 introducono otto identità distinte per Mira, Dalia, Aster, Rhea, Nerea della palestra, Selene, Nives e Aurel. Nerea del Consiglio rimane distinta, perché il canone non prova un’identità comune. Il catalogo `appearances.v2.json` associa ogni profilo a un asset esplicito e permette più atlanti senza inferire identità dal nome. Profili registrati: 11, per 14 presenze; le altre 37 presenze rimangono da rifare. Pose statiche: direzioni e animazioni del cast restano aperte.

Il controllo del PNG trasparente nel viewer aveva prodotto un falso positivo sugli aloni dei personaggi. Il compositing reale di Chrome a più scale è pulito e ha permesso di selezionare i due atlanti. Conservati prompt, sorgenti, conversioni lossless e motivazione della rivalutazione; lo studio alternativo di Mira non entra nel gioco.

La verifica portrait ha inoltre trovato Mira nascosta dalla UI vicino al bordo nord. La camera ora può oltrepassare moderatamente i bordi verticali per mantenere gli interlocutori fuori dal HUD e dai controlli touch. Questo può mostrare il fondo della scena lungo il limite del fondale; il completamento artistico dei margini rimane parte della revisione di ciascuna mappa.

Il validatore di provenienza segue ora le mappe effettivamente associate ai fondali illustrati, invece di imporre esattamente 14 record. Tre regressioni Python coprono crescita del catalogo, provenienza mancante per una mappa nuova e modifica dei byte dell’artwork. Il manifest ora contiene 15 fondali; questa copertura non equivale a verifica grafica delle 48 mappe.

Driver di navigazione corretti per le soglie ampliate e per gli asset attuali, mantenendo controlli su risorse, ricompense e persistenza. Il percorso offline fino a tre medaglie è passato prima delle ultime aggiunte cosmetiche. 625 test dominio/persistenza e 114 Python passati; verifiche browser e ricevute del lotto sono registrate in `CI_STATUS.md`.
