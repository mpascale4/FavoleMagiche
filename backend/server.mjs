import http from "node:http";
import { GoogleGenAI, Type } from "@google/genai";

const PORT = Number(process.env.PORT || 8787);
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();
const ALLOW_ORIGIN = (process.env.CORS_ALLOW_ORIGIN || "*").trim() || "*";
const MODEL_CANDIDATES = ["gemini-flash-latest", "gemini-2.0-flash", "gemini-2.5-flash"];
const COLORS = ["pastel-pink", "pastel-blue", "pastel-purple", "pastel-green", "pastel-yellow"];
const COVER_THEMES = {
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

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
}

function sendJson(res, statusCode, payload) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function expectedPages(durata) {
  if (durata === "Breve") return 3;
  if (durata === "Lunga") return 7;
  return 5;
}

function buildPrompt(config) {
  const pageCount = expectedPages(config.durata);
  const characters = Array.isArray(config.personaggi) && config.personaggi.length > 0
    ? config.personaggi
        .map((p) => `- ${p.nome} (${p.tipo}${p.caratteristica ? `, ${p.caratteristica}` : ""})`)
        .join("\n")
    : "- Personaggi fantastici adatti al tema";

  const continuationContext = config.parentStoryTitle && Array.isArray(config.parentStoryPagine) && config.parentStoryPagine.length > 0
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
   - Se un personaggio è un "Bebè", il suo linguaggio DEVE essere da bebè.
   - Se un personaggio è un "Robot", DEVE avere un linguaggio meccanico con rumori tecnologici.
   - Se il personaggio è un animale, NON DEVE PARLARE in lingua umana ma solo tramite versi naturali e azioni.
7) FORMATTAZIONE SPECIALE PER L'INTERATTIVITÀ:
   - Evidenzia i nomi dei personaggi e del bambino tra doppi asterischi, ad esempio: **${config.nomeBambino}**.
   - Evidenzia anche 2-4 parole chiave importanti per pagina.
   - Inserisci 1 o 2 emoji evocative per pagina (es. 🧚, ✨, 🐉, 🌲, ⭐).
`;
}

function normalizeGeminiResponse(raw, config) {
  const parsed = JSON.parse(String(raw || "").trim());
  const pageCount = expectedPages(config.durata);
  const pagine = Array.isArray(parsed.pagine)
    ? parsed.pagine.filter((p) => typeof p === "string" && p.trim().length > 0).slice(0, pageCount)
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
      ? parsed.personaggiGenerati.filter((p) => typeof p === "string").slice(0, 6)
      : (config.personaggi || []).map((p) => p.nome)
  };
}

function describeGeminiFailure(error) {
  const message = error?.message || "Errore Gemini sconosciuto";
  const status = error?.status ?? error?.code;

  if (status === 429 || String(message).toLowerCase().includes("quota")) {
    return "Quota Gemini esaurita o non disponibile per il tuo progetto";
  }
  if (status === 404 || String(message).toLowerCase().includes("no longer available")) {
    return "Modello Gemini non disponibile per questo account";
  }
  if (status === 401 || status === 403) {
    return "Chiave API Gemini non autorizzata o senza permessi";
  }

  return "Gemini non raggiungibile in questo momento";
}

function isDeprecatedModelError(error) {
  const message = String(error?.message || "").toLowerCase();
  const status = error?.status ?? error?.code;
  return status === 404 || message.includes("no longer available");
}

function generateFallbackStory(config, reason) {
  const pageCount = expectedPages(config.durata);
  const mainCharacter = config.personaggi?.[0]?.nome || "Nuvola";
  const child = config.nomeBambino || "Piccolo lettore";
  const theme = String(config.temaEducativo || "gentilezza").toLowerCase();
  const pagine = [];

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
    personaggiGenerati: (config.personaggi || []).map((p) => p.nome),
    isOffline: true,
    generationSource: "fallback",
    fallbackReason: reason
  };
}

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Payload troppo grande"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("JSON non valido"));
      }
    });
    req.on("error", reject);
  });
}

function validateConfig(config) {
  const errors = [];
  if (!config || typeof config !== "object") {
    errors.push("Body mancante o non valido");
    return errors;
  }
  if (!String(config.categoria || "").trim()) errors.push("categoria obbligatoria");
  if (!String(config.temaEducativo || "").trim()) errors.push("temaEducativo obbligatorio");
  if (!["Breve", "Media", "Lunga"].includes(config.durata)) errors.push("durata non valida");
  if (!String(config.nomeBambino || "").trim()) errors.push("nomeBambino obbligatorio");
  if (!Number.isFinite(config.etaBambino)) errors.push("etaBambino non valida");
  if (!Array.isArray(config.personaggi)) errors.push("personaggi deve essere un array");
  return errors;
}

async function generateStoryWithGemini(config) {
  if (!GEMINI_API_KEY) {
    throw new Error("Chiave API Gemini mancante sul backend");
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  let response = null;
  let usedModel = "";
  let lastError = null;

  for (const modelName of MODEL_CANDIDATES) {
    try {
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
      break;
    } catch (error) {
      lastError = error;
      const isDeprecated = isDeprecatedModelError(error);
      const isQuotaError = String(error?.message || "").toLowerCase().includes("quota") || error?.status === 429;
      if (isDeprecated || (isQuotaError && MODEL_CANDIDATES.length > 1)) {
        continue;
      }
      throw error;
    }
  }

  if (!response && lastError) {
    throw lastError;
  }
  const responseText = response?.text;
  if (!responseText) {
    throw new Error("Risposta Gemini vuota");
  }

  return {
    ...normalizeGeminiResponse(responseText, config),
    generationSource: "gemini",
    usedModel
  };
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (!req.url) {
    sendJson(res, 404, { error: "Percorso non valido" });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    sendJson(res, 200, {
      ok: true,
      generationMode: "backend",
      geminiConfigured: !!GEMINI_API_KEY,
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/stories/generate") {
    try {
      const config = await parseBody(req);
      const errors = validateConfig(config);
      if (errors.length > 0) {
        sendJson(res, 400, { error: errors.join("; ") });
        return;
      }

      try {
        const result = await generateStoryWithGemini(config);
        sendJson(res, 200, result);
      } catch (error) {
        const fallbackReason = !GEMINI_API_KEY
          ? "Chiave API Gemini mancante sul backend"
          : describeGeminiFailure(error);
        sendJson(res, 200, generateFallbackStory(config, fallbackReason));
      }
    } catch (error) {
      sendJson(res, 400, { error: error?.message || "Richiesta non valida" });
    }
    return;
  }

  sendJson(res, 404, { error: "Endpoint non trovato" });
});

server.listen(PORT, () => {
  console.log(`[favole-backend] Server attivo su http://localhost:${PORT}`);
  console.log(`[favole-backend] Health check: http://localhost:${PORT}/health`);
  console.log(`[favole-backend] Gemini configurato: ${GEMINI_API_KEY ? "si" : "no"}`);
});


