import { GoogleGenAI, Type } from "@google/genai";
import { Character } from "../types";
import { GEMINI_API_KEY } from "../config/api";

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
}

interface GenerationOptions {
  onProgress?: (progress: number, step: string) => void;
  isCancelled?: () => boolean;
}

const COLORS = ["pastel-pink", "pastel-blue", "pastel-purple", "pastel-green", "pastel-yellow"];
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

function generateFallbackStory(config: StoryGenerationConfig): StoryGenerationResult {
  const pageCount = expectedPages(config.durata);
  const mainCharacter = config.personaggi[0]?.nome || "Nuvola";
  const pagine: string[] = [];

  for (let i = 1; i <= pageCount; i++) {
    pagine.push(`Pagina ${i}: ${config.nomeBambino} e ${mainCharacter} vivono un momento magico legato a ${config.temaEducativo.toLowerCase()}, imparando ad aiutarsi con il cuore.`);
  }

  return {
    titolo: `Il sorriso di ${config.nomeBambino} nel regno ${config.categoria} ✨`,
    pagine,
    morale: `La morale e che ${config.temaEducativo.toLowerCase()} rende ogni avventura piu bella quando la condividiamo.`,
    coverTheme: COVER_THEMES[config.categoria] || "star",
    coverColor: COLORS[Math.floor(Math.random() * COLORS.length)],
    copertinaDescrizione: `${config.nomeBambino} e ${mainCharacter} in un mondo color pastello pieno di stelle e magia.`,
    personaggiGenerati: config.personaggi.map((p) => p.nome),
    isOffline: true
  };
}

export async function generateStoryClient(
  config: StoryGenerationConfig,
  options: GenerationOptions = {}
): Promise<StoryGenerationResult> {
  options.onProgress?.(12, "Preparazione dell'incantesimo (elaborazione lato client)...");
  ensureNotCancelled(options.isCancelled);

  if (!GEMINI_API_KEY) {
    options.onProgress?.(75, "Chiave API non trovata. Uso il piano di riserva...");
    return generateFallbackStory(config);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    options.onProgress?.(40, "Gemini sta scrivendo la favola lato client...");
    ensureNotCancelled(options.isCancelled);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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

    ensureNotCancelled(options.isCancelled);
    options.onProgress?.(85, "Rifinitura delle pagine e della morale...");

    if (!response.text) {
      throw new Error("Risposta Gemini vuota");
    }

    return normalizeGeminiResponse(response.text, config);
  } catch (error) {
    if ((error as Error).message === "GENERATION_CANCELLED") {
      throw error;
    }

    options.onProgress?.(78, "Connessione instabile. Creo una favola offline...");
    return generateFallbackStory(config);
  }
}

