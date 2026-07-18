# Architettura accessibile WCAG 2.2 AA

## 1) Architettura dell'app

- **Stack**: React + Vite + TypeScript.
- **Entry point**: `src/main.tsx`.
- **App accessibile**: `src/accessibility/AccessibleApp.tsx`.
- **Stili/tokens**: `src/accessibility/accessibility.css`, `src/accessibility/tokens.ts`.
- **Utility contrasto**: `src/accessibility/contrast.ts`.
- **Test**: `src/accessibility/*.test.ts*`.

## 2) Design system accessibile

Principi adottati:
- Informazione sempre ridondante: **icona + testo + colore**.
- Landmark semantici e ruoli ARIA coerenti.
- Controlli nativi quando possibile.
- Focus visibile ad alto contrasto.
- Componenti reattivi da 320px a desktop/4K.

## 3) Tema light/dark

Palette implementata (richiesta):
- Light: background `#FFFFFF`, surface `#F8FAFC`, text primary `#1F2937`, text secondary `#4B5563`, primary `#1D4ED8`, success `#059669`, warning `#D97706`, error `#DC2626`.
- Dark: background `#111827`, surface `#1F2937`, text primary `#F9FAFB`, text secondary `#D1D5DB`, primary `#60A5FA`, success `#34D399`, warning `#FBBF24`, error `#F87171`.

## 4) Token CSS

Token dichiarati come custom properties:
- `--a11y-bg`, `--a11y-surface`, `--a11y-text-primary`, `--a11y-text-secondary`
- `--a11y-primary`, `--a11y-success`, `--a11y-warning`, `--a11y-error`
- `--a11y-border`, `--a11y-focus`

## 5) Componenti riutilizzabili

Implementati in `AccessibleApp`:
- Button
- Input
- Select
- Checkbox
- Radio
- Switch (`role="switch"`)
- Modal (`role="dialog"`, `aria-modal`, focus trap, ESC)
- Toast (`aria-live="polite"`)
- Alert (`role="alert"` / `role="status"`)
- Tabs (`tablist`, `tab`, `tabpanel`)
- DataGrid (tabella semantica con header scope)
- Charts (SVG con pattern, marker testuali + tabella alternativa)
- Navigation Menu (`nav` con label esplicita)

## 6) Motivazione scelte accessibilita

- **Daltonismo**: nessun stato affidato al solo colore.
- **Ipovisione/anziani**: font base 16px, line-height >= 1.5, contrasti >= WCAG.
- **Fotosensibilita/emicrania**: riduzione motion globale e media query `prefers-reduced-motion`.
- **Cognitivo/percettivo**: layout pulito, riduzione rumore visivo, feedback testuali espliciti.
- **Screen reader**: label, descrizioni, ruoli ARIA e live regions.
- **Solo tastiera**: focus ring, skip link, navigazione completa, modal focus management.

## 7) Checklist WCAG rapida

- [x] Struttura semantica completa
- [x] Focus visibile e contrastato
- [x] Tastiera completa
- [x] Error handling non cromatico
- [x] Contrasto testo/componenti verificato
- [x] Riduzione animazioni
- [x] Grafici con alternativa accessibile

## 8) Test automatici

- `contrast.test.ts`: verifica ratio WCAG su token.
- `AccessibleApp.test.tsx`: landmark semantici, tastiera, validazione, modal, axe.
- `lighthouserc.json`: soglia accessibilita Lighthouse >= 95.
- `.github/workflows/accessibility-ci.yml`: quality gate automatico su PR/push (test + build + Lighthouse).

## 9) Esecuzione test

```powershell
npm install
npm run test
npm run test:lighthouse
```

## 10) Note produzione

- In CI eseguire `npm run build` + `npm run test` + `npm run test:lighthouse`.
- Per regressioni UX, mantenere la checklist WCAG nel processo di review PR.

