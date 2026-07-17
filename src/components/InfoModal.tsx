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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[250] animate-in fade-in">
      <div className="bg-white rounded-[2rem] border-4 border-natural-pink-border shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-natural-pink/10 to-pink-50 border-b-2 border-natural-pink-border p-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-12 h-12 bg-natural-pink rounded-xl flex items-center justify-center text-white text-xl shrink-0">
              ✨
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black text-natural-burgundy font-serif">
                Favole Magiche
              </h2>
              <p className="text-sm font-bold text-natural-pink mt-0.5">
                {versionInfo.description}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto scrollbar-none flex-1 p-5 space-y-6">
          {/* Version Info */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-2 border-slate-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Info size={18} className="text-natural-pink" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-natural-burgundy">
                Informazioni Versione
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Versione
                </div>
                <div className="text-2xl font-black text-natural-burgundy font-serif">
                  v{versionInfo.version}
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  <Calendar size={12} className="inline mr-1" />
                  Data
                </div>
                <div className="text-sm font-bold text-slate-700">
                  {new Date(versionInfo.releaseDate).toLocaleDateString("it-IT", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Changes */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-natural-pink" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-natural-burgundy">
                Ultime Modifiche
              </h3>
            </div>

            <div className="space-y-2">
              {versionInfo.recentChanges.map((change, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl border-l-4 p-3 ${getTypeColor(change.type)}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg mt-0.5">{getTypeIcon(change.type)}</span>
                    <div className="flex-1">
                      <div className="font-bold text-[13px]">{change.title}</div>
                      <div className="text-[11px] opacity-80 mt-0.5">
                        {change.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <GitBranch size={18} className="text-natural-pink" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-natural-burgundy">
                Caratteristiche
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {versionInfo.features.map((feature, idx) => (
                <div key={idx} className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                  <p className="text-[12px] font-bold text-slate-700">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 text-center">
          <p className="text-[11px] text-slate-500 font-bold">
            📖 Leggi il changelog completo su{" "}
            <span className="text-natural-pink font-black">CHANGELOG.md</span>
          </p>
        </div>
      </div>
    </div>
  );
}

