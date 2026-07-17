import React, { useState } from "react";
import { ArrowLeft, Search, Star, Trash2, Calendar, Clock, Sparkles, BookOpen, RotateCcw, AlertTriangle, ChevronDown, ChevronUp, Layers } from "lucide-react";
import { Story, CATEGORIES, DeletedStory } from "../types";
import { playClickSound } from "../utils/audio";

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
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);
  const [storyToPermanentlyDelete, setStoryToPermanentlyDelete] = useState<Story | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>({});

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
        <span className="flex items-center gap-1 shrink-0 ml-auto bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-400 dark:border-slate-600 rounded-full px-2 py-0.5 text-[8.5px] shadow-3xs font-black">
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
    <div className="flex-1 flex flex-col p-5">
      {/* Back Header */}
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <button
          onClick={() => { playClickSound(); onBack(); }}
          id="btn-back-archive"
          className="w-9 h-9 bg-white hover:bg-natural-pink-light text-natural-burgundy rounded-xl flex items-center justify-center border-2 border-natural-pink-border shadow-xs transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h3 className="text-lg font-bold text-natural-burgundy font-serif italic">Libreria Magica</h3>
      </div>

      {/* Search and Favorites Bar */}
      <div className="space-y-2.5 mb-4 shrink-0">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-natural-pink" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="input-archive-search"
            placeholder="Cerca titolo, personaggio, morale..."
            className="w-full bg-white border-2 border-natural-pink-light rounded-2xl pl-10 pr-4 py-2.5 text-xs text-natural-text focus:outline-none focus:ring-4 focus:ring-natural-pink-light/30 font-bold"
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-natural-text/60 uppercase">Filtra per Categoria</p>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            id="btn-archive-toggle-favorites"
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border-2 font-bold text-[10px] transition-all cursor-pointer ${
              showFavoritesOnly
                ? "bg-gradient-to-r from-natural-yellow to-[#FFB300] text-white border-natural-yellow shadow-xs"
                : "bg-white text-natural-text border-natural-pink-border hover:bg-[#FCE4EC]/50"
            }`}
          >
            <Star size={12} fill={showFavoritesOnly ? "currentColor" : "none"} className={showFavoritesOnly ? "text-white" : "text-natural-yellow"} />
            Preferite
          </button>
        </div>
      </div>

      {/* Horizontal Category Pill List */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 shrink-0 scrollbar-none">
        <button
          onClick={() => setSelectedCat("Tutte")}
          className={`px-3 py-1.5 rounded-full font-bold text-[10px] border-2 transition-all shrink-0 cursor-pointer ${
            selectedCat === "Tutte"
              ? "bg-gradient-to-r from-natural-pink to-[#EC407A] text-white border-[#EC407A] shadow-xs"
              : "bg-white text-natural-text border-natural-pink-border hover:bg-[#FCE4EC]/30"
          }`}
        >
          ✨ Tutte
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-3 py-1.5 rounded-full font-bold text-[10px] border-2 transition-all shrink-0 cursor-pointer ${
              selectedCat === cat
                ? "bg-gradient-to-r from-natural-pink to-[#EC407A] text-white border-[#EC407A] shadow-xs"
                : "bg-white text-natural-text border-natural-pink-border/60 hover:bg-[#FCE4EC]/30"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stories list */}
      <div className="flex-1 overflow-y-auto space-y-3.5 px-1.5 pb-4 scrollbar-none">
        {filteredStories.length === 0 ? (
          <div className="bg-white/40 rounded-[2rem] p-8 text-center border-4 border-dashed border-natural-pink-border my-4 space-y-2">
            <span className="text-4xl">🏰</span>
            <p className="text-xs font-extrabold text-natural-burgundy">Nessuna favola trovata!</p>
            <p className="text-[10px] text-natural-text/60 font-bold leading-relaxed px-4">
              Prova a cambiare filtri o a creare la tua prima favola personalizzata nella Home!
            </p>
          </div>
        ) : (
          sortedSeriesIds.map((sId) => {
            const group = seriesGroups[sId];
            const hasChapters = group.length > 1;
            const totalChapters = group.length;
            const isExpanded = !!expandedSeries[sId];
            const firstStory = group[0]; // Usually chapter 1 or the newest
            const cardColorClass = colorBgMap[firstStory.coverColor] || colorBgMap["pastel-blue"];

            if (hasChapters && !isExpanded) {
              return (
                <div
                  key={`series-collapsed-${sId}`}
                  onClick={() => { playClickSound(); toggleSeries(sId); }}
                  className={`group cursor-pointer rounded-2xl border-4 p-3.5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3 relative ${cardColorClass} mb-3`}
                >
                  <div className="absolute -right-1.5 -bottom-1.5 bg-amber-100 text-amber-800 border-2 border-amber-300 rounded-lg px-2 py-1 flex items-center gap-1 shadow-sm z-10">
                    <Layers size={10} />
                    <span className="text-[10px] font-black uppercase">{totalChapters} Capitoli</span>
                  </div>

                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="relative w-12 h-12 bg-white/80 rounded-xl flex items-center justify-center text-2xl shadow-sm border-2 border-black/5">
                      {getCoverEmoji(firstStory.coverTheme)}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h4 className="font-extrabold text-[13px] leading-tight font-serif text-slate-800 break-words whitespace-normal">
                        {firstStory.titolo.replace(/ - Capitolo \d+$/, "")}
                      </h4>
                      <p className="text-[9px] font-bold text-slate-500/80 uppercase">
                        Clicca per espandere la serie
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-slate-400 p-1">
                    <ChevronDown size={18} />
                  </div>
                </div>
              );
            }

            return (
              <div key={`series-${sId}`} className={`relative mb-3 ${hasChapters ? "bg-white/40 p-3 rounded-2xl border-2 border-dashed border-slate-300/50 space-y-3" : ""}`}>
                {hasChapters && (
                  <button 
                    onClick={() => toggleSeries(sId)}
                    className="w-full flex items-center justify-between px-1 pb-1 text-[10px] font-black text-slate-500 uppercase cursor-pointer hover:text-slate-700"
                  >
                    <span className="flex items-center gap-1.5"><Layers size={12}/> {firstStory.titolo.replace(/ - Capitolo \d+$/, "")} ({totalChapters} Capitoli)</span>
                    <ChevronUp size={14} />
                  </button>
                )}
                
                {hasChapters && <div className="absolute left-6 top-10 bottom-6 w-0.5 bg-amber-300 rounded-full z-0" />}

                {group.map((story) => {
                  const cardColorClass = colorBgMap[story.coverColor] || colorBgMap["pastel-blue"];
                  const readingCount = story.volteLetta !== undefined ? story.volteLetta : (story.ultimaLettura ? 1 : 0);
                  const isBedtime = story.categoria?.toLowerCase().includes("buonanotte") || 
                                    story.categoria?.toLowerCase().includes("nanna") || 
                                    !!story.isBedtimeMode;
                  
                  const chapterNum = story.chapter || 1;

                  return (
                    <div
                      key={story.id}
                      id={`story-card-${story.id}`}
                      onClick={() => { playClickSound(); onSelectStory(story); }}
                      className={`group cursor-pointer rounded-2xl border-4 p-3.5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3 relative z-10 ${hasChapters ? "ml-5" : ""} ${cardColorClass} ${isBedtime ? "ring-2 ring-indigo-400 border-indigo-300 shadow-[0_0_15px_rgba(26,35,126,0.15)]" : ""}`}
                    >
                      {/* Connection Dot for Chapters */}
                      {hasChapters && (
                        <div className="absolute -left-[20px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-amber-400 rounded-full z-10" />
                      )}

                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <div className="relative shrink-0 select-none pl-1">
                          <div className="relative w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm border-2 border-black/5 group-hover:scale-105 transition-transform">
                            {getCoverEmoji(story.coverTheme)}
                            {/* High contrast visual indicator depending on read count */}
                            {getThumbnailBadge(readingCount)}
                            {isBedtime && (
                              <div className="absolute -bottom-1.5 -left-1.5 bg-[#1A237E] text-white border border-indigo-300 rounded-full w-4.5 h-4.5 flex items-center justify-center text-[9px] shadow-xs select-none z-10">
                                🌙
                              </div>
                            )}
                          </div>
                        </div> 

                         <div className="min-w-0 flex-1 space-y-0.5">
                          <h4 className="font-extrabold text-[13px] leading-tight font-serif flex flex-wrap items-center gap-1.5 break-words whitespace-normal pr-1">
                            {story.titolo}
                            {hasChapters && (
                              <span className="bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider whitespace-nowrap shrink-0 mt-0.5">
                                Cap. {chapterNum} di {totalChapters}
                              </span>
                            )}
                          </h4>
                          
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] font-bold">
                            <span className="bg-white/60 px-1.5 py-0.2 rounded-md uppercase border border-black/5">
                              {story.categoria}
                            </span>
                            {isBedtime && (
                              <span className="bg-[#1A237E] text-white px-1.5 py-0.2 rounded-md uppercase border border-[#3F51B5] text-[7.5px] font-black flex items-center gap-0.5 shadow-xs shrink-0 select-none">
                                🌙 Buonanotte
                              </span>
                            )}
                            {story.isOffline && (
                              <span className="bg-amber-100/90 text-amber-800 px-1.5 py-0.2 rounded-md uppercase border border-amber-200 text-[8px] font-extrabold">
                                Offline ⚡
                              </span>
                            )}
                            <span className="flex items-center gap-0.5 opacity-80">
                              <Clock size={9} /> {story.durata}
                            </span>
                          </div>

                          {story.personaggi && story.personaggi.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {story.personaggi.map((p, idx) => (
                                <span key={idx} className="bg-white/80 text-natural-burgundy px-1.5 py-0.5 rounded text-[8px] font-bold border border-black/5 shadow-xs">
                                  {p.nome}
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="text-[9px] font-bold italic opacity-85 truncate pt-0.5">
                            Morale: {story.morale}
                          </p>

                          {/* Creation and Last Read Dates */}
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[8.5px] font-bold text-slate-500/80 pt-1 border-t border-black/5 mt-1">
                            <span className="flex items-center gap-0.5 shrink-0">
                              <Calendar size={9} className="opacity-60" /> Creata: <span className="font-extrabold text-slate-700/90">{formatDate(story.dataCreazione || story.data)}</span>
                            </span>
                            <span className="flex items-center gap-0.5 shrink-0">
                              <Sparkles size={9} className="text-pink-500/70" /> Letta: <span className="font-extrabold text-slate-700/90">{story.ultimaLettura ? formatDate(story.ultimaLettura) : "Mai letta"}</span>
                            </span>
                            {renderReadingStatusBadge(readingCount)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {story.preferita && (
                          <span className="text-natural-yellow">
                            <Star size={14} fill="currentColor" />
                          </span>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStoryToDelete(story);
                          }}
                          id={`btn-delete-story-${story.id}`}
                          className="p-1.5 text-natural-text/40 hover:text-[#EC407A] hover:bg-white/80 rounded-lg transition-all"
                          title="Sposta nel cestino"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}

        {/* --- RECYCLE BIN SECTION --- */}
        {deletedStories.length > 0 && (
          <div className="mt-8 pt-4 border-t border-dashed border-natural-pink-border/85">
            <h4 className="text-xs font-black text-natural-burgundy/80 flex items-center gap-1.5 font-serif italic mb-3">
              <span>🗑️</span> Cestino dei Ricordi
            </h4>
            <p className="text-[9px] text-natural-text/60 leading-tight mb-3 font-semibold">
              Le favole eliminate rimangono salvate qui per 30 giorni. Puoi ripristinarle o eliminarle definitivamente.
            </p>
            <div className="space-y-2">
              {deletedStories.map(({ story, deletedAt }) => {
                const daysRemaining = getDaysRemaining(deletedAt);
                return (
                  <div
                    key={story.id}
                    className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <h5 className="font-extrabold text-[10px] text-slate-700 truncate font-serif">
                        {story.titolo}
                      </h5>
                      <p className="text-[8.5px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                        <AlertTriangle size={9} className="text-amber-500" />
                        {daysRemaining} {daysRemaining === 1 ? 'giorno rimanente' : 'giorni rimanenti'}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playClickSound();
                          if (onRestoreStory) onRestoreStory(story.id);
                        }}
                        className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 border border-green-300 rounded-lg transition-all cursor-pointer"
                        title="Ripristina favola"
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
                        className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-lg transition-all cursor-pointer"
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

      <div className="text-center text-[10px] font-bold text-natural-text/60 shrink-0 pt-2 border-t-2 border-natural-pink-light">
        Totale storie conservate: <span className="text-natural-burgundy font-black">{stories.length}</span>
      </div>

      {/* Custom Confirmation Dialog */}
      {storyToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-5 z-50 animate-fade-in">
          <div className="bg-white rounded-[2rem] border-4 border-natural-pink-border p-6 max-w-sm w-full text-center space-y-4 shadow-xl transform scale-100 transition-all animate-scale-up">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-2xl mx-auto border-2 border-red-100">
              🗑️
            </div>
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-sm text-natural-burgundy font-serif italic">
                Spostare nel cestino?
              </h4>
              <p className="text-[11px] text-natural-text font-bold leading-relaxed">
                Vuoi spostare <span className="text-natural-burgundy font-black">"{storyToDelete.titolo}"</span> nel cestino? Potrai ripristinarla entro 30 giorni.
              </p>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setStoryToDelete(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-600 rounded-full text-[11px] font-extrabold transition-all cursor-pointer"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-5 z-50 animate-fade-in">
          <div className="bg-white rounded-[2rem] border-4 border-natural-pink-border p-6 max-w-sm w-full text-center space-y-4 shadow-xl transform scale-100 transition-all animate-scale-up">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-2xl mx-auto border-2 border-red-100">
              ⚠️
            </div>
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-sm text-natural-burgundy font-serif italic">
                Eliminare definitivamente?
              </h4>
              <p className="text-[11px] text-natural-text font-bold leading-relaxed">
                Questa azione è permanente. La favola <span className="text-natural-burgundy font-black">"{storyToPermanentlyDelete.titolo}"</span> non potrà più essere recuperata.
              </p>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setStoryToPermanentlyDelete(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-600 rounded-full text-[11px] font-extrabold transition-all cursor-pointer"
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
    </div>
  );
}
