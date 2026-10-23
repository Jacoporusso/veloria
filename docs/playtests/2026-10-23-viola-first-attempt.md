# Viola: primo tentativo con la squadra guadagnata

Runtime0.3.118,23/10/2026. Ripresa tramite importazione UI del backup costiero allenato: Chinchou21 in testa con398 XP, Charmeleon23 e Rattata3/7,890 monete, due Pozioni e due Sfere. Squadra, inventario, denaro e cursore RNG confrontati con il checkpoint prima delle azioni.

Comprata una Superpozione al mercato per700 monete, usando il selettore quantità. Raggiunta Viola sul sentiero e accettata la sfida tramite dialogo. Nessun livello, compagno, strumento o vittoria aggiunto artificialmente. Politica del driver: priorità alla stima di danno visibile, strumenti curativi sotto metà HP, Superpozione se mancano almeno35 HP o non restano Pozioni; sostituzione automatica dopo un KO. Nessuna scelta basata sul comando futuro dell’avversario.

## Esito osservato

**Sconfitta in14 turni**. Tentacool24 e Krabby24 sconfitti; Chinchou25 avversario resta a39 HP. Consumate due Pozioni e una Superpozione. Chinchou guadagna343 XP per Tentacool, Charmeleon333 per Krabby; entrambi conservano questi progressi dopo la sconfitta. Nessuna ricompensa di1050 monete o flag vittoria assegnato.

Il primo Chinchou scende da62 a32 HP dopo due Acido. La politica sotto-metà non cura a32/62; Presa di Krabby infligge32 e lo manda KO al terzo turno. Il resto della squadra abbatte Krabby ma non il terzo avversario. Sono limiti di questo tentativo e di questa politica, non una prova che tutte le strategie disponibili falliscano.

Il prototipo cura automaticamente la squadra dopo la sconfitta; gli HP pieni del backup finale non vengono interpretati come vittoria. Finale: Chinchou21 con741 XP, Charmeleon23 con1282 XP, Rattata3/7;190 monete, nessuna Pozione/Superpozione e due Sfere. Quattro medaglie; Viola ancora disponibile. RNG finale166312726. Backup esportato attraverso l’app e verificato con checksum e confronto esatto di squadra/inventario/denaro con il report.

Il driver è passato in34,7s (35,8s totali), avendo registrato ed esportato correttamente l’esito negativo. **Nerea non è stata affrontata**: il ramo si interrompe dopo la sconfitta di preparazione. Report e backup hanno prefisso `2026-10-23-natural-viola-first-attempt-` in questa cartella. Nessun errore JavaScript.

## Seguito

Valutare cure anticipate, mosse di stato, cambi manuali e compagni disponibili; Dario è ancora disponibile sul percorso precedente. Non confondere il test di integrazione della palestra con Quagsire45 con il bilanciamento di questa squadra naturale. La pianificazione di Viola/Nerea è nel driver `PLAYTEST_NEREA_CHALLENGE=1`, combinato con `PLAYTEST_RESUME_NEREA_BACKUP`.

## Correzione UI emersa dal controllo

Content0.3.119 sostituisce gli ID inglesi nella borsa di lotta con nomi italiani forniti dal catalogo dal controller proprietario. Mostra quantità e recupero HP/cura dello stato. Le meccaniche restano definite dalle regole della battaglia; la scena non importa o scrive salvataggi. Test browser reale: SFERA×3, POZIONE×2/+20 HP, SUPERPOZIONE×1/+50 HP e ANTIDOTO×1/cura veleno, portrait/landscape e consumo singolo. Le sei prove della borsa/icone/catture/ricompense e la build sono passate. Questa correzione non cambia il risultato di Viola o il suo bilanciamento.
