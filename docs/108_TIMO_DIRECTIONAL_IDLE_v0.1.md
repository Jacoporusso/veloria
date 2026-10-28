# Timo: quattro viste illustrate indipendenti

Il profilo `route-trainer-timo`, NPC `trainer_route01_b`, mantiene ruolo e dialogo `timo_route01` sul Sentiero dell'Alba. Quattro nuove idle sostituiscono il suo frame1 nell'atlante condiviso: ricci ramati, cappellino blu/crema all'indietro, giacca ruggine/blu, pantaloncini cargo, zaino con rotolo e fischietto. La borraccia rimane sul lato anatomico sinistro dello zaino, visibile a ovest e occlusa a est. L'abbigliamento deriva dal riferimento artistico; il dialogo conferma la sfida facoltativa e il tono, senza specificare età anagrafica.

Immagini prodotte con ImageGen integrato. PNG originali copiati byte per byte in `assets/sources/veloria-timo-idle-*-v1.png`, WebP lossless RGBA-identici in `public/assets/sprites/`. Prompt esatti, fonti, identificativi di generazione, hash e origini in `assets/prompts/timo-idle-views-v1.json`; registrazione nel catalogo e nel manifest idle. Nessun ritaglio, flip, pulizia o resampling delle sorgenti.

Corpo calibrato a56worldpx sulle parti alpha≥128; origine delle suole specifica per vista, scala uniforme. Solo sprite, frame e origine di Timo cambiano nel Tiled R01. Geometria, interazioni, battaglia e ricompense restano invariate. L'atlante condiviso rimane registrato per le altre identità.

Il test delle identità richiede ora per Sera e Timo i rispettivi asset sud, quattro riferimenti distinti e nessun frame legacy; conserva i binding di Rami ed Enea. Il test del respiro legacy usa Enea nella preview della sala del Campione: stesso insieme di asserzioni su piedi, scala, arresto e distruzione dei tween precedenti. Questo non attribuisce una camminata a Timo: le idle e i cicli di movimento restano contratti distinti.

## Verifiche locali

Quattro casi Chrome passati (`.tmp/timo-native.log`): tutte le51presenze nei due orientamenti, respiro legacy Enea, Timo nei quattro approcci con qualità completa/ridotta e portrait/landscape. La prova dedicata verifica asset selezionato, direzione, origine, scala uniforme, nessun flip/tween, occlusione rispetto al giocatore e salvataggio/RNG invariati. Review dei quattro screenshot direzionali completata; il compositing reale non mostra aloni evidenti.

Produzione offline: primo decode delle quattro immagini alle dimensioni originali e quattro interazioni, nessuna richiesta fallita o pageerror (`.tmp/timo-offline.log`, un caso passato). Build passata con avviso chunk Phaser.828 test dominio/persistenza e154 Python passati, validatore802media/48fondali/48mappe.405casi browser assegnati una volta;52risorse offline divise26+26.

La migrazione raggiunge13 profili direzionali su48;35 restano da completare, oltre alle animazioni e alla verifica del cast prevista dal piano. La ricevuta del rilascio viene registrata in `CI_STATUS.md` prima di dichiarare la versione pubblicata.
