# Checklist Play Store - Favole Magiche

Ultimo aggiornamento: 2026-07-19

## Stato attuale

- Package Android definitivo: `it.mp.app.favolemagiche`
- App name: `Favole Magiche`
- Versione store corrente allineata: `1.2.5`
- Version code Android impostato: `125`
- Modalità generazione predefinita: `client`
- Backend opzionale disponibile: `backend/server.mjs`

## Checklist tecnica

- [x] Definire il package definitivo Android / Capacitor
- [x] Allineare `versionName` Android a `1.2.5`
- [x] Impostare un `versionCode` numerico crescente (`125`)
- [ ] Eseguire `npm run lint`
- [ ] Eseguire `npm run test`
- [ ] Eseguire `npm run test:a11y`
- [ ] Eseguire `npm run build`
- [ ] Eseguire `npx cap sync`
- [ ] Aprire il progetto con `npx cap open android`
- [ ] Generare un `.aab` firmato release

## Checklist sicurezza / produzione

- [ ] Spostare Gemini su backend sicuro
- [ ] Rimuovere la dipendenza da `VITE_GEMINI_API_KEY` nel client per la release pubblica
- [ ] Verificare limiti, logging errori e rate limiting lato server
- [ ] Verificare eventuale incoerenza su permessi/capability dichiarate (`metadata.json` menziona `microphone`)

## Checklist Play Console

- [ ] Creare o verificare account Google Play Console
- [ ] Creare l'app in Play Console
- [ ] Compilare Store Listing
- [ ] Inserire descrizione breve
- [ ] Inserire descrizione completa
- [ ] Caricare icona 512x512
- [ ] Caricare banner 1024x500
- [ ] Caricare almeno 2-4 screenshot telefono
- [ ] Pubblicare la Privacy Policy a URL pubblico
- [ ] Inserire URL Privacy Policy in Play Console
- [ ] Compilare sezione Data safety
- [ ] Compilare Target audience / Famiglie
- [ ] Compilare questionario Content rating (IARC)
- [ ] Caricare il file `.aab` su test interno
- [ ] Testare installazione e uso da Play Store
- [ ] Promuovere la release in produzione

## Rischi principali da monitorare

1. **Esposizione chiave Gemini**  
   Al momento il progetto legge la chiave dal client (`VITE_GEMINI_API_KEY`). In una build pubblica questo espone la chiave nel pacchetto app.

2. **Version code futuro**  
   Da ora in poi ogni nuova release dovrà avere un `versionCode` maggiore di `125`, altrimenti Google Play rifiuterà l'upload.

3. **Materiale store incompleto**  
   Senza screenshot, banner e privacy policy pubblica non completi la pubblicazione.

4. **Dichiarazioni minori/famiglie**  
   Essendo un'app per bambini, Data safety, target audience e IARC devono essere coerenti e molto accurati.

5. **Test su dispositivo reale**  
   Anche con test automatici verdi, TTS, storage locale e comportamento WebView Android vanno verificati su device reale.

## Comandi utili

```powershell
Set-Location "C:\works\favole-magiche"
npm run lint
npm run test
npm run test:a11y
npm run build
npx cap sync
npx cap open android
```

