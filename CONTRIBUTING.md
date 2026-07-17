# Contributing – Favole Magiche

## ⚙️ Setup iniziale – Variabili d'ambiente

Questo progetto usa **Google Gemini AI** per la generazione delle favole. La chiave API **non è inclusa nel repository** per motivi di sicurezza.

### 1. Creare il file `.env`

Nella root del progetto, copia il file di esempio e inserisci la tua chiave:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

Poi apri `.env` e sostituisci il valore:

```env
VITE_GEMINI_API_KEY=la-tua-chiave-gemini-reale
```

> 🔑 La chiave Gemini si ottiene da [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

> ⚠️ **Non committare mai il file `.env`** — è già escluso dal `.gitignore`

### 2. Avviare l'app

```bash
npm run dev
```

---

## Flusso di lavoro Git (Git Flow)

Questo progetto adotta **Git Flow**. Ogni sviluppatore (e ogni assistente AI) **deve** rispettare il seguente flusso prima e dopo qualsiasi modifica al codice.

### Prima di iniziare una modifica

```bash
git flow feature start <nome-descrittivo>
# es: git flow feature start aggiungi-schermata-impostazioni
```

### Al termine delle modifiche

```bash
git flow feature finish <nome-descrittivo>
git push origin develop
git push origin --tags
```

### Regole importanti

- ❌ **Non** fare commit direttamente su `main` o `develop`
- ✅ **Sempre** usare una feature branch tramite Git Flow
- ✅ Il nome della feature deve essere breve e descrittivo (es. `fix-audio-engine`, `nuova-vista-archivio`)

### Prerequisiti

Assicurarsi di avere Git Flow installato:

```bash
# Windows (con Git for Windows)
# Git Flow è già incluso in Git for Windows

# Inizializzare Git Flow nel progetto (solo la prima volta)
git flow init
```

---

## 📝 Aggiornare il Changelog

Dopo ogni feature/fix, aggiorna il **CHANGELOG.md** e la **version.json**:

```bash
npm run update:changelog
```

Questo script ti guida attraverso:
1. **Nuova versione** (es. 1.2.0)
2. **Numero di modifiche** (1-5)
3. **Dettagli per ogni modifica**:
   - Titolo
   - Descrizione
   - Tipo (feature/fix/improvement)

Il script:
- ✅ Aggiorna `version.json` con i dati della versione
- ✅ Aggiorna `CHANGELOG.md` con le modifiche
- ✅ Suggerisce i comandi git per il commit

Esempio:

```bash
npm run update:changelog

# Seguito da:
git add CHANGELOG.md version.json
git commit -m "chore: aggiorna changelog v1.2.0"
git tag v1.2.0
git push origin develop
git push origin --tags
```

### Come vedranno i dati gli utenti

Il changelog è visualizzabile **nell'app**:
- Apri **Impostazioni**
- Clicca il bottone **ℹ️ Info** (in alto a destra)
- Visualizza:
  - Versione attuale
  - Data release
  - Ultime 5 modifiche (con tipo e descrizione)
  - Link al changelog completo

---
