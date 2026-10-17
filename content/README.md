# Contenuti Veloria

`manifest.json` è la fonte unica di `contentVersion`, importata dai nuovi salvataggi e inclusa nel bundle offline. Incrementare `contentVersion` quando cambia la disponibilità o il comportamento dei contenuti giocabili; incrementare `manifestVersion` solo se cambia la struttura del manifest. La versione dello schema dei salvataggi resta indipendente e cambia soltanto quando cambia il formato serializzato.

Mappe, incontri, specie, mosse, quest, trainer e regole sono file versionati nei rispettivi cataloghi. `content/examples/` contiene fixture di validazione, non contenuti runtime né valori canonici.
