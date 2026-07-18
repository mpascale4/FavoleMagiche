import React, { useState, useMemo } from "react";
import { ArrowLeft, Sparkles, BookOpen, Heart, Award, Star } from "lucide-react";
import { Story } from "../types";
import { playClickSound } from "../utils/audio";

interface GrowthTreeProps {
  stories: Story[];
  onBack: () => void;
}

const THEME_TREES = [
  { theme: "Amicizia", icon: "🤝", color: "#EC407A", bgGradient: "from-pink-100 to-rose-200", leafColor: "#F48FB1", decoration: "💖", desc: "Ogni gesto d'affetto fa crescere rami forti d'unione." },
  { theme: "Coraggio", icon: "🦁", color: "#FF9800", bgGradient: "from-amber-100 to-orange-200", leafColor: "#FFCC80", decoration: "⭐", desc: "La fiducia in te stesso illumina la chioma come calde stelle." },
  { theme: "Gentilezza", icon: "🌸", color: "#4CAF50", bgGradient: "from-emerald-100 to-green-200", leafColor: "#A5D6A7", decoration: "🌸", desc: "La cura verso gli altri fa sbocciare splendidi petali profumati." },
  { theme: "Rispetto", icon: "🙏", color: "#2196F3", bgGradient: "from-blue-100 to-cyan-200", leafColor: "#90CAF9", decoration: "🕊️", desc: "L'ascolto e la comprensione fanno scendere radici stabili e profonde." },
  { theme: "Collaborazione", icon: "🐝", color: "#9C27B0", bgGradient: "from-purple-100 to-indigo-200", leafColor: "#CE93D8", decoration: "🍎", desc: "Il lavoro di squadra appende frutti d'oro pronti per essere divisi." }
];

export default function GrowthTree({ stories, onBack }: GrowthTreeProps) {
  const [selectedTheme, setSelectedTheme] = useState("Gentilezza");

  // Calculate stats
  const themeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Amicizia: 0,
      Coraggio: 0,
      Gentilezza: 0,
      Rispetto: 0,
      Collaborazione: 0
    };
    
    stories.forEach(s => {
      const t = s.temaEducativo;
      if (counts[t] !== undefined) {
        // Count story creation + times read
        counts[t] += 1 + (s.volteLetta || 0);
      }
    });

    return counts;
  }, [stories]);

  const activeTreeInfo = useMemo(() => {
    return THEME_TREES.find(t => t.theme === selectedTheme) || THEME_TREES[2];
  }, [selectedTheme]);

  const readCount = themeCounts[selectedTheme] || 0;

  // Determine stage (0 to 4)
  const growthStage = useMemo(() => {
    if (readCount === 0) return 0;
    if (readCount === 1) return 1;
    if (readCount <= 3) return 2;
    if (readCount <= 5) return 3;
    return 4; // 6+ is fully bloomed!
  }, [readCount]);

  const stageDetails = [
    { name: "Seme d'Oro 🌱", message: "La terra magica accoglie il seme d'oro. Leggi o crea una storia di questo tema per vederlo spuntare!", percent: 5 },
    { name: "Germoglio 🌱", message: "Splendido! Sta spuntando una tenera fogliolina dorata. Continua a leggere!", percent: 25 },
    { name: "Arboscello 🌿", message: "Il tuo albero si sta allungando verso il sole con i primi rami verdi!", percent: 50 },
    { name: "Albero Rigoglioso 🌳", message: "Un albero forte e pieno di foglie sane! Manca pochissimo alla fioritura!", percent: 75 },
    { name: "Fioritura Splendente! 🌸✨", message: "Incredibile! Il tuo Albero della virtù è fiorito e risplende di pura magia!", percent: 100 }
  ][growthStage];

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#FFFDF0] to-[#FFF9E6] p-4 font-sans select-none overflow-y-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-amber-200/50 shrink-0 mb-4">
        <button
          onClick={() => { playClickSound(); onBack(); }}
          className="p-2.5 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="text-center">
          <h2 className="font-extrabold text-sm text-natural-burgundy leading-none flex items-center gap-1 justify-center">
            🌳 Albero della Crescita
          </h2>
          <p className="text-[9px] text-[#EC407A] font-black uppercase tracking-wider mt-0.5">Le tue statistiche di lettura</p>
        </div>
        <div className="w-10"></div> {/* Spacer for symmetry */}
      </div>

      {/* Tabs Selector for Themes */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 pt-1 scrollbar-none shrink-0">
        {THEME_TREES.map(t => {
          const count = themeCounts[t.theme] || 0;
          const isSelected = selectedTheme === t.theme;
          return (
            <button
              key={t.theme}
              onClick={() => setSelectedTheme(t.theme)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border-2 text-xs font-black transition-all cursor-pointer shrink-0 shadow-xs ${
                isSelected
                  ? "bg-white text-natural-burgundy scale-103 shadow-md"
                  : "bg-slate-50/70 border-slate-200/60 text-theme-secondary hover:bg-slate-100/80"
              }`}
              style={{ borderColor: isSelected ? t.color : undefined }}
            >
              <span className="text-base">{t.icon}</span>
              <div className="text-left leading-none">
                <span className="block text-[10px]">{t.theme}</span>
                <span className="text-[7.5px] font-mono text-theme-secondary font-extrabold">XP: {count}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Magic Growth Canvas Section */}
      <div className="flex-1 bg-white rounded-3xl border-4 border-[#FFE082] shadow-sm relative overflow-hidden flex flex-col md:flex-row min-h-[340px]">
        {/* Sky Background & Canvas */}
        <div className={`flex-1 relative bg-gradient-to-b ${activeTreeInfo.bgGradient} p-4 flex flex-col items-center justify-center min-h-[220px]`}>
          
          {/* Floating magical clouds */}
          <div className="absolute top-4 left-6 bg-white/40 backdrop-blur-xs px-3 py-1 rounded-full text-[9px] font-bold text-theme-secondary flex items-center gap-1 shadow-xs animate-pulse">
            ☁️ Cielo Fatato
          </div>

          <div className="absolute top-4 right-6 bg-white/75 border border-amber-200 shadow-xs rounded-2xl px-2.5 py-1 text-center font-black">
            <span className="text-[7px] text-theme-secondary uppercase block leading-none">Punti Virtù</span>
            <span className="text-xs font-mono text-natural-burgundy">{readCount} ✨</span>
          </div>

          {/* SVG Growth Tree Render */}
          <div className="w-44 h-44 relative mt-2 flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
              <defs>
                <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8D6E63" />
                  <stop offset="50%" stopColor="#795548" />
                  <stop offset="100%" stopColor="#5D4037" />
                </linearGradient>
                <radialGradient id="canopyGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={activeTreeInfo.leafColor} />
                  <stop offset="100%" stopColor={activeTreeInfo.color} />
                </radialGradient>
              </defs>

              {/* Ground level */}
              <ellipse cx="100" cy="180" rx="70" ry="12" fill="#81C784" opacity="0.9" />
              <ellipse cx="100" cy="180" rx="55" ry="8" fill="#66BB6A" />

              {/* Stage 0: Golden Seed under the earth */}
              {growthStage === 0 && (
                <g className="animate-pulse">
                  <circle cx="100" cy="176" r="6" fill="#FFD54F" stroke="#FFB300" strokeWidth="1.5" />
                  <path d="M100,170 Q105,165 100,160 Q95,165 100,170" fill="#AED581" />
                  <text x="100" y="152" textAnchor="middle" fontSize="9" fontWeight="900" fill="#795548">SEMINATO</text>
                </g>
              )}

              {/* Stage 1: Little golden sprout breaking ground */}
              {growthStage === 1 && (
                <g>
                  {/* Stem */}
                  <path d="M100,180 Q100,165 103,155" stroke="url(#trunkGrad)" strokeWidth="4" fill="none" strokeLinecap="round" />
                  {/* Small leaf left */}
                  <path d="M103,155 Q93,150 95,142 Q105,148 103,155" fill="#81C784" stroke="#4CAF50" strokeWidth="1" />
                  {/* Small leaf right */}
                  <path d="M103,155 Q113,152 111,144 Q101,148 103,155" fill="#A5D6A7" stroke="#4CAF50" strokeWidth="1" />
                  {/* Glowing sparkle */}
                  <circle cx="103" cy="138" r="1.5" fill="#FFF" className="animate-ping" />
                </g>
              )}

              {/* Stage 2: Young sapling */}
              {growthStage === 2 && (
                <g>
                  {/* Trunk and branches */}
                  <path d="M100,180 Q100,150 102,130" stroke="url(#trunkGrad)" strokeWidth="6" fill="none" strokeLinecap="round" />
                  <path d="M100,155 Q90,145 88,138" stroke="url(#trunkGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M101,145 Q112,135 114,128" stroke="url(#trunkGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
                  
                  {/* Foilages */}
                  <circle cx="88" cy="135" r="12" fill="url(#canopyGrad)" opacity="0.9" />
                  <circle cx="114" cy="125" r="11" fill="url(#canopyGrad)" opacity="0.9" />
                  <circle cx="102" cy="122" r="14" fill="url(#canopyGrad)" />
                </g>
              )}

              {/* Stage 3: Growing healthy tree */}
              {growthStage === 3 && (
                <g className="animate-wind-sway" style={{ transformOrigin: "100px 180px" }}>
                  {/* Heavy trunk */}
                  <path d="M100,180 Q100,140 100,110" stroke="url(#trunkGrad)" strokeWidth="9" fill="none" strokeLinecap="round" />
                  <path d="M100,140 Q85,120 78,110" stroke="url(#trunkGrad)" strokeWidth="5" fill="none" strokeLinecap="round" />
                  <path d="M100,130 Q115,115 120,105" stroke="url(#trunkGrad)" strokeWidth="5" fill="none" strokeLinecap="round" />

                  {/* Canopies */}
                  <circle cx="78" cy="105" r="22" fill="url(#canopyGrad)" opacity="0.9" />
                  <circle cx="120" cy="100" r="20" fill="url(#canopyGrad)" opacity="0.9" />
                  <circle cx="100" cy="95" r="28" fill="url(#canopyGrad)" />
                  
                  {/* Some green leaves floating */}
                  <path d="M80,105 Q70,95 72,90 Q82,95 80,105" fill="#81C784" />
                  <path d="M115,95 Q125,85 127,90 Q117,100 115,95" fill="#81C784" />
                </g>
              )}

              {/* Stage 4: Majestic Bloomed Tree with cherry blossoms, golden apples, or stars! */}
              {growthStage === 4 && (
                <g className="animate-wind-sway" style={{ transformOrigin: "100px 180px" }}>
                  {/* Glorious Trunk */}
                  <path d="M100,180 Q100,135 100,95" stroke="url(#trunkGrad)" strokeWidth="12" fill="none" strokeLinecap="round" />
                  <path d="M100,135 Q80,110 70,100" stroke="url(#trunkGrad)" strokeWidth="7" fill="none" strokeLinecap="round" />
                  <path d="M100,120 Q120,100 128,90" stroke="url(#trunkGrad)" strokeWidth="7" fill="none" strokeLinecap="round" />
                  <path d="M100,105 Q90,85 85,80" stroke="url(#trunkGrad)" strokeWidth="5" fill="none" strokeLinecap="round" />

                  {/* Gigantic Canopies */}
                  <circle cx="70" cy="95" r="28" fill="url(#canopyGrad)" opacity="0.95" />
                  <circle cx="128" cy="85" r="26" fill="url(#canopyGrad)" opacity="0.95" />
                  <circle cx="95" cy="72" r="34" fill="url(#canopyGrad)" />

                  {/* Theme decorations/fruits/blooms scattered on canopy */}
                  <g className="animate-pulse">
                    {/* Position 1 */}
                    <text x="65" y="90" fontSize="14" textAnchor="middle">{activeTreeInfo.decoration}</text>
                    {/* Position 2 */}
                    <text x="125" y="85" fontSize="14" textAnchor="middle">{activeTreeInfo.decoration}</text>
                    {/* Position 3 */}
                    <text x="95" y="65" fontSize="15" textAnchor="middle">{activeTreeInfo.decoration}</text>
                    {/* Position 4 */}
                    <text x="80" y="78" fontSize="12" textAnchor="middle">{activeTreeInfo.decoration}</text>
                    {/* Position 5 */}
                    <text x="112" y="74" fontSize="12" textAnchor="middle">{activeTreeInfo.decoration}</text>
                    {/* Position 6 */}
                    <text x="100" y="92" fontSize="13" textAnchor="middle">{activeTreeInfo.decoration}</text>
                  </g>
                  
                  {/* Sparkle circles around canopy */}
                  <circle cx="95" cy="40" r="2" fill="#FFF" className="animate-ping" />
                  <circle cx="60" cy="65" r="1.5" fill="#FFF" className="animate-ping" />
                  <circle cx="135" cy="55" r="2.5" fill="#FFF" className="animate-ping" />
                </g>
              )}
            </svg>

            {/* Stage title floating above tree */}
            <div className="absolute bottom-2 bg-[#FFFDE7]/90 border border-amber-300 rounded-full px-3 py-0.5 text-[9px] font-black text-amber-800 shadow-xs uppercase tracking-wide">
              {stageDetails.name}
            </div>
          </div>
        </div>

        {/* Tree Stats & Information Text Box */}
        <div className="w-full md:w-56 p-4 border-t-2 md:border-t-0 md:border-l-2 border-[#FFE082]/60 flex flex-col justify-center space-y-3.5">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-xs font-black text-natural-burgundy tracking-wide uppercase flex items-center gap-1 justify-center md:justify-start">
              <span className="text-sm">{activeTreeInfo.icon}</span> Albero della {selectedTheme}
            </h3>
            <p className="text-[10px] text-theme-secondary font-bold leading-tight">
              {activeTreeInfo.desc}
            </p>
          </div>

          {/* Progress bar */}
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100/80 space-y-1">
            <div className="flex justify-between text-[7.5px] font-black text-theme-secondary uppercase">
              <span>Livello di Fioritura</span>
              <span>{stageDetails.percent}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-500"
                style={{ width: `${stageDetails.percent}%` }}
              />
            </div>
            <p className="text-[8px] font-medium text-theme-secondary text-center pt-0.5">
              Stato: <span className="font-extrabold text-[#EC407A]">{stageDetails.name}</span>
            </p>
          </div>

          <div className="bg-amber-50/70 p-2.5 rounded-2xl border border-amber-100/50">
            <p className="text-[9px] text-theme-secondary font-black leading-normal text-center md:text-left">
              "{stageDetails.message}"
            </p>
          </div>
        </div>
      </div>

      {/* Motivational Bottom Bar */}
      <div className="mt-4 bg-white/60 border border-amber-200 rounded-2xl p-2.5 flex items-center gap-3 shrink-0">
        <div className="bg-gradient-to-r from-amber-400 to-[#FFB300] text-slate-800 p-1.5 rounded-xl shrink-0">
          <Award size={14} />
        </div>
        <p className="text-[8.5px] text-natural-burgundy font-bold leading-normal">
          In totale hai accumulato <span className="font-extrabold text-[#EC407A]">{stories.length} storie magiche</span> e <span className="font-extrabold text-[#EC407A]">{stories.reduce((acc, s) => acc + (s.volteLetta || 0), 0)} letture</span>. Continua a coltivare il tuo giardino fantastico! 🌱📖
        </p>
      </div>
    </div>
  );
}
