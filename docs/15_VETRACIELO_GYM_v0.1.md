# Palestra di Vetracielo — Terrazza delle Linee

**Contenuti:** 0.3.70 · **Stato:** prima versione giocabile; bilanciamento naturale e revisione umana della grafica ancora da svolgere.

## Accesso e spazio

Parla con Lea nella Piazza della Monorotaia, poi entra dalla scalinata centrale della stazione: soglia (19–21,16), ritorno `from_gym03` (20,17). Il gate richiede `q_vetracielo_orientation`, ottenuto dopo l’arrivo con Corolla. L’accesso usa il contratto esistente delle mappe, senza condizioni nuove in WorldScene.

`veloria/gym03_vetracielo` misura 30×30 caselle da 32 px. Il fondale originale ImageGen quadrato conserva le proporzioni; architettura e parapetti sono collisi. Il centro rimane navigabile; console e personaggio sono runtime, non disegnati nel fondale. Entrata `from_city` (15,28), uscita (13–17,29), senza riattivazione involontaria al caricamento.

## Prova e progressione

| Passo | Oggetto | Coordinate | Prerequisito | Flag |
| --- | --- | --- | --- | --- |
| 1 | Linea Giardini | 7,23 | orientamento di Lea | `gym03_line_gardens_active` |
| 2 | Linea Vetro | 23,19 | Giardini | `gym03_line_glass_active` |
| 3 | Linea Cielo | 15,15 | Vetro | `gym03_lines_connected` |
| Sfida | Aster | 15,10 | tre linee collegate | `badge_circuito_awarded` |

I dialoghi spiegano le azioni fuori ordine e la destinazione successiva. Numero, colore e segno di spunta rendono lo stato riconoscibile anche senza distinguere i colori. Il salvataggio conserva ogni passo. L’attivazione riguarda il quadro di controllo: non introduce viaggi rapidi o movimento dei treni.

## Sfida e premio

La lezione documentata è immunità Terra e gestione della Velocità. Nome Aster, medaglia, livelli e composizione della squadra sono decisioni di contenuto originali del prototipo; non sono nomi o allenatori ufficiali.

- **Voltorb 16:** Scintilla, Sonicboom, Azione.
- **Magnemite 17:** Tuonoshock, Tuononda, Ferrostrido, Azione.
- **Premio unico:** 850 monete + Medaglia Circuito, con emblema SVG originale, banner, commento di Aster e persistenza nel medagliere. Ripetere il dialogo non apre una seconda sfida.
- **Preparazione accessibile:** Wooper sulle foglie di R05 offre Terra; gli altri tipi e le cure restano utilizzabili. Nessun requisito di possedere una singola specie o di avere un livello minimo.

Le mosse e i livelli di apprendimento sono verificati nei learnset HGSS locali. Sonicboom infligge danno fisso, quindi l’immunità a Elettro da sola non annulla tutta la squadra. La prova tecnica usa un Wooper 20 preparato: verifica integrazione e immunità, non una partita naturale o il bilanciamento con tutti gli starter.

## Dati, grafica e limiti

25 specie e 44 mosse runtime. Il parco urbano include Magnemite e Voltorb (12–15); entrambi hanno artwork locali con provenienza, PNG sorgenti e WebP q88 registrati. Le evoluzioni ufficiali sono descritte come riferimento, ma Magneton ed Electrode non sono ancora specie runtime ottenibili.

Il fondale `veloria-gym03-rooftop-v1` è generato con ImageGen integrato; prompt, riferimento architettonico e percorsi in `assets/prompts/gym03-rooftop-v1.md`. Le console sono geometrie originali condivise (`rail-console`), con collisioni indipendenti in Tiled. La Medaglia Circuito estende il sistema SVG esistente.

Rimangono da implementare: quartieri, skyline esplorabile e tetti di Vetracielo oltre questa terrazza; R06/Ferraluce; cinque Palestre successive, Lega e finale. Charge/Rollout e le altre mosse non supportate restano esplicite nel report sorgente. Il motore usa ancora le regole prototipali v7, non una simulazione HGSS completa. Esiti browser/offline e limiti aggiornati in `CI_STATUS.md`.
