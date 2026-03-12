/**
 * DOS-style dialog box renderer.
 * Renders character portrait + text with typewriter effect.
 */

import type { DialogLine } from "./story-beats";

export interface DialogBoxConfig {
  /** X position of the dialog box */
  x: number;
  /** Y position of the dialog box */
  y: number;
  /** Width of the dialog box */
  width: number;
  /** Height of the dialog box */
  height: number;
  /** Characters per second for typewriter effect */
  typeSpeed: number;
  /** Font size in pixels */
  fontSize: number;
  /** Text color */
  textColor: string;
  /** Background color */
  bgColor: string;
  /** Border color */
  borderColor: string;
  /** Speaker name color */
  speakerColor: string;
}

const DEFAULT_CONFIG: DialogBoxConfig = {
  x: 20,
  y: 300,
  width: 600,
  height: 90,
  typeSpeed: 40,
  fontSize: 12,
  textColor: "#33ff33",
  bgColor: "#0a0a1a",
  borderColor: "#333366",
  speakerColor: "#ff6600",
};

/** Color mappings for each speaker type */
const SPEAKER_COLORS: Record<string, string> = {
  narrator: "#888899",
  player: "#33ff33",
  villain: "#ff3333",
  guide: "#3399ff",
};

export class DialogBox {
  private config: DialogBoxConfig;
  private currentLine: DialogLine | null = null;
  private displayedChars = 0;
  private elapsedMs = 0;
  private complete = false;
  private visible = false;

  constructor(config: Partial<DialogBoxConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Show a dialog line with typewriter effect */
  showLine(line: DialogLine): void {
    this.currentLine = line;
    this.displayedChars = 0;
    this.elapsedMs = 0;
    this.complete = false;
    this.visible = true;
  }

  /** Skip the typewriter effect and show full text */
  skipTypewriter(): void {
    if (!this.currentLine) return;
    this.displayedChars = this.currentLine.text.length;
    this.complete = true;
  }

  /** Hide the dialog box */
  hide(): void {
    this.visible = false;
    this.currentLine = null;
  }

  /** Update the typewriter effect */
  update(deltaMs: number): void {
    if (!this.visible || !this.currentLine || this.complete) return;

    this.elapsedMs += deltaMs;
    const targetChars = Math.floor(
      (this.elapsedMs / 1000) * this.config.typeSpeed,
    );
    this.displayedChars = Math.min(targetChars, this.currentLine.text.length);

    if (this.displayedChars >= this.currentLine.text.length) {
      this.complete = true;
    }
  }

  /** Whether the current line has finished typing */
  get isComplete(): boolean {
    return this.complete;
  }

  /** Whether the dialog box is visible */
  get isVisible(): boolean {
    return this.visible;
  }

  /** Render the dialog box */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || !this.currentLine) return;

    const { x, y, width, height, fontSize, bgColor, borderColor } =
      this.config;

    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, width, height);

    // Draw border (DOS-style double border)
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
    ctx.strokeRect(x + 4, y + 4, width - 8, height - 8);

    // Draw speaker name
    const speakerName = this.getSpeakerDisplayName(this.currentLine.speaker);
    const speakerColor =
      SPEAKER_COLORS[this.currentLine.speaker] ?? this.config.speakerColor;

    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillStyle = speakerColor;
    ctx.textBaseline = "top";

    const textX = x + 12;
    let textY = y + 10;

    if (speakerName) {
      ctx.fillText(`[${speakerName}]`, textX, textY);
      textY += fontSize + 6;
    }

    // Draw text with typewriter effect
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = this.config.textColor;

    const displayText = this.currentLine.text.slice(0, this.displayedChars);
    const maxCharsPerLine = Math.floor((width - 24) / (fontSize * 0.6));
    const lines = this.wrapText(displayText, maxCharsPerLine);

    for (const line of lines) {
      if (textY + fontSize > y + height - 8) break;
      ctx.fillText(line, textX, textY);
      textY += fontSize + 2;
    }

    // Draw blinking cursor if still typing
    if (!this.complete) {
      const cursorX = textX + (lines[lines.length - 1]?.length ?? 0) * fontSize * 0.6;
      const cursorY = textY - fontSize - 2;
      if (Math.floor(this.elapsedMs / 300) % 2 === 0) {
        ctx.fillStyle = this.config.textColor;
        ctx.fillRect(cursorX, cursorY, fontSize * 0.6, fontSize);
      }
    }

    // Draw "press any key" indicator when complete
    if (this.complete) {
      ctx.font = `${fontSize - 2}px monospace`;
      ctx.fillStyle = borderColor;
      const promptText = ">>> PRESS ENTER <<<";
      const promptWidth = ctx.measureText(promptText).width;
      if (Math.floor(this.elapsedMs / 500) % 2 === 0) {
        ctx.fillText(promptText, x + width - promptWidth - 12, y + height - 14);
      }
    }
  }

  private getSpeakerDisplayName(speaker: string): string {
    switch (speaker) {
      case "narrator":
        return "";
      case "player":
        return "YOU";
      case "villain":
        return "MASTER OF MISCHIEF";
      case "guide":
        return "PROF. CASCADE";
      default:
        return speaker.toUpperCase();
    }
  }

  private wrapText(text: string, maxChars: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      if (currentLine.length + word.length + 1 > maxChars) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = currentLine ? `${currentLine} ${word}` : word;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines;
  }
}
