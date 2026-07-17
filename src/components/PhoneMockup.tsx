import React, { useEffect, useState } from "react";
import { Wifi, Battery, ShieldAlert, Sparkles, Star, Music, Volume2, VolumeX, Info } from "lucide-react";
import { playClickSound } from "../utils/audio";
import { AppSettings } from "../types";
import InfoModal from "./InfoModal";
import { shouldApplyNightTheme } from "../utils/theme";

const THEME_MAP: Record<string, { bg: string; border: string; accentText: string }> = {
  "🌸 Giardino delle Fate": { bg: "bg-[#FEF9F0]", border: "border-natural-pink-light", accentText: "text-[#880E4F]" },
  "🌲 Bosco delle Meraviglie": { bg: "bg-[#F1F8E9]", border: "border-[#C5E1A5]", accentText: "text-[#2E7D32]" },
  "🌊 Oceano Incantato": { bg: "bg-[#E1F5FE]", border: "border-[#B3E5FC]", accentText: "text-[#0277BD]" },
  "✨ Isola del Sole Dorato": { bg: "bg-[#FFFDE7]", border: "border-[#FFF9C4]", accentText: "text-[#E65100]" },
  "🦄 Prateria degli Unicorni": { bg: "bg-[#F3E5F5]", border: "border-[#E1BEE7]", accentText: "text-[#6A1B9A]" },
};

// Mappa logica per i temi notturni - background scuro con testi e accenti chiari e leggibili
const NIGHT_THEME_MAP: Record<string, { bg: string; border: string; accentText: string; textColor: string }> = {
  "🌸 Giardino delle Fate": { bg: "bg-slate-900", border: "border-pink-900", accentText: "text-pink-300", textColor: "text-pink-50" },
  "🌲 Bosco delle Meraviglie": { bg: "bg-slate-900", border: "border-green-900", accentText: "text-green-300", textColor: "text-green-50" },
  "🌊 Oceano Incantato": { bg: "bg-slate-900", border: "border-blue-900", accentText: "text-blue-300", textColor: "text-blue-50" },
  "✨ Isola del Sole Dorato": { bg: "bg-slate-900", border: "border-amber-900", accentText: "text-amber-300", textColor: "text-amber-50" },
  "🦄 Prateria degli Unicorni": { bg: "bg-slate-900", border: "border-purple-900", accentText: "text-purple-300", textColor: "text-purple-50" },
};

interface PhoneMockupProps {
  children: React.ReactNode;
  generatedToday: number;
  settings?: AppSettings;
  onUpdateSettings?: (settings: Partial<AppSettings>) => void;
  temaVisivo?: string;
}

export default function PhoneMockup({
  children,
  generatedToday,
  settings,
  onUpdateSettings,
  temaVisivo = "🌸 Giardino delle Fate"
}: PhoneMockupProps) {
  const [time, setTime] = useState("");
  const [showInfoModal, setShowInfoModal] = useState(false);
  const isNightTheme = shouldApplyNightTheme();

  const getThemeStyles = (name: string) => {
    let cleanName = name;
    if (name === "Rosa Pastello") cleanName = "🌸 Giardino delle Fate";
    else if (name === "Verde Bosco") cleanName = "🌲 Bosco delle Meraviglie";
    else if (name === "Azzurro Cielo") cleanName = "🌊 Oceano Incantato";
    else if (name === "Giallo Sole") cleanName = "✨ Isola del Sole Dorato";
    else if (name === "Lavanda") cleanName = "🦄 Prateria degli Unicorni";

    const dayTheme = THEME_MAP[cleanName] || THEME_MAP["🌸 Giardino delle Fate"];
    if (isNightTheme) {
      const nightTheme = NIGHT_THEME_MAP[cleanName] || NIGHT_THEME_MAP["🌸 Giardino delle Fate"];
      return {
        bg: nightTheme.bg,
        border: nightTheme.border,
        accentText: nightTheme.accentText,
        textColor: nightTheme.textColor,
      };
    }
    return dayTheme;
  };

  const themeStyles = getThemeStyles(temaVisivo);

  const musicOn = settings?.musicaSottofondo !== false;
  const sfxOn = settings?.effettiAudio !== false;

  const toggleMusic = () => {
    playClickSound();
    if (onUpdateSettings) {
      onUpdateSettings({ musicaSottofondo: !musicOn });
    }
  };

  const toggleSfx = () => {
    playClickSound();
    if (onUpdateSettings) {
      onUpdateSettings({ effettiAudio: !sfxOn });
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="app-container" className="min-h-screen bg-natural-bg flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden relative font-sans text-natural-text">
      {/* Decorative Background Elements from Design HTML */}
      <div className="absolute top-10 left-10 w-32 h-16 bg-white opacity-60 rounded-full blur-xl"></div>
      <div className="absolute top-40 right-20 w-40 h-20 bg-white opacity-40 rounded-full blur-2xl"></div>
      <div className="absolute bottom-10 left-1/2 w-48 h-24 bg-[#FFF176] opacity-20 rounded-full blur-3xl"></div>

      {/* Main Container */}
      <div className="flex flex-col lg:flex-row items-center gap-6 max-w-5xl w-full z-10 justify-center">
        
        {/* Desktop Side Info Panel */}
        <div className="hidden lg:flex flex-col max-w-xs text-natural-text bg-white/80 p-6 rounded-[2rem] border-4 border-natural-pink-border shadow-sm gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-natural-pink to-[#F06292] rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 shrink-0">
              <span className="text-3xl">✨</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-natural-burgundy italic font-serif leading-none">Favole Magiche</h1>
          </div>
          <p className="text-xs leading-relaxed text-natural-text/80">
            Un'app fantastica progettata per stimolare la fantasia di bambini e genitori! Crea storie educative personalizzate con l'aiuto dell'intelligenza artificiale.
          </p>
          <div className="bg-[#E1F5FE]/60 p-4 rounded-2xl border-2 border-natural-blue-light">
            <h2 className="font-bold text-[#0277BD] text-xs flex items-center gap-1.5 mb-1.5 uppercase tracking-wide">
              <span>🌟</span> Informazioni Magiche
            </h2>
            <div className="flex justify-between items-center text-xs mt-2 text-[#0277BD]">
              <span>Storie create oggi:</span>
              <span className="font-bold bg-white px-2 py-0.5 rounded-full border border-natural-blue-light">{generatedToday}</span>
            </div>
          </div>
        </div>

        {/* Smartphone Container Mockup with Espresso Bezel matching the Natural Tones mood */}
        <div id="phone-frame" className="relative w-full max-w-[400px] h-[780px] bg-[#5D4037] rounded-[50px] p-3 shadow-2xl border-4 border-[#3E2723] flex flex-col overflow-hidden shrink-0">
          
          {/* Bezel Notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#5D4037] rounded-b-2xl z-40 flex items-center justify-center">
            <div className="w-12 h-1.5 bg-[#3E2723] rounded-full mb-1"></div>
          </div>

          {/* Phone Screen Screen Area */}
          <div className={`w-full h-full ${themeStyles.bg} rounded-[38px] overflow-hidden flex flex-col relative z-30 select-none text-natural-text ${isNightTheme ? "bg-slate-900" : ""}`}>

            {/* Status Bar */}
            <div className={`h-11 ${isNightTheme ? "bg-slate-900/90 border-slate-700" : `bg-white/60 ${themeStyles.border}`} border-b-4 flex items-center justify-between px-5 pt-1 shrink-0 text-natural-text font-bold text-xs z-30`}>
              <div className="flex items-center gap-1.5">
                <span className={`tracking-wide text-[11px] font-extrabold ${isNightTheme ? "text-slate-100" : themeStyles.accentText}`}>{time || "09:41"}</span>
                <button
                  onClick={() => {
                    playClickSound();
                    setShowInfoModal(true);
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                    isNightTheme
                      ? "bg-slate-800 text-pink-300 border border-slate-600"
                      : "bg-white/80 text-natural-burgundy border border-natural-pink-border shadow-xs"
                  }`}
                  title="Info versione"
                  id="btn-status-info"
                >
                  <Info size={11} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {settings && onUpdateSettings && (
                  <div className="flex items-center gap-1 bg-white/80 border border-natural-pink-border rounded-full p-0.5">
                    {/* Music Toggle */}
                    <button
                      onClick={toggleMusic}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                        musicOn
                          ? "bg-amber-100 text-amber-600 border border-amber-200 shadow-xs"
                          : "text-slate-400 hover:text-slate-600 bg-transparent"
                      }`}
                      title={musicOn ? "Spegni Musica" : "Accendi Musica"}
                    >
                      <Music size={11} />
                    </button>

                    {/* SFX Toggle */}
                    <button
                      onClick={toggleSfx}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                        sfxOn
                          ? "bg-pink-100 text-pink-600 border border-pink-200 shadow-xs"
                          : "text-slate-400 hover:text-slate-600 bg-transparent"
                      }`}
                      title={sfxOn ? "Spegni Effetti Audio" : "Accendi Effetti Audio"}
                    >
                      {sfxOn ? <Volume2 size={11} /> : <VolumeX size={11} />}
                    </button>
                  </div>
                )}
                <div className={`flex items-center gap-1 ${isNightTheme ? "text-slate-300" : "text-slate-500"}`}>
                  <Wifi size={12} />
                  <Battery size={12} />
                </div>
              </div>
            </div>

            {/* Application Screen Content */}
            <div className={`flex-1 overflow-y-auto relative flex flex-col ${themeStyles.bg} ${isNightTheme ? "night-theme" : ""}`}>
              {children}
            </div>

            {/* Home Indicator Bar */}
            <div className={`h-4 flex items-center justify-center shrink-0 z-30 ${isNightTheme ? "bg-slate-900/70" : "bg-white/40"}`}>
              <div className="w-28 h-1 bg-[#5D4037]/20 rounded-full mb-1"></div>
            </div>

            {showInfoModal && <InfoModal onClose={() => setShowInfoModal(false)} />}

          </div>
        </div>

      </div>
    </div>
  );
}
