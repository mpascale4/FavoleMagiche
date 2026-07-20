import React, { useState } from "react";
import { ArrowLeft, Search, Star, Trash2, Calendar, Clock, Sparkles, RotateCcw, AlertTriangle, ChevronDown, ChevronUp, Layers, X } from "lucide-react";
import { Story, CATEGORIES, DeletedStory } from "../types";
import { playClickSound } from "../utils/audio";
import { getEducationalThemeDisplayName } from "../utils/themeNames";

interface ArchiveViewProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  onDeleteStory: (id: string) => void;
  deletedStories?: DeletedStory[];
  onRestoreStory?: (id: string) => void;
  onPermanentlyDeleteStory?: (id: string) => void;
  onBack: () => void;
}

export default function ArchiveView({
  stories,
  onSelectStory,
  onDeleteStory,
  deletedStories = [],
  onRestoreStory,
  onPermanentlyDeleteStory,
  onBack
}: ArchiveViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("Tutte");
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);
  const [storyToPermanentlyDelete, setStoryToPermanentlyDelete] = useState<Story | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>({});
  const [showTrashModal, setShowTrashModal] = useState(false);

  const toggleSeries = (sId: string) => {
    setExpandedSeries(prev => ({ ...prev, [sId]: !prev[sId] }));
  };

  const getDaysRemaining = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt).getTime();
    const expiryDate = deletedDate + 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const formatDateShort = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr.split("T")[0];
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = String(date.getFullYear()).slice(-2);
      return `${day}/${month}/${year}`;
    } catch {
      return "";
    }
  };

  // Filter logic
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "---";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      
      // Check if original string has a time component
      if (dateStr.includes("T") || dateStr.includes(":")) {
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${day}/${month}/${year} alle ${hours}:${minutes}`;
      }
      
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const getThumbnailBadge = (count: number) => {
    if (count === 0) {
      return (
        <div className="absolute -top-1.5 -right-1.5 bg-slate-400 text-white border-2 border-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black shadow-xs" title="Nuova favola da leggere">
          💤
        </div>
      );
    }
    if (count === 1) {
      return (
        <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white border-2 border-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black shadow-xs animate-pulse" title="Prima lettura">
          🌱
        </div>
      );
    }
    if (count < 5) {
      return (
        <div className="absolute -top-1.5 -right-1.5 bg-teal-500 text-white border-2 border-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black shadow-xs" title={`Letta ${count} volte`}>
          🌿
        </div>
      );
    }
    return (
      <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white border-2 border-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black shadow-xs animate-bounce" title={`Super letta! ${count} volte`}>
        🌳
      </div>
    );
  };

  const renderReadingStatusBadge = (count: number) => {
    if (count === 0) {
      return (
        <span className="flex items-center gap-1 shrink-0 ml-auto bg-slate-300 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-500 dark:border-slate-600 rounded-full px-2 py-0.5 text-[8.5px] shadow-3xs font-black">
          💤 Mai letta
        </span>
      );
    }
    if (count === 1) {
      return (
        <span className="flex items-center gap-1 shrink-0 ml-auto bg-emerald-600 text-white border border-emerald-700 rounded-full px-2 py-0.5 text-[8.5px] shadow-3xs font-black">
          🌱 Letta 1 volta
        </span>
      );
    }
    if (count < 5) {
      return (
        <span className="flex items-center gap-1 shrink-0 ml-auto bg-teal-600 text-white border border-teal-700 rounded-full px-2 py-0.5 text-[8.5px] shadow-3xs font-black">
          🌿 Letta {count} volte
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 shrink-0 ml-auto bg-amber-500 text-slate-950 border-2 border-amber-600 rounded-full px-2 py-0.5 text-[8.5px] shadow-3xs font-black animate-pulse">
        🌳✨ Letta {count} volte!
      </span>
    );
  };

  const filteredStories = stories.filter((story) => {
    const matchesSearch =
      story.titolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.pagine.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase())) ||
      story.morale.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCat === "Tutte" || story.categoria === selectedCat;
    const matchesFavorites = !showFavoritesOnly || story.preferita;

    return matchesSearch && matchesCategory && matchesFavorites;
  });

  // Group by seriesId first to keep chapters together
  const seriesGroups: Record<string, Story[]> = {};
  filteredStories.forEach(story => {
    const sId = story.seriesId || story.id;
    if (!seriesGroups[sId]) seriesGroups[sId] = [];
    seriesGroups[sId].push(story);
  });

  // Find max date for each series to sort series by newest
  const seriesMaxDates: Record<string, string> = {};
  Object.keys(seriesGroups).forEach(sId => {
    let maxDate = "";
    seriesGroups[sId].forEach(s => {
      const d = s.dataCreazione || s.data || "";
      if (d > maxDate) maxDate = d;
    });
    seriesMaxDates[sId] = maxDate;
  });

  const sortedSeriesIds = Object.keys(seriesGroups).sort((a, b) => {
    return seriesMaxDates[b].localeCompare(seriesMaxDates[a]);
  });

  const sortedStories: Story[] = [];
  sortedSeriesIds.forEach(sId => {
    const group = seriesGroups[sId];
    group.sort((a, b) => {
      const capA = a.chapter || 1;
      const capB = b.chapter || 1;
      return capA - capB; // chapters ascending (1, 2, 3...)
    });
    sortedStories.push(...group);
  });

  const getCoverEmoji = (theme: string) => {
    switch (theme?.toLowerCase()) {
      case "unicorn": return "🦄";
      case "dragon": return "🐲";
      case "robot": return "🤖";
      case "alien": return "👽";
      case "space": return "🌌";
      case "sea": return "🧜‍♀️";
      case "forest": return "🌲";
      case "castle": return "🏰";
      case "dinosaur": return "🦕";
      case "star": return "⭐";
      case "superhero": return "🦸";
      default: return "📖";
    }
  };

  // Color mappings
  const colorBgMap: Record<string, string> = {
    "pastel-pink": "bg-[#FCE4EC] border-[#F8BBD0] text-[#880E4F]",
    "pastel-blue": "bg-[#E1F5FE] border-[#B3E5FC] text-[#0277BD]",
    "pastel-purple": "bg-[#F3E5F5] border-[#E1BEE7] text-[#4A148C]",
    "pastel-green": "bg-[#E8F5E9] border-[#C8E6C9] text-[#1B5E20]",
    "pastel-yellow": "bg-[#FFFDE7] border-[#FFE082] text-[#F9A825]"
  };

  return (
    <section className="flex-1 flex flex-col p-5" aria-labelledby="archive-title">
      {/* Back Header */}
      <header className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { playClickSound(); onBack(); }}
            id="btn-back-archive"
            aria-label="Torna alla Home"
            className="w-9 h-9 bg-white hover:bg-natural-pink-light text-natural-burgundy rounded-xl flex items-center justify-center border-2 border-natural-pink-border shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <h3 id="archive-title" className="text-lg font-bold text-natural-burgundy font-serif italic">Libreria Magica</h3>
          
          <button
            onClick={() => { playClickSound(); setShowFavoritesOnly(!showFavoritesOnly); }}
            id="btn-archive-toggle-favorites-top"
            aria-pressed={showFavoritesOnly}
            aria-label={showFavoritesOnly ? "Mostra tutte le favole" : "Mostra solo le favole preferite"}
            className={`p-1 rounded-full transition-all cursor-pointer border ${
              showFavoritesOnly
                ? "bg-amber-100 border-amber-300 text-natural-yellow scale-110"
                : "bg-transparent border-transparent text-slate-300 hover:text-natural-yellow"
            }`}
          >
            <Star size={20} fill={showFavoritesOnly ? "currentColor" : "none"} />
          </button>
        </div>

        <button
          onClick={() => { playClickSound(); setShowTrashModal(true); }}
          className="w-9 h-9 bg-white hover:bg-slate-50 text-slate-500 hover:text-red-500 rounded-xl flex items-center justify-center border-2 border-slate-200 shadow-3xs cursor-pointer relative shrink-0"
          title="Cestino dei ricordi"
        >
          <Trash2 size={16} />
          {deletedStories.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[9px] font-black border-2 border-white animate-pulse">
              {deletedStories.length}
            </span>
          )}
        </button>
      </header>

      {/* Search and Categories Bar */}
      <div className="space-y-2 mb-3.5 shrink-0">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-natural-pink" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              id="input-archive-search"
              aria-label="Cerca favole in archivio"
              placeholder="Cerca titolo, personaggio, tema..."
              className="w-full bg-white border-2 border-natural-pink-light rounded-2xl pl-10 pr-4 py-2 text-xs text-natural-text focus:outline-none focus:ring-4 focus:ring-natural-pink-light/30 font-bold"
            />
          </div>
          
          <button
            onClick={() => { playClickSound(); setShowCategoryFilter(!showCategoryFilter); }}
            id="btn-toggle-category-filter"
            aria-label="Filtra per Categoria"
            className={`px-3 py-2 rounded-2xl border-2 font-bold text-xs transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              showCategoryFilter || selectedCat !== "Tutte"
                ? "bg-gradient-to-r from-natural-pink to-[#EC407A] text-white border-[#EC407A]"
                : "bg-white text-natural-text border-natural-pink-border hover:bg-[#FCE4EC]/30"
            }`}
          >
            <span>📁 Categorie</span>
            {selectedCat !== "Tutte" && (
              <span className="bg-white text-[#EC407A] rounded-full px-1.5 text-[8.5px] font-black">
                {selectedCat}
              </span>
            )}
          </button>
        </div>

        {/* Expandable Category Selection Grid (No scrolling) */}
        {(showCategoryFilter || selectedCat !== "Tutte") && (
          <div className="bg-white/80 border-2 border-natural-pink-border/50 rounded-2xl p-2 mb-1 animate-in fade-in slide-in-from-top-1 duration-150 shrink-0">
            <div className="flex items-center justify-between px-1.5 pb-1.5 border-b border-black/5 mb-1.5">
              <span className="text-[9px] font-black text-natural-burgundy uppercase tracking-wider">Seleziona Categoria</span>
              <button 
                onClick={() => { playClickSound(); setSelectedCat("Tutte"); setShowCategoryFilter(false); }}
                className="text-[8px] font-black text-[#EC407A] hover:underline uppercase"
              >
                Reset ×
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-1" role="radiogroup" aria-label="Filtro categoria">
              <button
                onClick={() => { playClickSound(); setSelectedCat("Tutte"); }}
                role="radio"
                aria-checked={selectedCat === "Tutte"}
                className={`px-1.5 py-1 rounded-lg font-bold text-[9px] border transition-all text-center truncate cursor-pointer ${
                  selectedCat === "Tutte"
                    ? "bg-gradient-to-r from-natural-pink to-[#EC407A] text-white border-[#EC407A] shadow-3xs"
                    : "bg-white text-natural-text border-slate-100 hover:bg-slate-50"
                }`}
              >
                ✨ Tutte ({stories.length})
              </button>
              {CATEGORIES.map((cat) => {
                const count = stories.filter(s => s.categoria === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => { playClickSound(); setSelectedCat(cat); }}
                    role="radio"
                    aria-checked={selectedCat === cat}
                    className={`px-1.5 py-1 rounded-lg font-bold text-[9px] border transition-all text-center truncate cursor-pointer ${
                      selectedCat === cat
                        ? "bg-gradient-to-r from-natural-pink to-[#EC407A] text-white border-[#EC407A] shadow-3xs"
                        : "bg-white text-natural-text border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    {cat} {count > 0 ? `(${count})` : ""}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
            {/* Stories list */}
      <div className="flex-1 overflow-y-auto space-y-2 px-1.5 pb-3 scrollbar-none">
        {filteredStories.length === 0 ? (
          <div className="bg-white/40 rounded-[2rem] p-8 text-center border-4 border-dashed border-natural-pink-border my-4 space-y-2">
            <span className="text-4xl">🏰</span>
            <p className="text-xs font-extrabold text-natural-burgundy">Nessuna favola trovata!</p>
            <p className="text-[11px] text-natural-text font-semibold leading-relaxed px-4">
              Prova a cambiare filtri o a creare la tua prima favola personalizzata nella Home!
            </p>
          </div>
        ) : (
          sortedSeriesIds.map((sId) => {
            const group = seriesGroups[sId];
            const hasChapters = group.length > 1;
            const totalChapters = group.length;
            const isExpanded = !!expandedSeries[sId];

            // If it has chapters, and is NOT expanded, we only show the first story.
            // If it IS expanded, we show all of them.
            const storiesToRender = hasChapters && !isExpanded ? [group[0]] : group;

            return (
              <div key={`series-${sId}`} className={`relative mb-2.5 ${hasChapters ? "bg-white/40 p-2 rounded-2xl border border-dashed border-slate-300/50 space-y-2" : ""}`}>
                {hasChapters && isExpanded && (
                  <div className="absolute left-5 top-12 bottom-12 w-0.5 bg-amber-300 rounded-full z-0" />
                )}

                {storiesToRender.map((story, index) => {
                  const cardColorClass = colorBgMap[story.coverColor] || colorBgMap["pastel-blue"];
                  const readingCount = story.volteLetta !== undefined ? story.volteLetta : (story.ultimaLettura ? 1 : 0);
                  const isBedtime = story.categoria?.toLowerCase().includes("buonanotte") || 
                                    story.categoria?.toLowerCase().includes("nanna") || 
                                    !!story.isBedtimeMode;
                  
                  const chapterNum = story.chapter || 1;
                  const isSubChapter = hasChapters && index > 0;

                  return (
                    <div
                      key={story.id}
                      id={`story-card-${story.id}`}
                      onClick={() => { playClickSound(); onSelectStory(story); }}
                      className={`group cursor-pointer rounded-2xl border-2 p-2 hover:shadow-md transition-all duration-200 flex items-center justify-between gap-2.5 relative z-10 ${isSubChapter ? "ml-4" : ""} ${cardColorClass} ${isBedtime ? "ring-1.5 ring-indigo-400 border-indigo-300 shadow-3xs" : ""}`}
                    >
                      {/* Connection Dot for Chapters */}
                      {isSubChapter && (
                        <div className="absolute -left-[16px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white border-2 border-amber-400 rounded-full z-10" />
                      )}

                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="relative shrink-0 select-none">
                          <div className="relative w-9 h-9 bg-white rounded-lg flex items-center justify-center text-xl shadow-xs border border-black/5 group-hover:scale-105 transition-transform">
                            {getCoverEmoji(story.coverTheme)}
                            {isBedtime && (
                              <div className="absolute -bottom-1 -left-1 bg-[#1A237E] text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[7px] shadow-3xs select-none z-10">
                                🌙
                              </div>
                            )}
                          </div>
                        </div> 

                        <div className="min-w-0 flex-1 leading-tight">
                          <h4 className="font-extrabold text-[11.5px] leading-tight font-serif text-natural-burgundy flex items-center gap-1 truncate">
                            <span className="truncate">{story.titolo}</span>
                            {hasChapters && (
                              <span className="bg-amber-100 text-amber-800 border border-amber-300 px-1 py-0.2 rounded text-[7.5px] font-black uppercase shrink-0">
                                Cap. {chapterNum}
                              </span>
                            )}
                          </h4>
                          
                          {/* Compact details row */}
                          <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-slate-600 mt-0.5">
                            <span className="bg-white/70 px-1 py-0.2 rounded text-[#EC407A] uppercase text-[7.5px] border border-black/5 shrink-0">
                              {story.categoria}
                            </span>
                            <span className="opacity-60">•</span>
                            <span className="flex items-center gap-0.5 font-semibold text-slate-500 shrink-0">
                              ⏱️ {story.durata}
                            </span>
                            <span className="opacity-60">•</span>
                            <span className="text-[#F57C00] truncate">
                              🌟 {getEducationalThemeDisplayName(story.temaEducativo)}
                            </span>
                          </div>

                          {/* Date and readings counter */}
                          <div className="text-[8px] font-extrabold text-theme-secondary/80 flex items-center gap-2 mt-1">
                            <span>📅 {formatDateShort(story.dataCreazione || story.data)}</span>
                            <span>•</span>
                            <span className="text-slate-500">
                              📖 Letta {readingCount} {readingCount === 1 ? "volta" : "volte"}
                            </span>
                            {story.personaggi && story.personaggi.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="truncate text-natural-burgundy max-w-[100px]">
                                  👤 {story.personaggi.map(p => p.nome).join(", ")}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Compact actions block */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playClickSound();
                            onSelectStory(story);
                          }}
                          className="px-2 py-1 text-[8.5px] font-black rounded-lg border border-slate-300/60 bg-white hover:bg-slate-50 text-theme-secondary shadow-3xs cursor-pointer"
                        >
                          Apri
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStoryToDelete(story);
                          }}
                          id={`btn-delete-story-${story.id}`}
                          className="p-1 text-slate-400 hover:text-[#EC407A] hover:bg-white/80 rounded-lg transition-all cursor-pointer"
                          title="Sposta nel cestino"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Elegant Toggle Series Button at the bottom if hasChapters */}
                {hasChapters && (
                  <div className="flex items-center justify-center pt-1">
                    <button
                      type="button"
                      onClick={() => { playClickSound(); toggleSeries(sId); }}
                      className="text-[8.5px] font-extrabold text-theme-secondary uppercase flex items-center gap-1 hover:text-natural-burgundy hover:bg-amber-100/60 transition-all cursor-pointer bg-white/80 border border-amber-200/80 rounded-full px-3 py-1 shadow-3xs"
                    >
                      <Layers size={9} className="text-amber-500" />
                      <span>
                        {isExpanded 
                          ? "Nascondi altri capitoli della serie ▴" 
                          : `Mostra altri ${totalChapters - 1} capitoli della serie ▾`}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="text-center text-[10px] font-bold text-natural-text shrink-0 pt-2 border-t-2 border-natural-pink-light">
        Totale storie conservate: <span className="text-natural-burgundy font-black">{stories.length}</span>
      </div>

      {/* Cestino (Trash) Modal */}
      {showTrashModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-5 z-50 animate-fade-in" role="presentation">
          <div className="bg-white rounded-[2rem] border-4 border-slate-300 p-5 max-w-sm w-full text-center space-y-4 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setShowTrashModal(false)}
              className="absolute -top-3.5 -right-3.5 bg-slate-500 hover:bg-slate-600 active:scale-95 text-white font-bold w-11 h-11 flex items-center justify-center rounded-full border-4 border-white shadow-lg cursor-pointer z-50 transition-all"
              title="Chiudi"
            >
              <X size={18} strokeWidth={3} />
            </button>

            <div className="text-4xl">🗑️</div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-natural-burgundy font-serif italic">
                Cestino dei Ricordi
              </h4>
              <p className="text-[10px] text-natural-text/80 font-bold leading-tight">
                Le favole eliminate rimangono salvate qui per 30 giorni. Puoi ripristinarle o eliminarle definitivamente.
              </p>
            </div>

            <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2 text-left scrollbar-none">
              {deletedStories.length === 0 ? (
                <div className="text-center py-6 text-[10px] font-bold text-slate-400">
                  Il cestino è vuoto ✨
                </div>
              ) : (
                deletedStories.map(({ story, deletedAt }) => {
                  const daysRemaining = getDaysRemaining(deletedAt);
                  return (
                    <div
                      key={story.id}
                      className="p-2.5 bg-slate-50/80 border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1 pr-1">
                        <h5 className="font-extrabold text-[10.5px] text-slate-700 truncate font-serif">
                          {story.titolo}
                        </h5>
                        <p className="text-[8.5px] font-bold text-theme-secondary flex items-center gap-1 mt-0.5">
                          <AlertTriangle size={9} className="text-amber-500 shrink-0" />
                          <span>{daysRemaining} {daysRemaining === 1 ? 'giorno rimasto' : 'giorni rimasti'}</span>
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playClickSound();
                            if (onRestoreStory) onRestoreStory(story.id);
                          }}
                          className="p-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg transition-all cursor-pointer"
                          title="Ripristina"
                        >
                          <RotateCcw size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playClickSound();
                            setStoryToPermanentlyDelete(story);
                          }}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-all cursor-pointer"
                          title="Elimina per sempre"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Dialog */}
      {storyToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-5 z-50 animate-fade-in" role="presentation">
          <div className="bg-white rounded-[2rem] border-4 border-natural-pink-border p-6 max-w-sm w-full text-center space-y-4 shadow-xl transform scale-100 transition-all animate-scale-up relative" role="dialog" aria-modal="true" aria-labelledby="archive-delete-title" aria-describedby="archive-delete-description">
            <button
              onClick={() => setStoryToDelete(null)}
              className="absolute -top-3.5 -right-3.5 bg-slate-500 hover:bg-slate-600 active:scale-95 text-white font-bold w-11 h-11 flex items-center justify-center rounded-full border-4 border-white shadow-lg cursor-pointer z-50 transition-all"
              title="Chiudi"
            >
              <X size={18} strokeWidth={3} />
            </button>

            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-2xl mx-auto border-2 border-red-100">
              🗑️
            </div>
            <div className="space-y-1.5">
              <h4 id="archive-delete-title" className="font-extrabold text-sm text-natural-burgundy font-serif italic">
                Spostare nel cestino?
              </h4>
              <p id="archive-delete-description" className="text-[11px] text-natural-text font-bold leading-relaxed">
                Vuoi spostare <span className="text-natural-burgundy font-black">"{storyToDelete.titolo}"</span> nel cestino? Potrai ripristinarla entro 30 giorni.
              </p>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setStoryToDelete(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-theme-secondary rounded-full text-[11px] font-extrabold transition-all cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  onDeleteStory(storyToDelete.id);
                  setStoryToDelete(null);
                }}
                className="flex-1 py-2 bg-gradient-to-r from-[#EC407A] to-[#D81B60] hover:brightness-105 border-2 border-[#D81B60] text-white rounded-full text-[11px] font-extrabold transition-all cursor-pointer shadow-xs"
              >
                Sì, sposta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Dialog */}
      {storyToPermanentlyDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-5 z-50 animate-fade-in" role="presentation">
          <div className="bg-white rounded-[2rem] border-4 border-natural-pink-border p-6 max-w-sm w-full text-center space-y-4 shadow-xl transform scale-100 transition-all animate-scale-up relative" role="dialog" aria-modal="true" aria-labelledby="archive-hard-delete-title" aria-describedby="archive-hard-delete-description">
            <button
              onClick={() => setStoryToPermanentlyDelete(null)}
              className="absolute -top-3.5 -right-3.5 bg-slate-500 hover:bg-slate-600 active:scale-95 text-white font-bold w-11 h-11 flex items-center justify-center rounded-full border-4 border-white shadow-lg cursor-pointer z-50 transition-all"
              title="Chiudi"
            >
              <X size={18} strokeWidth={3} />
            </button>

            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-2xl mx-auto border-2 border-red-100">
              ⚠️
            </div>
            <div className="space-y-1.5">
              <h4 id="archive-hard-delete-title" className="font-extrabold text-sm text-natural-burgundy font-serif italic">
                Eliminare definitivamente?
              </h4>
              <p id="archive-hard-delete-description" className="text-[11px] text-natural-text font-bold leading-relaxed">
                Questa azione è permanente. La favola <span className="text-natural-burgundy font-black">"{storyToPermanentlyDelete.titolo}"</span> non potrà più essere recuperata.
              </p>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setStoryToPermanentlyDelete(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-theme-secondary rounded-full text-[11px] font-extrabold transition-all cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  if (onPermanentlyDeleteStory) onPermanentlyDeleteStory(storyToPermanentlyDelete.id);
                  setStoryToPermanentlyDelete(null);
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 border-2 border-red-700 text-white rounded-full text-[11px] font-extrabold transition-all cursor-pointer shadow-xs"
              >
                Elimina per sempre
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
