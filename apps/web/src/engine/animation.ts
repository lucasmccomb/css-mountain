/**
 * Frame-based animation system for sprite animations.
 * Supports walk, climb, idle, and custom animation sequences.
 */

import type { SpriteSheet } from "./sprite-sheet";

export type AnimationState = "idle" | "walk" | "climb" | "celebrate" | "fall";

export interface AnimationSequence {
  /** Animation name/state */
  name: AnimationState;
  /** Array of frame indices from the sprite sheet */
  frames: number[];
  /** Duration per frame in milliseconds */
  frameDuration: number;
  /** Whether the animation loops */
  loop: boolean;
  /** Callback when animation completes (non-looping only) */
  onComplete?: () => void;
}

export class AnimationController {
  private sequences = new Map<AnimationState, AnimationSequence>();
  private currentSequence: AnimationSequence | null = null;
  private currentFrameIndex = 0;
  private elapsedTime = 0;
  private paused = false;

  /** The sprite sheet this controller animates */
  readonly spriteSheet: SpriteSheet;

  constructor(spriteSheet: SpriteSheet) {
    this.spriteSheet = spriteSheet;
  }

  /** Register an animation sequence */
  addSequence(sequence: AnimationSequence): void {
    this.sequences.set(sequence.name, sequence);
  }

  /** Play a named animation */
  play(name: AnimationState): void {
    const sequence = this.sequences.get(name);
    if (!sequence) return;

    // Don't restart if already playing this animation
    if (this.currentSequence?.name === name && !this.paused) return;

    this.currentSequence = sequence;
    this.currentFrameIndex = 0;
    this.elapsedTime = 0;
    this.paused = false;
  }

  /** Pause the current animation */
  pause(): void {
    this.paused = true;
  }

  /** Resume the current animation */
  resume(): void {
    this.paused = false;
  }

  /** Update the animation state */
  update(deltaMs: number): void {
    if (this.paused || !this.currentSequence) return;

    this.elapsedTime += deltaMs;

    while (this.elapsedTime >= this.currentSequence.frameDuration) {
      this.elapsedTime -= this.currentSequence.frameDuration;
      this.currentFrameIndex++;

      if (this.currentFrameIndex >= this.currentSequence.frames.length) {
        if (this.currentSequence.loop) {
          this.currentFrameIndex = 0;
        } else {
          this.currentFrameIndex = this.currentSequence.frames.length - 1;
          this.paused = true;
          this.currentSequence.onComplete?.();
          break;
        }
      }
    }
  }

  /** Get the current sprite sheet frame index */
  get currentFrame(): number {
    if (!this.currentSequence) return 0;
    return this.currentSequence.frames[this.currentFrameIndex] ?? 0;
  }

  /** Get the current animation state name */
  get currentState(): AnimationState | null {
    return this.currentSequence?.name ?? null;
  }

  /** Whether the animation has finished (non-looping only) */
  get isFinished(): boolean {
    if (!this.currentSequence || this.currentSequence.loop) return false;
    return (
      this.currentFrameIndex >= this.currentSequence.frames.length - 1 &&
      this.paused
    );
  }

  /**
   * Draw the current animation frame at the given position.
   * @param ctx - Canvas 2D context
   * @param x - X position
   * @param y - Y position
   * @param scale - Scale factor
   * @param flipped - Whether to draw horizontally flipped
   */
  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale = 1,
    flipped = false,
  ): void {
    if (flipped) {
      this.spriteSheet.drawFrameFlipped(ctx, this.currentFrame, x, y, scale);
    } else {
      this.spriteSheet.drawFrame(ctx, this.currentFrame, x, y, scale);
    }
  }
}

/**
 * Create standard animation sequences for a character sprite sheet.
 * Assumes the sprite sheet has rows for: idle (0), walk (1), climb (2), celebrate (3)
 */
export function createCharacterAnimations(
  spriteSheet: SpriteSheet,
  framesPerRow: number,
): AnimationController {
  const controller = new AnimationController(spriteSheet);

  controller.addSequence({
    name: "idle",
    frames: Array.from({ length: Math.min(framesPerRow, 2) }, (_, i) => i),
    frameDuration: 500,
    loop: true,
  });

  controller.addSequence({
    name: "walk",
    frames: Array.from(
      { length: framesPerRow },
      (_, i) => i + framesPerRow,
    ),
    frameDuration: 150,
    loop: true,
  });

  controller.addSequence({
    name: "climb",
    frames: Array.from(
      { length: framesPerRow },
      (_, i) => i + framesPerRow * 2,
    ),
    frameDuration: 200,
    loop: true,
  });

  controller.addSequence({
    name: "celebrate",
    frames: Array.from(
      { length: framesPerRow },
      (_, i) => i + framesPerRow * 3,
    ),
    frameDuration: 120,
    loop: false,
  });

  return controller;
}
