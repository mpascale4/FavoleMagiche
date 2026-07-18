import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Share2, Star, ChevronLeft, ChevronRight, Play, Pause, Square, Sparkles, Copy, Check, Mic, Trash2, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Story, AppSettings, ChildProfile } from "../types";
import { audioEngine } from "../lib/audioEngine";
import { saveAudioRecording, deleteAudioRecording, getStoryRecordingsMap } from "../lib/audioStorage";
import { playClickSound } from "../utils/audio";
import { getEducationalThemeDisplayName } from "../utils/themeNames";

interface StoryReaderViewProps {
  story: Story;
  isPremium: boolean;
  settings?: AppSettings;
  onUpdateSettings?: (settings: Partial<AppSettings>) => void;
  onToggleFavorite: (id: string) => void;
  activeProfile?: ChildProfile | null;
  onBack: () => void;
  onContinueStory: (story: Story) => void;
  onStoryReadCompleted?: (storyId: string) => void;
}

const getSfxForEmoji = (emoji: string): "magic" | "dragon" | "chime" | "nature" | "jump" | "mystery" | "success" | null => {
  if (/🧚|✨|🪄|🧙|🌟|🌈/u.test(emoji)) return "magic";
  if (/🐉|🐲|🦁|🦖|👹/u.test(emoji)) return "dragon";
  if (/🔔|⭐|💫|⏰|💎/u.test(emoji)) return "chime";
  if (/🌲|🍃|🍁|🍂|💨|🌊|💧|🪵|🌺/u.test(emoji)) return "nature";
  if (/🐇|🐰|🐸|🤸|🏃|🦘/u.test(emoji)) return "jump";
  if (/🌌|👻|🕯️|🗝|👁️|🕸️|🦇/u.test(emoji)) return "mystery";
  if (/🎉|🎈|🥳|🎁|🏆|❤️|💖|🏰|🤝|👋|👦|😴/u.test(emoji)) return "success";
  return "magic"; // default to sparkle magic
};

const stripEmojis = (str: string): string => {
  if (!str) return "";
  return str
    .replace(/\p{Emoji_Presentation}/gu, "")
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, "")
    .replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const pageVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    rotateY: direction > 0 ? -40 : 40,
    opacity: 0,
    scale: 0.95,
    position: "absolute" as const,
  }),
  animate: {
    x: 0,
    rotateY: 0,
    opacity: 1,
    scale: 1,
    position: "absolute" as const,
    transition: {
      type: "spring",
      stiffness: 280,
      damping: 26,
      mass: 0.8,
    }
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    rotateY: direction > 0 ? 40 : -40,
    opacity: 0,
    scale: 0.95,
    position: "absolute" as const,
    transition: {
      duration: 0.35,
      ease: "easeInOut"
    }
  })
};

export default function StoryReaderView({
  story,
  isPremium,
  settings,
  onUpdateSettings,
  onToggleFavorite,
  activeProfile,
  onBack,
  onContinueStory,
  onStoryReadCompleted
}: StoryReaderViewProps) {
  const rawPagine = story.pagine || [];
  const pagine = rawPagine.filter((p: string) => p && p.trim().length > 20 && !p.includes("coverTheme") && !p.includes("coverColor"));
  const totalPages = pagine.length;
  const [currentPage, setCurrentPage] = useState<number>(0); // 0 is cover, 1..N are pages, N+1 is moral
  const [visitedPages, setVisitedPages] = useState<Set<number>>(new Set([0]));
  const [hasIncrementedReadCount, setHasIncrementedReadCount] = useState<boolean>(false);

  // Track visited pages to confirm they read everything before moral page
  useEffect(() => {
    setVisitedPages(prev => {
      if (prev.has(currentPage)) return prev;
      const next = new Set(prev);
      next.add(currentPage);
      return next;
    });
  }, [currentPage]);

  // Trigger read completion only when reaching the moral page and all content pages are visited
  useEffect(() => {
    if (currentPage === totalPages + 1 && !hasIncrementedReadCount) {
      let visitedAll = true;
      for (let i = 1; i <= totalPages; i++) {
        if (!visitedPages.has(i)) {
          visitedAll = false;
          break;
        }
      }
      if (visitedAll) {
        setHasIncrementedReadCount(true);
        if (onStoryReadCompleted) {
          onStoryReadCompleted(story.id);
        }
      }
    }
  }, [currentPage, visitedPages, hasIncrementedReadCount, totalPages, story.id, onStoryReadCompleted]);
  const [pageDirection, setPageDirection] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [voiceType, setVoiceType] = useState<"narratore" | "femminile" | "maschile" | "robotica">("narratore");
  const [musicOn, setMusicOn] = useState<boolean>(settings?.musicaSottofondo !== false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");

  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordings, setRecordings] = useState<Record<string, string>>({});
  const [playingRecording, setPlayingRecording] = useState<{ readerType: string } | null>(null);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg" | "xl" | "2xl">("base");
  const [activeConsoleTab, setActiveConsoleTab] = useState<"audio" | "registra">("audio");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Load previous voice recordings on mount / story change
  useEffect(() => {
    const loadRecordings = async () => {
      try {
        const map = await getStoryRecordingsMap(story.id, totalPages);
        setRecordings(map);
      } catch (err) {
        console.error("Error loading story recordings:", err);
      }
    };
    loadRecordings();
    
    // Cleanup custom audio if active
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [story.id, totalPages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      let options = { mimeType: "audio/webm" };
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        options = { mimeType: "audio/mp4" };
      }
      
      let recorder: MediaRecorder;
      if (!MediaRecorder.isTypeSupported("audio/mp4") && !MediaRecorder.isTypeSupported("audio/webm")) {
        recorder = new MediaRecorder(stream);
      } else {
        recorder = new MediaRecorder(stream, options);
      }
      
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const objectUrl = URL.createObjectURL(audioBlob);
        
        setRecordings(prev => {
          return {
            ...prev,
            ["user"]: objectUrl
          };
        });

        await saveAudioRecording(story.id, -1, "user", audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      handleSpeechStop();
      stopCustomAudio();

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Non è stato possibile accedere al microfono. Verifica i permessi nelle impostazioni del tuo browser!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const playRecording = (reader: string) => {
    const url = recordings[reader];
    if (!url) return;

    handleSpeechStop();
    stopCustomAudio();

    const audio = new Audio(url);
    audioPlayerRef.current = audio;
    setPlayingRecording({ readerType: reader });

    audio.onended = () => {
      setPlayingRecording(null);
    };

    audio.onerror = () => {
      setPlayingRecording(null);
    };
    
    audio.play().catch(err => {
      console.error("Audio playback failed", err);
      setPlayingRecording(null);
    });
  };

  const stopCustomAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
      setPlayingRecording(null);
    }
  };

  const handleDeleteRecording = async (reader: string) => {
    if (playingRecording?.readerType === reader) {
      stopCustomAudio();
    }

    setRecordings(prev => {
      const next = { ...prev };
      delete next[reader];
      return next;
    });

    await deleteAudioRecording(story.id, -1, reader);
  };

  // Get active visual theme
  const getThemeByTime = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 10) return "alba";
    if (hour >= 10 && hour < 18) return "giorno";
    if (hour >= 18 && hour < 21) return "tramonto";
    return "notte";
  };

  // Get visual theme based on the story's category
  const getThemeByCategory = (category: string) => {
    const cat = category?.toLowerCase() || "";
    if (cat.includes("buona") || cat.includes("nanna")) return "notte";
    if (cat.includes("horror") || cat.includes("brivid") || cat.includes("spavent")) return "horror";
    if (cat.includes("comico") || cat.includes("divert")) return "alba";
    if (cat.includes("natur") || cat.includes("dinosaur")) return "bosco";
    if (cat.includes("mar") || cat.includes("ocean") || cat.includes("sirena")) return "oceano";
    if (cat.includes("spazi") || cat.includes("fantascienza") || cat.includes("mister")) return "notte";
    if (cat.includes("classica") || cat.includes("fantasy")) return "alba";
    if (cat.includes("avventur")) return "tramonto";
    return "giorno";
  };

  const getActiveTheme = () => {
    // If the story is a bedtime story, it ALWAYS has the 'notte' theme (buonanotte theme) when reading
    const isBedtime = story.categoria?.toLowerCase().includes("buona") || 
                      story.categoria?.toLowerCase().includes("nanna") || 
                      !!story.isBedtimeMode;
    if (isBedtime) {
      return "notte";
    }

    const pref = settings?.stileVisuale || "auto";
    if (pref === "auto") {
      return getThemeByCategory(story.categoria);
    }
    return pref;
  };

  const activeTheme = getActiveTheme();

  // Theme styling definitions
  const themeClasses = {
    alba: {
      outerBg: "bg-gradient-to-b from-[#FEF9F0] via-[#FFE0B2]/20 to-[#FCE4EC]",
      pageBg: "bg-gradient-to-br from-[#FFE0B2]/95 via-[#FFF9C4]/95 to-[#FCE4EC]/95 border-[#FFCC80] text-[#5D4037] shadow-sm",
      text: "text-[#5D4037]",
      subText: "text-[#8D6E63] font-bold",
      panelBg: "bg-white/90 border-[#FFCC80]",
      panelTitle: "text-[#5D4037] font-extrabold",
      buttonBack: "bg-white border-[#FFCC80] hover:bg-[#FFE0B2]/20 text-[#5D4037]",
      buttonNext: "bg-white border-[#FFCC80] hover:bg-[#FFE0B2]/20 text-[#5D4037]"
    },
    giorno: {
      outerBg: "bg-[#FEF9F0]",
      pageBg: "bg-white/95 border-natural-pink-border text-natural-text shadow-xs",
      text: "text-natural-text",
      subText: "text-[#8D6E63] font-bold",
      panelBg: "bg-white/95 border-natural-pink-border",
      panelTitle: "text-natural-burgundy font-extrabold",
      buttonBack: "bg-white border-natural-pink-border hover:bg-natural-pink-light text-natural-burgundy",
      buttonNext: "bg-white border-natural-pink-border hover:bg-natural-pink-light text-natural-burgundy"
    },
    tramonto: {
      outerBg: "bg-gradient-to-b from-[#FFF3E0] via-[#F3E5F5] to-[#E1BEE7]",
      pageBg: "bg-gradient-to-br from-[#F3E5F5]/95 via-[#FFF3E0]/95 to-[#E1BEE7]/95 border-[#D1C4E9] text-[#4A148C] shadow-sm",
      text: "text-[#4A148C]",
      subText: "text-[#6A1B9A] font-bold",
      panelBg: "bg-white/90 border-[#D1C4E9]",
      panelTitle: "text-[#4A148C] font-extrabold",
      buttonBack: "bg-white border-[#D1C4E9] hover:bg-[#E1BEE7]/30 text-[#4A148C]",
      buttonNext: "bg-white border-[#D1C4E9] hover:bg-[#E1BEE7]/30 text-[#4A148C]"
    },
    notte: {
      outerBg: "bg-gradient-to-b from-[#0F1123] via-[#0E1020] to-[#080914] text-slate-100",
      pageBg: "bg-gradient-to-b from-[#1C203F]/90 to-[#12142E]/95 border-[#2A2E50] text-slate-100 shadow-xl",
      text: "text-slate-100",
      subText: "text-slate-300 font-bold",
      panelBg: "bg-[#14162B]/85 border-[#2A2E50] backdrop-blur-xs",
      panelTitle: "text-[#E8EAF6] font-extrabold",
      buttonBack: "bg-[#181B34] border-[#2A2E50] hover:bg-[#202444] text-slate-200",
      buttonNext: "bg-[#181B34] border-[#2A2E50] hover:bg-[#202444] text-slate-200"
    },
    bosco: {
      outerBg: "bg-gradient-to-b from-[#E8F5E9] via-[#C8E6C9]/25 to-[#F1F8E9]",
      pageBg: "bg-gradient-to-br from-[#E8F5E9]/95 via-[#F1F8E9]/95 to-[#DCEDC8]/95 border-[#A5D6A7] text-[#1B5E20] shadow-sm",
      text: "text-[#1B5E20]",
      subText: "text-[#2E7D32] font-bold",
      panelBg: "bg-white/90 border-[#A5D6A7]",
      panelTitle: "text-[#1B5E20] font-extrabold",
      buttonBack: "bg-white border-[#A5D6A7] hover:bg-[#E8F5E9]/40 text-[#1B5E20]",
      buttonNext: "bg-white border-[#A5D6A7] hover:bg-[#E8F5E9]/40 text-[#1B5E20]"
    },
    oceano: {
      outerBg: "bg-gradient-to-b from-[#E0F7FA] via-[#B2EBF2]/20 to-[#E0F2F1]",
      pageBg: "bg-gradient-to-br from-[#E0F7FA]/95 via-[#E0F2F1]/95 to-[#B2DFDB]/95 border-[#80DEEA] text-[#006064] shadow-sm",
      text: "text-[#006064]",
      subText: "text-[#00838F] font-bold",
      panelBg: "bg-white/90 border-[#80DEEA]",
      panelTitle: "text-[#006064] font-extrabold",
      buttonBack: "bg-white border-[#80DEEA] hover:bg-[#E0F7FA]/40 text-[#006064]",
      buttonNext: "bg-white border-[#80DEEA] hover:bg-[#E0F7FA]/40 text-[#006064]"
    },
    horror: {
      outerBg: "bg-gradient-to-b from-[#18092B] via-[#0E051B] to-[#120722] text-orange-200",
      pageBg: "bg-gradient-to-br from-[#291343]/95 via-[#1D0932]/95 to-[#120722]/95 border-amber-500 text-orange-100 shadow-xl",
      text: "text-orange-100",
      subText: "text-amber-400 font-bold",
      panelBg: "bg-[#1B0A2F]/90 border-amber-600/50 backdrop-blur-xs",
      panelTitle: "text-amber-400 font-extrabold",
      buttonBack: "bg-[#25103E] border-amber-600 hover:bg-[#341757] text-amber-300",
      buttonNext: "bg-[#25103E] border-amber-600 hover:bg-[#341757] text-amber-300"
    }
  };

  const currentThemeClasses = (themeClasses as any)[activeTheme] || themeClasses.giorno;

  // Sync with global settings
  useEffect(() => {
    if (settings) {
      if (settings.tipoVoce) {
        setVoiceType(settings.tipoVoce as any);
      }
      if (settings.nomeVoceDispositivo) {
        setSelectedVoiceName(settings.nomeVoceDispositivo);
      }
      if (settings.musicaSottofondo !== undefined) {
        setMusicOn(settings.musicaSottofondo);
      }
    }
  }, [settings]);

  // Sync available system speech voices
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Filter Italian voices, fallback to all if none
        const itVoices = voices.filter(v => v.lang.startsWith("it") || v.lang.includes("it-IT"));
        const listToUse = itVoices.length > 0 ? itVoices : voices;
        setAvailableVoices(listToUse);

        if (itVoices.length > 0) {
          setSelectedVoiceName(prev => prev || itVoices[0].name);
        } else if (voices.length > 0) {
          setSelectedVoiceName(prev => prev || voices[0].name);
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, []);

  // Pause audio when app goes to background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        audioEngine.stopBackgroundMusic();
        if (synthRef.current) {
          synthRef.current.pause();
          setIsPlaying(false);
          setIsPaused(true);
        }
        if (audioPlayerRef.current) {
          audioPlayerRef.current.pause();
          setPlayingRecording(null);
        }
      } else {
        if (musicOn) {
          audioEngine.startBackgroundMusic();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [musicOn]);

  // Sync background music state
  useEffect(() => {
    audioEngine.refreshThemeAudioMode();
    if (musicOn) {
      audioEngine.startBackgroundMusic();
    } else {
      audioEngine.stopBackgroundMusic();
    }
    return () => {
      audioEngine.stopBackgroundMusic();
    };
  }, [musicOn]);

  // Stop background music on unmount
  useEffect(() => {
    return () => {
      audioEngine.stopBackgroundMusic();
    };
  }, []);

  // Duck background music when narration or voice playback is active
  useEffect(() => {
    const isVoicePlaying = isPlaying || !!playingRecording;
    if (isVoicePlaying) {
      audioEngine.duckMusic();
    } else {
      audioEngine.unduckMusic();
    }
  }, [isPlaying, playingRecording]);

  // Smoothly scroll the phone frame to center in viewport when reader is opened
  useEffect(() => {
    const timer = setTimeout(() => {
      const phone = document.getElementById("phone-frame");
      if (phone) {
        phone.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        window.scrollTo({ top: 100, behavior: "smooth" });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Trigger sound effects automatically on page transition
  useEffect(() => {
    triggerSfxForPage(currentPage);
  }, [currentPage]);

  // Automatically parse words and trigger appropriate SFX based on text
  const triggerSfxForPage = (pageIdx: number) => {
    if (pageIdx === 0) {
      // Cover page
      audioEngine.playSfx("magic");
    } else if (pageIdx === totalPages + 1) {
      // Morale page
      audioEngine.playSfx("success");
    } else {
      const text = pagine[pageIdx - 1]?.toLowerCase() || "";
      if (text.includes("drago") || text.includes("ruggito") || text.includes("rugge") || text.includes("orco") || text.includes("mostro")) {
        audioEngine.playSfx("dragon");
      } else if (text.includes("magia") || text.includes("magica") || text.includes("incantesimo") || text.includes("fata") || text.includes("fatina") || text.includes("bacchetta") || text.includes("scintilla")) {
        audioEngine.playSfx("magic");
      } else if (text.includes("vento") || text.includes("bosco") || text.includes("foresta") || text.includes("albero") || text.includes("fiume") || text.includes("acqua") || text.includes("mare") || text.includes("natura")) {
        audioEngine.playSfx("nature");
      } else if (text.includes("stella") || text.includes("stelle") || text.includes("splende") || text.includes("brilla") || text.includes("lucciola") || text.includes("lucciole") || text.includes("cielo")) {
        audioEngine.playSfx("chime");
      } else if (text.includes("salto") || text.includes("saltò") || text.includes("vola") || text.includes("volò") || text.includes("hop") || text.includes("balzo") || text.includes("saltando")) {
        audioEngine.playSfx("jump");
      } else if (text.includes("segreto") || text.includes("mistero") || text.includes("scuro") || text.includes("buio") || text.includes("paura") || text.includes("ombra")) {
        audioEngine.playSfx("mystery");
      } else if (text.includes("felice") || text.includes("felicità") || text.includes("sorrise") || text.includes("gioia") || text.includes("festa") || text.includes("grazie") || text.includes("evviva")) {
        audioEngine.playSfx("success");
      }
    }
  };

  const triggerSfxFromWord = (word: string) => {
    const w = word.toLowerCase();
    if (w.includes("ruggito") || w.includes("drago")) {
      audioEngine.playSfx("dragon");
    } else if (w.includes("magia") || w.includes("magica") || w.includes("incantesimo") || w.includes("fata") || w.includes("fatina") || w.includes("scintilla")) {
      audioEngine.playSfx("magic");
    } else if (w.includes("vento") || w.includes("bosco") || w.includes("foresta") || w.includes("natura") || w.includes("albero") || w.includes("fiume") || w.includes("acqua")) {
      audioEngine.playSfx("nature");
    } else if (w.includes("stella") || w.includes("stelle") || w.includes("brilla") || w.includes("lucciola") || w.includes("cielo") || w.includes("splendore")) {
      audioEngine.playSfx("chime");
    } else if (w.includes("salto") || w.includes("vola") || w.includes("gigante") || w.includes("hop")) {
      audioEngine.playSfx("jump");
    } else if (w.includes("paura") || w.includes("mistero") || w.includes("buio") || w.includes("segreto") || w.includes("scuro")) {
      audioEngine.playSfx("mystery");
    } else if (w.includes("felicità") || w.includes("coraggio") || w.includes("amicizia") || w.includes("collaborazione") || w.includes("felice") || w.includes("grazie")) {
      audioEngine.playSfx("success");
    } else {
      audioEngine.playSfx("magic");
    }
  };

  // Helper to assign a consistent color to each word based on its hash
  const getWordColorClass = (word: string) => {
    const colors = [
      "from-[#FF8A65] to-[#F4511E] border-[#FFCCBC]", // Orange
      "from-[#4DB6AC] to-[#00897B] border-[#B2DFDB]", // Teal
      "from-[#7986CB] to-[#3949AB] border-[#C5CAE9]", // Indigo
      "from-[#BA68C8] to-[#8E24AA] border-[#E1BEE7]", // Purple
      "from-[#4FC3F7] to-[#039BE5] border-[#B3E5FC]", // Light Blue
      "from-[#AED581] to-[#7CB342] border-[#DCEDC8]", // Light Green
      "from-[#FFD54F] to-[#FFB300] border-[#FFECB3]", // Amber
      "from-[#4DD0E1] to-[#00ACC1] border-[#B2EBF2]"  // Cyan
    ];
    
    let hash = 0;
    const cleanStr = word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (cleanStr.length === 0) return "from-natural-pink to-[#EC407A] border-[#FCE4EC]";

    for (let i = 0; i < cleanStr.length; i++) {
      hash = cleanStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    
    return colors[index];
  };

  // Parser that converts **WORD** into highlighted words and emojis into interactive sound triggers
  const renderPageText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    const sfxStyles: Record<string, string> = {
      magic: "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-600 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300",
      dragon: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300",
      chime: "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-600 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300",
      nature: "bg-green-50 hover:bg-green-100 border-green-200 text-green-600 dark:bg-green-950/40 dark:border-green-800 dark:text-green-300",
      jump: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300",
      mystery: "bg-fuchsia-50 hover:bg-fuchsia-100 border-fuchsia-200 text-fuchsia-600 dark:bg-fuchsia-950/40 dark:border-fuchsia-800 dark:text-fuchsia-300",
      success: "bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-600 dark:bg-yellow-950/40 dark:border-yellow-800 dark:text-yellow-300"
    };

    let globalOffset = 0;

    return parts.map((part, partIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const cleanWord = part.slice(2, -2).trim();
        const colorClass = getWordColorClass(cleanWord);
        
        const startIndex = globalOffset;
        globalOffset += part.length;
        
        return (
          <span
            key={`word-${partIdx}`}
            onClick={() => triggerSfxFromWord(cleanWord)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (isPlaying || isPaused) {
                const textFromHere = text.slice(startIndex);
                handleSpeechPlayForPage(currentPage, undefined, textFromHere);
              }
            }}
            className={`text-[14.5px] sm:text-[16px] font-black text-white bg-gradient-to-r ${colorClass} border-2 px-2.5 py-0.5 mx-1 my-0.5 rounded-full inline-block transform active:scale-90 hover:scale-105 transition-all cursor-pointer shadow-xs font-serif italic`}
            title="Tocca per ascoltare un suono magico, doppio tocco per leggere da qui"
          >
            {cleanWord}
          </span>
        );
      }

      // Match emojis of any presentation style or basic characters
      const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
      const subParts = part.split(emojiRegex);

      return subParts.map((subPart, subIdx) => {
        // Since we split with capturing parenthesis, odd indices are ALWAYS matches
        const isEmoji = subIdx % 2 === 1;

        if (isEmoji && subPart) {
          const sfx = getSfxForEmoji(subPart) || "magic";
          const sfxClass = sfxStyles[sfx] || sfxStyles.magic;
          globalOffset += subPart.length;
          return (
            <span
              key={`emoji-${partIdx}-${subIdx}`}
              onClick={() => {
                audioEngine.playSfx(sfx);
              }}
              className={`inline-flex items-center justify-center gap-1 border-2 px-1.5 py-0.5 mx-0.5 rounded-full cursor-pointer transition-all duration-200 hover:scale-115 active:scale-90 transform shadow-2xs align-middle select-none ${sfxClass}`}
              title={`Tocca per sentire il suono: ${sfx}!`}
            >
              <span className="text-[15px] sm:text-[17px] align-middle transform hover:rotate-12 transition-transform duration-200 inline-block leading-none">
                {subPart}
              </span>
              <span className="text-[10px] opacity-75 leading-none">🔊</span>
            </span>
          );
        }

        const words = subPart.split(/(\s+)/);
        return words.map((word, wordIdx) => {
          const startIndex = globalOffset;
          globalOffset += word.length;
          
          if (word.trim().length === 0) {
            return <span key={`w-${partIdx}-${subIdx}-${wordIdx}`}>{word}</span>;
          }
          
          return (
            <span 
              key={`w-${partIdx}-${subIdx}-${wordIdx}`}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (isPlaying || isPaused) {
                  const textFromHere = text.slice(startIndex);
                  handleSpeechPlayForPage(currentPage, undefined, textFromHere);
                }
              }}
              className="cursor-text"
              title={isPlaying || isPaused ? "Doppio tocco per riprendere la lettura da qui" : undefined}
            >
              {word}
            </span>
          );
        });
      });
    });
  };

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentSpeechCharIndexRef = useRef<number>(0);
  const onStartTimestampRef = useRef<number | null>(null);
  const accumulatedSpeakingTimeRef = useRef<number>(0);
  const isSpeakingActiveRef = useRef<boolean>(false);
  const hasFiredBoundaryRef = useRef<boolean>(false);

  const getCurrentCharIndex = () => {
    if (hasFiredBoundaryRef.current) {
      return currentSpeechCharIndexRef.current;
    }
    if (!onStartTimestampRef.current) return 0;
    
    let totalSpeakingTimeMs = accumulatedSpeakingTimeRef.current;
    if (isSpeakingActiveRef.current) {
      totalSpeakingTimeMs += Date.now() - onStartTimestampRef.current;
    }
    
    const rate = utteranceRef.current?.rate || 0.8;
    // Estimated Words Per Minute at rate 1.0 is ~145. Average Italian word length is ~5.5 characters.
    const wpm = 145 * rate;
    const charsPerSec = (wpm * 5.5) / 60;
    const estimatedChars = Math.floor((totalSpeakingTimeMs / 1000) * charsPerSec);
    
    const totalLength = utteranceRef.current?.text?.length || 0;
    return Math.min(estimatedChars, totalLength);
  };

  // Initialize Speech Synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      // Stop speech on unmount
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const isCover = currentPage === 0;
  const isMoralPage = currentPage === totalPages + 1;

  // Determine actual text to read based on current view page
  const getTextToRead = () => {
    let rawText = "";
    if (isCover) {
      rawText = `${story.titolo}. Una favola magica nella categoria ${story.categoria}.`;
    } else if (isMoralPage) {
      rawText = `La morale finale di questa storia è: ${story.morale}`;
    } else {
      rawText = pagine[currentPage - 1];
    }
    // Strip double asterisks so TTS reads the story smoothly without spelling out asterisks
    return rawText ? rawText.replace(/\*\*/g, "") : "";
  };

  // Trigger direct page transition
  const triggerPageTransitionWithIntermezzo = (targetPage: number, forceAutoPlay: boolean = false) => {
    playClickSound();
    const wasSpeaking = isPlaying || forceAutoPlay;
    
    // Stop any speech read-out
    handleSpeechStop();
    completePageTransition(targetPage, wasSpeaking);
  };

  const completePageTransition = (targetPage: number, autoPlay: boolean) => {
    setPageDirection(targetPage > currentPage ? 1 : -1);
    setCurrentPage(targetPage);

    // Auto-start reading the new page if voice narration was active
    if (autoPlay) {
      setTimeout(() => {
        handleSpeechPlayForPage(targetPage);
      }, 300);
    }
  };

  // Web Speech synthesis read out for specific pages
  const handleSpeechPlayForPage = (targetPage: number, speedOverride?: number, textOverride?: string) => {
    if (!synthRef.current) {
      alert("La sintesi vocale non è supportata su questo browser.");
      return;
    }

    // Cancel current playing speech
    if (utteranceRef.current) {
      utteranceRef.current.onstart = null;
      utteranceRef.current.onpause = null;
      utteranceRef.current.onresume = null;
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current.onboundary = null;
    }
    synthRef.current.cancel();

    let rawText = "";
    if (textOverride) {
      rawText = textOverride;
    } else {
      if (targetPage === 0) {
        rawText = `${story.titolo}. Una favola magica nella categoria ${story.categoria}.`;
      } else if (targetPage === totalPages + 1) {
        rawText = `La morale finale di questa storia è: ${story.morale}`;
      } else {
        rawText = pagine[targetPage - 1];
      }
    }
    const rawCleanText = rawText ? rawText.replace(/\*\*/g, "") : "";
    const text = stripEmojis(rawCleanText).toLowerCase();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Set voice to selected system voice or fallback to Italian
    utterance.lang = "it-IT";
    
    const voices = synthRef.current.getVoices();
    const selectedVoice = voices.find(v => v.name === selectedVoiceName) || voices.find(v => v.lang.startsWith("it") || v.lang.includes("it-IT"));
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Apply voice characteristics using pitch and rate based on voice type and user presets
    let defaultPitch = 1.05;
    let defaultRate = 0.70;

    if (voiceType === "femminile") {
      defaultPitch = 1.15;
      defaultRate = 0.85;
    } else if (voiceType === "maschile") {
      defaultPitch = 0.85;
      defaultRate = 0.82;
    } else if (voiceType === "robotica") {
      defaultPitch = 0.55;
      defaultRate = 0.95;
    }

    // Apply bedtime calming speech speed reduction
    const isBedtimeStory = story.categoria?.toLowerCase().includes("buonanotte") || 
                          story.categoria?.toLowerCase().includes("nanna") || 
                          (story as any).isBedtimeMode;
    if (isBedtimeStory) {
      defaultRate = defaultRate * 0.82; // Slower, calmer and relaxing reading
    }

    utterance.pitch = settings?.tonoVoce !== undefined ? settings.tonoVoce : defaultPitch;
    const baseRate = settings?.velocitaVoce !== undefined ? settings.velocitaVoce : defaultRate;
    const activeSpeed = speedOverride !== undefined ? speedOverride : playbackSpeed;
    utterance.rate = baseRate * activeSpeed;

    // Reset progress tracking refs
    currentSpeechCharIndexRef.current = 0;
    onStartTimestampRef.current = null;
    accumulatedSpeakingTimeRef.current = 0;
    isSpeakingActiveRef.current = false;
    hasFiredBoundaryRef.current = false;

    utterance.onstart = () => {
      onStartTimestampRef.current = Date.now();
      isSpeakingActiveRef.current = true;
    };

    utterance.onboundary = (event) => {
      hasFiredBoundaryRef.current = true;
      currentSpeechCharIndexRef.current = event.charIndex;
    };

    utterance.onpause = () => {
      if (isSpeakingActiveRef.current && onStartTimestampRef.current) {
        accumulatedSpeakingTimeRef.current += Date.now() - onStartTimestampRef.current;
      }
      isSpeakingActiveRef.current = false;
    };

    utterance.onresume = () => {
      onStartTimestampRef.current = Date.now();
      isSpeakingActiveRef.current = true;
    };

    utterance.onend = () => {
      isSpeakingActiveRef.current = false;
      setIsPlaying(false);
      setIsPaused(false);
      
      // If we are on a standard page (cover, or pages 1..N) and musical pauses are turned on:
      if (settings?.pauseMusicaliChiave !== false && targetPage <= totalPages) {
        triggerPageTransitionWithIntermezzo(targetPage + 1, true);
      }
    };

    utterance.onerror = () => {
      isSpeakingActiveRef.current = false;
      setIsPlaying(false);
      setIsPaused(false);
    };

    setIsPlaying(true);
    setIsPaused(false);
    synthRef.current.speak(utterance);
  };

  // Web Speech synthesis read out
  const handleSpeechPlay = () => {
    playClickSound();
    if (!synthRef.current) {
      alert("La sintesi vocale non è supportata su questo browser.");
      return;
    }

    // If currently paused, resume
    if (isPaused) {
      synthRef.current.resume();
      setIsPlaying(true);
      setIsPaused(false);
      onStartTimestampRef.current = Date.now();
      isSpeakingActiveRef.current = true;
      return;
    }

    handleSpeechPlayForPage(currentPage);
  };

  const handleSpeechPause = () => {
    playClickSound();
    if (synthRef.current && isPlaying) {
      synthRef.current.pause();
      setIsPlaying(false);
      setIsPaused(true);
      if (isSpeakingActiveRef.current && onStartTimestampRef.current) {
        accumulatedSpeakingTimeRef.current += Date.now() - onStartTimestampRef.current;
      }
      isSpeakingActiveRef.current = false;
    }
  };

  const handleSpeechStop = () => {
    playClickSound();
    if (synthRef.current) {
      if (utteranceRef.current) {
        utteranceRef.current.onstart = null;
        utteranceRef.current.onpause = null;
        utteranceRef.current.onresume = null;
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current.onboundary = null;
      }
      synthRef.current.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      onStartTimestampRef.current = null;
      accumulatedSpeakingTimeRef.current = 0;
      isSpeakingActiveRef.current = false;
      hasFiredBoundaryRef.current = false;
    }
  };

  // Swipe gesture support
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      // Swiped left - Next page
      if (currentPage < totalPages + 1) {
        if (currentPage === 0) triggerPageTransitionWithIntermezzo(1);
        else triggerPageTransitionWithIntermezzo(currentPage + 1);
      }
    }
    if (isRightSwipe) {
      // Swiped right - Previous page
      if (currentPage > 0) {
        handlePageChange(currentPage - 1);
      }
    }
  };

  // Change page stops current speech and resets state
  const handlePageChange = (newPage: number) => {
    playClickSound();
    const wasSpeaking = isPlaying;

    handleSpeechStop();
    setPageDirection(newPage > currentPage ? 1 : -1);
    setCurrentPage(newPage);

    if (wasSpeaking) {
      setTimeout(() => {
        handleSpeechPlayForPage(newPage);
      }, 300);
    }
  };

  // Share story handler
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: story.titolo,
        text: `Leggi questa favola magica: "${story.titolo}"\n\n${pagine[0]}...\n\nMorale: ${story.morale}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      setShowShareModal(true);
    }
  };

  const handleCopyStory = () => {
    const fullText = `--- ${story.titolo} ---\n\n` + pagine.join("\n\n") + `\n\n--- Morale Finale ---\n${story.morale}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Pastel Color Maps for Background Cover Rendering
  const colorBgMap: Record<string, string> = {
    "pastel-pink": "bg-[#FCE4EC] text-[#880E4F] border-[#F8BBD0]",
    "pastel-blue": "bg-[#E1F5FE] text-[#0277BD] border-[#B3E5FC]",
    "pastel-purple": "bg-[#F3E5F5] text-[#4A148C] border-[#E1BEE7]",
    "pastel-green": "bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9]",
    "pastel-yellow": "bg-[#FFFDE7] text-[#F9A825] border-[#FFE082]"
  };

  const activeColorClass = colorBgMap[story.coverColor] || colorBgMap["pastel-blue"];

  // Helper icons representing book cover theme
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

  return (
    <div className={`absolute inset-0 flex flex-col p-5 overflow-hidden transition-all duration-700 ${currentThemeClasses.outerBg}`}>
      {/* Upper Navigation Bar */}
      <div className="flex items-center justify-between mb-3 shrink-0 z-10">
        <button
          onClick={() => {
            playClickSound();
            handleSpeechStop();
            onBack();
          }}
          id="btn-back-reader"
          className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 shadow-xs transition-colors cursor-pointer ${currentThemeClasses.buttonBack}`}
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-1.5">
          {/* Font Size Button */}
          <div className={`flex items-center rounded-xl border-2 p-0.5 shadow-xs gap-1 ${currentThemeClasses.buttonBack}`}>
            <button
              onClick={() => {
                const sizes: ("sm" | "base" | "lg" | "xl" | "2xl")[] = ["sm", "base", "lg", "xl", "2xl"];
                const currentIndex = sizes.indexOf(fontSize);
                if (currentIndex > 0) setFontSize(sizes[currentIndex - 1]);
              }}
              disabled={fontSize === "sm"}
              className="w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Riduci testo"
            >
              A-
            </button>
            <span className="text-[9px] font-black w-5 text-center select-none opacity-80 uppercase">
              {fontSize === "sm" ? "XS" : fontSize === "base" ? "S" : fontSize === "lg" ? "M" : fontSize === "xl" ? "L" : "XL"}
            </span>
            <button
              onClick={() => {
                const sizes: ("sm" | "base" | "lg" | "xl" | "2xl")[] = ["sm", "base", "lg", "xl", "2xl"];
                const currentIndex = sizes.indexOf(fontSize);
                if (currentIndex < sizes.length - 1) setFontSize(sizes[currentIndex + 1]);
              }}
              disabled={fontSize === "2xl"}
              className="w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Aumenta testo"
            >
              A+
            </button>
          </div>


          {/* Bedtime Sleep Timer Button */}
          <button
            onClick={() => {
              playClickSound();
              if (onUpdateSettings) {
                // Cycle through: 0 -> 5 -> 10 -> 15 -> 30 -> 45 -> 60 minutes
                const cur = settings?.timerNannaMinutes || 0;
                let next = 0;
                if (cur === 0) next = 5;
                else if (cur === 5) next = 10;
                else if (cur === 10) next = 15;
                else if (cur === 15) next = 30;
                else if (cur === 30) next = 45;
                else if (cur === 45) next = 60;
                else next = 0;
                onUpdateSettings({ timerNannaMinutes: next });
              }
            }}
            className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center border-2 transition-all active:scale-90 cursor-pointer ${
              (settings?.timerNannaMinutes || 0) > 0
                ? "bg-indigo-100 text-indigo-600 border-indigo-300 shadow-xs"
                : `${currentThemeClasses.buttonBack} opacity-50`
            }`}
            title="Timer della Nanna"
          >
            <span className="text-[10px] leading-none">🌙</span>
            <span className="text-[7px] font-black leading-none mt-0.5">
              {(settings?.timerNannaMinutes || 0) > 0 ? `${settings?.timerNannaMinutes}m` : "Off"}
            </span>
          </button>

          {/* Favorite Button */}
          <button
            onClick={() => onToggleFavorite(story.id)}
            id="btn-favorite-story"
            className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all active:scale-90 cursor-pointer ${
              story.preferita
                ? "bg-[#FFE082] text-amber-600 border-[#FFD54F] shadow-xs"
                : `${currentThemeClasses.buttonBack}`
            }`}
          >
            <Star size={18} fill={story.preferita ? "currentColor" : "none"} />
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            id="btn-share-story"
            className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 shadow-xs transition-all active:scale-90 cursor-pointer ${currentThemeClasses.buttonBack}`}
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Unified Narration Controls Panel - Ultra Compact Top Row */}
      <div className={`w-full rounded-2xl p-1.5 border-2 shadow-xs mb-2 transition-all duration-500 bg-white border-slate-200`}>
        <div className="flex flex-row items-center justify-between gap-1 overflow-visible">
          {/* Ascolta Button Group */}
          <div className="flex items-center gap-0.5 bg-slate-50 rounded-full p-0.5 border border-slate-200 shrink-0">
            <button
              onClick={() => {
                if (isPlaying) handleSpeechPause();
                else {
                  setVoiceType("narratore");
                  synthRef.current?.cancel();
                  setTimeout(() => {
                    handleSpeechPlayForPage(currentPage);
                  }, 50);
                }
              }}
              className={`flex items-center justify-center relative w-8 h-8 rounded-full transition-all cursor-pointer shadow-xs border ${
                isPlaying 
                  ? "bg-gradient-to-br from-amber-300 to-amber-500 border-amber-600 animate-pulse z-10" 
                  : "bg-amber-100 border-amber-400 z-10"
              }`}
              title="Ascolta Storia"
            >
              <span className="text-[16px] leading-none">🎤</span>
              <span className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-[1px] shadow-sm border border-slate-200 dark:border-slate-600">
                {isPlaying ? <Pause size={8} className="text-amber-600" fill="currentColor" /> : <Play size={8} className="text-amber-600" fill="currentColor" />}
              </span>
            </button>
            {(isPlaying || isPaused) && (
              <button
                onClick={handleSpeechStop}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 shadow-xs cursor-pointer hover:bg-red-100 active:scale-95 transition-all ml-1"
                title="Ferma"
              >
                <Square size={8} fill="currentColor" />
              </button>
            )}
          </div>

          <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700 mx-0.5 shrink-0"></div>

          <div className="flex items-center gap-1 bg-slate-50 rounded-full p-0.5 border border-slate-200 shrink-0">
            {[0.5, 1, 1.5].map((speed) => (
              <button
                key={speed}
                onClick={() => {
                  setPlaybackSpeed(speed);
                  if (isPlaying || isPaused) {
                    let remainingText = undefined;
                    if (utteranceRef.current) {
                      remainingText = utteranceRef.current.text.slice(getCurrentCharIndex());
                      utteranceRef.current.onstart = null;
                      utteranceRef.current.onpause = null;
                      utteranceRef.current.onresume = null;
                      utteranceRef.current.onend = null;
                      utteranceRef.current.onerror = null;
                      utteranceRef.current.onboundary = null;
                    }
                    synthRef.current?.cancel();
                    setTimeout(() => {
                      handleSpeechPlayForPage(currentPage, speed, remainingText);
                    }, 50);
                  }
                }}
                className={`flex items-center justify-center w-7 h-7 rounded-full font-bold text-[10px] transition-colors shrink-0 ${
                  playbackSpeed === speed 
                    ? "bg-amber-400 text-amber-900 shadow-sm" 
                    : "bg-transparent text-slate-500 hover:bg-slate-200"
                }`}
                title={`Velocità ${speed}x`}
              >
                {speed}x
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700 mx-0.5 shrink-0"></div>

          {/* Registra Button Group */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Registra controls */}
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full bg-red-600 text-white animate-pulse transition-all cursor-pointer shadow-xs uppercase"
              >
                <Square size={8} fill="currentColor" />
                <span>Stop ({recordingSeconds}s)</span>
              </button>
            ) : recordings["user"] ? (
              <div className="flex items-center gap-1">
                {playingRecording?.readerType === "user" ? (
                  <button
                    onClick={stopCustomAudio}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full bg-amber-400 text-slate-900 transition-all cursor-pointer shadow-xs uppercase"
                  >
                    <Square size={8} fill="currentColor" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    onClick={() => playRecording("user")}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-black rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-all cursor-pointer shadow-xs uppercase"
                  >
                    <Play size={8} fill="currentColor" />
                    <span>Play</span>
                  </button>
                )}
                <button
                  onClick={() => handleDeleteRecording("user")}
                  className="text-red-500 hover:text-red-700 transition-colors cursor-pointer p-1 bg-red-50 dark:bg-red-950/20 rounded-full"
                  title="Elimina"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ) : (
              <button
                onClick={startRecording}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-full bg-[#EC407A] text-white hover:bg-[#D81B60] transition-all cursor-pointer shadow-xs uppercase"
              >
                <Mic size={8} />
                <span>Rec</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Wave equalizer */}
        <div className="flex items-center gap-1 pr-1 shrink-0">
          {(isPlaying || playingRecording) && (
            <div className="flex items-end gap-0.5 h-3">
              <div className="w-0.5 bg-amber-500 dark:bg-amber-400 rounded-full animate-bounce duration-500 h-2"></div>
              <div className="w-0.5 bg-amber-500 dark:bg-amber-400 rounded-full animate-bounce duration-300 h-3"></div>
              <div className="w-0.5 bg-amber-500 dark:bg-amber-400 rounded-full animate-bounce duration-400 h-1.5"></div>
            </div>
          )}
        </div>
      </div>

      {/* Main Reading Canvas - Flexible container maximizing space */}
      <div 
        className="w-full relative flex-1 my-2" 
        style={{ perspective: "1200px", touchAction: "pan-y" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEndHandler}
      >
        <AnimatePresence custom={pageDirection}>
          {isCover && (
            <motion.div
              key="cover"
              custom={pageDirection}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`absolute inset-0 w-full h-full ${activeTheme !== "giorno" ? currentThemeClasses.pageBg : activeColorClass} rounded-[2.5rem] p-5 border-4 shadow-md flex flex-col items-center justify-between text-center overflow-hidden transition-all duration-500`}
              style={{ transformOrigin: pageDirection > 0 ? "left center" : "right center", backfaceVisibility: "hidden" }}
            >
              {/* Ambient pattern dots */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"></div>
              
              <div className="flex-1 flex flex-col items-center justify-center space-y-3 w-full overflow-y-auto scrollbar-none py-2">
                <div className="text-6xl animate-bounce duration-3000 select-none mb-1 shrink-0">
                  {getCoverEmoji(story.coverTheme)}
                </div>

                <div className="space-y-2 w-full">
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <span className="text-[10px] uppercase font-extrabold tracking-widest bg-white/80 px-3 py-1 rounded-full border border-black/5 text-slate-800">
                      {story.categoria}
                    </span>
                    {story.isOffline && (
                      <span className="text-[9px] uppercase font-bold tracking-widest bg-amber-100/95 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-2xs">
                        ⚡ offline
                      </span>
                    )}
                  </div>
                  
                  <h2 className={`font-bold font-serif leading-tight pt-1 ${
                    fontSize === "sm" ? "text-xl" :
                    fontSize === "base" ? "text-2xl" :
                    fontSize === "lg" ? "text-3xl" :
                    fontSize === "xl" ? "text-4xl" : "text-5xl"
                  }`}>
                    {renderPageText(story.titolo)}
                  </h2>
                </div>

                <p className={`italic font-bold opacity-85 max-w-xs leading-relaxed ${
                  fontSize === "sm" ? "text-[10px]" :
                  fontSize === "base" ? "text-[12px]" :
                  fontSize === "lg" ? "text-[14px]" :
                  fontSize === "xl" ? "text-[16px]" : "text-[18px]"
                }`}>
                  "{story.copertinaDescrizione}"
                </p>
              </div>

              {/* Cover integrated pagination controls */}
              <div className={`w-full pt-2.5 border-t-2 flex items-center justify-between text-[10px] font-extrabold tracking-wider border-slate-200/50 shrink-0 ${activeTheme !== "giorno" ? "text-slate-400" : "text-slate-600"}`}>
                <button
                  type="button"
                  disabled
                  className={`px-2.5 py-1 rounded-full text-[9px] font-black flex items-center gap-0.5 transition-all opacity-35 cursor-not-allowed border ${currentThemeClasses.buttonBack}`}
                >
                  <ChevronLeft size={11} /> Prec.
                </button>

                <span className="font-extrabold text-[9.5px] uppercase tracking-wider">
                  COPERTINA 📖
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerPageTransitionWithIntermezzo(1);
                  }}
                  className="px-3 py-1 rounded-full text-[9px] font-black flex items-center gap-0.5 transition-all cursor-pointer border shadow-sm animate-pulse bg-gradient-to-r from-pink-400 to-[#EC407A] text-white border-pink-500 hover:scale-105 active:scale-95"
                >
                  Apri 📖 <ChevronRight size={11} />
                </button>
              </div>
            </motion.div>
          )}

          {!isCover && !isMoralPage && (
            <motion.div
              key={`page-${currentPage}`}
              custom={pageDirection}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`absolute inset-0 w-full h-full rounded-[2.5rem] p-5 border-4 shadow-md flex flex-col justify-between transition-all duration-500 ${currentThemeClasses.pageBg}`}
              style={{ transformOrigin: pageDirection > 0 ? "left center" : "right center", backfaceVisibility: "hidden" }}
            >
              {/* Page Text Area with inner scrollbar to prevent layout overflow */}
              <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-pink-200/50 mb-3">
                <p className={`leading-relaxed font-semibold whitespace-pre-line text-left ${currentThemeClasses.text} ${
                  fontSize === "sm" ? "text-sm" :
                  fontSize === "base" ? "text-base" :
                  fontSize === "lg" ? "text-lg" :
                  fontSize === "xl" ? "text-xl" : "text-2xl"
                }`}>
                  {renderPageText(pagine[currentPage - 1])}
                </p>
              </div>

              {/* Page footer with integrated pagination controls */}
              <div className={`w-full pt-2.5 border-t-2 flex items-center justify-between text-[10px] font-extrabold tracking-wider border-slate-200/50 shrink-0 ${currentThemeClasses.subText}`}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePageChange(currentPage - 1);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[9px] font-black flex items-center gap-0.5 transition-all cursor-pointer border disabled:opacity-40 disabled:cursor-not-allowed ${currentThemeClasses.buttonBack}`}
                >
                  <ChevronLeft size={11} /> Prec.
                </button>

                <span className="font-extrabold text-[9.5px] uppercase tracking-wider">
                  PAGINA {currentPage} DI {totalPages}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerPageTransitionWithIntermezzo(currentPage + 1);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[9px] font-black flex items-center gap-0.5 transition-all cursor-pointer border disabled:opacity-40 disabled:cursor-not-allowed ${currentThemeClasses.buttonNext}`}
                >
                  {currentPage === totalPages ? "Morale ✨" : "Succ."} <ChevronRight size={11} />
                </button>
              </div>
            </motion.div>
          )}

          {isMoralPage && (
            <motion.div
              key="moral"
              custom={pageDirection}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`absolute inset-0 w-full h-full rounded-[2.5rem] p-5 border-4 shadow-md flex flex-col justify-between text-center overflow-hidden transition-all duration-500 ${activeTheme === "notte" ? currentThemeClasses.pageBg : "bg-gradient-to-b from-[#FFFDE7] to-[#FFF9C4] border-natural-yellow text-slate-800 shadow-sm"}`}
              style={{ transformOrigin: pageDirection > 0 ? "left center" : "right center", backfaceVisibility: "hidden" }}
            >
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-natural-yellow-light/40 rounded-full blur-md"></div>
              
              <div className="flex-1 flex flex-col items-center justify-center space-y-2 py-2 overflow-y-auto scrollbar-none">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-inner border border-natural-yellow-light animate-bounce shrink-0">
                  📜
                </div>
                <h4 className="text-[#F57C00] font-black text-base font-serif italic shrink-0">La Morale Insegnata</h4>
                
                <div className="text-[10px] text-[#F57C00] font-black tracking-widest uppercase bg-white/80 px-3 py-0.5 rounded-full border border-natural-yellow-light shrink-0">
                  ✨ Valore: {getEducationalThemeDisplayName(story.temaEducativo)} ✨
                </div>
                
                <p className={`text-natural-text leading-relaxed font-extrabold px-2 ${
                  fontSize === "sm" ? "text-xs" :
                  fontSize === "base" ? "text-sm" :
                  fontSize === "lg" ? "text-base" :
                  fontSize === "xl" ? "text-lg" : "text-xl"
                }`}>
                  {renderPageText(story.morale)}
                </p>

                {/* BIG sparkling Continue Story button */}
                {(story.chapter || 1) < 10 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeechStop();
                      onContinueStory(story);
                    }}
                    className="mt-3 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-[#F57C00] hover:from-orange-500 hover:to-orange-600 active:scale-95 text-white rounded-full flex items-center justify-center gap-1.5 text-xs font-black shadow-md border-b-4 border-orange-800 transition-all cursor-pointer animate-pulse shrink-0"
                  >
                    <Sparkles size={14} className="text-white animate-bounce" />
                    <span>Continua la Storia 🔮</span>
                  </button>
                )}
              </div>

              {/* Moral integrated pagination controls */}
              <div className="w-full pt-2.5 border-t-2 border-natural-yellow-light flex items-center justify-between text-[10px] font-black tracking-widest uppercase shrink-0 text-[#F57C00]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePageChange(currentPage - 1);
                  }}
                  className="px-2.5 py-1 rounded-full text-[9px] font-black flex items-center gap-0.5 transition-all cursor-pointer border border-[#FFB74D] bg-white hover:bg-orange-50 text-[#F57C00] disabled:opacity-40"
                >
                  <ChevronLeft size={11} /> Prec.
                </button>

                <span className="font-extrabold text-[9.5px] uppercase tracking-wider text-[#F57C00]">
                  MORALE ⭐
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeechStop();
                    onBack();
                  }}
                  className="px-2.5 py-1 rounded-full text-[9px] font-black flex items-center gap-0.5 transition-all border border-[#FFB74D] bg-white hover:bg-orange-50 text-[#F57C00]"
                >
                  Fine <ChevronRight size={11} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Book Bottom Turn Pages bar removed */}

      {/* Custom Share Modal fallback */}
      {showShareModal && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-5 border-4 border-natural-pink-border shadow-xl max-w-xs w-full text-center space-y-4">
            <span className="text-4xl animate-bounce inline-block">🎁</span>
            <h4 className="font-extrabold text-sm text-natural-burgundy font-serif">Condividi la tua Favola!</h4>
            <p className="text-[10px] text-natural-text/70 leading-relaxed font-bold">
              Copia il testo completo di questa favola magica per inviarlo ad amici e parenti!
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleCopyStory}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-natural-pink to-[#EC407A] text-white border-b-4 border-[#C2185B] rounded-full text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copiato negli Appunti!" : "Copia Testo Favola"}
              </button>

              <button
                onClick={() => setShowShareModal(false)}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold transition-colors cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
