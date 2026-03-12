/**
 * DOS text-wipe transition effect.
 * Characters progressively replace the screen content,
 * simulating the classic DOS text-mode screen transitions.
 */

/** Characters used for the DOS wipe effect, from dense to sparse */
const WIPE_CHARS = [
  "\u2588", // Full block
  "\u2593", // Dark shade
  "\u2592", // Medium shade
  "\u2591", // Light shade
  " ",
];

export type TransitionDirection = "in" | "out";
export type TransitionStyle = "text-wipe" | "scanline" | "instant";

export interface TransitionOptions {
  /** Transition style */
  style: TransitionStyle;
  /** Direction: 'in' reveals content, 'out' hides it */
  direction: TransitionDirection;
  /** Duration in milliseconds */
  duration: number;
  /** Text color for text-wipe effect */
  color?: string;
  /** Background color */
  bgColor?: string;
  /** Callback when transition completes */
  onComplete?: () => void;
}

const DEFAULT_OPTIONS: TransitionOptions = {
  style: "text-wipe",
  direction: "in",
  duration: 800,
  color: "#33ff33",
  bgColor: "#0a0a1a",
};

export class TransitionEffect {
  private options: TransitionOptions;
  private progress = 0;
  private active = false;
  private elapsedMs = 0;

  constructor(options: Partial<TransitionOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /** Start the transition */
  start(): void {
    this.progress = 0;
    this.elapsedMs = 0;
    this.active = true;
  }

  /** Update the transition state */
  update(deltaMs: number): void {
    if (!this.active) return;

    this.elapsedMs += deltaMs;
    this.progress = Math.min(this.elapsedMs / this.options.duration, 1);

    if (this.progress >= 1) {
      this.active = false;
      this.options.onComplete?.();
    }
  }

  /** Render the transition effect */
  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.active && this.progress >= 1) return;

    const effectiveProgress =
      this.options.direction === "out" ? 1 - this.progress : this.progress;

    switch (this.options.style) {
      case "text-wipe":
        this.renderTextWipe(ctx, width, height, effectiveProgress);
        break;
      case "scanline":
        this.renderScanline(ctx, width, height, effectiveProgress);
        break;
      case "instant":
        if (effectiveProgress < 1) {
          ctx.fillStyle = this.options.bgColor ?? "#0a0a1a";
          ctx.fillRect(0, 0, width, height);
        }
        break;
    }
  }

  /** Whether the transition is currently active */
  get isActive(): boolean {
    return this.active;
  }

  /** Current progress from 0 to 1 */
  get currentProgress(): number {
    return this.progress;
  }

  private renderTextWipe(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    progress: number,
  ): void {
    const charSize = 8;
    const cols = Math.ceil(width / charSize);
    const rows = Math.ceil(height / charSize);
    const totalCells = cols * rows;

    // How many cells should be revealed
    const revealedCells = Math.floor(progress * totalCells);

    ctx.fillStyle = this.options.bgColor ?? "#0a0a1a";
    ctx.fillRect(0, 0, width, height);

    ctx.font = `${charSize}px monospace`;
    ctx.fillStyle = this.options.color ?? "#33ff33";
    ctx.textBaseline = "top";

    for (let i = 0; i < totalCells; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      if (i < revealedCells) {
        // Cell is in the transition zone - pick a wipe character
        const cellProgress = (revealedCells - i) / Math.max(totalCells * 0.1, 1);
        const charIndex = Math.min(
          Math.floor(cellProgress * WIPE_CHARS.length),
          WIPE_CHARS.length - 1,
        );
        const char = WIPE_CHARS[charIndex];

        if (char !== " ") {
          ctx.fillText(char, col * charSize, row * charSize);
        }
      } else {
        // Cell is still covered
        ctx.fillStyle = this.options.bgColor ?? "#0a0a1a";
        ctx.fillRect(col * charSize, row * charSize, charSize, charSize);
        ctx.fillStyle = this.options.color ?? "#33ff33";
      }
    }
  }

  private renderScanline(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    progress: number,
  ): void {
    // Scanline sweeps from top to bottom
    const scanY = progress * height;
    const scanHeight = 4;

    ctx.fillStyle = this.options.bgColor ?? "#0a0a1a";
    if (this.options.direction === "in") {
      ctx.fillRect(0, scanY, width, height - scanY);
    } else {
      ctx.fillRect(0, 0, width, scanY);
    }

    // Draw the scanline itself
    ctx.fillStyle = this.options.color ?? "#33ff33";
    ctx.globalAlpha = 0.6;
    ctx.fillRect(0, scanY - scanHeight / 2, width, scanHeight);
    ctx.globalAlpha = 1;
  }
}
