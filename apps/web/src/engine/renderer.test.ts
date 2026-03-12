import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Renderer } from "./renderer";

/** Create a canvas element with a mocked 2D rendering context (jsdom doesn't implement getContext) */
function createMockCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const mockCtx = {
    clearRect: vi.fn(),
    imageSmoothingEnabled: true,
  } as unknown as CanvasRenderingContext2D;

  vi.spyOn(canvas, "getContext").mockReturnValue(mockCtx);
  return canvas;
}

describe("Renderer", () => {
  let renderer: Renderer;

  beforeEach(() => {
    renderer = new Renderer({ width: 640, height: 400, targetFps: 30 });
  });

  afterEach(() => {
    renderer.destroy();
  });

  it("should initialize with default options", () => {
    expect(renderer.isRunning).toBe(false);
  });

  it("should attach to a canvas element", () => {
    const canvas = createMockCanvas();
    renderer.attach(canvas);

    expect(canvas.width).toBe(640);
    expect(canvas.height).toBe(400);
  });

  it("should set pixelated rendering on attach", () => {
    const canvas = createMockCanvas();
    renderer.attach(canvas);

    expect(canvas.style.imageRendering).toBe("pixelated");
  });

  it("should add and sort layers by zIndex", () => {
    const layer1 = {
      id: "bg",
      zIndex: 0,
      dirty: true,
      render: vi.fn(),
    };
    const layer2 = {
      id: "fg",
      zIndex: 10,
      dirty: true,
      render: vi.fn(),
    };
    const layer3 = {
      id: "mid",
      zIndex: 5,
      dirty: true,
      render: vi.fn(),
    };

    renderer.addLayer(layer1);
    renderer.addLayer(layer2);
    renderer.addLayer(layer3);

    expect(renderer.getLayer("bg")?.zIndex).toBe(0);
    expect(renderer.getLayer("mid")?.zIndex).toBe(5);
    expect(renderer.getLayer("fg")?.zIndex).toBe(10);
  });

  it("should remove layers by id", () => {
    const layer = {
      id: "test",
      zIndex: 0,
      dirty: true,
      render: vi.fn(),
    };

    renderer.addLayer(layer);
    expect(renderer.getLayer("test")).toBeDefined();

    renderer.removeLayer("test");
    expect(renderer.getLayer("test")).toBeUndefined();
  });

  it("should mark all layers dirty", () => {
    const layer1 = {
      id: "a",
      zIndex: 0,
      dirty: false,
      render: vi.fn(),
    };
    const layer2 = {
      id: "b",
      zIndex: 1,
      dirty: false,
      render: vi.fn(),
    };

    renderer.addLayer(layer1);
    renderer.addLayer(layer2);

    renderer.markAllDirty();

    expect(renderer.getLayer("a")?.dirty).toBe(true);
    expect(renderer.getLayer("b")?.dirty).toBe(true);
  });

  it("should render a single frame on demand", () => {
    const canvas = createMockCanvas();
    renderer.attach(canvas);

    const renderFn = vi.fn();
    renderer.addLayer({
      id: "test",
      zIndex: 0,
      dirty: true,
      render: renderFn,
    });

    renderer.renderFrame();

    expect(renderFn).toHaveBeenCalledOnce();
  });

  it("should not render layers that are not dirty", () => {
    const canvas = createMockCanvas();
    renderer.attach(canvas);

    const renderFn = vi.fn();
    renderer.addLayer({
      id: "test",
      zIndex: 0,
      dirty: false,
      render: renderFn,
    });

    renderer.renderFrame();

    expect(renderFn).not.toHaveBeenCalled();
  });

  it("should call onUpdate callback during renderFrame", () => {
    const canvas = createMockCanvas();
    renderer.attach(canvas);

    const updateFn = vi.fn();
    renderer.onUpdate = updateFn;

    renderer.renderFrame();

    expect(updateFn).toHaveBeenCalledOnce();
  });

  it("should clean up on destroy", () => {
    const canvas = createMockCanvas();
    renderer.attach(canvas);

    renderer.start();
    expect(renderer.isRunning).toBe(true);

    renderer.destroy();
    expect(renderer.isRunning).toBe(false);
  });
});
