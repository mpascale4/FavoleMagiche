# Validazione WCAG - SettingsView e ProfilesView

Data: 2026-07-18
Branch: `feature/accessibility-retrofit-settings-profiles`
Scope: `src/components/SettingsView.tsx`, `src/components/ProfilesView.tsx`

## 1) Retrofit accessibilità applicato

- Landmark semantici (`section`, `header`) per entrambe le viste.
- Label/nomi accessibili per controlli principali (button, select, switch, range).
- Error handling accessibile su form profili (`role="alert"`, `aria-invalid`, `aria-describedby`).
- Modali di conferma con `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby`.
- Supporto tastiera su card profilo selezionabile (`Enter`/`Space`).

## 2) Test automatici dedicati

Aggiunti:
- `src/components/ProfilesView.a11y.test.tsx`
- `src/components/SettingsView.a11y.test.tsx`

Copertura:
- keyboard navigation
- associazione errori
- apertura dialog
- verifica `axe-core` senza violazioni critiche

## 3) Esito validazione tecnica

Comandi eseguiti:

- `npm run lint` -> PASS
- `npm run test` -> PASS (16/16)
- `npm run build` -> PASS
- `npm run test:lighthouse` -> FAIL locale per errore ambiente Windows (`EPERM` su cleanup temp Chrome)

Nota su Lighthouse:
- Il fallimento locale e dovuto al cleanup processo Chrome in ambiente Windows.
- Il gate ufficiale resta la CI in `.github/workflows/accessibility-ci.yml`.

## 4) Checklist WCAG rapida (scope corrente)

- [x] Navigazione tastiera sui controlli chiave
- [x] Focus raggiungibile su azioni primarie
- [x] Form con errori non solo cromatici
- [x] Dialog con semantica ARIA corretta
- [x] Screen reader naming su switch/select/range principali
- [x] Verifica automatica axe su entrambe le viste

## 5) Residual risk

- Verifica Lighthouse da confermare in CI (ambiente Linux) per score >= 95.
- Raccomandata validazione manuale NVDA/VoiceOver e zoom 200% sulle due viste.

