# Santuario delle Due Luci — capitolo0.3.94

## Stato

Integrazione locale in verifica, non ancora pubblicata.41mappe,39quest,16allenatori,10negozi,256asset; catalogo69specie/71mosse. La conclusione della ricerca sulla Risonanza non conclude la sfida sportiva: R16, Lega, finale ed epilogo restano da implementare.

## Accesso e geografia

Dopo la Medaglia Armonia, il padiglione del giardino a est della fontana di Concordia conduce al Santuario. Portale31,13, ritorno31,14: usa pavimento già presente, senza aprire percorsi su scogliere. La medaglia è verificata dal trigger; messaggio spiega il blocco prima di P8.

D06 è32×24 a celle32px. Entrata15,22, uscita14–17,row23. Corte chiara percorribile, acqua e vegetazione esterne bloccate. Le impronte seguono l’illustrazione reale: stazione naturale9,8 di2×2 (approccio9,10), rete21,8 di2×2 (21,10), console16,15 di1×1 sopra il plinto solido15–16,row14–15 (16,16), ricevitore14,4 di4×2 (16,6), Elia18,17 (18,18). Ogni interazione resta raggiungibile e l’uscita è sempre disponibile. Nessun habitat casuale nel Santuario: l’illustrazione presenta una corte di osservazione sicura; gli incontri facoltativi restano sul Passo delle Due Luci.

## Ricerca e consenso

Due letture indipendenti registrano ritmo naturale e amplificazione della rete. I dati spiegano i test non autorizzati di una divisione della ricerca e il contributo dei ricercatori al ripristino, senza introdurre una fazione malvagia estranea al progetto. Elia confronta entrambe le letture; riesame e rinvio non modificano il consenso. Soltanto la scelta esplicita registra `q_d06_restore_authorized`.

Regolatore dichiarativo `sanctuarybalance`: tre controlli0–2,27configurazioni. Flusso naturale GRADUALE(1), amplificazione CONTROLLATA(1), sincronia CONDIVISA(2); iniziali2/2/0. È un puzzle qualitativo narrativo, non una simulazione fisica. Le impostazioni persistono, possono essere ripristinate e richiedono VERIFICA EQUILIBRIO esplicito. Un solo stato è bilanciato; nessun effetto viene assegnato dal semplice accesso al menu.

## Conferma e ricompensa

Verifica → `q_d06_balance_restored`; luce del ricevitore cambia tramite la decorazione generica `resonance-beacon` e `activatedFlag`. Poi si esamina il ricevitore a nord → `q_d06_receiver_confirmed`. Il rapporto a Elia assegna soltanto allora `q_resonance_restored`,1000monete e2Iperpozioni, una volta. La rete resta attiva e accompagna il ritmo naturale. Nessun portale fittizio verso la Lega.

## Architettura e verifiche

Mappa v2, Tiled, quest, dialoghi con scelte e regolatore nei cataloghi esistenti. Non viene aggiunta logica del Santuario al motore di battaglia o al salvataggio. Atlante, diario, cachev115 e manifest0.3.94 aggiornati. Illustrazione originale ImageGen, fonte e checksum in `assets/prompts/sanctuary-chapter-v1.md`.

Test dominio: prerequisiti, letture in entrambi gli ordini, consenso, ricevitore obbligatorio, premio unico, persistenza; geometria reale e27stati del regolatore. Browser, offline e pubblicazione vanno attestati in CI_STATUS dopo il completamento delle prove. Il bilanciamento naturale dell’intera avventura resta aperto.

## Evidenza locale

429prove dominio+16persistenza e88Python passate; validatore globale e build riusciti. Scenario browser completo40,5s, regressione Concordia1,2m; primo accesso offline con ripristino/ricevitore/premio unico/ritorno17,3s (30,8s con build). Portrait e landscape esaminati. Pubblicazione e Linux ancora da confermare nel CI_STATUS.
