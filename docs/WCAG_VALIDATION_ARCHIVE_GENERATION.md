# Validazione WCAG - ArchiveView e Generation Flow

Data: 2026-07-18
Branch: `feature/accessibility-retrofit-reader-archive`
Scope:
- `src/components/ArchiveView.tsx`
- `src/components/GenerationView.tsx`
- `src/components/GenerationErrorModal.tsx`

## Interventi applicati

- Landmark semantici (`section`, `header`) e naming accessibile nei controlli principali.
- Card archivio navigabili via tastiera (`Enter`/`Space`) con ruolo e label espliciti.
- Dialog di conferma archivio con `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby`.
- Progress generazione con `role="progressbar"` e valori ARIA.
- Log di generazione esposti come regione con `aria-live`.
- Modal errore generazione convertita in dialog accessibile.

## Test automatici aggiunti

- `src/components/ArchiveView.a11y.test.tsx`
- `src/components/GenerationFlow.a11y.test.tsx`

Copertura:
- keyboard activation
- dialog semantics
- progressbar semantics
- axe-core (no violazioni critiche)

## Esito validazione tecnica

- `npm run lint` -> PASS
- `npm run test` -> PASS
- `npm run build` -> PASS
- `npm run test:lighthouse` -> FAIL locale (cleanup processi Chrome su Windows: `EPERM`)

Nota:
- Il controllo affidabile Lighthouse rimane la pipeline CI Linux (`.github/workflows/accessibility-ci.yml`).

