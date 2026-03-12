/**
 * Performance monitor that tracks FPS and auto-disables effects
 * when performance drops below thresholds.
 */

export interface PerformanceConfig {
  /** FPS below which effects get disabled */
  minFps: number;
  /** Number of frames to sample before deciding */
  sampleSize: number;
  /** How often to check (in frames) */
  checkInterval: number;
}

export interface PerformanceState {
  /** Current measured FPS */
  fps: number;
  /** Average FPS over the sample window */
  averageFps: number;
  /** Whether CRT effect should be enabled */
  crtEnabled: boolean;
  /** Whether parallax should be enabled */
  parallaxEnabled: boolean;
  /** Whether animations should be at full fidelity */
  fullAnimations: boolean;
}

const DEFAULT_CONFIG: PerformanceConfig = {
  minFps: 24,
  sampleSize: 60,
  checkInterval: 30,
};

export class PerformanceMonitor {
  private config: PerformanceConfig;
  private frameTimes: number[] = [];
  private lastFrameTime = 0;
  private frameCount = 0;
  private _state: PerformanceState;

  /** Callback when performance state changes */
  onStateChange: ((state: PerformanceState) => void) | null = null;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this._state = {
      fps: 30,
      averageFps: 30,
      crtEnabled: true,
      parallaxEnabled: true,
      fullAnimations: true,
    };
  }

  /** Current performance state */
  get state(): PerformanceState {
    return { ...this._state };
  }

  /** Record a frame timestamp and check performance */
  recordFrame(timestamp: number): void {
    if (this.lastFrameTime > 0) {
      const delta = timestamp - this.lastFrameTime;
      if (delta > 0) {
        this._state.fps = Math.round(1000 / delta);
        this.frameTimes.push(delta);

        if (this.frameTimes.length > this.config.sampleSize) {
          this.frameTimes.shift();
        }
      }
    }
    this.lastFrameTime = timestamp;
    this.frameCount++;

    // Periodic performance check
    if (this.frameCount % this.config.checkInterval === 0) {
      this.evaluate();
    }
  }

  /** Force a performance evaluation */
  evaluate(): void {
    if (this.frameTimes.length === 0) return;

    const avg =
      this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this._state.averageFps = Math.round(1000 / avg);

    const previousState = { ...this._state };
    const isLow = this._state.averageFps < this.config.minFps;

    if (isLow) {
      // Progressive degradation
      if (this._state.averageFps < this.config.minFps * 0.5) {
        // Very low: disable everything
        this._state.crtEnabled = false;
        this._state.parallaxEnabled = false;
        this._state.fullAnimations = false;
      } else {
        // Moderately low: disable CRT first (heaviest effect)
        this._state.crtEnabled = false;
        this._state.parallaxEnabled = true;
        this._state.fullAnimations = true;
      }
    } else {
      // Performance is fine, re-enable everything
      this._state.crtEnabled = true;
      this._state.parallaxEnabled = true;
      this._state.fullAnimations = true;
    }

    // Notify if state changed
    if (
      previousState.crtEnabled !== this._state.crtEnabled ||
      previousState.parallaxEnabled !== this._state.parallaxEnabled ||
      previousState.fullAnimations !== this._state.fullAnimations
    ) {
      this.onStateChange?.(this.state);
    }
  }

  /** Reset the monitor */
  reset(): void {
    this.frameTimes = [];
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this._state = {
      fps: 30,
      averageFps: 30,
      crtEnabled: true,
      parallaxEnabled: true,
      fullAnimations: true,
    };
  }
}
