import React, { useEffect, useState } from "react";
import { playClickSound } from "../utils/audio";
import { generateStage } from "../utils/stages";
import { audioEngine } from "../lib/audioEngine";
import { setForcedNightTheme } from "../utils/theme";
import { AppSettings } from "../types";

const DEV_FORCED_NIGHT_KEY = "dev_forced_night_mode";
const DEV_PREV_STYLE_KEY = "dev_prev_stile_visuale";
const APP_SETTINGS_KEY = "favole_magiche_settings";

interface DeveloperModeProps {
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onTestStageAchievement: (stageIndex: number) => void;
  onTestWorldAchievement: (worldIndex: number) => void;
  onClose: () => void;
}

export default function DeveloperMode({
  settings,
  onUpdateSettings,
  onTestStageAchievement,
  onTestWorldAchievement,
  onClose
}: DeveloperModeProps) {
  const [stageInput, setStageInput] = useState("1");
  const [worldInput, setWorldInput] = useState("1");
  const [nightModeTest, setNightModeTest] = useState(() => {
    try {
      if (typeof window === "undefined") return false;
      return localStorage.getItem(DEV_FORCED_NIGHT_KEY) === "true";
    } catch {
      return false;
    }
  });
  const normalizedStage = Math.max(1, parseInt(stageInput || "1") || 1);
  const stageMilestone = `1.${normalizedStage}`;

  useEffect(() => {
    // Sincronizza subito audio/theme con lo stato persistito.
    audioEngine.setForcedNightMode(nightModeTest ? true : null);
    setForcedNightTheme(nightModeTest ? true : null);
  }, [nightModeTest]);

  const handleTestStage = (index: number) => {
    playClickSound();
    const stage = generateStage(index);
    console.log(`🧪 Testing Stage ${index}:`, stage);
    onTestStageAchievement(index);
  };

  const handleTestWorld = (index: number) => {
    playClickSound();
    const lastStageOfWorld = index * 5;
    const stage = generateStage(lastStageOfWorld);
    console.log(`🧪 Testing World ${index} (Stage ${lastStageOfWorld}):`, stage);
    onTestWorldAchievement(index);
  };

  const handleToggleNightModeTest = () => {
    const newState = !nightModeTest;

    try {
      if (typeof window === "undefined") return;
      const savedSettings = localStorage.getItem(APP_SETTINGS_KEY);
      const settings = savedSettings ? JSON.parse(savedSettings) : {};

      if (newState) {
        // Ricorda lo stile precedente solo la prima volta.
        if (!localStorage.getItem(DEV_PREV_STYLE_KEY)) {
          localStorage.setItem(DEV_PREV_STYLE_KEY, settings.stileVisuale || "auto");
        }
        onUpdateSettings({ stileVisuale: "notte" });
        localStorage.setItem(DEV_FORCED_NIGHT_KEY, "true");
      } else {
        // Ripristina lo stile che l'utente aveva prima del forcing.
        const previousStyle = localStorage.getItem(DEV_PREV_STYLE_KEY) || "auto";
        onUpdateSettings({ stileVisuale: previousStyle as AppSettings["stileVisuale"] });
        localStorage.removeItem(DEV_FORCED_NIGHT_KEY);
        localStorage.removeItem(DEV_PREV_STYLE_KEY);
      }
      audioEngine.setForcedNightMode(newState ? true : null);
      setForcedNightTheme(newState ? true : null);
      setNightModeTest(newState);
      playClickSound();
    } catch (e) {
      console.error("Error toggling night mode:", e);
      playClickSound();
    }
  };

  const handleClearNightModeTest = () => {
    if (!nightModeTest) return;

    try {
      if (typeof window === "undefined") return;
      const savedSettings = localStorage.getItem(APP_SETTINGS_KEY);
      const settings = savedSettings ? JSON.parse(savedSettings) : {};
      const previousStyle = localStorage.getItem(DEV_PREV_STYLE_KEY) || "auto";

      settings.stileVisuale = previousStyle;
      onUpdateSettings({ stileVisuale: previousStyle as AppSettings["stileVisuale"] });
      localStorage.removeItem(DEV_FORCED_NIGHT_KEY);
      localStorage.removeItem(DEV_PREV_STYLE_KEY);

      setNightModeTest(false);
      playClickSound();
    } catch (e) {
      console.error("Error clearing forced night mode:", e);
      playClickSound();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[400]">
      <div className="bg-slate-900 rounded-2xl border-4 border-cyan-500 p-6 max-w-md w-full text-white space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-cyan-400">🧪 DEVELOPER MODE</h3>
          <button
            onClick={onClose}
            className="text-2xl font-black text-cyan-400 hover:text-red-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Test Stage Achievement */}
        <div className="space-y-3 border-b border-cyan-600 pb-4">
          <h4 className="font-bold text-cyan-300">Test Stage Achievement</h4>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="50"
              value={stageInput}
              onChange={(e) => setStageInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-800 border border-cyan-500 rounded text-white font-mono text-sm"
              placeholder="Stage number"
            />
            <button
              onClick={() => handleTestStage(parseInt(stageInput) || 1)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-black font-black rounded transition-all active:scale-95"
            >
              Test
            </button>
          </div>
          <div className="text-xs text-cyan-200 space-y-1">
            <p>💡 Milestone format: {stageMilestone} (Stage completion)</p>
            <button
              onClick={() => handleTestStage(normalizedStage)}
              className="block w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs rounded border border-cyan-600"
            >
              ⚡ Quick: Stage {normalizedStage} Complete
            </button>
          </div>
        </div>

        {/* Test World Achievement */}
        <div className="space-y-3">
          <h4 className="font-bold text-cyan-300">Test World Completion</h4>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="10"
              value={worldInput}
              onChange={(e) => setWorldInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-800 border border-cyan-500 rounded text-white font-mono text-sm"
              placeholder="World number"
            />
            <button
              onClick={() => handleTestWorld(parseInt(worldInput) || 1)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-black font-black rounded transition-all active:scale-95"
            >
              Test
            </button>
          </div>
          <div className="text-xs text-cyan-200 space-y-1">
            <p>💡 Milestone format: {parseInt(worldInput || "1")}.6 (World Completion)</p>
            <button
              onClick={() => handleTestWorld(1)}
              className="block w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs rounded border border-cyan-600"
            >
              ⚡ Quick: World 1 Complete
            </button>
          </div>
        </div>

        {/* Test Night Mode Audio */}
        <div className="space-y-3 border-b border-cyan-600 pb-4">
          <h4 className="font-bold text-cyan-300">🌙 Test Night Mode</h4>
          <div className="flex gap-2">
            <button
              onClick={handleToggleNightModeTest}
              className={`flex-1 px-4 py-2 font-black rounded transition-all active:scale-95 ${
                nightModeTest
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-slate-700 hover:bg-slate-600 text-cyan-300"
              }`}
            >
              {nightModeTest ? "🌙 Night Mode ON" : "☀️ Night Mode OFF"}
            </button>
            {nightModeTest && (
              <button
                onClick={handleClearNightModeTest}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-black rounded transition-all active:scale-95"
              >
                Ripristina
              </button>
            )}
          </div>
          <div className="text-xs text-cyan-200 space-y-1">
            <p>🎨 Forza il tema notturno e l'audio notturno</p>
            <p className={`font-bold ${nightModeTest ? "text-purple-400" : "text-cyan-400"}`}>
              {nightModeTest ? "✓ Tema e Audio Notturni Forzati" : "✗ Modalità Auto (orario naturale)"}
            </p>
          </div>
        </div>

        {/* 1UP visual preview */}
        <div className="space-y-3 border-b border-cyan-600 pb-4">
          <h4 className="font-bold text-cyan-300">🌸 1UP Preview</h4>
          <div className="bg-slate-800 rounded-xl border border-cyan-600 p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-emerald-700/60 border border-emerald-400 flex items-center justify-center">
                <span className="text-xl">🌸</span>
                <span className="absolute -top-1 -right-2 text-[8px] font-black text-yellow-300 bg-emerald-900 border border-emerald-300 rounded px-1 leading-none">1UP</span>
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-cyan-200">Fiore + badge 1UP (anteprima)</p>
                <p className="text-[10px] text-cyan-300/80">Spawn raro: max 1 volta per livello</p>
              </div>
            </div>
            <span className="text-[10px] text-cyan-100 bg-slate-700 px-2 py-1 rounded border border-cyan-700">DEVELOP TEST</span>
          </div>
        </div>

        <div className="text-[11px] text-cyan-300 bg-slate-800 p-3 rounded border border-cyan-600 font-mono">
          <p>📋 Developer Mode Active</p>
          <p>PIN: 1357 (fixed)</p>
          <p>Check console for detailed logs</p>
        </div>
      </div>
    </div>
  );
}
