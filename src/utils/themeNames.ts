/**
 * Catchy and appealing names for the magic visual themes and educational values.
 */

export const getVisualThemeDisplayName = (themeName?: string): string => {
  if (!themeName) return "🌸 Giardino delle Fate";
  const name = themeName.trim();
  switch (name) {
    case "Rosa Pastello":
    case "🌸 Giardino delle Fate":
      return "🌸 Giardino delle Fate";
    case "Verde Bosco":
    case "🌲 Bosco delle Meraviglie":
      return "🌲 Bosco delle Meraviglie";
    case "Azzurro Cielo":
    case "🌊 Oceano Incantato":
      return "🌊 Oceano Incantato";
    case "Giallo Sole":
    case "✨ Isola del Sole Dorato":
      return "✨ Isola del Sole Dorato";
    case "Lavanda":
    case "🦄 Prateria degli Unicorni":
      return "🦄 Prateria degli Unicorni";
    default:
      return name;
  }
};

export const getEducationalThemeDisplayName = (theme?: string): string => {
  if (!theme) return "Magia Generica";
  const t = theme.trim();
  switch (t) {
    case "Amicizia":
      return "Amicizia dei Sogni";
    case "Coraggio":
      return "Cuore di Leone (Coraggio)";
    case "Gentilezza":
      return "Abbraccio Gentile";
    case "Rispetto":
      return "Segreto del Rispetto";
    case "Collaborazione":
      return "Forza del Gruppo (Unione)";
    case "Onestà":
      return "Sentiero dell'Onestà";
    case "Generosità":
      return "Magia del Donare";
    case "Pazienza":
      return "Tempio della Pazienza";
    case "Gratitudine":
      return "Dono del Grazie";
    case "Perdono":
      return "Ali del Perdono";
    default:
      return t;
  }
};
