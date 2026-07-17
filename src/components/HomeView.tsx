import React, { useState, useEffect } from "react";
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
  onUnlock: () => { category: string; theme: string; characterType: string; characterTrait: string } | null;
  isGenerating?: boolean;
  stories: Story[];
  claimedAchievements: string[];
  onClaimAchievement: (id: string) => { category: string; theme: string; characterType: string; characterTrait: string } | null;
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
  const [unlockReveal, setUnlockReveal] = useState<{ category?: string; theme?: string; characterType?: string; characterTrait?: string } | null>(null);

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
    
    setTimeout(() => {
      const unlocked = onClaimAchievement(achievementId);
      if (unlocked) {
        playFairyChorusSound();
        setUnlockReveal(unlocked);
      }
    }, 1200);
  };

  // Get calculated age
  const getAge = (birthYear: number) => {
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
  };

  return (
    <div id="home-screen" className="w-full flex flex-col p-5 gap-4">
      
      {/* 1. TOP HEADER WITH COMPACT BUTTONS ON THE RIGHT */}
      <div className="flex items-center justify-between mt-2 mb-1 shrink-0">
        <div className="flex items-center gap-2 text-left">
          <div className="w-9 h-9 bg-gradient-to-br from-natural-pink to-[#F06292] rounded-xl flex items-center justify-center shadow-md transform -rotate-3 shrink-0">
            <span className="text-xl">✨</span>
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
        
        {/* Bambini and Impostazioni compact top-right buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleNavigate("profiles")}
            id="btn-top-menu-profiles"
            className="flex items-center gap-1 bg-white hover:bg-natural-pink-light/30 border-2 border-natural-pink-border px-2 py-1 rounded-full shadow-xs text-[#880E4F] active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-xs">{settings?.modalitaBambino ? "🔒" : "👶"}</span>
            <span className="text-[9px] font-black uppercase tracking-wider">Bambini</span>
          </button>
          <button
            onClick={() => handleNavigate("settings")}
            id="btn-top-menu-settings"
            className="flex items-center gap-1 bg-white hover:bg-[#E8F5E9]/30 border-2 border-natural-green-light px-2 py-1 rounded-full shadow-xs text-[#2E7D32] active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-xs">{settings?.modalitaBambino ? "🔒" : "⚙️"}</span>
            <span className="text-[9px] font-black uppercase tracking-wider">Impostazioni</span>
          </button>
        </div>
      </div>

      {/* MODALITÀ BAMBINO (KIDS MODE) FLOATING BANNER */}
      {settings?.modalitaBambino && (
        <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-2 border-blue-200 rounded-2xl p-2.5 flex items-center justify-between text-left shrink-0 shadow-xs animate-pulse">
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
            className="text-[9px] font-black text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer border-b-2 border-blue-800"
          >
            Sblocca 🔓
          </button>
        </div>
      )}

      {/* 2. ACTIVE KID BAR */}
      <div className="bg-white/85 border-4 border-natural-pink-border rounded-2xl p-2.5 shadow-xs mb-1 shrink-0">
        {activeProfile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-natural-pink-light rounded-xl flex items-center justify-center text-sm border-2 border-natural-pink-border shrink-0">
                🦁
              </div>
              <div>
                <p className="text-[8px] uppercase tracking-wider text-[#EC407A] font-extrabold leading-none">Lettore Attivo</p>
                <p className="text-xs font-black text-[#880E4F] mt-0.5">
                  {activeProfile.nome} ({getAge(activeProfile.annoNascita)} anni)
                </p>
              </div>
            </div>
            <button
              onClick={() => handleNavigate("profiles")}
              id="btn-switch-profile-home"
              className="text-[9px] font-black text-white bg-[#EC407A] hover:bg-[#E91E63] px-2.5 py-1 rounded-full shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              {settings?.modalitaBambino && <Lock size={10} />}
              <span>Cambia</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🪄</span>
              <p className="text-[11px] font-bold text-natural-text/80">Scegli il profilo di tuo figlio</p>
            </div>
            <button
              onClick={() => handleNavigate("profiles")}
              id="btn-create-profile-home"
              className="text-[9px] font-black text-white bg-[#EC407A] hover:bg-[#E91E63] px-3 py-1.5 rounded-full shadow-xs transition-all border-b-2 border-[#C2185B] flex items-center gap-1 cursor-pointer"
            >
              {settings?.modalitaBambino && <Lock size={10} />}
              <span>Seleziona 👶</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. NUOVA STORIA, BIBLIOTECA & ALBERO - SUBITO IN ALTO DOPO IL LETTORE */}
      <div className="flex flex-col gap-2.5 mb-3 shrink-0">
        {/* Genera Nuova Storia */}
        <button
          onClick={() => !isGenerating && handleNavigate("new-story")}
          disabled={isGenerating}
          id="btn-menu-new-story"
          className={`group w-full p-3.5 rounded-2xl border-4 transition-all duration-200 flex items-center gap-3.5 text-left cursor-pointer ${
            isGenerating 
              ? "bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed opacity-75" 
              : "bg-[#FFFDE7] hover:bg-[#FFF9C4] text-natural-text border-[#FFE082] shadow-sm active:scale-[0.98] animate-button-blink"
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-xs border shrink-0 transition-transform duration-300 ${
            isGenerating 
              ? "bg-slate-200 border-slate-300 text-slate-400" 
              : "bg-white border-[#FFE082] group-hover:scale-105"
          }`}>
            {settings?.modalitaBambino ? "🔒" : (isGenerating ? "⏳" : "🪄")}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-extrabold text-xs flex items-center gap-1 ${
              isGenerating ? "text-slate-500" : "text-[#F9A825] animate-magic-blink"
            }`}>
              {settings?.modalitaBambino && <Lock size={12} className="text-[#F9A825] shrink-0" />}
              {isGenerating ? "Generazione in corso..." : "Nuova Storia"} 
              {!isGenerating && <Sparkles size={12} className="text-natural-yellow fill-natural-yellow" />}
            </h3>
            <p className={`text-[9px] font-semibold leading-tight ${
              isGenerating ? "text-slate-400" : "text-natural-text/70"
            }`}>
              {settings?.modalitaBambino 
                ? "Disattiva la Modalità Bambino per creare una nuova favola" 
                : (isGenerating 
                    ? "L'IA magica sta creando la tua favola..." 
                    : "Crea una favola personalizzata con l'Intelligenza Artificiale")}
            </p>
          </div>
        </button>

        {/* Favola della Buonanotte */}
        <button
          onClick={() => {
            playClickSound();
            if (!isGenerating && onStartBedtimeStory) {
              onStartBedtimeStory();
            }
          }}
          disabled={isGenerating}
          id="btn-menu-bedtime-story"
          className={`group w-full p-3.5 rounded-2xl border-4 transition-all duration-200 flex items-center gap-3.5 text-left ${
            isGenerating 
              ? "bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed opacity-75" 
              : "bg-[#E8EAF6] hover:bg-[#C5CAE9]/30 text-slate-950 border-[#9FA8DA] shadow-sm active:scale-[0.98] cursor-pointer"
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-xs border shrink-0 transition-transform duration-300 ${
            isGenerating 
              ? "bg-slate-200 border-slate-300 text-slate-400" 
              : "bg-[#1A237E] border-[#3F51B5] group-hover:scale-105"
          }`}>
            {settings?.modalitaBambino ? "🔒" : "🌙"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-extrabold text-xs flex items-center gap-1 ${
              isGenerating ? "text-slate-500" : "text-[#3F51B5]"
            }`}>
              {settings?.modalitaBambino && <Lock size={12} className="text-[#3F51B5] shrink-0" />}
              Favola della Buonanotte
            </h3>
            <p className={`text-[9px] font-semibold leading-tight ${
              isGenerating ? "text-slate-400" : "text-slate-600/90"
            }`}>
              Storie rilassanti, suoni dolci e modalità notte per sogni d'oro ✨
            </p>
          </div>
        </button>

        {/* Side-by-side buttons for Biblioteca & Growth Tree */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Biblioteca */}
          <button
            onClick={() => stories.length > 0 && handleNavigate("archive")}
            disabled={stories.length === 0}
            id="btn-menu-archive"
            className={`group p-2.5 rounded-2xl border-4 transition-all duration-200 flex flex-col items-center justify-center text-center ${
              stories.length === 0
                ? "bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed"
                : "bg-white/80 hover:bg-white text-natural-text border-natural-blue-light shadow-sm active:scale-[0.98] cursor-pointer"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 shrink-0 transition-transform duration-300 ${
              stories.length === 0 ? "bg-slate-200 border-slate-300 text-slate-400" : "bg-[#E1F5FE] border-[#81D4FA] text-[#0277BD] group-hover:scale-105"
            }`}>
              📚
            </div>
            <div className="mt-1.5 min-w-0 w-full">
              <h3 className={`font-extrabold text-[10px] truncate ${stories.length === 0 ? "text-slate-400" : "text-[#0277BD]"}`}>
                Biblioteca Magica
              </h3>
              <p className="text-[7.5px] text-natural-text/60 font-semibold truncate leading-none mt-0.5">
                {stories.length === 0 ? "Nessuna favola" : "Rileggi le tue favole"}
              </p>
            </div>
          </button>

          {/* Albero della Crescita */}
          <button
            onClick={() => handleNavigate("albero")}
            id="btn-menu-growth-tree"
            className="group bg-white/80 hover:bg-white text-natural-text p-2.5 rounded-2xl border-4 border-[#A5D6A7] shadow-sm transition-all duration-200 flex flex-col items-center justify-center text-center active:scale-[0.98] cursor-pointer"
          >
            <div className="w-10 h-10 bg-[#E8F5E9] rounded-xl flex items-center justify-center text-xl border-2 border-[#81C784] shrink-0 group-hover:scale-105 transition-transform duration-300 text-[#2E7D32]">
              🌳
            </div>
            <div className="mt-1.5 min-w-0 w-full">
              <h3 className="font-extrabold text-[10px] text-[#2E7D32] truncate">
                Albero della Crescita
              </h3>
              <p className="text-[7.5px] text-natural-text/60 font-semibold truncate leading-none mt-0.5">
                Le tue statistiche
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 5. INTERACTIVE FAIRY TALE MAP */}
      <FairyTaleMap
        claimedAchievements={claimedAchievements}
        createdCount={createdCount}
        totalReadCount={totalReadCount}
        onClaimAchievement={handleClaimTap}
      />

      {/* 7. SECONDARY MODAL: UNLOCK REVEAL DIALOG (Scrigno o Obiettivo) */}
      {unlockReveal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-5 z-50 animate-fade-in">
          <div className="bg-white rounded-[2rem] border-4 border-natural-pink-border p-6 max-w-sm w-full text-center space-y-4 shadow-2xl transform scale-100 transition-all">
            <div className="text-4xl animate-bounce py-1">🎁✨</div>
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-base text-natural-burgundy font-serif italic">
                Incantesimo Compiuto!
              </h4>
              <p className="text-[10.5px] text-natural-text font-bold">
                Il tuo scrigno si è aperto svelando un nuovo meraviglioso elemento per le tue fiabe!
              </p>
            </div>
            
            <div className="bg-[#FFFDE7] border-2 border-[#FFE082] rounded-2xl p-4 space-y-2 text-left shadow-inner">
              {unlockReveal.category && (
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🌲</span>
                  <div>
                    <p className="text-[8.5px] uppercase tracking-wider text-[#F9A825] font-extrabold leading-none">Nuova Categoria</p>
                    <p className="text-[11.5px] font-black text-natural-burgundy mt-1">{unlockReveal.category}</p>
                  </div>
                </div>
              )}
              {unlockReveal.theme && (
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🤝</span>
                  <div>
                    <p className="text-[8.5px] uppercase tracking-wider text-[#EC407A] font-extrabold leading-none">Nuova Morale (Tema)</p>
                    <p className="text-[11.5px] font-black text-natural-burgundy mt-1">{unlockReveal.theme}</p>
                  </div>
                </div>
              )}
              {unlockReveal.characterType && (
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🧙‍♂️</span>
                  <div>
                    <p className="text-[8.5px] uppercase tracking-wider text-[#0288D1] font-extrabold leading-none">Nuovo Tipo Personaggio</p>
                    <p className="text-[11.5px] font-black text-natural-burgundy mt-1">{unlockReveal.characterType}</p>
                  </div>
                </div>
              )}
              {unlockReveal.characterTrait && (
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <p className="text-[8.5px] uppercase tracking-wider text-[#7B1FA2] font-extrabold leading-none">Nuova Caratteristica</p>
                    <p className="text-[11.5px] font-black text-natural-burgundy mt-1">{unlockReveal.characterTrait}</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setUnlockReveal(null)}
              className="w-full py-2.5 bg-gradient-to-r from-natural-pink to-[#EC407A] hover:brightness-105 border-2 border-[#EC407A] text-white rounded-full text-xs font-black transition-all cursor-pointer shadow-md"
            >
              Usa Subito 🪄
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
