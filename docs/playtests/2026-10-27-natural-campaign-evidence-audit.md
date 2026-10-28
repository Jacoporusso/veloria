# Evidenze della campagna naturale al27 ottobre2026

Non è attestata una partita con il catalogo corrente dalla Nuova partita fino alle otto medaglie e alla Lega. I test funzionali con squadre preparate verificano puzzle, battaglie, premi, transizioni e salvataggi; non dimostrano la progressione naturale o il suo bilanciamento.

`tests/playtests/natural-prologue.spec.ts` usa i normali comandi di gioco e un handle di osservazione, senza modificare party, HP, esperienza, livelli, flag o RNG. Parte da nuovo gioco o importa backup esportati dall'interfaccia; i due casi vanno distinti nei rapporti. I rapporti storici documentano prove dei quattro starter fino alla prima medaglia e una catena guadagnata, segmentata tramite backup, fino alla quinta. La sfida naturale di Selene è stata tentata e persa; ciò non dimostra che la palestra sia impossibile.

I due backup controllati direttamente, `2026-10-24-natural-selene-prebattle-backup-charmander.json` e `2026-10-24-natural-hypno-trained-backup-charmander.json`, appartengono ai contenuti0.3.114 e contengono le specie195 e170. Quindi la catena storica fino a P5 non può essere presentata come prova del roster attuale di Veloria, limitato alla prima generazione. Non si devono sostituire artificialmente quelle specie per attribuire il risultato a una nuova partita corrente.

Il prossimo passo di verifica è una nuova partita sul ruleset corrente, scegliendo lo starter e ottenendo catture, allenamento, cure e vittorie tramite gioco. La prima tappa verificabile del driver è la medaglia di Mira; successivamente si prosegue con backup autentici esportati dalla UI, conservando anche sconfitte, consumi e livelli raggiunti. La prima vittoria storica non ancora dimostrata è P6, ma l'intera catena deve essere rivalidata rispetto al roster corrente.

Riferimenti storici: `2026-10-21-official-growth.md`, `2026-10-22-fourth-medal-charmander.md`, `2026-10-24-nerea-fifth-medal.md`, `2026-10-24-selene-first-attempt.md`, `2026-10-24-hypno-and-dunes-recovery.md`. Questo audit non modifica il bilanciamento e non dichiara concluso il goal di progetto.
