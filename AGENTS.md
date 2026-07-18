# Istruzioni personalizzate per l'agente

- Al primo avvio o all'inizio di una nuova sessione, esegui sempre `git pull` per assicurarti che il codice locale sia sincronizzato con le ultime modifiche presenti sul repository remoto.
- Quando l'utente scrive `/pull` o `#pull`, esegui immediatamente un `git pull` completo di tutti i rami e aggiorna il codice di lavoro.

- Quando l'utente scrive la parola "note", aggiungi il contenuto della sua richiesta in un file chiamato `notes.md`.
