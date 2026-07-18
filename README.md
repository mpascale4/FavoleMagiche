<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run app (Gemini client-side)

Questa app ora chiama Gemini direttamente dal client React, senza backend Node.

View your app in AI Studio: https://ai.studio/apps/64589ee6-64f8-4b51-a6eb-d00f5f0a98b8

## Run locally

**Prerequisites:** Node.js


1. Installa le dipendenze:
   `npm install`
2. Crea `.env.local` con:
   `VITE_GEMINI_API_KEY=la_tua_chiave_google_ai_studio`
3. Avvia in sviluppo:
   `npm run dev`
4. Build di produzione:
   `npm run build`

## Accessibilita (WCAG 2.2 AA)

- Checklist QA operativa: `docs/WCAG_QA_CHECKLIST.md`
- Architettura e linee guida: `docs/ACCESSIBILITY_ARCHITECTURE.md`

Verifica rapida locale:

`npm run lint`
`npm run test`
`npm run build`
`npm run test:lighthouse`

