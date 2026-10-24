# Identità visive dei personaggi

`appearances.v1.json` registra le identità introdotte dal lotto illustrato: una descrizione narrativa, gli ID NPC/dialogo delle diverse apparizioni, il frame dell’atlante e l’ancoraggio dei piedi. Non identifica i personaggi in base al loro nome visualizzato.

Per aggiungere un’identità:

1. Verificare ruolo e caratterizzazione nei documenti e nei dialoghi; risolvere le discrepanze prima di assegnare l’immagine.
2. Registrare la sorgente e l’asset runtime nel registro degli asset, con prompt/provenienza e griglia dell’atlante.
3. Aggiungere un profilo con ID stabile, `npcIds`, `dialogueIds`, `frame` e `origin` normalizzata. Più apparizioni della stessa persona devono usare lo stesso profilo.
4. Nei Tiled assegnare `characterAppearanceId`, `sprite`, `spriteFrame`, `spriteOriginX` e `spriteOriginY` coerenti; dichiarare l’asset in ogni MapDefinition interessata.
5. Non spostare collisioni, interazioni o punti missione per compensare margini trasparenti: calibrare l’ancoraggio grafico dei piedi.
6. Eseguire i test delle identità e verificare nel browser la resa, l’avvicinamento e il dialogo nei due orientamenti.

Il renderer mantiene il comportamento precedente per gli NPC senza ancoraggi espliciti. Un’origine personalizzata deve fornire entrambe le coordinate finite fra 0 e 1. Gli studi in `unboundStudies` descrivono frame disponibili, non personaggi già collocati nel gioco.
