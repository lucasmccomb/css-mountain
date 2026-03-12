/**
 * Player character with walk/climb/idle states.
 * Manages character position, animation state, and rendering.
 */

import { AnimationController, type AnimationState } from "../animation";
import type { SpriteSheet } from "../sprite-sheet";

export interface CharacterPosition {
  x: number;
  y: number;
}

export interface CharacterConfig {
  /** Initial X position */
  startX: number;
  /** Initial Y position */
  startY: number;
  /** Movement speed in pixels per second */
  speed: number;
  /** Climb speed in pixels per second */
  climbSpeed: number;
  /** Scale factor for rendering */
  scale: number;
}

const DEFAULT_CONFIG: CharacterConfig = {
  startX: 100,
  startY: 300,
  speed: 80,
  climbSpeed: 50,
  scale: 2,
};

export class Character {
  private animation: AnimationController;
  private position: CharacterPosition;
  private facingLeft = false;
  private config: CharacterConfig;
  private _state: AnimationState = "idle";

  constructor(
    spriteSheet: SpriteSheet,
    config: Partial<CharacterConfig> = {},
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.position = {
      x: this.config.startX,
      y: this.config.startY,
    };
    this.animation = new AnimationController(spriteSheet);
    this.setupAnimations(spriteSheet);
    this.animation.play("idle");
  }

  /** Current character state */
  get state(): AnimationState {
    return this._state;
  }

  /** Current character position */
  get x(): number {
    return this.position.x;
  }

  get y(): number {
    return this.position.y;
  }

  /** Whether the character is facing left */
  get isFlipped(): boolean {
    return this.facingLeft;
  }

  /** Set the character's state and animation */
  setState(state: AnimationState): void {
    if (this._state === state) return;
    this._state = state;
    this.animation.play(state);
  }

  /** Move the character in a direction */
  move(dx: number, dy: number, deltaMs: number): void {
    const seconds = deltaMs / 1000;

    if (dx !== 0) {
      this.position.x += dx * this.config.speed * seconds;
      this.facingLeft = dx < 0;
      if (dy === 0) this.setState("walk");
    }

    if (dy !== 0) {
      this.position.y += dy * this.config.climbSpeed * seconds;
      this.setState("climb");
    }

    if (dx === 0 && dy === 0) {
      this.setState("idle");
    }
  }

  /** Set position directly (for cutscenes/teleporting) */
  setPosition(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
  }

  /** Trigger celebration animation */
  celebrate(): void {
    this.setState("celebrate");
  }

  /** Update animation state */
  update(deltaMs: number): void {
    this.animation.update(deltaMs);
  }

  /** Render the character */
  render(ctx: CanvasRenderingContext2D): void {
    this.animation.draw(
      ctx,
      Math.round(this.position.x),
      Math.round(this.position.y),
      this.config.scale,
      this.facingLeft,
    );
  }

  private setupAnimations(spriteSheet: SpriteSheet): void {
    const framesPerRow = spriteSheet.config.columns;

    this.animation.addSequence({
      name: "idle",
      frames: [0, 1],
      frameDuration: 500,
      loop: true,
    });

    this.animation.addSequence({
      name: "walk",
      frames: Array.from({ length: framesPerRow }, (_, i) => i + framesPerRow),
      frameDuration: 150,
      loop: true,
    });

    this.animation.addSequence({
      name: "climb",
      frames: Array.from(
        { length: framesPerRow },
        (_, i) => i + framesPerRow * 2,
      ),
      frameDuration: 200,
      loop: true,
    });

    this.animation.addSequence({
      name: "celebrate",
      frames: Array.from(
        { length: framesPerRow },
        (_, i) => i + framesPerRow * 3,
      ),
      frameDuration: 120,
      loop: false,
    });

    this.animation.addSequence({
      name: "fall",
      frames: [framesPerRow * 2],
      frameDuration: 200,
      loop: false,
    });
  }
}
