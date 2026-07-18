import React, { useState, useEffect } from "react";
import { Gift, Trophy } from "lucide-react";
import { playClickSound } from "../utils/audio";
import confetti from "canvas-confetti";
import { type AchievementReward } from "../utils/achievements";

interface AchievementModalProps {
  title: string;
  message: string;
  rewards: AchievementReward[];
  milestone: string;
  isWorldCompletion?: boolean;
  onClaim: () => void;
}

export default function AchievementModal({
  title,
  message,
  rewards,
  milestone,
  isWorldCompletion = false,
  onClaim
}: AchievementModalProps) {
  const [isOpened, setIsOpened] = useState(false);

  useEffect(() => {
    // Trigger confetti animation when box is opened
    if (isOpened) {
      confetti({
        particleCount: isWorldCompletion ? 260 : 150,
        spread: isWorldCompletion ? 110 : 80,
        origin: { y: 0.6 }
      });

      if (isWorldCompletion) {
        confetti({
          particleCount: 180,
          spread: 140,
          origin: { y: 0.72 }
        });
      }
    }
  }, [isOpened, isWorldCompletion]);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[300] animate-in fade-in">
      {!isOpened ? (
        // Closed Box State
        <div 
          onClick={() => {
            playClickSound();
            setIsOpened(true);
          }}
          className="cursor-pointer group flex flex-col items-center justify-center animate-bounce hover:animate-none hover:scale-105 transition-transform"
        >
          <div className="relative">
            {/* Glowing effect behind the box */}
            <div className="absolute inset-0 bg-yellow-400/30 blur-2xl rounded-full scale-150 animate-pulse"></div>
            
            {/* The Gift Box Emoji */}
            <div className="text-[120px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] relative z-10 transition-transform group-hover:rotate-3">
              🎁
            </div>
            
            <div className="absolute -top-4 -right-4 bg-red-500 text-white text-sm font-black px-3 py-1 rounded-full shadow-lg border-2 border-white animate-pulse z-20">
              Tocca!
            </div>
          </div>
          <p className="mt-6 text-xl font-black text-white text-center drop-shadow-md">
            Hai ricevuto un regalo!
          </p>
          <p className="text-amber-200/80 text-sm font-bold mt-2">
            Tocca la scatola per aprirla
          </p>
        </div>
      ) : (
        // Opened Box State
        <div className={`rounded-[2.5rem] border-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)] max-w-sm w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 ${
          isWorldCompletion
            ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-400"
            : "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300"
        }`}>
          {/* Animated Background Elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-0 w-40 h-40 bg-yellow-200/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-amber-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          {/* Content */}
          <div className="relative p-6 space-y-4 text-center flex flex-col items-center justify-center flex-1">
            {/* Trophy Icon with Animation */}
            <div className={isWorldCompletion ? "animate-bounce" : "animate-bounce"}>
              <Trophy size={isWorldCompletion ? 74 : 64} className="text-yellow-600 mx-auto" />
            </div>

            {/* Title */}
            <h2 className={`font-black text-amber-900 font-serif ${isWorldCompletion ? "text-[1.75rem]" : "text-2xl"}`}>
              {isWorldCompletion ? `MILESTONE ${milestone} COMPLETATA!` : `Hai completato la milestone ${milestone}!`}
            </h2>

            {/* Message */}
            <p className="text-sm font-bold text-amber-800 leading-relaxed">
              {title}: {message}
            </p>

            {/* Reward Box */}
            <div className={`rounded-2xl border-3 p-4 w-full mt-2 ${
              isWorldCompletion
                ? "bg-gradient-to-br from-amber-100 via-yellow-100 to-orange-100 border-amber-300"
                : "bg-gradient-to-br from-pink-100 to-rose-100 border-pink-300"
            }`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift size={16} className={isWorldCompletion ? "text-amber-700" : "text-pink-600"} />
                <span className={`text-xs font-black uppercase tracking-wider ${isWorldCompletion ? "text-amber-800" : "text-pink-700"}`}>
                  {isWorldCompletion ? "Super Ricompense del Mondo" : "Tuo Regalo"}
                </span>
              </div>
              <div className={`grid gap-2 ${rewards.length > 1 ? "grid-cols-3" : "grid-cols-1"}`}>
                {rewards.map((reward, idx) => (
                  <div
                    key={`${reward.text}-${idx}`}
                    className={`rounded-xl border p-2 text-center ${
                      isWorldCompletion
                        ? "bg-white/80 border-amber-300"
                        : "bg-white/80 border-pink-200"
                    }`}
                  >
                    <div className="text-2xl mb-1">{reward.emoji}</div>
                    <div className={`text-[11px] font-black leading-tight ${isWorldCompletion ? "text-amber-900" : "text-pink-800"}`}>
                      {reward.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Claim Button (Chiudi) */}
            <button
              onClick={() => {
                playClickSound();
                onClaim();
              }}
              className="mt-2 w-full py-4 px-4 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black text-lg rounded-2xl transition-all cursor-pointer shadow-lg"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

