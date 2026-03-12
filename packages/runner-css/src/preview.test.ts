import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LivePreviewEngine } from "./preview";
import type { IframeSandbox } from "./iframe-sandbox";

function createMockSandbox(): { updateContent: ReturnType<typeof vi.fn> } {
  return {
    updateContent: vi.fn(),
  };
}

describe("LivePreviewEngine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces updates by default (500ms)", () => {
    const sandbox = createMockSandbox();
    const engine = new LivePreviewEngine(sandbox as unknown as IframeSandbox);

    engine.update("<div>test</div>", "div { color: red; }");
    expect(sandbox.updateContent).not.toHaveBeenCalled();

    vi.advanceTimersByTime(499);
    expect(sandbox.updateContent).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(sandbox.updateContent).toHaveBeenCalledOnce();
    expect(sandbox.updateContent).toHaveBeenCalledWith("<div>test</div>", "div { color: red; }");

    engine.destroy();
  });

  it("cancels previous debounced update when new update arrives", () => {
    const sandbox = createMockSandbox();
    const engine = new LivePreviewEngine(sandbox as unknown as IframeSandbox, 200);

    engine.update("<p>first</p>", "p { color: red; }");
    vi.advanceTimersByTime(100);
    engine.update("<p>second</p>", "p { color: blue; }");
    vi.advanceTimersByTime(200);

    expect(sandbox.updateContent).toHaveBeenCalledOnce();
    expect(sandbox.updateContent).toHaveBeenCalledWith("<p>second</p>", "p { color: blue; }");

    engine.destroy();
  });

  it("forceUpdate fires immediately", () => {
    const sandbox = createMockSandbox();
    const engine = new LivePreviewEngine(sandbox as unknown as IframeSandbox);

    engine.forceUpdate("<div>now</div>", "div { color: green; }");
    expect(sandbox.updateContent).toHaveBeenCalledOnce();
    expect(sandbox.updateContent).toHaveBeenCalledWith("<div>now</div>", "div { color: green; }");

    engine.destroy();
  });

  it("forceUpdate cancels pending debounced update", () => {
    const sandbox = createMockSandbox();
    const engine = new LivePreviewEngine(sandbox as unknown as IframeSandbox, 200);

    engine.update("<p>debounced</p>", "p { color: red; }");
    engine.forceUpdate("<p>immediate</p>", "p { color: blue; }");

    vi.advanceTimersByTime(200);

    // Should only have been called once (the forceUpdate)
    expect(sandbox.updateContent).toHaveBeenCalledOnce();
    expect(sandbox.updateContent).toHaveBeenCalledWith("<p>immediate</p>", "p { color: blue; }");

    engine.destroy();
  });

  it("accepts custom debounce delay", () => {
    const sandbox = createMockSandbox();
    const engine = new LivePreviewEngine(sandbox as unknown as IframeSandbox, 100);

    engine.update("<div>fast</div>", "div { color: red; }");
    vi.advanceTimersByTime(100);
    expect(sandbox.updateContent).toHaveBeenCalledOnce();

    engine.destroy();
  });

  it("destroy cancels pending timer", () => {
    const sandbox = createMockSandbox();
    const engine = new LivePreviewEngine(sandbox as unknown as IframeSandbox, 200);

    engine.update("<div>test</div>", "div { color: red; }");
    engine.destroy();

    vi.advanceTimersByTime(200);
    expect(sandbox.updateContent).not.toHaveBeenCalled();
  });
});
