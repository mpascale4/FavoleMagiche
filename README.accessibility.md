# Accessible Web App (WCAG 2.2 AA)

Implementazione accessibile completa in React con focus su daltonismo, ipovisione, sensibilita al contrasto, fotosensibilita, utenti screen reader e navigazione solo tastiera.

## File principali

- `src/accessibility/AccessibleApp.tsx`
- `src/accessibility/accessibility.css`
- `src/accessibility/tokens.ts`
- `src/accessibility/contrast.ts`
- `src/accessibility/AccessibleApp.test.tsx`
- `src/accessibility/contrast.test.ts`
- `docs/ACCESSIBILITY_ARCHITECTURE.md`

## Avvio rapido

```powershell
npm install
npm run dev
```

## Test

```powershell
npm run test
npm run test:a11y
npm run test:lighthouse
```

## Obiettivi coperti

- WCAG 2.2 AA
- Nessuna informazione solo cromatica
- Focus visibile e navigazione tastiera completa
- ARIA e semantica HTML corretta
- Light/Dark theme colorblind-friendly
- Riduzione animazioni via `prefers-reduced-motion`
- Grafici con pattern + alternativa tabellare

