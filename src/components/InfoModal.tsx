import React, { useState, useEffect } from "react";
import { X, Info, Sparkles, GitBranch, Calendar } from "lucide-react";
import { playClickSound } from "../utils/audio";

interface VersionInfo {
  version: string;
  releaseDate: string;
  description: string;
  recentChanges: Array<{
    type: "feature" | "fix" | "improvement";
    title: string;
    description: string;
  }>;
}

interface InfoModalProps {
  onClose: () => void;
}

export default function InfoModal({ onClose }: InfoModalProps) {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    const loadVersion = async () => {
      try {
        const response = await fetch("/version.json");
        const data = await response.json();
        setVersionInfo(data);
      } catch (error) {
        console.warn("[Info] Errore caricamento versione:", error);
      }
    };

    loadVersion();
  }, []);

  if (!versionInfo) {
    return null;
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "feature":
        return "text-emerald-600 bg-emerald-50";
      case "fix":
        return "text-orange-600 bg-orange-50";
      case "improvement":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-slate-600 bg-slate-50";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "feature":
        return "✨";
      case "fix":
        return "🔧";
      case "improvement":
        return "📈";
      default:
        return "📝";
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 z-[120] animate-in fade-in">
      <div className="bg-[#110D26] text-slate-100 rounded-[1.5rem] border-3 border-[#EC407A]/50 shadow-[0_20px_60px_rgba(0,0,0,0.45)] w-full max-h-[96%] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#1a1438] border-b border-slate-700/60 p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-11 h-11 bg-[#EC407A] rounded-xl flex items-center justify-center text-white text-xl shrink-0">
              ✨
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-black text-pink-200 font-serif">
                Favole Magiche
              </h2>
              <p className="text-[11px] font-bold text-pink-300/90 mt-0.5">
                {versionInfo.description}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto scrollbar-none flex-1 p-4 space-y-4">
          <div className="w-full bg-[#0d0a1f] text-slate-100 rounded-2xl p-3 shadow-md text-left font-mono text-[10px] border-2 border-[#EC407A]/40">
            <div className="flex items-center justify-between border-b border-slate-700/50 pb-1.5 mb-2">
              <span className="font-extrabold text-[#F06292] uppercase tracking-wider flex items-center gap-1 text-[9px]">
                <span>📋</span> Changelog e Info Versione
              </span>
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
            </div>

            {/* Version Info */}
            <div className="flex items-center gap-2">
              <Info size={14} className="text-pink-300" />
              <h3 className="font-extrabold text-[10px] uppercase tracking-wider text-pink-300">
                Informazioni Versione
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-[#1a1438] rounded-lg p-2 border border-slate-700">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Versione
                </div>
                <div className="text-lg font-black text-pink-200 font-serif">
                  v{versionInfo.version}
                </div>
              </div>

              <div className="bg-[#1a1438] rounded-lg p-2 border border-slate-700">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <Calendar size={12} className="inline mr-1" />
                  Data
                </div>
                <div className="text-[11px] font-bold text-slate-200">
                  {new Date(versionInfo.releaseDate).toLocaleDateString("it-IT", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </div>
              </div>
            </div>

            {/* Recent Changes */}
            <div className="space-y-1.5 mt-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-pink-300" />
                <h3 className="font-extrabold text-[10px] uppercase tracking-wider text-pink-300">
                Ultime Modifiche
                </h3>
              </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto scrollbar-none">
              {versionInfo.recentChanges.map((change, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border-l-2 border-pink-400/70 p-2 bg-[#1a1438]"
                >
                  <div className="flex items-start gap-2 text-slate-200">
                    <span className="text-sm mt-0.5">{getTypeIcon(change.type)}</span>
                    <div className="flex-1">
                      <div className="font-bold text-[11px]">{change.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {change.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className="space-y-1.5 mt-3">
            <div className="flex items-center gap-2">
              <GitBranch size={14} className="text-pink-300" />
              <h3 className="font-extrabold text-[10px] uppercase tracking-wider text-pink-300">
                Caratteristiche
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {versionInfo.features.map((feature, idx) => (
                <div key={idx} className="bg-[#1a1438] rounded-lg p-2 border border-slate-700">
                  <p className="text-[10px] font-bold text-slate-200">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700/60 bg-[#1a1438] p-3 text-center">
          <p className="text-[10px] text-slate-300 font-bold">
            📖 Leggi il changelog completo su{" "}
            <span className="text-pink-300 font-black">CHANGELOG.md</span>
          </p>
        </div>
      </div>
    </div>
  );
}

