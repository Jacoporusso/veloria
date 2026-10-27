# Atlante leggibile e superfici NPC — 0.4.18

La legenda dell'atlante diventa una scelta interattiva: Doni, Pesca e Incontri mostrano solo i relativi simboli. Nodi dei luoghi e collegamenti vengono nascosti durante il filtro. Il tocco di un simbolo apre la pianta locale con un solo punto; Tutti i punti ripristina la regione e Sei qui ripristina la posizione corrente. L'accesso dal diario continua a usare il prossimo oggetto effettivo della missione, senza spostare il giocatore. Il velo scuro passa al 55% sulla regione e al 46% sulla pianta locale.

Prima di creare gli attori direzionali, il renderer prepara superfici statiche con lato massimo 512, mantenendo esattamente il rapporto fra gli assi: Ada 512×512, Elia 340×510. La sostituzione riusa le chiavi esistenti; pose successive e ricostruzioni non duplicano le texture. Atlanti e immagini già preparate vengono ignorati. Nessun ingrandimento; rapporti non rappresentabili entro il limite restano originali. Sorgenti PNG, WebP, trasparenza, metadati e hash degli asset restano invariati.

Le otto superfici passano da circa 48 MiB a 6,65 MiB come area RGBA teorica. Questo numero non misura il consumo complessivo del browser o della GPU. Rimangono aperti il ciclo di vita delle texture delle mappe, gli altri 46 profili direzionali, le camminate e la revisione completa delle 48 mappe.

Verifiche locali: 787 test dominio e 31 persistenza passati. Sette casi Chrome passati: filtri e isolamento pesca, prossimo punto dal diario, tre presenze Elia, quattro direzioni Ada e regressione del respiro statico Nilo. Le verifiche delle pose controllano anche dimensioni reali delle superfici canvas, proporzioni, piedi, profondità, dialoghi e stato persistito. Screenshot portrait e landscape prodotti; review visiva del punto pesca e di Elia nel laboratorio effettuata. Build verificata, avviso dimensione chunk Phaser ancora presente.

Cache PWA v181; contenuti 0.4.18. Ricevuta di pubblicazione e prove offline in CI_STATUS.md.
