import React, { useEffect, useState } from "react";
import { Sparkles, Star } from "lucide-react";

interface GenerationViewProps {
  categoria: string;
  temaEducativo: string;
  progress: number;
  step: string;
  onCancel: () => void;
  onNavigateHome: () => void;
}

interface LogEntry {
  time: string;
  text: string;
  type: "info" | "success" | "warn";
}

const FUN_MESSAGES = [
  "Le pagine magiche stanno prendendo vita...",
  "I draghi stanno temperando le loro matite colorate...",
  "Un pizzico di polvere di stelle sta scendendo sui capitoli...",
  "Gli unicorni stanno colorando le illustrazioni...",
  "La fata madrina sta scrivendo un finale felice...",
  "L'IA magica sta inventando una morale speciale...",
  "Stiamo spolverando la copertina di brillantini..."
];

export default function GenerationView({
  categoria,
  temaEducativo,
  progress,
  step,
  onCancel,
  onNavigateHome
}: GenerationViewProps) {
  const [messageIdx, setMessageIdx] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Track operation step changes as persistent logs
  useEffect(() => {
    if (!step) return;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const timeString = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    setLogs((prev) => {
      // Prevent repeating the same consecutive log text
      if (prev.length > 0 && prev[prev.length - 1].text === step) {
        return prev;
      }
      let type: "info" | "success" | "warn" = "info";
      const s = step.toLowerCase();
      if (s.includes("completat") || s.includes("pronta") || s.includes("finito")) {
        type = "success";
      } else if (s.includes("offline") || s.includes("fallito") || s.includes("riserva") || s.includes("errore")) {
        type = "warn";
      }
      return [...prev, { time: timeString, text: step, type }];
    });
  }, [step]);

  // Cycle fun cartoon messages
  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIdx((prev) => (prev + 1) % FUN_MESSAGES.length);
    }, 3500);

    return () => clearInterval(msgInterval);
  }, []);

  return (
    <div className="flex-1 flex flex-col p-6 items-center justify-center bg-natural-bg text-natural-text text-center relative scrollbar-none">
      
      {/* Sparkles backdrop animation */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(236,64,122,0.08),transparent_50%)] pointer-events-none"></div>

      {/* Magic Book Animated Frame */}
      <div className="relative w-44 h-44 mb-8 flex items-center justify-center">
        
        {/* Soft rotating ring light */}
        <div className="absolute w-40 h-40 bg-natural-pink/15 rounded-full blur-xl animate-pulse duration-2000"></div>

        {/* CSS Drawn/Animated Magic Book */}
        <div className="relative z-10 w-32 h-24 bg-gradient-to-tr from-natural-yellow to-natural-pink-light rounded-[1.5rem] shadow-md border-4 border-natural-pink-border flex overflow-hidden">
          {/* Middle spine */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-natural-pink shadow-xs z-10"></div>
          
          {/* Left page fold animation */}
          <div className="flex-1 bg-white p-2 flex flex-col justify-between items-start">
            <div className="w-10 h-2 bg-slate-100 rounded-full"></div>
            <div className="w-8 h-1.5 bg-slate-100 rounded-full"></div>
            <div className="w-9 h-1.5 bg-slate-100 rounded-full"></div>
            <div className="w-6 h-1.5 bg-slate-100 rounded-full"></div>
          </div>

          {/* Right page fold animation */}
          <div className="flex-1 bg-white p-2 flex flex-col justify-between items-end border-l border-slate-100">
            <div className="w-8 h-2 bg-slate-100 rounded-full"></div>
            <div className="w-9 h-1.5 bg-slate-100 rounded-full"></div>
            <div className="w-7 h-1.5 bg-slate-100 rounded-full"></div>
            <div className="w-10 h-1.5 bg-slate-100 rounded-full"></div>
          </div>
        </div>

        {/* Decorative Stars Floating */}
        <div className="absolute top-2 left-6 text-natural-yellow animate-bounce duration-2000">
          <Star size={16} fill="currentColor" />
        </div>
        <div className="absolute bottom-4 right-4 text-natural-pink animate-ping duration-3000">
          <Sparkles size={20} />
        </div>
        <div className="absolute top-8 right-8 text-[#FFE082] animate-pulse">
          <Star size={12} fill="currentColor" />
        </div>
        <div className="absolute bottom-6 left-8 text-natural-pink animate-bounce duration-1500">
          <Star size={14} fill="currentColor" />
        </div>
      </div>

      {/* Main Info */}
      <h3 className="text-xl font-bold tracking-tight mb-1 text-natural-burgundy font-serif italic">
        La Magia è in Azione...
      </h3>
      <p className="text-[11px] text-natural-text/80 mb-4 font-bold">
        Creando una favola di <span className="text-[#EC407A] underline">{categoria}</span> sul tema <span className="text-natural-burgundy underline">{temaEducativo}</span>
      </p>

      {/* Real-time Detailed Log Terminal */}
      <div className="w-full max-w-[290px] bg-[#110D26] text-slate-100 rounded-2xl p-3 mb-4 shadow-md text-left font-mono text-[9px] border-2 border-[#EC407A]/40">
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-1.5 mb-2">
          <span className="font-extrabold text-[#F06292] uppercase tracking-wider flex items-center gap-1 text-[8.5px]">
            <span>📋</span> Registro Magico (AI Logs)
          </span>
          <span className="flex h-1.5 w-1.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
        </div>
        <div className="max-h-20 overflow-y-auto space-y-1.5 scrollbar-none">
          {logs.map((log, index) => (
            <div key={index} className="leading-snug break-words">
              <span className="text-slate-400 mr-1 select-none">[{log.time}]</span>
              <span className={
                log.type === "success" ? "text-emerald-400 font-bold" :
                log.type === "warn" ? "text-amber-300 italic" : "text-slate-200"
              }>
                {log.text}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-slate-500 italic">Inizializzazione dei canali fatati...</div>
          )}
        </div>
      </div>

      {/* Fun Message Box */}
      <div className="h-8 flex items-center justify-center px-4 mb-4">
        <p className="text-[10px] font-black text-[#AD1457]/70 italic animate-pulse">
          "{FUN_MESSAGES[messageIdx]}"
        </p>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full max-w-[280px] bg-natural-pink-light/30 p-1.5 rounded-full border-2 border-natural-pink-border shadow-inner">
        <div className="relative h-4 bg-white rounded-full overflow-hidden">
          
          {/* Animated striped bar */}
          <div
            style={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-natural-pink to-[#EC407A] rounded-full shadow-inner transition-all duration-300"
          ></div>
          
          {/* Sparkle on leading edge of progress */}
          <div
            style={{ left: `calc(${progress}% - 8px)` }}
            className="absolute top-0.5 w-3 h-3 bg-white rounded-full blur-[1px] animate-ping"
          ></div>

        </div>
      </div>

      {/* Numerical Indicator */}
      <span className="text-[10px] font-black text-[#EC407A] mt-2 tracking-widest">
        {progress}% COMPLETATO
      </span>

      {/* Background and Cancel Actions */}
      <div className="flex flex-col gap-2 mt-8 w-full max-w-[240px]">
        <button
          onClick={onNavigateHome}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-natural-pink to-[#EC407A] hover:brightness-105 active:scale-98 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
        >
          <span>Continua in Background 🏃‍♂️</span>
        </button>
        <button
          onClick={onCancel}
          className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-600 font-bold text-xs rounded-xl transition-all"
        >
          Stoppa / Annulla
        </button>
      </div>

      <span className="text-[9px] text-natural-text/40 mt-6 block font-semibold leading-normal max-w-[220px]">
        Ora puoi navigare l'app e leggere altre favole mentre l'IA magica scrive la tua nuova storia in background!
      </span>

    </div>
  );
}
