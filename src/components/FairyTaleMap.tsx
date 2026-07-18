import React, { useState } from "react";
import { Trophy, Lock, CheckCircle2, ChevronRight, Gift, HelpCircle, X } from "lucide-react";
import { playFairyChorusSound } from "../utils/audio";
import { Stage, getVisibleStages } from "../utils/stages";

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

  const stages = getVisibleStages(createdCount);

  const handleClaim = (achId: string) => {
    setClaimingId(achId);
    playFairyChorusSound();
    const stage = stages.find(s => s.id === achId);
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
    <div className="w-full bg-linear-to-b from-amber-50 to-amber-100 border-4 border-natural-yellow-light rounded-[2rem] p-4 shadow-sm relative overflow-hidden shrink-0">
      {/* Sparkles on corner */}
      <div className="absolute top-3 right-3 text-sm animate-pulse">✨</div>
      <div className="absolute bottom-3 left-3 text-sm animate-pulse">✨</div>

      {/* Map Header */}
      <div className="flex items-center gap-2 border-b-2 border-amber-200/50 pb-2.5 mb-5 shrink-0">
        <Trophy className="text-amber-600 shrink-0 animate-bounce" size={18} />
        <div className="text-left">
          <h4 className="font-extrabold text-xs text-natural-burgundy leading-none">Mappa delle Fiabe Magiche</h4>
          <p className="text-[8.5px] text-natural-pink font-black uppercase tracking-wider mt-0.5">Il tuo sentiero dei sogni</p>
        </div>
      </div>

      {/* Scrollable Map Path Container */}
      <div className="px-1 py-2 relative">
        {/* Winding connecting line behind */}
        <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-12 w-1.5 bg-dashed border-l-4 border-dashed border-amber-300/70 z-0"></div>
        <div className="flex flex-col gap-8 relative z-10">
          {stages.map((ach, index) => {
            const currentTotal = createdCount; // Using createdCount as progress metric
            const previousTarget = ach.targetCount - 5;
            const progressInStage = Math.max(0, Math.min(5, currentTotal - previousTarget));
            const isCompleted = progressInStage >= 5;
            const isUnlocked = currentTotal >= previousTarget;
            
            const isClaimed = isCompleted && claimedAchievements.includes(ach.id);
            const isClaimable = isCompleted && !claimedAchievements.includes(ach.id);
            
            const isFirstInWorld = ach.stageInWorld === 1;
            const worldIndex = ach.worldIndex;
            const worldName = ach.worldName;

            // Stagger nodes alternating left / center-ish / right
            const alignClass = index % 2 === 0 ? "justify-start pr-12" : "justify-end pl-12";
            const isLeft = index % 2 === 0;

            return (
              <React.Fragment key={ach.id}>
                {isFirstInWorld && (
                  <div className="w-full py-2 px-3 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 rounded-2xl border-2 border-indigo-400 shadow-md text-center relative my-2 z-20">
                    <h5 className="font-extrabold text-[10px] text-white uppercase tracking-widest flex items-center justify-center gap-1">
                      🗺️ MONDO {worldIndex}: <span className="font-serif italic font-black text-xs text-amber-200">{worldName}</span>
                    </h5>
                  </div>
                )}
                <div className={`flex ${alignClass} items-center relative w-full`}>
                  
                  {/* Visual Connection Pin pointing to center line */}
                  <div className={`absolute top-1/2 -translate-y-1/2 w-8 h-0.5 border-t-2 border-dashed border-amber-300/80 hidden sm:block ${
                    isLeft ? "left-1/2" : "right-1/2"
                  }`} />

                  {/* The Milestone Node */}
                  <button
                    type="button"
                    onClick={() => setSelectedMilestone(ach)}
                    className={`relative p-3 rounded-2xl border-4 max-w-[170px] text-left transition-all duration-300 shadow-md ${
                      isClaimed
                        ? "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300 hover:scale-103 cursor-pointer"
                        : isClaimable
                          ? "bg-gradient-to-br from-amber-50 to-amber-200 border-amber-500 animate-button-blink hover:scale-105 cursor-pointer shadow-[0_0_15px_rgba(253,216,53,0.4)]"
                          : isUnlocked 
                            ? "bg-white border-sky-300 opacity-100 hover:scale-102 cursor-pointer shadow-[0_0_10px_rgba(129,212,250,0.5)]" 
                            : "bg-slate-100/90 border-slate-300 opacity-60 cursor-pointer"
                    }`}
                  >
                    {/* Lock badge if locked */}
                    {!isUnlocked && (
                      <div className="absolute -top-2.5 -right-2.5 bg-slate-300 text-slate-600 p-1 rounded-full border-2 border-white shadow-xs">
                        <Lock size={9} />
                      </div>
                    )}
                    {/* Open lock if unlocked but not completed */}
                    {isUnlocked && !isCompleted && (
                      <div className="absolute -top-2.5 -right-2.5 bg-sky-100 text-sky-600 p-1 rounded-full border-2 border-white shadow-xs">
                        <Lock size={9} className="opacity-0 hidden" />
                        <span className="text-[10px] leading-none block font-black">🔓</span>
                      </div>
                    )}

                    {/* Claimable gift box bounce */}
                    {isClaimable && (
                      <div className="absolute -top-3.5 -right-3 px-1.5 py-0.5 bg-gradient-to-r from-natural-pink to-pink-600 text-white text-[8px] font-black uppercase rounded-full border-2 border-white animate-bounce shadow-md">
                        Apri 🎁
                      </div>
                    )}

                    {/* Claimed check badge */}
                    {isClaimed && (
                      <div className="absolute -top-2.5 -right-2.5 bg-emerald-500 text-white p-0.5 rounded-full border-2 border-white shadow-xs">
                        <CheckCircle2 size={10} />
                      </div>
                    )}

                    {/* Step label */}
                    <p className="text-[7.5px] font-black uppercase text-natural-text/50 tracking-wider">
                      {ach.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xl shrink-0">{ach.icon}</span>
                      <div className="min-w-0">
                        <h5 className={`text-[10px] font-black leading-tight truncate ${
                          isClaimed ? "text-emerald-800" : isCompleted ? "text-amber-800" : isUnlocked ? "text-sky-800" : "text-slate-500"
                        }`}>
                          {worldName}
                        </h5>
                        <span className="text-[7.5px] font-bold font-mono text-slate-500 bg-white/70 px-1 py-0.2 rounded mt-0.5 inline-block">
                          {progressInStage}/5 Favole
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Dynamic Detail Modal/Drawer */}
      {selectedMilestone && (() => {
        const currentTotal = createdCount;
        const previousTarget = selectedMilestone.targetCount - 5;
        const progressInStage = Math.max(0, Math.min(5, currentTotal - previousTarget));
        const isCompleted = progressInStage >= 5;
        const isUnlocked = currentTotal >= previousTarget;

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
              <div className="flex justify-between text-[8px] font-black text-slate-500">
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

            {/* Action buttons */}
            <div className="pt-1">
              {isCompleted && claimedAchievements.includes(selectedMilestone.id) ? (
                <div className="py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-extrabold flex items-center justify-center gap-1">
                  <CheckCircle2 size={12} /> Tappa completata e riscossa! 🎁
                </div>
              ) : isCompleted ? (
                <button
                  type="button"
                  onClick={() => handleClaim(selectedMilestone.id)}
                  disabled={!!claimingId}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 hover:brightness-105 active:scale-98 border-b-4 border-amber-800 text-slate-900 rounded-full text-[11px] font-black transition-transform cursor-pointer"
                >
                  {claimingId ? "Apertura scrigno... 🪄" : (selectedMilestone.stageInWorld === 5 ? "Riscatta GRANDE Ricompensa del Mondo! 🎆" : "Riscatta Ricompensa Segreta! 🎁")}
                </button>
              ) : isUnlocked ? (
                <div className="py-2 bg-sky-50 text-sky-600 border border-sky-200 rounded-full text-[9px] font-bold">
                  🔓 In corso... Crea altre favole!
                </div>
              ) : (
                <div className="py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-full text-[9px] font-bold">
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
