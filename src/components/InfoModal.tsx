import React, { useState, useEffect } from "react";
import { X, Info, Sparkles, Calendar, Clock } from "lucide-react";
import { useSwipeToDismiss } from "@mp/app-kit";
import { playClickSound } from "../utils/audio";

interface ChangeItem {
  type: "feature" | "fix" | "improvement";
  title: string;
  description: string;
}

interface VersionHistoryItem {
  version: string;
  releaseDate: string;
  releaseTime?: string;
  changes: ChangeItem[];
}

interface VersionInfo {
  version: string;
  releaseDate: string;
  releaseTime?: string;
  description: string;
  features: string[];
  recentChanges: ChangeItem[];
  versionHistory?: VersionHistoryItem[];
}

interface InfoModalProps {
  onClose: () => void;
}

export default function InfoModal({ onClose }: InfoModalProps) {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const { offset, isDragging, handlers } = useSwipeToDismiss({ onDismiss: onClose });

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

  const history = (versionInfo.versionHistory || []).slice(0, 10);

  return (
    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 z-[120] animate-in fade-in">
      <div
        className="bg-slate-900 text-slate-100 rounded-[1.5rem] border-3 border-pink-500/60 shadow-[0_20px_60px_rgba(0,0,0,0.45)] w-full max-h-[96%] overflow-hidden flex flex-col"
        style={{ transform: `translateY(${offset}px)`, transition: isDragging ? "none" : undefined }}
        {...handlers}
      >
        <div className="bg-slate-800 border-b border-slate-600/70 p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-11 h-11 bg-natural-pink rounded-xl flex items-center justify-center text-white text-xl shrink-0">✨</div>
            <div className="flex-1">
              <h2 className="text-lg font-black text-pink-200 font-serif">Favole Magiche</h2>
              <p className="text-[11px] font-bold text-pink-300/90 mt-0.5">{versionInfo.description}</p>
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

        <div className="overflow-y-auto scrollbar-none flex-1 p-4 space-y-4">
          <div className="w-full bg-slate-950 text-slate-100 rounded-2xl p-3 shadow-md text-left font-mono text-[10px] border-2 border-pink-500/45">
            <div className="flex items-center justify-between border-b border-slate-700/50 pb-1.5 mb-2">
                <span className="font-extrabold text-pink-300 uppercase tracking-wider flex items-center gap-1 text-[9px]">
                <span>📋</span> Changelog e Info Versione
              </span>
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="bg-slate-800 rounded-lg p-2 border border-slate-600">
                <div className="text-[9px] font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Info size={11} /> Versione
                </div>
                <div className="text-lg font-black text-pink-200 font-serif">v{versionInfo.version}</div>
              </div>

              <div className="bg-slate-800 rounded-lg p-2 border border-slate-600">
                <div className="text-[9px] font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar size={11} /> Data
                </div>
                <div className="text-[11px] font-bold text-slate-200">{versionInfo.releaseDate}</div>
              </div>

              <div className="bg-slate-800 rounded-lg p-2 border border-slate-600">
                <div className="text-[9px] font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Clock size={11} /> Orario
                </div>
                <div className="text-[11px] font-bold text-slate-200">{versionInfo.releaseTime || "--:--"}</div>
              </div>
            </div>

            <div className="space-y-1.5 mt-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-pink-300" />
                <h3 className="font-extrabold text-[10px] uppercase tracking-wider text-pink-300">
                  Ultime Modifiche (ultime {Math.min(10, history.length)} versioni)
                </h3>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-none">
                {history.length === 0 && (
                    <div className="rounded-lg border border-slate-600 p-2 bg-slate-800 text-slate-200">
                    Nessuno storico versioni disponibile.
                  </div>
                )}

                {history.map((entry) => (
                  <div key={entry.version} className="rounded-lg border border-slate-600 p-2 bg-slate-800">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-pink-300 font-black text-[11px]">v{entry.version}</span>
                      <span className="text-slate-200 text-[9px]">{entry.releaseDate} {entry.releaseTime || ""}</span>
                    </div>
                    <div className="space-y-1">
                      {(entry.changes || []).map((change, idx) => (
                        <div key={`${entry.version}-${idx}`} className="text-[10px] text-slate-100">
                          <span className="text-pink-300 mr-1">•</span>
                          <span className="font-bold">{change.title}</span>
                          <span className="text-slate-200"> - {change.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 mt-3">
              <h3 className="font-extrabold text-[10px] uppercase tracking-wider text-pink-300">Caratteristiche</h3>
              <div className="grid grid-cols-1 gap-2">
                {(versionInfo.features || []).map((feature, idx) => (
                  <div key={idx} className="bg-slate-800 rounded-lg p-2 border border-slate-600">
                    <p className="text-[10px] font-bold text-slate-200">{feature}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-600/70 bg-slate-800 p-3 text-center">
          <p className="text-[10px] text-slate-300 font-bold">
            📖 Leggi il changelog completo su{" "}
            <span className="text-pink-300 font-black">CHANGELOG.md</span>
          </p>
        </div>
      </div>
    </div>
  );
}
