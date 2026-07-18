import React, { useState, useEffect } from "react";
import { Lock, X, Check, HelpCircle } from "lucide-react";
import { playClickSound, playFairyChorusSound } from "../utils/audio";

interface ParentalGateModalProps {
  onSuccess: () => void;
  onCancel: () => void;
  parentPin?: string;
  actionName?: string; // e.g. "accedere alle Impostazioni"
}

export default function ParentalGateModal({ 
  onSuccess, 
  onCancel, 
  parentPin = "0000",
  actionName = "accedere a questa sezione" 
}: ParentalGateModalProps) {
  const [numA, setNumA] = useState(0);
  const [numB, setNumB] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [error, setError] = useState(false);
  const [showPinOption, setShowPinOption] = useState(false);
  const [pinDigits, setPinDigits] = useState("");
  const [pinError, setPinError] = useState(false);

  // Generate randomized arithmetic question
  useEffect(() => {
    const a = Math.floor(Math.random() * 6) + 4; // 4 to 9
    const b = Math.floor(Math.random() * 6) + 4; // 4 to 9
    setNumA(a);
    setNumB(b);
  }, []);

  const handleMathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    
    const correctAnswer = numA * numB;
    if (parseInt(userAnswer) === correctAnswer) {
      playFairyChorusSound();
      onSuccess();
    } else {
      setError(true);
      setUserAnswer("");
      // Reset numbers for new trial
      const a = Math.floor(Math.random() * 6) + 4;
      const b = Math.floor(Math.random() * 6) + 4;
      setNumA(a);
      setNumB(b);
      setTimeout(() => setError(false), 2000);
    }
  };

  const handlePinDigitClick = (num: string) => {
    playClickSound();
    if (pinDigits.length < 4) {
      const nextPin = pinDigits + num;
      setPinDigits(nextPin);
      setPinError(false);

      if (nextPin.length === 4) {
        if (nextPin === parentPin) {
          playFairyChorusSound();
          setTimeout(onSuccess, 300);
        } else {
          setPinError(true);
          setTimeout(() => setPinDigits(""), 600);
        }
      }
    }
  };

  const handlePinDelete = () => {
    playClickSound();
    setPinDigits(pinDigits.slice(0, -1));
    setPinError(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-5 z-[200] animate-fade-in">
      <div className="bg-white rounded-[2.5rem] p-6 border-4 border-natural-pink-border shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => { playClickSound(); onCancel(); }}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-colors"
        >
          <X size={16} />
        </button>

        {/* Whimsical Safe Header */}
        <div className="w-16 h-16 bg-pink-50 text-natural-pink rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border-2 border-natural-pink-border animate-bounce-slow">
          <Lock size={32} />
        </div>
        
        <h3 className="font-extrabold text-xl text-natural-burgundy font-serif italic mb-1">Area Genitori</h3>
        <p className="text-[10px] text-theme-secondary font-bold mb-5 px-3">
          Per {actionName}, chiedi a un adulto di risolvere questa domanda o inserire il PIN.
        </p>

        {/* Tab switchers if custom PIN exists */}
        {parentPin !== "0000" && (
          <div className="flex justify-center gap-2 mb-4 bg-slate-50 p-1 rounded-xl border border-slate-200/50">
            <button
              onClick={() => { playClickSound(); setShowPinOption(false); }}
              className={`flex-1 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                !showPinOption ? "bg-white text-natural-pink shadow-xs" : "text-theme-secondary"
              }`}
            >
              Domanda Matematica
            </button>
            <button
              onClick={() => { playClickSound(); setShowPinOption(true); }}
              className={`flex-1 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                showPinOption ? "bg-white text-natural-pink shadow-xs" : "text-theme-secondary"
              }`}
            >
              Usa PIN Genitore
            </button>
          </div>
        )}

        {!showPinOption ? (
          /* MATH GATE VIEW */
          <form onSubmit={handleMathSubmit} className="space-y-4">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/50">
              <div className="text-[10px] uppercase font-black tracking-widest text-theme-secondary mb-1 flex items-center justify-center gap-1">
                <HelpCircle size={10} /> Verifica di Sicurezza
              </div>
              <div className="text-3xl font-extrabold text-slate-800 tracking-tight font-serif select-none my-2">
                {numA} × {numB} = ?
              </div>
            </div>

            <div className="flex gap-2.5 items-center w-full">
              <input
                type="number"
                pattern="[0-9]*"
                inputMode="numeric"
                required
                placeholder="Risposta"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-0 flex-1 bg-white border-2 border-slate-200/80 rounded-2xl px-3 py-2.5 text-center text-lg font-black text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-natural-pink transition-all"
              />
              <button
                type="submit"
                className="w-12 h-12 bg-natural-pink hover:bg-natural-pink-dark text-white rounded-2xl font-black border-b-4 border-natural-pink-border flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <Check size={22} className="stroke-[3]" />
              </button>
            </div>

            {error && (
              <p className="text-[10px] text-red-500 font-extrabold animate-fade-in">
                Risposta errata, proviamo con un altro calcolo!
              </p>
            )}
          </form>
        ) : (
          /* PIN OPTION VIEW */
          <div className="space-y-4">
            {/* PIN Display dots */}
            <div className={`flex justify-center gap-2.5 ${pinError ? "animate-wiggle" : ""}`}>
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                    i < pinDigits.length 
                      ? (pinError ? "bg-red-500 text-white scale-105" : "bg-blue-500 text-white scale-105") 
                      : "bg-slate-100 border border-slate-200"
                  }`}
                >
                  {i < pinDigits.length ? "•" : ""}
                </div>
              ))}
            </div>

            {/* Compact Keypad */}
            <div className="grid grid-cols-3 gap-2 px-1 max-w-[240px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handlePinDigitClick(num.toString())}
                  className="h-10 rounded-xl bg-slate-50 border border-slate-100 text-sm font-black text-theme-secondary hover:bg-pink-50 hover:text-natural-pink active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <div className="h-10" />
              <button
                onClick={() => handlePinDigitClick("0")}
                className="h-10 rounded-xl bg-slate-50 border border-slate-100 text-sm font-black text-theme-secondary hover:bg-pink-50 hover:text-natural-pink active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              >
                0
              </button>
              <button
                onClick={handlePinDelete}
                className="h-10 rounded-xl bg-slate-100 border border-slate-200 text-theme-secondary hover:bg-red-50 hover:text-red-500 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            {pinError && (
              <p className="text-[10px] text-red-500 font-extrabold animate-fade-in">
                PIN errato, riprova
              </p>
            )}
          </div>
        )}

        <p className="text-[8.5px] text-slate-400 font-bold mt-4 italic">
          Protezione bambini attiva &bull; Conforme alle linee guida per la privacy dei minori
        </p>
      </div>
    </div>
  );
}
