# Guida alla Pubblicazione su Google Play Store 🚀
## Da Web App (React + Vite) a App Android Nativa con Capacitor

Questa guida riassume i passaggi fondamentali per trasformare questa applicazione web creata in AI Studio in un pacchetto Android pronto per essere scaricato dal **Google Play Store**.

---

## 📋 Requisiti Preliminari

1. **Account Sviluppatore Google Play Console**:
   * È richiesto un account sviluppatore Google (costo una tantum di **$25 USD**).
   * Registrati qui: [Play Console](https://play.google.com/console/signup).
2. **Ambiente di Sviluppo Locale**:
   * **Node.js** installato sul computer.
   * **Android Studio** installato (comprensivo di SDK Android e strumenti riga di comando).
3. **Risorse Grafiche**:
   * Icona dell'app: `512x512px` (PNG a 32 bit).
   * Grafica promozionale (Banner): `1024x500px` (JPG o PNG).
   * Almeno 2-4 screenshot del simulatore in formato telefono.

---

## 🛠️ Passo 1: Impacchettamento con Capacitor (Consigliato)

**Capacitor** (creato dal team di Ionic) è lo strumento moderno più semplice per convertire un'applicazione web React/Vite in un'app nativa Android.

### 1. Prepara la Build Web
Apri il terminale nella cartella del progetto locale ed esegui la build per generare i file statici compressi (che andranno nella cartella `dist`):
```bash
npm run build
```

### 2. Installa Capacitor nel Progetto
Installa i pacchetti principali di Capacitor nel tuo progetto locale:
```bash
npm install @capacitor/core @capacitor/cli
```

### 3. Inizializza Capacitor
Configura l'identità della tua app:
```bash
npx cap init "Nome Della Tua App" "com.tuodominio.nomeapp" --web-dir=dist
```
*Sostituisci `com.tuodominio.nomeapp` con il tuo ID pacchetto unico (es. `com.magicastorie.app`).*

### 4. Aggiungi la Piattaforma Android
Installa la libreria Android per Capacitor e crea la cartella nativa:
```bash
npm install @capacitor/android
npx cap add android
```

---

## 🔄 Passo 2: Sincronizzazione del Codice

Ogni volta che fai modifiche al tuo codice React e vuoi vederle nell'app Android, esegui questi due comandi:
```bash
npm run build
npx cap sync
```
Questo comando copierà l'intera cartella `/dist` all'interno della cartella nativa Android.

---

## 💻 Passo 3: Compilazione in Android Studio

1. Apri il progetto Android generato all'interno di **Android Studio**:
   ```bash
   npx cap open android
   ```
2. Attendi che Android Studio indicizzi il progetto e scarichi le dipendenze Gradle necessarie.
3. Se desideri testare l'app su un emulatore o sul tuo telefono fisico (collegato tramite USB con *Debug USB* attivo), premi il tasto **Run (Play verde)** in alto.

---

## 🔑 Passo 4: Generazione del File Firmato (.AAB)

Per pubblicare sul Play Store, Google richiede un file di rilascio chiamato **Android App Bundle (.aab)** firmato digitalmente.

1. In Android Studio, vai su **Build** > **Generate Signed Bundle / APK...**
2. Seleziona **Android App Bundle** e premi *Next*.
3. Sotto **Key store path**, seleziona *Create new...* per creare una nuova chiave di firma (Keystore):
   * Scegli un percorso sicuro sul tuo computer.
   * Imposta una password robusta per il Keystore e per la chiave.
   * Compila i dettagli del certificato (Nome, Organizzazione, ecc.).
   * **ATTENZIONE:** Conserva questo file `.jks` e le password in un luogo sicuro! Se li perdi, non potrai più aggiornare la tua app sul Play Store.
4. Seleziona la destinazione di rilascio (solitamente `release`).
5. Seleziona il tipo di build **release** e clicca su *Finish*.
6. Al termine, Android Studio ti mostrerà una notifica con il link alla cartella contenente il file `app-release.aab`.

---

## 🌐 Passo 5: Caricamento su Google Play Console

1. Accedi alla tua **Google Play Console**.
2. Clicca su **Crea applicazione** e compila le impostazioni di base (Nome dell'app, lingua predefinita, tipo "Applicazione", se è gratuita o a pagamento).
3. **Dichiarazioni Obbligatorie (Molto importante per app di bambini!)**:
   * Rispondi al questionario sulla classificazione dei contenuti (IARC).
   * Compila la sezione **App per famiglie / Minori**: dichiara la fascia d'età del target (es. 5-8 anni). Questa app rispetta pienamente le linee guida sulla privacy (COPPA/GDPR Kids) poiché non raccoglie dati personali all'esterno e usa audio locale.
   * Inserisci l'URL della tua **Privacy Policy** (obbligatoria).
4. Sotto la scheda **Produzione** (o *Test Interno* per fare prove), clicca su **Crea nuova release**.
5. Trascina e rilascia il file `.aab` generato al Passo 4.
6. Compila i dettagli della scheda dello store (titolo, descrizione breve, descrizione dettagliata, icona, banner e screenshot).
7. Invia l'app per la revisione! Il team di Google impiega solitamente da 1 a 5 giorni lavorativi per approvare la prima pubblicazione.

---

## 🧠 Passo 6: Gestione dell'IA (Gemini API) e Limiti nella Versione Pubblicata

Quando pubblichi l'applicazione sul Play Store, entra in gioco un fattore architetturale fondamentale:

### 1. Dove gira il server backend?
* **In Sviluppo (AI Studio)**: L'applicazione è full-stack, il server Node.js (`server.ts`) e il frontend React girano insieme nello stesso container.
* **Sul Telefono (Play Store)**: L'app compilata con Capacitor è **esclusivamente client-side**. I file statici React girano localmente sul telefono dentro un componente chiamato *WebView*. **Il server Node.js (`server.ts`) non viene eseguito sul telefono.**

**Soluzione**: 
Per fare in modo che la creazione delle favole continui a funzionare:
1. Devi **ospitare online** il codice del server backend (`server.ts`). Servizi ottimali, veloci e gratuiti/economici sono **Google Cloud Run**, **Railway**, **Render** o **Fly.io**.
2. Configura la variabile d'ambiente `GEMINI_API_KEY` direttamente sul server ospitato.
3. Nel codice React del frontend locale, modifica gli endpoint delle chiamate (es. da `/api/stories/...` a `https://tuo-server-ospitato.com/api/stories/...`).

> ⚠️ **IMPORTANTE**: Non inserire mai la chiave `GEMINI_API_KEY` direttamente all'interno del codice del telefono (React/Frontend). Se lo facessi, malintenzionati potrebbero decompilare l'app, rubare la tua chiave e usarla a tue spese. Mantieni sempre la chiave al sicuro sul server backend!

---

### 2. Limiti dell'API Gemini e Costi
* **Fascia Gratuita (Free Tier)**:
  * Se usi Google AI Studio per la tua chiave, il modello **Gemini 1.5 Flash** ha una fascia gratuita generosa (es. 15 richieste al minuto, 1.500 richieste al giorno).
  * Per un'app di prova o con pochi utenti, la fascia gratuita è sufficiente e non costa nulla.
* **Fascia a Pagamento (Pay-as-you-go)**:
  * Se la tua app acquisisce molti utenti, puoi attivare la fatturazione in Google AI Studio.
  * I modelli Gemini (specialmente 1.5 Flash) sono incredibilmente economici: la generazione di una storia testuale costa circa **0,0001$ - 0,0005$** (una frazione infinitesima di centesimo).
  * È consigliabile inserire una limitazione giornaliera per utente (già implementata in questa app con il limite di 3 favole al giorno!) per controllare i consumi.

---

### 3. Altri Servizi della App: Audio e Lettura Vocale
* **Sintesi Vocale (TTS)**: La lettura a voce alta delle storie utilizza la tecnologia nativa del browser/sistema operativo del telefono (`SpeechSynthesis`). È **100% gratuita, illimitata e funciona anche offline** senza chiamare server esterni.
* **Musica e Suoni**: I file musicali e gli effetti sono incorporati direttamente nel pacchetto dell'app, quindi anch'essi sono gratuiti, illimitati e pronti all'uso offline.

---

*Nota: Questa guida è stata creata appositamente per la tua applicazione. Puoi scaricarla esportando il progetto ZIP dal menu in alto a destra o consultarla direttamente nella radice della cartella.*
