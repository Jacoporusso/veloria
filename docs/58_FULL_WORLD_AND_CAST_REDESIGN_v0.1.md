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

## Terzo incremento — 0.3.140

R01, R03 e Radicelmo hanno nuovi fondali illustrati e materiali più opachi; il candidato di Radicelmo troppo lucido/lastricato è stato corretto prima dell’integrazione. Posizioni, collisioni e interazioni conservate. Verificati con controlli reali Centro, erboristeria e tre strumenti del giardino di Radicelmo. Le quattro identità del Consiglio sono integrate con frame e ancoraggi espliciti; Nerea Consiglio resta distinta dalla capopalestra. Catalogo: 15 profili per 18 presenze, altre 33 presenze da rifare, direzioni/animazioni aperte.

Priorità emersa durante il lotto: feedback degli habitat. Una sola sagoma per zona, con il path approvato nel prototipo e ancoraggio su cella percorribile; eliminati il vecchio badge e il marker sull’acqua di R01. Squadra tutta KO: nuovo avviso chiaro e nessun consumo RNG. [Diagnosi e verifiche](59_HABITATS_AND_GEN1_CATALOG_v0.1.md).

Nuovo vincolo di prodotto: Veloria dedicata ai 151 Gen I, generazioni successive introdotte con altre leghe/regioni. Scaricati e verificati 302 riferimenti ufficiali PokéAPI per i 151 ID; la registrazione runtime rimane 83 specie, di cui 60 Gen I. Distribuzione, regali e sostituzione delle specie Gen II attuali sono da discutere e implementare: [proposta regionale](60_REGIONAL_ROSTERS_AND_REWARDS_PROPOSAL_v0.1.md). Nessuna nuova distribuzione applicata durante questa discussione.

## Quarto incremento — 0.3.141

Petalora e Salita dei Petali ricevono fondali v3 con superfici opache, vegetazione illustrata e percorsi alleggeriti. Binding sostituiti senza modificare geometria, collisioni o progressione. I parapetti dei ponti possono sporgere rispetto al piano calpestabile: la revisione confronta il pavimento con le corsie reali, non il solo rettangolo esterno dell’immagine. La prima prova ha trovato i piedi sull’acqua nelle corsie meridionali di R04: ampliato il piano illustrato verso sud e ripetuta la prova. Tutte le sei corsie attraversate e revisionate visivamente. Petalora: attraversate tutte le tre colonne e raggiunti i prompt di cure, bottega e monorotaia.

Sera, Timo, Rami delle Terrazze ed Enea hanno quattro identità illustrate dedicate. Rami non viene assimilato agli altri personaggi che condividevano il vecchio sprite. Catalogo: 19 profili per 22 presenze; altre 29 presenze da rifare. Un lieve respiro anima le immagini NPC intorno all’ancoraggio del piede; nessuna modifica di posizione, collisione o RNG. L’opzione animazioni ridotte ricostruisce la scena senza questo tween e distrugge quelli precedenti. Questa prima animazione d’attesa non sostituisce le direzioni e i set di movimento, ancora aperti.

L’obiettivo rimane la revisione completa delle 48 mappe e dell’intero cast. Le proposte di distribuzione dei 151 Gen I, regali e nuove regioni restano separate e non applicate in questo lotto.

Verifiche locali del lotto: 636 test dominio/persistenza, 124 Python, validatore (370 asset e 15 fondali), build; 22 presenze NPC nei due orientamenti, ciclo idle/animazioni ridotte, Petalora con entrambe le qualità e orientamenti, percorsi reali dei ponti e servizi, rendering e identità di tutti i 15 fondali registrati. I confronti delle dimensioni usano una tolleranza di un milionesimo di pixel per l’arrotondamento dei rapporti di scala Phaser, mantenendo coordinate e identità esatte. Prove offline e ricevute di rilascio in CI_STATUS.md.

## Obiettivo congiunto autorizzato

Il rifacimento completo prosegue in parallelo alla migrazione dei151 Gen I, con agenti separati e uguale obbligo di completamento. Nessuna retrocompatibilità richiesta per i salvataggi Gen II. Ambito, responsabilità e criteri congiunti nel [documento61](61_GRAPHICS_AND_GEN1_MIGRATION_v0.1.md). Le precedenti note di sola proposta descrivono lo stato storico, superato dall’autorizzazione dell’utente.
