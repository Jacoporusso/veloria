# Ada: quattro viste di attesa

Il profilo `ranger-ada`, NPC `forest_ranger_ada` nel Bosco dei Veli, usa quattro immagini indipendenti. All’interazione Ada si rivolge verso la posizione reale del protagonista: sud, nord, ovest o est. Non vengono ruotate o specchiate immagini; non viene simulata una camminata.

## Asset e contratto

Sorgenti PNG raw1254×1254 RGBA e derivate WebP lossless: tutti i byte RGBA decodificati, inclusi quelli trasparenti, sono identici. I quattro prompt originali, ID output e riferimento di identità sono in [ada-idle-views-v2.json](../assets/prompts/ada-idle-views-v2.json). [Provenienza, hash e calibrazione](../assets/npc-idle-views-v1.json). Nessun crop, resize, pulizia alpha o ritocco raster manuale.

`appearances.v2.json` dichiara `idleViews` per direzione, con immagine, origine e dimensione di visualizzazione. Tutte le quattro immagini sono dichiarate anche nella MapDefinition di D01 e nel precache. I profili senza viste direzionali mantengono la posa esistente. Il validatore puro richiede copertura esatta delle quattro direzioni, asset distinti e noti, origine finita in[0,1] e dimensione positiva.

| Vista | Origine x/y | Dimensione quadrata |
|---|---|---:|
| Sud | .55423 / .87440 | 75.51 |
| Ovest | .50399 / .87281 | 77.60 |
| Est | .51754 / .87998 | 73.76 |
| Nord | .54944 / .89673 | 70.44 |

La calibrazione mantiene un’altezza ottica di circa56px e lo stesso punto piedi nel mondo. Non modifica tile, posizione NPC, collisione, evento o salvataggio. Ada non riceve il tween cosmetico di respiro: quel tween conserverebbe una scala della posa precedente e altererebbe le calibrazioni. Gli altri NPC mantengono il respiro quando abilitato.

## Sovrapposizione dei personaggi

La revisione della vista nord ha mostrato che il protagonista, aggiunto per ultimo al contenitore, copriva Ada anche stando più a nord. I valori `depth` dei figli di un Container richiedono ordinamento esplicito: il layer viene ora ordinato dopo l’inserimento del protagonista, il ridisegno, il cambio mappa e gli aggiornamenti della camminata. La regressione controlla l’ordine effettivo dei figli, oltre al valore della profondità: Ada davanti quando il protagonista è a nord, dietro quando è a sud.

## Verifiche e limiti

La prova dedicata parte da un solo checkpoint, cammina ai quattro lati di Ada e usa il pulsanteA. Controlla texture, origine, scala, punto piedi, assenza di flip e tween, coordinate e RNG invariati dal dialogo; acquisisce le quattro viste in portrait/landscape con preferenze animazione ridotta e completa. Il test del respiro di Elia resta separato.

Verifica finale nativa: tre casi passati (`.tmp/ada-layered.log`), comprendenti pose con ordine visivo corretto24,9s, respiro Elia1,8s, percorso/cura/due uscite R14 e ritorno44,2s. Schermate delle quattro viste riviste, con verifica portrait e dell’occlusione nord. Produzione offline: tre casi passati (`.tmp/ada-idles-offline.log`), primo accesso a tutte quattro le immagini di Ada, dialoghi sui quattro lati e reload senza rete; regressione console/ritorno D05 e prima decodifica dei28 fondali non iniziali. La prova di produzione completa anche la build finale TypeScript/Vite.

781 test dominio più31 persistenza passati; validatore636 asset/29 fondali/48 mappe passato. I nuovi test controllano sia dati malformati sia che ogni apparizione dichiari tutte le immagini, e verificano hash, dimensioni sorgente e calibrazione del catalogo. Cache v173, contenuti0.4.10; pubblicazione e CI da attestare dopo push.

Questa tranche collega le sole pose idle di Ada. Mancano fotogrammi autentici di camminata, transizioni e l’estensione agli altri47 profili; la prima tranche completa prevista dal documento67 resta aperta. Quattro texture1254² occupano circa24MiB RGBA prima di ulteriori copie GPU: il formato a immagini indipendenti è un pilota, non un budget da moltiplicare automaticamente per tutto il cast. La strategia per gli atlanti di movimento va verificata prima del rollout completo.
