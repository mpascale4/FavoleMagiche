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

---

## Accessibility Standards

All generated code must comply with:

- WCAG 2.2 AA
- WAI-ARIA Authoring Practices Guide

Accessibility Requirements:

- Support keyboard-only navigation
- Support screen readers
- Support color-blind users
- Support low-vision users
- Support high-contrast users
- Support reduced-motion preferences

Color Rules:

- Never use color as the only carrier of information
- Ensure WCAG contrast compliance
- Avoid red/green dependent workflows
- UI must remain understandable in grayscale

Motion Rules:

- Respect prefers-reduced-motion
- No flashing content
- No strobe effects
- No distracting animations

Components:

- Proper semantic HTML
- Valid ARIA attributes
- Visible focus indicators

Validation:

- Lighthouse accessibility >= 95
- No critical axe-core violations

Assume all code will be audited against WCAG 2.2 AA.

