# Controllare GitHub Actions

GitHub CLI (`gh`) e' gia' installata sul PC. Il repository e' privato: serve un account con accesso.

Da PowerShell, nella cartella del progetto:

```powershell
powershell -File tools/check_github.ps1 -UseStoredLogin
powershell -File tools/check_github.ps1 -UseStoredLogin -RunId 39019222088 -FailedLogs
```

`-UseStoredLogin` usa il login conservato da `gh auth login`: ignora temporaneamente `GH_TOKEN` e `GITHUB_TOKEN`, che possono contenere credenziali scadute. I valori vengono ripristinati in `finally`, senza stamparli o modificare l'ambiente permanente. Omettere l'opzione se si vuole usare un token di ambiente valido.

L'output distingue `in_progress`, `cancelled`, `failure` e `success`: una pipeline in corso non e' una verifica superata. `headSha` permette di confrontare il risultato con `git rev-parse HEAD`.

## Diagnosi browser

Il workflow conserva screenshot, contesti d'errore e trace Playwright per sette giorni nell'artifact `browser-diagnostics-<run>-<attempt>`, anche quando un test fallisce. La prova offline viene eseguita dopo una build riuscita anche se la suite online fallisce, mantenendo comunque la pipeline rossa.

Scaricare gli artifact dal riepilogo della specifica esecuzione su GitHub Actions, oppure:

```powershell
gh run download <run-id> --repo Jacoporusso/veloria --dir test-results-e2e-ci
npx playwright show-trace test-results-e2e-ci/<artifact>/<cartella-test>/trace.zip
```

Il percorso preciso dipende dal test. Se le variabili di ambiente contengono un token scaduto, i comandi `gh` diretti richiedono la stessa rimozione temporanea degli override usata dall'helper.

## Correzione prima installazione PWA — 17 ottobre 2026

La run `39021590968` ha fallito la prova offline con `Execution context was destroyed` durante il primo `controllerchange`. Ora la prima attivazione del service worker prende controllo della pagina senza un ricaricamento superfluo; gli aggiornamenti successivi ricaricano la pagina una sola volta. La prova attende il controller con `waitForFunction`, che sopravvive a eventuali navigazioni di aggiornamento, e mantiene la verifica rigorosa di tutte le risorse MVP in cache.

## Riallineamento scenari al nuovo avvio — 17 ottobre 2026

La run 39028733856 ha concluso 24 test browser con successo e tre fallimenti. E2E-02 assumeva un blocco sulle letture di Elia, mentre il requisito dell’uscita è lo starter; E2E-12 ed E2E-07 non chiudevano il nuovo riepilogo del capitolo nelle loro partite preparate. Le prove ora seguono i prerequisiti effettivi e chiudono il riepilogo con il pulsante del giocatore, verificandone la persistenza. Esecuzione locale mirata: 3/3 passati. Il nuovo risultato remoto va verificato separatamente.

## Diagnosi della run 39031159986

Quattro scenari online e quello offline falliti; non è una pipeline verde. E2E-03 ed E2E-04 mantenevano il vecchio avvicinamento alla soglia nord: dopo l’ampliamento il secondo passo a destra avveniva già in R01, falsando le coordinate e la successiva traversata. Ora usano la destinazione geometrica con arresto al cambio mappa. E2E-09 ha lo stesso budget dei percorsi iniziali completi. I lunghi test di progressione e offline usano prefers-reduced-motion; le prove dedicate agli effetti mantengono le animazioni complete. Gli altri errori erano scadenze durante la traversata o la battaglia: la verifica remota resta necessaria.

Verifica locale successiva: 7/7 regressioni browser passate (Cattura da tastiera, Enter/Spazio sul riepilogo, Pozione, HP/PP/XP, box e medaglia). Il risultato della nuova run GitHub va verificato separatamente.

Anche il percorso PWA offline è passato localmente (1/1, rete disattivata, immagini starter, incontri, cura e Medaglia Aurora). Build, 116 test dominio, 16 persistenza, 20 test Python e validatore dei contenuti passati. Resta la verifica su smartphone fisico.

## Iterazione visiva 0.3.25 — verifiche locali

117 test del dominio e 16 di persistenza passati; validatore contenuti (45 asset registrati) e 20 test Python passati. Presentazione della battaglia verificata a 390×844,320×568,844×390. Pidgey visibile e copertura immagini 20/20 verificata; ridimensionamento mediante ResizeObserver condiviso dall’app e dalla fixture. Sequenza sensore→Ada→uscita verificata tramite controlli reali su fixture isolata dichiarata, senza incontri casuali; scala del terreno e layout portrait/landscape controllati. Questo test non sostituisce il playtest naturale e la QA su telefono fisico.

La run precedente 39033589562 ha superato la suite online ma è scaduta nel percorso offline a 240 secondi, durante la consegna delle rilevazioni nel bosco. Il percorso lungo conserva tutte le asserzioni; budget del test portato a 8 minuti, step a 9 e job a 30 per ottenere un esito completo sul runner Linux. Questo adeguamento non è una conferma di pipeline verde o di prestazioni su smartphone.

Prova offline locale finale con gli asset 0.3.25: passata 1/1 in 1,9 minuti (build inclusa nel comando, 2 minuti complessivi). Gli atlas nuovi sono dichiarati e precacheati. Verifica su telefono fisico e nuova run remota restano separate.
