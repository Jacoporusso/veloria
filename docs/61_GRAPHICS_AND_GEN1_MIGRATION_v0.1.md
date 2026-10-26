# Migrazione completa: mondo illustrato e catalogo Gen I

## Decisione dell’utente — 25 ottobre 2026

Due filoni paralleli devono arrivare entrambi a completamento: rifacimento grafico di tutte le 48 mappe e dell’intero cast, e catalogo/ottenibilità dei 151 Pokémon Gen I a Veloria. Autorizzata l’implementazione della precedente proposta60. Nessuna retrocompatibilità richiesta per partite di test che contengono Gen II: non introdurre convertitori o sostituzioni silenziose nei salvataggi. Le generazioni successive appartengono alle future regioni.

## Responsabilità

- Agente grafica: fondali moderni 2D opachi, percorsi leggeri, tutte le mappe e i personaggi; geometria e punti interattivi conservati, prove con controlli reali e nei due orientamenti.
- Agente Luna catalogo: importatori e dati ufficiali, 151 specie, learnset HGSS completi, mosse e relativo supporto reale nel motore, crescita ed evoluzioni Gen I. Nessuna mossa inventata o effetto dichiarato ma non funzionante.
- Root: distribuzione nelle zone, squadre allenatori, ottenibilità, artwork Pokémon locali, integrazione condivisa, verifiche e rilascio. Cache/manifest/registro/versione aggiornati in un punto solo; niente build o mutazioni asset concorrenti alle prove browser.

## Accettazione catalogo

1. Esattamente 151 specie Gen I nel roster Veloria; parametri, nomi, mosse, dettagli ed evoluzioni tracciati a PokéAPI e salvati localmente. Regole HGSS separate dal perimetro generazionale.
2. Nessuna specie Gen II nelle acquisizioni o negli avversari di Veloria, né evoluzione verso una generazione successiva.
3. Tutte le 151 specie hanno almeno un percorso realmente implementato e raggiungibile: habitat/pesca, starter/dono, evento speciale, evoluzione o scambio NPC. Una riga nel catalogo non vale come ottenibilità. Starter alternativi disponibili nella stessa campagna; leggendari ed eventi ripetibili dopo insuccesso.
4. Habitat vari per bioma e fase, includendo specie già importate ma assenti; una sagoma approvata per zona, invariata la leggibilità grafica.
5. Ogni specie mostra artwork in lotta, squadra, Pokédex, apprendimento/evoluzione/ricompensa. Asset locali con provenienza e cache offline.
6. Ogni mossa importata ha dati e comportamento verificati; niente fallback Tackle e niente eliminazione silenziosa di mosse/effetti non supportati.
7. Bilanciamento degli incontri e della campagna verificato, nuova partita e progressione rappresentativa controllate; test di logica/contenuti/browser/offline e CI prima della dichiarazione di completamento.

## Accettazione grafica

Restano integralmente validi ambito e criteri del documento58. Il numero di fondali o profili registrati non certifica il completamento. Le pose direzionali e animazioni del cast vanno verificate o mantenute esplicitamente aperte.

## Stato iniziale

Al via della migrazione: runtime83 specie (60 Gen I, 23 Gen II), cache302 risorse di riferimento per151 ID;19 profili illustrati/22 presenze;48 mappe nell’inventario,15 fondali nel manifest di provenienza. Questi sono dati di partenza, non risultati finali. Ultimo runtime grafico rilasciato0.3.141; correzione del test Rami in5dc37c3. Nessuna dichiarazione di completamento finché mancano requisiti su uno dei due fronti.

## Migrazione locale avviata (non rilasciata)

### Aggiornamento verifiche del 25 ottobre — prevale sulle note iniziali sotto

### Candidato al rilascio0.4.0 — 26 ottobre

Catalogo verificato:151 specie Gen I,370 mosse ufficiali HGSS apprese per livello,0 escluse; due mosse aggiuntive nel runtime provengono dagli import precedenti. Le limitazioni regionali delle lotte singole, del terreno e dell’assenza di oggetti tenuti sono esplicite nell’importer e nei dettagli delle mosse, senza effetti inventati. Tutte le52 evoluzioni per livello,16 a pietra e4 tramite scambio restano entro il roster. Non è prevista conversione delle partite con compagni Gen II.

Root ha eseguito765 test di dominio e31 di persistenza: tutti passati. Validazione contenuti passata:592 asset registrati,16 fondali con checksum/proporzioni verificati,48 mappe Tiled e62 missioni referenzialmente coerenti. Prova nativa del cast completa:51 presenze in entrambi gli orientamenti, tutte passate. Scambio con cerimonia/ricaricamento, dono con squadra piena e cattura reale di Snorlax con persistenza e rimozione dalla mappa passati. Test di produzione offline: tutti151 artwork ufficiali decodificati alla prima richiesta senza rete; squadra, deposito, inventario e RNG invariati. Build di produzione passata. La CI completa e la pubblicazione sono ancora da attestare.

Il rilascio del catalogo include il lotto grafico approvato e il fix dei bordi della camera; non dichiara conclusa la review grafica di tutte48 mappe né le animazioni direzionali del cast. Gli appunti precedenti qui sotto descrivono stati intermedi, superati da questo aggiornamento.

Verifiche successive: R04 ora usa il restyling sostanziale approvato (acqua più calma, canopie fini, terreno organico, materiali coerenti); prova nativa su tutte le sei corsie dei ponti passata. I clearing di Ferraluce/Vetracielo sono corretti e i due test dei servizi passano. La camera conserva il margine necessario agli attori, coperto ora da un’estensione decorativa riflessa del fondale statico: otto test ai bordi su quattro mappe e due orientamenti passati e screenshot ispezionati senza barre nere. Non cambia la geometria giocabile e non si duplicano personaggi o oggetti interattivi.

Registrati582 asset e16 fondali nel manifest parity, validati checksum e proporzioni;137 test Python e390 test di mondo/incontri/servizi/persistenza passati. Quattro profili costieri aggiunti (31 profili/34 presenze illustrate), ma il primo E2E identità ha rilevato origini e identity ID mancanti nei quattro binding. Correzione applicata e test statico aggiunto; nuova verifica browser ancora aperta. Nessun rilascio0.4.0 effettuato.

Implementati i tre doni degli starter alternativi, tre restauri fossili presso Elia dopo la Lega e sei incontri visibili ripetibili fino alla cattura (Snorlax, Articuno, Zapdos, Moltres, Mewtwo, Mew). Le collisioni dei Pokémon visibili si attivano solo con lo sblocco e scompaiono dopo la cattura; fuga e KO non consumano l’evento. L’audit dei percorsi potenziali copre151 specie, ma non certifica ancora un playthrough completo né la verifica visiva di tutte le posizioni.

Verificati in Chrome scambio Kadabra→Alakazam con cerimonia e ricaricamento, dono Bulbasaur nel deposito con squadra piena e avvio dell’incontro visibile con Snorlax. Test di dominio verificano tutti e sei gli incontri speciali e i sei doni. Il gate contenuti controlla il roster esatto, l’assenza di riferimenti regionali esterni, le evoluzioni e il collegamento oggetto/sblocco/cattura/collisione di ogni incontro speciale; quattro test di mutazione ne verificano gli errori.

R05/R06/R07 e atlante dei quattro allenatori integrati; sette test di navigazione browser passati, tre corsie R05 ispezionate visivamente. R07 sostituito con sorgente1499×1049 coerente con la geometria40×28. Ferraluce e Vetracielo v3 integrati con quattro profili; i percorsi Ferraluce passano in Chrome, ma la review screenshot ha rilevato aiuole sotto i piedi in prossimità dei servizi. Correzione grafica richiesta, accettazione visiva ancora aperta. Il test Vetracielo richiede un aggiornamento del testo atteso del punto cure e una nuova esecuzione. Atlante costiero approvato come candidato, integrazione e verifica ancora aperte.

L’ultima pipeline pubblicata (40191665354) è conclusa con successo. Questo non certifica il nuovo lotto locale0.4.0, ancora non rilasciato. Le mosse non supportate restano dichiarate nell’audit: non dichiarare completa la migrazione del catalogo prima della loro risoluzione e delle verifiche complessive.

Roster e parametri locali ora esattamente151 Gen I. Importati97 artwork ufficiali mancanti: tutti151 hanno una versione standalone locale con checksum/provenienza. CLI dei gruppi artwork estesa con lista esplicita e verificata; `--group gen1 --check` passa. Nessun adattamento dei salvataggi Gen II.

Convertiti217 riferimenti Gen II in65 file attivi/bozze di incontri e allenatori, preservando livelli/pesi e ricalcolando le mosse dei compagni sostituiti da HGSS. I sostituti sono scelte di design, non informazioni geografiche PokéAPI. Nuove scelte habitat in `content/regions/veloria.habitats.v1.json`, applicate a40 tabelle attive/bozze; il conteggio delle tabelle attive è riportato nell’audit. famiglie diverse per bioma, probabilità comuni variate per fascia oraria, limiti di livello e metodi conservati. Non cambia il tiro di attivazione dell’incontro né il segnale grafico.

Scambio assistito collegato al personale dei Centri con deposito: quattro evoluzioni ufficiali con restituzione del compagno, progressi/PP/stati/identità conservati e ricevuta della cerimonia persistente. Refactoring condiviso con le evoluzioni a pietra. Pietralunare acquistabile al negozio pietre di Radicelmo al posto della Pietrasolare, inutilizzabile nel roster Gen I.13 test di servizio evolutivo passati, UI/flow reale ancora da verificare.

L’audit `tools/audit_gen1_availability.py` distingue percorsi potenziali da playthrough verificato: nessun riferimento attivo Gen II, nessun artwork mancante. Mancano ancora eventi ottenibili per fossili, Snorlax e leggendari; quest dono degli starter, verifiche del mercato e dei percorsi evolutivi da completare. Le evoluzioni per livello/pietra/scambio sono ora source-backed complete, ma l’elenco di regole non prova che ogni percorso sia giocabile.

Mosse: ancora in implementazione da Luna. Il report `content/sources/pokeapi/gen1-move-coverage.json` espone i casi non supportati; non sono accettabili come completamento. Nuovi casi implementati comprendono Teletrasporto, Trasformazione, Splash, mosse dirette/effetti semplici, recupero e Thrash. La suite complessiva conserva test da aggiornare al nuovo roster e meccaniche ancora mancanti: non pubblicare questo stato come migrazione completa.

Grafica: R05 e atlante Nila/Oren/Iris R06/Dario integrati in lavorazione; root ha individuato rischio piedi sull’acqua nella terza corsia del ponte R05 e ha richiesto correzione prima dell’accettazione. Candidati R06/R07 in preparazione separata. Registro/parity/cache/versione e test browser del nuovo lotto ancora da concludere.
