/**
 * Client-side AI configuration.
 * The key is bundled in the app through Vite env vars.
 */
export const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();

