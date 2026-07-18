# GitHub Copilot – Istruzioni per il progetto

## Accessibility Quick Rules

Quando generi o modifichi codice:

- Rispetta sempre **WCAG 2.2 AA** e **WAI-ARIA APG**.
- Garantire navigazione da tastiera, screen reader, contrasto alto e supporto al reduced motion.
- Non usare il colore come unico veicolo informativo.
- Evitare animazioni lampeggianti, strobo o distrazioni.
- Usare HTML semantico, ARIA valido e focus visibile.
- Mantenere leggibilità anche in grayscale e nei temi chiaro/scuro.
- Verificare il risultato con **Lighthouse a11y >= 95** e senza critical axe-core issues.

---

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

---

## Accessibility Standards

Le quick rules sopra sono vincolanti. In caso di dubbio, applica sempre:

- WCAG 2.2 AA e WAI-ARIA APG
- contrasto corretto in tutti i temi e in grayscale
- navigazione da tastiera, screen reader e focus visibile
- supporto a prefers-reduced-motion senza flash, strobo o animazioni distraenti
- HTML semantico, ARIA valido, niente colore come unico canale informativo
- Lighthouse accessibility >= 95 e nessun critical axe-core issue

