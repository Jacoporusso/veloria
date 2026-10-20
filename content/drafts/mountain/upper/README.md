# R13 e Biancavetta — draft allineato alle immagini

Mappe isolate dal runtime, 40×30 celle da 32 px. Arte ispezionata sulle immagini generate R13 exec-4685548d-8c5d-4b4c-b29b-0c5949cc8e75.png e Biancavetta exec-2b7908dd-5fe2-4fec-ad56-136b4b660c31.png. Le coordinate seguenti sostituiscono il primo layout geometrico. Il floor è una maschera esplicita: tutte le celle esterne sono bloccate, inclusi cliff, acqua, tetti, alberi e pendii. I gradini dei percorsi rimangono percorribili. Non sono dichiarate superfici scivolose.

## R13

Asset veloria-r13-white-switchbacks-v1, assets/scenery/veloria-r13-white-switchbacks-v1.webp, terrainBase indice locale 0 con ground gid1. Dichiarazioni HD v5 e NPC v2 identiche ad Acquariva.

- Portale ovest (0,24) → Passobrina/from_r13; from_passobrina (1,24,right).
- Portale est (39,5) → Biancavetta/from_r13; from_biancavetta (38,5,left).
- Tornanti obbligati, rettangoli (x,y,w,h): (0,23,28,2), (26,22,4,3), (28,19,2,5), (29,16,2,5), (28,13,3,3), (12,13,18,2), (10,12,4,3), (11,6,2,8), (11,3,4,4), (14,4,26,2). Larghezza minima due celle lungo l'intera dorsale.
- Rami ai belvedere: (8,11,4,2), (6,10,4,2), (4,9,3,2), (4,8,2,2); ramo est (30,17,4,2), (32,16,4,3), (35,15,2,2).
- Habitat laterali ridotti alla vegetazione visibile: (8,10,2,2) e (32,17,2,2), tabella veloria/r13_snow_patch, chance 0,09. Entrambi raggiungibili e aggirabili.

## Biancavetta

Asset veloria-biancavetta-v1, assets/scenery/veloria-biancavetta-v1.webp, terrainBase indice locale 0 con ground gid1.

- Portale ovest (0,17) → R13/from_biancavetta; from_r13 (1,17,right).
- Palestra porta (20,6) → gym07_biancavetta/from_city; gradini liberi lungo x19..20 fino alla piazza; from_gym07 (20,8,down).
- Centro Pokémon porta/cure/deposito (7,13), approccio (7,14). Bottega porta/shop (14,13), approccio (14,14).
- Guida solida (32,15), approccio (32,14), dialogo non conclusivo sulla Risonanza.
- Segnale R14 solido (35,14), approccio (35,15). Nessuna uscita R14 e testo esplicito di termine prototipo dopo Nives.
- Funivia terminale solido (29,23), approccio e cable_arrival (29,24,up). Hotspot kind local-transport, networkId mountain_cable, stopId biancavetta; requisito medaglia e rotte nel network di trasporto.
- Case residenziali: accessi (7,7) e (30,8); scale e raccordi a ovest/est sono inclusi nella maschera.
- Piazza centrale circa (20,16), asse nord/sud largo almeno due celle, strada ovest y16..17, promenade est y14..15. L'accesso sud alla funivia segue il pavimento intorno al fabbricato senza passare sul tetto.

Test: node --experimental-strip-types --test tests/world/mountain-upper-draft.test.ts. Verifica spawns reciproci sicuri, uscite, servizi, maschere di esclusione, mainpath due celle, habitat laterali e solidi. Questa prova non sostituisce il playtest visuale in portrait/landscape dopo promozione.
