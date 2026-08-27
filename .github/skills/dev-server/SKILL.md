---
name: dev-server
description: "Skill per avviare il dev server locale di favole-magiche (vite, porta 5173 di default). Usare quando l'utente chiede di avviare/testare l'app in locale, verificare a runtime una modifica, o fare una verifica visiva/manuale nel browser."
license: MIT
---

# Skill: Avviare il dev server (favole-magiche)

Skill di riferimento per avviare il server di sviluppo locale di favole-magiche.
Da invocare quando l'utente chiede di avviare/testare l'app in locale, vedere
le modifiche a runtime, o fare una verifica visiva/manuale nel browser.

## Quando usare questa skill

- L'utente chiede di "avviare il dev server", "far partire l'app", "testare in locale".
- Serve verificare a runtime una modifica appena fatta (UI, comportamento, storie generate).

## Comando

```powershell
cd C:\works\favole-magiche
npm run dev
```

- Lo script `dev` esegue `vite` senza porta esplicita in `package.json`: usa la
  porta di default di Vite (**5173**, o la successiva libera se occupata) —
  verificare l'URL stampato in output.
- `vite.config.ts` disabilita HMR/file watching solo se la variabile
  d'ambiente `DISABLE_HMR=true` è impostata (usata da AI Studio); in sviluppo
  locale normale HMR resta attivo.

## Note

- È un processo long-running: avviarlo in modalità `async` (o `detach: true`
  se deve restare attivo oltre la sessione corrente).
- Verificare processi Node esistenti prima di avviarne uno nuovo, per evitare
  istanze duplicate sulla stessa porta.
