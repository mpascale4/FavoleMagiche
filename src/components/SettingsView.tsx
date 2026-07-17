import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, HardDrive, Bell, Trash2, Volume2, Play, Square, Music, Sliders, Settings, Lock, Terminal } from "lucide-react";
import { AppSettings } from "../types";
import { playClickSound } from "../utils/audio";
import ChangePinModal from "./ChangePinModal";
import { getGenerationLogs, GenerationLog } from "../lib/storyGenerator";

interface SettingsViewProps {
  settings: AppSettings;
  storiesCount: number;
  geminiRuntimeStatus: {
    state: "unknown" | "ok" | "fallback";
    message: string;
    model?: string;
    updatedAt?: string;
  };
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onClearArchive: () => void;
  onBack: () => void;
}

export default function SettingsView({
  settings,
  storiesCount,
  geminiRuntimeStatus,
  onUpdateSettings,
  onBack,
  onClearArchive
}: SettingsViewProps) {
  
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [generationLogs, setGenerationLogs] = useState<GenerationLog[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Calculate simulated space footprint:
  const simulatedSizePerStory = 18.5; // MB
  const totalSimulatedMB = parseFloat((storiesCount * simulatedSizePerStory).toFixed(1));

  // Determine threshold limit in MB
  const getThresholdMB = () => {
    switch (settings.sogliaSpazio) {
      case "500 MB": return 500;
      case "1 GB": return 1000;
      case "2 GB": return 2000;
      default: return 999999; // unlimited
    }
  };

  const limitMB = getThresholdMB();
  const isOverLimit = totalSimulatedMB > limitMB;
  const percentage = Math.min(100, Math.round((totalSimulatedMB / (limitMB || 1000)) * 100));

  const handleThresholdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateSettings({ sogliaSpazio: e.target.value as any });
  };

  // Sync available system speech voices
  useEffect(() => {
    setGenerationLogs(getGenerationLogs());

    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Filter Italian voices, fallback to all if none
        const itVoices = voices.filter(v => v.lang.startsWith("it") || v.lang.includes("it-IT"));
        setAvailableVoices(itVoices.length > 0 ? itVoices : voices);
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, []);

  // Cleanup synthesis on back/unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Helper to trigger live voice preview
  const handlePlayPreview = () => {
    if (!synthRef.current) {
      alert("La sintesi vocale non è supportata su questo browser.");
      return;
    }

    if (isPreviewPlaying) {
      synthRef.current.cancel();
      setIsPreviewPlaying(false);
      return;
    }

    // Stop any ongoing narration first
    synthRef.current.cancel();

    const sampleText = "C'era una volta una piccola stellina d'oro che brillava nel cielo della buonanotte.";
    const utterance = new SpeechSynthesisUtterance(sampleText);
    utteranceRef.current = utterance;
    utterance.lang = "it-IT";

    const tipo = settings.tipoVoce || "narratore";
    const selectedVoiceName = settings.nomeVoceDispositivo || "";

    const voices = synthRef.current.getVoices();
    const selectedVoice = voices.find(v => v.name === selectedVoiceName) || voices.find(v => v.lang.startsWith("it") || v.lang.includes("it-IT"));
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Apply values (fallback to style defaults if custom ones aren't defined yet)
    let defaultPitch = 1.05;
    let defaultRate = 0.80;

    if (tipo === "femminile") {
      defaultPitch = 1.15;
      defaultRate = 0.95;
    } else if (tipo === "maschile") {
      defaultPitch = 0.85;
      defaultRate = 0.92;
    } else if (tipo === "robotica") {
      defaultPitch = 0.55;
      defaultRate = 1.10;
    }

    utterance.pitch = settings.tonoVoce !== undefined ? settings.tonoVoce : defaultPitch;
    utterance.rate = settings.velocitaVoce !== undefined ? settings.velocitaVoce : defaultRate;

    utterance.onend = () => {
      setIsPreviewPlaying(false);
    };
    utterance.onerror = () => {
      setIsPreviewPlaying(false);
    };

    setIsPreviewPlaying(true);
    synthRef.current.speak(utterance);
  };

  // Helper when changing vocal style
  const handleStyleChange = (tipo: "maschile" | "femminile" | "narratore" | "robotica") => {
    let basePitch = 1.05;
    let baseRate = 0.80;

    if (tipo === "femminile") {
      basePitch = 1.15;
      baseRate = 0.95;
    } else if (tipo === "maschile") {
      basePitch = 0.85;
      baseRate = 0.92;
    } else if (tipo === "robotica") {
      basePitch = 0.55;
      baseRate = 1.10;
    }

    onUpdateSettings({
      tipoVoce: tipo,
      tonoVoce: basePitch,
      velocitaVoce: baseRate
    });

    // Replay preview if it was playing to listen to the new style
    if (isPreviewPlaying && synthRef.current) {
      synthRef.current.cancel();
      setIsPreviewPlaying(false);
      setTimeout(() => {
        setIsPreviewPlaying(true);
        const sampleText = "C'era una volta una piccola stellina d'oro che brillava nel cielo della buonanotte.";
        const u = new SpeechSynthesisUtterance(sampleText);
        u.lang = "it-IT";
        
        const voices = synthRef.current!.getVoices();
        const selectedVoice = voices.find(v => v.name === (settings.nomeVoceDispositivo || "")) || voices.find(v => v.lang.startsWith("it") || v.lang.includes("it-IT"));
        if (selectedVoice) u.voice = selectedVoice;
        
        u.pitch = basePitch;
        u.rate = baseRate;
        u.onend = () => setIsPreviewPlaying(false);
        u.onerror = () => setIsPreviewPlaying(false);
        synthRef.current!.speak(u);
      }, 120);
    }
  };

  const getPitchLabel = (pitch: number) => {
    if (pitch < 0.7) return "Voce molto profonda";
    if (pitch < 0.9) return "Tonalità calda / Bassa";
    if (pitch < 1.1) return "Tonalità standard";
    if (pitch < 1.3) return "Tonalità acuta / Chiara";
    return "Voce cartone animato";
  };

  const getRateLabel = (rate: number) => {
    if (rate < 0.7) return "Molto lenta (Sonnellino)";
    if (rate < 0.85) return "Rilassante fiaba";
    if (rate < 1.0) return "Lettura naturale";
    if (rate < 1.2) return "Moderatamente veloce";
    return "Lettura rapida";
  };

  return (
    <div className="flex-1 flex flex-col p-5 justify-between scrollbar-none overflow-y-auto max-h-[640px]">
      <div className="space-y-4">
        {/* Back Header */}
        <div className="flex items-center gap-2 mb-2 shrink-0">
          <button
            onClick={() => {
              playClickSound();
              if (synthRef.current) {
                synthRef.current.cancel();
              }
              onBack();
            }}
            id="btn-back-settings"
            className="w-9 h-9 bg-white hover:bg-natural-pink-light text-natural-burgundy rounded-xl flex items-center justify-center border-2 border-natural-pink-border shadow-xs transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h3 className="text-lg font-bold text-natural-burgundy font-serif italic">Impostazioni App</h3>
        </div>

        <div className="bg-white rounded-[2rem] p-4 border-4 border-natural-pink-border shadow-sm space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-natural-burgundy">Stato Gemini</h4>
            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
              geminiRuntimeStatus.state === "ok"
                ? "bg-emerald-100 text-emerald-700"
                : geminiRuntimeStatus.state === "fallback"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-600"
            }`}>
              {geminiRuntimeStatus.state === "ok" ? "AI ATTIVA" : geminiRuntimeStatus.state === "fallback" ? "FALLBACK ATTIVO" : "NON TESTATO"}
            </span>
          </div>

          <p className="text-[10px] font-bold text-natural-text">{geminiRuntimeStatus.message}</p>

          {geminiRuntimeStatus.model && (
            <p className="text-[9px] text-slate-500 font-semibold">Modello usato: {geminiRuntimeStatus.model}</p>
          )}

          {geminiRuntimeStatus.updatedAt && (
            <p className="text-[9px] text-slate-400 font-semibold">
              Ultimo aggiornamento: {new Date(geminiRuntimeStatus.updatedAt).toLocaleString("it-IT")}
            </p>
          )}

          {/* Log viewer */}
          {generationLogs.length > 0 && (
            <div className="space-y-2 mt-3 border-t border-slate-200/50 pt-3">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[10px]">
                <Terminal size={12} className="text-natural-pink" />
                <span>Log Generazioni (ultimi {generationLogs.length})</span>
              </div>

              <div className="max-h-48 overflow-y-auto bg-slate-50/80 rounded-lg p-2 space-y-1.5 border border-slate-200/50">
                {generationLogs
                  .slice()
                  .reverse()
                  .map((log, idx) => (
                    <div key={idx} className="text-[8.5px] font-mono text-slate-600 leading-tight">
                      <div className="flex items-start gap-1.5">
                        <span className={`font-bold shrink-0 ${
                          log.source === "gemini" ? "text-emerald-600" :
                          log.source === "fallback" ? "text-amber-600" :
                          "text-red-600"
                        }`}>
                          [{log.source.toUpperCase()}]
                        </span>
                        <div className="flex-1">
                          <div className="text-[7px] text-slate-400 mb-0.5">
                            {new Date(log.timestamp).toLocaleTimeString("it-IT")}
                          </div>
                          <div className="text-slate-700">
                            {log.model && <div>Modello: {log.model}</div>}
                            {log.reason && <div>Motivo: {log.reason}</div>}
                            {log.error && <div>Errore: {log.error}</div>}
                            {log.availableModels && log.availableModels.length > 0 && (
                              <div>Disponibili: {log.availableModels.join(", ")}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* VOICE SELECTION CARD (Requested Feature) */}
        <div className="bg-white rounded-[2rem] p-4 border-4 border-natural-pink-border shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-natural-burgundy pb-1 border-b-2 border-natural-pink-light">
            <div className="w-8 h-8 bg-pink-100 rounded-xl flex items-center justify-center text-natural-pink">
              <Volume2 size={16} />
            </div>
            <div>
              <h4 className="font-extrabold text-[11px] uppercase tracking-wider">Voce di Lettura</h4>
              <p className="text-[9px] text-natural-pink font-extrabold">Configura l'intonazione e lo stile</p>
            </div>
          </div>

          {/* Style Selector Grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "narratore", label: "Narratore 🧚‍♀️", desc: "Rilassante" },
              { id: "femminile", label: "Femminile 🌸", desc: "Brillante e dolce" },
              { id: "maschile", label: "Maschile 👦", desc: "Caldo e rassicurante" },
              { id: "robotica", label: "Robotica 🤖", desc: "Divertente" }
            ].map((voiceOpt) => {
              const isActive = (settings.tipoVoce || "narratore") === voiceOpt.id;
              return (
                <button
                  key={voiceOpt.id}
                  onClick={() => handleStyleChange(voiceOpt.id as any)}
                  className={`p-2.5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between ${
                    isActive
                      ? "bg-pink-50/70 border-natural-pink text-natural-burgundy shadow-xs scale-[1.02]"
                      : "bg-slate-50/50 border-slate-200/80 text-natural-text hover:bg-slate-100"
                  }`}
                >
                  <span className="font-extrabold text-[11px] block">{voiceOpt.label}</span>
                  <span className="text-[8px] text-slate-500 font-bold leading-none mt-1">{voiceOpt.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Intonation Customization Sliders */}
          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/50 space-y-3.5">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[10px]">
              <Sliders size={12} className="text-natural-pink" />
              <span>Regolazione Fine Intonazione</span>
            </div>

            {/* Pitch Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-extrabold">
                <span className="text-slate-600">Altezza Tono (Pitch):</span>
                <span className="text-natural-burgundy">{(settings.tonoVoce ?? 1.0).toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={settings.tonoVoce ?? 1.0}
                onChange={(e) => onUpdateSettings({ tonoVoce: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-natural-pink"
              />
              <p className="text-[8px] text-slate-400 font-bold text-right italic">
                {getPitchLabel(settings.tonoVoce ?? 1.0)}
              </p>
            </div>

            {/* Speed Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-extrabold">
                <span className="text-slate-600">Velocità di Lettura:</span>
                <span className="text-natural-burgundy">{(settings.velocitaVoce ?? 0.85).toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={settings.velocitaVoce ?? 0.85}
                onChange={(e) => onUpdateSettings({ velocitaVoce: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-natural-pink"
              />
              <p className="text-[8px] text-slate-400 font-bold text-right italic">
                {getRateLabel(settings.velocitaVoce ?? 0.85)}
              </p>
            </div>
          </div>

          {/* System TTS Voice Selector */}
          {availableVoices.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[9.5px] font-extrabold text-slate-700 block">Sorgente Sintesi Vocale:</label>
              <select
                value={settings.nomeVoceDispositivo || ""}
                onChange={(e) => onUpdateSettings({ nomeVoceDispositivo: e.target.value })}
                className="w-full bg-white border-2 border-natural-pink-border/80 rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-natural-text focus:outline-none cursor-pointer hover:bg-slate-50 transition-all truncate"
              >
                <option value="">-- Voce Predefinita del Sistema --</option>
                {availableVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Preview Test Action */}
          <button
            onClick={handlePlayPreview}
            className={`w-full py-2.5 rounded-2xl font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer border shadow-xs ${
              isPreviewPlaying
                ? "bg-[#FFE0E6] hover:bg-[#FFD1DC] text-[#C2185B] border-[#FFB2C5]"
                : "bg-natural-pink hover:bg-natural-pink-dark text-white border-natural-pink-border"
            }`}
          >
            {isPreviewPlaying ? (
              <>
                <Square size={13} fill="currentColor" /> Ferma Anteprima Voce
              </>
            ) : (
              <>
                <Play size={13} fill="currentColor" /> Ascolta Anteprima 🔊
              </>
            )}
          </button>
        </div>

        {/* STORAGE DASHBOARD CARD */}
        <div className="bg-white rounded-[2rem] p-4 border-4 border-natural-pink-border shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-natural-burgundy">
            <div className="w-8 h-8 bg-[#FCE4EC] rounded-xl flex items-center justify-center text-[#EC407A]">
              <HardDrive size={16} />
            </div>
            <div>
              <h4 className="font-extrabold text-[11px] uppercase tracking-wider">Gestione Spazio</h4>
              <p className="text-[9px] text-[#EC407A] font-extrabold">Salvataggio locale sicuro</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-baseline text-[10px] font-bold text-natural-text">
              <span>Spazio Utilizzato:</span>
              <span className="text-natural-burgundy font-extrabold">
                {totalSimulatedMB} MB / {settings.sogliaSpazio === "Illimitato" ? "Illimitato" : settings.sogliaSpazio}
              </span>
            </div>

            <div className="h-3 bg-[#FCE4EC]/50 rounded-full overflow-hidden p-0.5 border border-natural-pink-border/50">
              <div
                style={{ width: `${settings.sogliaSpazio === "Illimitato" ? Math.min(100, storiesCount * 3) : percentage}%` }}
                className={`h-full rounded-full transition-all duration-300 ${
                  isOverLimit ? "bg-red-400" : "bg-gradient-to-r from-natural-pink to-[#EC407A]"
                }`}
              ></div>
            </div>

            <div className="flex justify-between text-[8px] text-natural-text/50 font-bold">
              <span>{storiesCount} Storie generate</span>
              <span>Footprint stimato: {simulatedSizePerStory}MB/storia</span>
            </div>
          </div>

          {isOverLimit && settings.avvisaSuperamento && (
            <div className="bg-red-50 text-red-700 text-[9px] font-bold p-2 rounded-xl flex items-start gap-1 border border-red-100 leading-normal">
              <Bell size={11} className="shrink-0 mt-0.5 text-red-600 animate-bounce" />
              <span>Attenzione! Hai superato la soglia di spazio ({settings.sogliaSpazio}).</span>
            </div>
          )}
        </div>

        {/* AMBIANCE & MUSIC */}
        <div className="space-y-3 bg-white rounded-[2rem] p-4 border-4 border-natural-pink-border shadow-sm">
          <div className="flex items-center gap-2.5 text-natural-burgundy pb-1.5 border-b-2 border-natural-pink-light">
            <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
              <Music size={16} />
            </div>
            <div>
              <h4 className="font-extrabold text-[11.5px] uppercase tracking-wider">Musica e Atmosfera</h4>
              <p className="text-[9px] text-amber-500 font-extrabold">Personalizza l'esperienza di lettura</p>
            </div>
          </div>

          {/* Background Music Toggle */}
          <label className="flex items-center justify-between cursor-pointer py-1 text-xs">
            <div className="space-y-0.5 pr-2">
              <span className="font-extrabold text-natural-burgundy block">Musica di Sottofondo 🎶</span>
              <span className="text-[9px] text-natural-text/70 block font-bold leading-tight">
                Riproduci un carillon dolce e rilassante mentre leggi.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.musicaSottofondo !== false}
              onChange={(e) => onUpdateSettings({ musicaSottofondo: e.target.checked })}
              className="w-4 h-4 rounded-md accent-[#EC407A] shrink-0"
            />
          </label>

          {/* Audio Effects Toggle */}
          <label className="flex items-center justify-between cursor-pointer py-1.5 text-xs border-t border-slate-100 mt-1">
            <div className="space-y-0.5 pr-2">
              <span className="font-extrabold text-natural-burgundy block">Effetti Audio 🪄</span>
              <span className="text-[9px] text-natural-text/70 block font-bold leading-tight">
                Riproduci suoni magici ed effetti fatati durante la navigazione e lettura.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.effettiAudio !== false}
              onChange={(e) => onUpdateSettings({ effettiAudio: e.target.checked })}
              className="w-4 h-4 rounded-md accent-[#EC407A] shrink-0"
            />
          </label>

          {/* Visual Style Theme Dropdown */}
          <div className="flex items-center justify-between text-xs py-1.5 border-t border-slate-100 mt-1">
            <div className="space-y-0.5 pr-2">
              <span className="font-extrabold text-natural-burgundy block">Stile e Ambiance 🎨</span>
              <span className="text-[9px] text-natural-text/70 block font-bold">
                Modifica i colori della camera di lettura.
              </span>
            </div>
            <select
              value={settings.stileVisuale || "auto"}
              onChange={(e) => onUpdateSettings({ stileVisuale: e.target.value as any })}
              className="w-44 max-w-[176px] bg-[#FCE4EC]/30 border-2 border-natural-pink-border rounded-xl px-2 py-1 text-[11px] text-natural-burgundy font-extrabold cursor-pointer focus:outline-none truncate text-ellipsis"
            >
              <option value="auto">Tema della Categoria (Magico) ✨</option>
              <option value="giorno">Giorno (Vanilla & Rosa) ☀️</option>
              <option value="alba">Alba (Pesca & Oro) 🌅</option>
              <option value="tramonto">Tramonto (Viola & Arancio) 🌇</option>
              <option value="notte">Notte Stellata (Cosmico) 🌙</option>
              <option value="bosco">Bosco Incantato (Verde Smeraldo) 🌲</option>
              <option value="oceano">Mare Profondo (Zaffiro & Turchese) 🌊</option>
              <option value="horror">Brivido Spaventoso (Spettrale & Notturno) 👻</option>
            </select>
          </div>
        </div>

        {/* OPTION RULES CARD */}
        <div className="space-y-3 bg-white rounded-[2rem] p-4 border-4 border-natural-pink-border shadow-sm">
          <h4 className="font-extrabold text-[10.5px] text-natural-burgundy uppercase tracking-wider pb-1.5 border-b-2 border-natural-pink-light">
            Regole Di Salvataggio
          </h4>

          {/* Threshold Select */}
          <div className="flex items-center justify-between text-xs py-1">
            <span className="font-extrabold text-natural-text">Soglia Spazio</span>
            <select
              value={settings.sogliaSpazio}
              onChange={handleThresholdChange}
              id="select-storage-threshold"
              className="bg-[#FCE4EC]/30 border-2 border-natural-pink-border rounded-xl px-2 py-1 text-xs text-natural-burgundy font-extrabold cursor-pointer focus:outline-none"
            >
              <option value="500 MB">500 MB</option>
              <option value="1 GB">1 GB</option>
              <option value="2 GB">2 GB</option>
              <option value="Illimitato">Illimitato</option>
            </select>
          </div>

          {/* Toggle 1: Warn */}
          <label className="flex items-center justify-between cursor-pointer py-1 text-xs">
            <div className="space-y-0.5 pr-2">
              <span className="font-extrabold text-natural-burgundy block">Avvisa al Superamento</span>
              <span className="text-[9px] text-natural-text/70 block font-bold leading-tight">
                Invia una notifica in-app quando superi la soglia scelta.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.avvisaSuperamento}
              onChange={(e) => onUpdateSettings({ avvisaSuperamento: e.target.checked })}
              className="w-4 h-4 rounded-md accent-[#EC407A] shrink-0"
            />
          </label>

          {/* Toggle 2: Auto Delete */}
          <label className="flex items-center justify-between cursor-pointer py-1 text-xs">
            <div className="space-y-0.5 pr-2">
              <span className="font-extrabold text-natural-burgundy block">Eliminazione Automatica</span>
              <span className="text-[9px] text-natural-text/70 block font-bold leading-tight">
                Rimuovi le storie più vecchie per liberare spazio quando superi la soglia.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.eliminaInAutomatico}
              onChange={(e) => onUpdateSettings({ eliminaInAutomatico: e.target.checked })}
              className="w-4 h-4 rounded-md accent-[#EC407A] shrink-0"
            />
          </label>

          {/* Toggle 3: Keep Favorites */}
          <label className="flex items-center justify-between cursor-pointer py-1 text-xs">
            <div className="space-y-0.5 pr-2">
              <span className="font-extrabold text-natural-burgundy block">Conserva Preferite</span>
              <span className="text-[9px] text-natural-text/70 block font-bold leading-tight">
                Le storie con la stella non verranno mai cancellate automaticamente.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.conservaPreferite}
              onChange={(e) => onUpdateSettings({ conservaPreferite: e.target.checked })}
              className="w-4 h-4 rounded-md accent-[#EC407A] shrink-0"
            />
          </label>
        </div>
      </div>

      {/* PARENTAL CONTROL CARD */}
      <div className="bg-white rounded-[2rem] p-4 border-4 border-natural-pink-border shadow-sm space-y-3">
        <div className="flex items-center gap-2.5 text-natural-burgundy">
          <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
            <Lock size={16} />
          </div>
          <div>
            <h4 className="font-extrabold text-[11px] uppercase tracking-wider">Controllo Genitori e Sicurezza</h4>
            <p className="text-[9px] text-blue-500 font-extrabold">Proteggi le impostazioni ed i minori</p>
          </div>
        </div>

        <div className="space-y-1 divide-y divide-slate-100">
          {/* PIN Genitore */}
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5 pr-2">
              <span className="font-extrabold text-natural-burgundy block text-xs">PIN Genitore</span>
              <span className="text-[9px] text-natural-text/70 block font-bold leading-tight">
                Codice richiesto per accedere alle impostazioni o eliminare favole.
              </span>
            </div>
            <button
              onClick={() => { playClickSound(); setShowChangePinModal(true); }}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-600 font-bold text-[10px] rounded-lg transition-all border border-blue-200 shadow-sm cursor-pointer shrink-0"
            >
              Modifica PIN
            </button>
          </div>

          {/* Modalità Bambino (Blocco Navigazione) */}
          <div className="flex items-center justify-between py-2.5">
            <div className="space-y-0.5 pr-2">
              <span className="font-extrabold text-natural-burgundy block text-xs">Modalità Bambino (Child Lock) 🔒</span>
              <span className="text-[9px] text-natural-text/70 block font-bold leading-tight">
                Nasconde creazione, profili e impostazioni. I bambini possono solo leggere le storie.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.modalitaBambino === true}
              onChange={(e) => {
                playClickSound();
                onUpdateSettings({ modalitaBambino: e.target.checked });
              }}
              className="w-4 h-4 rounded-md accent-blue-500 shrink-0 cursor-pointer"
            />
          </div>

          {/* Timer della Nanna (Sleep Timer) */}
          <div className="flex items-center justify-between py-2.5">
            <div className="space-y-0.5 pr-2">
              <span className="font-extrabold text-natural-burgundy block text-xs">Timer della Nanna 🌙</span>
              <span className="text-[9px] text-natural-text/70 block font-bold leading-tight">
                Spegne la lettura e la musica dopo il tempo impostato per favorire il sonno.
              </span>
            </div>
            <select
              value={settings.timerNannaMinutes || 0}
              onChange={(e) => {
                playClickSound();
                onUpdateSettings({ timerNannaMinutes: parseInt(e.target.value) });
              }}
              className="bg-blue-50 border-2 border-blue-100 rounded-xl px-2 py-1 text-[10px] font-bold text-blue-600 cursor-pointer focus:outline-none shrink-0"
            >
              <option value="0">Disattivato</option>
              <option value="5">5 Minuti</option>
              <option value="10">10 Minuti</option>
              <option value="15">15 Minuti</option>
              <option value="30">30 Minuti</option>
              <option value="45">45 Minuti</option>
              <option value="60">60 Minuti</option>
            </select>
          </div>
        </div>
      </div>

      {/* PRIVACY & COMPLIANCE CARD */}
      <div className="bg-gradient-to-br from-emerald-50 to-[#E8F5E9] rounded-[2rem] p-4 border-4 border-emerald-200 shadow-sm space-y-2.5">
        <div className="flex items-center gap-2 text-emerald-800">
          <span className="text-xl">🛡️</span>
          <div>
            <h4 className="font-extrabold text-[10px] uppercase tracking-wider">Privacy & Sicurezza al 100%</h4>
            <p className="text-[8px] text-emerald-600 font-extrabold">I dati dei bambini restano al sicuro</p>
          </div>
        </div>
        <p className="text-[9px] text-emerald-800/80 font-semibold leading-relaxed">
          Questa applicazione rispetta la privacy dei minori (COPPA/GDPR Kids):
        </p>
        <ul className="space-y-1 text-[8.5px] text-emerald-800/80 font-bold list-disc pl-3">
          <li><span className="text-emerald-950">Dati Locali:</span> I profili dei bambini e le favole create sono memorizzati esclusivamente sul dispositivo. Nessun dato personale viene condiviso o venduto.</li>
          <li><span className="text-emerald-950">Voce Sicura:</span> La sintesi vocale (TTS) è eseguita localmente dal browser e non invia streaming audio a server esterni.</li>
          <li><span className="text-emerald-950">Nessuna Pubblicità:</span> Nessun tracciatore o pubblicità per garantire un'esperienza serena.</li>
        </ul>
      </div>

      {/* Danger Zone */}
      <div className="space-y-2 mt-4 shrink-0 pb-1">
        <button
          onClick={() => setShowConfirmClear(true)}
          id="btn-clear-archive-settings"
          className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-[#C2185B] border-2 border-red-200 rounded-full text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Trash2 size={13} /> Svuota Intero Archivio Storie
        </button>
        <p className="text-[8px] text-slate-400 text-center font-bold">
          Versione dell'applicazione: 2.1.0 &bull; Licenza Apache 2.0
        </p>
      </div>

      {/* Custom Archive Emptying Confirmation Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-5 z-50 animate-fade-in">
          <div className="bg-white rounded-[2rem] border-4 border-red-200 p-6 max-w-sm w-full text-center space-y-4 shadow-xl transform scale-100 transition-all animate-scale-up">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-2xl mx-auto border-2 border-red-100">
              🚨
            </div>
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-sm text-[#C2185B] font-serif italic">
                Svuotare l'intera biblioteca?
              </h4>
              <p className="text-[11px] text-natural-text font-bold leading-relaxed">
                Stai per eliminare per sempre <span className="text-[#C2185B] font-black">tutte le {storiesCount} favole</span> conservate. Questa azione non è reversibile. Sei assolutamente sicuro?
              </p>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-600 rounded-full text-[11px] font-extrabold transition-all cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  onClearArchive();
                  setShowConfirmClear(false);
                }}
                className="flex-1 py-2 bg-gradient-to-r from-[#D81B60] to-[#C2185B] hover:brightness-105 border-2 border-[#C2185B] text-white rounded-full text-[11px] font-extrabold transition-all cursor-pointer shadow-xs"
              >
                Sì, svuota tutto
              </button>
            </div>
          </div>
        </div>
      )}

      {showChangePinModal && (
        <ChangePinModal
          onSuccess={(newPin) => {
            onUpdateSettings({ pinAccesso: newPin });
            setShowChangePinModal(false);
          }}
          onCancel={() => setShowChangePinModal(false)}
        />
      )}
    </div>
  );
}
