/**
 * Multi-layer parallax background scrolling.
 * Each layer scrolls at a different speed to create depth.
 */

export interface ParallaxLayer {
  /** Layer identifier */
  id: string;
  /** The image or canvas to scroll */
  image: HTMLImageElement | HTMLCanvasElement;
  /** Scroll speed multiplier (0 = static, 1 = full speed) */
  speed: number;
  /** Vertical offset from the bottom of the canvas */
  yOffset: number;
  /** Whether the layer repeats horizontally */
  repeat: boolean;
  /** Optional tint color applied over the layer */
  tint?: string;
  /** Optional opacity (0-1) */
  opacity?: number;
}

export class ParallaxBackground {
  private layers: ParallaxLayer[] = [];
  private scrollX = 0;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  /** Add a parallax layer */
  addLayer(layer: ParallaxLayer): void {
    this.layers.push(layer);
    // Sort by speed (slowest = furthest back)
    this.layers.sort((a, b) => a.speed - b.speed);
  }

  /** Remove a layer by id */
  removeLayer(id: string): void {
    this.layers = this.layers.filter((l) => l.id !== id);
  }

  /** Set the horizontal scroll position */
  setScrollX(x: number): void {
    this.scrollX = x;
  }

  /** Increment scroll position */
  scroll(dx: number): void {
    this.scrollX += dx;
  }

  /** Render all parallax layers */
  render(ctx: CanvasRenderingContext2D): void {
    for (const layer of this.layers) {
      this.renderLayer(ctx, layer);
    }
  }

  private renderLayer(
    ctx: CanvasRenderingContext2D,
    layer: ParallaxLayer,
  ): void {
    const prevAlpha = ctx.globalAlpha;
    if (layer.opacity !== undefined) {
      ctx.globalAlpha = layer.opacity;
    }

    const offsetX = -(this.scrollX * layer.speed);
    const imgWidth = layer.image.width;
    const imgHeight = layer.image.height;
    const y = this.canvasHeight - imgHeight - layer.yOffset;

    if (layer.repeat && imgWidth > 0) {
      // Calculate how many tiles we need to cover the screen
      const startTile = Math.floor(offsetX / imgWidth);
      const tilesNeeded = Math.ceil(this.canvasWidth / imgWidth) + 2;

      for (let i = startTile; i < startTile + tilesNeeded; i++) {
        const drawX = i * imgWidth + (offsetX % imgWidth);
        ctx.drawImage(layer.image, drawX, y);
      }
    } else {
      ctx.drawImage(layer.image, offsetX, y);
    }

    // Apply tint overlay
    if (layer.tint) {
      ctx.fillStyle = layer.tint;
      ctx.fillRect(0, y, this.canvasWidth, imgHeight);
    }

    ctx.globalAlpha = prevAlpha;
  }

  /** Update canvas dimensions (for resize) */
  resize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }
}

/**
 * Create a simple gradient background layer as a canvas.
 * Useful for sky layers in the parallax stack.
 */
export function createGradientLayer(
  width: number,
  height: number,
  topColor: string,
  bottomColor: string,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(1, bottomColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas;
}
