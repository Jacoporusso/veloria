# Crescita ufficiale e nuova partita naturale — 21/10/2026

## Cambiamento verificato

La0.3.108 assegnava a tutte79 specie la curva cubica provvisoria. La0.3.109 importa la categoria di crescita dalla risorsa pokemon-species e tutti i totali XP dagli endpoint growth-rate ufficiali, conservati con URL e SHA-256. Distribuzione: medium43, medium-slow24, slow10, fast2. Ogni tabella ha100 totali per livelli1–100; il core usa la differenza fra totali consecutivi e salva ancora il residuo verso il prossimo livello. La ricompensa dei KO e i suoi coefficienti non cambiano.

Contratto `content/battle/progression.v2.json`, schema versione2, rulesetv12. Fonte: `content/sources/pokeapi/growth-manifest.json`. Import/check: `python tools/import_pokeapi_growth.py --fetch` oppure `--check` senza rete. Nessuna curva legacy nel catalogo runtime né migrazione dei salvataggi del prototipo. La formula resta disponibile soltanto per regole sintetiche esplicite nei test.

## Partite naturali prima e dopo

Il playtest `tests/playtests/natural-prologue.spec.ts` è riallineato a porte, comandi e cerimonie attuali. Il suo handle della scena serve esclusivamente a osservare lo stato e pianificare il cammino. Nessuna scrittura di seed, squadra, HP/PP, livelli, XP, soldi, oggetti, flag o medaglie. Scelte, catture, cure, acquisti e ripresa passano dai normali comandi.

| Osservazione | Baseline0.3.108 | Curve ufficiali0.3.109 |
|---|---|---|
| Tempo scenario fino a Radicelmo con ripresa |7,2min|4,7min|
| Dopo Timo |Charmander6|Charmander7, Braciere appresa|
| Dopo Mira |Charmander8,3/24HP|Charmander9,11/26HP|
| Pozioni rimaste dopo Mira |0|1|
| Squadra dopo Mira |Charmander8, Rattata5, Mareep6|Charmander9, Rattata4, Sentret5|
| Esiti registrati |13 vittorie,2 catture|6 vittorie,2 catture|
| Sconfitte / errori JavaScript |0 /0|0 /0|

Entrambe le partite completano letture, Ada, cure, preparazione reale fino al livello massimo della squadra di Mira, acquisti se necessari, tre sigilli, prima medaglia, salvataggio/titolo/continua, cura, seme delle Terrazze, consegna a Leda e seconda ripresa. Controllati identità e stato della squadra, oggetto consegnato, premio una sola volta e progressi persistenti. Resoconti completi nei JSON natural-charmander-baseline e natural-charmander-official-growth della stessa data.

Sono due campioni con incontri e sequenze RNG di gioco differenti: tempi, compagni e risorse non dimostrano un miglioramento statistico né una difficoltà garantita. Il confronto dopo i due allenatori illustra il diverso calcolo XP; il percorso naturale riuscito prova questo itinerario con Charmander, non gli altri starter, gli otto capitoli o uno smartphone fisico.

## Budget di preparazione

`node --experimental-strip-types tools/audit_progression.ts` usa ora la curva ufficiale dello starter scelto (`AUDIT_STARTER_SPECIES_ID`, default4; consentiti1/4/7/25), riportandone ID e curva. I due JSON official-growth-budget-charmander/pikachu conservano i risultati. Le vittorie facoltative sono tutte concesse e l’esperienza assegnata liberamente; tre membri della stessa curva sono soltanto un diagnostico, non una squadra simulata. Il miglior habitat tardivo è applicato ottimisticamente all’intero deficit.

Le tabelle non risolvono da sole il ritmo: prima di Selene il limite ottimistico resta75 KO con il benchmark Charmander e99 con Pikachu; prima del primo Consiglio67 e75. Catture tardive, compagni con curve diverse, sconfitte, PP, cure e scelte tattiche richiedono una partita reale. Roster251, mosse mancanti, campagna naturale completa e QA fisico restano aperti.

## Verifiche tecniche

520 test dominio/persistenza e106 Python passati. Le prove controllano tutte le99 transizioni di ognuna delle quattro tabelle, tutte79 assegnazioni da cache, rifiuto delle tabelle invalide, soglie evolutive, mosse apprese, stato/identità/PP e barra XP. Passate19 evoluzioni browser; Piloswine aggiunge il caso a crescita lenta, e Piloswine/Nilo sono stati ripassati dopo la chiusura del contratto v2. Esito produzione offline, deploy e CI in CI_STATUS.
