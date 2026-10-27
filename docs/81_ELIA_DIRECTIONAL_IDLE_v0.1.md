# Elia: quattro pose direzionali nelle tre presenze

Quattro immagini indipendenti collegate al profilo condiviso `professor-elia`: laboratorio di Borgofonte, Concordia e Santuario. Identità conservata dalla cella v3: ricercatrice anziana, ricci argento raccolti, occhiali rotondi, camice crema, maglia salvia, pantaloni petrolio e borsa marrone. Nessuna nuova posizione, collisione, scelta narrativa o ricompensa.

## Produzione e revisione

Audit e produzione iniziale delegati a Luna, selezione e verifica runtime eseguite dal coordinatore. Prompt integrali, output e hash in `assets/prompts/elia-idle-views-v1.json` e `assets/npc-idle-views-v1.json`. Otto media registrati: quattro raw PNG1024×1536 e quattro WebP lossless con RGBA decodificato identico. Nessun crop, resize o ritocco dei pixel.

Il primo retro metteva la borsa sul lato anatomico opposto alla frontale. Il primo edit correggeva la borsa ma faceva partire la tracolla dalla spalla opposta; un secondo edit conserva borsa e tracolla sul lato sinistro di Elia. I due retro precedenti restano candidati privati non collegati. L’alone dell’anteprima è RGB sotto alpha0 nei punti esterni controllati: il composito nativo su pavimento chiaro conferma l’assenza di un fondale opaco. Pixel isolati ad alpha1 non sono stati cancellati.

## Proporzioni e piedi

`displaySize` esprime l’altezza dell’immagine completa in worldpx. Il renderer ora applica una scala uniforme dopo il cambio texture, preservando il rapporto2:3 delle immagini di Elia. Le pose quadrate di Ada conservano la stessa scala precedente. Lo stesso helper è usato nella creazione e nel cambio direzione.

| Vista | Origine x/y | Altezza immagine |
|---|---|---:|
| Sud | .54417 / .96159 | 59.65 |
| Ovest | .51820 / .97396 | 58.79 |
| Est | .49964 / .97786 | 58.16 |
| Nord | .50073 / .96159 | 58.83 |

Calibrazione iniziale da bbox alpha128 e baricentro opaco negli ultimi50px della figura, con altezza ottica circa56worldpx; confermata nelle schermate del gioco. Ogni posa mantiene il punto dei piedi Tiled. Nessun flip o tween di respiro sulle immagini direzionali, anche con animazioni complete. Il test del respiro resta su Nilo statico a Borgofonte.

## Verifiche e limiti

814 test dominio/persistenza passati. Cinque casi Chrome distinti passati: quattro direzioni nel laboratorio, due preferenze movimento e due orientamenti; dialoghi reali a Concordia e Santuario; regressione delle quattro pose Ada; respiro statico Nilo. La prima aspettativa del nome nel Santuario usava «Professoressa Elia», mentre il dialogo esistente mostra «Elia»: corretta la sola aspettativa, ripetizione passata. Nessun testo del gioco modificato. Log `.tmp/elia-native-review.log` e `.tmp/elia-sanctuary-final.log`; ripetizione finale dei tre casi Elia con controllo esplicito del blocco sul collider passata in33,6s (`.tmp/elia-final-poses.log`).

Tre casi produzione offline passati (`.tmp/elia-offline-final.log`): prima visita Ada e prima visita Elia con quattro immagini mai caricate prima, dialoghi da ogni lato, reload e RNG invariato; regressione guida fossili. Build passata; validatore664 asset/34 fondali/48 mappe passato. Cache v179, contenuti0.4.16. Pubblicazione da attestare dopo il push.

Le texture Elia occupano circa24MiB RGBA decodificate; il precedente budget per atlanti/rilascio delle texture resta da affrontare prima di estendere il formato full-resolution a tutto il cast. Ora due profili hanno idle direzionali;46 restano da produrre e verificare. Camminate e transizioni animate non sono completate dalle sole quattro idle. Revisione completa delle48 mappe e campagna naturale restano aperte.
