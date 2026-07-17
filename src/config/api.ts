/**
 * Client-side AI configuration.
 * The key is bundled in the app through Vite env vars.
 */
export const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();

const PLACEHOLDER_HINTS = ["my_gemini_api_key", "inserisci-qui", "example", "placeholder"];

export type GeminiApiKeyStatus = "missing" | "placeholder" | "loaded";

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

