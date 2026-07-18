/**
 * Magical Web Audio API Synthesizer for "Favole Magiche"
 * Synthesizes pure, delightful sound effects natively in the browser.
 */

import { shouldApplyNightTheme } from "./theme";
import { readJsonStorage } from "./storage";

let audioCtx: AudioContext | null = null;

type AppAudioSettings = {
  audioAdattivo?: boolean;
  stileVisuale?: "auto" | "notte" | string;
  effettiAudio?: boolean;
};

function readStoredAudioSettings(): AppAudioSettings | null {
  return readJsonStorage<AppAudioSettings | null>("favole_magiche_settings", null);
}

function shouldUseNightAudioMode(): boolean {
  const parsed = readStoredAudioSettings();
  if (parsed) {
    if (parsed.audioAdattivo === false) return false;
    const visualStyle = parsed.stileVisuale || "auto";
    if (visualStyle === "notte") return true;
    if (visualStyle !== "auto") return false;
  }
  return shouldApplyNightTheme();
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  // Resume context if suspended (browser security policy for gesture start)
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function isSfxEnabled(): boolean {
  const parsed = readStoredAudioSettings();
  if (parsed) {
    return parsed.effettiAudio !== false;
  }
  return true;
}

function withAudioContext(play: (ctx: AudioContext) => void): void {
  if (!isSfxEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  play(ctx);
}

/**
 * A fast, high-pitched magical sparkle when secret options are toggled.
 */
export function playPlinkSound() {
  withAudioContext((ctx) => {
  const now = ctx.currentTime;
  
  // Note 1
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(880, now); // A5
  osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.15); // A6
  
  gain1.gain.setValueAtTime(0.12, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.2);

  // Note 2 (slightly delayed higher spark)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(1320, now + 0.05); // E6
  osc2.frequency.exponentialRampToValueAtTime(2640, now + 0.2); // E7
  
  gain2.gain.setValueAtTime(0.1, now + 0.05);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.05);
  osc2.stop(now + 0.25);
  });
}

/**
 * A rich, warm fairy choir chord with slow attack and starry sparkles.
 */
export function playFairyChorusSound() {
  withAudioContext((ctx) => {
  const now = ctx.currentTime;
  const night = shouldUseNightAudioMode();
  const frequencies = night
    ? [261.63, 329.63, 392.0, 523.25] // softer C major spread
    : [349.23, 523.25, 659.25, 1046.5];

  frequencies.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Smooth triangle waves mimic clean chorus/flutes
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);
    
    // Slightly detune to create a lush chorus effect
    osc.detune.setValueAtTime((idx - 1.5) * 8, now);

    // Warm, rising attack, lingering decay
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.3 + idx * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 1.8);
  });

  // Extra sparkle chime on top
  setTimeout(() => {
    const oscChime = ctx.createOscillator();
    const gainChime = ctx.createGain();
    oscChime.type = "sine";
    oscChime.frequency.setValueAtTime(2093, ctx.currentTime); // C7
    gainChime.gain.setValueAtTime(0.06, ctx.currentTime);
    gainChime.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    oscChime.connect(gainChime);
    gainChime.connect(ctx.destination);
    oscChime.start();
    oscChime.stop(ctx.currentTime + 0.5);
  }, 250);
  });
}

/**
 * A cute, friendly retro double-beep ("bip-bip") when adding/modifying characters.
 */
export function playRobotBeepSound() {
  withAudioContext((ctx) => {
  const now = ctx.currentTime;

  // Bip 1 (short, square wave for synth texture)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "triangle";
  osc1.frequency.setValueAtTime(600, now); // D5-ish
  
  gain1.gain.setValueAtTime(0.12, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.1);

  // Bip 2 (higher pitch, following immediately)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(900, now + 0.09); // A5-ish
  
  gain2.gain.setValueAtTime(0.12, now + 0.09);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.09);
  osc2.stop(now + 0.22);
  });
}

/**
 * A soft, pleasant click/tap sound for general UI interactions.
 */
export function playClickSound() {
  withAudioContext((ctx) => {
  const now = ctx.currentTime;
  const night = shouldUseNightAudioMode();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = night ? "triangle" : "sine";
  osc.frequency.setValueAtTime(night ? 320 : 450, now);
  osc.frequency.exponentialRampToValueAtTime(night ? 140 : 180, now + 0.05);

  gain.gain.setValueAtTime(night ? 0.035 : 0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.06);
  });
}

/**
 * A beautiful upward chime chord for starting a "Nuova Storia".
 */
export function playNewStoryClickSound() {
  withAudioContext((ctx) => {
  const now = ctx.currentTime;
  const notes = [392.00, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
  
  notes.forEach((freq, i) => {
    const time = now + i * 0.06;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.07, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.3);
  });
  });
}

/**
 * A rising, swirling magical frequency sweep for the "Genera" action.
 */
export function playGenerateClickSound() {
  withAudioContext((ctx) => {
  const now = ctx.currentTime;
  
  // High-pitched magical whoosh / sweep
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(1500, now + 0.55);
  
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(400, now);
  filter.frequency.exponentialRampToValueAtTime(2800, now + 0.55);
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.65);
  });
}

/**
 * A mystery chest open sound for "Apri Box" daily rewards.
 */
export function playOpenBoxClickSound() {
  withAudioContext((ctx) => {
  const now = ctx.currentTime;
  const night = shouldUseNightAudioMode();

  // Step 1: creaky wood opening low tone
  const oscLow = ctx.createOscillator();
  const gainLow = ctx.createGain();
  oscLow.type = night ? "sine" : "triangle";
  oscLow.frequency.setValueAtTime(night ? 120 : 160, now);
  oscLow.frequency.linearRampToValueAtTime(night ? 220 : 290, now + 0.35);

  gainLow.gain.setValueAtTime(night ? 0.06 : 0.09, now);
  gainLow.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  
  oscLow.connect(gainLow);
  gainLow.connect(ctx.destination);
  oscLow.start(now);
  oscLow.stop(now + 0.35);
  
  // Step 2: Celestial sparkles sweeping out
  const sparkleNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5 to G6
  sparkleNotes.forEach((freq, i) => {
    const time = now + 0.18 + i * 0.055;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.08, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(time);
    osc.stop(time + 0.45);
  });
  });
}

