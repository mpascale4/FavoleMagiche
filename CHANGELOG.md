# Changelog - Favole Magiche

Tutti i cambiamenti significativi di questo progetto sono documentati in questo file.

## [1.2.0] - 2026-07-17

### ✨ Aggiunte
- Modal di errore esplicito per generazione fallita (GenerationErrorModal)
- Retry automatico su tutti i modelli Gemini disponibili
- Verifica modelli disponibili prima di tentare la generazione
- Log esplicito della generazione (console + localStorage)
- Salvataggio log generazioni con ultimi 20 tentativi
- Stato runtime Gemini visibile in Impostazioni

### 🔧 Modifiche
- Migliorato sistema di retry su modelli alternativi (oltre ai deprecati)
- Logging dettagliato del processo di generazione nella console
- Handler errori più specifici (quota vs modello non disponibile)
- Alert rimosso in favore di modal stilizzato

### 📋 Log Generazione
I log di generazione salvano:
- Timestamp dell'operazione
- Stato (GEMINI/FALLBACK/ERROR)
- Modello usato
- Motivo di fallback
- Errori dettagliati

---

## [1.1.0] - 2026-07-17

### ✨ Aggiunte
- Diagnostica runtime dello stato Gemini
- Pannello "Stato Gemini" in Impostazioni
- Messaggi di progress durante generazione (modello in uso)
- File di configurazione per Cursor IDE (.cursorrules)
- File CONTRIBUTING.md con istruzioni setup

### 🔧 Modifiche
- Corretto falso positivo sul formato API key Gemini
- Rimosso controllo rigido sul prefisso "AIza"
- Migliorato sistema di classificazione errori Gemini
- Alert più chiaro per setup sviluppatori

---

## [1.0.0] - 2026-07-17

### ✨ Features Iniziali
- Generazione storie con Gemini AI (lato client)
- Fallback offline automatico senza Gemini
- Profili bambini con tema visivo
- Lettore storie con sintesi vocale
- Archivio storie con ricerca
- Impostazioni app (voce, spazio, PIN)
- Albero della crescita
- Timer "Favola della Buonanotte"
- Modalità bambino protetta
- Audio interattivo
- Sistema di sblocco giornaliero

---

## Note Tecniche

### Gemini API
- Modelli supportati: `gemini-flash-latest`, `gemini-2.0-flash`, `gemini-2.5-flash`
- Retry automatico se un modello ha quota esaurita
- Fallback offline se nessun modello disponibile
- Logging completo in console e localStorage

### Environment
- `VITE_GEMINI_API_KEY`: chiave API Gemini (obbligatoria per AI)
- `.env`: file locale NON tracciato da git
- `.env.example`: template per nuovi developers

### Git Flow
Questo progetto usa **Git Flow**:
```bash
git flow feature start <nome>
# ... lavoro ...
git flow feature finish <nome>
git push origin develop
```

