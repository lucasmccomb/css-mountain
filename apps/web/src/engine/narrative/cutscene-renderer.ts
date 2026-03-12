/**
 * Cutscene renderer that plays dialog sequences with transitions.
 * Manages a queue of dialog lines and transitions between them.
 */

import type { DialogLine, StoryBeat } from "./story-beats";
import { DialogBox } from "./dialog-box";
import { TransitionEffect } from "../transitions";

export type CutsceneState = "idle" | "transition-in" | "dialog" | "transition-out" | "complete";

export interface CutsceneConfig {
  /** Canvas width for dialog positioning */
  canvasWidth: number;
  /** Canvas height for dialog positioning */
  canvasHeight: number;
  /** Whether to use transitions between beats */
  useTransitions: boolean;
  /** Callback when cutscene completes */
  onComplete?: () => void;
}

const DEFAULT_CONFIG: CutsceneConfig = {
  canvasWidth: 640,
  canvasHeight: 400,
  useTransitions: true,
};

export class CutsceneRenderer {
  private config: CutsceneConfig;
  private dialogBox: DialogBox;
  private transition: TransitionEffect;
  private dialogQueue: DialogLine[] = [];
  private _state: CutsceneState = "idle";
  private waitingForInput = false;

  constructor(config: Partial<CutsceneConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.dialogBox = new DialogBox({
      x: 20,
      y: this.config.canvasHeight - 110,
      width: this.config.canvasWidth - 40,
      height: 90,
    });
    this.transition = new TransitionEffect({
      style: "text-wipe",
      direction: "in",
      duration: 600,
    });
  }

  /** Current cutscene state */
  get state(): CutsceneState {
    return this._state;
  }

  /** Whether the cutscene is waiting for player input */
  get isWaitingForInput(): boolean {
    return this.waitingForInput;
  }

  /** Play a story beat as a cutscene */
  play(beat: StoryBeat): void {
    this.dialogQueue = [...beat.dialog];
    this._state = "transition-in";

    if (this.config.useTransitions) {
      this.transition = new TransitionEffect({
        style: "text-wipe",
        direction: "in",
        duration: 600,
        onComplete: () => {
          this.showNextDialog();
        },
      });
      this.transition.start();
    } else {
      this.showNextDialog();
    }
  }

  /** Advance to the next dialog line (called on player input) */
  advance(): void {
    if (!this.waitingForInput) {
      // If typewriter is still going, skip it
      if (this._state === "dialog" && !this.dialogBox.isComplete) {
        this.dialogBox.skipTypewriter();
        return;
      }
      return;
    }

    this.waitingForInput = false;
    this.showNextDialog();
  }

  /** Update the cutscene state */
  update(deltaMs: number): void {
    switch (this._state) {
      case "transition-in":
      case "transition-out":
        this.transition.update(deltaMs);
        break;

      case "dialog":
        this.dialogBox.update(deltaMs);
        if (this.dialogBox.isComplete && !this.waitingForInput) {
          this.waitingForInput = true;
        }
        break;
    }
  }

  /** Render the cutscene */
  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Render transition overlay
    if (this._state === "transition-in" || this._state === "transition-out") {
      this.transition.render(ctx, width, height);
    }

    // Render dialog box
    if (this._state === "dialog") {
      this.dialogBox.render(ctx);
    }
  }

  /** Skip the entire cutscene */
  skip(): void {
    this.dialogQueue = [];
    this.dialogBox.hide();
    this._state = "complete";
    this.config.onComplete?.();
  }

  /** Reset the cutscene renderer */
  reset(): void {
    this.dialogQueue = [];
    this.dialogBox.hide();
    this._state = "idle";
    this.waitingForInput = false;
  }

  private showNextDialog(): void {
    if (this.dialogQueue.length === 0) {
      // All dialog shown - transition out
      if (this.config.useTransitions) {
        this._state = "transition-out";
        this.transition = new TransitionEffect({
          style: "text-wipe",
          direction: "out",
          duration: 600,
          onComplete: () => {
            this._state = "complete";
            this.config.onComplete?.();
          },
        });
        this.transition.start();
        this.dialogBox.hide();
      } else {
        this._state = "complete";
        this.dialogBox.hide();
        this.config.onComplete?.();
      }
      return;
    }

    const nextLine = this.dialogQueue.shift();
    if (nextLine) {
      this._state = "dialog";
      this.dialogBox.showLine(nextLine);
    }
  }
}
