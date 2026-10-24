# Recupero dopo Selene: Hypno e Dune — 24 ottobre 2026

## Drowzee evolve durante l'allenamento

Partenza dal backup dopo la prima sconfitta Selene: cinque medaglie,140 monete, nessuna cura, Drowzee29/529XP. Runtime0.3.130. Il driver importa il backup senza modificarne i campi, esce realmente dalla palestra15,23 e raggiunge il Centro gratuito di Acquariva. Allenamento nelle Canne attraverso cammino e comandi di battaglia.

Dieci vittorie selvatiche in5,0minuti, due KO individuali di Drowzee conservati, nessuna sconfitta dell'intera squadra. Raggiunto il30, evoluzione in Hypno attraverso la celebrazione del gioco, stessa identità e quattro mosse conservate: Confusione/Bottintesta/Meditazione/Psicoraggio. Nessuna mossa retroattiva assegnata. Fine Hypno30/32XP, Eevee29/790XP; altri livelli invariati.

Ritorno e riposo gratuito, export dalla UI. Backup/report `2026-10-24-natural-hypno-trained*`. RNG1863052301,140 monete, una Sfera, tre Antidoti, zero Pozioni/Superpozioni. Checksum/importazione, identità prima/dopo evoluzione, mosse, box/inventario/medaglie invariati e cura completa verificati separatamente. Zero errori JS.

## Percorso di recupero disponibile

I flag del backup dopo Selene mostrano Lina e Noemi ancora non sconfitte, entrambe accessibili con Marea nelle Dune. Bruno è invece già sconfitto e non assegna un secondo premio.

Il driver delle Dune percorre Acquariva → Canne → Delta → Dune. Interazioni reali con Lina18,8 e Noemi28,9; ogni esito viene registrato ed esportato subito. Fra le sfide raggiunge il Centro gratuito di Portolume e torna nelle Dune. Nessun acquisto o assegnazione diretta di ricompense. La politica di cambio considera solo l'avversario visibile: Chinchou contro Pidgeotto/Krabby, Quagsire contro Flaaffy/Chinchou, Hypno contro Tentacool. Non legge il comando nemico futuro.

## Riproduzione e limiti

Allenamento: `PLAYTEST_ACQUARIVA_TRAIN_SPECIES=96`, checkpoint Selene dopo la sconfitta in `PLAYTEST_RESUME_FIFTH_BACKUP`, `PLAYTEST_DAMAGE_FIRST=1`. Recupero: checkpoint Hypno, `PLAYTEST_DUNES_RECOVERY=1`, `PLAYTEST_COAST_ROTATION=1`, `PLAYTEST_DAMAGE_FIRST=1`. Un browser alla volta. Le mappe si percorrono con i controlli; le osservazioni leggono stato e geometria e non modificano gioco, XP, RNG o inventario.

I tempi non misurano un minimo umano. Selene non è ancora vinta e questa preparazione non prova da sola un ritmo adatto a bambini. Il checkpoint dopo la sconfitta rimane nella catena di provenienza: non si annullano le spese precedenti.

## Recupero delle Dune eseguito

Driver passato in3,9minuti, zero errori JS. Lina e Noemi battute:420+1250 monete assegnate una volta, saldo140→1810. Nessun acquisto o strumento consumato. Il percorso comprende i Centri di Portolume fra le sfide e Acquariva al ritorno, attraverso Dune/Delta/Canne senza teletrasporti.

Backup intermedi Lina/Noemi e finale esportati dalla UI; file `2026-10-24-natural-*-recovery-backup-charmander.json`, report `2026-10-24-natural-dunes-recovery-charmander.json`. Il backup finale è il checkpoint cronologicamente più avanzato: cinque medaglie e1810 monete, stessa Sfera e tre Antidoti, cure a zero. Il risultato finanzia nuova preparazione, senza annullare le spese della prima sconfitta Selene. Maya e la sesta medaglia restano aperte.

Due sole battaglie nella prova delle Dune, entrambe vinte in8 turni; due KO individuali di Chinchou conservati. Hypno30/1556XP, Quagsire25/1622XP, Eevee29/790XP, Chinchou22/1893XP e Charmeleon24/1108XP, squadra curata. RNG1409461838. Checksum di tutti e tre gli export, incrementi esatti dei premi, flag di vittoria, identità della squadra, box/inventario/medaglie invariati e mappa finale Acquariva verificati separatamente.
