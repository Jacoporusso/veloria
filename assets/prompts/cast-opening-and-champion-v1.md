# Atlante apertura e Campione — prompt e provenienza

**Stato:** integrato nel catalogo e nelle quattro presenze NPC del lotto0.3.141, con compositing e rendering runtime verificati. L’immagine è un atlante d’uso statico, non un set di animazione a quattro direzioni.

## File e provenienza

- PNG sorgente: `assets/sources/veloria-cast-opening-and-champion-v1.png`
- WebP lossless: `public/assets/sprites/veloria-cast-opening-and-champion-v1.webp`
- SHA-256 PNG: `54A1A5E337CBB6D861181C2DF3AAA3CC11EEEB910F9E664AFCDBC0626DC20897`
- SHA-256 WebP: `190F2B955817BD565C5837CF6957DDF4815220AE1897166DE631D109598688E2`
- Dimensioni: 1254×1254; quattro celle uguali 627×627, ordine: Sera, Timo, Rami, Enea.
- PNG e WebP decodificano in RGBA identico pixel per pixel, incluso il colore dei pixel completamente trasparenti. WebP creato senza resize, crop o correzioni dell’alpha.
- Alpha PNG: intervallo 0–255; i quattro angoli sono alpha 0. Tutte le sagome alpha≥128 sono contenute nella propria cella con margine da ciascun bordo; nessuna figura attraversa la croce centrale.
- Generazione e revisione effettuate con il tool built-in ImageGen. Reference usate solo per stile e scala: `assets/sources/veloria-npcs-v3.png`, `assets/sources/veloria-gym-leaders-a-v1.png`, `assets/sources/veloria-gym-leaders-b-v1.png`. Non sono stati riutilizzati i loro personaggi.
- Composizione e bordi approvati nel compositing Chrome di root e nel rendering runtime; i bordi colorati del viewer alpha non rappresentano il risultato reale.

## Fonti canoniche e proposte

| Cella | Identità/ruolo attestati | Proposta grafica (non canonica) | Genere/età nelle fonti |
|---:|---|---|---|
| 0 | **Sera**, `npcId=trainer_route01_a`, allenatrice facoltativa del Sentiero dell’Alba. Il dialogo `sera_route01` dice che si allena prima di arrivare a Brumalta, offre una sfida e, dopo la sconfitta, consiglia di riposare a casa. Squadra: una specie ID 16 al livello 3 (`content/trainers/r01_sera.trainer.json`). | Giacca corta chiara e verde muschio, pantaloni da sentiero, scheda percorso al cinturino. Sagoma raccolta e attenta. | Genere, età e aspetto non specificati; la presentazione visibile nell’immagine è una proposta, non un fatto della trama. |
| 1 | **Timo**, `npcId=trainer_route01_b`, allenatore facoltativo sullo stesso percorso. Il dialogo `timo_route01` vanta che la sua squadra conosce il sentiero e invita a una sfida; la vittoria prevede una stretta di mano. Squadra: due specie ID 161 e 19, livello 4 (`content/trainers/r01_timo.trainer.json`). | Giacca a vento corta bicolore ruggine/blu, maniche arrotolate, zaino e fischietto. Sagoma più ampia e posa più energica di Sera. | Genere, età e aspetto non specificati; la presentazione visibile nell’immagine è una proposta, non un fatto della trama. |
| 2 | **Rami**, `npcId=r03_path_guide`, guida alle Terrazze del Muschio. Il dialogo omonimo indica i gradoni chiari fra felci, il seme da trovare e l’uscita verso Radicelmo. | Sovracamicia/mantella da escursione verde bosco e terra, cordino-mappa, rotolo di carta e dettaglio di felce. Profilo distinto dalla ricercatrice Ada. | Genere, età e aspetto non specificati; la presentazione visibile nell’immagine è una proposta, non un fatto della trama. |
| 3 | **Enea**, `npcId=league_champion`, Campione di Veloria (`content/trainers/league_champion.trainer.json`). Il suo dialogo dice che la squadra rappresenta il viaggio; la cerimonia celebra tutti i compagni. La squadra canonica ha i tre starter evoluti, Ampharos, Steelix e Dragonite, ai livelli documentati in `docs/28_LEAGUE_CHAMPIONSHIP_v0.1.md`. | Mantello corto/soprabito petrolio e avorio, sei segni di cucitura e medaglione semplice; postura calma e accogliente. Nessuna corona né posa da antagonista. | Genere, età e aspetto non specificati. I capelli argento e la presentazione più matura che si vedono nell’immagine sono scelte dell’art direction, non informazioni canoniche. |

**Identità Tiled:** `public/tilemaps/r01_sentiero_alba.tmj` associa Sera/Timo ai rispettivi `npcId` e dialoghi; `public/tilemaps/r03_terrazze_muschio.tmj` associa Guida Rami a `r03_path_guide`; `public/tilemaps/league_champion.tmj` associa Enea a `league_champion`. I ruoli e gli ID sono evidenza; silhouette, vestiti, età apparente, accessori e presentazione di genere restano proposte.

## Prompt di generazione

> Create a completely NEW original 2×2 atlas of four original full-body human RPG NPCs, true transparent square RGBA canvas, one centered figure in each equal square cell, front orthographic south-facing, complete head and both shoes, no overlap or center-cross bleed, no text or scenery. Follow the three attached images only for warm soft painted 2D storybook style and game-scale character readability; never copy their designs.
>
> Reading order: top-left Sera, top-right Timo, bottom-left Rami, bottom-right Enea. Keep equal cells and generous transparent central gutters.
>
> Sera is a separately identified optional route trainer (trainer_route01_a) on Sentiero dell’Alba; her dialogue says she trains before reaching Brumalta and invites a battle. Her gender, age and appearance are not canonically specified. Propose a friendly, focused trail trainer: compact silhouette, oat and moss practical layers, folded route card clipped at belt; natural gender-open presentation.
>
> Timo is a separate optional trainer (trainer_route01_b), says their team knows the trail better, invites a challenge, and shakes hands after victory. Gender, age and appearance are not specified. Distinguish with a broader short russet/faded-blue windbreaker, rolled sleeves and a small trail whistle; different face/hair/body silhouette; warm competitive, not hostile.
>
> Rami is the route guide on the Moss Terraces (r03_path_guide). Dialogue directs the player up pale stone steps among ferns to a guarded seed, then east toward Radicelmo. Gender, age and specific occupation are not specified. Propose an angular moss-and-earth hiking overshirt/cloak, crossing map cord and one rolled trail map or fern marker. Welcoming practical guide, visually distinct from researcher Ada.
>
> Enea is Veloria’s Champion (league_champion). Canon says the six-member team represents the journey and the ceremony celebrates the whole team: three evolved starters, Ampharos, Steelix, Dragonite. Gender, age and appearance are not specified. Balanced memorable champion silhouette, short petrol-and-ivory mantle or tailored coat, six subtle stitch marks and one simple medallion, gracious confident neutral stance. No crown, royal regalia, antagonist stance, horns, scales or dragon costume.
>
> Make the four faces, hair masses, proportions, shapes and accessories distinctly different, not palette swaps. Natural gender-open styling without inference. Soft painted illustration, gentle linework, warm highlights, rounded readable shapes and subdued fabric detail. Real alpha transparency, not dark/checkerboard. Avoid panels, borders, shadows on ground, glow, chromatic aberration, red/green fringe, stray pixels, text/logos, extra people, scenery, pixel art, photorealism, 3D, perspective, side/back view, cropped limbs, duplicate faces or unsupported lore.

## Prompt di revisione margini

> Edit this exact 2×2 character atlas only to improve safe margins and cell framing. Preserve the same four character identities, faces, hair, clothing, palette, accessories, expressions, poses, reading order, painterly style, square canvas, and genuine alpha transparency. Do not redesign or replace any person.
>
> Recompose each person smaller and centered entirely inside their existing equal square cell, scaling the full figure uniformly to about 76–80% of the cell height. Put each figure's highest hair pixel at least 8% of its cell below the top edge and lowest shoe pixel at least 8% above the bottom edge. Keep left/right silhouette extrema at least 8% inside the cell side edges. Preserve complete hands, accessories, and both shoes. No part of any figure crosses the center vertical or horizontal boundary. Maintain consistent scale and a common foot baseline within each row. Leave clear empty transparent gutters along all four sides of every cell, including the center cross.
>
> Atlas reading order stays exactly top-left Sera, top-right Timo, bottom-left Rami, bottom-right Enea. Use the original art as the identity source. The canvas stays a true transparent RGBA square with four equal square cells, no dividers, no panels, no floor, no background. Output a clean 2×2 sprite atlas only, no text or labels.

## Bbox e ancoraggi misurati

Bbox per cella locale `(x0,y0)–(x1,y1)` basato sulla soglia alpha≥128. L’ancora orizzontale è il punto medio dei centri delle due scarpe, misurati come i due gruppi opachi separati nella fascia inferiore del 15%; l’ancora verticale è il bordo inferiore della silhouette opaca (`y1 / 627`). Valori normalizzati e arrotondati a quattro decimali:

| Frame | Personaggio | Bbox alpha≥128 | Centri scarpe (px) | Anchor `(x,y)` |
|---:|---|---|---:|---:|
| 0 | Sera | `(228,85)–(463,602)` | 297.0 / 425.5 | `0.5762, 0.9601` |
| 1 | Timo | `(147,90)–(444,603)` | 241.5 / 389.0 | `0.5028, 0.9617` |
| 2 | Rami | `(181,50)–(523,569)` | 292.0 / 424.5 | `0.5714, 0.9075` |
| 3 | Enea | `(139,51)–(512,569)` | 251.0 / 377.5 | `0.5012, 0.9075` |

Le scarpe di Rami ed Enea terminano più in alto della prima riga per lasciare il margine trasparente previsto. Le ancore sono associate ai rispettivi profili e binding runtime; piedi e cornici verificati nelle quattro presenze in portrait e landscape.


## QA e vincolo della squadra di Enea

Compositing QA approvata da root in `.tmp/opening-cast-compositing.png`: le quattro figure sono pulite e complete. I profili e gli sprite sono stati associati solo agli NPC elencati sopra; Rami resta `r03_path_guide`, senza alias verso Ivo o Oren.

Il dialogo di Enea presenta la squadra come rappresentativa del viaggio e la cerimonia come celebrazione dell’intero gruppo. Il trainer file attuale comprende Venusaur, Charizard, Blastoise, Ampharos, Steelix e Dragonite; i dati attuali non sono stati modificati in questo lotto. Poiché Veloria ora è limitata alla Gen I (151 specie), l’eventuale revisione della squadra di Enea e dei relativi slot battaglia va trattata in un’attività separata; questa illustrazione descrive il ruolo narrativo e non aggiunge o canonizza specie.
