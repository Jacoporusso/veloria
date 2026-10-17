# Veloria — Art direction e produzione asset (v0.3)

## 1. Reference approvata

La mappa in `assets/concept/Veloria_World_Map_Concept_v0.1.png` definisce **l'atmosfera desiderata**. Particolare riferimento all'area di **Petalora**: ciliegi rosa, architetture tradizionali eleganti, cascate, terrazze verdi, ponti e luminosità calda. Estendere la stessa cura a natura, città moderne e neve, senza copiare direttamente lo stile proprietario o i singoli sprite di altri giochi.

**Proposta di direzione:** HD pixel art a qualità di concept, ma con asset di gameplay ottimizzati e leggibili. Viste isometriche nella mappa regionale **non obbligano** a una prospettiva isometrica nel gioco: il gameplay consigliato è **ortogonale 2D dall'alto**, per movimento e collisioni semplici.

## 2. Biomi e palette orientative

| Area | Impressione visiva | Elementi ambientali chiave |
|---|---|---|
| Borgofonte | caldo, rassicurante, verde rurale | tetti chiari, ruscelli, giardini, laboratorio leggermente tecnologico |
| Bosco dei Veli | verde profondo, monumentalità | alberi altissimi, vegetazione stratificata, muschi, raggi di luce, ombra |
| Brumalta | naturalità e modernità | edifici piccoli in vetro/legno, parchi urbani, passerelle pulite |
| Petalora | poetico, rosa, oro, acqua | ciliegi, petali animati, ponti, terrazze, piccoli santuari originali |
| Vetracielo | acciaio chiaro, blu, verde | grattacieli, monorotaia, parchi verticali, luci notturne |
| Ferraluce | tecnologico sobrio | torri energetiche, condotti, strutture industriali sostenibili |
| Portolume | luminoso mediterraneo | acqua turchese, moli, spiagge, skyline, fari |
| Acquariva | verde acqua / riflessi | laghi, canneti, pontili, canali |
| Biancavetta | bianco/blu con luci calde | neve, conifere, funicolari, vetro, chalet |
| Concordia | sublime, armonico | architettura futuristica integrata in pareti rocciose e vegetazione |

## 3. Standard game-art PROPOSTI

- **Tile base:** 32×32 pixel (da confermare con giocabilità mobile).
- **Personaggio:** footprint di collisione ~1 tile; sprite figurativo circa 32×48 o 48×64 a seconda del look.
- **Animazioni player:** idle e camminata nelle quattro direzioni; minimo 4 frame per direzione in prima fase; più frame in fase polish.
- **Layer Tiled:** `ground`, `terrain_detail`, `collision`, `shadows`, `characters`, `canopy_overhead`, `interactions`, `triggers`.
- **Asset atlases:** raggruppati per area per ridurre memoria e draw calls.
- **Erba alta, neve, petali e particelle:** gli effetti decorativi sono disattivabili o riducibili dalla qualità animazione; mai indispensabili per comprendere un puzzle. Le patch d’erba animate seguono i trigger Tiled di tipo `encounter-zone` senza alterarne incontri o collisioni.
- **Acqua del Bosco:** la pozza usa una silhouette originale in pixel art con bordo muschio/roccia; i riflessi restano delicati e si fermano in modalità animazioni ridotte. Le collisioni rimangono negli oggetti Tiled, separate dall’immagine decorativa.
- **UI:** pulsanti abbastanza grandi, simboli + testo, contrasto leggibile su cielo/foresta/acqua.

## 4. Asset list MVP (production checklist)

### Borgofonte

- 2 varianti di suolo, 5 erbe/cespugli, 3 alberi, rocce, corsi d'acqua, ponticello, recinti, tetti e pareti per 4–6 edifici.
- Laboratorio ricercatrice (esterno/interno semplice), camera del protagonista (interno), 3–5 NPC, avatar giocatore.
- Primo prototipo degli interni: camera con legno miele, intonaco crema e tessuti salvia; laboratorio con la stessa architettura, pavimento chiaro e strumenti botanici in vetro/ottone. Fondali originali ImageGen con collisioni e hotspot separati in Tiled; prompt archiviati in `assets/prompts/borgofonte-interiors-v1.md`. Sono asset di prototipo in attesa di accettazione visiva umana, non una modifica alla direzione approvata.

### Sentiero dell'Alba

- Erba alta animata, sentiero, cartelli, rocce, alberi/cespugli, punti d'interazione/oggetti, segnaposto ostacoli.

### Bosco dei Veli

- 2–3 alberi monumentali con chioma sovrapposta al personaggio, tronchi, radici, funghi, muschi, ponti, acqua, raggi luminosi, foglie.

### Brumalta

- Centro cura, negozio, Palestra, illuminazione parchi, vetrate, panchine, fontane, selciato, NPC urbani.

### Battaglia/UI

- Schermata di selezione starter (grafica da includere **solo con diritti verificati**), campi battaglia per bosco/prato/città, elementi UI, effetti attacco generici originali, cursori, transizioni, feedback danno e cattura.
- Fondale originale del bordo-bosco in pixel art, palette ridotta per mobile e riusabile dalle mappe di prato e foresta tramite `battleBackgroundKey`; i fondali di città e palestra restano da produrre.

### Audio

- Tracce originali/licenziate per borgo, percorso, bosco, città e combattimento; SFX di menu, interazione, raccolta oggetti, colpi, cura, successo.

## 5. Perimetro diritti

L'illustrazione regionale è un **concept del progetto**; non dimostra licenza per sprite Pokémon, effetti, loghi o colonne sonore di altri titoli. Mantenere in `assets/ASSET_REGISTER.csv` registro con `asset_id,filename,creator,source_url,license,usage_permission,status`. Nessun asset esterno entra nella build senza revisione. Per un futuro rilascio pubblico, sostituire elementi Pokémon con creature/nomi originali o ottenere le autorizzazioni necessarie.

## 6. Asset production priority

Prima **un quadrato giocabile di Borgofonte con placeholder coerenti**, poi avatar/animazioni, collisioni, erba e vegetazione alta, Brumalta, UI combattimento. Gli screenshot di concept servono come guida visiva, non come asset di gioco da ritagliare in modo casuale.
