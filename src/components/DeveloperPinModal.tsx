import React, { useState } from "react";
import { X } from "lucide-react";
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

  const handleNumberClick = (num: string) => {
    playClickSound();
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);

      if (newPin.length === 4) {
        if (newPin === correctPin) {
          setTimeout(onSuccess, 300);
        } else {
          setError(true);
          setTimeout(() => setPin(""), 500);
        }
      }
    }
  };

  const handleDelete = () => {
    playClickSound();
    setPin(pin.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-5 z-[450] animate-fade-in">
      <div className="bg-white rounded-3xl p-6 border-4 border-slate-200 shadow-2xl max-w-xs w-full text-center relative overflow-hidden">
        <button
          onClick={() => { playClickSound(); onCancel(); }}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-colors"
        >
          <X size={16} />
        </button>

        <div className="w-14 h-14 bg-cyan-50 text-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-cyan-100">
          <span className="text-2xl">🔐</span>
        </div>

        <h3 className="font-extrabold text-xl text-slate-800 font-serif italic mb-1">Developer Mode</h3>
        <p className="text-xs text-slate-500 font-medium mb-6 px-4">Inserisci il PIN per accedere</p>

        {/* PIN Display */}
        <div className={`flex justify-center gap-3 mb-8 ${error ? "animate-wiggle" : ""}`}>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-all ${
                i < pin.length 
                  ? (error ? "bg-red-500 text-white scale-110" : "bg-cyan-500 text-white scale-110") 
                  : "bg-slate-100 text-transparent border-2 border-slate-200"
              }`}
            >
              {i < pin.length ? "•" : ""}
            </div>
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-2 px-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="h-14 rounded-2xl bg-slate-50 border-2 border-slate-100 text-xl font-bold text-slate-700 hover:bg-cyan-50 hover:border-cyan-200 hover:text-cyan-600 active:bg-cyan-100 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            >
              {num}
            </button>
          ))}
          <div className="h-14" /> {/* Empty spot */}
          <button
            onClick={() => handleNumberClick("0")}
            className="h-14 rounded-2xl bg-slate-50 border-2 border-slate-100 text-xl font-bold text-slate-700 hover:bg-cyan-50 hover:border-cyan-200 hover:text-cyan-600 active:bg-cyan-100 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-100 border-2 border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-500 font-bold mt-2 animate-fade-in">
            PIN errato, riprova
          </p>
        )}
      </div>
    </div>
  );
}

