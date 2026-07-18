import React, { useState } from "react";
import { playClickSound } from "../utils/audio";

interface DeveloperPinModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DeveloperPinModal({
  onSuccess,
  onCancel
}: DeveloperPinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const correctPin = "1357";

  const handleSubmit = () => {
    playClickSound();
    if (pin === correctPin) {
      onSuccess();
      setPin("");
      setError(false);
    } else {
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[450]">
      <div className={`rounded-2xl border-4 p-6 max-w-xs w-full space-y-4 transition-all ${
        error
          ? "bg-red-900 border-red-600 animate-shake"
          : "bg-slate-900 border-cyan-500"
      }`}>
        <h3 className={`text-lg font-black text-center ${error ? "text-red-300" : "text-cyan-400"}`}>
          {error ? "❌ PIN Errato" : "🔐 Developer Mode"}
        </h3>

        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value.slice(0, 4))}
          onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="PIN"
          className="w-full px-4 py-2 bg-slate-800 border-2 border-cyan-500 rounded text-white font-mono text-center text-2xl tracking-widest"
          autoFocus
        />

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded font-black transition-all"
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 px-3 bg-cyan-600 hover:bg-cyan-700 text-black rounded font-black transition-all active:scale-95"
          >
            Accedi
          </button>
        </div>
      </div>
    </div>
  );
}

