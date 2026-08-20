// Futuristic Sound Effects using native Web Audio API (zero external assets required)

class SoundFXManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initContext() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Soft futuristic UI click / tick
  public playClick() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio playback silently ignored if blocked by browser policy
    }
  }

  // Harmonic chord chime for each loading step (ascending pentatonic / futuristic scale)
  public playStepChime(stepIndex: number) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      // Frequencies for steps 1 through 5 (Futuristic crystal harmony: C#5, E5, F#5, G#5, B5 / C#6)
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
      osc2.frequency.setValueAtTime(freq * 1.5, ctx.currentTime); // 5th harmonic sparkle

      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(freq / 2, ctx.currentTime); // Sub warmth

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
      // Audio playback silently ignored
    }
  }

  // Hyperspace warp drive engagement riser & blast
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
      // Audio playback silently ignored
    }
  }
}

export const soundFX = new SoundFXManager();
