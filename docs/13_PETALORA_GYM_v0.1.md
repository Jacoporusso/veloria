# Palestra di Petalora — prima versione giocabile

## Accesso e perimetro

Contenuti 0.3.65: dal viale nord di Petalora si entra nel giardino di Dalia. La Medaglia Aurora apre l’accesso; archivio e vivaio di Radicelmo restano facoltativi. La palestra è un giardino all’aperto con ciliegi e canali; non introduce un nuovo interno o edifici esclusivi della città.

`veloria/gym02_petalora`, 26×26, usa asset illustrati esistenti e metadati Tiled. Spawn `from_city` (13,24), ritorno sud (12–14,25) verso Petalora `from_gym02` (18,1). La soglia nord di Petalora è larga tre caselle. Collisioni separate per confini, tronchi e basi delle stazioni.

## Prova d’irrigazione

| Stazione | Casella | Prerequisito | Stato assegnato |
| --- | --- | --- | --- |
| Sorgente del giardino | (5,21) | `q_petalora_visited` | `gym02_water_source_open` |
| Deviazione ovest | (6,15) | sorgente aperta | `gym02_water_west_open` |
| Deviazione est | (20,10) | deviazione ovest | `gym02_water_east_open` |
| Terrazza dei Ciliegi | (13,6) | deviazione est | `gym02_irrigation_solved` |

Ci si avvicina e si preme A. I dialoghi spiegano i prerequisiti mancanti; gli eventi si applicano alla chiusura. I canali cambiano da asciutti a pieni secondo `activatedFlag`. Sei fioriture compaiono alla soluzione con `visibleWhenFlag`. Stato e progressione sono nel motore quest, non nel renderer; la ripresa conserva acqua e fiori senza rigiocare i passaggi. Ripetere una stazione non assegna progressi o ricompense ulteriori.

La sfida di Dalia richiede il flag di soluzione, indicato anche nel Tiled tramite `battleRequiredFlag`. `battleLockedMessage` fornisce la spiegazione specifica; nessuna condizione per Petalora è codificata nella scena mondo.

## Dalia e Medaglia Corolla

Squadra: Oddish 12 con Assorbimento, Profumino e Acido; Bellsprout 13 con Frustata e Sonnifero. Parametri e mosse provengono dal catalogo locale PokéAPI/HGSS già implementato; il validatore verifica disponibilità per specie e livello. Il profilo IA è quello esistente `gym_beginner`.

La lezione segue il world design: copertura di tipi ed effetti delle mosse. Il testo distingue gli attacchi di tipo Veleno dall’avvelenamento: Acido può abbassare la Difesa Speciale, Sonnifero può addormentare. Non si consiglia un Antidoto per curare il sonno.

Vittoria: 650 monete dal flusso allenatori, flag `trainer_gym02_dalia_defeated`, quest che assegna `badge_corolla` e `badge_corolla_awarded` soltanto con arrivo a Petalora e puzzle risolto. Banner con feedback di Dalia ed emblema floreale originale; il medagliere legge i due ID realmente guadagnati. Nessun premio viene attribuito dall’SVG o dal banner.

Il catalogo medaglie dichiara `emblem`: Aurora e Corolla condividono il sistema visivo ma hanno simboli distinti. Il nome della ricompensa nel diario deriva dal catalogo, senza condizioni specifiche per la prima medaglia.

## Verifica e lavoro restante

- Test di dominio su ordine, blocchi, ripresa, premio unico, legami dei flag alle visuali e raggiungibilità BFS.
- Prova browser a DPR 2: ingresso, sfida bloccata, azione fuori ordine, ripresa dopo la sorgente, fioritura, vittoria, banner in portrait/landscape, due medaglie dopo caricamento, dialogo successivo senza secondo premio e ritorno in città.
- Prova di produzione senza rete dal prologo fino alla Corolla, con ripresa del puzzle e consultazione del medagliere.
- Squadre preparate nelle prove d’integrazione: Charmeleon 16 nel browser e Charmeleon 30 nel percorso tecnico offline. Non dimostrano il bilanciamento naturale dopo Mira né la parità fra i quattro starter.

Restano playtest naturale con tutti gli starter, verifica su smartphone fisico e rifinitura artistica del giardino: i canali sono geometrie funzionali. Le sovrapposizioni delle indicazioni con l’HUD sono corrette nei contenuti 0.3.67 tramite proiezione DOM e posizionamento che evita i controlli; il feedback missione è più compatto. Il percorso successivo e la Palestra 3 di Vetracielo non sono ancora disponibili; il piano è in `14_VETRACIELO_CHAPTER_PLAN_v0.1.md`.
