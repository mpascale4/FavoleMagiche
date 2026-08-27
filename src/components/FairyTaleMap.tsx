import React, { useState } from "react";
import { Trophy, Lock, CheckCircle2, ChevronRight, ChevronLeft, Gift, HelpCircle, X } from "lucide-react";
import { playFairyChorusSound, playClickSound } from "../utils/audio";
import { Stage, generateStage, WORLD_INFO } from "../utils/stages";

interface FairyTaleMapProps {
  claimedAchievements: string[];
  createdCount: number;
  totalReadCount: number;
  onClaimAchievement: (id: string) => void;
}

export default function FairyTaleMap({
  claimedAchievements,
  createdCount,
  totalReadCount,
  onClaimAchievement
}: FairyTaleMapProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<Stage | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [selectedWorldIndex, setSelectedWorldIndex] = useState<number | null>(null);

  // Pagination for the 10 worlds (5 worlds per page)
  const [worldsPage, setWorldsPage] = useState<number>(0); // 0 = worlds 1-5, 1 = worlds 6-10

  // Touch Swipe States
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.changedTouches[0].clientX);
    setTouchStartY(e.changedTouches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    const minSwipeDistance = 50;

    // Primarily horizontal swipe
    if (Math.abs(diffX) > minSwipeDistance && Math.abs(diffY) < Math.abs(diffX) * 0.6) {
      e.stopPropagation();

      if (selectedWorldIndex === null) {
        // Worlds selection page (paginated)
        if (diffX > 0) {
          // Swipe left -> Next page with loop
          playClickSound();
          setWorldsPage(prev => (prev === 0 ? 1 : 0));
        } else {
          // Swipe right -> Previous page with loop
          playClickSound();
          setWorldsPage(prev => (prev === 1 ? 0 : 1));
        }
      } else {
        // Specific world stages view (not paginated) -> Back to worlds list
        playClickSound();
        setSelectedWorldIndex(null);
      }
    } else if (selectedWorldIndex === null) {
      // Always stop propagation on paginated world list page for horizontal touches
      e.stopPropagation();
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  // Generate the 5 stages for the selected world
  const displayStages = React.useMemo(() => {
    if (selectedWorldIndex === null) return [];
    const worldStages: Stage[] = [];
    const startStageIndex = (selectedWorldIndex - 1) * 5 + 1;
    for (let i = startStageIndex; i < startStageIndex + 5; i++) {
      worldStages.push(generateStage(i));
    }
    return worldStages;
  }, [selectedWorldIndex]);

  const currentWorldName = selectedWorldIndex !== null 
    ? (WORLD_INFO[selectedWorldIndex - 1]?.name || "Mondo Magico") 
    : "Mappa Magica";

  const handleClaim = (achId: string) => {
    setClaimingId(achId);
    playFairyChorusSound();
    
    // Find stage to trigger confetti effects
    const stage = displayStages.find(s => s.id === achId);
    if (stage && stage.stageInWorld === 5) {
      // Firework effect for world completion
      import("canvas-confetti").then((confetti) => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          confetti.default(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
          confetti.default(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
      });
    }

    setTimeout(() => {
      onClaimAchievement(achId);
      setClaimingId(null);
      setSelectedMilestone(null);
    }, 1000);
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`w-full h-full min-h-0 flex-1 border-4 rounded-[2rem] p-4 shadow-sm relative overflow-hidden flex flex-col justify-between transition-all duration-500 ${
        selectedWorldIndex === null
          ? "bg-gradient-to-b from-[#FFFDF2] to-[#FFF3D6] border-[#FFE082]"
          : "bg-gradient-to-b from-[#EBF3FE] to-[#D0E2FC] border-[#90B8F8]"
      }`}
    >
      {/* Sparkles on corner */}
      <div className="absolute top-3 right-3 text-sm animate-pulse pointer-events-none">✨</div>
      <div className="absolute bottom-3 left-3 text-sm animate-pulse pointer-events-none">✨</div>

      {selectedWorldIndex === null ? (
        // WORLDS SELECTION VIEW (Show 10 worlds in 2 pages of 5)
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Paginated Header with Explicit Navigation Controls */}
          <div className="text-center mb-3 shrink-0 relative px-9 select-none">
            {/* Left page button */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setWorldsPage(prev => (prev === 1 ? 0 : 1));
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white hover:bg-amber-50 text-amber-800 border-2 border-amber-200 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-3xs"
              title="Pagina precedente"
            >
              <ChevronLeft size={16} strokeWidth={3} />
            </button>

            {/* Right page button */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setWorldsPage(prev => (prev === 0 ? 1 : 0));
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white hover:bg-amber-50 text-amber-800 border-2 border-amber-200 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-3xs"
              title="Pagina successiva"
            >
              <ChevronRight size={16} strokeWidth={3} />
            </button>

            <span className="text-[8.5px] bg-indigo-150 text-indigo-900 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider leading-none">
              Mondi delle Fiabe • Pagina {worldsPage + 1} di 2
            </span>
            <h4 className="font-extrabold text-[12px] text-natural-burgundy leading-tight mt-1 font-serif italic">
              {worldsPage === 0 ? "Regni Magici (1-5)" : "Regni Magici (6-10)"}
            </h4>
          </div>

          {/* Worlds List - scrollable */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-none min-h-0">
            {WORLD_INFO.map((world, index) => {
              const W = index + 1;
              const isPage1 = index < 5;
              const isCurrentPage = (worldsPage === 0 && isPage1) || (worldsPage === 1 && !isPage1);
              
              // Skip rendering if not on active page
              if (!isCurrentPage) return null;

              // Security block: a world is unlocked only if it's the first or if previous world is completed
              // Since each world has 5 stages and each stage requires 5 creations, completion requires W * 25 creations.
              const isWorldUnlocked = W === 1 || createdCount >= (W - 1) * 25;
              const isWorldCompleted = createdCount >= W * 25;
              const storiesInThisWorld = Math.max(0, Math.min(25, createdCount - (W - 1) * 25));
              const percentWorld = Math.round((storiesInThisWorld / 25) * 100);

              return (
                <button
                  key={W}
                  type="button"
                  onClick={() => {
                    if (isWorldUnlocked) {
                      playClickSound();
                      setSelectedWorldIndex(W);
                    }
                  }}
                  disabled={!isWorldUnlocked}
                  className={`w-full text-left p-3 rounded-2xl border-4 transition-all duration-300 relative flex items-center justify-between gap-3 ${
                    isWorldCompleted
                      ? "bg-gradient-to-r from-emerald-50/90 to-teal-50/80 border-emerald-300 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                      : isWorldUnlocked
                        ? "bg-white border-amber-300 shadow-xs cursor-pointer hover:scale-[1.01] active:scale-[0.99] hover:border-amber-400"
                        : "bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* World Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl border shrink-0 ${
                      isWorldCompleted
                        ? "bg-emerald-100 border-emerald-200"
                        : isWorldUnlocked
                          ? "bg-amber-100/60 border-amber-200"
                          : "bg-slate-100 border-slate-200"
                    }`}>
                      {world.emoji}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 leading-none">
                        <span className="text-[7.5px] font-black uppercase tracking-wider text-[#EC407A]">
                          Mondo {W}
                        </span>
                        {isWorldCompleted && (
                          <span className="text-[7.5px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-black uppercase">
                            Completo! 🏆
                          </span>
                        )}
                        {isWorldUnlocked && !isWorldCompleted && (
                          <span className="text-[7.5px] bg-sky-100 text-[#01579B] px-1.5 py-0.5 rounded-full font-black uppercase">
                            Attivo 🧭
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-[11px] text-natural-burgundy leading-tight mt-1 font-serif italic truncate">
                        {world.name}
                      </h4>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {isWorldUnlocked ? (
                      <div className="text-right font-mono shrink-0">
                        <span className="text-[8px] font-black text-slate-500 block leading-none">
                          {storiesInThisWorld}/25 Favole
                        </span>
                        <div className="w-14 bg-slate-150 h-1 rounded-full overflow-hidden mt-1 border border-slate-200/50">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isWorldCompleted ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${percentWorld}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-200 text-slate-500 p-1 rounded-full border border-white shadow-3xs">
                        <Lock size={10} strokeWidth={2.5} />
                      </div>
                    )}
                    {isWorldUnlocked && (
                      <ChevronRight size={14} className="text-slate-400 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dot Indicators */}
          <div className="flex items-center justify-center gap-2.5 my-2 shrink-0">
            <button
              type="button"
              onClick={() => { playClickSound(); setWorldsPage(0); }}
              className={`h-2.5 rounded-full transition-all duration-300 ${worldsPage === 0 ? "w-6 bg-amber-500" : "w-2.5 bg-slate-300 hover:bg-slate-400"}`}
              aria-label="Pagina 1"
            />
            <button
              type="button"
              onClick={() => { playClickSound(); setWorldsPage(1); }}
              className={`h-2.5 rounded-full transition-all duration-300 ${worldsPage === 1 ? "w-6 bg-amber-500" : "w-2.5 bg-slate-300 hover:bg-slate-400"}`}
              aria-label="Pagina 2"
            />
          </div>

          {/* Touch Gesture & Instructions Help */}
          <div className="bg-white/50 border border-amber-200/40 rounded-xl p-2 text-center mt-1 shrink-0">
            <p className="text-[8.5px] text-[#5D4037] font-black leading-normal uppercase tracking-wide">
              👉 Swipe (trascina) o tocca le frecce per girare pagina!
            </p>
          </div>
        </div>
      ) : (
        // SPECIFIC WORLD STAGES VIEW (Shows vertical stages path with dynamic blue gradient backdrop)
        <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
          {/* Header with back button */}
          <div className="flex items-center justify-between bg-white/70 border-2 border-[#90B8F8]/50 rounded-2xl px-3 py-1.5 mb-3 shrink-0 shadow-xs">
            <button
              onClick={() => { playClickSound(); setSelectedWorldIndex(null); }}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded-lg hover:bg-blue-50 text-[10px] font-black text-[#01579B] cursor-pointer shadow-3xs flex items-center gap-1 shrink-0 transition-colors"
            >
              ◀ Mondi
            </button>
            <div className="text-center min-w-0 flex-1 px-2 leading-none">
              <span className="text-[8px] bg-blue-100 text-[#01579B] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                Mondo {selectedWorldIndex}
              </span>
              <h4 className="font-extrabold text-[11px] text-natural-burgundy leading-tight mt-1 font-serif italic truncate">
                {currentWorldName}
              </h4>
            </div>
            <div className="w-14 shrink-0"></div> {/* Spacer for symmetry */}
          </div>

          {/* Vertical Stages Path */}
          <div className="flex-1 flex flex-col justify-between gap-2.5 my-1 min-h-0 relative z-10">
            {displayStages.map((ach) => {
              const currentTotal = createdCount; // Progress based on creation count
              const previousTarget = ach.targetCount - 5;
              const progressInStage = Math.max(0, Math.min(5, currentTotal - previousTarget));
              const isCompleted = progressInStage >= 5;
              const isUnlocked = currentTotal >= previousTarget;
              
              const isClaimed = isCompleted && claimedAchievements.includes(ach.id);
              const isClaimable = isCompleted && !claimedAchievements.includes(ach.id);

              return (
                <button
                  key={ach.id}
                  type="button"
                  onClick={() => { playClickSound(); setSelectedMilestone(ach); }}
                  className={`relative w-full flex-1 min-h-0 flex items-center justify-between px-4 py-1.5 rounded-2xl border-4 transition-all duration-300 shadow-xs cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
                    isClaimed
                      ? "bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-300"
                      : isClaimable
                        ? "bg-gradient-to-r from-amber-50/90 to-amber-150 border-amber-500 animate-pulse shadow-[0_0_12px_rgba(251,192,45,0.3)]"
                        : isUnlocked 
                          ? "bg-white border-[#81D4FA] shadow-[0_0_8px_rgba(129,212,250,0.15)]" 
                          : "bg-slate-100/90 border-slate-300 opacity-60"
                  }`}
                >
                  {/* Left Side: Stage Info and Icon */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-amber-100/40 rounded-xl flex items-center justify-center text-lg border border-amber-200 shrink-0">
                      {ach.icon}
                    </div>
                    <div className="text-left min-w-0">
                      <span className="text-[7.5px] font-extrabold text-natural-pink leading-none uppercase tracking-wider block">
                        Tappa {ach.stageInWorld}
                      </span>
                      <span className="text-[10px] font-black text-natural-burgundy font-serif italic mt-0.5 block truncate leading-none">
                        {ach.title}
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Progress Indicator & Action Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Progress */}
                    <span className="text-[8px] font-black font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200/50 leading-none">
                      {progressInStage}/5
                    </span>

                    {/* State Indicator */}
                    {isClaimed && (
                      <div className="bg-emerald-500 text-white p-0.5 rounded-full border border-white shadow-3xs shrink-0">
                        <CheckCircle2 size={10} />
                      </div>
                    )}
                    {isClaimable && (
                      <div className="bg-gradient-to-r from-natural-pink to-pink-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md border-2 border-white animate-bounce shadow-xs shrink-0">
                        🎁
                      </div>
                    )}
                    {isUnlocked && !isCompleted && (
                      <div className="bg-sky-100 text-[#01579B] p-0.5 rounded-full border border-white shadow-3xs shrink-0">
                        <span className="text-[8px] leading-none block font-black">🔓</span>
                      </div>
                    )}
                    {!isUnlocked && (
                      <div className="bg-slate-200 text-slate-500 p-0.5 rounded-full border border-white shadow-3xs shrink-0">
                        <Lock size={8} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Progress explanation & helpful hint (Compact) */}
          <div className="bg-white/60 border border-[#90B8F8]/40 rounded-xl p-2.5 text-center mt-2 shrink-0">
            <p className="text-[9.5px] text-slate-800 font-extrabold leading-normal">
              🌟 Crea nuove favole per viaggiare attraverso la mappa! <br />
              Ogni <span className="text-amber-700 font-black">Tappa completata (5 favole)</span> sblocca uno scrigno di ricompense! 🎁
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Detail Modal/Drawer */}
      {selectedMilestone && (() => {
        const currentTotal = createdCount;
        const previousTarget = selectedMilestone.targetCount - 5;
        const progressInStage = Math.max(0, Math.min(5, currentTotal - previousTarget));
        const isCompleted = progressInStage >= 5;
        const isUnlocked = currentTotal >= previousTarget;

        const isClaimed = isCompleted && claimedAchievements.includes(selectedMilestone.id);
        const isClaimable = isCompleted && !claimedAchievements.includes(selectedMilestone.id);

        return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-5 z-50 animate-fade-in">
          <div className="bg-white rounded-[2rem] border-4 border-amber-500 p-5 max-w-xs w-full text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedMilestone(null)}
              className="absolute -top-3.5 -right-3.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold w-11 h-11 flex items-center justify-center rounded-full border-4 border-white shadow-lg cursor-pointer z-50 transition-all"
              title="Chiudi"
            >
              <X size={18} strokeWidth={3} />
            </button>

            <div className="text-4xl animate-bounce">{selectedMilestone.icon}</div>

            <div className="space-y-1">
              <span className="text-[8px] bg-amber-100 text-amber-700 font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                {selectedMilestone.title}
              </span>
              <h4 className="text-sm font-extrabold text-natural-burgundy italic font-serif pt-1">
                {selectedMilestone.mapName}
              </h4>
              <p className="text-[10px] text-natural-text/80 font-bold">
                "{selectedMilestone.description}"
              </p>
            </div>

            {/* Completion Progress bar */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-left space-y-1">
              <div className="flex justify-between text-[8px] font-black text-theme-secondary">
                <span>Progresso Tappa</span>
                <span>
                  {progressInStage}/5
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden border">
                <div
                  className="bg-gradient-to-r from-amber-400 to-amber-600 h-full transition-all duration-500"
                  style={{
                    width: `${(progressInStage / 5) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* Action buttons with proper high contrast */}
            <div className="pt-1">
              {isClaimed ? (
                <div className="py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-extrabold flex items-center justify-center gap-1">
                  <CheckCircle2 size={12} /> Tappa completata e riscossa! 🎁
                </div>
              ) : isCompleted ? (
                <button
                  type="button"
                  onClick={() => handleClaim(selectedMilestone.id)}
                  disabled={!!claimingId}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-700 hover:brightness-105 active:scale-98 border-b-4 border-amber-900 text-white rounded-full text-[11px] font-black transition-all cursor-pointer shadow-md"
                >
                  {claimingId ? "Apertura scrigno... 🪄" : (selectedMilestone.stageInWorld === 5 ? "Riscatta GRANDE Ricompensa del Mondo! 🎆" : "Riscatta Ricompensa Segreta! 🎁")}
                </button>
              ) : isUnlocked ? (
                <div className="py-2 bg-sky-50 text-[#01579B] border border-sky-200 rounded-full text-[9px] font-black">
                  🔓 In corso... Crea altre favole!
                </div>
              ) : (
                <div className="py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[9px] font-bold">
                  🔒 Tappa ancora bloccata
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
