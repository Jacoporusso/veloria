# Controllo delle regole storiche HGSS

PokéAPI rimane la fonte di specie, nomi, statistiche, learnset e parametri. Alcuni testi di effetto mescolano versioni o si contraddicono: la presenza di una mossa nel file generato non prova che il suo comportamento sia corretto.

Per risolvere le contraddizioni è stata consultata l’implementazione primaria del simulatore Pokémon Showdown, [regole Gen IV alla revisione49875bc](https://github.com/smogon/pokemon-showdown/blob/49875bcdd698a21c6d3dccfdd23f581afcd27228/data/mods/gen4/moves.ts). Nessun codice della libreria è incorporato nel runtime: riferimento per controlli indipendenti delle meccaniche, distinto dai dati PokéAPI.

| Caso | Criterio verificato |
|---|---|
| Inibitore |4–7 turni: la descrizione breve PokéAPI diceva1–8, quella completa4–7. |
| Rotolamento |Cinque azioni, con potenziamento da Ricciolscudo; nessuna durata casuale2–5. |
| Calcinvolo/Calciosalto |Contraccolpo Gen IV basato sul danno teorico e limitato dagli HP massimi del bersaglio, anziché metà degli HP massimi dell’utilizzatore. |
| Aromaterapia |Cura stati maggiori, non confusione; il testo PokéAPI disponibile dichiarava entrambi. |

Il primo test di Riposo costruiva una mossa artificiale corretta ma non verificava la riga importata, che risultava priva di effetto. Aggiunto un controllo sulla definizione generata e sul risultato in lotta. I test delle meccaniche devono utilizzare anche il catalogo reale, oltre alle fixture sintetiche di isolamento.
