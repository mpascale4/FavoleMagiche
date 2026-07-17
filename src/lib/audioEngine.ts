// Fairytale Procedural Synthesizer and Sound Effects Engine using Web Audio API
// No external assets required, pure browser synthesis!

class AudioEngine {
  private ctx: AudioContext | null = null;
  private musicIntervalId: any = null;
  private musicVolumeNode: GainNode | null = null;
  private musicPlaying = false;
  private currentStep = 0;

  // Lazily initialize the Audio Context
  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    // Auto-resume if suspended (browser security restriction)
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch((err) => console.log("Failed to resume AudioContext:", err));
    }
    return this.ctx;
  }

  // Play synthesized Sound Effects
  public playSfx(type: "magic" | "dragon" | "chime" | "nature" | "jump" | "mystery" | "success") {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("favole_magiche_settings");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.effettiAudio === false) return;
        }
      }
    } catch (e) {}

    const ctx = this.getContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    try {
      switch (type) {
        case "magic": {
          // A sweeping, sparkling magic wand arpeggio (sine wave sweeping up)
          const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760];
          notes.forEach((freq, index) => {
            const time = now + index * 0.08;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, time);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.5, time + 0.15);

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.08, time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(time);
            osc.stop(time + 0.35);
          });
          break;
        }

        case "dragon": {
          // A friendly low-frequency cartoon dragon rumble/growl (sawtooth with pitch modulation)
          const osc = ctx.createOscillator();
          const mod = ctx.createOscillator();
          const modGain = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();

          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(110, now);
          osc.frequency.linearRampToValueAtTime(70, now + 0.8);

          mod.type = "sine";
          mod.frequency.setValueAtTime(15, now); // LFO
          modGain.gain.setValueAtTime(35, now);

          filter.type = "lowpass";
          filter.frequency.setValueAtTime(450, now);
          filter.frequency.exponentialRampToValueAtTime(150, now + 0.8);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.12, now + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

          mod.connect(modGain);
          modGain.connect(osc.frequency);
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          mod.start(now);
          osc.start(now);
          mod.stop(now + 0.9);
          osc.stop(now + 0.9);
          break;
        }

        case "chime": {
          // Magical celestial chimes / star sparkle (bright resonance)
          const chimeFreqs = [1200, 1500, 1800, 2100];
          chimeFreqs.forEach((freq, i) => {
            const time = now + i * 0.05;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, time);

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.05, time + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(time);
            osc.stop(time + 0.75);
          });
          break;
        }

        case "nature": {
          // Soothing sound of forest wind or rustling magical leaves (noise emulation)
          const bufferSize = ctx.sampleRate * 1.5; // 1.5 seconds
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          
          // Generate white noise
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }

          const noiseNode = ctx.createBufferSource();
          noiseNode.buffer = buffer;

          const filter = ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.Q.setValueAtTime(4.0, now);
          filter.frequency.setValueAtTime(300, now);
          // Modulate filter frequency to make a "whoosh" wind sound
          filter.frequency.exponentialRampToValueAtTime(1000, now + 0.75);
          filter.frequency.exponentialRampToValueAtTime(250, now + 1.5);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.15, now + 0.4);
          gain.gain.linearRampToValueAtTime(0.1, now + 1.0);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

          noiseNode.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          noiseNode.start(now);
          noiseNode.stop(now + 1.5);
          break;
        }

        case "jump": {
          // Cute boing/jump effect for actions (sine wave sweeping up quickly)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "triangle";
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.exponentialRampToValueAtTime(650, now + 0.25);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.3);
          break;
        }

        case "mystery": {
          // Low mystery suspense chord drone
          const freqs = [146.83, 196.00, 246.94]; // D3, G3, B3
          freqs.forEach((freq) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now);
            // Slight detune/vibrato
            osc.frequency.linearRampToValueAtTime(freq + 1.5, now + 1.0);

            filter.type = "lowpass";
            filter.frequency.setValueAtTime(300, now);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.08, now + 0.2);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 1.25);
          });
          break;
        }

        case "success": {
          // Joyful fairy success melody (happy, resonant and bell-like)
          const notes = [
            { f: 523.25, d: 0.1, t: 0 },      // C5
            { f: 659.25, d: 0.1, t: 0.08 },    // E5
            { f: 783.99, d: 0.1, t: 0.16 },    // G5
            { f: 1046.50, d: 0.3, t: 0.24 },   // C6
          ];

          notes.forEach((note) => {
            const time = now + note.t;
            const osc = ctx.createOscillator();
            const oscHarmonic = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(note.f, time);

            oscHarmonic.type = "sine";
            oscHarmonic.frequency.setValueAtTime(note.f * 2, time); // Bright overtone

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.06, time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, time + note.d + 0.1);

            osc.connect(gain);
            oscHarmonic.connect(gain);
            gain.connect(ctx.destination);

            osc.start(time);
            oscHarmonic.start(time);
            osc.stop(time + note.d + 0.12);
            oscHarmonic.stop(time + note.d + 0.12);
          });
          break;
        }
      }
    } catch (err) {
      console.error("Failed to generate synthesized sound effect:", err);
    }
  }

  // Play beautiful, dreamy, fairytale background music box loop
  public startBackgroundMusic() {
    if (this.musicPlaying) return;

    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("favole_magiche_settings");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.musicaSottofondo === false) return;
        }
      }
    } catch (e) {}

    const ctx = this.getContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    this.musicPlaying = true;
    this.currentStep = 0;

    // Define Master background music gain node (raised to 0.35 for audibility)
    this.musicVolumeNode = ctx.createGain();
    this.musicVolumeNode.gain.setValueAtTime(0.35, ctx.currentTime); 
    this.musicVolumeNode.connect(ctx.destination);

    // Beautiful harmonic fairytale progression in C pentatonic / F major / A minor
    // Each step is 450ms
    const chords: number[][] = [
      // Bar 1: C Major Pentatonic chord notes
      [261.63, 329.63, 392.00, 523.25], // C4, E4, G4, C5
      // Bar 2: F Major Chord notes
      [349.23, 440.00, 523.25, 698.46], // F4, A4, C5, F5
      // Bar 3: A Minor Chord notes
      [220.00, 329.63, 440.00, 523.25], // A3, E4, A4, C5
      // Bar 4: G Major Chord notes
      [196.00, 293.66, 392.00, 587.33]  // G3, D4, G4, D5
    ];

    const playStep = () => {
      if (!this.musicPlaying || !ctx) return;
      const now = ctx.currentTime;

      // Determine chord base on step count (32 steps loop)
      const chordIdx = Math.floor((this.currentStep % 16) / 4);
      const currentChord = chords[chordIdx];
      
      // Select which note of chord to play arpeggiated
      const noteOffset = this.currentStep % 4;
      let freq = currentChord[noteOffset];

      // Add simple high melody decoration on some steps
      const playMelody = this.currentStep % 2 === 0;

      if (freq) {
        if (playMelody) {
          // Play primary melody note with gentle sine wave
          this.synthMusicNote(ctx, freq, 0.45, now, "sine", 1.0);

          // High twinkling note on top for fairytale music box vibe
          if (this.currentStep % 4 === 0) {
            const highFreq = freq * 2;
            this.synthMusicNote(ctx, highFreq, 0.3, now + 0.15, "triangle", 0.35);
          }
        } else {
          // Play a softer, secondary arpeggio note for a continuous flowing sound
          const softFreq = currentChord[(noteOffset + 2) % 4];
          this.synthMusicNote(ctx, softFreq, 0.35, now, "triangle", 0.5);
        }
      }

      this.currentStep++;
    };

    // Trigger instantly then run interval
    playStep();
    this.musicIntervalId = setInterval(playStep, 450);
  }

  // Synth single note for the music box
  private synthMusicNote(
    ctx: AudioContext,
    freq: number,
    duration: number,
    time: number,
    type: "sine" | "triangle" = "sine",
    volumeFactor = 1.0
  ) {
    if (!this.musicVolumeNode) return;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    // Warm vibrato
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(5, time); // 5Hz vibrato
    lfoGain.gain.setValueAtTime(2.5, time);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // Music Box envelope: instant attack, long, peaceful decay
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.12 * volumeFactor, time + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gainNode);
    gainNode.connect(this.musicVolumeNode);

    lfo.start(time);
    osc.start(time);
    
    lfo.stop(time + duration);
    osc.stop(time + duration);
  }

  public stopBackgroundMusic() {
    this.musicPlaying = false;
    if (this.musicIntervalId) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
    if (this.musicVolumeNode) {
      try {
        this.musicVolumeNode.gain.setValueAtTime(this.musicVolumeNode.gain.value, this.getContext()?.currentTime || 0);
        this.musicVolumeNode.gain.exponentialRampToValueAtTime(0.0001, (this.getContext()?.currentTime || 0) + 0.5);
      } catch (e) {
        this.musicVolumeNode.disconnect();
      }
      this.musicVolumeNode = null;
    }
  }

  public swellMusic() {
    const ctx = this.getContext();
    if (ctx && this.musicVolumeNode && this.musicPlaying) {
      const now = ctx.currentTime;
      this.musicVolumeNode.gain.cancelScheduledValues(now);
      this.musicVolumeNode.gain.setValueAtTime(this.musicVolumeNode.gain.value, now);
      // Elevate background volume from 0.04 to 0.14 for cinematic pauses
      this.musicVolumeNode.gain.linearRampToValueAtTime(0.14, now + 0.6);
    }
  }

  public restoreMusic() {
    const ctx = this.getContext();
    if (ctx && this.musicVolumeNode && this.musicPlaying) {
      const now = ctx.currentTime;
      this.musicVolumeNode.gain.cancelScheduledValues(now);
      this.musicVolumeNode.gain.setValueAtTime(this.musicVolumeNode.gain.value, now);
      // Smoothly restore background volume to gentle 0.04 level
      this.musicVolumeNode.gain.linearRampToValueAtTime(0.04, now + 1.0);
    }
  }

  public duckMusic() {
    const ctx = this.getContext();
    if (ctx && this.musicVolumeNode && this.musicPlaying) {
      const now = ctx.currentTime;
      this.musicVolumeNode.gain.cancelScheduledValues(now);
      this.musicVolumeNode.gain.setValueAtTime(this.musicVolumeNode.gain.value, now);
      // Duck background volume to almost zero (very subtle) so narration is perfectly clear
      this.musicVolumeNode.gain.linearRampToValueAtTime(0.004, now + 0.4);
    }
  }

  public unduckMusic() {
    const ctx = this.getContext();
    if (ctx && this.musicVolumeNode && this.musicPlaying) {
      const now = ctx.currentTime;
      this.musicVolumeNode.gain.cancelScheduledValues(now);
      this.musicVolumeNode.gain.setValueAtTime(this.musicVolumeNode.gain.value, now);
      // Restore background volume to gentle 0.04 level
      this.musicVolumeNode.gain.linearRampToValueAtTime(0.04, now + 0.8);
    }
  }

  // Play a beautiful, random, 5-second procedurally generated magical chime melody
  public playRandomIntermezzo() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Temporarily swell/adjust background music volume to be softer or let the intermezzo stand out
    const originalVolume = this.musicVolumeNode ? this.musicVolumeNode.gain.value : 0.04;
    if (this.musicVolumeNode) {
      this.musicVolumeNode.gain.setValueAtTime(originalVolume, now);
      this.musicVolumeNode.gain.linearRampToValueAtTime(0.01, now + 0.3); // duck background music
    }

    // A selection of sweet fairytale scales
    const scales = [
      [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50], // C major
      [587.33, 659.25, 739.99, 880.00, 987.77, 1174.66, 1318.51], // D major / pentatonic
      [349.23, 440.00, 523.25, 587.33, 698.46, 880.00, 1046.50], // F Major pentatonic
      [440.00, 493.88, 554.37, 659.25, 739.99, 880.00, 987.77]  // A major pentatonic
    ];
    const scale = scales[Math.floor(Math.random() * scales.length)];

    // Play 7 to 10 notes randomly over 4.8 seconds
    const numNotes = 8 + Math.floor(Math.random() * 4);
    const stepTime = 4.8 / numNotes;

    for (let i = 0; i < numNotes; i++) {
      const noteTime = now + (i * stepTime) + (Math.random() * 0.08);
      const freq = scale[Math.floor(Math.random() * scale.length)];
      const duration = 0.4 + Math.random() * 0.4;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Alternate waveforms for magical texture
      osc.type = Math.random() > 0.5 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, noteTime);

      // Pitch sweep up for magic chime feel
      if (Math.random() > 0.4) {
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, noteTime + duration * 0.4);
      }

      gainNode.gain.setValueAtTime(0, noteTime);
      gainNode.gain.linearRampToValueAtTime(0.07, noteTime + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteTime + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + duration + 0.1);
    }

    // Restore background music volume after 5 seconds
    setTimeout(() => {
      if (this.musicVolumeNode && this.musicPlaying) {
        const currentNow = this.getContext()?.currentTime || 0;
        this.musicVolumeNode.gain.setValueAtTime(0.01, currentNow);
        this.musicVolumeNode.gain.linearRampToValueAtTime(originalVolume, currentNow + 0.8);
      }
    }, 5000);
  }

  public isMusicPlaying(): boolean {
    return this.musicPlaying;
  }
}

export const audioEngine = new AudioEngine();
