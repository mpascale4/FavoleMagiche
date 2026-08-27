import React from "react";
import { Sparkles, Trophy, CheckCircle, Lock, BookOpen, User, Settings } from "lucide-react";
import { ChildProfile, ScreenType, Story, AppSettings, CATEGORIES, EDUCATIONAL_THEMES, CHARACTER_TYPES, CHARACTER_TRAITS } from "../types";
import FairyTaleMap from "./FairyTaleMap";
import { playClickSound, playOpenBoxClickSound, playFairyChorusSound } from "../utils/audio";
import { Stage, getVisibleStages } from "../utils/stages";

interface HomeViewProps {
  onNavigate: (screen: ScreenType) => void;
  onStartBedtimeStory?: () => void;
  activeProfile: ChildProfile | null;
  profiles: ChildProfile[];
  generatedToday: number;
  unlockedCategories: string[];
  unlockedThemes: string[];
  unlockedCharacterTypes?: string[];
  unlockedCharacterTraits?: string[];
  lastUnlockDate: string;
  onUnlock: () => void;
  isGenerating?: boolean;
  stories: Story[];
  claimedAchievements: string[];
  onClaimAchievement: (id: string) => void;
  settings?: AppSettings;
  onDisableKidsMode?: () => void;
}

export default function HomeView({
  onNavigate,
  onStartBedtimeStory,
  activeProfile,
  profiles,
  generatedToday,
  unlockedCategories = [],
  unlockedThemes = [],
  unlockedCharacterTypes = [],
  unlockedCharacterTraits = [],
  lastUnlockDate = "",
  onUnlock,
  isGenerating = false,
  stories = [],
  claimedAchievements = [],
  onClaimAchievement,
  settings,
  onDisableKidsMode
}: HomeViewProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const isUnlockAvailableToday = lastUnlockDate !== todayStr && (
    unlockedCategories.length < CATEGORIES.length || 
    unlockedThemes.length < EDUCATIONAL_THEMES.length ||
    unlockedCharacterTypes.length < CHARACTER_TYPES.length ||
    unlockedCharacterTraits.length < CHARACTER_TRAITS.length
  );
  const allUnlocked = unlockedCategories.length >= CATEGORIES.length && 
    unlockedThemes.length >= EDUCATIONAL_THEMES.length &&
    unlockedCharacterTypes.length >= CHARACTER_TYPES.length &&
    unlockedCharacterTraits.length >= CHARACTER_TRAITS.length;

  const unlockedCount = unlockedCategories.length + unlockedThemes.length + unlockedCharacterTypes.length + unlockedCharacterTraits.length;
  const totalItems = CATEGORIES.length + EDUCATIONAL_THEMES.length + CHARACTER_TYPES.length + CHARACTER_TRAITS.length;

  const createdCount = stories.length;
  const totalReadCount = stories.reduce((sum, s) => sum + (s.volteLetta || 0), 0);

  const handleNavigate = (screen: ScreenType) => {
    playClickSound();
    onNavigate(screen);
  };

  const handleClaimTap = (achievementId: string) => {
    playOpenBoxClickSound();
    onClaimAchievement(achievementId);
  };

  // Get calculated age
  const getAge = (birthYear: number) => {
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
  };

  return (
    <section id="home-screen" aria-label="Home Favole Magiche" className="w-full flex-1 flex flex-col p-5 justify-between min-h-0 h-full gap-3">

      {/* 1. TOP HEADER WITH COMPACT BUTTONS ON THE RIGHT */}
      <div className="flex items-center justify-between mt-2 mb-1 shrink-0">
        <div className="flex items-center gap-2 text-left">
          {/* Icona app = favicon (regola "Icona header = favicon") */}
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md transform -rotate-3 shrink-0 border border-white">
            <img src="/icon.svg" alt="Favole Magiche" className="h-full w-full object-cover" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-natural-burgundy italic font-serif leading-none">
              Favole Magiche
            </h2>
            <p className="text-[8px] text-[#EC407A] font-extrabold uppercase tracking-widest mt-0.5">
              Sogni d'oro
            </p>
          </div>
        </div>
               {/* Profile and Settings compact top-right buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavigate("profiles")}
            id="btn-top-menu-profiles"
            aria-label="Apri gestione profili bambini"
            className="flex flex-col items-center justify-center bg-transparent active:scale-95 transition-all cursor-pointer"
          >
            <div className="w-9 h-9 bg-natural-pink-light rounded-full flex items-center justify-center text-base border-2 border-natural-pink-border shrink-0 shadow-xs">
              {settings?.modalitaBambino ? "🔒" : "🦁"}
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-[#880E4F] mt-1 max-w-[60px] truncate text-center">
              {activeProfile ? activeProfile.nome : "Profili"}
            </span>
          </button>
          
          <button
            onClick={() => handleNavigate("settings")}
            id="btn-top-menu-settings"
            aria-label="Apri impostazioni"
            className="flex items-center justify-center w-9 h-9 bg-white hover:bg-[#E8F5E9]/30 border-2 border-natural-green-light rounded-full shadow-xs text-[#2E7D32] active:scale-95 transition-all cursor-pointer mb-[14px]"
          >
            <span className="text-base">{settings?.modalitaBambino ? "🔒" : "⚙️"}</span>
          </button>
        </div>
      </div>

      {/* MODALITÀ BAMBINO (KIDS MODE) FLOATING BANNER */}
      {settings?.modalitaBambino && (
        <div role="status" aria-live="polite" className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-2 border-blue-200 rounded-2xl p-2.5 flex items-center justify-between text-left shrink-0 shadow-xs animate-pulse mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔒</span>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-blue-700 font-extrabold leading-none">Modalità Bambino Attiva</p>
              <p className="text-[10px] text-indigo-950 font-bold mt-0.5">I tasti di creazione sono protetti.</p>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              if (onDisableKidsMode) onDisableKidsMode();
            }}
            aria-label="Richiedi sblocco modalita bambino"
            className="text-[9px] font-black text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer border-b-2 border-blue-800"
          >
            Sblocca 🔓
          </button>
        </div>
      )}

      {/* 2. 2x2 MAIN BUTTON GRID FILLING THE FULL REMAINING PAGE */}
      <div className="flex-1 grid grid-cols-2 gap-4 mt-1 mb-2 min-h-0">
        {/* Genera Nuova Storia */}
        <button
          onClick={() => !isGenerating && handleNavigate("new-story")}
          disabled={isGenerating}
          aria-disabled={isGenerating}
          aria-label={isGenerating ? "Generazione in corso, pulsante disabilitato" : "Crea una nuova storia"}
          id="btn-menu-new-story"
          className={`group hc-card rounded-3xl border-4 transition-all duration-200 flex flex-col items-center justify-center text-center p-4 cursor-pointer h-full ${
            isGenerating 
              ? "bg-slate-100 border-slate-300 text-theme-secondary cursor-not-allowed opacity-75" 
              : "bg-yellow-50 hover:bg-yellow-100 text-natural-text border-yellow-200 shadow-md active:scale-[0.98]"
          }`}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm border shrink-0 transition-transform duration-300 mb-3 ${
            isGenerating 
              ? "bg-slate-200 border-slate-300 text-theme-secondary" 
              : "bg-white border-yellow-150 group-hover:scale-110"
          }`}>
            {settings?.modalitaBambino ? "🔒" : (isGenerating ? "⏳" : "🪄")}
          </div>
          <div className="min-w-0">
            <h3 className={`font-black text-xs flex items-center gap-1 justify-center leading-tight mb-1 ${
              isGenerating ? "text-theme-secondary" : "hc-card-title text-natural-burgundy"
            }`}>
              {settings?.modalitaBambino && <Lock size={12} className="hc-card-title shrink-0" />}
              {isGenerating ? "Generando..." : "Nuova Storia"}
              {!isGenerating && <Sparkles size={11} className="hc-card-title fill-current shrink-0 text-[#E91E63]" />}
            </h3>
            <p className={`text-[9.5px] font-bold leading-normal max-w-[130px] mx-auto ${
              isGenerating ? "text-theme-secondary" : "hc-card-subtitle"
            }`}>
              {settings?.modalitaBambino
                ? "Disattiva la Modalità Bambino per creare" 
                : (isGenerating 
                    ? "L'IA magica sta creando la favola..." 
                    : "Crea una favola con l'Intelligenza Artificiale")}
            </p>
          </div>
        </button>

        {/* Biblioteca */}
        <button
          onClick={() => stories.length > 0 && handleNavigate("archive")}
          disabled={stories.length === 0}
          aria-disabled={stories.length === 0}
          aria-label={stories.length === 0 ? "Biblioteca non disponibile: nessuna favola" : "Apri biblioteca magica"}
          id="btn-menu-archive"
          className={`group hc-card rounded-3xl border-4 transition-all duration-200 flex flex-col items-center justify-center text-center p-4 h-full ${
            stories.length === 0
              ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
              : "bg-sky-50/70 hover:bg-sky-100 text-natural-text border-sky-200 shadow-md active:scale-[0.98] cursor-pointer"
          }`}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border shrink-0 transition-transform duration-300 mb-3 ${
            stories.length === 0 ? "bg-slate-200 border-slate-300 text-theme-secondary" : "bg-white border-sky-150 text-[#0277BD] group-hover:scale-110"
          }`}>
            📚
          </div>
          <div className="min-w-0 w-full">
            <h3 className={`font-black text-xs truncate mb-1 ${stories.length === 0 ? "text-theme-secondary" : "hc-card-title text-natural-burgundy"}`}>
              Libreria Magica
            </h3>
            <p className={`text-[9.5px] font-bold leading-normal max-w-[130px] mx-auto ${stories.length === 0 ? "text-theme-secondary" : "hc-card-subtitle"}`}>
              {stories.length === 0 ? "Nessuna favola" : "Rileggi e ascolta le tue favole salvate"}
            </p>
          </div>
        </button>

        {/* Mappa delle Fiabe */}
        <button
          onClick={() => handleNavigate("map")}
          id="btn-menu-fairy-map"
          className="group hc-card rounded-3xl border-4 transition-all duration-200 flex flex-col items-center justify-center text-center p-4 bg-emerald-50 hover:bg-emerald-100 text-slate-950 border-emerald-200 shadow-md active:scale-[0.98] cursor-pointer h-full"
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm border shrink-0 transition-transform duration-300 bg-white border-emerald-100 group-hover:scale-110 mb-3">
            🗺️
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-xs text-natural-burgundy leading-tight mb-1 hc-card-title">
              Mappa Magica
            </h3>
            <p className="text-[9.5px] font-bold leading-normal max-w-[130px] mx-auto hc-card-subtitle">
              Esplora il regno magico e riscatta i tuoi trofei! 🏆
            </p>
          </div>
        </button>

        {/* Albero della Crescita */}
        <button
          onClick={() => handleNavigate("albero")}
          id="btn-menu-growth-tree"
          aria-label="Apri albero della crescita"
          className="group hc-card bg-emerald-50/40 hover:bg-emerald-100 text-natural-text p-4 rounded-3xl border-4 border-green-200 shadow-md transition-all duration-200 flex flex-col items-center justify-center text-center active:scale-[0.98] cursor-pointer h-full"
        >
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl border shrink-0 group-hover:scale-110 transition-transform duration-300 text-[#2E7D32] border-green-150 mb-3">
            🌳
          </div>
          <div className="min-w-0 w-full">
            <h3 className="font-black text-xs hc-card-title truncate text-natural-burgundy mb-1">
              Albero Virtuoso
            </h3>
            <p className="text-[9.5px] hc-card-subtitle font-bold leading-normal max-w-[130px] mx-auto">
              Coltiva le tue virtù e gioca con i frutti magici! 🌱
            </p>
          </div>
        </button>
      </div>
    </section>
  );
}
