import React, { useId, useState } from "react";
import { ArrowLeft, UserPlus, Trash2, Check, AlertCircle, RotateCcw, AlertTriangle } from "lucide-react";
import { ChildProfile, DeletedProfile } from "../types";
import { playClickSound } from "../utils/audio";

interface ProfilesViewProps {
  profiles: ChildProfile[];
  activeProfile: ChildProfile | null;
  onSelectProfile: (profile: ChildProfile) => void;
  onAddProfile: (nome: string, annoNascita: number, temaVisivo: string) => void;
  onDeleteProfile: (id: string) => void;
  deletedProfiles?: DeletedProfile[];
  onRestoreProfile?: (id: string) => void;
  onPermanentlyDeleteProfile?: (id: string) => void;
  onBack: () => void;
}

export default function ProfilesView({
  profiles,
  activeProfile,
  onSelectProfile,
  onAddProfile,
  onDeleteProfile,
  deletedProfiles = [],
  onRestoreProfile,
  onPermanentlyDeleteProfile,
  onBack
}: ProfilesViewProps) {
  const nomeErrorId = useId();
  const [nome, setNome] = useState("");
  const [annoNascita, setAnnoNascita] = useState<number>(2020);
  const [temaVisivo, setTemaVisivo] = useState("🌸 Giardino delle Fate");
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState("");
  const [profileToDelete, setProfileToDelete] = useState<ChildProfile | null>(null);
  const [profileToPermanentlyDelete, setProfileToPermanentlyDelete] = useState<ChildProfile | null>(null);

  const currentYear = new Date().getFullYear();
  const birthYears = Array.from({ length: 18 }, (_, i) => currentYear - i);

  const getAge = (year: number) => {
    return currentYear - year;
  };

  const getDaysRemaining = (deletedAt: string) => {
    const diffTime = Date.now() - new Date(deletedAt).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, 30 - diffDays);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError("Inserisci il nome del bambino!");
      return;
    }
    if (annoNascita > currentYear || annoNascita < currentYear - 17) {
      setError("Anno di nascita non valido.");
      return;
    }
    setError("");
    onAddProfile(nome.trim(), annoNascita, temaVisivo);
    setNome("");
    setAnnoNascita(2020);
    setTemaVisivo("Rosa Pastello");
    setShowAddForm(false);
  };

  return (
    <section className="flex-1 flex flex-col p-5" aria-labelledby="profiles-title">
      {/* Back button */}
      <header className="flex items-center gap-2 mb-4 shrink-0">
        <button
          onClick={() => { playClickSound(); onBack(); }}
          id="btn-back-profiles"
          aria-label="Torna alla schermata Home"
          className="w-9 h-9 bg-white hover:bg-natural-pink-light text-natural-burgundy rounded-xl flex items-center justify-center border-2 border-natural-pink-border shadow-xs transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h3 id="profiles-title" className="text-lg font-bold text-natural-burgundy font-serif italic">I Bambini</h3>
      </header>

      <p className="text-xs text-natural-text leading-relaxed mb-4 font-semibold">
        Crea un profilo per ciascuno dei tuoi bambini. L'IA personalizzerà la difficoltà delle storie in base alla loro età!
      </p>

      {/* Profiles list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1" aria-label="Elenco profili">
        {profiles.length === 0 ? (
          <div className="bg-white/40 rounded-[2rem] p-6 text-center border-4 border-dashed border-natural-pink-border my-4">
            <span className="text-4xl">🎒</span>
            <p className="text-xs font-bold text-natural-burgundy mt-3">Ancora nessun profilo!</p>
            <p className="text-[10px] text-theme-secondary mt-1 font-semibold">Crea un profilo qui sotto per iniziare l'avventura.</p>
          </div>
        ) : (
          profiles.map((profile) => {
            const isSelected = activeProfile?.id === profile.id;
            return (
              <article
                key={profile.id}
                id={`profile-card-${profile.id}`}
                onClick={() => { playClickSound(); onSelectProfile(profile); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    playClickSound();
                    onSelectProfile(profile);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Seleziona profilo ${profile.nome}`}
                aria-pressed={isSelected}
                className={`group cursor-pointer p-3.5 rounded-2xl border-4 transition-all duration-200 flex items-center justify-between ${
                  isSelected
                    ? "bg-[#FCE4EC] border-[#F48FB1] shadow-sm"
                    : "bg-white/80 border-transparent hover:border-natural-pink-border shadow-xs"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl border-2 shadow-inner ${
                    isSelected ? "bg-white border-[#F48FB1] text-natural-burgundy" : "bg-natural-pink-light/30 border-natural-pink-border text-natural-pink"
                  }`}>
                    {(() => {
                      const t = profile.temaVisivo || "";
                      if (t.includes("Bosco") || t === "Verde Bosco") return "🦊";
                      if (t.includes("Oceano") || t === "Azzurro Cielo") return "🐳";
                      if (t.includes("Sole") || t === "Giallo Sole") return "🦁";
                      if (t.includes("Unicorni") || t === "Lavanda") return "🦄";
                      return "🐼";
                    })()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-natural-burgundy">{profile.nome}</h4>
                    <p className="text-[10px] text-theme-secondary font-bold mt-0.5">
                      Nato nel {profile.annoNascita} &bull; {getAge(profile.annoNascita)} anni &bull; 🎨 {(() => {
                        const name = profile.temaVisivo;
                        if (!name) return "🌸 Giardino delle Fate";
                        switch (name) {
                          case "Rosa Pastello": return "🌸 Giardino delle Fate";
                          case "Verde Bosco": return "🌲 Bosco delle Meraviglie";
                          case "Azzurro Cielo": return "🌊 Oceano Incantato";
                          case "Giallo Sole": return "✨ Isola del Sole Dorato";
                          case "Lavanda": return "🦄 Prateria degli Unicorni";
                          default: return name;
                        }
                      })()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isSelected && (
                    <span className="bg-gradient-to-r from-natural-pink to-[#EC407A] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 shadow-xs">
                      <Check size={10} strokeWidth={3} /> Attivo
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playClickSound();
                      setProfileToDelete(profile);
                    }}
                    aria-label={`Elimina il profilo ${profile.nome}`}
                    id={`btn-delete-profile-${profile.id}`}
                    className="p-1.5 text-theme-secondary hover:text-[#EC407A] hover:bg-natural-pink-light/30 rounded-lg transition-colors"
                    title="Elimina profilo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            );
          })
        )}

        {/* Toggle Form Button */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            id="btn-show-add-profile-form"
            aria-label="Apri modulo per aggiungere un nuovo profilo"
            className="w-full py-3 px-4 bg-white/80 hover:bg-white text-natural-burgundy border-4 border-dashed border-natural-pink-border hover:border-natural-pink font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all mt-4"
          >
            <UserPlus size={16} /> Aggiungi Nuovo Profilo
          </button>
        )}

        {/* Add Form Card */}
        {showAddForm && (
          <form
            onSubmit={handleSubmit}
            aria-labelledby="new-profile-title"
            className="bg-white/90 rounded-[2rem] p-5 border-4 border-natural-pink-border shadow-md space-y-3.5 mt-4"
          >
            <h4 id="new-profile-title" className="font-extrabold text-sm text-natural-burgundy flex items-center gap-1.5 border-b border-natural-pink-light pb-2 font-serif italic">
              <span>🌈</span> Nuovo Lettore
            </h4>

            {error && (
              <div id={nomeErrorId} role="alert" aria-live="assertive" className="bg-red-50 text-red-800 text-xs p-2 rounded-xl flex items-center gap-1.5 border border-red-200 font-semibold">
                <AlertCircle size={14} />
                <span>Errore: {error}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-natural-text/70 uppercase tracking-wide mb-1">
                Nome del Bambino
              </label>
              <input
                id="profile-name"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={20}
                placeholder="es: Leo, Mia..."
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? nomeErrorId : undefined}
                className="w-full bg-natural-bg border-2 border-natural-pink-light rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-none focus:ring-4 focus:ring-natural-pink-light/30 font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-natural-text/70 uppercase tracking-wide mb-1">
                Anno di Nascita
              </label>
              <select
                id="profile-birth-year"
                value={annoNascita}
                onChange={(e) => setAnnoNascita(parseInt(e.target.value))}
                className="w-full bg-natural-bg border-2 border-natural-pink-light rounded-xl px-3 py-2 text-xs text-natural-text focus:outline-none focus:ring-4 focus:ring-natural-pink-light/30 font-bold"
              >
                {birthYears.map((y) => (
                  <option key={y} value={y}>
                    {y} ({getAge(y)} anni)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label id="profile-theme-label" className="block text-[10px] font-bold text-natural-text/70 uppercase tracking-wide mb-1.5">
                Tema Magico del Bambino
              </label>
              <div className="flex flex-col gap-2" role="radiogroup" aria-labelledby="profile-theme-label">
                {[
                  { name: "🌸 Giardino delle Fate", id: "rosa", color: "#FEF9F0", ring: "ring-pink-300", border: "border-pink-200", text: "text-[#880E4F]" },
                  { name: "🌲 Bosco delle Meraviglie", id: "verde", color: "#F1F8E9", ring: "ring-green-300", border: "border-green-200", text: "text-[#2E7D32]" },
                  { name: "🌊 Oceano Incantato", id: "azzurro", color: "#E1F5FE", ring: "ring-blue-300", border: "border-blue-200", text: "text-[#0277BD]" },
                  { name: "✨ Isola del Sole Dorato", id: "giallo", color: "#FFFDE7", ring: "ring-amber-300", border: "border-amber-200", text: "text-[#E65100]" },
                  { name: "🦄 Prateria degli Unicorni", id: "lavanda", color: "#F3E5F5", ring: "ring-purple-300", border: "border-purple-200", text: "text-[#6A1B9A]" },
                ].map((th) => {
                  const isSelected = temaVisivo === th.name;
                  return (
                    <button
                      key={th.name}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setTemaVisivo(th.name);
                      }}
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`Tema ${th.name}`}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 text-xs font-black transition-all text-left cursor-pointer ${
                        isSelected
                          ? `ring-3 ${th.ring} border-natural-pink shadow-inner bg-white`
                          : "opacity-80 hover:opacity-100 border-slate-200 bg-slate-50/50"
                      } ${th.text}`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/15 shrink-0 shadow-sm"
                        style={{ backgroundColor: th.color }}
                      ></span>
                      <span className="truncate">{th.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                id="btn-cancel-add-profile"
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold text-xs text-center transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                id="btn-submit-add-profile"
                className="py-2.5 px-3 bg-gradient-to-r from-natural-pink to-[#EC407A] text-white rounded-full font-bold text-xs text-center shadow-md border-b-4 border-[#C2185B] active:border-b-0 active:translate-y-0.5 transition-all"
              >
                Salva Profilo
              </button>
            </div>
          </form>
        )}

        {/* --- RECYCLE BIN SECTION --- */}
        {deletedProfiles.length > 0 && (
          <div className="mt-8 pt-4 border-t border-dashed border-natural-pink-border/85">
            <h4 className="text-xs font-black text-natural-burgundy/80 flex items-center gap-1.5 font-serif italic mb-3">
              <span>🗑️</span> Cestino dei Ricordi
            </h4>
            <p className="text-[10px] text-theme-secondary leading-tight mb-3 font-semibold">
              I profili eliminati rimangono salvati qui per un massimo di 30 giorni prima di essere cancellati del tutto. Puoi ripristinarli o eliminarli definitivamente.
            </p>
            <div className="space-y-2">
              {deletedProfiles.map(({ profile, deletedAt }) => {
                const daysRemaining = getDaysRemaining(deletedAt);
                return (
                  <div
                    key={profile.id}
                    className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <h5 className="font-bold text-xs text-[#5D4037]">{profile.nome}</h5>
                      <p className="text-[8px] text-theme-secondary font-bold mt-0.5">
                        Eliminato il {new Date(deletedAt).toLocaleDateString("it-IT")} &bull; Mancano {daysRemaining} giorni
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          playClickSound();
                          if (onRestoreProfile) onRestoreProfile(profile.id);
                        }}
                        aria-label={`Ripristina il profilo ${profile.nome}`}
                        className="flex items-center gap-1 py-1 px-2.5 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2E7D32] text-[9px] font-black uppercase tracking-wider rounded-lg border border-[#A5D6A7] transition-all cursor-pointer shadow-2xs"
                        title="Ripristina profilo"
                      >
                        <RotateCcw size={10} /> Ripristina
                      </button>
                      <button
                        onClick={() => {
                          playClickSound();
                          setProfileToPermanentlyDelete(profile);
                        }}
                        aria-label={`Elimina definitivamente il profilo ${profile.nome}`}
                        className="p-1 text-natural-text/40 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Elimina definitivamente"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* --- CONFIRMATION MODALS --- */}
      {/* 1. MOVE TO CESTINO CONFIRMATION MODAL */}
      {profileToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-5 z-50 animate-fade-in" role="presentation">
          <div className="bg-white rounded-[2rem] p-6 border-4 border-natural-pink-border shadow-2xl max-w-sm w-full text-center space-y-4" role="dialog" aria-modal="true" aria-labelledby="delete-profile-title" aria-describedby="delete-profile-description">
            <div className="w-12 h-12 bg-[#FFF3E0] text-[#E65100] rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-[#FFE082]">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 id="delete-profile-title" className="font-extrabold text-sm text-natural-burgundy font-serif italic">
                Spostare {profileToDelete.nome} nel Cestino?
              </h4>
              <p id="delete-profile-description" className="text-[10px] text-natural-text/70 mt-2 leading-relaxed font-semibold">
                Il profilo non sarà più visibile tra i lettori attivi. Rimarrà nel Cestino per un mese (30 giorni) prima di essere eliminato del tutto.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => {
                  playClickSound();
                  onDeleteProfile(profileToDelete.id);
                  setProfileToDelete(null);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-natural-pink to-[#EC407A] text-white rounded-full font-bold text-xs text-center shadow-md border-b-4 border-[#C2185B] active:border-b-0 active:translate-y-0.5 transition-all cursor-pointer"
              >
                Sì, sposta nel Cestino
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setProfileToDelete(null);
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold text-xs text-center transition-colors cursor-pointer"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. PERMANENT DELETE CONFIRMATION MODAL */}
      {profileToPermanentlyDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-5 z-50 animate-fade-in" role="presentation">
          <div className="bg-white rounded-[2rem] p-6 border-4 border-red-200 shadow-2xl max-w-sm w-full text-center space-y-4" role="dialog" aria-modal="true" aria-labelledby="delete-profile-hard-title" aria-describedby="delete-profile-hard-description">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-red-200 animate-bounce">
              <AlertCircle size={24} />
            </div>
            <div>
              <h4 id="delete-profile-hard-title" className="font-extrabold text-sm text-red-800 font-serif italic">
                Eliminare definitivamente?
              </h4>
              <p id="delete-profile-hard-description" className="text-[10px] text-red-700 mt-2 leading-relaxed font-bold">
                Attenzione! Questa azione è irreversibile. Il profilo di {profileToPermanentlyDelete.nome} e tutti i suoi dati verranno persi per sempre.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => {
                  playClickSound();
                  if (onPermanentlyDeleteProfile) {
                    onPermanentlyDeleteProfile(profileToPermanentlyDelete.id);
                  }
                  setProfileToPermanentlyDelete(null);
                }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xs text-center shadow-md border-b-4 border-red-800 active:border-b-0 active:translate-y-0.5 transition-all cursor-pointer"
              >
                Sì, elimina per sempre
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setProfileToPermanentlyDelete(null);
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold text-xs text-center transition-colors cursor-pointer"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
