# Evoluzioni botaniche e mosse ufficiali — 0.3.127

## Contenuti disponibili

| Compagno | Strumento | Evoluzione |
|---|---|---|
| Gloom | Pietrafoglia | Vileplume |
| Gloom | Pietrasolare | Bellossom |
| Weepinbell | Pietrafoglia | Victreebel |

Le due nuove pietre sono nella bottega delle pietre di Radicelmo, con lo stesso accesso dopo la Medaglia Corolla. Costano3000 monete ciascuna: prezzo dell'economia Veloria, dichiarato nel catalogo e non attribuito a PokéAPI. Nomi italiani e categoria evolutiva sono verificati dai record ufficiali locali; il catalogo evoluzioni registra anche endpoint e checksum degli oggetti.

L'evoluzione passa dallo Zaino: scelta del compagno, anteprima, annullamento o conferma, consumo singolo e cerimonia recuperabile dopo reload. Identità, livello, XP, mosse, PP, stato e deficit HP sono conservati; entrambe le forme restano registrate nel Pokédex. Nessuna soglia di livello viene inventata per le evoluzioni con pietra.

## Catalogo e fonti

83 specie e81 mosse supportate. Parametri e curva di crescita dei target derivano dai loro record ufficiali; learnset selezionati HeartGold/SoulSilver. Megaassorbimento usa il recupero del50% del danno, Fogliamagica la proprietà di precisione infallibile già supportata dal motore. Tutti gli83 learnset sono stati rigenerati: le specie già presenti ricevono i nuovi apprendimenti soltanto ai livelli ufficiali. Le mosse conservate dai Pokémon esistenti non vengono riscritte.

Gli artwork autorizzati sono registrati nel manifest `assets/pokeapi-botanical-artwork-v1.json`, nel registro asset e nella cache PWA, con PNG sorgenti e WebP runtime senza perdita. Fonti e diritti restano attribuiti ai rispettivi titolari. Importer e validatore lavorano offline dai record con checksum.

Il roster001–251 resta incompleto.564 apprendimenti con effetti non ancora supportati sono conservati nel rapporto sorgente, comprese mosse dei nuovi target: non vengono sostituiti con mosse inventate. Il sottoinsieme implementato non equivale a una simulazione completa HGSS.

## Verifiche

- 558 test di dominio e persistenza passati; tre nuovi rami verificano consumo, identità, PP/stato, ramo alternativo e ricevuta. I controlli delle mosse confrontano parametri e apprendimenti con tutti i record sorgenti.
- 111 test Python passati; importer evoluzioni verifica nomi/categoria/registrazione delle pietre e rifiuta alterazioni dei nomi ufficiali.
- Validatore, provenienza/registro asset e build TypeScript/Vite passati.
- Tre prove browser tramite negozio e Zaino: Vileplume/Victreebel portrait, Bellossom landscape. Acquisto, annullamento, consumo, artwork, cerimonia ripresa dopo reload e registrazione Pokédex passati in26,2s. Screenshot portrait e landscape controllati visivamente.
- Primo utilizzo dei tre artwork senza rete nella PWA passati in2s (15,4s inclusa build).

I checkpoint delle evoluzioni sono fixture di integrazione; la prova naturale della quinta medaglia è documentata separatamente. QA fisico Android/iOS e bilanciamento completo restano aperti.
