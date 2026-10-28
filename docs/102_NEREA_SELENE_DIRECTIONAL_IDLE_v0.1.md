# Nerea di Portolume e Selene: viste direzionali

I profili `gym-leader-nerea-portolume` e `gym-leader-selene` usano quattro illustrazioni idle indipendenti. Nerea di Portolume resta distinta dall'omonima componente della Lega. Identità, costume e accessori derivano dai rispettivi ritratti dell'atlante B; la borsa di Nerea resta sul lato anatomico sinistro e quella di Selene sul destro. La prima candidata ovest di Selene è stata scartata per asimmetrie errate e sostituita.

Produzione tramite ImageGen integrato. Originali PNG 1024×1536 conservati senza ritocchi in `assets/sources/`, derivati WebP lossless in `public/assets/sprites/`. Prompt, candidati e provenienza: `assets/prompts/nerea-gym-idle-views-v1.json` e `assets/prompts/selene-idle-views-v1.json`. Nessuna posa specchiata. Il runtime applica la calibrazione uniforme condivisa, senza cambiare collisioni o salvataggi.

Quattro casi Chrome passati, due per personaggio: tre approcci reali, portrait/landscape, movimento ridotto e normale, orientamento e reload. Il lato nord è già bloccato dalla geometria delle due palestre: i test confermano il blocco senza aprire passaggi artificiali. Quattro risorse per personaggio decodificate anche al primo accesso offline; interazioni offline verificate sui tre lati raggiungibili. La vista nord è verificata come risorsa, non come interazione giocata.

Review degli originali e degli screenshot runtime completata. Queste sono pose idle; non costituiscono cicli di camminata. Inventario attuale: nove profili direzionali su 48 identità, 39 ancora da migrare.
