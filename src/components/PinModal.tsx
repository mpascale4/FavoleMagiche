import React, { useState } from "react";
import { Lock, X, AlertTriangle } from "lucide-react";
import { useSwipeToDismiss } from "@mp/app-kit";
import { playClickSound } from "../utils/audio";

interface PinModalProps {
  onSuccess: () => void;
  onCancel: () => void;
  expectedPin: string;
  title?: string;
  description?: string;
}

export default function PinModal({ onSuccess, onCancel, expectedPin, title = "Area Genitori", description = "Inserisci il PIN per continuare" }: PinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  // Swipe-down dismiss è solo una scorciatoia: la X resta il modo primario, sempre visibile, per chiudere.
  const { offset, isDragging, handlers } = useSwipeToDismiss({ onDismiss: onCancel });

  const handleNumberClick = (num: string) => {
    playClickSound();
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      
      if (newPin.length === 4) {
        if (newPin === expectedPin) {
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
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-5 z-100 animate-fade-in">
      <div
        className="bg-white rounded-3xl p-6 border-4 border-slate-200 shadow-2xl max-w-xs w-full text-center relative overflow-hidden"
        style={{ transform: `translateY(${offset}px)`, transition: isDragging ? "none" : undefined }}
        {...handlers}
      >
        <button
          onClick={() => { playClickSound(); onCancel(); }}
          className="absolute top-4 right-4 text-theme-secondary hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-colors"
        >
          <X size={16} />
        </button>

        <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-blue-100">
          <Lock size={28} />
        </div>
        
        <h3 className="font-extrabold text-xl text-slate-800 font-serif italic mb-1">{title}</h3>
        <p className="text-xs text-theme-secondary font-medium mb-6 px-4">{description}</p>

        {/* PIN Display */}
        <div className={`flex justify-center gap-3 mb-8 ${error ? "animate-wiggle" : ""}`}>
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-all ${
                i < pin.length 
                  ? (error ? "bg-red-500 text-white scale-110" : "bg-blue-500 text-white scale-110") 
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
              className="h-14 rounded-2xl bg-slate-50 border-2 border-slate-100 text-xl font-bold text-theme-secondary hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            >
              {num}
            </button>
          ))}
          <div className="h-14" /> {/* Empty spot */}
          <button
            onClick={() => handleNumberClick("0")}
            className="h-14 rounded-2xl bg-slate-50 border-2 border-slate-100 text-xl font-bold text-theme-secondary hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-100 border-2 border-slate-200 text-theme-secondary hover:bg-red-50 hover:border-red-200 hover:text-red-500 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        
        {error && (
          <p className="text-xs text-red-700 font-bold mt-2 animate-fade-in absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1" role="alert" aria-live="assertive">
            <AlertTriangle size={12} aria-hidden="true" />
            <span>Errore: PIN errato, riprova</span>
          </p>
        )}
      </div>
    </div>
  );
}
