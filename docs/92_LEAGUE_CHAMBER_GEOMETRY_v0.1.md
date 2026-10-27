# Sale della Lega: allineamento tra illustrazione e collisioni

Le cinque sale sono mappe 32×24, con celle di 32 pixel. La corte principale attraversabile occupa x6–25, y6–19; l'ingresso meridionale x14–17, y20–23. Il fondale include 20 pixel aggiuntivi a sud per il piede del personaggio, senza ampliare le collisioni.

La revisione delle illustrazioni v1 ha trovato pavimento apparentemente percorribile oltre i limiti laterali: circa 48 pixel per lato nella sala di Nerea, 35 nella sala di Brando, 40 nella sala di Luce e 38–47 nella sala del Campione. La sala di Silvo è più vicina alla pianta reale, con scarti visivi stimati di 4–9 pixel. Queste misure sono stime della transizione dei materiali, non segmentazioni automatiche certificate. La presenza di un fondale dedicato non costituisce accettazione della sua geometria.

## Prima sala: Nerea

L'illustrazione v3 mantiene acqua, cascate, ninfee, vetro e vegetazione, ma allinea i bordi della corte alla pianta reale. Le collisioni, gli accessi e la sequenza di campionato restano invariati. Il terminale di avanzamento rimane disegnato dal runtime. L'illustrazione viene usata anche durante la battaglia.

Il riferimento tecnico esclude solo i corpi temporanei del personaggio e del terminale: non modifica il Tiled pubblicato. Sono state scartate o rifinite candidate con pavimento troppo largo, bordo nord anticipato, spalle meridionali troppo alte e false uscite laterali. Prompt completi e output intermedi sono documentati in `assets/prompts/league_council01-illustrated-v3.md`. PNG raw invariato e derivato WebP lossless hanno pixel RGBA identici.

La prova della Lega include ora visita reale ai quattro angoli della corte e all'ingresso, screenshot in portrait e landscape, e verifica della texture effettiva nell'arena. Le altre quattro sale richiedono ancora la propria accettazione grafica; le correzioni di Nerea non attestano il completamento dell'intero gruppo.

Esiti locali: tre casi Chrome passati in 3,3 minuti. La prova della Lega ha completato i cinque avversari, interruzione e ripartenza, premio unico, ricaricamenti, cerimonia ed epilogo; le altre due prove hanno verificato i bordi camera. Review visiva degli angoli sud-ovest portrait e nord-est landscape effettuata. Validatore: 41 fondali con provenienza e legami validi. Due casi offline passati in 35,7 secondi: decodifica delle cinque sale e battaglia finale/epilogo da checkpoint; primo decode di tutti i fondali registrati. La prima battaglia di Nerea è stata giocata nel test online, mentre l'offline verifica il suo fondale come risorsa e gioca solo la finale. Build offline riuscita. Pubblicazione ancora da completare.

Il checkpoint delle battaglie usa una squadra deliberatamente forte e non certifica il bilanciamento di una campagna giocata dall'inizio.
