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
