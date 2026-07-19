import React, { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Sparkles, BookOpen, Heart, Award, Star, Play, X } from "lucide-react";
import { Story } from "../types";
import { playClickSound, playFruitCollectSound, playBugShooSound, playGameFailSound, playGameWinSound } from "../utils/audio";

interface GrowthTreeProps {
  stories: Story[];
  onBack: () => void;
}

const getThemePreposition = (theme: string) => {
  switch (theme.toLowerCase()) {
    case 'amicizia': return "dell'amicizia";
    case 'coraggio': return "del coraggio";
    case 'gentilezza': return "della gentilezza";
    case 'rispetto': return "del rispetto";
    case 'collaborazione': return "della collaborazione";
    default: return `della ${theme.toLowerCase()}`;
  }
};

const THEME_TREES = [
  { theme: "Amicizia", icon: "🤝", color: "#EC407A", bgGradient: "from-pink-100 to-rose-200", leafColor: "#F48FB1", decoration: "💖", enemies: ["💔", "🌩️", "🌧️", "🦇", "🕷️"], desc: "Ogni gesto d'affetto fa crescere rami forti d'unione." },
  { theme: "Coraggio", icon: "🦁", color: "#FF9800", bgGradient: "from-amber-100 to-orange-200", leafColor: "#FFCC80", decoration: "⭐", enemies: ["☄️", "🌑", "👻", "👾", "🐉"], desc: "La fiducia in te stesso illumina la chioma come calde stelle." },
  { theme: "Gentilezza", icon: "🌸", color: "#4CAF50", bgGradient: "from-emerald-100 to-green-200", leafColor: "#A5D6A7", decoration: "🌸", enemies: ["🐛", "🥀", "🦂", "🕸️", "🦟"], desc: "La cura verso gli altri fa sbocciare splendidi petali profumati." },
  { theme: "Rispetto", icon: "🙏", color: "#2196F3", bgGradient: "from-blue-100 to-cyan-200", leafColor: "#90CAF9", decoration: "🕊️", enemies: ["🦅", "🌪️", "⚡", "🌋", "🔥"], desc: "L'ascolto e la comprensione fanno scendere radici stabili e profonde." },
  { theme: "Collaborazione", icon: "🐝", color: "#9C27B0", bgGradient: "from-purple-100 to-indigo-200", leafColor: "#CE93D8", decoration: "🍎", enemies: ["🐛", "🪱", "🐌", "🦗", "🐜"], desc: "Il lavoro di squadra appende frutti d'oro pronti per essere divisi." }
];

export default function GrowthTree({ stories, onBack }: GrowthTreeProps) {
  const [selectedTheme, setSelectedTheme] = useState("Gentilezza");
  const [previewStage, setPreviewStage] = useState<number | null>(null);
  
  // Game states
  const [gameState, setGameState] = useState<'idle' | 'intro' | 'playing' | 'gameover' | 'won'>('idle');
  const [activeTargets, setActiveTargets] = useState<{id: number, type: 'fruit'|'bug', x: number, y: number, speedX: number, speedY: number, char: string}[]>([]);
  const [targetsLeft, setTargetsLeft] = useState(10);
  const [gameLevel, setGameLevel] = useState(1);
  const [gameMessage, setGameMessage] = useState("");

  const [spentCredits, setSpentCredits] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('magic_tree_credits_spent');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('magic_tree_credits_spent', JSON.stringify(spentCredits));
  }, [spentCredits]);

  const earnedCredits = useMemo(() => {
    return stories.filter(s => s.temaEducativo === selectedTheme).length * 5;
  }, [stories, selectedTheme]);

  const availableCredits = Math.max(0, earnedCredits - (spentCredits[selectedTheme] || 0));

  useEffect(() => {
    setPreviewStage(null);
    setGameState('idle');
    setTargetsLeft(10);
    setGameLevel(1);
    setGameMessage("");
    setActiveTargets([]);
  }, [selectedTheme]);

  // Prevent scrolling when game is active
  useEffect(() => {
    if (gameState !== 'idle') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [gameState]);

  const startGame = (costCredit: boolean = true) => {
    if (costCredit) {
      if (availableCredits <= 0) return;
      setSpentCredits(prev => ({ ...prev, [selectedTheme]: (prev[selectedTheme] || 0) + 1 }));
    }
    setGameState('playing');
    setTargetsLeft(10);
    setActiveTargets([]);
    setGameMessage("");
    playClickSound();
  };

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
  const actualGrowthStage = useMemo(() => {
    if (readCount === 0) return 0;
    if (readCount <= 4) return 1;
    if (readCount <= 9) return 2;
    if (readCount <= 14) return 3;
    return 4; // 15+ is fully bloomed!
  }, [readCount]);

  const growthStage = gameState !== 'idle' ? 4 : (previewStage !== null ? previewStage : actualGrowthStage);
  const collectedCount = gameState !== 'idle' ? Math.max(0, 10 - targetsLeft) : 10;

  // Game Logic Effect
  // Spawn logic
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Faster spawn based on required clicks (level proxy)
    const spawnRate = Math.max(800, 1500 - (gameLevel - 1) * 100);

    const spawnInterval = setInterval(() => {
      setActiveTargets(prev => {
        if (prev.length >= (3 + Math.floor(gameLevel * 0.5))) return prev; // Increase max targets with level

        const isBug = Math.random() > 0.6;
        
        let x, y, speedX, speedY, char;
        
        // Base speed based on required clicks
        const baseSpeed = 1 + (gameLevel - 1) * 0.05;

        if (isBug) {
          // Bug from left or right
          const fromLeft = Math.random() > 0.5;
          x = fromLeft ? -20 : 220;
          y = 30 + Math.random() * 110; // random height around canopy
          
          let targetY = 100;
          if (growthStage === 0) targetY = 176;
          else if (growthStage === 1) targetY = 145;
          else if (growthStage === 2) targetY = 125;
          else if (growthStage === 3) targetY = 90;
          else if (growthStage === 4) targetY = 70;
          
          const distanceX = 100 - x;
          const distanceY = targetY - y;
          const travelTime = Math.abs(distanceX) / (1.5 * baseSpeed);
          
          speedX = fromLeft ? (1.5 * baseSpeed) : (-1.5 * baseSpeed);
          speedY = distanceY / travelTime;
          char = activeTreeInfo.enemies[Math.floor(Math.random() * activeTreeInfo.enemies.length)];
        } else {
          // Fruit from top
          x = 40 + Math.random() * 120; // random x above canopy
          y = -20;
          speedX = 0;
          speedY = 1.5 * baseSpeed;
          char = activeTreeInfo.decoration;
        }

        const newItem = {
          id: Date.now() + Math.random(),
          type: isBug ? 'bug' : 'fruit',
          char, x, y, speedX, speedY
        };

        return [...prev, newItem];
      });
    }, spawnRate);

    return () => clearInterval(spawnInterval);
  }, [gameState, gameLevel, activeTreeInfo.decoration, growthStage]);

  // Win Condition Effect
  useEffect(() => {
    if (gameState === 'playing' && targetsLeft === 0) {
      setGameState('won');
      setGameMessage("Vittoria! Hai protetto l'albero!");
      setGameLevel(prev => prev + 1);
      playGameWinSound();
    }
  }, [targetsLeft, gameState]);

  // Movement and Collision logic
  useEffect(() => {
    if (gameState !== 'playing') return;

    const moveInterval = setInterval(() => {
      setActiveTargets(prev => {
        let isGameOver = false;
        
        const next = prev.map(t => ({
          ...t,
          x: t.x + t.speedX,
          y: t.y + t.speedY
        }));

        for (const t of next) {
          if (t.type === 'fruit' && t.y >= 180) isGameOver = true;
          if (t.type === 'bug' && t.speedX > 0 && t.x >= 100) isGameOver = true;
          if (t.type === 'bug' && t.speedX < 0 && t.x <= 100) isGameOver = true;
        }

        if (isGameOver) {
          // Safe way to trigger game over without double-firing sound
          setTimeout(() => {
            setGameState(curr => {
              if (curr === 'playing') {
                setGameMessage("Game Over! L'albero ha perso la sua magia!");
                playGameFailSound();
                return 'gameover';
              }
              return curr;
            });
          }, 0);
          return [];
        }

        return next;
      });
    }, 50);

    return () => clearInterval(moveInterval);
  }, [gameState]);

  const safeStage = Math.max(0, Math.min(4, growthStage));
  const dynamicPercent = previewStage !== null ? [5, 25, 50, 75, 100][previewStage] : (readCount >= 15 ? 100 : Math.max(5, Math.floor((readCount / 15) * 100)));
  const stageDetails = [
    { name: "Seme d'Oro 🌱", message: "La terra magica accoglie il seme d'oro. Leggi o crea una storia di questo tema per vederlo spuntare!", percent: dynamicPercent },
    { name: "Germoglio 🌱", message: "Splendido! Sta spuntando una tenera fogliolina dorata. Continua a leggere!", percent: dynamicPercent },
    { name: "Arboscello 🌿", message: "Il tuo albero si sta allungando verso il sole con i primi rami verdi!", percent: dynamicPercent },
    { name: "Albero Rigoglioso 🌳", message: "Un albero forte e pieno di foglie sane! Manca pochissimo alla fioritura!", percent: dynamicPercent },
    { name: "Fioritura Splendente! 🌸✨", message: "Incredibile! Il tuo Albero della virtù è fiorito e risplende di pura magia!", percent: dynamicPercent }
  ][safeStage];

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
          <div className="relative flex flex-col items-center">
            {gameState !== 'idle' && <div className="w-44 h-44 mt-2"></div>}
            
            <div className={
              gameState !== 'idle'
                ? "fixed inset-0 z-50 bg-gradient-to-b from-emerald-950/95 to-emerald-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200"
                : "w-44 h-44 relative mt-2 flex items-center justify-center"
            }>
              
              {gameState !== 'idle' && (
                <div className="absolute top-6 w-full max-w-lg px-4 flex justify-between items-center gap-2 z-50">
                  <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/20 text-center flex-1">
                    <span className="text-white/60 text-[9px] font-bold uppercase tracking-wider block leading-none">Rimanenti</span>
                    <span className="text-xl font-black text-emerald-400 leading-none">{targetsLeft}</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/20 text-center flex-1">
                    <span className="text-white/60 text-[9px] font-bold uppercase tracking-wider block leading-none">Livello</span>
                    <span className="text-xl font-black text-amber-400 leading-none">{gameLevel}</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/20 text-center flex-1">
                    <span className="text-white/60 text-[9px] font-bold uppercase tracking-wider block leading-none">Crediti</span>
                    <span className="text-xl font-black text-rose-400 leading-none">{availableCredits}</span>
                  </div>
                  <button onClick={() => setGameState('idle')} className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white/90 hover:text-white px-3 py-2 rounded-full text-xs font-bold transition-colors ml-1 shrink-0">
                    <X size={18} />
                  </button>
                </div>
              )}

              {gameState === 'gameover' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-2xl border-2 border-rose-300 text-center z-50 animate-in zoom-in duration-300 w-64">
                  <h2 className="text-2xl font-black text-rose-600 mb-1 drop-shadow-sm">Game Over!</h2>
                  <p className="text-rose-900 font-bold text-xs mb-5">{gameMessage}</p>
                  {availableCredits > 0 ? (
                    <button onClick={() => startGame(true)} className="w-full py-3 bg-rose-500 text-white hover:bg-rose-400 rounded-xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all">
                      Riprova (Costo: 1)
                    </button>
                  ) : (
                    <button onClick={() => setGameState('idle')} className="w-full py-3 bg-slate-200 text-slate-500 rounded-xl font-black shadow-xl">
                      Fine crediti
                    </button>
                  )}
                </div>
              )}

              {gameState === 'won' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-2xl border-2 border-emerald-300 text-center z-50 animate-in zoom-in duration-300 w-64">
                  <h2 className="text-2xl font-black text-emerald-600 mb-1 drop-shadow-sm">Vittoria!</h2>
                  <p className="text-emerald-900 font-bold text-xs mb-5">{gameMessage}</p>
                  <button onClick={() => startGame(false)} className="w-full py-3 bg-emerald-500 text-white hover:bg-emerald-400 rounded-xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all">
                    Livello Successivo
                  </button>
                </div>
              )}

            <svg viewBox="0 0 200 200" className={`${gameState !== 'idle' ? "w-full max-w-[60vh] max-h-[60vh]" : "w-full h-full"} ${gameState === 'won' ? "drop-shadow-[0_0_60px_rgba(251,191,36,0.8)] animate-pulse" : (gameState !== 'idle' ? "drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" : "drop-shadow-md")} transition-all duration-1000`}>
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
                    {collectedCount >= 1 && <text x="65" y="90" fontSize="14" textAnchor="middle" className="animate-in zoom-in">{activeTreeInfo.decoration}</text>}
                    {collectedCount >= 2 && <text x="125" y="85" fontSize="14" textAnchor="middle" className="animate-in zoom-in">{activeTreeInfo.decoration}</text>}
                    {collectedCount >= 3 && <text x="95" y="65" fontSize="15" textAnchor="middle" className="animate-in zoom-in">{activeTreeInfo.decoration}</text>}
                    {collectedCount >= 4 && <text x="80" y="78" fontSize="12" textAnchor="middle" className="animate-in zoom-in">{activeTreeInfo.decoration}</text>}
                    {collectedCount >= 5 && <text x="112" y="74" fontSize="12" textAnchor="middle" className="animate-in zoom-in">{activeTreeInfo.decoration}</text>}
                    {collectedCount >= 6 && <text x="100" y="92" fontSize="13" textAnchor="middle" className="animate-in zoom-in">{activeTreeInfo.decoration}</text>}
                    {collectedCount >= 7 && <text x="55" y="105" fontSize="13" textAnchor="middle" className="animate-in zoom-in">{activeTreeInfo.decoration}</text>}
                    {collectedCount >= 8 && <text x="135" y="98" fontSize="13" textAnchor="middle" className="animate-in zoom-in">{activeTreeInfo.decoration}</text>}
                    {collectedCount >= 9 && <text x="85" y="55" fontSize="12" textAnchor="middle" className="animate-in zoom-in">{activeTreeInfo.decoration}</text>}
                    {collectedCount >= 10 && <text x="110" y="55" fontSize="12" textAnchor="middle" className="animate-in zoom-in">{activeTreeInfo.decoration}</text>}
                  </g>
                  
                  {/* Sparkle circles around canopy */}
                  <circle cx="95" cy="40" r="2" fill="#FFF" className="animate-ping" />
                  <circle cx="60" cy="65" r="1.5" fill="#FFF" className="animate-ping" />
                  <circle cx="135" cy="55" r="2.5" fill="#FFF" className="animate-ping" />
                </g>
              )}

              {/* Minigame Active Targets */}
              {activeTargets.map(item => (
                <g
                  key={item.id}
                  className="cursor-pointer transition-transform duration-75 ease-linear"
                  style={{ transform: `translate(${item.x}px, ${item.y}px) ${item.type === 'bug' && item.speedX > 0 ? 'scaleX(-1)' : ''}` }}
                  onClick={(e) => {
                    e.stopPropagation(); // prevent triggering tree bounce
                    if (gameState !== 'playing') return;

                    if (item.type === 'fruit') {
                      playFruitCollectSound();
                      setTargetsLeft(curr => Math.max(0, curr - 1));
                    } else {
                      playBugShooSound();
                    }

                    setActiveTargets(curr => curr.filter(t => t.id !== item.id));
                  }}
                >
                  <circle cx="0" cy="-5" r="14" fill="white" opacity="0.6" className="animate-ping" />
                  <text 
                    x="0" 
                    y="0" 
                    fontSize="18" 
                    textAnchor="middle"
                    className="animate-pulse"
                  >
                    {item.char}
                  </text>
                </g>
              ))}
            </svg>

            {/* Stage title floating above tree */}
            <div className="absolute bottom-2 bg-[#FFFDE7]/90 border border-amber-300 rounded-full px-3 py-0.5 text-[9px] font-black text-amber-800 shadow-xs uppercase tracking-wide">
              {stageDetails.name}
            </div>

            {/* Minigame Floating Start Button (Top-Right) */}
            {availableCredits > 0 && gameState === 'idle' && (
              <div className="absolute top-4 right-4 z-20">
                <button
                  onClick={() => setGameState('intro')}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-yellow-900 border-2 border-yellow-200 rounded-full font-black text-xs shadow-lg hover:scale-110 active:scale-95 transition-all flex items-center gap-2 animate-bounce"
                >
                  <Play size={16} fill="currentColor" /> GIOCA ({availableCredits})
                </button>
              </div>
            )}
            {/* Minigame Intro Popup */}
            {gameState === 'intro' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-2xl border-2 border-emerald-300 text-center z-50 animate-in zoom-in duration-300 w-72">
                <button 
                  onClick={() => setGameState('idle')}
                  className="absolute top-3 right-3 text-emerald-600 hover:text-emerald-800 transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="absolute -top-10 -left-10 w-24 h-24 bg-emerald-100/50 blur-2xl rounded-full"></div>
                <h2 className="text-xl font-black text-emerald-700 mb-2 flex items-center justify-center gap-2 drop-shadow-sm">
                  <Sparkles size={18} className="text-amber-500" /> Minigioco Magico!
                </h2>
                <p className="text-slate-700 font-bold text-sm leading-relaxed mb-4">
                  Raccogli tutti i frutti dell'albero {getThemePreposition(selectedTheme)}.<br />
                  Difendilo dagli attacchi!
                </p>
                <div className="bg-emerald-50 rounded-xl p-3 mb-5 border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-800">
                    Crediti disponibili: <span className="text-base font-black text-emerald-600">{availableCredits}</span>
                  </p>
                  <p className="text-[9px] text-emerald-600/80 mt-1 uppercase tracking-wide">Costo per partita: 1 credito</p>
                </div>
                <button onClick={() => startGame(true)} className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 rounded-xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm">
                  <Play size={16} fill="currentColor" /> GIOCA ORA
                </button>
              </div>
            )}
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
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100/80 space-y-2 group">
            <div className="flex justify-between text-[7.5px] font-black text-theme-secondary uppercase">
              <span className={previewStage !== null ? "text-amber-500 font-extrabold" : ""}>
                {previewStage !== null ? "Gioco: Prova l'albero!" : "Livello di Fioritura"}
              </span>
              <span>{stageDetails.percent}%</span>
            </div>
            
            <div className="relative w-full h-4 flex items-center">
              <input
                type="range"
                min="0"
                max="4"
                step="1"
                value={growthStage}
                onChange={(e) => {
                  playClickSound();
                  setPreviewStage(Number(e.target.value));
                }}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border pointer-events-none">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-500"
                  style={{ width: `${stageDetails.percent}%` }}
                />
              </div>
              <div 
                className="absolute w-4 h-4 bg-white border-2 border-green-500 rounded-full shadow transition-all duration-500 pointer-events-none"
                style={{ left: `calc(${stageDetails.percent}% - 8px)` }}
              />
            </div>

            <p className="text-[8px] font-medium text-theme-secondary text-center pt-0.5">
              Stato: <span className="font-extrabold text-[#EC407A]">{stageDetails.name}</span>
            </p>

            {previewStage !== null && (
               <button
                 onClick={() => { playClickSound(); setPreviewStage(null); }}
                 className="w-full mt-1 text-[7px] bg-amber-100 text-amber-800 py-1.5 rounded-md font-bold uppercase tracking-wide hover:bg-amber-200 transition-colors shadow-xs"
               >
                 Torna al livello reale
               </button>
            )}
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
