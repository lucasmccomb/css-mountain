/**
 * Canvas 2D rendering loop targeting 30fps with requestAnimationFrame.
 * Manages the render pipeline for the game canvas.
 */

export interface RenderLayer {
  /** Unique layer identifier */
  id: string;
  /** Z-order for drawing (lower = drawn first / behind) */
  zIndex: number;
  /** Whether the layer needs redrawing this frame */
  dirty: boolean;
  /** Render function called each frame */
  render: (ctx: CanvasRenderingContext2D, delta: number) => void;
}

export interface RendererOptions {
  /** Canvas width in logical pixels */
  width: number;
  /** Canvas height in logical pixels */
  height: number;
  /** Target frames per second */
  targetFps: number;
  /** Enable pixelated upscaling for retro look */
  pixelated: boolean;
}

const DEFAULT_OPTIONS: RendererOptions = {
  width: 640,
  height: 400,
  targetFps: 30,
  pixelated: true,
};

export class Renderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private layers: RenderLayer[] = [];
  private animationFrameId: number | null = null;
  private lastFrameTime = 0;
  private frameInterval: number;
  private running = false;
  private options: RendererOptions;

  /** Callback invoked each frame with delta time in ms */
  onUpdate: ((delta: number) => void) | null = null;

  constructor(options: Partial<RendererOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.frameInterval = 1000 / this.options.targetFps;
  }

  /** Attach the renderer to a canvas element */
  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    if (!this.ctx) {
      throw new Error("Failed to get 2D rendering context");
    }

    canvas.width = this.options.width;
    canvas.height = this.options.height;

    if (this.options.pixelated) {
      this.ctx.imageSmoothingEnabled = false;
      canvas.style.imageRendering = "pixelated";
    }
  }

  /** Add a render layer */
  addLayer(layer: RenderLayer): void {
    this.layers.push(layer);
    this.layers.sort((a, b) => a.zIndex - b.zIndex);
  }

  /** Remove a render layer by id */
  removeLayer(id: string): void {
    this.layers = this.layers.filter((l) => l.id !== id);
  }

  /** Get a layer by id */
  getLayer(id: string): RenderLayer | undefined {
    return this.layers.find((l) => l.id === id);
  }

  /** Mark all layers as dirty (forces full redraw) */
  markAllDirty(): void {
    for (const layer of this.layers) {
      layer.dirty = true;
    }
  }

  /** Start the render loop */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastFrameTime = performance.now();
    this.tick(this.lastFrameTime);
  }

  /** Stop the render loop */
  stop(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /** Whether the renderer is currently running */
  get isRunning(): boolean {
    return this.running;
  }

  /** Render a single frame (for on-demand / static screens) */
  renderFrame(): void {
    if (!this.ctx) return;
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;
    this.drawFrame(delta);
  }

  /** Clean up the renderer */
  destroy(): void {
    this.stop();
    this.layers = [];
    this.canvas = null;
    this.ctx = null;
    this.onUpdate = null;
  }

  private tick(now: number): void {
    if (!this.running) return;

    this.animationFrameId = requestAnimationFrame((t) => this.tick(t));

    const delta = now - this.lastFrameTime;
    if (delta < this.frameInterval) return;

    this.lastFrameTime = now - (delta % this.frameInterval);
    this.drawFrame(delta);
  }

  private drawFrame(delta: number): void {
    if (!this.ctx || !this.canvas) return;

    this.onUpdate?.(delta);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const layer of this.layers) {
      if (layer.dirty) {
        layer.render(this.ctx, delta);
      }
    }
  }
}
