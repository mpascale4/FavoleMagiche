import React, { useEffect } from "react";
import { Sparkles, Gift, Trophy } from "lucide-react";
import { playClickSound } from "../utils/audio";
import confetti from "canvas-confetti";

interface AchievementModalProps {
  title: string;
  message: string;
  reward: string;
  rewardEmoji: string;
  milestone: number;
  onClaim: () => void;
}

export default function AchievementModal({
  title,
  message,
  reward,
  rewardEmoji,
  milestone,
  onClaim
}: AchievementModalProps) {
  useEffect(() => {
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[300] animate-in fade-in">
      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-[2.5rem] border-4 border-yellow-300 shadow-[0_20px_60px_rgba(0,0,0,0.4)] max-w-sm w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-40 h-40 bg-yellow-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-amber-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Content */}
        <div className="relative p-6 space-y-4 text-center flex flex-col items-center justify-center flex-1">
          {/* Trophy Icon with Animation */}
          <div className="animate-bounce">
            <Trophy size={64} className="text-yellow-600 mx-auto" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-black text-amber-900 font-serif">
            {title}
          </h2>

          {/* Message */}
          <p className="text-sm font-bold text-amber-800 leading-relaxed">
            {message}
          </p>

          {/* Milestone Badge */}
          <div className="bg-white rounded-2xl border-3 border-yellow-300 px-5 py-3 shadow-md">
            <div className="text-xs font-black uppercase tracking-wider text-yellow-700 mb-1">
              <Sparkles size={14} className="inline mr-1" />
              Traguardo Raggiunto!
            </div>
            <div className="text-3xl font-black text-amber-900">
              {milestone} Storie 📚
            </div>
          </div>

          {/* Reward Box */}
          <div className="bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl border-3 border-pink-300 p-4 w-full">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift size={16} className="text-pink-600" />
              <span className="text-xs font-black uppercase tracking-wider text-pink-700">Tuo Regalo:</span>
            </div>
            <div className="text-4xl mb-2 text-center">{rewardEmoji}</div>
            <div className="text-sm font-black text-pink-800 text-center">{reward}</div>
          </div>

          {/* Claim Button */}
          <button
            onClick={() => {
              playClickSound();
              onClaim();
            }}
            className="w-full py-4 px-4 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 active:scale-95 text-amber-900 font-black text-lg rounded-2xl transition-all cursor-pointer border-b-4 border-amber-700 shadow-lg"
          >
            ✨ Ricevi il Regalo! ✨
          </button>
        </div>
      </div>
    </div>
  );
}

