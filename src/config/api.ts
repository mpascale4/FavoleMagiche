/**
 * Client-side AI configuration.
 * The key is bundled in the app through Vite env vars.
 */
export const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
export type GenerationMode = "client" | "backend";

function normalizeGenerationMode(mode?: string): GenerationMode {
  return (mode || "").trim().toLowerCase() === "backend" ? "backend" : "client";
}

export function normalizeBackendBaseUrl(url?: string): string {
  return (url || "").trim().replace(/\/+$/, "");
}

export const DEFAULT_GENERATION_MODE = normalizeGenerationMode(import.meta.env.VITE_GENERATION_MODE);
export const DEFAULT_BACKEND_BASE_URL = normalizeBackendBaseUrl(import.meta.env.VITE_BACKEND_BASE_URL);

const PLACEHOLDER_HINTS = ["my_gemini_api_key", "inserisci-qui", "example", "placeholder"];

export type GeminiApiKeyStatus = "missing" | "placeholder" | "loaded";

export function getEffectiveGenerationMode(mode?: string): GenerationMode {
  return normalizeGenerationMode(mode);
}

export function getGeminiApiKeyStatus(): GeminiApiKeyStatus {
  if (!GEMINI_API_KEY) {
    return "missing";
  }

  const normalized = GEMINI_API_KEY.toLowerCase();
  if (PLACEHOLDER_HINTS.some((hint) => normalized.includes(hint))) {
    return "placeholder";
  }

  return "loaded";
}

