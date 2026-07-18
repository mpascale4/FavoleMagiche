import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import PhoneMockup from "./components/PhoneMockup";
import HomeView from "./components/HomeView";
import ProfilesView from "./components/ProfilesView";
import NewStoryView from "./components/NewStoryView";
import GenerationView from "./components/GenerationView";
import StoryReaderView from "./components/StoryReaderView";
import ArchiveView from "./components/ArchiveView";
import SettingsView from "./components/SettingsView";
import GrowthTree from "./components/GrowthTree";
import PinModal from "./components/PinModal";
import ChangePinModal from "./components/ChangePinModal";
import ParentalGateModal from "./components/ParentalGateModal";
import GenerationErrorModal from "./components/GenerationErrorModal";
import AchievementModal from "./components/AchievementModal";
import DeveloperMode from "./components/DeveloperMode";
import DeveloperPinModal from "./components/DeveloperPinModal";
import { audioEngine } from "./lib/audioEngine";
import { playFairyChorusSound, playClickSound } from "./utils/audio";
import { ChildProfile, DeletedProfile, DeletedStory, Story, AppSettings, ScreenType, Character, CATEGORIES, EDUCATIONAL_THEMES, INITIAL_CATEGORIES, INITIAL_THEMES, CHARACTER_TYPES, INITIAL_CHARACTER_TYPES, CHARACTER_TRAITS, INITIAL_CHARACTER_TRAITS } from "./types";
import { generateStage } from "./utils/stages";
import { getEducationalThemeDisplayName } from "./utils/themeNames";
import { generateStoryClient, StoryGenerationConfig } from "./lib/storyGenerator";
import { getGeminiApiKeyStatus } from "./config/api";
import { getGenerationLogs } from "./lib/storyGenerator";
import { checkMilestonesReached, getAchievementById, type Achievement, type AchievementReward } from "./utils/achievements";

type GeminiRuntimeStatus = {
  state: "unknown" | "ok" | "fallback";
  message: string;
  model?: string;
  updatedAt?: string;
};

// Seeding standard child profiles for instant trial
const INITIAL_PROFILES: ChildProfile[] = [
  { id: "p1", nome: "Celeste", annoNascita: 2021, temaVisivo: "🌸 Giardino delle Fate" },
  { id: "p2", nome: "Davide", annoNascita: 2018, temaVisivo: "🌊 Oceano Incantato" }
];

// Seeding a beautiful initial bedtime story so the library isn't empty on first open
const INITIAL_STORY: Story = {
  id: "s1",
  titolo: "La Lucciola che aveva paura del Buio",
  pagine: [
    "C'era una volta, nel magico Bosco dei Sogni 🌲, una piccola lucciola di nome **Lalla** 🧚. Lalla era una lucciola davvero speciale: era dolcissima e soffice, ma aveva un piccolissimo segreto che non rivelava a nessuno...\n- Oh caro, ho così **paura** 👻 del buio! - sussurrava Lalla tremando sotto una foglia di quadrifoglio ogni volta che il sole tramontava.",
    "Un bel giorno incontrò **Celeste** ✨, una bambina curiosa di 5 anni che si era persa tra i sentieri profumati mentre inseguiva una farfalla arcobaleno.\n- Perché piangi, piccola lucciola? - chiese Celeste con un tono gentile.\n- Ho paura del buio! - rispose Lalla singhiozzando. - Se accendo la mia codina, tutti vedranno quanto tremo! Ma se la spengo, non vedo dove vado! 😭",
    "Celeste sorrise teneramente, si sedette sul morbido muschio e tese un dito:\n- Non devi temere, Lalla! Il **coraggio** 💪 non significa non avere mai paura, ma affrontarla tenendosi per mano. Io e te faremo una grande squadra. Tu sarai la mia lanterna e io sarò il tuo scudo!\nInsieme decisero di compiere il primo passo verso il sentiero più scuro.",
    "Lalla prese un profondo respiro e... ssshhhh... accese la sua **luce** ⭐ dorata! Era una luce calda, splendente, che illuminò gli alberi circostanti facendo ballare le ombre del bosco in modo divertente.\n- Guarda che meraviglia! - esclamò Celeste battendo le mani. - La tua luce è la più bella del bosco!\nLalla si accorse che, stando accanto alla sua nuova amica, il buio non faceva più così paura.",
    "Da quella notte, Lalla e Celeste divennero amiche inseparabili. Lalla imparò ad amare la notte, capendo che proprio nell'oscurità la sua luce poteva splendere al massimo e aiutare chi si era smarrito.\n- Grazie Celeste, oggi ho trovato il mio vero **splendore** 🥳! - sussurrò felice la lucciola volando allegra intorno alle stelle d'argento. 👋"
  ],
  morale: "La morale di questa storia è che non dobbiamo nascondere le nostre paure: quando le condividiamo con un vero amico, troviamo il coraggio di splendere e illuminare la via per noi e per gli altri.",
  data: "2026-07-12T18:30:00.000Z",
  dataCreazione: "2026-07-12T18:30:00.000Z",
  ultimaLettura: "2026-07-13T21:15:00.000Z",
  durata: "Media",
  categoria: "Natura",
  temaEducativo: "Coraggio",
  preferita: true,
  coverTheme: "forest",
  coverColor: "pastel-green",
  copertinaDescrizione: "Una simpatica lucciola dorata che illumina un sentiero fiorito tenendo per mano la piccola Celeste sotto la Luna.",
  profiloId: "p1",
  volteLetta: 3
};

export default function App() {
  const [screen, setScreen] = useState<ScreenType>("home");
  const [pendingPinAction, setPendingPinAction] = useState<"settings" | { type: "delete_story", id: string } | null>(null);
  const [pendingGateAction, setPendingGateAction] = useState<{
    type: "navigate" | "bedtime" | "disable_kids_mode";
    target?: ScreenType;
  } | null>(null);
  const [timerNannaRemainingSeconds, setTimerNannaRemainingSeconds] = useState<number | null>(null);
  const [isNannaTriggered, setIsNannaTriggered] = useState<boolean>(false);
  const [forcePinChangeAction, setForcePinChangeAction] = useState<"settings" | { type: "delete_story", id: string } | null>(null);
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [deletedProfiles, setDeletedProfiles] = useState<DeletedProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<ChildProfile | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [deletedStories, setDeletedStories] = useState<DeletedStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [readerBackTarget, setReaderBackTarget] = useState<"home" | "archive">("home");
  const [settings, setSettings] = useState<AppSettings>({
    sogliaSpazio: "1 GB",
    avvisaSuperamento: true,
    eliminaInAutomatico: false,
    conservaPreferite: true,
    pinAccesso: "0000",
    tipoVoce: "narratore",
    nomeVoceDispositivo: "",
    velocitaVoce: 0.85,
    tonoVoce: 1.0,
    musicaSottofondo: true,
    effettiAudio: true,
    pauseMusicaliChiave: true,
    stileVisuale: "auto",
    modalitaBambino: false,
    timerNannaMinutes: 0
  });
  
  const [isPremium, setIsPremium] = useState(false);
  const [generatedToday, setGeneratedToday] = useState(0);
  const [lastGenDate, setLastGenDate] = useState("");
  const [geminiRuntimeStatus, setGeminiRuntimeStatus] = useState<GeminiRuntimeStatus>(() => {
    const defaultState: GeminiRuntimeStatus = {
      state: "unknown",
      message: "Nessuna generazione eseguita in questa sessione"
    };

    if (typeof window === "undefined") {
      return defaultState;
    }

    try {
      const raw = localStorage.getItem("favole_magiche_gemini_runtime_status");
      return raw ? JSON.parse(raw) : defaultState;
    } catch {
      return defaultState;
    }
  });

  // Daily content unlocking states
  const [unlockedCategories, setUnlockedCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [unlockedThemes, setUnlockedThemes] = useState<string[]>(INITIAL_THEMES);
  const [unlockedCharacterTypes, setUnlockedCharacterTypes] = useState<string[]>(INITIAL_CHARACTER_TYPES);
  const [unlockedCharacterTraits, setUnlockedCharacterTraits] = useState<string[]>(INITIAL_CHARACTER_TRAITS);
  const [lastUnlockDate, setLastUnlockDate] = useState<string>("");
  const [claimedAchievements, setClaimedAchievements] = useState<string[]>([]);
  const [isBedtimeMode, setIsBedtimeMode] = useState<boolean>(false);
  const [bedtimeConfirmConfig, setBedtimeConfirmConfig] = useState<any | null>(null);
  const [continueStoryConfirmConfig, setContinueStoryConfirmConfig] = useState<any | null>(null);
  const [usedUnlockedItems, setUsedUnlockedItems] = useState<string[]>([]);
  const [generationError, setGenerationError] = useState<{ title: string; message: string; reason: string } | null>(null);
  const [achievementModal, setAchievementModal] = useState<Achievement | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);
  const [achievementRewardsOpened, setAchievementRewardsOpened] = useState<Record<string, AchievementReward[]>>({});
  const [achievementReturnTarget, setAchievementReturnTarget] = useState<"app" | "developer">("app");
  const [showDeveloperPinModal, setShowDeveloperPinModal] = useState<boolean>(false);
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(false);

  const mapUnlockedToRewards = (unlocked: { category: string; theme: string; characterType: string; characterTrait: string } | null): AchievementReward[] => {
    if (!unlocked) {
      return [{ emoji: "✨", text: "Hai già sbloccato tutti i premi disponibili!" }];
    }

    const rewards: AchievementReward[] = [];
    if (unlocked.category) {
      rewards.push({ emoji: "🌲", text: `Nuova categoria: ${unlocked.category}` });
    }
    if (unlocked.theme) {
      rewards.push({ emoji: "🤝", text: `Nuovo tema: ${unlocked.theme}` });
    }
    if (unlocked.characterType) {
      rewards.push({ emoji: "🧙‍♂️", text: `Nuovo tipo: ${unlocked.characterType}` });
    }
    if (unlocked.characterTrait) {
      rewards.push({ emoji: "⭐", text: `Nuova caratteristica: ${unlocked.characterTrait}` });
    }

    return rewards.length > 0
      ? rewards
      : [{ emoji: "✨", text: "Hai già sbloccato tutti i premi disponibili!" }];
  };

  // Loading state for story creation parameters to show on generating screen
  const [currentGenerationConfig, setCurrentGenerationConfig] = useState<{
    categoria: string;
    temaEducativo: string;
  }>({ categoria: "Fantasy", temaEducativo: "Amicizia" });

  // Load state from localStorage on mount
  useEffect(() => {
    // 1. Child Profiles
    const savedProfiles = localStorage.getItem("favole_magiche_profiles");
    if (savedProfiles) {
      setProfiles(JSON.parse(savedProfiles));
    } else {
      setProfiles(INITIAL_PROFILES);
      localStorage.setItem("favole_magiche_profiles", JSON.stringify(INITIAL_PROFILES));
    }

    // 1.5. Deleted Profiles (Backup / Recycle Bin)
    const savedDeletedProfiles = localStorage.getItem("favole_magiche_deleted_profiles");
    if (savedDeletedProfiles) {
      try {
        const parsed: DeletedProfile[] = JSON.parse(savedDeletedProfiles);
        // Keep backups for maximum 1 month (30 days)
        const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const validBackups = parsed.filter(dp => new Date(dp.deletedAt).getTime() > oneMonthAgo);
        setDeletedProfiles(validBackups);
        localStorage.setItem("favole_magiche_deleted_profiles", JSON.stringify(validBackups));
      } catch (e) {
        console.error("Error parsing deleted profiles", e);
      }
    }

    // 1.6. Deleted Stories
    const savedDeletedStories = localStorage.getItem("favole_magiche_deleted_stories");
    if (savedDeletedStories) {
      try {
        const parsed: DeletedStory[] = JSON.parse(savedDeletedStories);
        const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const validBackups = parsed.filter(ds => new Date(ds.deletedAt).getTime() > oneMonthAgo);
        setDeletedStories(validBackups);
        localStorage.setItem("favole_magiche_deleted_stories", JSON.stringify(validBackups));
      } catch (e) {
        console.error("Error parsing deleted stories", e);
      }
    }

    // 2. Active Profile
    const savedActiveProfile = localStorage.getItem("favole_magiche_active_profile");
    if (savedActiveProfile) {
      setActiveProfile(JSON.parse(savedActiveProfile));
    } else {
      setActiveProfile(INITIAL_PROFILES[0]);
      localStorage.setItem("favole_magiche_active_profile", JSON.stringify(INITIAL_PROFILES[0]));
    }

    // 3. App Settings
    const savedSettings = localStorage.getItem("favole_magiche_settings");
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      if (parsed.pinAccesso === undefined) {
        parsed.pinAccesso = "0000";
      }
      if (parsed.modalitaBambino === undefined) {
        parsed.modalitaBambino = false;
      }
      if (parsed.timerNannaMinutes === undefined) {
        parsed.timerNannaMinutes = 0;
      }
      setSettings(parsed);
    }

    // 4. Premium status
    const savedPremium = localStorage.getItem("favole_magiche_premium");
    if (savedPremium) {
      setIsPremium(JSON.parse(savedPremium));
    }

    // 5. Generation limits counter
    const todayStr = new Date().toISOString().split("T")[0];
    const savedGenDate = localStorage.getItem("favole_magiche_gen_date") || "";
    const savedGenCount = localStorage.getItem("favole_magiche_gen_count") || "0";

    if (savedGenDate === todayStr) {
      setLastGenDate(todayStr);
      setGeneratedToday(parseInt(savedGenCount));
    } else {
      setLastGenDate(todayStr);
      setGeneratedToday(0);
      localStorage.setItem("favole_magiche_gen_date", todayStr);
      localStorage.setItem("favole_magiche_gen_count", "0");
    }
  }, []);

  // Load child-specific state whenever the active child profile changes
  useEffect(() => {
    const profileId = activeProfile?.id;
    
    // 1. Stories
    const storiesKey = profileId ? `favole_magiche_stories_${profileId}` : "favole_magiche_stories";
    const savedStories = localStorage.getItem(storiesKey);
    let loadedStories: Story[] = [];
    if (savedStories) {
      try {
        loadedStories = JSON.parse(savedStories);
      } catch (e) {
        console.error("Error parsing stories", e);
      }
      setStories(loadedStories);
    } else {
      // New children should start with an empty library (everything empty!).
      // But for Celeste (p1) we keep the seeded INITIAL_STORY so they can try it instantly.
      if (profileId && profileId !== "p1") {
        setStories([]);
        loadedStories = [];
      } else {
        loadedStories = [INITIAL_STORY];
        setStories(loadedStories);
      }
    }

    const createdCount = loadedStories.length;
    const totalReadCount = loadedStories.reduce((sum, s) => sum + (s.volteLetta || 0), 0);

    // 2. Unlocked Categories
    const categoriesKey = profileId ? `favole_magiche_unlocked_categories_${profileId}` : "favole_magiche_unlocked_categories";
    const savedUnlockedCategories = localStorage.getItem(categoriesKey);
    setUnlockedCategories(savedUnlockedCategories ? JSON.parse(savedUnlockedCategories) : INITIAL_CATEGORIES);

    // 3. Unlocked Themes
    const themesKey = profileId ? `favole_magiche_unlocked_themes_${profileId}` : "favole_magiche_unlocked_themes";
    const savedUnlockedThemes = localStorage.getItem(themesKey);
    setUnlockedThemes(savedUnlockedThemes ? JSON.parse(savedUnlockedThemes) : INITIAL_THEMES);

    // 4. Unlocked Character Types
    const charTypesKey = profileId ? `favole_magiche_unlocked_character_types_${profileId}` : "favole_magiche_unlocked_character_types";
    const savedUnlockedCharacterTypes = localStorage.getItem(charTypesKey);
    setUnlockedCharacterTypes(savedUnlockedCharacterTypes ? JSON.parse(savedUnlockedCharacterTypes) : INITIAL_CHARACTER_TYPES);

    // 5. Unlocked Character Traits
    const charTraitsKey = profileId ? `favole_magiche_unlocked_character_traits_${profileId}` : "favole_magiche_unlocked_character_traits";
    const savedUnlockedCharacterTraits = localStorage.getItem(charTraitsKey);
    setUnlockedCharacterTraits(savedUnlockedCharacterTraits ? JSON.parse(savedUnlockedCharacterTraits) : INITIAL_CHARACTER_TRAITS);

    // 6. Last Unlock Date
    const lastUnlockKey = profileId ? `favole_magiche_last_unlock_date_${profileId}` : "favole_magiche_last_unlock_date";
    setLastUnlockDate(localStorage.getItem(lastUnlockKey) || "");

    // 7. Claimed Achievements
    const achievementsKey = profileId ? `favole_magiche_claimed_achievements_${profileId}` : "favole_magiche_claimed_achievements";
    const savedClaimed = localStorage.getItem(achievementsKey);
    const parsedClaimed: string[] = savedClaimed ? JSON.parse(savedClaimed) : [];
    
    // Filter out any claimed stage achievement IDs that aren't actually completed
    const validClaimed = parsedClaimed.filter((id: string) => {
      if (id.startsWith("stage_")) {
        const index = parseInt(id.replace("stage_", ""));
        if (!isNaN(index)) {
          const stage = generateStage(index);
          const current = createdCount;
          return current >= stage.targetCount;
        }
      }
      return true;
    });

    // If there were invalid claims, sync them back to localStorage immediately
    if (validClaimed.length !== parsedClaimed.length) {
      localStorage.setItem(achievementsKey, JSON.stringify(validClaimed));
    }
    setClaimedAchievements(validClaimed);

    // 8. Used Unlocked Items
    const usedKey = profileId ? `favole_magiche_used_unlocked_items_${profileId}` : "favole_magiche_used_unlocked_items";
    const savedUsedUnlocked = localStorage.getItem(usedKey);
    setUsedUnlockedItems(savedUsedUnlocked ? JSON.parse(savedUsedUnlocked) : []);
  }, [activeProfile?.id]);

  // Unlock exactly one single random locked element from any category
  const handleUnlockSingle = () => {
    const lockedCategories = CATEGORIES.filter(c => !unlockedCategories.includes(c));
    const lockedThemes = EDUCATIONAL_THEMES.filter(t => !unlockedThemes.includes(t));
    const lockedTypes = CHARACTER_TYPES.filter(t => !unlockedCharacterTypes.includes(t));
    const lockedTraits = CHARACTER_TRAITS.filter(tr => !unlockedCharacterTraits.includes(tr));
    
    const pools: { type: "category" | "theme" | "characterType" | "characterTrait"; list: string[] }[] = [];
    if (lockedCategories.length > 0) pools.push({ type: "category", list: lockedCategories });
    if (lockedThemes.length > 0) pools.push({ type: "theme", list: lockedThemes });
    if (lockedTypes.length > 0) pools.push({ type: "characterType", list: lockedTypes });
    if (lockedTraits.length > 0) pools.push({ type: "characterTrait", list: lockedTraits });
    
    if (pools.length === 0) {
      return null;
    }
    
    const randomPool = pools[Math.floor(Math.random() * pools.length)];
    const randomItem = randomPool.list[Math.floor(Math.random() * randomPool.list.length)];
    
    let result = { category: "", theme: "", characterType: "", characterTrait: "" };
    const pId = activeProfile?.id;
    
    if (randomPool.type === "category") {
      const updated = [...unlockedCategories, randomItem];
      setUnlockedCategories(updated);
      const key = pId ? `favole_magiche_unlocked_categories_${pId}` : "favole_magiche_unlocked_categories";
      localStorage.setItem(key, JSON.stringify(updated));
      result.category = randomItem;
    } else if (randomPool.type === "theme") {
      const updated = [...unlockedThemes, randomItem];
      setUnlockedThemes(updated);
      const key = pId ? `favole_magiche_unlocked_themes_${pId}` : "favole_magiche_unlocked_themes";
      localStorage.setItem(key, JSON.stringify(updated));
      result.theme = randomItem;
    } else if (randomPool.type === "characterType") {
      const updated = [...unlockedCharacterTypes, randomItem];
      setUnlockedCharacterTypes(updated);
      const key = pId ? `favole_magiche_unlocked_character_types_${pId}` : "favole_magiche_unlocked_character_types";
      localStorage.setItem(key, JSON.stringify(updated));
      result.characterType = randomItem;
    } else if (randomPool.type === "characterTrait") {
      const updated = [...unlockedCharacterTraits, randomItem];
      setUnlockedCharacterTraits(updated);
      const key = pId ? `favole_magiche_unlocked_character_traits_${pId}` : "favole_magiche_unlocked_character_traits";
      localStorage.setItem(key, JSON.stringify(updated));
      result.characterTrait = randomItem;
    }
    
    return result;
  };

  // Daily unlocking trigger
  const handleUnlockNext = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const unlocked = handleUnlockSingle();
    if (unlocked) {
      setLastUnlockDate(todayStr);
      const pId = activeProfile?.id;
      const key = pId ? `favole_magiche_last_unlock_date_${pId}` : "favole_magiche_last_unlock_date";
      localStorage.setItem(key, todayStr);
      playFairyChorusSound();
    }
    return unlocked;
  };

  // Claim achievement reward trigger
  const handleClaimAchievement = (id: string) => {
    const unlocked = handleUnlockSingle();
    if (!claimedAchievements.includes(id)) {
      const updated = [...claimedAchievements, id];
      setClaimedAchievements(updated);
      const pId = activeProfile?.id;
      const key = pId ? `favole_magiche_claimed_achievements_${pId}` : "favole_magiche_claimed_achievements";
      localStorage.setItem(key, JSON.stringify(updated));
    }

    playFairyChorusSound();

    const rewards = mapUnlockedToRewards(unlocked);
    setAchievementRewardsOpened(prev => ({ ...prev, [id]: rewards }));

    const stageIndex = parseInt(id.replace("stage_", ""));
    if (!isNaN(stageIndex) && stageIndex % 5 === 0) {
      // Firework effect for world completion
      import("canvas-confetti").then((confetti) => {
        const duration = 4000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 35, spread: 360, ticks: 70, zIndex: 1000 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) return clearInterval(interval);

          const particleCount = 60 * (timeLeft / duration);
          confetti.default(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
          confetti.default(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
      });
    }

    return unlocked;
  };

  const handleMarkItemAsUsed = (item: string) => {
    if (!usedUnlockedItems.includes(item)) {
      const updated = [...usedUnlockedItems, item];
      setUsedUnlockedItems(updated);
      const pId = activeProfile?.id;
      const key = pId ? `favole_magiche_used_unlocked_items_${pId}` : "favole_magiche_used_unlocked_items";
      localStorage.setItem(key, JSON.stringify(updated));
    }
  };

  // Global background music manager with interaction gesture guard
  useEffect(() => {
    const shouldPlay = settings.musicaSottofondo && screen !== "reader" && screen !== "generating";
    
    if (shouldPlay) {
      audioEngine.startBackgroundMusic();
    } else if (screen !== "reader") {
      audioEngine.stopBackgroundMusic();
    }

    const startOnGesture = () => {
      if (settings.musicaSottofondo && screen !== "reader" && screen !== "generating") {
        audioEngine.startBackgroundMusic();
      }
      document.removeEventListener("click", startOnGesture);
      document.removeEventListener("touchstart", startOnGesture);
    };

    document.addEventListener("click", startOnGesture);
    document.addEventListener("touchstart", startOnGesture);

    return () => {
      document.removeEventListener("click", startOnGesture);
      document.removeEventListener("touchstart", startOnGesture);
    };
  }, [settings.musicaSottofondo, screen]);

  // Sleep Timer (Timer della Nanna) Countdown Effect
  useEffect(() => {
    if (timerNannaRemainingSeconds === null) return;
    if (timerNannaRemainingSeconds <= 0) {
      // Trigger Bedtime / Deep sleep state!
      setIsNannaTriggered(true);
      setTimerNannaRemainingSeconds(null);
      // Stop speech
      try {
        if (typeof window !== "undefined" && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      } catch (e) {
        console.error("Error stopping SpeechSynthesis:", e);
      }
      // Stop background music
      audioEngine.stopBackgroundMusic();
      return;
    }

    const interval = setInterval(() => {
      setTimerNannaRemainingSeconds(prev => (prev !== null && prev > 0) ? prev - 1 : null);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerNannaRemainingSeconds]);

  // Sync sleep timer when a story starts reading
  useEffect(() => {
    if (screen === "reader" && settings.timerNannaMinutes > 0 && !isNannaTriggered) {
      setTimerNannaRemainingSeconds(settings.timerNannaMinutes * 60);
    } else if (screen !== "reader") {
      // Reset timer if we leave the reader
      setTimerNannaRemainingSeconds(null);
    }
  }, [screen, settings.timerNannaMinutes, isNannaTriggered]);

  // Update localStorage helper
  const saveStories = (updatedStories: Story[]) => {
    setStories(updatedStories);
    const profileId = activeProfile?.id;
    const storiesKey = profileId ? `favole_magiche_stories_${profileId}` : "favole_magiche_stories";
    localStorage.setItem(storiesKey, JSON.stringify(updatedStories));
  };

  // Profile Management Action Handlers
  const handleSelectProfile = (profile: ChildProfile | null) => {
    setActiveProfile(profile);
    if (profile) {
      localStorage.setItem("favole_magiche_active_profile", JSON.stringify(profile));
    } else {
      localStorage.removeItem("favole_magiche_active_profile");
    }
  };

  const handleAddProfile = (nome: string, annoNascita: number, temaVisivo: string) => {
    const newProfile: ChildProfile = {
      id: "p_" + Date.now(),
      nome,
      annoNascita,
      temaVisivo
    };
    const updated = [...profiles, newProfile];
    setProfiles(updated);
    localStorage.setItem("favole_magiche_profiles", JSON.stringify(updated));
    // Auto set active if none was active
    if (!activeProfile) {
      handleSelectProfile(newProfile);
    }
  };

  const handleDeleteProfile = (id: string) => {
    // 1. Move to deleted profiles backups (max 1 month)
    const profileToBackup = profiles.find(p => p.id === id);
    if (profileToBackup) {
      const newBackup: DeletedProfile = {
        profile: profileToBackup,
        deletedAt: new Date().toISOString()
      };
      const updatedBackups = [newBackup, ...deletedProfiles];
      setDeletedProfiles(updatedBackups);
      localStorage.setItem("favole_magiche_deleted_profiles", JSON.stringify(updatedBackups));
    }

    // 2. Remove from active profiles list
    const updated = profiles.filter(p => p.id !== id);
    setProfiles(updated);
    localStorage.setItem("favole_magiche_profiles", JSON.stringify(updated));
    
    if (activeProfile?.id === id) {
      const nextActive = updated.length > 0 ? updated[0] : null;
      setActiveProfile(nextActive);
      if (nextActive) {
        localStorage.setItem("favole_magiche_active_profile", JSON.stringify(nextActive));
      } else {
        localStorage.removeItem("favole_magiche_active_profile");
      }
    }
  };

  const handleRestoreProfile = (id: string) => {
    const backupItem = deletedProfiles.find(dp => dp.profile.id === id);
    if (backupItem) {
      const updatedProfiles = [...profiles, backupItem.profile];
      setProfiles(updatedProfiles);
      localStorage.setItem("favole_magiche_profiles", JSON.stringify(updatedProfiles));

      const updatedBackups = deletedProfiles.filter(dp => dp.profile.id !== id);
      setDeletedProfiles(updatedBackups);
      localStorage.setItem("favole_magiche_deleted_profiles", JSON.stringify(updatedBackups));

      if (!activeProfile) {
        handleSelectProfile(backupItem.profile);
      }
    }
  };

  const handlePermanentlyDeleteProfile = (id: string) => {
    const updatedBackups = deletedProfiles.filter(dp => dp.profile.id !== id);
    setDeletedProfiles(updatedBackups);
    localStorage.setItem("favole_magiche_deleted_profiles", JSON.stringify(updatedBackups));
  };

  // Toggle Premium simulated state
  const handleTogglePremium = () => {
    const nextPremium = !isPremium;
    setIsPremium(nextPremium);
    localStorage.setItem("favole_magiche_premium", JSON.stringify(nextPremium));
  };

  // Save Settings helper
  const handleUpdateSettings = (updated: Partial<AppSettings>) => {
    const nextSettings = { ...settings, ...updated };
    setSettings(nextSettings);
    localStorage.setItem("favole_magiche_settings", JSON.stringify(nextSettings));
  };

  // Clear archive trigger
  const handleClearArchive = () => {
    saveStories([]);
  };

  // Toggle single story favorite star
  const handleToggleFavorite = (storyId: string) => {
    const updated = stories.map(s => s.id === storyId ? { ...s, preferita: !s.preferita } : s);
    saveStories(updated);
    // Sync current selected reader view in real-time
    if (selectedStory?.id === storyId) {
      setSelectedStory({ ...selectedStory, preferita: !selectedStory.preferita });
    }
  };

  const handleDeleteStory = (storyId: string) => {
    const storyToBackup = stories.find(s => s.id === storyId);
    if (storyToBackup) {
      const newBackup: DeletedStory = {
        story: storyToBackup,
        deletedAt: new Date().toISOString()
      };
      const updatedBackups = [newBackup, ...deletedStories];
      setDeletedStories(updatedBackups);
      localStorage.setItem("favole_magiche_deleted_stories", JSON.stringify(updatedBackups));
    }

    const updated = stories.filter(s => s.id !== storyId);
    saveStories(updated);
  };

  const handleRestoreStory = (storyId: string) => {
    const backupItem = deletedStories.find(ds => ds.story.id === storyId);
    if (backupItem) {
      const updatedStories = [...stories, backupItem.story];
      saveStories(updatedStories);

      const updatedBackups = deletedStories.filter(ds => ds.story.id !== storyId);
      setDeletedStories(updatedBackups);
      localStorage.setItem("favole_magiche_deleted_stories", JSON.stringify(updatedBackups));
    }
  };

  const handlePermanentlyDeleteStory = (storyId: string) => {
    const updatedBackups = deletedStories.filter(ds => ds.story.id !== storyId);
    setDeletedStories(updatedBackups);
    localStorage.setItem("favole_magiche_deleted_stories", JSON.stringify(updatedBackups));
  };

  // STORAGE LIMIT MANAGER - Auto prune oldest story if threshold exceeded
  const runStoragePruningIfNeeded = (currentStories: Story[]) => {
    if (!settings.eliminaInAutomatico) return currentStories;

    const simulatedSizePerStory = 18.5; // MB
    let thresholdMB = 500;
    if (settings.sogliaSpazio === "1 GB") thresholdMB = 1000;
    if (settings.sogliaSpazio === "2 GB") thresholdMB = 2000;
    if (settings.sogliaSpazio === "Illimitato") return currentStories; // unlimited

    let workingStories = [...currentStories];
    let totalMB = workingStories.length * simulatedSizePerStory;

    while (totalMB > thresholdMB && workingStories.length > 0) {
      // Find oldest story (first added, sorted by date/id index, since we push new ones to end of list or they have old dates)
      // If conservaPreferite is enabled, we skip favorites if possible
      let oldestIndex = -1;
      
      if (settings.conservaPreferite) {
        // Try finding oldest non-favorite story first
        oldestIndex = workingStories.findIndex(s => !s.preferita);
      }

      // If we didn't find a non-favorite story, or we don't preserve favorites, just delete the oldest (index 0)
      if (oldestIndex === -1) {
        if (settings.conservaPreferite && workingStories.every(s => s.preferita)) {
          // All are favorites and user chose to keep favorites, break to avoid infinite loop
          break;
        }
        oldestIndex = 0;
      }

      workingStories.splice(oldestIndex, 1);
      totalMB = workingStories.length * simulatedSizePerStory;
    }

    return workingStories;
  };

  // Active generation states (client-side)
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJobProgress, setActiveJobProgress] = useState<number>(0);
  const [activeJobStep, setActiveJobStep] = useState<string>("");
  const generationSessionRef = useRef<{ id: string; cancelled: boolean } | null>(null);

  // Cancel active generation
  const handleCancelGeneration = () => {
    if (!activeJobId) return;
    if (generationSessionRef.current) {
      generationSessionRef.current.cancelled = true;
    }
    setActiveJobId(null);
    setActiveJobProgress(0);
    setActiveJobStep("");
    setScreen("new-story");
  };

  // Story Creation API Call orchestrator
  const handleGenerateStory = async (config: StoryGenerationConfig, forceBedtime?: boolean) => {
    const activeBedtime = forceBedtime !== undefined ? forceBedtime : isBedtimeMode;
    setIsBedtimeMode(activeBedtime);

    // Save choices as default for future generations
    localStorage.setItem("favole_magiche_last_categoria", config.categoria);
    localStorage.setItem("favole_magiche_last_temaEducativo", config.temaEducativo);
    localStorage.setItem("favole_magiche_last_durata", config.durata);

    setCurrentGenerationConfig({
      categoria: config.categoria,
      temaEducativo: config.temaEducativo
    });

    const localJobId = `local_${Date.now()}`;
    generationSessionRef.current = { id: localJobId, cancelled: false };
    setActiveJobId(localJobId);
    setActiveJobProgress(5);
    setActiveJobStep("Inizializzazione dell'incantesimo...");
    setScreen("generating");

    try {
      const generatedData = await generateStoryClient(
        {
          ...config,
          isBedtimeMode: activeBedtime
        },
        {
          onProgress: (progress, step) => {
            if (generationSessionRef.current?.id !== localJobId || generationSessionRef.current?.cancelled) {
              return;
            }
            setActiveJobProgress(progress);
            setActiveJobStep(step);
          },
          isCancelled: () => generationSessionRef.current?.id !== localJobId || generationSessionRef.current?.cancelled === true
        }
      );

      if (generationSessionRef.current?.id !== localJobId || generationSessionRef.current?.cancelled) {
        return;
      }

      const statusUpdate: GeminiRuntimeStatus = generatedData.generationSource === "gemini"
        ? {
            state: "ok",
            message: "Generazione AI attiva",
            model: generatedData.usedModel,
            updatedAt: new Date().toISOString()
          }
        : {
            state: "fallback",
            message: generatedData.fallbackReason || "Piano di riserva attivato",
            updatedAt: new Date().toISOString()
          };
      setGeminiRuntimeStatus(statusUpdate);
      localStorage.setItem("favole_magiche_gemini_runtime_status", JSON.stringify(statusUpdate));

      const newStory: Story = {
        id: "s_" + Date.now(),
        titolo: (config.chapter && config.chapter > 1 && config.parentStoryTitle)
          ? `${config.parentStoryTitle} - Capitolo ${config.chapter}`
          : generatedData.titolo,
        pagine: generatedData.pagine,
        morale: generatedData.morale,
        data: new Date().toISOString(),
        dataCreazione: new Date().toISOString(),
        ultimaLettura: "",
        durata: config.durata,
        categoria: config.categoria,
        temaEducativo: config.temaEducativo,
        preferita: false,
        coverTheme: generatedData.coverTheme || "star",
        coverColor: generatedData.coverColor || "pastel-blue",
        copertinaDescrizione: generatedData.copertinaDescrizione || "Un disegno magico.",
        profiloId: activeProfile?.id,
        isOffline: !!generatedData.isOffline,
        volteLetta: 0,
        isBedtimeMode: activeBedtime,
        seriesId: config.seriesId,
        chapter: config.chapter || 1,
        personaggi: config.personaggi
      };

      setActiveJobProgress(100);
      setActiveJobStep("La favola magica e pronta! ✨");

      let updatedStoriesList = [...stories, newStory];
      updatedStoriesList = runStoragePruningIfNeeded(updatedStoriesList);

      saveStories(updatedStoriesList);
      setSelectedStory(newStory);

      const todayStr = new Date().toISOString().split("T")[0];
      const nextCount = generatedToday + 1;
      setGeneratedToday(nextCount);
      localStorage.setItem("favole_magiche_gen_count", String(nextCount));
      localStorage.setItem("favole_magiche_gen_date", todayStr);

      // Achievement solo su completamento tappe/mondi, basati su numero storie create
      const previousStoriesCount = stories.length;
      const newStoriesCount = updatedStoriesList.length;
      const milestonesReached = checkMilestonesReached(previousStoriesCount, newStoriesCount);
      if (milestonesReached.length > 0) {
        setAchievementReturnTarget("app");
        setAchievementModal(milestonesReached[0]);
        if (milestonesReached.length > 1) {
          setAchievementQueue(prev => [...prev, ...milestonesReached.slice(1)]);
        }
      }

      setReaderBackTarget("home");
      setScreen("reader");

      if (generatedData.generationSource === "fallback") {
        alert(`La storia e stata creata con il piano di riserva.\nMotivo: ${generatedData.fallbackReason || "Gemini non disponibile"}`);
      }
    } catch (err) {
      if ((err as Error).message === "GENERATION_CANCELLED") {
        return;
      }
      console.error("API error during initiate:", err);

      const errorMsg = (err as Error)?.message || "Errore sconosciuto";

      let title = "Errore nella Generazione";
      let message = "Si è verificato un errore durante la creazione della storia.";
      let reason = errorMsg;

      if (errorMsg.includes("Nessun modello Gemini disponibile")) {
        title = "Nessun Modello Disponibile";
        message = "Non è possibile generare la storia con l'IA al momento.";
        reason = "Nessun modello Gemini ha quota disponibile. Aspetta che la quota si rinnovi (solitamente ogni 24h) oppure abilita la fatturazione nel progetto Google AI.";
      }

      setGenerationError({ title, message, reason });

      const statusUpdate: GeminiRuntimeStatus = {
        state: "fallback",
        message: "Errore durante la chiamata Gemini",
        updatedAt: new Date().toISOString()
      };
      setGeminiRuntimeStatus(statusUpdate);
      localStorage.setItem("favole_magiche_gemini_runtime_status", JSON.stringify(statusUpdate));
      setScreen("new-story");
    } finally {
      if (generationSessionRef.current?.id === localJobId) {
        generationSessionRef.current = null;
      }
      setActiveJobId(null);
    }
  };

  // Continue story handler
  const handleContinueStory = async (parentStory: Story) => {
    const profile = profiles.find(p => p.id === parentStory.profiloId) || activeProfile;
    const nomeBambino = profile?.nome || "Piccolo lettore";
    const etaBambino = profile ? (new Date().getFullYear() - profile.annoNascita) : 5;

    const config = {
      categoria: parentStory.categoria,
      temaEducativo: parentStory.temaEducativo,
      durata: parentStory.durata,
      personaggi: [],
      nomeBambino,
      etaBambino,
      parentStoryTitle: parentStory.titolo,
      parentStoryPagine: parentStory.pagine,
      parentStoryMorale: parentStory.morale,
      seriesId: parentStory.seriesId || parentStory.id,
      chapter: (parentStory.chapter || 1) + 1,
      isBedtimeMode: parentStory.isBedtimeMode
    };

    setContinueStoryConfirmConfig(config);
  };

  const handleStoryReadCompleted = (storyId: string) => {
    const todayStr = new Date().toISOString();
    const updated = stories.map(s => {
      if (s.id === storyId) {
        const currentCount = s.volteLetta || 0;
        return { ...s, ultimaLettura: todayStr, volteLetta: currentCount + 1 };
      }
      return s;
    });
    saveStories(updated);
    
    // Also update selectedStory state immediately so the Reader view updates its display
    if (selectedStory && selectedStory.id === storyId) {
      setSelectedStory(prev => prev ? { ...prev, ultimaLettura: todayStr, volteLetta: (prev.volteLetta || 0) + 1 } : null);
    }
  };

  // Developer Mode Test Functions
  const handleTestStageAchievement = (stageIndex: number) => {
    setIsDeveloperMode(false);
    setAchievementReturnTarget("developer");
    const achievements = checkMilestonesReached(stageIndex * 5 - 1, stageIndex * 5);
    console.log(`🧪 Stage ${stageIndex} achievement:`, achievements);
    if (achievements.length > 0) {
      setAchievementModal(achievements[0]);
      if (achievements.length > 1) {
        setAchievementQueue(prev => [...prev, ...achievements.slice(1)]);
      }
    }
  };

  const handleTestWorldAchievement = (worldIndex: number) => {
    setIsDeveloperMode(false);
    setAchievementReturnTarget("developer");
    const worldCompletionCount = worldIndex * 25;
    const achievements = checkMilestonesReached(worldCompletionCount - 1, worldCompletionCount);
    console.log(`🧪 World ${worldIndex} achievement:`, achievements);
    if (achievements.length > 0) {
      setAchievementModal(achievements[achievements.length - 1]); // Show world completion
      if (achievements.length > 1) {
        setAchievementQueue(prev => [...prev, ...achievements.slice(0, -1)]);
      }
    }
  };

  const handleOpenAchievementModalById = (id: string) => {
    const achievement = getAchievementById(id);
    if (!achievement) return;

    setAchievementReturnTarget("app");

    setAchievementRewardsOpened(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    const queue: Achievement[] = [];
    const stageIndex = parseInt(id.replace("stage_", ""), 10);
    if (!Number.isNaN(stageIndex) && stageIndex % 5 === 0) {
      const worldAchievement = getAchievementById(`world_${Math.ceil(stageIndex / 5)}_complete`);
      if (worldAchievement) {
        queue.push(worldAchievement);
      }
    }

    setAchievementModal(achievement);
    setAchievementQueue(queue);
  };

  const geminiKeyStatus = getGeminiApiKeyStatus();
  const showGeminiBanner = import.meta.env.DEV && geminiKeyStatus !== "loaded";

  return (
    <>
      {showGeminiBanner && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
          background: "#f59e0b", color: "#1c1917", padding: "8px 16px",
          fontSize: "13px", fontWeight: 600, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
        }}>
          {geminiKeyStatus === "missing" && (
            <>
              VITE_GEMINI_API_KEY mancante: la generazione AI usa il piano di riserva. Crea il file <code style={{ background: "rgba(0,0,0,0.15)", borderRadius: 4, padding: "1px 5px" }}>.env</code> e segui <strong>CONTRIBUTING.md</strong>.
            </>
          )}
          {geminiKeyStatus === "placeholder" && (
            <>
              VITE_GEMINI_API_KEY sembra un placeholder: la generazione AI usera il piano di riserva. Inserisci una chiave reale nel file <code style={{ background: "rgba(0,0,0,0.15)", borderRadius: 4, padding: "1px 5px" }}>.env</code>.
            </>
          )}
        </div>
      )}
    <PhoneMockup
      generatedToday={generatedToday}
      settings={settings}
      onUpdateSettings={handleUpdateSettings}
      temaVisivo={activeProfile?.temaVisivo || "🌸 Giardino delle Fate"}
    >
      {screen === "home" && (
        <HomeView
          settings={settings}
          onDisableKidsMode={() => {
            setPendingGateAction({ type: "disable_kids_mode" });
          }}
          onNavigate={(scr) => {
            if (settings.modalitaBambino && (scr === "new-story" || scr === "settings" || scr === "profiles")) {
              setPendingGateAction({ type: "navigate", target: scr });
              return;
            }
            if (scr === "new-story") {
              setIsBedtimeMode(false);
            }
            if (scr === "settings") {
              if (settings.pinAccesso && settings.pinAccesso.trim() !== "") {
                setPendingPinAction("settings");
              } else {
                setScreen("settings");
              }
            } else {
              setScreen(scr);
            }
          }}
          onStartBedtimeStory={() => {
            if (settings.modalitaBambino) {
              setPendingGateAction({ type: "bedtime" });
              return;
            }
            const targetCat = unlockedCategories.includes("Natura") ? "Natura" : (unlockedCategories[0] || "Fantasy");
            const targetTema = unlockedThemes.includes("Gentilezza") 
              ? "Gentilezza" 
              : (unlockedThemes.includes("Pazienza") 
                  ? "Pazienza" 
                  : (unlockedThemes.includes("Gratitudine") ? "Gratitudine" : (unlockedThemes[0] || "Gentilezza")));
            
            const characterType = unlockedCharacterTypes.includes("Cucciolo") ? "Cucciolo" : (unlockedCharacterTypes[0] || "Cucciolo");
            const characterTrait = unlockedCharacterTraits.includes("Gentile") ? "Gentile" : (unlockedCharacterTraits[0] || "Sensibile");

            const profile = activeProfile;
            const nomeBambino = profile?.nome || "Piccolo lettore";
            const etaBambino = profile ? (new Date().getFullYear() - profile.annoNascita) : 5;

            const config = {
              categoria: targetCat,
              temaEducativo: targetTema,
              durata: "Breve" as const,
              personaggi: [{ nome: "Nuvola", tipo: characterType, caratteristica: characterTrait }],
              nomeBambino,
              etaBambino
            };

            setBedtimeConfirmConfig(config);
          }}
          activeProfile={activeProfile}
          profiles={profiles}
          generatedToday={generatedToday}
          unlockedCategories={unlockedCategories}
          unlockedThemes={unlockedThemes}
          unlockedCharacterTypes={unlockedCharacterTypes}
          unlockedCharacterTraits={unlockedCharacterTraits}
          lastUnlockDate={lastUnlockDate}
          onUnlock={handleUnlockNext}
          isGenerating={!!activeJobId}
          stories={stories}
          claimedAchievements={claimedAchievements}
          onClaimAchievement={handleOpenAchievementModalById}
        />
      )}

      {screen === "profiles" && (
        <ProfilesView
          profiles={profiles}
          activeProfile={activeProfile}
          onSelectProfile={(profile) => {
            handleSelectProfile(profile);
            setScreen("home");
          }}
          onAddProfile={handleAddProfile}
          onDeleteProfile={handleDeleteProfile}
          deletedProfiles={deletedProfiles}
          onRestoreProfile={handleRestoreProfile}
          onPermanentlyDeleteProfile={handlePermanentlyDeleteProfile}
          onBack={() => setScreen("home")}
        />
      )}

      {screen === "new-story" && (
        <NewStoryView
          activeProfile={activeProfile}
          profiles={profiles}
          stories={stories}
          isPremium={false}
          generatedToday={generatedToday}
          unlockedCategories={unlockedCategories}
          unlockedThemes={unlockedThemes}
          unlockedCharacterTypes={unlockedCharacterTypes}
          unlockedCharacterTraits={unlockedCharacterTraits}
          isBedtimeMode={isBedtimeMode}
          onToggleBedtimeMode={setIsBedtimeMode}
          onGenerate={handleGenerateStory}
          onBack={() => setScreen("home")}
          onNavigate={setScreen}
          onSelectProfile={handleSelectProfile}
          usedUnlockedItems={usedUnlockedItems}
          onMarkItemAsUsed={handleMarkItemAsUsed}
        />
      )}

      {screen === "generating" && (
        <GenerationView
          categoria={currentGenerationConfig.categoria}
          temaEducativo={currentGenerationConfig.temaEducativo}
          progress={activeJobProgress}
          step={activeJobStep}
          onCancel={handleCancelGeneration}
          onNavigateHome={() => setScreen("home")}
        />
      )}

      {screen === "reader" && selectedStory && (
        <StoryReaderView
          story={selectedStory}
          isPremium={false}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onToggleFavorite={handleToggleFavorite}
          activeProfile={activeProfile}
          onBack={() => setScreen(readerBackTarget)}
          onContinueStory={handleContinueStory}
          onStoryReadCompleted={handleStoryReadCompleted}
        />
      )}

      {screen === "archive" && (
        <ArchiveView
          stories={stories}
          onSelectStory={(story) => {
            const todayStr = new Date().toISOString();
            // Just update last read date but don't increment reading count here
            const updated = stories.map(s => {
              if (s.id === story.id) {
                return { ...s, ultimaLettura: todayStr };
              }
              return s;
            });
            saveStories(updated);
            setSelectedStory({ ...story, ultimaLettura: todayStr });
            setReaderBackTarget("archive");
            setScreen("reader");
          }}
          onDeleteStory={handleDeleteStory}
          deletedStories={deletedStories}
          onRestoreStory={handleRestoreStory}
          onPermanentlyDeleteStory={(id) => {
            if (settings.pinAccesso && settings.pinAccesso.trim() !== "") {
              setPendingPinAction({ type: "delete_story", id });
            } else {
              handlePermanentlyDeleteStory(id);
            }
          }}
          onBack={() => setScreen("home")}
        />
      )}

      {screen === "settings" && (
        <SettingsView
          settings={settings}
          storiesCount={stories.length}
          geminiRuntimeStatus={geminiRuntimeStatus}
          onUpdateSettings={handleUpdateSettings}
          onClearArchive={handleClearArchive}
          onBack={() => setScreen("home")}
          onOpenDeveloperMode={() => setShowDeveloperPinModal(true)}
        />
      )}

      {screen === "albero" && (
        <GrowthTree
          stories={stories}
          onBack={() => setScreen("home")}
        />
      )}

      {/* Floating background generation indicator */}
      {activeJobId && screen !== "generating" && (
        <motion.div
          drag
          dragConstraints={{ left: -15, right: 15, top: -450, bottom: 40 }}
          dragElastic={0.1}
          dragMomentum={false}
          className="absolute bottom-16 left-4 right-4 bg-white/95 border-3 border-pink-100 rounded-2xl pt-4 pb-3 px-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md z-50 flex items-center justify-between gap-3 cursor-grab active:cursor-grabbing select-none"
        >
          {/* Handle bar to show it is draggable */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-pink-200 rounded-full"></div>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative w-8 h-8 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center shrink-0">
              <span className="text-base animate-pulse">✨</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-extrabold text-pink-700 leading-tight">Favola in background...</p>
              <p className="text-[9px] font-medium text-slate-600 truncate leading-tight mt-0.5">{activeJobStep || "Creando magia..."}</p>
              {/* Mini progress bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                <div style={{ width: `${activeJobProgress}%` }} className="bg-gradient-to-r from-pink-400 to-rose-400 h-full rounded-full transition-all duration-300"></div>
              </div>
            </div>
            <div className="text-[10px] font-black text-rose-500 shrink-0 font-mono ml-1">{activeJobProgress}%</div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setScreen("generating")}
              className="py-1 px-2.5 bg-pink-50 hover:bg-pink-100 active:scale-95 text-pink-600 text-[9px] font-black rounded-lg transition-all cursor-pointer"
            >
              Apri
            </button>
            <button
              onClick={handleCancelGeneration}
              className="py-1 px-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-500 text-[9px] font-black rounded-lg transition-all cursor-pointer"
              title="Annulla generazione"
            >
              Stoppa
            </button>
          </div>
        </motion.div>
      )}
      {/* Bedtime Story Confirmation Dialog */}
      {bedtimeConfirmConfig && (
        <div className="fixed inset-0 bg-indigo-950/80 backdrop-blur-md flex items-center justify-center p-5 z-50 animate-fade-in">
          <div className="bg-gradient-to-b from-[#1A237E] to-[#12185C] rounded-[2.5rem] border-4 border-indigo-300 p-6 max-w-sm w-full text-center space-y-4 shadow-[0_0_25px_rgba(63,81,181,0.4)] text-indigo-100 transform scale-100 transition-all relative">
            <button
              onClick={() => { playClickSound(); setBedtimeConfirmConfig(null); }}
              className="absolute top-4 right-4 text-indigo-300 hover:text-white font-bold text-sm bg-indigo-900/60 hover:bg-indigo-800 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer border border-indigo-500/30"
            >
              ✕
            </button>

            <div className="text-5xl animate-pulse py-1 select-none">🌙✨🔮</div>

            <div className="space-y-1.5">
              <span className="text-[9px] bg-indigo-900/60 border border-indigo-500 text-indigo-200 font-black px-3 py-0.5 rounded-full uppercase tracking-widest">
                Richiesta Conferma
              </span>
              <h4 className="font-extrabold text-base text-amber-200 font-serif italic pt-1 leading-tight">
                Favola della Buonanotte
              </h4>
              <p className="text-[10px] text-indigo-200 leading-relaxed font-bold px-1.5">
                Sei pronto a creare una dolce fiaba della nanna? Ecco le magiche scelte pronte per essere trasformate in racconto:
              </p>
            </div>

            <div className="bg-indigo-900/40 p-4 rounded-2xl border border-indigo-800 text-left space-y-2.5 text-[10px] font-bold text-indigo-200">
              <div className="flex items-center gap-2">
                <span className="text-lg">👦</span>
                <div>
                  <span className="text-indigo-400 font-extrabold block text-[8px] uppercase tracking-wider leading-none">Bambino</span>
                  <span className="text-white">{bedtimeConfirmConfig.nomeBambino} ({bedtimeConfirmConfig.etaBambino} anni)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🗺️</span>
                <div>
                  <span className="text-indigo-400 font-extrabold block text-[8px] uppercase tracking-wider leading-none">Ambientazione</span>
                  <span className="text-white">{bedtimeConfirmConfig.categoria}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">💖</span>
                <div>
                  <span className="text-indigo-400 font-extrabold block text-[8px] uppercase tracking-wider leading-none">Valore Educativo</span>
                  <span className="text-white">{bedtimeConfirmConfig.temaEducativo}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🐕</span>
                <div>
                  <span className="text-indigo-400 font-extrabold block text-[8px] uppercase tracking-wider leading-none">Protagonista Magico</span>
                  <span className="text-white">
                    {bedtimeConfirmConfig.personaggi && bedtimeConfirmConfig.personaggi[0]
                      ? `${bedtimeConfirmConfig.personaggi[0].nome} il ${bedtimeConfirmConfig.personaggi[0].tipo} (${bedtimeConfirmConfig.personaggi[0].caratteristica})`
                      : "Un simpatico amico"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">⏳</span>
                <div>
                  <span className="text-indigo-400 font-extrabold block text-[8px] uppercase tracking-wider leading-none">Durata Racconto</span>
                  <span className="text-white">{bedtimeConfirmConfig.durata} (perfetta per addormentarsi)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1.5">
              <button
                onClick={() => {
                  playClickSound();
                  const config = bedtimeConfirmConfig;
                  setBedtimeConfirmConfig(null);
                  handleGenerateStory(config, true);
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-900 border-b-4 border-amber-700 hover:scale-103 active:scale-97 rounded-full text-xs font-black transition-all cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
              >
                <span>Crea Favola Buonanotte 🌙</span>
              </button>
              
              <button
                onClick={() => { playClickSound(); setBedtimeConfirmConfig(null); }}
                className="w-full py-2 bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-300 hover:text-white rounded-full text-[10px] font-extrabold transition-all cursor-pointer border border-indigo-700/50"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Continue Story Confirmation Dialog */}
      {continueStoryConfirmConfig && (
        <div className="fixed inset-0 bg-indigo-950/80 backdrop-blur-md flex items-center justify-center p-5 z-50 animate-fade-in">
          <div className="bg-gradient-to-b from-[#1A237E] to-[#12185C] rounded-[2.5rem] border-4 border-indigo-300 p-6 max-w-sm w-full text-center space-y-4 shadow-[0_0_25px_rgba(63,81,181,0.4)] text-indigo-100 transform scale-100 transition-all relative">
            <button
              onClick={() => { playClickSound(); setContinueStoryConfirmConfig(null); }}
              className="absolute top-4 right-4 text-indigo-300 hover:text-white font-bold text-sm bg-indigo-900/60 hover:bg-indigo-800 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer border border-indigo-500/30"
            >
              ✕
            </button>

            <div className="text-5xl animate-pulse py-1 select-none">🔮✨📖</div>

            <div className="space-y-1.5">
              <span className="text-[9px] bg-indigo-900/60 border border-indigo-500 text-indigo-200 font-black px-3 py-0.5 rounded-full uppercase tracking-widest">
                Richiesta Conferma
              </span>
              <h4 className="font-extrabold text-base text-amber-200 font-serif italic pt-1 leading-tight">
                Continua la Storia
              </h4>
              <p className="text-[10px] text-indigo-200 leading-relaxed font-bold px-1.5">
                Sei pronto a scrivere il capitolo successivo di questa favola magica? Ecco il riepilogo delle tue scelte:
              </p>
            </div>

            <div className="bg-indigo-900/40 p-4 rounded-2xl border border-indigo-800 text-left space-y-2.5 text-[10px] font-bold text-indigo-200">
              <div className="flex items-center gap-2">
                <span className="text-lg">👦</span>
                <div>
                  <span className="text-indigo-400 font-extrabold block text-[8px] uppercase tracking-wider leading-none">Bambino</span>
                  <span className="text-white">{continueStoryConfirmConfig.nomeBambino} ({continueStoryConfirmConfig.etaBambino} anni)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">📖</span>
                <div>
                  <span className="text-indigo-400 font-extrabold block text-[8px] uppercase tracking-wider leading-none">Favola Iniziale</span>
                  <span className="text-white truncate max-w-[240px] block">{continueStoryConfirmConfig.parentStoryTitle}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🗺️</span>
                <div>
                  <span className="text-indigo-400 font-extrabold block text-[8px] uppercase tracking-wider leading-none">Ambientazione</span>
                  <span className="text-white">{continueStoryConfirmConfig.categoria}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">💖</span>
                <div>
                  <span className="text-indigo-400 font-extrabold block text-[8px] uppercase tracking-wider leading-none">Valore Educativo</span>
                  <span className="text-white">{getEducationalThemeDisplayName(continueStoryConfirmConfig.temaEducativo)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">⏳</span>
                <div>
                  <span className="text-indigo-400 font-extrabold block text-[8px] uppercase tracking-wider leading-none">Durata Capitolo</span>
                  <span className="text-white">{continueStoryConfirmConfig.durata}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1.5">
              <button
                onClick={() => {
                  playClickSound();
                  const config = continueStoryConfirmConfig;
                  setContinueStoryConfirmConfig(null);
                  handleGenerateStory(config, config.isBedtimeMode);
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-900 border-b-4 border-amber-700 hover:scale-103 active:scale-97 rounded-full text-xs font-black transition-all cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
              >
                <span>Continua l'Avventura! 🚀</span>
              </button>
              
              <button
                onClick={() => { playClickSound(); setContinueStoryConfirmConfig(null); }}
                className="w-full py-2 bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-300 hover:text-white rounded-full text-[10px] font-extrabold transition-all cursor-pointer border border-indigo-700/50"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PARENTAL PIN MODAL */}
      {pendingPinAction && settings.pinAccesso && (
        <PinModal
          expectedPin={settings.pinAccesso}
          title={pendingPinAction === "settings" ? "Area Genitori" : "Conferma Eliminazione"}
          description={pendingPinAction === "settings" ? "Inserisci il PIN per accedere alle impostazioni" : "Inserisci il PIN per eliminare definitivamente la favola"}
          onCancel={() => setPendingPinAction(null)}
          onSuccess={() => {
            if (settings.pinAccesso === "0000") {
              setForcePinChangeAction(pendingPinAction);
              setPendingPinAction(null);
            } else {
              if (pendingPinAction === "settings") {
                setScreen("settings");
              } else if (pendingPinAction.type === "delete_story") {
                handlePermanentlyDeleteStory(pendingPinAction.id);
              }
              setPendingPinAction(null);
            }
          }}
        />
      )}

      {forcePinChangeAction && (
        <ChangePinModal
          isForced={true}
          onCancel={() => setForcePinChangeAction(null)}
          onSuccess={(newPin) => {
            handleUpdateSettings({ pinAccesso: newPin });
            if (forcePinChangeAction === "settings") {
              setScreen("settings");
            } else if (forcePinChangeAction.type === "delete_story") {
              handlePermanentlyDeleteStory(forcePinChangeAction.id);
            }
            setForcePinChangeAction(null);
          }}
        />
      )}

      {/* DEDICATED PARENTAL GATE MODAL FOR KIDS MODE SECURE ACTIONS */}
      {pendingGateAction && (
        <ParentalGateModal
          parentPin={settings.pinAccesso}
          actionName={
            pendingGateAction.type === "disable_kids_mode" 
              ? "disattivare la Modalità Bambino" 
              : pendingGateAction.type === "bedtime" 
                ? "creare una Favola della Buonanotte" 
                : pendingGateAction.target === "settings" 
                  ? "accedere alle Impostazioni" 
                  : pendingGateAction.target === "profiles" 
                    ? "gestire i Profili dei bambini" 
                    : "creare nuove favole"
          }
          onSuccess={() => {
            const action = pendingGateAction;
            setPendingGateAction(null);
            if (action.type === "disable_kids_mode") {
              handleUpdateSettings({ modalitaBambino: false });
              setIsNannaTriggered(false);
            } else if (action.type === "bedtime") {
              // Trigger bedtime story dialog config
              const targetCat = unlockedCategories.includes("Natura") ? "Natura" : (unlockedCategories[0] || "Fantasy");
              const targetTema = unlockedThemes.includes("Gentilezza") 
                ? "Gentilezza" 
                : (unlockedThemes.includes("Pazienza") 
                    ? "Pazienza" 
                    : (unlockedThemes.includes("Gratitudine") ? "Gratitudine" : (unlockedThemes[0] || "Gentilezza")));
              
              const characterType = unlockedCharacterTypes.includes("Cucciolo") ? "Cucciolo" : (unlockedCharacterTypes[0] || "Cucciolo");
              const characterTrait = unlockedCharacterTraits.includes("Gentile") ? "Gentile" : (unlockedCharacterTraits[0] || "Sensibile");

              const profile = activeProfile;
              const nomeBambino = profile?.nome || "Piccolo lettore";
              const etaBambino = profile ? (new Date().getFullYear() - profile.annoNascita) : 5;

              const config = {
                categoria: targetCat,
                temaEducativo: targetTema,
                durata: "Breve" as const,
                personaggi: [{ nome: "Nuvola", tipo: characterType, caratteristica: characterTrait }],
                nomeBambino,
                etaBambino
              };

              setBedtimeConfirmConfig(config);
            } else if (action.type === "navigate" && action.target) {
              setScreen(action.target);
            }
          }}
           onCancel={() => setPendingGateAction(null)}
         />
       )}

       {/* Generation Error Modal */}
       {generationError && (
         <GenerationErrorModal
           title={generationError.title}
           message={generationError.message}
           reason={generationError.reason}
           onRetry={() => {
             setGenerationError(null);
             if (currentGenerationConfig) {
               handleGenerateStory(
                 {
                   categoria: currentGenerationConfig.categoria,
                   temaEducativo: currentGenerationConfig.temaEducativo,
                   durata: "Media",
                   personaggi: [],
                   nomeBambino: activeProfile?.nome || "Piccolo lettore",
                   etaBambino: activeProfile ? new Date().getFullYear() - activeProfile.annoNascita : 5
                 },
                 isBedtimeMode
               );
             }
           }}
           onCancel={() => {
             setGenerationError(null);
             setScreen("new-story");
           }}
         />
       )}

       {/* Achievement Modal */}
       {achievementModal && (
         <AchievementModal
           message={achievementModal.message}
            rewards={achievementRewardsOpened[achievementModal.id] || achievementModal.rewards}
            isWorldCompletion={achievementModal.isWorldCompletion}
            onOpenReward={() => {
              const alreadyOpened = achievementRewardsOpened[achievementModal.id];
              if (alreadyOpened && alreadyOpened.length > 0) {
                return alreadyOpened;
              }

              const unlocked = handleClaimAchievement(achievementModal.id);
              return mapUnlockedToRewards(unlocked);
            }}
           onClaim={() => {
              const returnTarget = achievementReturnTarget;

              setAchievementRewardsOpened(prev => {
                const next = { ...prev };
                if (achievementModal) delete next[achievementModal.id];
                return next;
              });

              // Close the full achievement flow and go back to the original context.
              setAchievementModal(null);
              setAchievementQueue([]);

              if (returnTarget === "developer") {
                setIsDeveloperMode(true);
              }
           }}
         />
       )}

       {/* COZY SLEEPING MOON OVERLAY (TIMER NANNA SCADUTO) */}
      {isNannaTriggered && (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-[190] overflow-hidden select-none">
          {/* Sparkling background stars */}
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            <div className="absolute top-10 left-10 text-white animate-pulse">⭐️</div>
            <div className="absolute top-20 right-20 text-white animate-pulse delay-75">✨</div>
            <div className="absolute bottom-20 left-1/4 text-white animate-pulse delay-200">✨</div>
            <div className="absolute bottom-10 right-10 text-white animate-pulse">⭐️</div>
            <div className="absolute top-1/2 left-10 text-white animate-pulse delay-500">⭐️</div>
            <div className="absolute top-1/3 right-12 text-white animate-pulse delay-300">✨</div>
          </div>

          <div className="space-y-6 max-w-sm relative z-10">
            {/* Glowing Moon with closed eyes sleeping */}
            <div className="w-24 h-24 bg-[#FFFDE7] rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(255,253,231,0.4)] border-4 border-amber-200 animate-bounce-slow">
              <span className="text-5xl">😴</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-amber-200 font-serif italic tracking-tight leading-tight">
                Ora di Dormire...
              </h1>
              <p className="text-[10px] text-indigo-300 font-black tracking-widest uppercase">
                &bull; Timer Nanna Scaduto &bull;
              </p>
            </div>

            <p className="text-[11px] text-indigo-100 font-semibold leading-relaxed px-2">
              Il magico timer della nanna ha spento la lettura. È il momento di chiudere gli occhietti e fare sogni d'oro. Buonanotte! 🌙✨
            </p>

            <button
              onClick={() => {
                playClickSound();
                setPendingGateAction({ type: "disable_kids_mode" });
              }}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs rounded-full shadow-lg border-b-4 border-amber-600 transition-all cursor-pointer flex items-center justify-center gap-2 mx-auto"
            >
              ☀️ Sveglia l'Applicazione
            </button>
          </div>
        </div>
      )}

      {/* Developer Mode PIN Modal */}
      {showDeveloperPinModal && (
        <DeveloperPinModal
          onSuccess={() => {
            setShowDeveloperPinModal(false);
            setIsDeveloperMode(true);
          }}
          onCancel={() => setShowDeveloperPinModal(false)}
        />
      )}

      {/* Developer Mode */}
      {isDeveloperMode && (
        <DeveloperMode
          onTestStageAchievement={handleTestStageAchievement}
          onTestWorldAchievement={handleTestWorldAchievement}
          onClose={() => setIsDeveloperMode(false)}
        />
      )}
    </PhoneMockup>
    </>
  );
}
