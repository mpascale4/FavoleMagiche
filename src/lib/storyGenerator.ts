import { GoogleGenAI, Type } from "@google/genai";
import { Character } from "../types";
import { GEMINI_API_KEY, getGeminiApiKeyStatus } from "../config/api";

export interface GenerationLog {
  timestamp: string;
  source: "gemini" | "fallback" | "error";
  model?: string;
  reason?: string;
  availableModels?: string[];
  error?: string;
}

/**
 * Salva il log della generazione in localStorage
 */
export function saveGenerationLog(log: GenerationLog): void {
  try {
    const existing = localStorage.getItem("favole_magiche_generation_log");
    const logs: GenerationLog[] = existing ? JSON.parse(existing) : [];
    logs.push(log);
    // Mantieni solo gli ultimi 20 log
    const trimmed = logs.slice(-20);
    localStorage.setItem("favole_magiche_generation_log", JSON.stringify(trimmed));
    console.log(`[Gemini Log] Salvato: ${log.source} - ${log.reason || log.model || log.error}`);
  } catch (e) {
    console.warn("[Gemini Log] Errore nel salvataggio log:", e);
  }
}

/**
 * Legge i log salvati
 */
export function getGenerationLogs(): GenerationLog[] {
  try {
    const raw = localStorage.getItem("favole_magiche_generation_log");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("[Gemini Log] Errore nel caricamento log:", e);
    return [];
  }
}

export interface StoryGenerationConfig {
  categoria: string;
  temaEducativo: string;
  durata: "Breve" | "Media" | "Lunga";
  personaggi: Character[];
  nomeBambino: string;
  etaBambino: number;
  parentStoryTitle?: string;
  parentStoryPagine?: string[];
  parentStoryMorale?: string;
  seriesId?: string;
  chapter?: number;
  isBedtimeMode?: boolean;
}

export interface StoryGenerationResult {
  titolo: string;
  pagine: string[];
  morale: string;
  coverTheme: string;
  coverColor: string;
  copertinaDescrizione: string;
  personaggiGenerati: string[];
  isOffline?: boolean;
  generationSource?: "gemini" | "fallback";
  usedModel?: string;
  fallbackReason?: string;
}

interface GenerationOptions {
  onProgress?: (progress: number, step: string) => void;
  isCancelled?: () => boolean;
}

const COLORS = ["pastel-pink", "pastel-blue", "pastel-purple", "pastel-green", "pastel-yellow"];
const MODEL_CANDIDATES = ["gemini-flash-latest", "gemini-2.0-flash", "gemini-2.5-flash"];
const COVER_THEMES: Record<string, string> = {
  Fantasy: "unicorn",
  Avventura: "castle",
  Mistero: "star",
  Natura: "forest",
  Spazio: "space",
  Supereroi: "superhero",
  Preistoria: "dinosaur",
  "Fiaba Classica": "castle",
  Mitologia: "dragon",
  Abissi: "sea"
};

/**
 * Verifica quali modelli Gemini sono effettivamente disponibili e utilizzabili via API.
 * Ritorna una lista ordinata di modelli con quota disponibile.
 */
async function getAvailableModels(apiKey: string): Promise<string[]> {
  return MODEL_CANDIDATES;
}

function expectedPages(durata: StoryGenerationConfig["durata"]): number {
  if (durata === "Breve") return 3;
  if (durata === "Lunga") return 7;
  return 5;
}

function ensureNotCancelled(isCancelled?: () => boolean): void {
  if (isCancelled?.()) {
    throw new Error("GENERATION_CANCELLED");
  }
}

function buildPrompt(config: StoryGenerationConfig): string {
  const pageCount = expectedPages(config.durata);
  const characters = config.personaggi.length > 0
    ? config.personaggi
        .map((p) => `- ${p.nome} (${p.tipo}${p.caratteristica ? `, ${p.caratteristica}` : ""})`)
        .join("\n")
    : "- Personaggi fantastici adatti al tema";

  const continuationContext = config.parentStoryTitle && config.parentStoryPagine?.length
    ? `
Questa e una continuazione della storia "${config.parentStoryTitle}".
Capitolo precedente:
${config.parentStoryPagine.map((p, i) => `[Pagina ${i + 1}] ${p}`).join("\n")}
Morale precedente: ${config.parentStoryMorale || "Non disponibile"}
`
    : "";

  const bedtime = config.isBedtimeMode
    ? "La storia deve essere molto rilassante e adatta all'addormentamento."
    : "";

  return `
Scrivi una favola per bambini in italiano, vivace e adatta a ${config.etaBambino} anni.
Categoria: ${config.categoria}
Tema educativo: ${config.temaEducativo}
Durata: ${config.durata} (${pageCount} pagine esatte)
Bambino: ${config.nomeBambino}
${bedtime}
${continuationContext}
Personaggi da usare:
${characters}

Requisiti:
1) Inserisci dialoghi naturali e facili da leggere.
2) Ogni pagina deve essere un testo separato nell'array "pagine".
3) Concludi con una morale chiara.
4) Suggerisci coverTheme in inglese e coverColor tra: ${COLORS.join(", ")}.
5) Usa un linguaggio positivo, rassicurante e adatto ai bambini.
6) IMPORTANTE PER I DIALOGHI: Adatta fedelmente il modo di parlare dei personaggi alla loro natura. 
   - Se un personaggio è un "Bebè", il suo linguaggio DEVE essere da bebè (es. usa solo versi, lallazioni, paroline storpiate o molto semplici come "pappa", "ghe-ghe", "brmm"). 
   - Se un personaggio è un "Robot", DEVE avere un linguaggio meccanico con rumori tecnologici (es. Bip-bop, calcolo in corso, bzzzz). 
   - Se il personaggio è un animale (es. "Cucciolo"), NON DEVE PARLARE in lingua umana, ma esprimersi solo e unicamente con i suoi versi naturali e azioni (es. *bau bau*, *scodinzola*, *pant pant*). Qualsiasi altro animale deve seguire questa regola e fare solo il proprio verso.
7) FORMATTAZIONE SPECIALE PER L'INTERATTIVITÀ (MOLTO IMPORTANTE):
   - Devi SEMPRE evidenziare i nomi dei personaggi e del bambino racchiudendoli rigorosamente tra doppi asterischi ogni volta che compaiono, ad esempio: **${config.nomeBambino}**.
   - Evidenzia anche altre 2-4 parole chiave, magiche o importanti per ciascuna pagina, ad esempio: **magia**, **drago**, **bosco**, **salto**.
   - Inserisci in punti strategici del testo (all'inizio, alla fine o vicino a parole evocative) alcune emoji che rappresentano suoni ed effetti sonori (ad esempio: 🧚, ✨, 🐉, 🦁, 🔔, ⭐, 🌲, 🍃, 🐇, 🐸, 🌌, 👻, 🎉, 🥳, 👋). Queste emoji verranno visualizzate come pulsanti audio interattivi con effetto sonoro. Metti 1 o 2 emoji interattive per pagina.
`;
}

function normalizeGeminiResponse(raw: string, config: StoryGenerationConfig): StoryGenerationResult {
  const parsed = JSON.parse(raw.trim());
  const pageCount = expectedPages(config.durata);

  const pagine = Array.isArray(parsed.pagine)
    ? parsed.pagine.filter((p: string) => typeof p === "string" && p.trim().length > 0).slice(0, pageCount)
    : [];

  while (pagine.length < pageCount) {
    pagine.push("La storia continua con un piccolo momento di magia e gentilezza.");
  }

  const coverColor = COLORS.includes(parsed.coverColor) ? parsed.coverColor : "pastel-blue";
  const coverTheme = typeof parsed.coverTheme === "string" && parsed.coverTheme.trim().length > 0
    ? parsed.coverTheme
    : (COVER_THEMES[config.categoria] || "star");

  return {
    titolo: typeof parsed.titolo === "string" && parsed.titolo.trim() ? parsed.titolo : `Favola su ${config.temaEducativo} ✨`,
    pagine,
    morale: typeof parsed.morale === "string" && parsed.morale.trim()
      ? parsed.morale
      : `La morale e che ${config.temaEducativo.toLowerCase()} ci aiuta a crescere con il sorriso.`,
    coverTheme,
    coverColor,
    copertinaDescrizione: typeof parsed.copertinaDescrizione === "string" && parsed.copertinaDescrizione.trim()
      ? parsed.copertinaDescrizione
      : `Una scena dolce in stile ${config.categoria.toLowerCase()} con ${config.nomeBambino}.`,
    personaggiGenerati: Array.isArray(parsed.personaggiGenerati)
      ? parsed.personaggiGenerati.filter((p: string) => typeof p === "string").slice(0, 6)
      : config.personaggi.map((p) => p.nome)
  };
}

function describeGeminiFailure(error: unknown): string {
  const anyError = error as { message?: string; status?: number; code?: number };
  const message = anyError?.message || "Errore Gemini sconosciuto";
  const status = anyError?.status ?? anyError?.code;

  if (status === 429 || message.toLowerCase().includes("quota")) {
    return "Quota Gemini esaurita o non disponibile per il tuo progetto";
  }

  if (status === 404 || message.toLowerCase().includes("no longer available")) {
    return "Modello Gemini non disponibile per questo account";
  }

  if (status === 401 || status === 403) {
    return "Chiave API Gemini non autorizzata o senza permessi";
  }

  return "Gemini non raggiungibile in questo momento";
}

function isDeprecatedModelError(error: unknown): boolean {
  const anyError = error as { message?: string; status?: number; code?: number };
  const message = (anyError?.message || "").toLowerCase();
  const status = anyError?.status ?? anyError?.code;
  return status === 404 || message.includes("no longer available");
}

function generateFallbackStory(config: StoryGenerationConfig, reason?: string): StoryGenerationResult {
  const pageCount = expectedPages(config.durata);
  const mainCharacter = config.personaggi[0]?.nome || "Nuvola";
  const child = config.nomeBambino || "Piccolo lettore";
  const theme = config.temaEducativo.toLowerCase();
  
  const pagine: string[] = [];
  
  if (pageCount === 3) {
    pagine.push(`C'era una volta nel meraviglioso regno di ${config.categoria}, un piccolo amico di nome **${mainCharacter}** 🧚 che amava esplorare boschi fioriti. Un giorno incontrò il dolce **${child}** ✨ che passeggiava felice.`);
    pagine.push(`Insieme scoprirono che potevano imparare il valore di **${theme}** 🌲 superando piccoli ostacoli e aiutandosi l'un l'altro. Il cammino si illuminò improvvisamente di mille colori fatati ⭐.`);
    pagine.push(`Volando felici tra le nuvole soffici, **${mainCharacter}** e il piccolo **${child}** 🥳 celebrarono la loro splendida amicizia, promettendosi di diffondere sempre amore e gentilezza nel mondo 🎉.`);
  } else {
    pagine.push(`C'era una volta nel meraviglioso regno di ${config.categoria}, un piccolo amico di nome **${mainCharacter}** 🧚 che amava esplorare boschi fioriti. Un giorno incontrò il dolce **${child}** ✨.`);
    pagine.push(`Insieme decisero di compiere un viaggio fantastico. Sul cammino trovarono una mappa magica che parlava del grande segreto di **${theme}** 🌲.`);
    pagine.push(`- Dobbiamo tenerci per mano! - esclamò **${mainCharacter}** saltando di gioia 🐸. Solo così la strada diventerà splendente.`);
    pagine.push(`E così fu! Ogni passo divenne una melodia dorata, e perfino le stelle in cielo 🌌 iniziarono a brillare più forte per incoraggiare i due piccoli avventurieri.`);
    pagine.push(`Alla fine del cammino, scoprirono che il tesoro più grande era proprio la gioia di **${theme}** 🥳 condivisa con chi si ama.`);
    if (pageCount > 5) {
      pagine.push(`Tutti gli abitanti del regno fecero una festa grandiosa 🎉, ballando felici sotto la luce della Luna d'argento.`);
      pagine.push(`E prima di addormentarsi, **${child}** sussurrò felice: - È stata l'avventura più magica di sempre! 👋`);
    }
  }

  // trim down or pad to exact pageCount
  const finalPagine = pagine.slice(0, pageCount);
  while (finalPagine.length < pageCount) {
    finalPagine.push(`Il piccolo **${child}** e il dolce **${mainCharacter}** ✨ continuarono a vivere felici, diffondendo il valore di **${theme}** nel regno magico 🌟.`);
  }

  return {
    titolo: `La magia di ${child} e ${mainCharacter} ✨`,
    pagine: finalPagine,
    morale: `La morale è che la forza di ${theme} rende ogni avventura più bella quando la condividiamo con il cuore.`,
    coverTheme: COVER_THEMES[config.categoria] || "star",
    coverColor: COLORS[Math.floor(Math.random() * COLORS.length)],
    copertinaDescrizione: `${child} e ${mainCharacter} in un mondo color pastello pieno di stelle e magia.`,
    personaggiGenerati: config.personaggi.map((p) => p.nome),
    isOffline: true,
    generationSource: "fallback",
    fallbackReason: reason
  };
}

export async function generateStoryClient(
  config: StoryGenerationConfig,
  options: GenerationOptions = {}
): Promise<StoryGenerationResult> {
  options.onProgress?.(12, "Preparazione dell'incantesimo (elaborazione lato client)...");
  ensureNotCancelled(options.isCancelled);

  const apiStatus = getGeminiApiKeyStatus();
  if (apiStatus === "missing") {
    options.onProgress?.(75, "Chiave API non trovata. Uso il piano di riserva...");
    return generateFallbackStory(config, "Chiave API Gemini mancante nel file .env");
  } else if (apiStatus === "placeholder") {
    options.onProgress?.(75, "Chiave API non valida (placeholder). Uso il piano di riserva...");
    return generateFallbackStory(config, "Chiave API Gemini non valida (placeholder)");
  }

  try {
    // Verifica quali modelli sono effettivamente disponibili
    const availableModels = await getAvailableModels(GEMINI_API_KEY);
    
    if (availableModels.length === 0) {
      console.warn("[Gemini] Nessun modello disponibile, attivo fallback");
      options.onProgress?.(75, "Nessun modello Gemini disponibile. Uso il piano di riserva...");
       const errorMsg = "Nessun modello Gemini disponibile con quota su questo account";
       saveGenerationLog({
         timestamp: new Date().toISOString(),
         source: "error",
         error: errorMsg,
         availableModels: []
       });
       throw new Error(errorMsg);
    }

      saveGenerationLog({
        timestamp: new Date().toISOString(),
        source: "gemini",
        availableModels: availableModels
      });

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    options.onProgress?.(40, `Gemini sta scrivendo la favola (modello: ${availableModels[0]})...`);
    ensureNotCancelled(options.isCancelled);

    let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
    let usedModel = "";
    let lastError: Error | null = null;

    for (const modelName of availableModels) {
      try {
        console.log(`[Gemini] Tentativo con modello: ${modelName}`);
        response = await ai.models.generateContent({
          model: modelName,
          contents: buildPrompt(config),
          config: {
            temperature: 0.9,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                titolo: { type: Type.STRING },
                pagine: { type: Type.ARRAY, items: { type: Type.STRING } },
                morale: { type: Type.STRING },
                coverTheme: { type: Type.STRING },
                coverColor: { type: Type.STRING },
                copertinaDescrizione: { type: Type.STRING },
                personaggiGenerati: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["titolo", "pagine", "morale", "coverTheme", "coverColor", "copertinaDescrizione", "personaggiGenerati"]
            }
          }
        });
        usedModel = modelName;
        console.log(`[Gemini] Generazione completata con: ${usedModel}`);
        break;
      } catch (modelError) {
        lastError = modelError as Error;
        const isDeprecated = isDeprecatedModelError(modelError);
        const isQuotaError = (modelError as any)?.message?.toLowerCase().includes("quota") ||
                            (modelError as any)?.status === 429;

        if (isDeprecated) {
          console.warn(`[Gemini] Modello deprecato/non disponibile: ${modelName}`);
          continue;
        }

        if (isQuotaError && availableModels.length > 1) {
          console.warn(`[Gemini] Quota esaurita per ${modelName}, provo il prossimo...`);
          continue;
        }

        throw modelError;
      }
    }

    // Se nessun modello ha funzionato ma abbiamo tentato più modelli, riporta l'ultimo errore
    if (!response && lastError) {
      throw lastError;
    }

    ensureNotCancelled(options.isCancelled);
    options.onProgress?.(85, "Rifinitura delle pagine e della morale...");

    if (!response?.text) {
      throw new Error("Risposta Gemini vuota");
    }

    return {
      ...normalizeGeminiResponse(response.text, config),
      generationSource: "gemini",
      usedModel
    };

  } catch (error) {
    if ((error as Error).message === "GENERATION_CANCELLED") {
      throw error;
    }

    const fallbackReason = describeGeminiFailure(error);
    saveGenerationLog({
      timestamp: new Date().toISOString(),
      source: "fallback",
      reason: fallbackReason,
      error: (error as Error)?.message
    });

    options.onProgress?.(78, `${fallbackReason}. Preparo una favola segreta...`);
    return generateFallbackStory(config, fallbackReason);
  }
}

