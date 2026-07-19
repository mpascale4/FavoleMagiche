export interface ChildProfile {
  id: string;
  nome: string;
  annoNascita: number;
  temaVisivo?: string; // e.g. "Rosa Pastello" | "Verde Bosco" | "Azzurro Cielo" | "Giallo Sole" | "Lavanda"
}

export interface DeletedProfile {
  profile: ChildProfile;
  deletedAt: string; // ISO String format
}

export interface DeletedStory {
  story: Story;
  deletedAt: string; // ISO String format
}

export interface Character {
  nome: string;
  tipo: string;
  caratteristica?: string;
}

export interface Story {
  id: string;
  titolo: string;
  pagine: string[];
  morale: string;
  data: string; // Keep for backwards compatibility
  dataCreazione?: string; // YYYY-MM-DD
  ultimaLettura?: string; // YYYY-MM-DD
  durata: "Breve" | "Media" | "Lunga";
  categoria: string;
  temaEducativo: string;
  preferita: boolean;
  coverTheme: string;
  coverColor: string;
  copertinaDescrizione: string;
  profiloId?: string; // Which child was this story generated for
  isOffline?: boolean;
  volteLetta?: number;
  isBedtimeMode?: boolean;
  seriesId?: string;
  chapter?: number;
  personaggi?: Character[];
}

export interface AppSettings {
  sogliaSpazio: "500 MB" | "1 GB" | "2 GB" | "Illimitato";
  avvisaSuperamento: boolean;
  eliminaInAutomatico: boolean;
  conservaPreferite: boolean;
  tipoVoce?: "maschile" | "femminile" | "narratore" | "robotica";
  nomeVoceDispositivo?: string;
  velocitaVoce?: number;
  tonoVoce?: number;
  musicaSottofondo?: boolean;
  effettiAudio?: boolean;
  audioAdattivo?: boolean;
  pauseMusicaliChiave?: boolean;
  stileVisuale?: "auto" | "giorno" | "alba" | "tramonto" | "notte" | "bosco" | "oceano" | "horror";
  pinAccesso?: string;
  modalitaBambino?: boolean;
  timerNannaMinutes?: number; // 0 for disabled, 5, 10, 15, 30, 45, 60
}

export type ScreenType = "home" | "profiles" | "new-story" | "generating" | "reader" | "archive" | "settings" | "premium" | "albero";

export const CATEGORIES = [
  "Fantasy",
  "Avventura",
  "Mistero",
  "Fiaba Classica",
  "Natura",
  "Spazio",
  "Preistoria",
  "Supereroi",
  "Mitologia",
  "Abissi",
  // Unlockable (5)
  "Città Magica",
  "Sottosopra",
  "Il Domani",
  "Fiabe del Mare",
  "Terra Incognita"
];

export const INITIAL_CATEGORIES = [
  "Fantasy",
  "Avventura",
  "Mistero",
  "Fiaba Classica",
  "Natura",
  "Spazio",
  "Preistoria",
  "Supereroi",
  "Mitologia",
  "Abissi"
];

export const EDUCATIONAL_THEMES = [
  "Amicizia",
  "Coraggio",
  "Gentilezza",
  "Rispetto",
  "Collaborazione",
  "Onestà",
  "Generosità",
  "Pazienza",
  "Gratitudine",
  "Perdono",
  // Unlockable (5)
  "Empatia",
  "Creatività",
  "Autonomia",
  "Solidarietà",
  "Responsabilità"
];

export const INITIAL_THEMES = [
  "Amicizia",
  "Coraggio",
  "Gentilezza",
  "Rispetto",
  "Collaborazione",
  "Onestà",
  "Generosità",
  "Pazienza",
  "Gratitudine",
  "Perdono"
];

export const DURATIONS = [
  { label: "Breve (3 Pagine)", value: "Breve" },
  { label: "Media (5 Pagine)", value: "Media" },
  { label: "Lunga (7 Pagine)", value: "Lunga" }
];

export const CHARACTER_TYPES = [
  "Bambino",
  "Bebè",
  "Bambina",
  "Cucciolo",
  "Robot",
  "Fata",
  "Astronauta",
  "Drago",
  "Unicorno",
  "Folletto",
  // Unlockable (5)
  "Sirena",
  "Strega Buona",
  "Principe",
  "Principessa",
  "Folletto Marino"
];

export const INITIAL_CHARACTER_TYPES = [
  "Bambino",
  "Bebè",
  "Bambina",
  "Cucciolo",
  "Robot",
  "Fata",
  "Astronauta",
  "Drago",
  "Unicorno",
  "Folletto"
];

export const BEBE_TRAITS = [
  "Piagnucolone",
  "Giocherellone",
  "Coccolone",
  "Goloso",
  "Dormiglione"
];

export const CHARACTER_TRAITS = [
  "Curioso",
  "Coraggioso",
  "Pasticcione",
  "Fifone",
  "Antipatico",
  "Dormiglione",
  "Saggio",
  "Allegro",
  "Testardo",
  "Timido",
  // Unlockable (5)
  "Piagnucolone",
  "Giocherellone",
  "Coccolone",
  "Goloso",
  "Furbo"
];

/**
 * Mappa dai trait maschili ai femminili
 * Utile per personalizzare i caratteri in base al tipo personaggio
 */
export const FEMININE_CHARACTER_TRAITS: Record<string, string> = {
  "Curioso": "Curiosa",
  "Coraggioso": "Coraggiosa",
  "Pasticcione": "Pasticciona",
  "Fifone": "Fifona",
  "Antipatico": "Antipatica",
  "Dormiglione": "Dormigliona",
  "Saggio": "Saggia",
  "Allegro": "Allegra",
  "Testardo": "Testarda",
  "Timido": "Timida",
  "Piagnucolone": "Piagnucolona",
  "Giocherellone": "Giocherellona",
  "Coccolone": "Coccolona",
  "Goloso": "Golosa"
};

const FEMININE_CHARACTER_TYPES = new Set(["Bambina", "Fata", "Sirena"]);

/**
 * Ritorna il trait adatto al tipo personaggio selezionato.
 */
export function getTraitForCharacterType(trait: string, characterType?: string): string {
  if (characterType && FEMININE_CHARACTER_TYPES.has(characterType) && FEMININE_CHARACTER_TRAITS[trait]) {
    return FEMININE_CHARACTER_TRAITS[trait];
  }
  return trait;
}

export const INITIAL_CHARACTER_TRAITS = [
  "Curioso",
  "Coraggioso",
  "Pasticcione",
  "Fifone",
  "Antipatico",
  "Dormiglione",
  "Saggio",
  "Allegro",
  "Testardo",
  "Timido"
];

export const CHARACTER_TYPES_BY_CATEGORY: Record<string, string[]> = {
  "Fantasy": ["Bambino",
  "Bebè", "Bambina", "Fata", "Unicorno", "Drago", "Folletto"],
  "Avventura": ["Bambino",
  "Bebè", "Bambina", "Cucciolo", "Astronauta", "Folletto"],
  "Mistero": ["Bambino",
  "Bebè", "Bambina", "Robot", "Folletto"],
  "Fiaba Classica": ["Bambino",
  "Bebè", "Bambina", "Fata", "Cucciolo", "Drago", "Sirena"],
  "Natura": ["Bambino",
  "Bebè", "Bambina", "Cucciolo", "Sirena"],
  "Spazio": ["Bambino",
  "Bebè", "Bambina", "Robot", "Astronauta"],
  "Preistoria": ["Bambino",
  "Bebè", "Bambina", "Cucciolo", "Drago"],
  "Supereroi": ["Bambino",
  "Bebè", "Bambina", "Robot"],
  "Mitologia": ["Bambino",
  "Bebè", "Bambina", "Fata", "Drago", "Sirena"],
  "Abissi": ["Bambino",
  "Bebè", "Bambina", "Cucciolo", "Sirena"]
};
