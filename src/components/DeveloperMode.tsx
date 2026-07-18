import React, { useState } from "react";
import { playClickSound } from "../utils/audio";
import { generateStage } from "../utils/stages";

interface DeveloperModeProps {
  onTestStageAchievement: (stageIndex: number) => void;
  onTestWorldAchievement: (worldIndex: number) => void;
  onClose: () => void;
}

export default function DeveloperMode({
  onTestStageAchievement,
  onTestWorldAchievement,
  onClose
}: DeveloperModeProps) {
  const [stageInput, setStageInput] = useState("1");
  const [worldInput, setWorldInput] = useState("1");

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
            <p>💡 Milestone format: 1.1 (Stage completion)</p>
            <button
              onClick={() => handleTestStage(1)}
              className="block w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs rounded border border-cyan-600"
            >
              ⚡ Quick: Stage 1 Complete
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

        <div className="text-[11px] text-cyan-300 bg-slate-800 p-3 rounded border border-cyan-600 font-mono">
          <p>📋 Developer Mode Active</p>
          <p>PIN: 1357 (fixed)</p>
          <p>Check console for detailed logs</p>
        </div>
      </div>
    </div>
  );
}

