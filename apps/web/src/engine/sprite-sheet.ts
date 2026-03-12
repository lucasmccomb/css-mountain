/**
 * Sprite sheet loader and frame extraction.
 * Handles loading sprite sheets and extracting individual frames
 * for character animation and tile rendering.
 */

export interface SpriteFrame {
  /** X offset in the sprite sheet */
  x: number;
  /** Y offset in the sprite sheet */
  y: number;
  /** Frame width */
  width: number;
  /** Frame height */
  height: number;
}

export interface SpriteSheetConfig {
  /** Path to the sprite sheet image */
  src: string;
  /** Width of each frame in pixels */
  frameWidth: number;
  /** Height of each frame in pixels */
  frameHeight: number;
  /** Number of columns in the sheet */
  columns: number;
  /** Number of rows in the sheet */
  rows: number;
}

export class SpriteSheet {
  private image: HTMLImageElement | null = null;
  private loaded = false;
  private frames: SpriteFrame[] = [];
  readonly config: SpriteSheetConfig;

  constructor(config: SpriteSheetConfig) {
    this.config = config;
    this.buildFrameMap();
  }

  /** Load the sprite sheet image */
  async load(): Promise<void> {
    if (this.loaded) return;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.image = img;
        this.loaded = true;
        resolve();
      };
      img.onerror = () => {
        reject(new Error(`Failed to load sprite sheet: ${this.config.src}`));
      };
      img.src = this.config.src;
    });
  }

  /** Whether the sprite sheet has been loaded */
  get isLoaded(): boolean {
    return this.loaded;
  }

  /** Total number of frames */
  get frameCount(): number {
    return this.frames.length;
  }

  /** Get frame data by index */
  getFrame(index: number): SpriteFrame | null {
    if (index < 0 || index >= this.frames.length) return null;
    return this.frames[index];
  }

  /**
   * Draw a specific frame to the canvas context.
   * @param ctx - Canvas 2D rendering context
   * @param frameIndex - Index of the frame to draw
   * @param x - Destination X position
   * @param y - Destination Y position
   * @param scale - Optional scale factor (default 1)
   */
  drawFrame(
    ctx: CanvasRenderingContext2D,
    frameIndex: number,
    x: number,
    y: number,
    scale = 1,
  ): void {
    if (!this.image || !this.loaded) return;

    const frame = this.getFrame(frameIndex);
    if (!frame) return;

    ctx.drawImage(
      this.image,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      x,
      y,
      frame.width * scale,
      frame.height * scale,
    );
  }

  /**
   * Draw a frame with horizontal flip (for facing left).
   */
  drawFrameFlipped(
    ctx: CanvasRenderingContext2D,
    frameIndex: number,
    x: number,
    y: number,
    scale = 1,
  ): void {
    if (!this.image || !this.loaded) return;

    const frame = this.getFrame(frameIndex);
    if (!frame) return;

    ctx.save();
    ctx.translate(x + frame.width * scale, y);
    ctx.scale(-1, 1);
    ctx.drawImage(
      this.image,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      0,
      0,
      frame.width * scale,
      frame.height * scale,
    );
    ctx.restore();
  }

  private buildFrameMap(): void {
    const { frameWidth, frameHeight, columns, rows } = this.config;
    this.frames = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        this.frames.push({
          x: col * frameWidth,
          y: row * frameHeight,
          width: frameWidth,
          height: frameHeight,
        });
      }
    }
  }
}

/**
 * Create a placeholder sprite sheet canvas (colored rectangles).
 * Used for development when no sprite art is available.
 */
export function createPlaceholderSpriteSheet(
  frameWidth: number,
  frameHeight: number,
  columns: number,
  rows: number,
  colors: string[],
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = frameWidth * columns;
  canvas.height = frameHeight * rows;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  let colorIndex = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      ctx.fillStyle = colors[colorIndex % colors.length];
      ctx.fillRect(
        col * frameWidth,
        row * frameHeight,
        frameWidth,
        frameHeight,
      );

      // Draw a small label
      ctx.fillStyle = "#fff";
      ctx.font = `${Math.floor(frameWidth / 4)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `${colorIndex}`,
        col * frameWidth + frameWidth / 2,
        row * frameHeight + frameHeight / 2,
      );

      colorIndex++;
    }
  }

  return canvas;
}
