import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { BootSequence } from "./BootSequence";

const STORAGE_KEY = "css-mountain-boot-seen";

describe("BootSequence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render the boot sequence container", () => {
    const onComplete = vi.fn();
    render(<BootSequence onComplete={onComplete} />);

    expect(screen.getByTestId("boot-sequence")).toBeInTheDocument();
  });

  it("should skip immediately for returning users", () => {
    localStorage.setItem(STORAGE_KEY, "true");
    const onComplete = vi.fn();
    render(<BootSequence onComplete={onComplete} />);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("should NOT skip for first-time users", () => {
    const onComplete = vi.fn();
    render(<BootSequence onComplete={onComplete} />);

    expect(onComplete).not.toHaveBeenCalled();
  });

  it("should be skippable by clicking", () => {
    const onComplete = vi.fn();
    render(<BootSequence onComplete={onComplete} />);

    fireEvent.click(screen.getByTestId("boot-sequence"));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("should be skippable by pressing a key", () => {
    const onComplete = vi.fn();
    render(<BootSequence onComplete={onComplete} />);

    fireEvent.keyDown(screen.getByTestId("boot-sequence"), { key: "Enter" });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("should set localStorage flag on completion", () => {
    const onComplete = vi.fn();
    render(<BootSequence onComplete={onComplete} />);

    fireEvent.click(screen.getByTestId("boot-sequence"));
    expect(localStorage.getItem(STORAGE_KEY)).toBe("true");
  });

  it("should show skip hint after delay", () => {
    const onComplete = vi.fn();
    render(<BootSequence onComplete={onComplete} />);

    // Advance past the first line delay (300ms) so visibleLines > 0,
    // then past the skip hint delay (800ms).
    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(screen.getByTestId("skip-hint")).toBeInTheDocument();
  });
});
