import React, { useState, useEffect } from "react";
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
  const [isOpened, setIsOpened] = useState(false);

  useEffect(() => {
    // Trigger confetti animation when box is opened
    if (isOpened) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [isOpened]);

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
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-[2.5rem] border-4 border-yellow-300 shadow-[0_20px_60px_rgba(0,0,0,0.4)] max-w-sm w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
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
              Hai completato la tappa {milestone}!
            </h2>

            {/* Message */}
            <p className="text-sm font-bold text-amber-800 leading-relaxed">
              {title}: {message}
            </p>

            {/* Reward Box */}
            <div className="bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl border-3 border-pink-300 p-4 w-full mt-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift size={16} className="text-pink-600" />
                <span className="text-xs font-black uppercase tracking-wider text-pink-700">Tuo Regalo:</span>
              </div>
              <div className="text-5xl mb-3 text-center drop-shadow-sm">{rewardEmoji}</div>
              <div className="text-sm font-black text-pink-800 text-center">{reward}</div>
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

