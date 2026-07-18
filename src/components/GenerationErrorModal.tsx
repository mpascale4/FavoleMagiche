import React from "react";
import { AlertCircle } from "lucide-react";
import { playClickSound } from "../utils/audio";

interface GenerationErrorModalProps {
  title: string;
  message: string;
  reason: string;
  onRetry?: () => void;
  onCancel: () => void;
  showRetryButton?: boolean;
}

export default function GenerationErrorModal({
  title,
  message,
  reason,
  onRetry,
  onCancel,
  showRetryButton = true
}: GenerationErrorModalProps) {
  const titleId = "generation-error-title";
  const descriptionId = "generation-error-description";

  return (
    <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-[200]" role="presentation">
      <div className="bg-white rounded-[2.5rem] border-4 border-red-200 p-6 max-w-sm w-full shadow-[0_10px_40px_rgba(220,38,38,0.3)] space-y-4 animate-in fade-in scale-95" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
        {/* Error Icon */}
        <div className="flex justify-center mb-2">
          <div className="w-16 h-16 rounded-full bg-red-100/80 flex items-center justify-center shadow-lg">
            <AlertCircle size={32} className="text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h2 id={titleId} className="text-center font-bold text-lg text-red-600 font-serif">
          {title}
        </h2>

        {/* Message */}
        <p id={descriptionId} className="text-center text-sm font-semibold text-slate-700">
          {message}
        </p>

        {/* Reason */}
        <div className="bg-red-50/50 border-l-4 border-red-400 p-3 rounded text-[13px] font-mono text-red-700">
          <div className="font-bold text-[11px] uppercase tracking-wider text-red-600 mb-1">
            Motivo:
          </div>
          <div className="break-words">{reason}</div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              playClickSound();
              onCancel();
            }}
            aria-label="Chiudi errore e torna indietro"
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-extrabold text-sm rounded-full transition-all border-2 border-slate-200 cursor-pointer"
          >
            Indietro
          </button>

          {showRetryButton && onRetry && (
            <button
              onClick={() => {
                playClickSound();
                onRetry();
              }}
              aria-label="Riprova generazione favola"
              className="flex-1 py-3 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-extrabold text-sm rounded-full transition-all border-2 border-red-700 shadow-lg cursor-pointer"
            >
              Riprova
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

