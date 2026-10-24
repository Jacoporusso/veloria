# Confusione: indicazione strategica condivisa — v0.1

Runtime0.3.130, cachePWA151. I dettagli delle mosse che possono confondere spiegano che sostituire il Pokémon elimina la confusione. Lo stesso descrittore è condiviso da lotta, schede e apprendimento; il suggerimento dipende da `inflictedConfusionChance`, non dal nome della mossa. Nessuna modifica a probabilità, potenza o regole del motore.

La frase descrive il comportamento già presente in `applySwitch` del motore. Il caso esistente in `canonical-effects.test.ts` verifica l'eliminazione della confusione al cambio. Quattordici test esistenti su descrizioni/effetti canonici passati; build TypeScript/Vite passata. Nessuna nuova suite o verifica fisica del telefono dichiarata per questa modifica testuale. Resta l'avviso preesistente sulla dimensione dei chunk Phaser.

La prima sfida naturale a Selene è stata eseguita sul runtime129 prima della modifica e resta una sconfitta; [report completo](playtests/2026-10-24-selene-first-attempt.md). Il suggerimento non dimostra da solo un miglioramento misurato del bilanciamento.
