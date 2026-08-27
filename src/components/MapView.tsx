import React from "react";
import { ArrowLeft } from "lucide-react";
import FairyTaleMap from "./FairyTaleMap";
import { playClickSound } from "../utils/audio";

interface MapViewProps {
  claimedAchievements: string[];
  storiesCount: number;
  totalReadCount: number;
  onClaimAchievement: (id: string) => void;
  onBack: () => void;
}

export default function MapView({
  claimedAchievements,
  storiesCount,
  totalReadCount,
  onClaimAchievement,
  onBack
}: MapViewProps) {
  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden h-full min-h-0">
      {/* Back Header */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <button
          onClick={() => {
            playClickSound();
            onBack();
          }}
          id="btn-back-map"
          className="w-9 h-9 bg-white hover:bg-natural-pink-light text-natural-burgundy rounded-xl flex items-center justify-center border-2 border-natural-pink-border shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h3 className="text-base font-extrabold text-natural-burgundy font-serif leading-none">Mappa delle Fiabe</h3>
          <p className="text-[9px] text-[#EC407A] font-extrabold uppercase tracking-wider mt-0.5">La tua avventura magica</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center min-h-0">
        <FairyTaleMap
          claimedAchievements={claimedAchievements}
          createdCount={storiesCount}
          totalReadCount={totalReadCount}
          onClaimAchievement={onClaimAchievement}
        />
      </div>
    </div>
  );
}
