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
