import { describe, it, expect, vi } from "vitest";
import { PerformanceMonitor } from "./performance-monitor";

describe("PerformanceMonitor", () => {
  it("should start with default state", () => {
    const monitor = new PerformanceMonitor();
    const state = monitor.state;

    expect(state.fps).toBe(30);
    expect(state.crtEnabled).toBe(true);
    expect(state.parallaxEnabled).toBe(true);
    expect(state.fullAnimations).toBe(true);
  });

  it("should track FPS from frame times", () => {
    const monitor = new PerformanceMonitor({ checkInterval: 1, sampleSize: 5 });

    // Simulate 30fps (33.3ms per frame)
    monitor.recordFrame(0);
    monitor.recordFrame(33.3);
    monitor.recordFrame(66.6);

    expect(monitor.state.fps).toBeGreaterThan(25);
    expect(monitor.state.fps).toBeLessThan(35);
  });

  it("should disable CRT when FPS drops below threshold", () => {
    const monitor = new PerformanceMonitor({
      minFps: 24,
      sampleSize: 3,
      checkInterval: 1,
    });

    // Simulate low FPS (100ms per frame = 10fps)
    monitor.recordFrame(0);
    monitor.recordFrame(100);
    monitor.recordFrame(200);
    monitor.recordFrame(300);

    expect(monitor.state.crtEnabled).toBe(false);
  });

  it("should re-enable effects when FPS recovers", () => {
    const monitor = new PerformanceMonitor({
      minFps: 24,
      sampleSize: 3,
      checkInterval: 1,
    });

    // Simulate low FPS first
    monitor.recordFrame(0);
    monitor.recordFrame(100);
    monitor.recordFrame(200);
    monitor.recordFrame(300);
    expect(monitor.state.crtEnabled).toBe(false);

    // Now simulate good FPS (33ms per frame = 30fps)
    monitor.recordFrame(333);
    monitor.recordFrame(366);
    monitor.recordFrame(399);
    monitor.recordFrame(432);

    expect(monitor.state.crtEnabled).toBe(true);
  });

  it("should call onStateChange when effects toggle", () => {
    const monitor = new PerformanceMonitor({
      minFps: 24,
      sampleSize: 3,
      checkInterval: 1,
    });

    const callback = vi.fn();
    monitor.onStateChange = callback;

    // Simulate low FPS
    monitor.recordFrame(0);
    monitor.recordFrame(100);
    monitor.recordFrame(200);
    monitor.recordFrame(300);

    expect(callback).toHaveBeenCalled();
  });

  it("should reset to default state", () => {
    const monitor = new PerformanceMonitor({
      minFps: 24,
      sampleSize: 3,
      checkInterval: 1,
    });

    // Make it degrade
    monitor.recordFrame(0);
    monitor.recordFrame(100);
    monitor.recordFrame(200);
    monitor.recordFrame(300);

    monitor.reset();

    const state = monitor.state;
    expect(state.crtEnabled).toBe(true);
    expect(state.fps).toBe(30);
  });

  it("should progressively disable more effects at very low FPS", () => {
    const monitor = new PerformanceMonitor({
      minFps: 24,
      sampleSize: 3,
      checkInterval: 1,
    });

    // Simulate very low FPS (500ms per frame = 2fps)
    monitor.recordFrame(0);
    monitor.recordFrame(500);
    monitor.recordFrame(1000);
    monitor.recordFrame(1500);

    const state = monitor.state;
    expect(state.crtEnabled).toBe(false);
    expect(state.parallaxEnabled).toBe(false);
    expect(state.fullAnimations).toBe(false);
  });
});
