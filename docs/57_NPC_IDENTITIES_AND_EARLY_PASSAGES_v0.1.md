# Identità NPC e primi passaggi — 0.3.137

## Identità

Elia, Ada e Nilo ricevono tre figure distinte nello stile illustrato approvato. Le sei apparizioni usano un catalogo stabile (`content/characters/appearances.v1.json`): Elia in laboratorio, Concordia e Santuario; Ada nel Bosco; Nilo a Borgofonte e sul Passo delle Due Luci. Profili, dialoghi e quest restano gli stessi.

**Elia è una professoressa nel GDD e nel dialogo `prof_elia`.** La tavola di concept precedente la rappresentava erroneamente come uomo: l’atlante runtime corregge quella discrepanza, senza riscrivere la storia per adattarla all’immagine. La tavola nel prototipo viene aggiornata al cast corretto.

L’atlante 3×2 contiene anche tre studi di ruoli cittadini non ancora assegnati. Non sono stati creati NPC, incontri o premi nuovi. Il resto del cast rimane da armonizzare: questa versione non elimina tutte le ripetizioni delle 51 presenze della regione.

Ancoraggi dei piedi espliciti compensano i margini delle illustrazioni, mantenendo la relazione con la casella interattiva. Collisioni e posizioni degli NPC non cambiano. Renderer e catalogo documentati in `content/characters/README.md`; prompt in `assets/prompts/npc-identities-v3.md`.

## Percorsi e transizioni

L’audit topologico conferma percorsi legali verso servizi, Ada/sensore e strumenti delle prime mappe. La sola raggiungibilità non prova la leggibilità del fondale.

- **Brumalta:** pavimentazione raccordata a monorotaia/arrivo e alle soglie dei servizi; immagine e provenienza aggiornate, oggetti runtime e collisioni invariati.
- **R01, Bosco, Viale delle Fronde, Brumalta:** otto uscite laterali coprono ora la larghezza della strada, invece di una casella isolata. Destinazioni, spawn e flag necessari restano invariati. Fuori dal corridoio non compaiono uscite aggiuntive.
- **R01:** tentativi di ritocco ImageGen non sufficientemente allineati, anche con guida esatta. Nessun candidato errato integrato: fondale originale conservato e passaggio allargato a y8–11, includendo la strada realmente dipinta. Audit conservato in `assets/prompts/r01-sentiero-alba-exit-raccordo-audit-v1.md`.

| Mappa | Soglia ovest | Soglia est |
|---|---|---|
| R01 | x0, y9–11 | x29, y8–11 |
| Bosco | x0, y9–11 | x29, y9–11; richiede Ada |
| Viale delle Fronde | x0, y8–10 | x27, y8–10; richiede Ada |
| Brumalta | x0, y11–13 | x35, y11–13; richiede Aurora |

## Verifiche

Nove test mirati passati su identità, ancoraggi e servizi; otto test passati sulle corsie delle uscite e sui flag conservati. Browser: sei apparizioni controllate in entrambi gli orientamenti e interazione mouse con Elia/Ada passate. Cinque passaggi su corsie aggiunte passati; la prima verifica del gate attendeva erroneamente un dialogo, mentre l’UI usa un toast: corretto il driver e confermato il messaggio di Ada con mappa invariata.

615 test dominio/persistenza, 111 Python, validatore e build passati. Percorsi di Brumalta fino a stazione, Centro e negozio provati con i comandi reali, screenshot ispezionati dopo chiusura della ricompensa tramite UI. Atlante NPC e fondale Brumalta decodificati offline dopo reload, senza richieste fallite o modifiche ai progressi. Pubblicazione e CI remota sono registrate in CI_STATUS. QA fisico, animazioni degli NPC, cast rimanente e resto della parità grafica restano aperti.
