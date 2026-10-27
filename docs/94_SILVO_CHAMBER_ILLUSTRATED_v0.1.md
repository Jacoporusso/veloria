# Sala di Silvo: arboreto della Lega

L'illustrazione v3 conserva il tema botanico della seconda sala: alberi intrecciati, fiori bianchi e lilla, vetrate verde menta e luce calda. Il pavimento centrale è più sobrio e segue la pianta reale; il terminale del campionato rimane un oggetto disegnato dal runtime, senza una seconda copia nel fondale.

La revisione più precisa della v1 ha smentito la prima stima favorevole dei bordi: la superficie apparentemente percorribile si estendeva circa36–44 pixel mondo oltre i lati e circa36 a nord. Perciò la sala non è stata approvata solo perché aveva già un'illustrazione dedicata. Le collisioni non sono state allargate per inseguire l'immagine.

Il nuovo fondale deriva da una guida delle collisioni effettive e da un riferimento tecnico di materiali. Le ripetizioni e i contorni provvisori sono stati rifiniti con ImageGen integrato. PNG raw invariato; WebP lossless con RGBA identico. Prompt, scarti e output sono in `assets/prompts/league_council02-illustrated-v3.md`; hash e binding sono in `assets/map-parity-v2.json`.

Tre casi Chrome passati: visita reale ai quattro angoli e all'ingresso nelle due orientazioni, risorse conservate dopo reload, battaglia touch con Silvo, premio e avanzamento a Brando; bordi camera superiori e inferiori in portrait e landscape. Review visiva effettuata agli angoli sud-ovest portrait e nord-est landscape. Il checkpoint salta la prima vittoria con una fixture esplicita e usa una squadra forte: non è una prova di bilanciamento della campagna naturale. Validatore:42 fondali con provenienza e binding validi. Due casi offline passati: primo decode dei fondali registrati; risorse delle cinque sale e battaglia finale/epilogo da checkpoint. La lotta di Silvo viene verificata online, mentre l'offline per questa sala verifica il fondale. Build offline riuscita. Pubblicazione da completare.

Restano da accettare le sale di Brando, Luce ed Enea. La loro esistenza nel catalogo non prova l'allineamento grafico.
