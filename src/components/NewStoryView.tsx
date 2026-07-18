import React, { useState, useEffect, useMemo, useRef } from "react";
import { ArrowLeft, Sparkles, AlertCircle, Plus, Trash2, CheckCircle2, Search, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { playPlinkSound, playRobotBeepSound, playClickSound, playGenerateClickSound, playNewStoryClickSound } from "../utils/audio";
import { getEducationalThemeDisplayName } from "../utils/themeNames";
import {
  CATEGORIES,
  EDUCATIONAL_THEMES,
  DURATIONS,
  ChildProfile,
  Character,
  CHARACTER_TYPES,
  CHARACTER_TRAITS,
  Story,
  INITIAL_CATEGORIES,
  INITIAL_THEMES,
  INITIAL_CHARACTER_TYPES,
  INITIAL_CHARACTER_TRAITS,
  FEMININE_CHARACTER_TRAITS,
  getTraitForCharacterType
} from "../types";

const TYPE_EMOJIS: Record<string, string> = {
  "Bambino": "👦",
  "Bambina": "👧",
  "Cucciolo": "🐶",
  "Robot": "🤖",
  "Fata": "🧚",
  "Astronauta": "🚀",
  "Drago": "🐲",
  "Unicorno": "🦄",
  "Folletto": "🧝",
  "Sirena": "🧜‍♀️"
};

const TRAIT_EMOJIS: Record<string, string> = {
  "Curioso": "🧐",
  "Coraggioso": "🦁",
  "Pasticcione": "🤪",
  "Fifone": "😰",
  "Antipatico": "😤",
  "Dormiglione": "😴",
  "Saggio": "🦉",
  "Allegro": "☀️",
  "Testardo": "🐂",
  "Timido": "🫣"
};

const CATEGORY_EMOJIS: Record<string, string> = {
  "Fantasy": "🦄",
  "Avventura": "🧗",
  "Mistero": "🕵️",
  "Fiaba Classica": "🏰",
  "Natura": "🌳",
  "Spazio": "🌌",
  "Preistoria": "🦖",
  "Supereroi": "🦸",
  "Mitologia": "🏛️",
  "Abissi": "🐙"
};

const THEME_EMOJIS: Record<string, string> = {
  "Amicizia": "🤝",
  "Coraggio": "🦁",
  "Gentilezza": "🌸",
  "Rispetto": "🙏",
  "Collaborazione": "🐝",
  "Onestà": "💎",
  "Generosità": "🎁",
  "Pazienza": "🐢",
  "Gratitudine": "💖",
  "Perdono": "🕊️"
};

const SUGGESTED_NAMES_BY_TYPE: Record<string, string[]> = {
  "Bambino": ["Leo", "Davide", "Matteo", "Luca", "Edoardo", "Gabriele", "Filippo", "Lorenzo", "Samuele", "Tommaso"],
  "Bambina": ["Celeste", "Sofia", "Giulia", "Emma", "Chiara", "Aurora", "Alice", "Martina", "Greta", "Beatrice"],
  "Cucciolo": ["Briciola", "Lulù", "Lillo", "Paco", "Spillo", "Zampetta", "Nuvola", "Lola", "Toby", "Rocky"],
  "Robot": ["Zorby", "Otto", "Pixel", "Kip", "Bip-Bip", "Ringo", "Robi", "Zeta", "Cody", "Gizmo"],
  "Fata": ["Clara", "Fay", "Flora", "Sinfonia", "Goccia", "Alba", "Sveva", "Irina", "Gemma"],
  "Astronauta": ["Neil", "Buzz", "Stella", "Yuri", "Vega", "Orione", "Sirio", "Luna"],
  "Drago": ["Draghetto", "Vampiro", "Fiammetta", "Sdentato", "Ignis", "Ryu", "Brak", "Kora"],
  "Unicorno": ["Nuvola", "Arcobaleno", "Milly", "Perla", "Aura", "Pegaso", "Star", "Glitter"],
  "Folletto": ["Robin", "Puck", "Briciola", "Spillo", "Pepito", "Kiko", "Gnomo", "Zefiro"],
  "Sirena": ["Ariel", "Ondina", "Coralia", "Marina", "Perla", "Saphira", "Naia", "Melody"]
};

const FANTASY_NAMES_BY_TRAIT: Record<string, string[]> = {
  "Curioso": ["Nasino", "UgoFiuto", "Investigatore", "Guizzo", "CercaCerca", "Spione", "Lente"],
  "Coraggioso": ["Leone", "Fierino", "Audace", "Forticcio", "Ercole", "Tuono", "Lampo", "Fulmine"],
  "Pasticcione": ["Patatrac", "Gaffy", "Frittata", "Smemorino", "BumBum", "Pasticcio", "Scivolo"],
  "Fifone": ["Tremolino", "Fugace", "Batticuore", "ZampaMolla", "Fifa", "Ombretta", "Sospiro"],
  "Antipatico": ["Smorfia", "Musone", "Brontolino", "Scontroso", "Acido", "Rude", "Fumantino"],
  "Dormiglione": ["Sonnino", "Pigrone", "RussaBene", "Letto", "Sogno", "Copertina"],
  "Saggio": ["Saputello", "Saggio", "Astuto", "Cervellone", "Libro", "Gufo"],
  "Allegro": ["Sorrisino", "Felice", "Salterino", "Festa", "Raggio", "Sole"],
  "Testardo": ["Mulo", "Capoccione", "Duro", "Roccia", "Ferro", "Chiodo"],
  "Timido": ["Rossetto", "Timido", "Nascondino", "Sussurro", "Ombra", "Calmo"]
};

const FANTASY_PREFIXES_BY_TYPE: Record<string, string[]> = {
  "Bambino": ["Leo", "Matteo", "Luchino", "Davi", "Gabry", "Edo", "Fil", "Tommy"],
  "Bambina": ["Celestina", "Sofietta", "Giulietta", "Emina", "Chiarina", "Aurorina", "Alicina"],
  "Cucciolo": ["Zampetta", "Briciolino", "Lillo", "Paco", "Spilletto", "Nuvola", "Rocky"],
  "Robot": ["Robi", "Pixel", "Bip", "Kip", "Zorby", "Otto", "Gizmo"],
  "Fata": ["Fay", "Flora", "Goccia", "Alba", "Gemma", "Iris", "Clara"],
  "Astronauta": ["Astro", "Cosmo", "Missile", "Vega"],
  "Drago": ["Drago", "Fiammetta", "Spillo", "Ignis"],
  "Unicorno": ["Glitter", "Milly", "Perla", "Luna"],
  "Folletto": ["Puck", "Kiko", "Spilletto", "Briciola"],
  "Sirena": ["Ondina", "Ariel", "Coral", "Marina"]
};

const FEMININE_TO_BASE_TRAIT: Record<string, string> = Object.fromEntries(
  Object.entries(FEMININE_CHARACTER_TRAITS).map(([base, feminine]) => [feminine, base])
);

const toBaseTrait = (trait: string): string => FEMININE_TO_BASE_TRAIT[trait] || trait;

const generateFantasyNames = (type: string, trait: string): string[] => {
  const prefixes = FANTASY_PREFIXES_BY_TYPE[type] || ["Mago", "Fanta"];
  const traitWords = FANTASY_NAMES_BY_TRAIT[trait] || ["Magico"];
  
  const blends: string[] = [];
  
  // Create beautiful blended names
  if (prefixes[0] && traitWords[0]) {
    blends.push(prefixes[0] + traitWords[0].toLowerCase());
  }
  if (prefixes[1] && traitWords[1]) {
    blends.push(prefixes[1] + traitWords[1].toLowerCase());
  }
  if (prefixes[2] && traitWords[2]) {
    blends.push(prefixes[2] + traitWords[2].toLowerCase());
  }
  if (traitWords[0]) {
    blends.push(traitWords[0] + (type === "Bambino" || type === "Bambina" ? "ino" : type.slice(0, 4).toLowerCase()));
  }

  return [...blends, ...traitWords.slice(0, 4)];
};

interface NewStoryViewProps {
  activeProfile: ChildProfile | null;
  profiles: ChildProfile[];
  stories?: Story[];
  isPremium: boolean;
  generatedToday: number;
  unlockedCategories: string[];
  unlockedThemes: string[];
  unlockedCharacterTypes: string[];
  unlockedCharacterTraits: string[];
  isBedtimeMode?: boolean;
  onToggleBedtimeMode?: (active: boolean) => void;
  onGenerate: (config: {
    categoria: string;
    temaEducativo: string;
    durata: "Breve" | "Media" | "Lunga";
    personaggi: Character[];
    nomeBambino: string;
    etaBambino: number;
    excludeBambino?: boolean;
  }) => void;
  onBack: () => void;
  onNavigate: (screen: any) => void;
  onSelectProfile?: (profile: ChildProfile | null) => void;
  usedUnlockedItems?: string[];
  onMarkItemAsUsed?: (item: string) => void;
}

export default function NewStoryView({
  activeProfile,
  profiles,
  stories = [],
  isPremium,
  generatedToday,
  unlockedCategories = [],
  unlockedThemes = [],
  unlockedCharacterTypes = [],
  unlockedCharacterTraits = [],
  isBedtimeMode = false,
  onToggleBedtimeMode,
  onGenerate,
  onBack,
  onNavigate,
  onSelectProfile,
  usedUnlockedItems = [],
  onMarkItemAsUsed
}: NewStoryViewProps) {
  // Search state variables
  const [searchCategory, setSearchCategory] = useState("");
  const [searchTheme, setSearchTheme] = useState("");
  const [searchCharType, setSearchCharType] = useState("");
  const [searchCharTrait, setSearchCharTrait] = useState("");

  // Secret option toggles
  const [showSecretCategories, setShowSecretCategories] = useState(false);
  const [showSecretThemes, setShowSecretThemes] = useState(false);
  const [showSecretCharTypes, setShowSecretCharTypes] = useState(false);
  const [showSecretCharTraits, setShowSecretCharTraits] = useState(false);

  // Pagination states
  const [pageCategory, setPageCategory] = useState(1);
  const [pageTheme, setPageTheme] = useState(1);
  const [pageCharType, setPageCharType] = useState(1);
  const [pageCharTrait, setPageCharTrait] = useState(1);

  // Locked item banner messages
  const [lockedBannerMsg, setLockedBannerMsg] = useState<{ section: string; text: string } | null>(null);

  // Dynamic usage stats helper
  const usageStats = useMemo(() => {
    const stats: Record<string, number> = {};
    
    // Count from history
    stories.forEach(s => {
      stats[s.categoria] = (stats[s.categoria] || 0) + 1;
      stats[s.temaEducativo] = (stats[s.temaEducativo] || 0) + 1;
    });
    
    // Add manual stats
    try {
      const savedStats = JSON.parse(localStorage.getItem("favole_magiche_usage_stats") || "{}");
      Object.keys(savedStats).forEach(key => {
        stats[key] = (stats[key] || 0) + (savedStats[key] || 0);
      });
    } catch (e) {}
    
    return stats;
  }, [stories]);

  const getUsage = (item: string) => usageStats[item] || 0;

  // PAGE SIZES
  const PAGE_SIZE_CATEGORIES = 10;
  const PAGE_SIZE_THEMES = 10;
  const PAGE_SIZE_CHAR_TYPES = 10;
  const PAGE_SIZE_CHAR_TRAITS = 10;

  // Sorting & Filtering for CATEGORIES
  const sortedUnlockedCategories = useMemo(() => {
    return [...unlockedCategories].sort((a, b) => getUsage(b) - getUsage(a));
  }, [unlockedCategories, usageStats]);

  const filteredUnlockedCategories = useMemo(() => {
    return sortedUnlockedCategories.filter(c => 
      c.toLowerCase().includes(searchCategory.toLowerCase())
    );
  }, [sortedUnlockedCategories, searchCategory]);

  const paginatedCategories = useMemo(() => {
    const start = (pageCategory - 1) * PAGE_SIZE_CATEGORIES;
    return filteredUnlockedCategories.slice(start, start + PAGE_SIZE_CATEGORIES);
  }, [filteredUnlockedCategories, pageCategory]);

  const filteredLockedCategories = useMemo(() => {
    return CATEGORIES.filter(c => !unlockedCategories.includes(c))
      .filter(c => c.toLowerCase().includes(searchCategory.toLowerCase()));
  }, [unlockedCategories, searchCategory]);

  // Sorting & Filtering for EDUCATIONAL_THEMES
  const sortedUnlockedThemes = useMemo(() => {
    return [...unlockedThemes].sort((a, b) => getUsage(b) - getUsage(a));
  }, [unlockedThemes, usageStats]);

  const filteredUnlockedThemes = useMemo(() => {
    return sortedUnlockedThemes.filter(t => 
      t.toLowerCase().includes(searchTheme.toLowerCase())
    );
  }, [sortedUnlockedThemes, searchTheme]);

  const paginatedThemes = useMemo(() => {
    const start = (pageTheme - 1) * PAGE_SIZE_THEMES;
    return filteredUnlockedThemes.slice(start, start + PAGE_SIZE_THEMES);
  }, [filteredUnlockedThemes, pageTheme]);

  const filteredLockedThemes = useMemo(() => {
    return EDUCATIONAL_THEMES.filter(t => !unlockedThemes.includes(t))
      .filter(t => t.toLowerCase().includes(searchTheme.toLowerCase()));
  }, [unlockedThemes, searchTheme]);

  // Sorting & Filtering for CHARACTER_TYPES
  const sortedUnlockedCharacterTypes = useMemo(() => {
    return [...unlockedCharacterTypes].sort((a, b) => getUsage(b) - getUsage(a));
  }, [unlockedCharacterTypes, usageStats]);

  const filteredUnlockedCharacterTypes = useMemo(() => {
    return sortedUnlockedCharacterTypes.filter(t => 
      t.toLowerCase().includes(searchCharType.toLowerCase())
    );
  }, [sortedUnlockedCharacterTypes, searchCharType]);

  const paginatedCharacterTypes = useMemo(() => {
    const start = (pageCharType - 1) * PAGE_SIZE_CHAR_TYPES;
    return filteredUnlockedCharacterTypes.slice(start, start + PAGE_SIZE_CHAR_TYPES);
  }, [filteredUnlockedCharacterTypes, pageCharType]);

  const filteredLockedCharacterTypes = useMemo(() => {
    return CHARACTER_TYPES.filter(t => !unlockedCharacterTypes.includes(t))
      .filter(t => t.toLowerCase().includes(searchCharType.toLowerCase()));
  }, [unlockedCharacterTypes, searchCharType]);

  // Sorting & Filtering for CHARACTER_TRAITS
  const sortedUnlockedCharacterTraits = useMemo(() => {
    return [...unlockedCharacterTraits].sort((a, b) => getUsage(b) - getUsage(a));
  }, [unlockedCharacterTraits, usageStats]);

  const filteredUnlockedCharacterTraits = useMemo(() => {
    return sortedUnlockedCharacterTraits.filter(tr => 
      tr.toLowerCase().includes(searchCharTrait.toLowerCase())
    );
  }, [sortedUnlockedCharacterTraits, searchCharTrait]);

  const paginatedCharacterTraits = useMemo(() => {
    const start = (pageCharTrait - 1) * PAGE_SIZE_CHAR_TRAITS;
    return filteredUnlockedCharacterTraits.slice(start, start + PAGE_SIZE_CHAR_TRAITS);
  }, [filteredUnlockedCharacterTraits, pageCharTrait]);

  const filteredLockedCharacterTraits = useMemo(() => {
    return CHARACTER_TRAITS.filter(tr => !unlockedCharacterTraits.includes(tr))
      .filter(tr => tr.toLowerCase().includes(searchCharTrait.toLowerCase()));
  }, [unlockedCharacterTraits, searchCharTrait]);

  // Reset page numbers on search change
  useEffect(() => { setPageCategory(1); }, [searchCategory]);
  useEffect(() => { setPageTheme(1); }, [searchTheme]);
  useEffect(() => { setPageCharType(1); }, [searchCharType]);
  useEffect(() => { setPageCharTrait(1); }, [searchCharTrait]);

  // Config state
  const [categoria, setCategoria] = useState(() => {
    const draft = localStorage.getItem("favole_magiche_draft_categoria");
    if (draft && unlockedCategories.includes(draft)) return draft;
    const lastCat = localStorage.getItem("favole_magiche_last_categoria");
    if (lastCat && unlockedCategories.includes(lastCat)) {
      return lastCat;
    }
    return unlockedCategories[0] || CATEGORIES[0];
  });

  const [temaEducativo, setTemaEducativo] = useState(() => {
    const draft = localStorage.getItem("favole_magiche_draft_temaEducativo");
    if (draft && unlockedThemes.includes(draft)) return draft;
    const lastTema = localStorage.getItem("favole_magiche_last_temaEducativo");
    if (lastTema && unlockedThemes.includes(lastTema)) {
      return lastTema;
    }
    return unlockedThemes[0] || EDUCATIONAL_THEMES[0];
  });

  const [durata, setDurata] = useState<"Breve" | "Media" | "Lunga">(() => {
    const draft = localStorage.getItem("favole_magiche_draft_durata");
    if (draft === "Breve" || draft === "Media" || draft === "Lunga") return draft;
    const lastDurata = localStorage.getItem("favole_magiche_last_durata");
    if (lastDurata === "Breve" || lastDurata === "Media" || lastDurata === "Lunga") {
      return lastDurata;
    }
    return "Breve";
  });
  const [personaggiMode, setPersonaggiMode] = useState<"casuale" | "personalizzata">(() => {
    return (localStorage.getItem("favole_magiche_draft_personaggiMode") as "casuale" | "personalizzata") || "casuale";
  });
  const [customCharacters, setCustomCharacters] = useState<Character[]>(() => {
    const saved = localStorage.getItem("favole_magiche_draft_customCharacters");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const [includeBambino, setIncludeBambino] = useState(() => {
    const draft = localStorage.getItem("favole_magiche_draft_includeBambino");
    return draft !== "false";
  });

  useEffect(() => {
    localStorage.setItem("favole_magiche_draft_categoria", categoria);
    localStorage.setItem("favole_magiche_draft_temaEducativo", temaEducativo);
    localStorage.setItem("favole_magiche_draft_durata", durata);
    localStorage.setItem("favole_magiche_draft_personaggiMode", personaggiMode);
    localStorage.setItem("favole_magiche_draft_customCharacters", JSON.stringify(customCharacters));
    localStorage.setItem("favole_magiche_draft_includeBambino", String(includeBambino));
  }, [categoria, temaEducativo, durata, personaggiMode, customCharacters, includeBambino]);

  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Child Info backup state (if no active profile)
  const [backupName, setBackupName] = useState("");
  const [backupAge, setBackupAge] = useState(6);

  // Character inputs
  const [charName, setCharName] = useState("");
  const [charType, setCharType] = useState(unlockedCharacterTypes[0] || "Bambino");
  const [charTrait, setCharTrait] = useState(unlockedCharacterTraits[0] || "Curioso");

  // Suggestion states
  const [recentNames, setRecentNames] = useState<string[]>([]);
  const [suggestionSeed, setSuggestionSeed] = useState(0);

  const currentYear = new Date().getFullYear();

  // Load recent names on mount
  useEffect(() => {
    const saved = localStorage.getItem("favole_magiche_recent_names");
    if (saved) {
      try {
        setRecentNames(JSON.parse(saved));
      } catch (e) {
        setRecentNames([]);
      }
    }
  }, []);

  // Bedtime Mode preset effect
  useEffect(() => {
    if (isBedtimeMode) {
      // Find a gentle, calming category like "Natura" or "Fantasy"
      const targetCat = unlockedCategories.includes("Natura") ? "Natura" : (unlockedCategories[0] || "Fantasy");
      setCategoria(targetCat);

      // Find a gentle theme like "Gentilezza" or "Pazienza" or "Gratitudine"
      const targetTema = unlockedThemes.includes("Gentilezza") 
        ? "Gentilezza" 
        : (unlockedThemes.includes("Pazienza") 
            ? "Pazienza" 
            : (unlockedThemes.includes("Gratitudine") ? "Gratitudine" : (unlockedThemes[0] || "Gentilezza")));
      setTemaEducativo(targetTema);

      // Set duration to "Breve" (perfect for bedtime)
      setDurata("Breve");
    }
  }, [isBedtimeMode, unlockedCategories, unlockedThemes]);

  // Compute 3 suggested names based on charType, charTrait, and customCharacters added
  const suggestedNames = useMemo(() => {
    const typePool = SUGGESTED_NAMES_BY_TYPE[charType] || ["Leo", "Celeste", "Davide"];
    const fantasyPool = generateFantasyNames(charType, charTrait);
    
    // Merge standard type pool and fantasy pool (standard type pool first for high quality, then fantasy blends)
    const pool = [...typePool, ...fantasyPool];
    const addedNames = customCharacters.map(c => c.nome.toLowerCase());
    
    const availablePool = pool.filter(
      name => !addedNames.includes(name.toLowerCase())
    );
    
    const candidates = Array.from(new Set(availablePool));
    
    if (candidates.length === 0) {
      return ["Leo", "Celeste", "Davide"].filter(name => !addedNames.includes(name.toLowerCase())).slice(0, 3);
    }
    
    // Pick 3 suggestions starting from an offset based on shuffle seed
    const offset = (suggestionSeed * 3) % candidates.length;
    const result: string[] = [];
    
    for (let i = 0; i < Math.min(3, candidates.length); i++) {
      const index = (offset + i) % candidates.length;
      result.push(candidates[index]);
    }
    
    return result;
  }, [charType, charTrait, customCharacters, suggestionSeed]);

  const handleShuffleSuggestions = () => {
    setSuggestionSeed(prev => {
      const nextSeed = prev + 1;
      // Grab the suggestions corresponding to the next seed and auto-fill the input
      const typePool = SUGGESTED_NAMES_BY_TYPE[charType] || ["Leo", "Celeste", "Davide"];
      const fantasyPool = generateFantasyNames(charType, charTrait);
      const pool = [...typePool, ...fantasyPool];
      const addedNames = customCharacters.map(c => c.nome.toLowerCase());
      const availablePool = pool.filter(name => !addedNames.includes(name.toLowerCase()));
      const candidates = Array.from(new Set(availablePool));
      if (candidates.length > 0) {
        const offset = (nextSeed * 3) % candidates.length;
        setCharName(candidates[offset]);
      }
      return nextSeed;
    });
  };

  // Reset character type when unlocked types list changes
  useEffect(() => {
    if (unlockedCharacterTypes.length > 0 && !unlockedCharacterTypes.includes(charType)) {
      setCharType(unlockedCharacterTypes[0]);
    }
  }, [unlockedCharacterTypes, charType]);

  // Reset character trait when unlocked traits list changes
  useEffect(() => {
    if (unlockedCharacterTraits.length > 0 && !unlockedCharacterTraits.includes(charTrait)) {
      setCharTrait(unlockedCharacterTraits[0]);
    }
  }, [unlockedCharacterTraits, charTrait]);

  // Adjust selection if current category/theme is no longer in unlocked lists
  useEffect(() => {
    if (unlockedCategories.length > 0 && !unlockedCategories.includes(categoria)) {
      setCategoria(unlockedCategories[0]);
    }
  }, [unlockedCategories, categoria]);

  useEffect(() => {
    if (unlockedThemes.length > 0 && !unlockedThemes.includes(temaEducativo)) {
      setTemaEducativo(unlockedThemes[0]);
    }
  }, [unlockedThemes, temaEducativo]);

  // Handle adding custom character
  const handleAddCharacter = () => {
    if (!charName.trim()) return;
    if (customCharacters.length >= 3) return;

    const trimmedName = charName.trim();
    // Capitalize first letter of name for good looks
    const capitalizedName = trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1);

    const newChar: Character = {
      nome: capitalizedName,
      tipo: charType,
      caratteristica: charTrait.trim() ? getTraitForCharacterType(charTrait.trim(), charType) : undefined
    };

    setCustomCharacters([...customCharacters, newChar]);
    playRobotBeepSound();
    setCharName("");
    setCharTrait(unlockedCharacterTraits[0] || "Curioso");
    setShowCharacterForm(false);

    // Update and persist recent names
    const updatedRecent = [capitalizedName, ...recentNames.filter(n => n.toLowerCase() !== capitalizedName.toLowerCase())].slice(0, 10);
    setRecentNames(updatedRecent);
    localStorage.setItem("favole_magiche_recent_names", JSON.stringify(updatedRecent));
  };

  const handleRemoveCharacter = (index: number) => {
    setCustomCharacters(customCharacters.filter((_, i) => i !== index));
  };

  const handleRandomizeAll = () => {
    playNewStoryClickSound();
    // 1. Categoria
    const catsToUse = unlockedCategories.length > 0 ? unlockedCategories : CATEGORIES;
    const randCat = catsToUse[Math.floor(Math.random() * catsToUse.length)];
    setCategoria(randCat);

    // 2. Tema educativo
    const themesToUse = unlockedThemes.length > 0 ? unlockedThemes : EDUCATIONAL_THEMES;
    const randTheme = themesToUse[Math.floor(Math.random() * themesToUse.length)];
    setTemaEducativo(randTheme);

    // 3. Durata
    setDurata("Breve");

    // 4. Custom characters
    setPersonaggiMode("personalizzata");
    
    const count = Math.floor(Math.random() * 2) + 1; // 1 or 2 characters
    const generated: Character[] = [];
    const typesToUse = unlockedCharacterTypes.length > 0 ? unlockedCharacterTypes : CHARACTER_TYPES;
    const traitsToUse = unlockedCharacterTraits.length > 0 ? unlockedCharacterTraits : CHARACTER_TRAITS;

    for (let i = 0; i < count; i++) {
      const type = typesToUse[Math.floor(Math.random() * typesToUse.length)];
      const trait = traitsToUse[Math.floor(Math.random() * traitsToUse.length)];
      
      const names = generateFantasyNames(type, trait);
      const standardNames = SUGGESTED_NAMES_BY_TYPE[type] || ["Milo", "Kiki"];
      const combinedPool = [...names, ...standardNames];
      const name = combinedPool[Math.floor(Math.random() * combinedPool.length)] || "Amico";
      
      generated.push({ 
        nome: name, 
        tipo: type, 
        caratteristica: getTraitForCharacterType(trait, type)
      });
    }
    setCustomCharacters(generated);

    // 5. Populate child name if empty and no profile is active
    if (!activeProfile && !backupName.trim()) {
      setBackupName("Piccolo Lettore");
    }

    // 6. Trigger blinking/flashing on generate button
    setIsBlinking(true);

    // 7. Scroll to the bottom of the container and its parents recursively
    setTimeout(() => {
      // Use scrollIntoView on the submit button first, which natively handles all parents
      const submitBtn = document.getElementById("btn-trigger-story-generation");
      if (submitBtn) {
        submitBtn.scrollIntoView({ behavior: "smooth", block: "end" });
      }

      // Also ensure scrollContainerRef is fully scrolled
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: "smooth"
        });

        // Traverse up the DOM to scroll parents
        let el: HTMLElement | null = scrollContainerRef.current;
        while (el) {
          el.scrollTo({
            top: el.scrollHeight,
            behavior: "smooth"
          });
          el = el.parentElement;
        }
      }
    }, 180);
  };

  const handleStartGeneration = () => {
    playGenerateClickSound();
    let name = "";
    let age = 5;

    if (activeProfile) {
      name = activeProfile.nome;
      age = currentYear - activeProfile.annoNascita;
    } else {
      name = backupName.trim() || "Piccolo Lettore";
      age = backupAge;
    }

    // Persist usage stats
    try {
      const savedStats = JSON.parse(localStorage.getItem("favole_magiche_usage_stats") || "{}");
      savedStats[categoria] = (savedStats[categoria] || 0) + 1;
      savedStats[temaEducativo] = (savedStats[temaEducativo] || 0) + 1;
      
      if (personaggiMode === "personalizzata") {
        customCharacters.forEach(c => {
          savedStats[c.tipo] = (savedStats[c.tipo] || 0) + 1;
          if (c.caratteristica) {
            savedStats[c.caratteristica] = (savedStats[c.caratteristica] || 0) + 1;
          }
        });
      }
      localStorage.setItem("favole_magiche_usage_stats", JSON.stringify(savedStats));
    } catch (e) {}

    onGenerate({
      categoria,
      temaEducativo,
      durata,
      personaggi: personaggiMode === "casuale" ? [] : customCharacters,
      nomeBambino: name,
      etaBambino: age,
      excludeBambino: !includeBambino,
      isBedtimeMode
    } as any);
  };

  return (
    <div className="flex-1 flex flex-col p-5">
      {/* Back Header */}
      <div className="flex items-center justify-between mb-4 shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { playClickSound(); onBack(); }}
            id="btn-back-new-story"
            className="w-9 h-9 bg-white hover:bg-natural-pink-light text-natural-burgundy rounded-xl flex items-center justify-center border-2 border-natural-pink-border shadow-xs transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <h3 className="text-lg font-bold text-natural-burgundy font-serif">Nuova Storia</h3>
        </div>
        <button
          onClick={handleRandomizeAll}
          id="btn-random-story-config"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-[10.5px] font-black rounded-full shadow-md border-b-2 border-amber-700 active:border-b-0 active:translate-y-[2px] transition-all cursor-pointer uppercase tracking-wider animate-pulse ring-4 ring-amber-400/60 shrink-0"
          title="Genera casualmente categoria, tema, tipo e caratteristica personaggio!"
        >
          <Sparkles size={11} className="animate-bounce" />
          <span>Casuale 🔮</span>
        </button>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto space-y-4 px-1.5 pb-4 scrollbar-none">
        
        {/* Bedtime Mode Cozy Banner */}
        {isBedtimeMode && (
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 border-4 border-indigo-300 rounded-[2rem] p-3.5 text-white shadow-lg space-y-1.5 relative overflow-hidden shrink-0">
            {/* Stars overlay in background */}
            <div className="absolute top-2 right-4 text-xs animate-pulse opacity-80">✨</div>
            <div className="absolute bottom-2 left-4 text-xs animate-pulse opacity-60">⭐</div>
            <div className="absolute top-3 left-1/3 text-[10px] animate-pulse opacity-40">✨</div>
            
            <div className="flex items-center gap-2.5 relative z-10">
              <span className="text-3xl animate-bounce">🌙</span>
              <div className="text-left flex-1">
                <h4 className="font-extrabold text-[11.5px] text-[#C5CAE9] leading-none uppercase tracking-wider flex items-center gap-1">
                  Modalità Buonanotte Attiva
                </h4>
                <p className="text-[9px] text-indigo-100 font-bold leading-normal mt-1">
                  Toni di voce dolci, musica rilassante e un'atmosfera stellata per fare sogni d'oro.
                </p>
              </div>
              {onToggleBedtimeMode && (
                <button
                  onClick={() => onToggleBedtimeMode(false)}
                  className="px-2 py-1 bg-white/20 hover:bg-white/35 active:scale-95 text-[8px] font-black uppercase rounded-lg border border-white/30 transition-all shrink-0 cursor-pointer"
                  title="Disattiva modalità buonanotte"
                >
                  Annulla
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active child reminder or manual input */}
        <div className="bg-white/80 rounded-[2rem] p-3.5 border-4 border-natural-pink-border shadow-sm space-y-2.5">
          {profiles.length > 0 && (
            <div className="flex items-center justify-between border-b pb-2 border-natural-pink-light/30">
              <span className="text-[10px] uppercase font-extrabold text-natural-burgundy/60 tracking-wider flex items-center gap-1">
                👤 Bambino:
              </span>
              <select
                id="select-child-profile-new-story"
                value={activeProfile ? activeProfile.id : "manual"}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "manual") {
                    if (onSelectProfile) onSelectProfile(null);
                  } else {
                    const match = profiles.find((p) => p.id === val);
                    if (match && onSelectProfile) {
                      onSelectProfile(match);
                    }
                  }
                }}
                className="bg-natural-pink-light/40 border-2 border-natural-pink-border/50 text-natural-burgundy font-extrabold rounded-xl px-2 py-0.5 text-xs focus:outline-none cursor-pointer"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id} className="text-slate-800">
                    {p.nome} ({currentYear - p.annoNascita} anni)
                  </option>
                ))}
                <option value="manual" className="text-slate-800 font-semibold">
                  ✍️ Altro bambino (Manuale)
                </option>
              </select>
            </div>
          )}

          {activeProfile ? (
            <div className="flex items-center gap-2.5">
              <span className="text-2xl animate-bounce">🦁</span>
              <p className="text-xs text-natural-burgundy font-bold">
                La favola sarà dedicata a <strong className="text-[#EC407A] font-extrabold">{activeProfile.nome}</strong> (Età: {currentYear - activeProfile.annoNascita} anni).
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-natural-burgundy font-extrabold mb-1">
                <span className="text-lg">👶</span>
                <span>A chi dedichiamo la favola?</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  placeholder="Nome Bambino"
                  maxLength={15}
                  className="bg-natural-bg border-2 border-natural-pink-light rounded-xl px-2.5 py-2 text-xs text-natural-text focus:outline-none focus:ring-4 focus:ring-natural-pink-light/40 font-bold"
                />
                <select
                  value={backupAge}
                  onChange={(e) => setBackupAge(parseInt(e.target.value))}
                  className="bg-natural-bg border-2 border-natural-pink-light rounded-xl px-2.5 py-2 text-xs text-natural-text focus:outline-none font-bold"
                >
                  {Array.from({ length: 11 }, (_, i) => i + 2).map((a) => (
                    <option key={a} value={a}>
                      {a} anni
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-natural-text/60 font-semibold leading-relaxed">
                Consiglio: crea un profilo in <button onClick={() => onNavigate("profiles")} className="text-[#EC407A] font-bold underline">Profili</button> per salvarlo automaticamente!
              </p>
            </div>
          )}

          {/* Checkbox to include/exclude the child profile in the story */}
          <div className="mt-3.5 pt-3 flex items-center justify-between border-t border-natural-pink-border/25">
            <span className="text-[10px] font-bold text-natural-burgundy/80">
              Inserisci {activeProfile ? activeProfile.nome : (backupName.trim() || "il bambino")} direttamente come personaggio?
            </span>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={includeBambino}
                onChange={(e) => setIncludeBambino(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#EC407A]"></div>
            </label>
          </div>
        </div>

        {/* 1. Categoria Selector */}
        <div className="space-y-2.5 bg-white/40 p-3 rounded-[1.8rem] border-2 border-natural-pink-light/30">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-black text-natural-burgundy uppercase tracking-wider">
              1. Scegli la Categoria
            </label>
            <span className="text-[9px] font-bold text-natural-text/50">Ordina per utilizzo</span>
          </div>

          {/* Search bar for category */}
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-natural-burgundy/40" />
            <input
              type="text"
              placeholder="Cerca categoria..."
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="w-full bg-white border border-natural-pink-border/60 rounded-xl pl-8 pr-3 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-natural-pink-light/40 font-bold text-natural-burgundy placeholder:text-natural-burgundy/30"
            />
          </div>

          {/* Unlocked / Available Categories */}
          {paginatedCategories.length > 0 ? (
            <div className="grid grid-cols-2 gap-1.5">
              {paginatedCategories.map((cat) => {
                const selected = categoria === cat;
                const usage = getUsage(cat);
                const emoji = CATEGORY_EMOJIS[cat] || "🏰";
                const isNew = unlockedCategories.includes(cat) && !INITIAL_CATEGORIES.includes(cat) && !usedUnlockedItems.includes(cat) && usage === 0;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategoria(cat);
                      if (onMarkItemAsUsed) onMarkItemAsUsed(cat);
                    }}
                    id={`btn-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`py-2 px-2.5 rounded-2xl text-left font-extrabold text-xs border-4 transition-all relative flex flex-col justify-between ${
                      selected
                        ? "bg-[#FCE4EC] text-natural-burgundy border-[#F48FB1] shadow-xs scale-[1.02]"
                        : "bg-white text-natural-text border-[#FCE4EC] hover:border-natural-pink-border"
                    }`}
                  >
                    {isNew && (
                      <span className="absolute -top-1.5 -right-1 text-[7px] bg-[#EC407A] text-white px-1.5 py-0.5 rounded-full font-black animate-pulse shadow-xs uppercase tracking-tighter z-10">
                        NEW ✨
                      </span>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{emoji}</span>
                      <span className="truncate">{cat}</span>
                    </div>
                    {usage > 0 && (
                      <span className="text-[8px] bg-natural-burgundy/25 text-natural-burgundy font-black px-1.5 rounded-sm mt-1 self-start uppercase tracking-tighter">
                        Usata: {usage}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-natural-text/50 italic text-center py-1">
              Nessuna categoria sbloccata corrisponde alla ricerca.
            </p>
          )}

          {/* Pagination Controls for Categories */}
          {filteredUnlockedCategories.length > PAGE_SIZE_CATEGORIES && (
            <div className="flex items-center justify-between mt-1 px-1 text-[10px] font-bold text-natural-text/60">
              <button
                type="button"
                disabled={pageCategory === 1}
                onClick={() => setPageCategory(p => Math.max(1, p - 1))}
                className="flex items-center gap-0.5 px-2 py-1 bg-white hover:bg-natural-pink-light rounded-lg border border-natural-pink-border/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft size={10} /> Prec
              </button>
              <span>Pagina {pageCategory} di {Math.ceil(filteredUnlockedCategories.length / PAGE_SIZE_CATEGORIES)}</span>
              <button
                type="button"
                disabled={pageCategory >= Math.ceil(filteredUnlockedCategories.length / PAGE_SIZE_CATEGORIES)}
                onClick={() => setPageCategory(p => p + 1)}
                className="flex items-center gap-0.5 px-2 py-1 bg-white hover:bg-natural-pink-light rounded-lg border border-natural-pink-border/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Succ <ChevronRight size={10} />
              </button>
            </div>
          )}

          {/* Locked / Mystery Categories */}
          {filteredLockedCategories.length > 0 && (
            <div className="mt-2 bg-slate-100/50 p-2.5 rounded-xl border border-slate-200/40">
              <button
                type="button"
                onClick={() => {
                  setShowSecretCategories(!showSecretCategories);
                  playPlinkSound();
                }}
                className="w-full flex items-center justify-between text-[9px] uppercase font-black text-slate-500 tracking-wider px-0.5 cursor-pointer hover:text-slate-700 focus:outline-none"
              >
                <span>🔒 Categorie segrete ({filteredLockedCategories.length})</span>
                <span className="text-[8px] bg-slate-200/80 hover:bg-slate-300 text-slate-600 font-extrabold px-1.5 py-0.5 rounded transition-colors">
                  {showSecretCategories ? "Nascondi 🔼" : "Mostra 🔽"}
                </span>
              </button>
              {showSecretCategories && (
                <div className="grid grid-cols-2 gap-1.5 mt-2 animate-fade-in">
                  {filteredLockedCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setLockedBannerMsg({
                        section: "categoria",
                        text: `La categoria '${cat}' è ancora segreta! Si sbloccherà casualmente completando gli obiettivi o aprendo il Box Regalo Giornaliero!`
                      })}
                      className="py-1.5 px-2 bg-slate-200/40 hover:bg-slate-200/70 text-slate-400 text-[10.5px] rounded-xl font-bold flex items-center justify-between border border-slate-200/30 transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{CATEGORY_EMOJIS[cat] || "❓"}</span>
                        <span>{cat}</span>
                      </span>
                      <Lock size={10} className="text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Lock message banner */}
          {lockedBannerMsg && lockedBannerMsg.section === "categoria" && (
            <div className="bg-amber-50 border border-amber-200 text-[#795548] p-2 rounded-xl text-[10px] font-medium leading-relaxed flex items-start gap-1.5 relative mt-1.5">
              <span className="text-xs">🔑</span>
              <p className="pr-4">{lockedBannerMsg.text}</p>
              <button 
                type="button" 
                onClick={() => setLockedBannerMsg(null)} 
                className="absolute right-1.5 top-1.5 text-slate-400 hover:text-slate-600 text-xs font-black cursor-pointer"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* 2. Tema Educativo Selector */}
        <div className="space-y-2.5 bg-white/40 p-3 rounded-[1.8rem] border-2 border-natural-pink-light/30">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-black text-natural-burgundy uppercase tracking-wider">
              2. Tema Educativo (La Morale)
            </label>
            <span className="text-[9px] font-bold text-natural-text/50">Ordina per utilizzo</span>
          </div>

          {/* Search bar for themes */}
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-natural-burgundy/40" />
            <input
              type="text"
              placeholder="Cerca tema..."
              value={searchTheme}
              onChange={(e) => setSearchTheme(e.target.value)}
              className="w-full bg-white border border-natural-pink-border/60 rounded-xl pl-8 pr-3 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-natural-pink-light/40 font-bold text-natural-burgundy placeholder:text-natural-burgundy/30"
            />
          </div>

          {/* Unlocked / Available Themes */}
          {paginatedThemes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {paginatedThemes.map((theme) => {
                const selected = temaEducativo === theme;
                const usage = getUsage(theme);
                const emoji = THEME_EMOJIS[theme] || "✨";
                const isNew = unlockedThemes.includes(theme) && !INITIAL_THEMES.includes(theme) && !usedUnlockedItems.includes(theme) && usage === 0;
                return (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => {
                      setTemaEducativo(theme);
                      if (onMarkItemAsUsed) onMarkItemAsUsed(theme);
                    }}
                    id={`btn-theme-${theme.toLowerCase()}`}
                    className={`py-1.5 px-3 rounded-full font-extrabold text-[10px] border-2 transition-all flex items-center gap-1 relative ${
                      selected
                        ? "bg-natural-yellow-light text-[#F57C00] border-natural-yellow scale-102 shadow-2xs"
                        : "bg-white text-natural-text border-slate-100 hover:border-natural-yellow-light"
                    }`}
                  >
                    {isNew && (
                      <span className="absolute -top-1.5 -right-1 text-[7px] bg-[#EC407A] text-white px-1.5 py-0.5 rounded-full font-black animate-pulse shadow-xs uppercase tracking-tighter z-10">
                        NEW ✨
                      </span>
                    )}
                    <span>{emoji}</span>
                    <span>{getEducationalThemeDisplayName(theme)}</span>
                    {usage > 0 && (
                      <span className="text-[8px] bg-amber-300 text-slate-900 font-black px-1.5 rounded-full border border-amber-500">
                        {usage}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-natural-text/50 italic text-center py-1">
              Nessun tema sbloccato corrisponde alla ricerca.
            </p>
          )}

          {/* Pagination Controls for Themes */}
          {filteredUnlockedThemes.length > PAGE_SIZE_THEMES && (
            <div className="flex items-center justify-between mt-1 px-1 text-[10px] font-bold text-natural-text/60">
              <button
                type="button"
                disabled={pageTheme === 1}
                onClick={() => setPageTheme(p => Math.max(1, p - 1))}
                className="flex items-center gap-0.5 px-2 py-1 bg-white hover:bg-natural-pink-light rounded-lg border border-natural-pink-border/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft size={10} /> Prec
              </button>
              <span>Pagina {pageTheme} di {Math.ceil(filteredUnlockedThemes.length / PAGE_SIZE_THEMES)}</span>
              <button
                type="button"
                disabled={pageTheme >= Math.ceil(filteredUnlockedThemes.length / PAGE_SIZE_THEMES)}
                onClick={() => setPageTheme(p => p + 1)}
                className="flex items-center gap-0.5 px-2 py-1 bg-white hover:bg-natural-pink-light rounded-lg border border-natural-pink-border/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Succ <ChevronRight size={10} />
              </button>
            </div>
          )}

          {/* Locked / Mystery Themes */}
          {filteredLockedThemes.length > 0 && (
            <div className="mt-2 bg-slate-100/50 p-2.5 rounded-xl border border-slate-200/40">
              <button
                type="button"
                onClick={() => {
                  setShowSecretThemes(!showSecretThemes);
                  playPlinkSound();
                }}
                className="w-full flex items-center justify-between text-[9px] uppercase font-black text-slate-500 tracking-wider px-0.5 cursor-pointer hover:text-slate-700 focus:outline-none"
              >
                <span>🔒 Temi educativi segreti ({filteredLockedThemes.length})</span>
                <span className="text-[8px] bg-slate-200/80 hover:bg-slate-300 text-slate-600 font-extrabold px-1.5 py-0.5 rounded transition-colors">
                  {showSecretThemes ? "Nascondi 🔼" : "Mostra 🔽"}
                </span>
              </button>
              {showSecretThemes && (
                <div className="flex flex-wrap gap-1.5 mt-2 animate-fade-in">
                  {filteredLockedThemes.map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => setLockedBannerMsg({
                        section: "temaEducativo",
                        text: `Il tema '${getEducationalThemeDisplayName(theme)}' è ancora segreto! Si sbloccherà casualmente completando gli obiettivi o aprendo il Box Regalo Giornaliero!`
                      })}
                      className="py-1 px-2.5 bg-slate-200/40 hover:bg-slate-200/70 text-slate-400 text-[10px] rounded-full font-bold flex items-center gap-1 border border-slate-200/30 transition-all cursor-pointer"
                    >
                      <span>{THEME_EMOJIS[theme] || "❓"}</span>
                      <span>{getEducationalThemeDisplayName(theme)}</span>
                      <Lock size={9} className="text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Lock message banner */}
          {lockedBannerMsg && lockedBannerMsg.section === "temaEducativo" && (
            <div className="bg-amber-50 border border-amber-200 text-[#795548] p-2 rounded-xl text-[10px] font-medium leading-relaxed flex items-start gap-1.5 relative mt-1.5">
              <span className="text-xs">🔑</span>
              <p className="pr-4">{lockedBannerMsg.text}</p>
              <button 
                type="button" 
                onClick={() => setLockedBannerMsg(null)} 
                className="absolute right-1.5 top-1.5 text-slate-400 hover:text-slate-600 text-xs font-black cursor-pointer"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* 3. Durata Selector */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-natural-text/70 uppercase tracking-wide">
            3. Lunghezza Storia
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DURATIONS.map((dur) => {
              const selected = durata === dur.value;
              return (
                <button
                  key={dur.value}
                  onClick={() => setDurata(dur.value as any)}
                  id={`btn-duration-${dur.value.toLowerCase()}`}
                  className={`py-2 px-2 rounded-2xl font-extrabold text-center text-xs border-4 transition-all ${
                    selected
                      ? "bg-[#E1F5FE] text-[#0277BD] border-[#81D4FA] shadow-xs"
                      : "bg-white/80 text-natural-text border-transparent hover:border-natural-blue-light"
                  }`}
                >
                  <span className="text-sm">{dur.value === "Breve" ? "🕒" : dur.value === "Media" ? "⏳" : "🌙"}</span>
                  <div className="text-[9px] mt-0.5 tracking-tight">{dur.value}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Personaggi Option */}
        <div className="space-y-2 border-t-4 border-natural-pink-light pt-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-natural-text/70 uppercase tracking-wide">
              4. Personaggi Della Storia
            </label>
            <div className="inline-flex bg-white/85 p-0.5 rounded-full border-2 border-natural-pink-border">
              <button
                onClick={() => setPersonaggiMode("casuale")}
                className={`px-3 py-1 text-[9px] font-bold rounded-full transition-all ${
                  personaggiMode === "casuale" ? "bg-gradient-to-r from-natural-pink to-[#EC407A] text-white" : "text-natural-text"
                }`}
              >
                Casuale
              </button>
              <button
                onClick={() => setPersonaggiMode("personalizzata")}
                className={`px-3 py-1 text-[9px] font-bold rounded-full transition-all ${
                  personaggiMode === "personalizzata" ? "bg-gradient-to-r from-natural-pink to-[#EC407A] text-white" : "text-natural-text"
                }`}
              >
                Personalizzati
              </button>
            </div>
          </div>

          {personaggiMode === "casuale" ? (
            <div className="bg-[#FFE082]/30 rounded-2xl p-3 border-2 border-[#FFE082]/60 text-center text-xs text-natural-text font-semibold">
              🧙‍♂️ L'IA magica creerà personaggi fantastici perfetti per la categoria <strong className="text-natural-burgundy">{categoria}</strong>!
            </div>
          ) : (
            <div className="space-y-4 bg-[#E1F5FE]/30 rounded-2xl p-3.5 border-2 border-[#81D4FA]/40">
              {/* Added characters list displayed at the top of the section */}
              <div>
                <p className="text-[10px] font-black text-natural-burgundy uppercase tracking-wider mb-2">
                  Personaggi inseriti ({customCharacters.length} di 3):
                </p>
                {customCharacters.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {customCharacters.map((char, idx) => {
                      const typeEmoji = TYPE_EMOJIS[char.tipo] || "👾";
                      const traitEmoji = char.caratteristica ? (TRAIT_EMOJIS[char.caratteristica] || "✨") : "";
                      return (
                        <div
                          key={idx}
                          className="bg-white text-natural-burgundy px-2.5 py-1.5 rounded-xl text-xs border-2 border-natural-pink-border flex items-center gap-1.5 font-bold shadow-xs"
                        >
                          <span className="text-sm">{typeEmoji}</span>
                          <div className="leading-tight">
                            <span className="block font-black text-slate-800">{char.nome}</span>
                            <span className="text-[8.5px] text-natural-text/60 font-bold block">
                              {char.tipo} {char.caratteristica ? `• ${traitEmoji} ${char.caratteristica}` : ""}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCharacter(idx)}
                            className="text-red-400 hover:text-red-600 ml-2 cursor-pointer transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-natural-text/50 font-semibold italic text-center py-1">
                    Ancora nessun personaggio aggiunto.
                  </p>
                )}
              </div>

              {/* Form to add character if less than 3 is displayed dynamically */}
              {customCharacters.length < 3 ? (
                !showCharacterForm ? (
                  <button
                    type="button"
                    onClick={() => setShowCharacterForm(true)}
                    className="w-full py-2.5 bg-gradient-to-r from-natural-pink to-[#EC407A] hover:from-[#EC407A] hover:to-[#D81B60] text-white text-xs font-black rounded-full flex items-center justify-center gap-1.5 shadow-md border-b-2 border-pink-700 active:translate-y-[1px] transition-all cursor-pointer uppercase tracking-wider"
                  >
                    <Plus size={14} /> Aggiungi personaggio
                  </button>
                ) : (
                  <div className="space-y-4 border-t-2 border-[#81D4FA]/20 pt-3.5">
                    {/* Character Type Picker */}
                    <div className="space-y-2 bg-white/50 p-2.5 rounded-xl border border-slate-200/30">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-natural-burgundy uppercase tracking-wider block">
                          🎭 Scegli il Tipo (da personalizzare)
                        </span>
                        <span className="text-[8px] font-bold text-natural-text/50">Uso</span>
                      </div>

                      {/* Search bar for character type */}
                      <div className="relative">
                        <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-natural-burgundy/40" />
                        <input
                          type="text"
                          placeholder="Cerca tipo..."
                          value={searchCharType}
                          onChange={(e) => setSearchCharType(e.target.value)}
                          className="w-full bg-white border border-natural-pink-border/40 rounded-lg pl-7 pr-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-natural-pink-light font-bold text-natural-burgundy placeholder:text-natural-burgundy/30"
                        />
                      </div>

                      {/* Unlocked Character Types */}
                      {paginatedCharacterTypes.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {paginatedCharacterTypes.map((t) => {
                            const isSelected = charType === t;
                            const emoji = TYPE_EMOJIS[t] || "👾";
                            const usage = getUsage(t);
                            const isNew = unlockedCharacterTypes.includes(t) && !INITIAL_CHARACTER_TYPES.includes(t) && !usedUnlockedItems.includes(t) && usage === 0;
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  setCharType(t);
                                  if (onMarkItemAsUsed) onMarkItemAsUsed(t);
                                }}
                                className={`py-1.5 px-3 rounded-xl font-extrabold text-[10px] border-2 flex items-center gap-1 transition-all cursor-pointer relative ${
                                  isSelected
                                    ? "bg-[#FFF9C4] text-[#E65100] border-[#FFE082] scale-102 shadow-xs"
                                    : "bg-white text-natural-text border-slate-100 hover:border-natural-pink-light"
                                }`}
                              >
                                {isNew && (
                                  <span className="absolute -top-1.5 -right-1 text-[7px] bg-[#EC407A] text-white px-1.5 py-0.5 rounded-full font-black animate-pulse shadow-xs uppercase tracking-tighter z-10">
                                    NEW ✨
                                  </span>
                                )}
                                <span>{emoji}</span>
                                <span>{t}</span>
                                {usage > 0 && (
                                  <span className="text-[8px] bg-amber-100 text-amber-800 font-black px-1 rounded-full ml-0.5">
                                    {usage}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] text-natural-text/50 italic py-1">
                          Nessun tipo sbloccato trovato.
                        </p>
                      )}

                      {/* Pagination Controls for Types */}
                      {filteredUnlockedCharacterTypes.length > PAGE_SIZE_CHAR_TYPES && (
                        <div className="flex items-center justify-between text-[9px] font-bold text-natural-text/50">
                          <button
                            type="button"
                            disabled={pageCharType === 1}
                            onClick={() => setPageCharType(p => Math.max(1, p - 1))}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white rounded border border-slate-200 disabled:opacity-40"
                          >
                            <ChevronLeft size={8} /> Prec
                          </button>
                          <span>Pagina {pageCharType} di {Math.ceil(filteredUnlockedCharacterTypes.length / PAGE_SIZE_CHAR_TYPES)}</span>
                          <button
                            type="button"
                            disabled={pageCharType >= Math.ceil(filteredUnlockedCharacterTypes.length / PAGE_SIZE_CHAR_TYPES)}
                            onClick={() => setPageCharType(p => p + 1)}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white rounded border border-slate-200 disabled:opacity-40"
                          >
                            Succ <ChevronRight size={8} />
                          </button>
                        </div>
                      )}

                      {/* Locked Character Types */}
                      {filteredLockedCharacterTypes.length > 0 && (
                        <div className="mt-1.5 bg-slate-100/60 p-2 rounded-lg border border-slate-200/40">
                          <button
                            type="button"
                            onClick={() => {
                              setShowSecretCharTypes(!showSecretCharTypes);
                              playPlinkSound();
                            }}
                            className="w-full flex items-center justify-between text-[8px] uppercase font-black text-slate-500 tracking-wider cursor-pointer hover:text-slate-700 focus:outline-none"
                          >
                            <span>🔒 Tipi segreti ({filteredLockedCharacterTypes.length})</span>
                            <span className="text-[7px] bg-slate-200/80 hover:bg-slate-300 text-slate-600 font-extrabold px-1 py-0.5 rounded transition-colors">
                              {showSecretCharTypes ? "Nascondi 🔼" : "Mostra 🔽"}
                            </span>
                          </button>
                          {showSecretCharTypes && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5 animate-fade-in">
                              {filteredLockedCharacterTypes.map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setLockedBannerMsg({
                                    section: "charType",
                                    text: `Il tipo personaggio '${t}' è ancora segreto! Si sbloccherà casualmente completando gli obiettivi o aprendo il Box Regalo Giornaliero!`
                                  })}
                                  className="py-1 px-2 bg-slate-200/40 hover:bg-slate-200/70 text-slate-400 text-[9px] rounded-lg font-bold flex items-center gap-1 border border-slate-200/30 transition-all cursor-pointer"
                                >
                                  <span>{TYPE_EMOJIS[t] || "❓"}</span>
                                  <span>{t}</span>
                                  <Lock size={8} className="text-slate-400" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Lock banner msg for charType */}
                      {lockedBannerMsg && lockedBannerMsg.section === "charType" && (
                        <div className="bg-amber-50 border border-amber-200 text-[#795548] p-2 rounded-lg text-[9px] font-medium leading-relaxed flex items-start gap-1 relative mt-1">
                          <span>🔑</span>
                          <p className="pr-4">{lockedBannerMsg.text}</p>
                          <button 
                            type="button" 
                            onClick={() => setLockedBannerMsg(null)} 
                            className="absolute right-1 top-1 text-slate-400 hover:text-slate-600 text-xs font-black cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Character Name */}
                    <div>
                      <span className="text-[10px] font-black text-natural-burgundy uppercase tracking-wider block mb-1">
                        ✍️ Nome Personaggio
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={charName}
                          onChange={(e) => setCharName(e.target.value)}
                          placeholder="Esempio: Celeste, Davide..."
                          maxLength={12}
                          className="flex-1 min-w-0 bg-white border-2 border-natural-pink-light rounded-xl px-3 py-2 text-xs text-natural-text font-bold focus:outline-none focus:border-natural-pink-border shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={handleShuffleSuggestions}
                          className="px-2.5 bg-gradient-to-r from-[#FFB300] to-amber-500 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-[#5D4037] rounded-xl flex items-center justify-center gap-1 text-xs font-black shadow-md border-b-2 border-amber-700 transition-all cursor-pointer select-none shrink-0"
                          title="Cambia suggerimenti di fantasia"
                        >
                          <span className="text-sm">🎲</span>
                          <span className="text-[9px] uppercase tracking-wider font-extrabold">Genera</span>
                        </button>
                      </div>

                      {/* Suggested names */}
                      {suggestedNames.length > 0 && (
                        <div className="mt-2 p-2 bg-white/60 border border-natural-pink-light/50 rounded-xl">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[9px] font-extrabold text-natural-burgundy/60 tracking-wide uppercase mr-1">💡 Idee:</span>
                            {suggestedNames.map((name) => (
                              <button
                                key={name}
                                type="button"
                                onClick={() => setCharName(name)}
                                className="bg-white hover:bg-[#FFF9C4]/90 text-natural-burgundy px-2 py-1 rounded-lg text-[10px] font-bold border border-natural-pink-border/40 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                              >
                                {name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Character Trait Picker */}
                    <div className="space-y-2 bg-white/50 p-2.5 rounded-xl border border-slate-200/30">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-natural-burgundy uppercase tracking-wider block">
                          ✨ Caratteristica speciale
                        </span>
                        <span className="text-[8px] font-bold text-natural-text/50">Uso</span>
                      </div>

                      {/* Search bar for character trait */}
                      <div className="relative">
                        <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-natural-burgundy/40" />
                        <input
                          type="text"
                          placeholder="Cerca caratteristica..."
                          value={searchCharTrait}
                          onChange={(e) => setSearchCharTrait(e.target.value)}
                          className="w-full bg-white border border-natural-pink-border/40 rounded-lg pl-7 pr-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-natural-pink-light font-bold text-natural-burgundy placeholder:text-natural-burgundy/30"
                        />
                      </div>

                      {/* Unlocked Character Traits */}
                      {paginatedCharacterTraits.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {paginatedCharacterTraits.map((tr) => {
                            const isSelected = charTrait === tr;
                            const emoji = TRAIT_EMOJIS[tr] || "⭐";
                            const displayTrait = getTraitForCharacterType(tr, charType);
                            const usage = getUsage(tr);
                            const isNew = unlockedCharacterTraits.includes(tr) && !INITIAL_CHARACTER_TRAITS.includes(tr) && !usedUnlockedItems.includes(tr) && usage === 0;
                            return (
                              <button
                                key={tr}
                                type="button"
                                onClick={() => {
                                  setCharTrait(toBaseTrait(tr));
                                  if (onMarkItemAsUsed) onMarkItemAsUsed(tr);
                                }}
                                className={`py-1.5 px-3 rounded-xl font-extrabold text-[10px] border-2 flex items-center gap-1 transition-all cursor-pointer relative ${
                                  isSelected
                                    ? "bg-[#FFF1F2] text-[#EC407A] border-natural-pink-border scale-102 shadow-xs"
                                    : "bg-white text-natural-text border-slate-100 hover:border-natural-pink-light"
                                }`}
                              >
                                {isNew && (
                                  <span className="absolute -top-1.5 -right-1 text-[7px] bg-[#EC407A] text-white px-1.5 py-0.5 rounded-full font-black animate-pulse shadow-xs uppercase tracking-tighter z-10">
                                    NEW ✨
                                  </span>
                                )}
                                <span>{emoji}</span>
                                <span>{displayTrait}</span>
                                {usage > 0 && (
                                  <span className="text-[8px] bg-pink-100 text-pink-800 font-black px-1 rounded-full ml-0.5">
                                    {usage}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] text-natural-text/50 italic py-1">
                          Nessuna caratteristica sbloccata trovata.
                        </p>
                      )}

                      {/* Pagination Controls for Traits */}
                      {filteredUnlockedCharacterTraits.length > PAGE_SIZE_CHAR_TRAITS && (
                        <div className="flex items-center justify-between text-[9px] font-bold text-natural-text/50">
                          <button
                            type="button"
                            disabled={pageCharTrait === 1}
                            onClick={() => setPageCharTrait(p => Math.max(1, p - 1))}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white rounded border border-slate-200 disabled:opacity-40"
                          >
                            <ChevronLeft size={8} /> Prec
                          </button>
                          <span>Pagina {pageCharTrait} di {Math.ceil(filteredUnlockedCharacterTraits.length / PAGE_SIZE_CHAR_TRAITS)}</span>
                          <button
                            type="button"
                            disabled={pageCharTrait >= Math.ceil(filteredUnlockedCharacterTraits.length / PAGE_SIZE_CHAR_TRAITS)}
                            onClick={() => setPageCharTrait(p => p + 1)}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white rounded border border-slate-200 disabled:opacity-40"
                          >
                            Succ <ChevronRight size={8} />
                          </button>
                        </div>
                      )}

                      {/* Locked Character Traits */}
                      {filteredLockedCharacterTraits.length > 0 && (
                        <div className="mt-1.5 bg-slate-100/60 p-2 rounded-lg border border-slate-200/40">
                          <button
                            type="button"
                            onClick={() => {
                              setShowSecretCharTraits(!showSecretCharTraits);
                              playPlinkSound();
                            }}
                            className="w-full flex items-center justify-between text-[8px] uppercase font-black text-slate-500 tracking-wider cursor-pointer hover:text-slate-700 focus:outline-none"
                          >
                            <span>🔒 Caratteristiche segrete ({filteredLockedCharacterTraits.length})</span>
                            <span className="text-[7px] bg-slate-200/80 hover:bg-slate-300 text-slate-600 font-extrabold px-1 py-0.5 rounded transition-colors">
                              {showSecretCharTraits ? "Nascondi 🔼" : "Mostra 🔽"}
                            </span>
                          </button>
                          {showSecretCharTraits && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5 animate-fade-in">
                            {filteredLockedCharacterTraits.map((tr) => (
                              <button
                                key={tr}
                                type="button"
                                onClick={() => setLockedBannerMsg({
                                  section: "charTrait",
                                  text: `La caratteristica '${getTraitForCharacterType(tr, charType)}' è ancora segreta! Si sbloccherà casualmente completando gli obiettivi o aprendo il Box Regalo Giornaliero!`
                                })}
                                className="py-1 px-2 bg-slate-200/40 hover:bg-slate-200/70 text-slate-400 text-[9px] rounded-lg font-bold flex items-center gap-1 border border-slate-200/30 transition-all cursor-pointer"
                              >
                                <span>{TRAIT_EMOJIS[tr] || "❓"}</span>
                                <span>{getTraitForCharacterType(tr, charType)}</span>
                                <Lock size={8} className="text-slate-400" />
                              </button>
                            ))}
                          </div>
                          )}
                        </div>
                      )}

                      {/* Lock banner msg for charTrait */}
                      {lockedBannerMsg && lockedBannerMsg.section === "charTrait" && (
                        <div className="bg-amber-50 border border-amber-200 text-[#795548] p-2 rounded-lg text-[9px] font-medium leading-relaxed flex items-start gap-1 relative mt-1">
                          <span>🔑</span>
                          <p className="pr-4">{lockedBannerMsg.text}</p>
                          <button 
                            type="button" 
                            onClick={() => setLockedBannerMsg(null)} 
                            className="absolute right-1 top-1 text-slate-400 hover:text-slate-600 text-xs font-black cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action buttons (Salva and Annulla) */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowCharacterForm(false)}
                        className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black rounded-full text-center transition-all cursor-pointer uppercase tracking-wider border-b-2 border-slate-400 active:border-b-0 active:translate-y-[2px]"
                      >
                        Annulla
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCharacter}
                        disabled={!charName.trim()}
                        className="flex-[2] py-2 bg-gradient-to-r from-emerald-500 to-teal-600 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white text-xs font-black rounded-full flex items-center justify-center gap-1 shadow-md border-b-2 border-emerald-800 active:border-b-0 active:translate-y-[2px] transition-all cursor-pointer uppercase tracking-wider"
                      >
                        <CheckCircle2 size={14} /> Salva
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-[10px] text-natural-yellow font-bold bg-[#FFFEE0] p-2.5 rounded-xl text-center border border-natural-yellow">
                  Limite massimo di 3 personaggi raggiunto!
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={() => {
          setIsBlinking(false);
          handleStartGeneration();
        }}
        onMouseEnter={() => setIsBlinking(false)}
        disabled={personaggiMode === "personalizzata" && customCharacters.length === 0}
        id="btn-trigger-story-generation"
        className={`w-full py-3.5 bg-gradient-to-r from-natural-yellow to-[#FFB300] disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-[#5D4037] border-b-4 border-[#F57C00] active:border-b-0 active:translate-y-1 rounded-full font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 mt-auto ${
          isBlinking 
            ? "animate-pulse ring-4 ring-amber-400 ring-offset-2 scale-[1.02]" 
            : ""
        }`}
      >
        <Sparkles size={18} className="text-[#F57C00] animate-pulse" /> Genera La Favola Magica!
      </button>
    </div>
  );
}
