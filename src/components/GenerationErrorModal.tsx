import React from "react";
import { AlertCircle } from "lucide-react";
import { useSwipeToDismiss } from "@mp/app-kit";
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
  const { offset, isDragging, handlers } = useSwipeToDismiss({ onDismiss: onCancel });

  return (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-200" role="presentation">
          <div
            className="bg-white rounded-[2.5rem] border-4 border-red-200 p-6 max-w-sm w-full shadow-[0_10px_40px_rgba(220,38,38,0.3)] space-y-4 animate-in fade-in scale-95"
            style={{ transform: `translateY(${offset}px)`, transition: isDragging ? "none" : undefined }}
            {...handlers}
            role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} aria-live="assertive">
        {/* Error Icon */}
            <div className="flex flex-col items-center mb-2 gap-2">
              <div className="text-[11px] font-black uppercase tracking-[0.25em] text-red-700 flex items-center gap-1">
                <AlertCircle size={12} aria-hidden="true" />
                <span>Errore</span>
              </div>
          <div className="w-16 h-16 rounded-full bg-red-100/80 flex items-center justify-center shadow-lg">
            <AlertCircle size={32} className="text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h2 id={titleId} className="text-center font-bold text-lg text-red-600 font-serif">
          {title}
        </h2>

        {/* Message */}
        <p id={descriptionId} className="text-center text-sm font-semibold text-theme-primary">
          {message}
        </p>

        {/* Reason */}
        <div className="bg-red-50/70 border-l-4 border-red-500 p-3 rounded text-[13px] font-mono text-red-800">
          <div className="font-bold text-[11px] uppercase tracking-wider text-red-700 mb-1 flex items-center gap-1">
            <AlertCircle size={11} aria-hidden="true" />
            <span>Motivo:</span>
          </div>
          <div className="wrap-break-word">{reason}</div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              playClickSound();
              onCancel();
            }}
            aria-label="Chiudi errore e torna indietro"
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-theme-secondary font-extrabold text-sm rounded-full transition-all border-2 border-slate-200 cursor-pointer"
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

