import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header as required
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini API:", err);
  }
} else {
  console.log("GEMINI_API_KEY is not configured or placeholder. Fallback mode enabled.");
}

// Helper to detect if a name is feminine in Italian
const isFemminile = (nome: string): boolean => {
  const n = nome.trim().toLowerCase();
  if (!n) return false;
  const femaleNames = ["celeste", "elena", "alice", "beatrice", "giulia", "sofia", "chiara", "francesca", "giorgia", "emma", "sara", "aurora", "ludovica", "matilde", "margherita", "vittoria", "noemi", "ginevra", "adele", "irene", "arianna", "greta", "martina", "alessia", "federica", "camilla", "serena", "viola", "lisa", "marta", "anna", "maria", "lucia", "elisa", "silvia", "caterina", "gloria", "eleonora", "rachele", "rebecca"];
  if (femaleNames.includes(n)) return true;
  const maleExclusions = ["luca", "andrea", "mattia", "nicola", "elia", "tobia", "cosma", "gianluca", "gianmaria"];
  if (n.endsWith("a") && !maleExclusions.includes(n)) return true;
  return false;
};

// REST API for story generation with support for background tasks and cancellation
interface StoryJob {
  id: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  progress: number;
  step: string;
  data?: any;
  error?: string;
}

const activeJobs = new Map<string, StoryJob>();
let preferredModel = "gemini-3.1-flash-lite";

// Cleanup jobs after 15 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of activeJobs.entries()) {
    const timestampStr = id.replace("job_", "");
    const timestamp = parseInt(timestampStr, 10);
    if (!isNaN(timestamp) && now - timestamp > 15 * 60 * 1000) {
      activeJobs.delete(id);
    }
  }
}, 5 * 60 * 1000);

app.post("/api/stories/generate", async (req, res) => {
  const {
    categoria,
    tema,
    temaEducativo,
    durata,
    etaBambino,
    nomeBambino,
    personaggi,
    isPremium,
    parentStoryTitle,
    parentStoryPagine,
    parentStoryMorale,
    excludeBambino,
    isBedtimeMode
  } = req.body;

  const actualTema = tema || temaEducativo || "Amicizia";
  const jobId = "job_" + Date.now();

  console.log(`Starting background story generation. Job ID: ${jobId} for child: ${nomeBambino}`);

  // Create initial job state
  const job: StoryJob = {
    id: jobId,
    status: "pending",
    progress: 5,
    step: "Inizio dell'incantesimo magico... 🪄"
  };
  activeJobs.set(jobId, job);

  // Return jobId immediately so the client can navigate and poll
  res.json({ jobId });

  // Spawn background processing async
  (async () => {
    try {
      if (activeJobs.get(jobId)?.status === "cancelled") return;

      activeJobs.set(jobId, {
        id: jobId,
        status: "pending",
        progress: 15,
        step: "Integrazione dei simpatici personaggi nel racconto... 🦁"
      });

      const charactersStr = personaggi && personaggi.length > 0
        ? personaggi.map((p: any) => `- **${p.nome}** (un/una ${p.tipo}${p.caratteristica ? `, caratterizzato da: ${p.caratteristica}` : ""})`).join("\n")
        : "- Personaggi casuali scelti dall'IA magica.";

      const isGirl = isFemminile(nomeBambino || "");
      const genderInstruction = isGirl
        ? `Il nome "${nomeBambino}" è FEMMINILE. Riferisciti a lei SEMPRE come una bambina (es: la piccola ${nomeBambino}, felice, addormentata, fortunata, un'avventuriera, una viaggiatrice, etc.), coniugando tutti gli articoli, pronomi e aggettivi rigorosamente al femminile! Usa anche emoji adatte come 👧 o 👸.`
        : `Il nome "${nomeBambino || "Piccolo lettore"}" è MASCHILE (o neutro). Riferisciti a lui SEMPRE come un bambino (es: il piccolo ${nomeBambino || "Piccolo lettore"}, felice, addormentato, fortunato, un avventuriero, un viaggiatore, etc.), coniugando tutti gli articoli, pronomi e aggettivi al maschile! Usa emoji adatte come 👦 o 🧑.`;

      const childRoleInstruction = excludeBambino
        ? `IMPORTANTE: Il bambino/la bambina "${nomeBambino || "Piccolo lettore"}" NON deve essere un personaggio della storia. Non farlo/la apparire, parlare o partecipare fisicamente. La storia è semplicemente dedicata a lui/lei, ma si concentra solo ed esclusivamente sugli altri personaggi fantastici.`
        : `Il bambino/la bambina "${nomeBambino || "Piccolo lettore"}" deve partecipare attivamente all'avventura e ai dialoghi insieme agli altri personaggi. Riferisciti a lui/lei lungo la storia.`;

      const charactersInstruction = personaggi && personaggi.length > 0
        ? `Devi assolutamente includere TUTTI i personaggi selezionati dall'utente nella trama della storia. Ciascun personaggio elencato qui sotto deve apparire attivamente, parlare nei dialoghi e avere un ruolo preciso nell'avventura${excludeBambino ? "" : " insieme al bambino"}:\n${charactersStr}`
        : `Includi uno o due simpatici personaggi fantastici adatti alla categoria scelta (es. animaletti parlanti, draghetti, fatine, robottini, etc.).`;

      const brividiInstruction = categoria === "Piccoli Brividi"
        ? `
    - **Specifiche per Piccoli Brividi**: Crea un'atmosfera misteriosa, un po' spettrale ma divertente and rassicurante. Inserisci momenti di dolce SUSPENSE (ad esempio, ombre bizzarre che spaventano ma poi si rivelano simpatiche, porte che scricchiolano **GNEEE-CRAC**, suoni misteriosi che suscitano curiosità, vento sibilante, torce nel buio). La storia deve dare un piccolo brivido divertente, per poi risolversi in modo rassicurante e caloroso, insegnando al bambino che spesso le nostre paure svaniscono quando le affrontiamo con curiosità e amicizia!`
        : "";

      const comicoInstruction = categoria === "Comico"
        ? `
    - **Specifiche per Comico**: La storia deve essere incredibilmente DIVERTENTE, stramba, buffa e far sganasciare dalle risate il bambino! Inserisci situazioni comiche assurde (es. calzini usati come cappelli, dinosauri golosi che fanno puzze profumate di fragola, animali che scivolano buffamente, torte alla crema volanti, battaglie di cuscini morbidi, suoni esilaranti come **SGRUNT**, **SPLASH**, **PERETTA**, **BOING**, **PERA-COTTA**, **PRRR**). I personaggi devono essere simpatici pasticcioni con battute spiritose e versi buffi. La comicità deve essere adatta a bambini piccoli (pasticci colossali, cibo parlante, ruzzoloni divertenti, facce buffissime)!`
        : "";

      const bedtimeInstruction = isBedtimeMode
        ? `    - **Specifiche per Favola della Buonanotte (Sogni d'oro) 🌙**: La storia deve essere estremamente RILASSANTE, dolce, calma e conciliante per il sonno. Utilizza parole e atmosfere legate al riposo, alla quiete, alle stelle lucenti, alle nuvole morbide come cuscini e a sogni fatati. Il ritmo della narrazione deve essere lento e sognante. La morale deve rassicurare dolcemente il bambino e guidarlo verso il sonno. Scegli per la copertina tonalità calde della notte (es: 'pastel-purple' o 'pastel-blue') e elementi celesti.`
        : "";

      const stampatelloInstruction = etaBambino && etaBambino <= 6
        ? `    - **FORMATO DEL TESTO (CRITICO)**: Poiché il bambino ha ${etaBambino} anni e sta imparando a leggere o non conosce ancora il minuscolo/corsivo, DEVI ASSOLUTAMENTE scrivere l'INTERA STORIA (titolo, tutte le pagine, morale) ESCLUSIVAMENTE IN LETTERE MAIUSCOLE (STAMPATELLO MAIUSCOLO). Non usare nessuna lettera minuscola nel testo generato (ad eccezione delle chiavi del JSON).`
        : `    - **FORMATO DEL TESTO**: Usa il normale maiuscolo e minuscolo.`;

      const ageCoherenceInstruction = `    - **LINGUAGGIO E COERENZA ETÀ**: Il vocabolario, i temi trattati e lo stile narrativo devono essere PERFETTAMENTE ADATTI a un bambino di ${etaBambino || 5} anni. Se è piccolo (0-4), usa frasi molto semplici, suoni e concetti basilari. Se è più grande (5-7), usa una narrazione leggermente più articolata. Se è ancora più grande (8+), usa un linguaggio più maturo e concetti più sfaccettati.`;

      let promptText = "";

      if (parentStoryTitle && parentStoryPagine && parentStoryPagine.length > 0) {
        promptText = `
    Sei l'autore di una favola magica per bambini di fama mondiale. L'utente ha chiesto di scrivere la CONTINUAZIONE (il capitolo successivo) della storia intitolata "${parentStoryTitle}".
    Ecco il testo completo del capitolo precedente per darti il contesto esatto da cui continuare:
    ${parentStoryPagine.map((p: string, i: number) => `[Pagina ${i+1}]: ${p}`).join("\n\n")}
    La morale del capitolo precedente era: "${parentStoryMorale || ""}"

    Ora devi scrivere il CAPITOLO SUCCESSIVO (la continuazione diretta di questa avventura) per lo stesso bambino: Nome: ${nomeBambino || "Piccolo lettore"}, Età: ${etaBambino || 5} anni.
    Mantieni gli stessi personaggi (che devono essere presenti attivamente e ripresi dal testo precedente), lo stesso stile magico, cartoon, ed emozionante, e lo stesso tono di voce.
    
    Dettagli per questo nuovo capitolo:
    - **Categoria**: ${categoria || "Fantasy"}${brividiInstruction}${comicoInstruction}${bedtimeInstruction}
    - **Tema Educativo**: ${actualTema} (un nuovo valore o lo stesso, da insegnare con una nuova morale)
    - **Durata richiesta**: ${durata || "Media"} (Breve: 3 pagine corte, Media: 5 pagine, Lunga: 7 pagine)
    - **Genere del Bambino (MANDATORIO)**: ${genderInstruction}
${ageCoherenceInstruction}
${stampatelloInstruction}
    
    Linee guida fondamentali per la CONTINUAZIONE:
    1. **Ricomincia dall'azione**: Collega l'inizio di questo nuovo capitolo direttamente alla fine della storia precedente. I personaggi si ritrovano per una nuova giornata o un nuovo sviluppo partendo da dove si erano lasciati!
    2. Crea un titolo accattivante per questo capitolo, ad esempio includendo "(Capitolo 2)" o un sottotitolo magico correlato al precedente, arricchito con emoji.
    3. Inserisci regolarmente simpatiche emoticons/emoji lungo tutto il testo.
    4. Evidenzia le parole chiave in MAIUSCOLO tra doppi asterischi, come \`**MAGIA**\`, \`**RUGGITO**\`, \`**NUOVO CAPITOLO**\`, etc. Evidenzia ASSOLUTAMENTE IN QUESTO MODO ANCHE I NOMI di tutti i personaggi e del bambino ogni volta che vengono menzionati!
    5. **DIALOGHI PREDOMINANTI**: Almeno il 70% del testo deve essere composto da dialoghi attivi, divertenti ed espressivi tra i personaggi.
    6. Dividi questo capitolo in un numero di pagine appropriato (Breve = 3 pagine, Media = 5 pagine, Lunga = 7 pagine).
    7. Includi una "morale" esplicita per questo nuovo capitolo alla fine.
    8. Suggerisci un'idea per la copertina del nuovo capitolo (coverTheme) e una tonalità di colore pastello ideale.
        `;
      } else {
        promptText = `
    Scrivi una favola magica per bambini in lingua italiana estremamente ORIGINALE e mai ripetitiva o banale.

    Dettagli della favola:
    - **Categoria**: ${categoria || "Fantasy"}${brividiInstruction}${comicoInstruction}${bedtimeInstruction}
    - **Tema Educativo**: ${actualTema} (la storia deve insegnare delicatamente questo valore con una morale finale chiara)
    - **Durata richiesta**: ${durata || "Media"} (Breve: circa 3 pagine corte, Media: circa 5 pagine, Lunga: circa 7 pagine)
    - **Profilo del Bambino**: Nome: ${nomeBambino || "Piccolo lettore"}, Età: ${etaBambino || 5} anni. Adatta il vocabolario, la complessità e lo stile narrativo a questa età.
    - **Genere del Bambino (MANDATORIO)**: ${genderInstruction}
    - **Ruolo del Bambino**: ${childRoleInstruction}
    - **Personaggi da Includere (MANDATORIO - Usali TUTTI!)**:
    ${charactersInstruction}
${ageCoherenceInstruction}
${stampatelloInstruction}
    
    Linee guida fondamentali per l'ORIGINALITÀ e la SCRITTURA:
    1. **Evita la ripetitività e i cliché**: Non iniziare mai con frasi scontate come "C'era una volta nel magico regno di...". Sii creativo, parti subito dall'azione, dal mistero o da un dialogo divertente! Ogni storia deve essere un capolavoro unico.
    2. Usa uno stile cartoon, pastel, magico ed emozionante.
    3. Inserisci regolarmente tantissime simpatiche emoticons/emoji (🎨, 🐉, 🧚‍♀️, ✨, 🌟, 🎒, 🌲, etc.) lungo tutto le pagine per renderle colorate, espressive e super divertenti da guardare per un bambino!
    4. Evidenzia le parole chiave più magiche, suoni onomatopeici (es. **BUM**, **CRASH**, **GNEEE-CRAC**), emozioni fortes (es. **PAURA**, **CORAGGIO**, **FELICITÀ**) o elementi magici (es. **MAGIA**, **DRAGO**, **FATA**) scrivendole in MAIUSCOLO e racchiudendole rigorosamente tra doppi asterischi, ad esempio \`**MAGIA**\`, \`**RUGGITO**\`, \`**STRABILIANTE**\`, \`**GENTILEZZA**\`. Queste parole diventeranno giganti nell'applicazione! Inoltre, DEVI EVIDENZIARE in questo stesso modo (tra doppi asterischi e in MAIUSCOLO) I NOMI di tutti i personaggi e del bambino ogni volta che compaiono!
    5. **MASSIMA PRIORITÀ - DIALOGHI PREDOMINANTI**: La favola deve contenere MOLTI PIÙ DIALOGHI che descrizioni. Almeno il 70% del testo di ciascuna pagina deve essere composto da dialoghi attivi, divertenti ed espressivi tra i personaggi ${excludeBambino ? "" : "e il bambino"}. Riduci al minimo le parti puramente descrittive o i lunghi racconti del narratore. Fai interagire continuamente i personaggi attraverso vivaci battute (usa i trattini per i dialoghi in italiano, es: - Ciao! Come stai? - disse... - Benissimo! - rispose...).
    6. Dividi la favola in un numero di pagine appropriato per la durata: Breve = 3 pagine, Media = 5 pagine, Lunga = 7 pagine. Ciascuna pagina deve essere formata da 1 o 2 paragrafi, pronti per essere letti al bambino una pagina alla volta.
    7. Includi sempre una "morale" esplicita alla fine che riassuma in modo dolce e comprensibile l'insegnamento del tema educativo scelto.
    8. Suggerisci un'idea per la copertina e una tonalità di colore pastello ideale.
      `;
      }

      if (activeJobs.get(jobId)?.status === "cancelled") return;

      if (ai) {
        // Automatic retry wrapper with model fallback for transient API or deprecated model errors
        const executeWithRetry = async (maxAttempts = 3, delayMs = 1000) => {
          let attempt = 1;
          const defaultModels = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.1-pro-preview"];
          // Try preferred model first, then the remaining default models
          const models = [preferredModel, ...defaultModels.filter(m => m !== preferredModel)];
          
          while (attempt <= maxAttempts) {
            if (activeJobs.get(jobId)?.status === "cancelled") return null;

            const currentModel = models[attempt - 1] || "gemini-3.1-flash-lite";

            try {
              activeJobs.set(jobId, {
                id: jobId,
                status: "pending",
                progress: 30 + attempt * 12,
                step: `L'IA magica sta scrivendo la favola (${currentModel})... 📖`
              });

              // Create a 45-second timeout promise for this attempt
              const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Timeout")), 45000)
              );

              // Create the API generation promise
              const generatePromise = ai!.models.generateContent({
                model: currentModel,
                contents: promptText,
                config: {
                  systemInstruction: "Sei un autore di libri di fiabe e favole per bambini di fama mondiale. Scrivi favole magiche cariche di bellissimi dialoghi e conversazioni dirette (le favole devono contenere molti più dialoghi attivi ed espressivi tra i personaggi che descrizioni e parti narrative), tantissime simpatiche emoticons (emoji), morali dolci, e con parole chiave speciali scritte in MAIUSCOLO racchiuse tra doppi asterischi **PAROLA** per dare risalto. Restituisci sempre il risultato in formato JSON strutturato.",
                  temperature: 0.9,
                  responseMimeType: "application/json",
                  responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                      titolo: {
                        type: Type.STRING,
                        description: "Il titolo della favola, magico e accattivante, arricchito da una o due emoji."
                      },
                      pagine: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Array di pagine di testo della storia con emoji and parole evidenziate in **MAIUSCOLO**. La lunghezza dell'array deve corrispondere esattamente alla durata scelta (Breve: 3, Media: 5, Lunga: 7)."
                      },
                      morale: {
                        type: Type.STRING,
                        description: "Una morale dolce, educativa, adatta ai bambini, correlata al tema scelto, arricchito con emoji."
                      },
                      coverTheme: {
                        type: Type.STRING,
                        description: "Una sola parola chiave in inglese per la decorazione della copertina (es: 'dragon', 'unicorn', 'space', 'forest', 'sea', 'castle', 'robot', 'dinosaur', 'star', 'superhero')."
                      },
                      coverColor: {
                        type: Type.STRING,
                        description: "Una classe di colore di sfondo pastello per la copertina (scegli tra: 'pastel-pink', 'pastel-blue', 'pastel-purple', 'pastel-green', 'pastel-yellow')."
                      },
                      copertinaDescrizione: {
                        type: Type.STRING,
                        description: "Una breve descrizione figurativa della copertina illustrata."
                      },
                      personaggiGenerati: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "I nomi dei personaggi principali della favola."
                      }
                    },
                    required: ["titolo", "pagine", "morale", "coverTheme", "coverColor", "copertinaDescrizione", "personaggiGenerati"]
                  }
                }
              });

              // Race the generation against the 12s timeout
              const result = await Promise.race([generatePromise, timeoutPromise]);

              // If successful, save this model as the preferred model for future generations
              if (preferredModel !== currentModel) {
                console.log(`Setting new preferred model due to quick success: ${currentModel}`);
                preferredModel = currentModel;
              }

              return result;
            } catch (err: any) {
              const isTimeout = err?.message === "Timeout";
              const isRetryable = isTimeout || err?.status === 503 || err?.code === 503 || err?.status === 404 || err?.code === 404 ||
                                  String(err).includes("503") || String(err).includes("UNAVAILABLE") || String(err).includes("high demand") || 
                                  String(err).includes("temporary") || String(err).includes("404") || String(err).includes("not available") ||
                                  String(err).includes("NOT_FOUND") || String(err).includes("deprecated") || String(err).includes("Timeout");
              
              if (isRetryable && attempt < maxAttempts) {
                const nextModel = models[attempt] || "gemini-3.1-flash-lite";
                console.warn(`Gemini API error or slow response on ${currentModel} (attempt ${attempt}/${maxAttempts}). Reason: ${isTimeout ? "Timeout (took >45s)" : err?.message || err}. Retrying with ${nextModel} in ${delayMs}ms...`);
                
                activeJobs.set(jobId, {
                  id: jobId,
                  status: "pending",
                  progress: 30 + attempt * 15,
                  step: `Modello ${currentModel} lento o non disponibile. Provo ${nextModel}... 🪄`
                });

                await new Promise(resolve => setTimeout(resolve, delayMs));
                delayMs *= 1.5; // gentle backoff
                attempt++;
              } else {
                throw err;
              }
            }
          }
        };

        const response = await executeWithRetry();
        if (activeJobs.get(jobId)?.status === "cancelled") return;

        if (!response) {
          throw new Error("No response from Gemini after retries.");
        }

        const responseText = response.text;
        if (responseText) {
          activeJobs.set(jobId, {
            id: jobId,
            status: "pending",
            progress: 85,
            step: "Rifinitura della morale e della copertina illustrata... 🎨✨"
          });

          const storyData = JSON.parse(responseText.trim());
          storyData.categoria = categoria || storyData.categoria || "Fantasy";
          let parsedPagine = storyData.pagine || [];
          if (Array.isArray(parsedPagine)) {
            parsedPagine = parsedPagine.filter((p: string) => p && p.trim().length > 20 && !["coverTheme", "coverColor"].includes(p.trim()));
          }
          storyData.pagine = parsedPagine;

          let resolvedPersonaggi = personaggi || [];
          if (resolvedPersonaggi.length === 0 && storyData.personaggiGenerati && storyData.personaggiGenerati.length > 0) {
            resolvedPersonaggi = storyData.personaggiGenerati.map((nome: string) => ({ nome, tipo: "Personaggio", caratteristica: "" }));
          }
          storyData.personaggi = resolvedPersonaggi;
          
          if (isBedtimeMode) {
            storyData.isBedtimeMode = true;
            storyData.categoria = "Buonanotte 🌙";
          }

          activeJobs.set(jobId, {
            id: jobId,
            status: "completed",
            progress: 100,
            step: "La favola magica è pronta! 📖✨",
            data: storyData
          });
          return;
        } else {
          throw new Error("Empty response from Gemini.");
        }
      } else {
        // Mock fallback if AI is not initialized
        if (activeJobs.get(jobId)?.status === "cancelled") return;

        activeJobs.set(jobId, {
          id: jobId,
          status: "pending",
          progress: 50,
          step: "Generazione offline dell'incantesimo narrativo... 🪄"
        });

        await new Promise(resolve => setTimeout(resolve, 3000));

        if (activeJobs.get(jobId)?.status === "cancelled") return;

        const mockData = generateFallbackStory(categoria, actualTema, durata, nomeBambino, etaBambino, personaggi, parentStoryTitle);
        
        activeJobs.set(jobId, {
          id: jobId,
          status: "completed",
          progress: 100,
          step: "La favola magica offline è pronta! 📖✨",
          data: mockData
        });
      }
    } catch (err: any) {
      console.error("All Gemini API attempts failed, falling back to offline generator:", err);
      try {
        if (activeJobs.get(jobId)?.status === "cancelled") return;

        activeJobs.set(jobId, {
          id: jobId,
          status: "pending",
          progress: 80,
          step: "Conversione in modalità di riserva offline... 🪄"
        });

        await new Promise(resolve => setTimeout(resolve, 1500));

        if (activeJobs.get(jobId)?.status === "cancelled") return;

        const fallbackStory = generateFallbackStory(categoria, actualTema, durata, nomeBambino, etaBambino, personaggi, parentStoryTitle);
        
        activeJobs.set(jobId, {
          id: jobId,
          status: "completed",
          progress: 100,
          step: "Favola magica offline pronta! 📖✨",
          data: { ...fallbackStory, isOffline: true }
        });
      } catch (fallbackErr) {
        activeJobs.set(jobId, {
          id: jobId,
          status: "failed",
          progress: 100,
          step: "Incantesimo fallito.",
          error: "Errore durante la generazione della favola. Verifica la connessione e riprova!"
        });
      }
    }
  })();
});

// Endpoint to poll the status of a story generation job
app.get("/api/stories/status/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = activeJobs.get(jobId);
  if (!job) {
    return res.status(404).json({ error: "Lavoro di generazione non trovato." });
  }
  res.json(job);
});

// Endpoint to cancel an active story generation job
app.post("/api/stories/cancel/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = activeJobs.get(jobId);
  if (job) {
    job.status = "cancelled";
    job.step = "Incantesimo annullato. 🪄";
    job.progress = 100;
    activeJobs.set(jobId, job);
    console.log(`Job ${jobId} was successfully cancelled by the user.`);
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Lavoro di generazione non trovato." });
});

function generateFallbackStory(
  categoria: string,
  tema: string,
  durata: string,
  nomeBambino: string,
  etaBambino: number,
  personaggi: any[],
  parentStoryTitle?: string
) {
  const cat = categoria || "Fantasy";
  const t = tema || "Amicizia";
  const bimbo = nomeBambino || "Piccolo Avventuriero";
  const numPagine = durata === "Breve" ? 3 : durata === "Lunga" ? 7 : 5;
  const etaStr = etaBambino ? `di ${etaBambino} anni` : "";

  // Pick cover suggestions
  const colors = ["pastel-pink", "pastel-blue", "pastel-purple", "pastel-green", "pastel-yellow"];
  const coverColor = colors[Math.floor(Math.random() * colors.length)];
  const coverThemes: Record<string, string> = {
    "Fantasy": "unicorn",
    "Fantascienza": "robot",
    "Avventura": "castle",
    "Mistero": "star",
    "Natura": "forest",
    "Mare": "sea",
    "Spazio": "space",
    "Supereroi": "superhero",
    "Dinosauri": "dinosaur",
    "Fiaba Classica": "castle",
    "Comico": "clown",
    "Piccoli Brividi": "ghost"
  };
  const coverTheme = coverThemes[cat] || "star";

  // Gender detection and variables
  const isGirl = isFemminile(nomeBambino);
  const bimboEmoji = isGirl ? "👧" : "👦";
  const artBimbo = isGirl ? "la piccola" : "il piccolo";
  const bimboSuf = isGirl ? "a" : "o";
  const bimboAvent = isGirl ? "viaggiatrice" : "viaggiatore";

  // Build characters representation
  const charList = personaggi && personaggi.length > 0 ? personaggi : [];

  // Character 1
  const p1 = charList[0] ? charList[0].nome : (cat === "Piccoli Brividi" ? "Spettroldo 👻" : "Nuvola Bianca ☁️");
  const t1 = charList[0] ? charList[0].tipo : (cat === "Piccoli Brividi" ? "fantasmino" : "nuvoletta");
  const c1 = charList[0] ? charList[0].caratteristica : (cat === "Piccoli Brividi" ? "pieno di solletico" : "molto soffice");

  // Character 2
  const p2 = charList[1] ? charList[1].nome : "Gatto Miao 🐱";
  const t2 = charList[1] ? charList[1].tipo : "gattino stellare";
  const c2 = charList[1] ? charList[1].caratteristica : "molto curioso e giocherellone";

  // Character 3
  const p3 = charList[2] ? charList[2].nome : "Drago Sbuffo 🐉";
  const t3 = charList[2] ? charList[2].tipo : "draghetto viola";
  const c3 = charList[2] ? charList[2].caratteristica : "che soffia bolle profumate";

  let title = `✨ L'Incredibile Viaggio nel Regno del ${cat} 🌈`;
  let pages: string[] = [];
  let morale = "";
  let copertinaDescrizione = "";

  if (parentStoryTitle) {
    title = `💫 ${parentStoryTitle} - Cap. 2: Il Nuovo Segreto ⭐`;
    copertinaDescrizione = `Una copertina magica con sfondo colorato per il Capitolo 2 della favola "${parentStoryTitle}", con ${artBimbo} ${bimbo} e i suoi amici.`;
    pages.push(
      `Il mattino seguente, dopo la splendida avventura di "${parentStoryTitle}", ${artBimbo} ${bimbo} ${etaStr} ${bimboEmoji} si svegliò con gli occhi pieni di sogni. Ma sul comodino brillava uno strano biglietto dorato...\n- Guarda, ${p1}! - esclamò il bambino indicando il foglio. - C'è scritto che la nostra missione non è finita!`
    );
    pages.push(
      `Insieme a ${p2 || "i nostri fedeli amici"}, decisero di rimettersi in cammino. Questa volta dovevano esplorare una nuova zona del Regno del ${cat} per imparare il valore della **${t.toUpperCase()}**! - Sarà un capitolo incredibile! - gridò entusiasta ${p1}.`
    );
    if (numPagine >= 5) {
      pages.push(
        `Mentre camminavano, incontrarono una simpatica creatura che non riusciva a superare un piccolo ponte sospeso. Con la nostra **${t.toUpperCase()}** e la collaborazione, riuscirono a fargli superare la timidezza e camminarono insieme in modo **STRABILIANTE**!`
      );
      pages.push(
        `La creatura ringraziò offrendo loro dei frutti magici colorati che davano la forza di compiere salti giganti! Tutti risero felicissimi per quel dono inaspettato.`
      );
    }
    if (numPagine === 7) {
      pages.push(
        `Più tardi, si unì a loro anche ${p3 || "una simpatica nuvoletta marina"} che faceva piovere brillantini d'oro! La via del ritorno era ormai interamente illuminata e profumata.`
      );
      pages.push(
        `Ogni angolo di questa nuova terra sembrava sussurrare canzoni d'amicizia e gioia, riempiendo i cuori di meraviglia e coraggio.`
      );
    }
    pages.push(
      `Ormai giunta la sera, ${bimbo} rientrò a casa stanchissim${bimboSuf} ma immensamente felice 😴. Stringendo il suo pupazzo preferito, sussurrò: - Che capitolo meraviglioso abbiamo vissuto oggi! Buonanotte, miei fantastici compagni d'avventure!`
    );
    morale = `La morale di questa nuova avventura è che ogni storia non finisce mai veramente se teniamo vivo lo spirito d'avventura e della **${t.toUpperCase()}** nel nostro cuore, scoprendo ogni giorno nuovi amici e nuove lezioni! 💖✨`;
  } else if (cat === "Piccoli Brividi") {
    title = `🔦 Il Mistero del Rumore Misterioso e il Saggio ${p1} 👻`;
    copertinaDescrizione = `Una copertina spettrale ma adorabile con uno sfondo blu notte stellato, in cui ${artBimbo} ${bimbo} tiene una torcia luminosa che illumina un fantasmino sorridente e colorato.`;
    
    pages.push(
      `Fuori la luna 🌙 splendeva alta e argentata nel cielo notturno. Nella sua cameretta tiepida, ${artBimbo} ${bimbo} ${etaStr} ${bimboEmoji} faticava ad addormentarsi. All'improvviso... un suono misterioso ruppe il silenzio: *GNEEE-CRAC*! 🏚️\n- Chi c'è lì? - sussurrò ${bimbo}, sentendo un piccolo brivido di **PAURA** risalire lungo la schiena. Ma proprio sotto il letto, fece capolino una buffa testa tonda e trasparente: era ${p1}, un piccolo ${t1} che era ${c1}! 👋`
    );

    let page2Text = `- Scusa per il rumore! 😅 - ridacchiò ${p1} facendo fare un suono magico alla sua torcia *BIP-BIP* 🔦. - Volevo solo invitarti a giocare a nascondino luminoso! Non c'è nulla di cui avere paura nel buio, se impariamo a conoscerlo insieme! Oggi esploreremo la misteriosa soffitta delle ombre magiche e metteremo alla prova la nostra **${t.toUpperCase()}**! 💖`;
    if (charList[1]) {
      page2Text += `\n- E guarda chi c'è con me! - aggiunse ${p1}. Dietro un cuscino spuntò infatti ${p2}, un adorabile ${t2} famoso per essere ${c2}! Che magica compagnia!`;
    }
    pages.push(page2Text);

    if (numPagine >= 5) {
      let page3Text = `I piccoli esploratori salirono le scale scricchiolanti mano nella mano 🤝. In cima alla soffitta, videro un'ombra gigantesca e spaventosa con enormi artigli che si muoveva sulla parete! **BUM-BUM**! Il cuore di ${bimbo} batteva forte.\n- Aspetta! - disse ${p1} sorridendo. - Accendiamo la luce insieme per capire cos'è! Unendo le nostre forze e la nostra **${t.toUpperCase()}**, sveleremo il segreto! 💡`;
      if (charList[1]) {
        page3Text = `I piccoli esploratori, guidati da ${p1} e dal coraggioso ${p2}, salirono le scale scricchiolanti mano nella mano 🤝. In cima alla soffitta, videro un'ombra gigantesca e spaventosa con enormi artigli sulla parete! **BUM-BUM**! Il cuore di ${bimbo} batteva forte.\n- Aspetta! - disse ${p2} sorridendo. - Accendiamo la luce insieme! Con la nostra **${t.toUpperCase()}**, sveleremo il segreto! 💡`;
      }
      pages.push(page3Text);

      pages.push(
        `*Click*! La torcia si accese e... sorpresa! 🎉 L'ombra gigante era solo un minuscolo orsetto di peluche appoggiato vicino a un piccolo ventilatore che faceva girare le sue orecchie di stoffa! Scoppiarono tutti in una fragorosa risata 😂.\n- Visto? - esclamò ${p1} ballando a mezz'aria. - Spesso le cose che ci fanno spaventare sono solo piccoli malintesi divertenti! 🧸`
      );
    }

    if (numPagine === 7) {
      let page5Text = `All'improvviso, un simpatico pipistrello giocherellone sbucò da un baule polveroso facendo un simpatico verso *FRU-FRU* 🦇. Aveva perso il suo piccolo ciuccio luminoso e piagnucolava sconsolato. ${bimbo} e ${p1} decisero subito di aiutarlo nella ricerca!`;
      if (charList[2]) {
        page5Text = `All'improvviso, dal baule polveroso sbucò anche ${p3}, un simpatico ${t3} conosciuto per essere ${c3}! Si unì subito alla squadra per cercare un prezioso tesoro perduto della soffitta, muovendosi con passi agili e facendo divertenti versi *FRU-FRU*!`;
      }
      pages.push(page5Text);

      let page6Text = `Cercando sotto i vecchi libri di fiabe, finalmente trovarono l'oggetto smarrito ⭐. Tutti fecero un balzo di gioia **STRABILIANTE** e si abbracciarono calorosamente, dimostrando che l'aiuto reciproco illumina anche la soffitta più scura!`;
      if (charList[2]) {
        page6Text = `Grazie all'incredibile fiuto di ${p3} e all'aiuto di ${p2}, trovarono finalmente l'oggetto magico ⭐ sotto un vecchio libro di fiabe. Tutti fecero un balzo di gioia **STRABILIANTE** e si abbracciarono forte, dimostrando che l'aiuto reciproco e la simpatia risolvono ogni mistero!`;
      }
      pages.push(page6Text);
    }

    pages.push(
      `La notte era ormai fonda, ma la cameretta era piena di risate e luci colorate 🌟. ${bimbo} si infilò sotto le coperte con una sensazione di totale **FELICITÀ** e calore nel cuore 😴. Aveva capito che persino i brividi più freddi si sciolgono davanti alla forza della **${t.toUpperCase()}** e alla curiosità.\n- Buonanotte, miei magici amici! 👋 - sussurrò felice, mentre ${p1} le rimboccava dolcemente le lenzuola.`
    );

    morale = `La morale 💖 di questa avventura da brividi è che la paura svanisce quando la guardiamo da vicino con la luce della curiosità e l'aiuto degli amici: affrontando i misteri insieme a chi amiamo con **${t.toUpperCase()}** ✨, scopriamo che il mondo riserva solo calore e dolci sorprese! 🔦👻`;

  } else if (cat === "Comico") {
    title = `🤪 La Pazzesca Avventura del Paese del Sotto-Sopra e ${p1} 🍭`;
    copertinaDescrizione = `Un disegno super colorato e buffo con ${artBimbo} ${bimbo} che ride a crepapelle mentre ${p1} (${t1}) indossa un calzino rosso come cappello e fa giochi di prestigio strambi con frutti saltellanti.`;

    pages.push(
      `In un mattino assolutamente pazzesco, ${artBimbo} ${bimbo} ${etaStr} ${bimboEmoji} si svegliò sentendo un rumore buffissimo provenire da sotto il cuscino: **PRRR**! 💨\nNon era una trombetta, ma proprio ${p1}, un buffissimo ${t1} famoso per essere ${c1}! Aveva un calzino rosso sulla testa come cappello e cercava di infilarsi una scarpa sull'orecchio! 🧦\n- Ehi là! - gridò con una voce stramba. - Oggi faremo dei pasticci esilaranti nel leggendario Paese del Sotto-Sopra e metteremo alla prova la nostra **${t.toUpperCase()}**! 🤪`
    );

    let page2Text = `Con un balzo sbilenco... **BOING**! 🐇 si ritrovarono nel Paese delle Torte Volanti! Lì, gli alberi avevano foglie di pizza 🍕 e fiumi di gassosa frizzante facevano fare ruttini spaziali! Una gallina gialla con gli occhiali da sole 🐔 correva all'indietro gridando: - Un uovo al cioccolato è scappato! -\n- Inseguiamolo! - strillò ${p1}, inciampando in un budino gigante e facendo un ruzzolone tremendo: **SPLASH**! 😂`;
    if (charList[1]) {
      page2Text += `\nAll'improvviso sbucò anche ${p2}, un bizzarro ${t2} ${c2}, che cavalcava un ombrello volante urlando: - Arrivano i nostri! -`;
    }
    pages.push(page2Text);

    if (numPagine >= 5) {
      let page3Text = `All'improvviso... **BUM**! 💥 Una gigantesca scimmia ballerine di tip-tap apparve indossando un tutù rosa confetto 🐒! Voleva a tutti i costi fare una sfida di facce buffissime.\n- Se vogliamo passare, dobbiamo sconfiggerla a suon di risate e dmostrare la nostra **${t.toUpperCase()}**! - disse ${p1}, incrociando gli occhi e tirando fuori la lingua fino al mento! 👅`;
      if (charList[1]) {
        page3Text = `All'improvviso... **BUM**! 💥 Una gigantesca scimmia ballerine di tip-tap apparve indossando un tutù rosa confetto 🐒! Voleva a tutti i costi fare una sfida di facce buffissime.\n- Dobbiamo sconfiggerla a suon di risate! - esclamò ${p2}, mettendosi a fare capriole ridicole e ballando il tip-tap insieme alla scimmia per mostrare la nostra **${t.toUpperCase()}**! 🤸`;
      }
      pages.push(page3Text);

      pages.push(
        `${bimbo} non volle essere da meno: si mise le dita nelle orecchie, arricciò il naso e fece un verso strampalato: - BLA-BLA-BLA-MUUU! 🐮 -\nLa scimmia scoppiò a ridere così forte che iniziò a rotolare per terra come una polpetta gigante! La strada era libera e i nostri eroi festeggiarono con un salto **STRABILIANTE**! 🤸`
      );
    }

    if (numPagine === 7) {
      let page5Text = `Mentre ripulivano i vestiti dai coriandoli, incontrarono un piccolo draghetto timido con il singhiozzo magico 🐉. Ad ogni singhiozzo... *hic*... sputava una bolla di sapone che profumava di formaggio! **BIP-BIP**! Era un pasticcio pazzesco che faceva ballare persino i fiori.`;
      if (charList[2]) {
        page5Text = `Mentre ripulivano i vestiti, saltò fuori dalle siepi ${p3}, un superbo ${t3} che era ${c3}! Stava cercando di fare canestro con dei pomodori giganti in un cappello, ma i pomodori continuavano a fare **SPLASH** sulla sua pancia! 🍅`;
      }
      pages.push(page5Text);

      let page6Text = `Per curarlo, ${bimbo} e ${p1} gli fecero un solletico gigantesco sotto le ascelle: *pizzica-pizzica*! Il draghetto fece una risata così forte da spazzar via tutte le bolle, ringraziando calorosamente e regalando loro un magico cappello fatto di zucchero filato! 🍬`;
      if (charList[2]) {
        page6Text = `Insieme, ${bimbo}, ${p1}, ${p2} e ${p3} iniziarono una battaglia di cuscini di zucchero filato super morbidi! Tra risate a crepapelle e versi buffi, si divertirono così tanto che persino gli alberi di pizza iniziarono a ballare la samba! 💃`;
      }
      pages.push(page6Text);
    }

    pages.push(
      `La giornata piena di ruzzoloni, battute e risate era finita. ${bimbo} si infilò nel lettino ancora ridendo a crepapelle per la scimmia in tutù e il calzino sulla testa 😴. Nel cuore sentiva una grandissima **FELICITÀ**: aveva capito che la vera **${t.toUpperCase()}** si coltiva anche regalando gioia e sorrisi a chiunque si incontri! ❤️\n- Buonanotte, miei adorabili clown! - sussurrò mentre si addormentava col sorriso.`
    );

    morale = `La morale 💖 di questa pazza avventura è che il sorriso e la risata sono i superpoteri più belli che abbiamo: quando affrontiamo la vita con allegria, gentilezza e **${t.toUpperCase()}** ✨, anche le giornate più storte si trasformano in un festival di risate contagiose! 🤪🍕`;

  } else {
    // Elegant and non-repetitive classic adventure/fantasy story with unique details
    title = `💫 ${bimbo} e il Custode della Stella di ${t} ⭐`;
    copertinaDescrizione = `Un'illustrazione pastello incantevole con ${artBimbo} ${bimbo} che indica una stella splendente nel cielo insieme al suo fidato amico ${p1}.`;

    pages.push(
      `Il vento caldo della sera sussurrava antiche melodie tra le fronde degli alberi d'oro 🌲. ${bimbo} ${etaStr} ${bimboEmoji} camminava leggero sul sentiero di muschio soffice. Non era un giorno come gli altri: la mitica Stella della **${t.toUpperCase()}** aveva smesso di brillare nel cielo. Fu in quel momento che apparve ${p1}, un nobile e saggio ${t1} che era conosciuto per essere ${c1}! ✨`
    );

    let page2Text = `- Benvenuto, giovane ${bimboAvent}! 👋 - lo salutò ${p1} con un inchino cortese. - La stella ha bisogno del calore puro del tuo cuore per tornare a illuminare il cammino di tutti. Vuoi aiutarmi in questa missione straordinaria? Oggi la vera **MAGIA** si accenderà grazie al potere della nostra **${t.toUpperCase()}**! 💖`;
    if (isGirl) {
      page2Text = `- Benvenuta, giovane ${bimboAvent}! 👋 - la salutò ${p1} con un inchino cortese. - La stella ha bisogno del calore puro del tuo cuore per tornare a illuminare il cammino di tutti. Vuoi aiutarmi in questa missione straordinaria? Oggi la vera **MAGIA** si accenderà grazie al potere della nostra **${t.toUpperCase()}**! 💖`;
    }
    if (charList[1]) {
      page2Text += `\nAd accompagnarli c'era anche ${p2}, un incantevole ${t2} noto per essere ${c2}, che portava con sé una borsa di polvere di stelle fatata!`;
    }
    pages.push(page2Text);

    if (numPagine >= 5) {
      let page3Text = `Per raggiungere la vetta della montagna lucente, dovevano superare la Valle dei Sussurri. Un fitto nebbione argentato avvolse improvvisamente il sentiero. **FRU-FRU**... rami fatati si intrecciavano ostacolando il passo.\n- Ho un po' di **PAURA** di perdere la strada! - sussurrò ${bimbo}.\n- Non temere! - lo incoraggiò ${p1}. - Tieni stretta la mia mano. Finché camminiamo uniti dalla **${t.toUpperCase()}**, nessuna nebbia potrà mai spegnere la nostra direzione! 🤝`;
      if (charList[1]) {
        page3Text = `Per raggiungere la vetta della montagna lucente, dovevano superare la Valle dei Sussurri. Un fitto nebbione argentato avvolse improvvisamente il sentiero. **FRU-FRU**... rami fatati si intrecciavano.\n- Ho un po' di **PAURA**! - sussurrò ${bimbo}.\n- Non temere! - disse ${p2} illuminando la via con la sua borsa magica. - Con la nostra **${t.toUpperCase()}**, supereremo ogni ostacolo! 🤝`;
      }
      pages.push(page3Text);

      pages.push(
        `Insieme, intonarono una dolce canzone che parlava di sogni e di unione. Al suono delle loro voci piene di speranza, la nebbia si diradò all'istante lasciando il posto a uno spettacolo **STRABILIANTE** di fiori di cristallo luminosi! Il coraggio e l'intesa li avevano guidati perfettamente 🌸.`
      );
    }

    if (numPagine === 7) {
      let page5Text = `Sulla cima della montagna, un draghetto timido proteggeva la Stella affievolita 🐉. Aveva freddo e si sentiva solo. ${bimbo} si avvicinò con infinita gentilezza, avvolgendolo con la sua sciarpa calda e offrendogli parole di conforto e amicizia sincera.`;
      if (charList[2]) {
        page5Text = `Sulla cima della montagna lucente incontrarono ${p3}, un nobile ${t3} ${c3}. Proteggeva la Stella affievolita ma era infreddolito e triste. ${bimbo} si avvicinò con infinita dolcezza per rincuorarlo.`;
      }
      pages.push(page5Text);

      let page6Text = `Riscaldato da quel gesto premuroso, il draghetto fece un forte **RUGGITO** di gioia pura! La Stella d'oro, alimentata da tanta pura bontà, tornò a brillare sprignorando una cascata di polvere magica su tutta la vallata!`;
      if (charList[2]) {
        page6Text = `Con l'aiuto della magia di ${p3} e della dolcezza di ${p2}, avvolsero la Stella con ghirlande profumate di fiori di cristallo. All'improvviso, la Stella tornò a brillare sprigionando una cascata di polvere magica **STRABILIANTE** su tutta la vallata!`;
      }
      pages.push(page6Text);
    }

    pages.push(
      `Con il cielo di nuovo splendente di infinite costellazioni colorate, ${bimbo} fece ritorno a casa, sentendosi pien${bimboSuf} di gioia e **FELICITÀ** 😴. Abbracciò il suo morbido cuscino sapendo che la Stella della **${t.toUpperCase()}** brillava ora forte anche dentro il suo cuore.\n- Grazie per questo viaggio magico, miei splendidi amici! - mormorò dolcemente prima di addormentarsi.`
    );

    morale = `La morale 💖 di questo magico racconto è che anche il più piccolo gesto d'affetto può riaccendere la luce più grande del mondo: coltivando l'amore, l'unione e la **${t.toUpperCase()}** ✨, diventiamo custodi capaci di riscaldare e illuminare il cuore di chi ci circonda. 🌈`;
  }

  return {
    titolo: title,
    pagine: pages,
    morale: morale,
    coverTheme,
    coverColor,
    copertinaDescrizione,
    isOffline: true,
    personaggi
  };
}

// Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

startServer();
