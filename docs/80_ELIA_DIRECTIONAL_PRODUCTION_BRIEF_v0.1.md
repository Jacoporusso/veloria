# Elia — brief per le pose direzionali

Audit delle sorgenti eseguito in parallelo con agente Luna; nessuna nuova posa è accettata o collegata dal solo brief.

Primo set di quattro candidati prodotto e mantenuto privato in `.tmp/elia-idles-candidates`. Revisione aperta sulla trasparenza effettiva e sulla borsa: la vista posteriore iniziale la mostra su un lato anatomico diverso dalla frontale. Nessun candidato è registrato, calibrato o pubblicato prima di risolvere questi punti e verificare il composito nel gioco.

## Identità condivisa

Il profilo `professor-elia` in `content/characters/appearances.v2.json` collega `prof_elia`, `concordia_elia` e `d06_elia`. Dialoghi e catalogo la identificano come Professoressa Elia, ricercatrice anziana: il vecchio concept maschile è già corretto nel runtime v3 e non deve tornare come riferimento. Fonti narrative: GDD e `docs/57_NPC_IDENTITIES_AND_EARLY_PASSAGES_v0.1.md`.

Fonte visiva effettiva: cella in alto a sinistra di `assets/sources/veloria-npcs-v3.png`, prompt/provenienza in `assets/prompts/npc-identities-v3.md`. Capelli ricci argento raccolti morbidi, occhiali rotondi, camice corto crema, maglia salvia, pantaloni petrolio, cintura e borsa marroni. Conservare silhouette, età percepita e palette. Non inventare una barba, un nuovo attrezzo o un gesto; il dettaglio botanico tenuto nella vecchia illustrazione non è un oggetto obbligatorio del profilo.

## Quattro immagini indipendenti

Viste sud, ovest, est e nord disegnate separatamente, corpo intero, piedi visibili, fondo trasparente e posa neutra. Nessun flip, rotazione artificiale o camminata simulata. Coerenza di occhiali/naso sui fianchi, raccolto dei capelli, camice e borsa sul retro. La posizione esatta della borsa e i dettagli minori non sono fissati dal catalogo: vanno risolti coerentemente con l’immagine approvata, senza trasformarli in nuova narrativa.

L’origine corrente `.6953,.9863` appartiene alla vecchia cella atlas. Le nuove immagini richiedono misurazione e calibrazione individuali, con baseline dei piedi e altezza ottica stabili. Il caso Ada (`docs/72_ADA_DIRECTIONAL_IDLE_v0.1.md`) è un precedente di metodo, non una tabella di origini/scale da copiare. Riduzione movimento non deve sostituire una direzione con quella frontale.

## Presenze e accettazione

Laboratorio Borgofonte:12,7, `prof_elia`, starter e fossili. Concordia:29,10, `concordia_elia`, confronto delle letture e piano. Santuario:18,17, `d06_elia`, consenso e rapporto. Le tre presenze devono mantenere una sola identità e le interazioni reali; non spostare NPC o collisioni per adattarli alle immagini.

Verificare le quattro direzioni di avvicinamento in una presenza rappresentativa, le tre presenze narrative, entrambi gli orientamenti, preferenze movimento, occlusione/depth e prima visita offline. Confrontare ogni candidato nel gioco prima di registrarlo e pubblicarlo. Le quattro idle non completano la camminata di Elia o il redesign del cast.
