# Continuazione guadagnata: Centrale e Portolume

22 ottobre2026, runtime0.3.115. Prova passata in3,3min automatizzati (3,4min complessivi), importando tramite UI il backup reale della quarta medaglia della0.3.114. Squadra, inventario, denaro e RNG sono verificati immutati all’importazione. Non è una nuova partita completa né un checkpoint potenziato. Il campo contentVersion nel report conserva la provenienza0.3.114 del salvataggio; la correzione dei nuovi seed appartiene al runtime0.3.115 ed è verificata separatamente.

## Percorso e risultato

Uscita dalla palestra di Rhea, cure gratuite a Ferraluce, lettura del Condotto, registro della Centrale, isolamento della linea e sensore d’uscita. Ritorno da Ivo:300monete e2 Pozioni una volta sola, anche ripetendo il dialogo. Costa delle Turbine, arrivo a Portolume, Marina e Amo Vecchio, traghetto per l’Osservatorio, lettura del misuratore delle maree e ritorno al molo. Rapporto finale: altre2 Pozioni, nessuna duplicazione riparlando a Marina.

Centro Pokémon di Portolume verificato con squadra pienamente curata; titolo e ripresa conservano squadra, inventario, denaro e medaglie. Backup esportato dal menu e checksum verificato. Risultato:1490monete,4 Pozioni,1 Poké Ball,1 Antidoto e1 Amo Vecchio, oltre alla nota d’archivio; restano quattro medaglie. Charmeleon23, Rattata3 e7; nessun nuovo livello o strumento concesso dal driver. Zero errori JavaScript, nessuna battaglia attivata su questo percorso. Il cursore iniziale del tratto è2007488270, quello del backup finale3297684299: i controlli d’incontro possono consumare RNG senza generare una lotta.

- [Report delle interazioni](2026-10-22-natural-centrale-portolume-charmander.json)
- [Backup reale di Portolume](2026-10-22-natural-portolume-backup-charmander.json)
- [Provenienza del percorso fino alla quarta medaglia](2026-10-22-fourth-medal-charmander.md)

## Limiti e riproduzione

È una prova del collegamento narrativo, dei servizi e della persistenza con risorse guadagnate. Non certifica combattimenti di questo tratto, allenatori facoltativi, quinta medaglia, bilanciamento della squadra o qualità grafica su telefoni fisici. I tre compagni rimangono molto distanti di livello. La campagna completa e gli altri starter restano aperti.

Dal repository: VELORIA_E2E_BASE_URL=http://127.0.0.1:5174, PLAYTEST_RESUME_PORTOLUME_BACKUP=docs/playtests/2026-10-22-natural-fourth-medal-backup-charmander.json, PLAYTEST_DAMAGE_FIRST=1; nessun PLAYTEST_RESUME_RHEA_BACKUP attivo. Eseguire Playwright con playwright.playtest.config.ts. Il driver registra startingRngState per distinguere il seed del tratto da quello della partita originale.
