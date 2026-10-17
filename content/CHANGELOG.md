## veloria-content-0.3.18

- Applied the user's child-friendly UI direction: sky/cream shell, coral/lilac/blue tactile controls, larger rounded typography, brighter dialogue and journal panels, and distinct battle command colours with labels and keyboard focus indicators.
- Shared HTML UI tokens live in `src/ui-theme.css`; the map illustration style, collision grid, quest rewards and save schema are unchanged.
- Updated the PWA chrome and project-owned vector icon colours; PNG icons are rendered from those SVG sources. Shell cache v32 includes the refreshed build and icons.

## veloria-content-0.3.17

- Added a four-direction, sixteen-frame traveler walk atlas and continuous tile interpolation; collision, interaction and save coordinates stay unchanged.
- Added a journey HUD and accessible journal with nine milestones derived from existing flags, real quest rewards, collection and badges. Completion cards are deferred until battle dismissal when necessary.
- Replaced geometric battle creatures with illustrated atlas entries for Caterpie, Metapod, Butterfree, Weedle, Kakuna, Beedrill, Spinarak and Mareep. Other twelve species, including the four starters, still need authorized illustrations: image generation rejected those sheets, and unavailable art stays explicit rather than loading broken URLs.
- Added event-driven attack, damage, healing, capture, KO and level feedback; HP transitions, real XP progress and a battle reward summary. Enlarged touch commands and provided compact portrait and landscape layouts. Battle resolution and balance remain unchanged.
- Registered three generated assets and precached them in shell v30. Exact prompts and generation coverage are recorded in `assets/prompts/character-modernization-v1.md`; no save migration.

## veloria-content-0.3.16

- Added original bedroom and laboratory interiors in Borgofonte, with reciprocal doors, furniture collisions, research hotspots, and a resting service in the bedroom.
- Moved Elia into the laboratory: the existing starter choice and research-reading quest now take place indoors. Existing saved parties, flags and exterior map IDs remain compatible.
- Registered and precached both room backdrops; generation prompts are recorded in `assets/prompts/borgofonte-interiors-v1.md`. Maps remain prototype art pending human visual acceptance.
- Fixed healing persistence: cleared statuses are omitted from healed creatures, and checksums use the same representation for optional undefined object fields as JSON backups. Browser healing scenarios now start from validated wounded/poisoned records.

## veloria-content-0.3.15

- Added an original Brumalta city-park vista and an interactable directional sign to the Viale delle Fronde, making the forest-to-city transition readable in the Tiled map.

## veloria-content-0.3.14

- Added original community lodge and herbalist sprites for Radicelmo, replacing Brumalta's reused facades; both are registered and included in the offline shell cache.

## veloria-content-0.3.13

- Added the playable R03 moss terraces and Radicelmo village, with reciprocal travel links and Aurora Badge access from Brumalta.
- Added a time-of-day woodland encounter table, Leda's seed archive quest, a village healing service and herb shop, and a greenhouse landmark.
- Registered and precached an original Radicelmo greenhouse sprite; the route and village reuse the established forest tileset and battle backdrop.

# Content changelog

## Unreleased

- Borgofonte's exit to the Sentiero dell'Alba now stays closed until the player chooses a starter with Elia.

## veloria-content-0.3.12

- Added an original, compact forest-edge battle background referenced by the grassland and forest map definitions. The fallback arena remains available for maps without a declared background.

## veloria-content-0.3.11

- Added an original Bosco dei Veli pond sprite overlay and a reusable Tiled `decorations` layer for declared scenery images. The pool remains non-walkable; the existing water shimmer sits above the artwork.

## veloria-content-0.3.10

- Added deterministic water highlights to the Bosco dei Veli pool. They shimmer at full animation quality and remain faint and static with reduced motion.

## veloria-content-0.3.9

- Added reduced-motion aware grass sway to the four tall-grass encounter patches on the Sentiero dell’Alba. Visual areas reference Tiled encounter zones and do not alter gameplay.

## veloria-content-0.3.8

- Added a data-driven Bosco dei Veli firefly effect profile. Motion quality settings keep reduced mode static and lighter.

## veloria-content-0.3.7

- Added a persistent full/reduced movement animation setting that defaults to the operating system's reduced-motion preference.

## veloria-content-0.3.6

- Added versioned original procedural music themes for each MVP area and battle type, with a persistent volume control.

## veloria-content-0.3.5

- Added original 192×160 shop and gym facade sprites for Brumalta and declared them in the map metadata, Tiled objects, asset register, and offline shell cache.

### 0.3.19 — Avvio del viaggio

- Introduzione narrativa versionata con nome allenatore e indicazioni al laboratorio.
- Requisito della scelta starter dichiarato nel relativo catalogo e applicato all’uscita da Borgofonte.
- Profilo nome e flag del prologo compatibili con i salvataggi v2 esistenti.

## 0.3.20 — 17/10/2026

- Catalogo mosse versione 2: effetti statChanges per Growl, Tail Whip e Defense Curl; regole prototipo esplicite nel decision log.

## 0.3.21 — 17/10/2026

- Matrice tipi Gen II–V completa, sorgenti/hash registrati; profili IA versionati e collegati agli allenatori.

## 0.3.22 — 17/10/2026

- Regole di emergenza per esaurimento PP, parametri versionati nel ruleset prototipo v4. Nessun nuovo slot o campo persistente.

## 0.3.23 — 17/10/2026

- Guida iniziale condizionata dai flag, testo esplicito sulle uscite e soglia nord di Borgofonte estesa sul vialetto. Artwork starter locali richiesti dall’utente per il prototipo privato.
