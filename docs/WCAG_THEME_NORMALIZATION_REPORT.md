# WCAG Theme Normalization Report

Data: 2026-07-18
Branch: `feature/accessibility-theme-normalization`

## Obiettivi coperti

1. Sostituzione colori hardcoded con token accessibili unificati.
2. Audit contrasto light/dark con test automatici.
3. Correzioni mirate su componenti ad alto impatto visivo.

## File aggiornati

- `src/index.css`
- `src/components/FairyTaleMap.tsx`
- `src/components/InfoModal.tsx`
- `src/components/AchievementModal.tsx`
- `src/components/NewStoryView.tsx`
- `src/accessibility/themeContrast.audit.test.ts`

## Esito tecnico

- `npm run lint`: PASS
- `npm run test`: PASS
- `npm run build`: PASS

## Nota Lighthouse locale

In ambiente Windows locale puo comparire un errore `EPERM` in cleanup Chrome durante `npm run test:lighthouse`.
Il gate affidabile resta il workflow CI `Accessibility CI` su GitHub Actions.

