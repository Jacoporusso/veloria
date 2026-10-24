# Guida alla soglia evolutiva — v0.1

Runtime0.3.133, cachePWA154. La Squadra indica «Soglia raggiunta» per un compagno che ha già il livello minimo di un'evoluzione per livello effettivamente disponibile nel runtime. Spiega di fargli guadagnare esperienza e restare in piedi alla fine del turno, senza un ulteriore livello. Se è KO, il testo invita prima a curarlo.

La selezione usa le regole runtime insieme al bersaglio del riferimento evolutivo, non soltanto il livello informativo di PokéAPI: le evoluzioni con pietra, scambio, amicizia o fuori dal catalogo non ricevono un falso messaggio di recupero. Sotto soglia, e nel Pokédex privo del singolo compagno, compare la spiegazione generale dell'evoluzione durante la lotta. Nessuna nuova azione o modifica automatica del save; restano le meccaniche della132.

## Verifiche

- 57 regressioni starter/evoluzioni passate, incluso il nuovo caso reale di catalogo Drowzee31→Hypno31: nessun levelUp, stessa identità, mosse conservate, PP speso mantenuto e nessuna mossa vecchia concessa retroattivamente.
- Build TypeScript/Vite e validatore passati; resta l'avviso preesistente sui chunk Phaser.
- Due browser portrait/landscape passati in2,7s: sotto soglia, soglia superata con KO, soglia superata con HP positivi ed evoluzione con pietra. L'oggetto save resta identico dopo la consultazione. Le fixture sono controllate e non una partita naturale.
- Screenshot delle istruzioni Drowzee31 controllati in entrambi gli orientamenti. Nessuna nuova prova fisica del telefono dichiarata.

La guida non cambia i livelli ufficiali o la persistenza e non certifica il completamento del catalogo o della campagna. Pubblicazione e CI in CI_STATUS.
