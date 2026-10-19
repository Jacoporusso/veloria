# Monorotaia dopo Circuito

## Ambito

Implementa il trasporto rapido previsto dal world design dopo P3. Prima rete: Brumalta, Petalora, Vetracielo e primo distretto di Ferraluce. Le città future e la funivia dopo P7 restano fuori da questa consegna. Non completa Ferraluce o la Palestra 4.

La gratuità del viaggio e la posizione dei terminali sono scelte di questa prima implementazione, non regole canoniche Pokémon. I percorsi pedonali e i relativi incontri restano disponibili.

## Uso nel gioco

Avvicinarsi al terminale con il simbolo del treno e premere A, E o Spazio. Senza `badge_circuito_awarded` il terminale spiega lo sblocco. Dopo Circuito mostra solo le altre città già visitate. Il menu usa icone, pulsanti nativi e il tema condiviso; tastiera, touch, Escape/B e annullamento sono supportati.

| Città | Terminale, in tile | Arrivo `metro_arrival` |
|---|---|---|
| Brumalta | 21,10 | 21,11 |
| Petalora | 24,13 | 24,14 |
| Vetracielo | 24,21 | 24,22 |
| Ferraluce | 24,21 | 24,22 |
| Portolume | 7,21 | 7,22 (`from_monorail`) |
| Acquariva, integrazione 0.3.87 | 6,22 | 7,22 (`metro_arrival`, rivolto a sinistra) |

Gli arrivi guardano verso il terminale, anche dopo una ripresa esattamente sullo spawn: a nord nelle prime cinque città, a sinistra ad Acquariva. Aster annuncia il servizio nella ricompensa di Circuito; Lea ne indica il terminale a sud-est della sua posizione. Le estensioni mantengono il requisito di visita: la monorotaia non apre Acquariva prima del percorso attraverso Delta e Canne. La funivia dopo P7 resta da implementare.

## Contratti e ampliamento

- Catalogo: `content/transit/monorail.v1.json`, schema `specs/schemas/transit.v1.schema.json`.
- Regole pure: `src/core/world/monorail.ts`. Il piano viene verificato anche alla conferma: sblocco, origine nella mappa corrente, destinazione esistente e città visitata. I flag dell’atlante e le prove di visita delle missioni usano la stessa fonte di `region-atlas.ts`.
- Tiled: oggetto `transit-terminal` nel layer `interactions`, proprietà `serviceId=monorail` e `stationId` del catalogo, collisione di una tile. Ogni metadata dichiara lo spawn d’arrivo. La rete non aggiunge false connessioni pedonali in `map.connections`.
- Per aggiungere una fermata servono catalogo, terminale/collisione e spawn nella nuova mappa. Nessun ramo per il nome della città nella scena o nel renderer. L’atlante deve già conoscere la mappa.
- Il viaggio riusa caricamento, camera, ingresso area e salvataggio delle transizioni normali. Un errore di asset conserva il punto d’origine e consente un nuovo tentativo. Viaggiare non cura, consuma PP, cambia RNG, paga monete o concede medaglie/ricompense.
- I dati sono inclusi nel bundle e le mappe/immagini nel precache esistente; non ci sono richieste API in partita.

## Verifica e limiti

Sei prove dominio e undici prove Python coprono sblocco, visite, origine, immutabilità, riferimenti, duplicati e arrivi sicuri. Due prove browser esercitano i quattro terminali, annullamento/movimento, tastiera, touch, portrait/landscape, errore di caricamento e riprova. Una prova di produzione viaggia e ricarica senza rete.

Le prove usano checkpoint preparati e non certificano una partita naturale né il bilanciamento. La QA su dispositivi fisici resta aperta. Esiti effettivi e integrazione GitHub sono registrati in `CI_STATUS.md`.
