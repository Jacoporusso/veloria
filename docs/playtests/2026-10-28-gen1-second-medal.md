# Progressione GenI dalla prima alla seconda medaglia

Un caso Chrome passato in6minuti sul runtime0.4.30, partendo dal backup realmente guadagnato nel playtest della prima medaglia della stessa data. Importazione tramite UI; confrontati squadra, inventario, denaro, RNG, flag e medaglie. SHA256 del backup iniziale: `2b1e8f9a610b616f13d0bc5c01a27247ef193a7ea61a9e518e2a13c5cfdcb7c7`. Nessuna iniezione di esperienza, risorse, coordinate o progressi.

Comando: tutte le variabili PLAYTEST rimosse, poi `PLAYTEST_RESUME_FIRST_BACKUP` impostato sul backup privato guadagnato e `PLAYTEST_CONTINUE_PETALORA=1`; esecuzione di `tests/playtests/natural-prologue.spec.ts` con `playwright.playtest.config.ts`, output `.tmp/natural-gen1-0430-second-medal`. Il driver espone solo un riferimento osservativo e agisce tramite DOM/touch/tastiera.

Percorso: uscita reale dalla palestra di Mira, cure a Brumalta, seme sulle Terrazze del Muschio, archivio di Leda a Radicelmo con consumazione del seme e premi verificati, titolo/ripresa, Salita dei Petali, vittoria su Nila, Petalora, incontri reali per prepararsi al livello massimo13 della squadra di Dalia, riposi e acquisti, quattro controlli dell'irrigazione e vittoria in palestra.

Risultato: medaglie Aurora e Corolla, Charmander14 a25/34PS, Spearow2 a13/13PS, Paras8 a23/23PS;1050monete, due Pozioni, tre Poké Ball e una scheda archivio. Dopo titolo/ripresa squadra, medaglie, inventario e denaro coincidono con lo stato della vittoria. Esportato dalla UI e verificato anche il backup della seconda medaglia. Nessun pageerror.

Report durevole `2026-10-28-gen1-second-medal-report.json`, SHA256 `964b18f56fd6ed55b433e3fad26720481be1d619787ac5c7db4c6cbe431a4ded`. Backup sintetico e screenshot restano nell'output privato; non sono dati dell'utente. Questa prova estende la continuità GenI corrente fino a Dalia; non prova gli altri starter, le successive sei palestre, la Lega o un dispositivo fisico. I checkpoint storici GenII non sono usati per questa attestazione.
