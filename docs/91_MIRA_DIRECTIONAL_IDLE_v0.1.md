# Mira: quattro pose idle direzionali

Le quattro immagini indipendenti sono collegate al profilo condiviso `gym-leader-mira` e alla sola presenza di Mira nella Palestra di Brumalta. Il sud resta la vista base di Tiled. Le altre viste vengono scelte in base alla posizione del protagonista quando interagisce; non cambiano collisioni, dialoghi, puzzle o battaglia.

## Fonti e revisione

La sola figura usata come riferimento d’identità è quella in alto a sinistra, frame 0, in `assets/sources/veloria-gym-leaders-a-v1.png`. Le immagini Elia e Nilo forniscono solo lo stile pittorico 2D. Prompt integrali, output ImageGen, viste scartate e hash sono registrati in `assets/prompts/mira-idle-views-v1.json` e `assets/npc-idle-views-v1.json`.

I PNG sorgente sono raw RGBA da 1024×1536 e non sono stati ritagliati, ridimensionati o ritoccati. Le copie runtime WebP usano compressione lossless e decodificano agli stessi pixel RGBA. `assets/ASSET_REGISTER.csv` collega le otto risorse al prompt e alla provenienza.

Durante la revisione ovest è stata ridisegnata per mostrare il lato anatomico sinistro e la spilla sul bavero sinistro. Est è stata corretta per nascondere il cinturino e i suoi anelli dal fianco destro vicino; resta visibile la tasca cargo destra. Nord mostra il retro senza spilla, con cinturino a sinistra dell’immagine (fianco anatomico sinistro) e tasca a destra. Nessuna vista è stata specchiata.

## Calibrazione

Ogni `displaySize` mantiene circa 56 world pixel di altezza ottica usando il bounding box con alpha almeno 128. L’origine x segue il baricentro alpha dei piedi nella fascia inferiore di 50 pixel; y usa l’ultima riga visibile dei piedi.

| Vista | Origine x/y | Altezza immagine |
|---|---|---:|
| Sud | .56165 / .96680 | 58.55 |
| Ovest | .50589 / .96745 | 58.71 |
| Est | .51916 / .97266 | 58.16 |
| Nord | .49981 / .97331 | 57.81 |

## Verifiche

`tests/world/npc-identities.test.ts` verifica identità, asset, Tiled, hash e provenienza. `tests/e2e/mira-directional-idle.spec.ts` esercita interazione e ancoraggio da tutte le quattro direzioni nei due profili di movimento; il caso Mira in `tests/e2e/offline.spec.ts` verifica anche il caricamento offline. I test mirati identità/idle sono passati (58/58) e la validazione registro media (6/6); due casi Chrome passati (reduce/no-preference, quattro lati, entrambe le orientazioni e reload), più un caso di primo accesso offline passato. Review visiva effettuata su est portrait e nord landscape. Suite completa locale: 788 test dominio e 31 persistenza passati. Le pose sono idle, non animazioni di camminata.
