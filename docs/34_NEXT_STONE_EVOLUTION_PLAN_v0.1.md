# Prossima evoluzione ottenibile: Poliwrath

Stato22/10/2026: implementato in content0.3.116; roster runtime80 specie. Poliwhirl evolve in Poliwrath con Pietraidrica. Parametri, crescita, learnset HGSS e artwork derivano dalle fonti PokéAPI locali; nessuna mossa inventata. Il test naturale della quinta palestra resta distinto.

## Verifica dell’integrazione

L’importer legge i rami dichiarati nel manifest e trova le catene ufficiali dai record delle specie. Abilita soltanto corrispondenze dichiarate con condizioni supportate. Test dedicati coprono il nuovo ramo, l’esclusione dei rami non dichiarati e il rifiuto di oggetti non supportati.

Il test di dominio verifica consumo singolo, identità, livello, esperienza, PP, stato, deficit HP e ricevuta persistente dopo serializzazione. Il browser verifica anteprima, annullamento, conferma, cerimonia e decodifica dell’artwork; la suite esistente copre anche portrait/landscape e recupero dall’errore di salvataggio. Il nuovo artwork è nella cache PWA. Queste prove usano una squadra di integrazione e non dimostrano il bilanciamento naturale o un test offline completo.

## Scelta e fonti

Poliwag60 è incontrabile nelle tabelle del bosco, terrazze e Delta; il runtime abilita già Poliwag → Poliwhirl61 al25. Il riferimento importato contiene Poliwhirl → Poliwrath62 con Pietraidrica. L’oggetto `water-stone` è già acquistabile e il motore delle evoluzioni con oggetti gestisce conferma, annullamento, consumo, persistenza e cerimonia.

L’audit legge `content/battle/species.v1.json`, `progression.v2.json`, `evolution-reference.v1.json`, `item-evolutions.v1.json` e la cache PokéAPI. La catena33 e `pokemon-species-62.json` sono locali; `pokemon-62.json` e artwork runtime non lo sono al momento dell’audit. Questi dati non rendono Poliwrath giocabile e non provano la copertura del suo learnset HGSS.

## Importazione e gate

1. Dichiarare62 con template61 e gruppo artwork `stone-evolutions` nel manifest degli import. Recuperare ufficialmente il record Pokémon e importare parametri, categoria di crescita e learnset HGSS con gli strumenti esistenti. Nessuna statistica o mossa sostitutiva inventata.
2. Controllare gli apprendimenti realmente supportati, inclusi quelli di livello iniziale: fermare l’abilitazione se l’importer non trova una mossa supportata. Le mosse escluse devono restare nel rapporto degli effetti mancanti.
3. Usare `import_pokeapi_species_art.py --group stone-evolutions --fetch`, conservando sorgente, checksum, registrazione e file offline. Verificare il risultato prima di assegnare l’asset al target.
4. Estendere `import_item_evolutions.py` alla catena33. Oggi le catene10/67, le tre pietre e l’attesa di quattro rami sono esplicite nel codice: aggiornare le attese con prove delle fonti e della regola aggiunta, senza accettare automaticamente ogni condizione delle catene. Non alterare le soglie di livello o sostituire condizioni speciali.
5. Verificare importer --check senza rete, validatore, dominio, build; evoluzione da un Poliwhirl legale attraverso Zaino, anteprima/annullamento/conferma, consumo unico, identità/HP/PP, cerimonia, reload e artwork offline. Un checkpoint di integrazione non prova il bilanciamento naturale.

## Seguito distinto

Gloom44 → Vileplume45 e Weepinbell70 → Victreebel71 richiedono Pietrafoglia; Gloom44 → Bellossom182 Pietrasolare. I riferimenti di catene18/29 e gli endpoint degli oggetti sono nella cache, ma i due strumenti mancano dal catalogo runtime e i tre target richiedono parametri, learnset e artwork. Non presentarli come già ottenibili.

Le linee già incontrabili che richiedono amicizia, scambio, orario, oggetto tenuto, luogo o una mossa conosciuta restano un lavoro di meccaniche distinto. Il piccolo ampliamento con Pietraidrica non chiude il Pokédex001–251 o le altre evoluzioni.
