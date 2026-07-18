# Validazione WCAG - StoryReaderView

Data: 2026-07-18
Branch: `feature/accessibility-retrofit-story-reader`
Scope: `src/components/StoryReaderView.tsx`

## Retrofit applicato

- Landmark semantici (`section`, `header`) e titolo SR-only del lettore.
- Nomi accessibili sui controlli principali:
  - back, share, preferiti, font-size, timer nanna,
  - play/pause/stop narrazione,
  - velocita narrazione,
  - registrazione audio (start/stop/play/delete).
- Stato pagina con `aria-live` (`copertina`, `pagina N`, `morale`).
- Regione contenuto lettura con `role="region"`.
- Share modal resa accessibile come dialog (`role="dialog"`, `aria-modal`, label/description).

## Test automatici aggiunti

- `src/components/StoryReaderView.a11y.test.tsx`

Copertura:
- presenza controlli chiave con nome accessibile
- apertura modal condivisione come dialog
- verifica `axe-core` senza errori critici

## Esito validazione tecnica

- `npm run lint` -> da eseguire in pipeline finale
- `npm run test` -> da eseguire in pipeline finale
- `npm run build` -> da eseguire in pipeline finale
- `npm run test:lighthouse` -> noto limite locale Windows (`EPERM` cleanup Chrome)

