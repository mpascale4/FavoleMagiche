# Backend opzionale per Favole Magiche

Questo backend è **opzionale**.

- **Default app:** generazione `client`
- **Quando usarlo:** quando vuoi proteggere la chiave Gemini e prepararti meglio alla pubblicazione su Google Play

## Endpoint disponibili

- `GET /health`
- `POST /api/stories/generate`

## Variabili ambiente

- `GEMINI_API_KEY` → chiave Gemini del server
- `PORT` → porta locale, default `8787`
- `CORS_ALLOW_ORIGIN` → origine consentita, default `*`

## Avvio locale

### PowerShell

```powershell
Set-Location "C:\works\favole-magiche"
$env:GEMINI_API_KEY="la-tua-chiave"
$env:PORT="8787"
npm run backend:start
```

## Configurazione frontend

Nel frontend puoi lasciare il default client-side oppure scegliere `backend` nelle impostazioni dell'app e impostare:

- URL base: `http://localhost:8787` in locale
- oppure il tuo URL HTTPS pubblico in produzione

## Esempio risposta health

```json
{
  "ok": true,
  "generationMode": "backend",
  "geminiConfigured": true,
  "timestamp": "2026-07-19T00:00:00.000Z"
}
```

## Nota importante

Se Gemini non è disponibile lato server, l'endpoint restituisce comunque una favola di fallback così l'app continua a funzionare.

