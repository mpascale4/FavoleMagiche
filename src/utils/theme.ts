/**
 * Funzioni per la gestione del tema notturno automatico
 * basato sull'ora del giorno
 */

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
 */
export function shouldApplyNightTheme(): boolean {
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

