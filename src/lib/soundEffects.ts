// Elevated Web Audio Sound Engine for Ritualis (Zero external audio files required)

class SoundFXManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ritualis_sound_muted");
      if (saved !== null) {
        this.isMuted = saved === "true";
      }
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== "undefined") {
      localStorage.setItem("ritualis_sound_muted", String(this.isMuted));
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // 1. Soft futuristic UI click
  public playClick() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio playback silently ignored if blocked
    }
  }

  // 2. Harmonic chord chime for progressive steps (loading, milestones)
  public playStepChime(stepIndex: number) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const baseFreqs = [554.37, 659.25, 739.99, 830.61, 1108.73];
      const freq = baseFreqs[Math.min(stepIndex, baseFreqs.length - 1)] || 659.25;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(freq, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(freq * 1.01, ctx.currentTime + 0.35);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(freq * 1.5, ctx.currentTime);

      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(freq / 2, ctx.currentTime);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2800, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc1.connect(filter);
      osc2.connect(filter);
      subOsc.connect(gain);
      filter.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc1.start(now);
      osc2.start(now);
      subOsc.start(now);

      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
      subOsc.stop(now + 0.45);
    } catch {
      // Ignore audio error
    }
  }

  // 3. Habit Completion Bell (Golden resonant chime)
  public playHabitComplete() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Dual harmonic tones: E5 (659.25Hz) and B5 (987.77Hz) for gilded golden satisfaction
      const fundamental = 659.25;
      const overtone = fundamental * 1.5;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(fundamental, now);
      osc1.frequency.exponentialRampToValueAtTime(fundamental * 1.02, now + 0.5);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(overtone, now);
      osc2.frequency.exponentialRampToValueAtTime(overtone * 1.01, now + 0.4);

      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.55);
      osc2.stop(now + 0.55);
    } catch {
      // Ignore
    }
  }

  // 4. Habit Undo Tick (Subtle wooden uncheck)
  public playHabitUndo() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Ignore
    }
  }

  // 5. Counter Stepper Tick (+ / - numeric habits)
  public playCounterTick(isIncrement: boolean = true) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freqStart = isIncrement ? 780 : 540;
      const freqEnd = isIncrement ? 920 : 420;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freqStart, now);
      osc.frequency.exponentialRampToValueAtTime(freqEnd, now + 0.05);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignore
    }
  }

  // 6. Streak Freeze Shield Sound (Crystalline resonance)
  public playStreakShield() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Amethyst crystal chord
      [880, 1318.51, 1760].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.04);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + 0.6);

        gain.gain.setValueAtTime(0.04, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.04);
        osc.stop(now + 0.7);
      });
    } catch {
      // Ignore
    }
  }

  // 7. Grand Victory Fanfare (100% daily completion or major streak milestone)
  public playVictoryFanfare() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Majestic ascending Gilded Gold arpeggio: C5 -> E5 -> G5 -> C6 -> E6
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];

      notes.forEach((freq, idx) => {
        const noteStart = now + idx * 0.09;
        const osc = ctx.createOscillator();
        const sub = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, noteStart);

        sub.type = "sine";
        sub.frequency.setValueAtTime(freq / 2, noteStart);

        const dur = idx === notes.length - 1 ? 0.9 : 0.28;
        gain.gain.setValueAtTime(0.09, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + dur);

        osc.connect(gain);
        sub.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        sub.start(noteStart);
        osc.stop(noteStart + dur);
        sub.stop(noteStart + dur);
      });
    } catch {
      // Ignore
    }
  }

  // 8. Confetti Pop
  public playConfettiPop() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignore
    }
  }

  // 9. Hyperspace warp drive engagement riser & blast (splash screen)
  public playHyperspaceWarp() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Riser
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.8);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(6000, now + 0.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);

      // Deep Sub Impact
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = "sine";
      sub.frequency.setValueAtTime(120, now + 0.7);
      sub.frequency.exponentialRampToValueAtTime(30, now + 1.5);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.setValueAtTime(0.2, now + 0.7);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

      sub.connect(subGain);
      subGain.connect(ctx.destination);

      sub.start(now + 0.7);
      sub.stop(now + 1.6);
    } catch {
      // Ignore
    }
  }
}

export const soundFX = new SoundFXManager();
