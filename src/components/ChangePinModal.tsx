import React, { useState } from "react";
import { Lock, X, AlertTriangle } from "lucide-react";
import { useSwipeToDismiss } from "@mp/app-kit";
import { playClickSound } from "../utils/audio";

interface ChangePinModalProps {
  onSuccess: (newPin: string) => void;
  onCancel: () => void;
  isForced?: boolean;
}

export default function ChangePinModal({ onSuccess, onCancel, isForced = false }: ChangePinModalProps) {
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  // Swipe-down dismiss disabilitato quando forzato (nessun modo di annullare in quel caso).
  const { offset, isDragging, handlers } = useSwipeToDismiss({ onDismiss: onCancel, disabled: isForced });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    
    if (newPin.length !== 4) {
      setError("Il PIN deve essere di 4 cifre.");
      return;
    }
    if (newPin === "0000") {
      setError("Il PIN non può essere 0000. Scegli un codice più sicuro.");
      return;
    }
    if (newPin !== confirmPin) {
      setError("I PIN non corrispondono.");
      return;
    }
    
    setError("");
    onSuccess(newPin);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-5 z-110 animate-fade-in">
      <div
        className="bg-white rounded-3xl p-6 border-4 border-slate-200 shadow-2xl max-w-sm w-full text-center relative overflow-hidden"
        style={{ transform: `translateY(${offset}px)`, transition: isDragging ? "none" : undefined }}
        {...handlers}
      >
        {!isForced && (
          <button
            onClick={() => { playClickSound(); onCancel(); }}
            className="absolute top-4 right-4 text-theme-secondary hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        )}

        <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-amber-100">
          <AlertTriangle size={28} />
        </div>
        
        <h3 className="font-extrabold text-xl text-slate-800 font-serif italic mb-1">
          {isForced ? "Imposta il tuo PIN" : "Modifica PIN"}
        </h3>
        <p className="text-[11px] text-theme-secondary font-medium mb-4 px-2 leading-relaxed">
          {isForced 
            ? "Hai ancora il PIN di default (0000). Modificalo per proteggere l'area genitori. Attenzione: è importante ricordarlo per accedere alle impostazioni in futuro!" 
            : "Inserisci un nuovo PIN di 4 cifre. Ricordalo per non perdere l'accesso!"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <input
              type="password"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={4}
              placeholder="Nuovo PIN (4 cifre)"
              value={newPin}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setNewPin(val);
                setError("");
              }}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-center text-lg text-theme-secondary font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
            />
            <input
              type="password"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={4}
              placeholder="Conferma PIN"
              value={confirmPin}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setConfirmPin(val);
                setError("");
              }}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-center text-lg text-theme-secondary font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
            />
          </div>
          
          {error && (
            <p className="text-xs text-red-700 font-bold animate-fade-in flex items-center justify-center gap-1" role="alert" aria-live="assertive">
              <AlertTriangle size={12} aria-hidden="true" />
              <span>Errore: {error}</span>
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-900 rounded-full font-black text-sm shadow-md active:translate-y-1 transition-all cursor-pointer"
          >
            Salva PIN
          </button>
        </form>
      </div>
    </div>
  );
}
