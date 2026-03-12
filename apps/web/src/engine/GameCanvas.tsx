/**
 * React component wrapping a 640x400 canvas with pixelated upscaling.
 * Manages the game renderer lifecycle and CRT overlay.
 */

import { useEffect, useRef, useCallback } from "react";
import { Renderer } from "./renderer";
import { PerformanceMonitor } from "./performance-monitor";

export interface GameCanvasProps {
  /** Canvas width in logical pixels */
  width?: number;
  /** Canvas height in logical pixels */
  height?: number;
  /** Whether the CRT scanline effect is enabled */
  crtEnabled?: boolean;
  /** Whether the renderer should auto-start */
  autoStart?: boolean;
  /** Callback providing the renderer instance for external control */
  onRendererReady?: (renderer: Renderer) => void;
  /** Callback for performance state updates */
  onPerformanceUpdate?: (fps: number, effectsEnabled: boolean) => void;
}

const CRT_OVERLAY_STYLE: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  pointerEvents: "none",
  background:
    "repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.15) 0px, rgba(0, 0, 0, 0.15) 1px, transparent 1px, transparent 3px)",
  mixBlendMode: "multiply",
  zIndex: 1,
};

export function GameCanvas({
  width = 640,
  height = 400,
  crtEnabled = true,
  autoStart = true,
  onRendererReady,
  onPerformanceUpdate,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const perfMonRef = useRef<PerformanceMonitor | null>(null);
  const crtActiveRef = useRef(crtEnabled);

  // Keep CRT ref in sync
  crtActiveRef.current = crtEnabled;

  const initRenderer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new Renderer({
      width,
      height,
      targetFps: 30,
      pixelated: true,
    });

    renderer.attach(canvas);

    // Set up performance monitoring
    const perfMon = new PerformanceMonitor({ minFps: 24 });
    perfMon.onStateChange = (state) => {
      onPerformanceUpdate?.(state.averageFps, state.crtEnabled);
    };

    renderer.onUpdate = () => {
      perfMon.recordFrame(performance.now());
    };

    rendererRef.current = renderer;
    perfMonRef.current = perfMon;

    onRendererReady?.(renderer);

    if (autoStart) {
      renderer.start();
    }
  }, [width, height, autoStart, onRendererReady, onPerformanceUpdate]);

  useEffect(() => {
    initRenderer();

    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
      perfMonRef.current = null;
    };
  }, [initRenderer]);

  // Scale factor for CSS sizing (pixelated upscaling)
  const scaleFactor = 2;

  return (
    <div
      style={{
        position: "relative",
        width: width * scaleFactor,
        height: height * scaleFactor,
        overflow: "hidden",
        backgroundColor: "#0a0a1a",
        borderRadius: 4,
        border: "2px solid #333366",
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: width * scaleFactor,
          height: height * scaleFactor,
          imageRendering: "pixelated",
          display: "block",
        }}
      />
      {crtEnabled && crtActiveRef.current && (
        <div style={CRT_OVERLAY_STYLE} aria-hidden="true" />
      )}
    </div>
  );
}
