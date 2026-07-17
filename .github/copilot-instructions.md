# GitHub Copilot – Istruzioni per il progetto

## Flusso Git obbligatorio (Git Flow)

**Prima di qualsiasi modifica al codice:**
1. Aprire una nuova feature con Git Flow:
   ```bash
   git flow feature start <nome-feature>
   ```

**Al termine di tutte le modifiche:**
2. Chiudere la feature e fare la push:
   ```bash
   git flow feature finish <nome-feature>
   git push origin develop
   git push origin --tags
   ```

> ⚠️ Non eseguire mai commit direttamente su `main` o `develop` senza passare per una feature branch di Git Flow.

---

## Comandi personalizzati

Quando l'utente scrive `/pull` o `#pull`, esegui immediatamente i seguenti comandi nell'ordine indicato, senza chiedere conferma:

```powershell
git pull origin develop
git pull origin main
```

Se sono presenti branch locali attivi (feature branch), esegui anche:

```powershell
git pull origin <branch-corrente>
```

> ℹ️ Usa `git branch --show-current` per determinare il branch corrente prima di eseguire il pull.

