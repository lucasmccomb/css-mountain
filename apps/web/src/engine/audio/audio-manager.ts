/**
 * Web Audio API manager with mute toggle and volume control.
 * Audio only starts after a user gesture (Safari autoplay compliance).
 */

export class AudioManager {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private _muted = false;
  private _volume = 0.5;
  private _initialized = false;
  private activeSources = new Set<AudioBufferSourceNode>();

  /** Whether audio has been initialized (requires user gesture) */
  get initialized(): boolean {
    return this._initialized;
  }

  /** Whether audio is muted */
  get muted(): boolean {
    return this._muted;
  }

  /** Current volume (0-1) */
  get volume(): number {
    return this._volume;
  }

  /**
   * Initialize the audio context.
   * Must be called in response to a user gesture (click, keypress).
   */
  async init(): Promise<void> {
    if (this._initialized) return;

    try {
      this.context = new AudioContext();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this._muted ? 0 : this._volume;
      this.masterGain.connect(this.context.destination);
      this._initialized = true;

      // Resume context if it was suspended (Safari)
      if (this.context.state === "suspended") {
        await this.context.resume();
      }
    } catch {
      // Web Audio not available
      this._initialized = false;
    }
  }

  /** Set the master volume (0-1) */
  setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && !this._muted) {
      this.masterGain.gain.setValueAtTime(
        this._volume,
        this.context?.currentTime ?? 0,
      );
    }
  }

  /** Toggle mute state */
  toggleMute(): boolean {
    this._muted = !this._muted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        this._muted ? 0 : this._volume,
        this.context?.currentTime ?? 0,
      );
    }
    return this._muted;
  }

  /** Set mute state directly */
  setMuted(muted: boolean): void {
    this._muted = muted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        this._muted ? 0 : this._volume,
        this.context?.currentTime ?? 0,
      );
    }
  }

  /**
   * Play a generated tone.
   * @param frequency - Tone frequency in Hz
   * @param duration - Duration in seconds
   * @param type - Oscillator waveform type
   * @param volumeMultiplier - Volume relative to master (0-1)
   */
  playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = "square",
    volumeMultiplier = 1,
  ): void {
    if (!this.context || !this.masterGain || !this._initialized) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.context.currentTime);

    // Quick envelope to avoid clicks
    gain.gain.setValueAtTime(0, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(
      volumeMultiplier,
      this.context.currentTime + 0.01,
    );
    gain.gain.linearRampToValueAtTime(
      0,
      this.context.currentTime + duration - 0.01,
    );

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + duration);
  }

  /**
   * Play a sequence of tones (melody).
   * @param notes - Array of [frequency, duration] pairs
   * @param type - Oscillator waveform type
   */
  playSequence(
    notes: Array<[number, number]>,
    type: OscillatorType = "square",
  ): void {
    if (!this.context || !this._initialized) return;

    let time = this.context.currentTime;
    for (const [freq, dur] of notes) {
      this.playToneAt(freq, time, dur, type);
      time += dur;
    }
  }

  /** Stop all active sounds */
  stopAll(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch {
        // Source may have already stopped
      }
    }
    this.activeSources.clear();
  }

  /** Clean up the audio context */
  destroy(): void {
    this.stopAll();
    if (this.context) {
      this.context.close().catch(() => {
        // Ignore close errors
      });
    }
    this.context = null;
    this.masterGain = null;
    this._initialized = false;
  }

  private playToneAt(
    frequency: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
  ): void {
    if (!this.context || !this.masterGain) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
    gain.gain.linearRampToValueAtTime(0, startTime + duration - 0.01);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}
