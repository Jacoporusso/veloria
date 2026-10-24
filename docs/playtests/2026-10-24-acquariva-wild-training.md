# Preparazione naturale alla sesta palestra — 24 ottobre 2026

## Provenienza e metodo

Partenza dal backup `2026-10-24-natural-maya-lost-backup-charmander.json`: la sconfitta contro Maya è conservata, RNG4255800604,3340 monete, una Sfera, nessuna Pozione, tre Antidoti e cinque medaglie. Runtime0.3.129. Eevee28 è il compagno catturato nel precedente playtest, con0XP nel livello.

Il nuovo driver `tests/playtests/helpers/acquariva-wild-training.ts` seleziona il compagno dalla Squadra, percorre l'uscita di Acquariva e cammina fra le due caselle libere33,12/33,13 nel prato delle Canne. Le battaglie sono risolte tramite i controlli visibili del gioco. Ritorna al Centro gratuito quando il compagno scende sotto il60%HP; non assegna strumenti, XP, livelli o RNG. Dieci giri massimi, quaranta passi per giro; eventuale mancato raggiungimento del livello resta un risultato valido, senza XP artificiali.

Obiettivo per Eevee: livello29, apprendimento di Morso al posto di Ruggito tramite la UI di apprendimento. È un requisito del playtest, non un premio automatico. Il driver può anche allenare il Drowzee già posseduto al30, senza anticiparne l'evoluzione.

Riproduzione: `PLAYTEST_RESUME_FIFTH_BACKUP` al checkpoint guadagnato; `PLAYTEST_ACQUARIVA_TRAIN_SPECIES=133` (oppure96); `PLAYTEST_LEARN_MOVES=bite:growl`; `PLAYTEST_DAMAGE_FIRST=1`. Eseguire un solo browser alla volta con la configurazione playtest.

## Preparazione disponibile e limiti

La palestra è già accessibile con `q_acquariva_report`; i percorsi settentrionali richiedono invece la Medaglia Riflesso. Selene usa Hypno35, Slowbro37 ed Espeon38: la vittoria non è ancora dimostrata da questo allenamento. Le prove E2E con squadre di livello55 verificano puzzle/premi/persistenza, non il bilanciamento naturale.

Il tempo del driver comprende menu, cammino, animazioni e ritorni al Centro e non misura la durata minima umana. Il confronto con un pubblico di bambini e gli altri starter restano da verificare. Nessuna riduzione dei livelli avversari o modifica alle mosse ufficiali è inclusa.

## Esito eseguito

Prova passata in5,7 minuti:13 vittorie selvatiche, zero errori JS. Dieci giri completati, Eevee29 con233XP nel nuovo livello. Morso appresa dalla schermata di apprendimento al posto di Ruggito; nessuna assegnazione retroattiva. Tre KO di Eevee conservati e cambi obbligati: Drowzee guadagna529XP, Quagsire274XP; restano rispettivamente29 e25. Chinchou22/Charmeleon24 invariati.

Ritorno e riposo al Centro, export UI `2026-10-24-natural-eevee-trained-backup-charmander.json`, report omonimo senza `-backup`. RNG1733980911,3340 monete, una Sfera, zero Pozioni e tre Antidoti, cinque medaglie. Checksum, identità dei membri, box/inventario/denaro/medaglie invariati, cura completa e accordo squadra/report verificati separatamente. La preparazione ha richiesto13 incontri per un livello di Eevee: il suo impatto sul ritmo della campagna resta da valutare, senza attribuire al driver la qualità di una sessione umana.

Maya e Selene non sono state sfidate nuovamente in questa prova. Questo backup è il checkpoint naturale più avanzato; il risultato non dimostra ancora la sesta medaglia.
