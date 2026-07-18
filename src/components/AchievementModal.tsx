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
  const [showRewards, setShowRewards] = useState(false);

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
      <div className={`rounded-[2.5rem] border-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)] w-full max-w-sm max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-300 ${
        isWorldCompletion
          ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-400"
          : "bg-[#FFFDE7] border-[#FFE082]"
      }`}>
        {/* Content Container */}
        <div className="relative p-8 space-y-6 text-center flex flex-col items-center justify-center">
          {/* Trophy Icon */}
          <div className="animate-bounce">
            <Trophy size={74} className="text-amber-600 mx-auto drop-shadow-lg" />
          </div>

          {/* Main Title */}
          <h2 className={`font-black text-center leading-tight ${
            isWorldCompletion 
              ? "text-amber-900 text-[1.8rem] font-serif" 
              : "text-[#F9A825] text-2xl font-serif"
          }`}>
            Hai completato la milestone {milestone}!
          </h2>

          {/* Tappa/Mondo Info */}
          <p className={`font-bold leading-snug ${
            isWorldCompletion
              ? "text-amber-900 text-lg"
              : "text-natural-burgundy text-base"
          }`}>
            {message}
          </p>

          {/* Animated Gift Box */}
          <div
            onClick={() => {
              playClickSound();
              setShowRewards(!showRewards);
            }}
            className="cursor-pointer mt-4"
          >
            <div className="relative">
              {/* Glowing effect */}
              <div className="absolute inset-0 bg-red-400/30 blur-2xl rounded-full scale-150 animate-pulse"></div>

              {/* Gift box emoji with bounce */}
              <div className={`text-8xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] relative z-10 transition-all ${
                showRewards ? "scale-95" : "animate-bounce hover:scale-110"
              }`}>
                🎁
              </div>
            </div>
          </div>

          {/* Rewards Section - Inline Inline */}
          {showRewards && (
            <div className={`w-full rounded-2xl border-4 p-5 animate-in fade-in zoom-in-95 duration-300 ${
              isWorldCompletion
                ? "bg-gradient-to-br from-amber-100 via-yellow-100 to-orange-100 border-amber-400"
                : "bg-gradient-to-br from-pink-100 to-rose-100 border-pink-300"
            }`}>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Gift size={20} className={isWorldCompletion ? "text-amber-700" : "text-pink-600"} />
                <span className={`text-sm font-black uppercase tracking-wider ${
                  isWorldCompletion ? "text-amber-800" : "text-pink-700"
                }`}>
                  {isWorldCompletion ? "Super Ricompense del Mondo" : "Tuo Regalo"}
                </span>
              </div>

              <div className={`grid gap-3 ${rewards.length > 1 ? "grid-cols-3" : "grid-cols-1"}`}>
                {rewards.map((reward, idx) => (
                  <div
                    key={`${reward.text}-${idx}`}
                    className={`rounded-xl border-2 p-3 text-center transform transition-all hover:scale-105 ${
                      isWorldCompletion
                        ? "bg-white/90 border-amber-300"
                        : "bg-white/90 border-pink-200"
                    }`}
                  >
                    <div className="text-3xl mb-2">{reward.emoji}</div>
                    <div className={`text-[12px] font-black leading-tight ${
                      isWorldCompletion ? "text-amber-900" : "text-pink-800"
                    }`}>
                      {reward.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auto-close after a delay if user clicks box */}
          {showRewards && (
            <div className="mt-4 text-[12px] font-bold text-slate-600">
              Tocca altrove per continuare
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      <div
        className="absolute inset-0 z-[250]"
        onClick={() => {
          playClickSound();
          onClaim();
        }}
        aria-hidden="true"
      />
    </div>
  );
}

