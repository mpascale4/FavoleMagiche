/**
 * Funzioni per la gestione del tema notturno automatico
 * basato sull'ora del giorno
 */

// Variabile globale per forzare la modalità notte (usata da Developer Mode)
let forcedNightMode: boolean | null = null;

// Carica lo stato dal localStorage al startup
const loadForcedNightMode = () => {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("dev_forced_night_mode");
      if (saved !== null) {
        forcedNightMode = saved === "true" ? true : saved === "false" ? false : null;
      }
    } catch (e) {
      // Ignore storage errors
    }
  }
};

// Carica al primo accesso
loadForcedNightMode();

export function setForcedNightTheme(forced: boolean | null): void {
  forcedNightMode = forced;
  // Persisti in localStorage
  if (typeof window !== "undefined") {
    try {
      if (forced === null) {
        localStorage.removeItem("dev_forced_night_mode");
      } else {
        localStorage.setItem("dev_forced_night_mode", forced ? "true" : "false");
      }
    } catch (e) {
      // Ignore storage errors
    }
  }
}

export function getForcedNightTheme(): boolean | null {
  return forcedNightMode;
}

export function getCurrentTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) {
    return "morning";
  } else if (hour >= 12 && hour < 18) {
    return "afternoon";
  } else if (hour >= 18 && hour < 22) {
    return "evening";
  } else {
    return "night";
  }
}

/**
 * Determina se è ora di applicare il tema notturno
 * (dopo le 18:00 fino alle 06:00)
 *
 * Se è stato forzato un tema notturno dal Developer Mode, usa quello
 */
export function shouldApplyNightTheme(): boolean {
  // Check if night mode is forced for testing
  if (forcedNightMode !== null) {
    return forcedNightMode;
  }

  const hour = new Date().getHours();
  return hour >= 18 || hour < 6;
}

/**
 * Ritorna le classi Tailwind per il tema notturno
 */
export function getNightThemeClasses(): {
  bgGradient: string;
  textColor: string;
  cardBg: string;
  cardBorder: string;
} {
  return {
    bgGradient: "from-slate-900 to-slate-800",
    textColor: "text-slate-100",
    cardBg: "bg-slate-800",
    cardBorder: "border-slate-700"
  };
}

/**
 * Ritorna le classi Tailwind per il tema diurno
 */
export function getDayThemeClasses(): {
  bgGradient: string;
  textColor: string;
  cardBg: string;
  cardBorder: string;
} {
  return {
    bgGradient: "from-white to-slate-50",
    textColor: "text-slate-900",
    cardBg: "bg-white",
    cardBorder: "border-slate-200"
  };
}

