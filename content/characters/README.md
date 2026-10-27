# Identità visive dei personaggi

`appearances.v2.json` registra il catalogo immagini e le identità associate: ogni profilo dichiara esplicitamente `assetKey`, gli ID NPC/dialogo delle apparizioni e l’ancoraggio dei piedi; `frame` è presente per le immagini in atlante e può mancare per un’immagine singola. `assets` contiene descrittori `kind: "image"` con chiave e percorso, più `atlas` (`columns`, `rows`) quando l’immagine è un atlas. Gli `unboundStudies` dichiarano anch’essi `assetKey`: sono studi non collocati e non assegnano identità NPC. Non identificare personaggi in base al solo nome visualizzato.

Per aggiungere un’identità:

1. Verificare ruolo e caratterizzazione nei documenti e nei dialoghi; risolvere le discrepanze prima di assegnare l’immagine.
2. Registrare la sorgente e l’asset runtime nel registro degli asset, con prompt/provenienza; dichiarare l’asset una volta in `assets` e includere la griglia solo se è un atlas.
3. Aggiungere un profilo con ID stabile, `assetKey`, `npcIds`, `dialogueIds` e `origin` normalizzata. Per un atlas, associare il frame corretto; per un’immagine singola, omettere `frame`. Più apparizioni della stessa persona devono usare lo stesso profilo.
4. Nei Tiled assegnare `characterAppearanceId`, `sprite`, `spriteFrame`, `spriteOriginX` e `spriteOriginY` coerenti; dichiarare l’asset in ogni MapDefinition interessata.
5. Non spostare collisioni, interazioni o punti missione per compensare margini trasparenti: calibrare l’ancoraggio grafico dei piedi.
6. Mantenere univoca la coppia `assetKey`/`frame` fra i profili; un frame omesso identifica l’immagine singola associata alla chiave. Verificare che ogni profilo e studio punti a un asset dichiarato e che il file esista.
7. Eseguire i test delle identità e verificare nel browser la resa, l’avvicinamento e il dialogo nei due orientamenti.

Il renderer mantiene il comportamento precedente per gli NPC senza ancoraggi espliciti. Un’origine personalizzata deve fornire entrambe le coordinate finite fra 0 e 1. Gli studi in `unboundStudies` descrivono asset/frame disponibili, non personaggi già collocati nel gioco.

Un profilo può dichiarare `idleViews` con quattro viste indipendenti `up`, `down`, `left`, `right`: ciascuna contiene `assetKey`, `origin: {x,y}` e `displaySize`, altezza dell'immagine completa in worldpx. La scala resta uniforme anche per immagini non quadrate. La vista `down` deve corrispondere all’asset e all’origine base del profilo/Tiled. Tutte le immagini devono essere dichiarate sia nel catalogo sia nelle MapDefinition di ogni apparizione. `validateNpcIdleViews` controlla direzioni, riferimenti distinti, origine e dimensioni; `assets/npc-idle-views-v1.json` conserva sorgenti, hash e calibrazione. Le superfici statiche di rendering vengono ridotte entro512px con rapporto esatto, senza cambiare i file originali; preparazione e cambio posa riusano le stesse chiavi.

All’interazione il renderer sceglie la vista rivolta al protagonista e mantiene lo stesso punto piedi nel mondo; non ruota o specchia le immagini. Questi profili non ricevono il tween cosmetico di respiro, che sovrascriverebbe le scale specifiche delle pose. Una vista idle non è un ciclo di camminata: i fotogrammi di movimento vanno prodotti e dichiarati separatamente. Prima di estendere il set ad altri profili verificare anche il costo delle texture e l’ancoraggio nei due orientamenti.
