import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { LoadingScreen } from "./LoadingScreen";

describe("LoadingScreen", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with default message", () => {
    render(<LoadingScreen />);
    expect(screen.getByTestId("loading-screen")).toBeInTheDocument();
    expect(screen.getByText("LOADING")).toBeInTheDocument();
  });

  it("renders with custom message", () => {
    render(<LoadingScreen message="SAVING PROGRESS" />);
    expect(screen.getByText("SAVING PROGRESS")).toBeInTheDocument();
  });

  it("shows blinking cursor", () => {
    render(<LoadingScreen />);
    expect(screen.getByText("_")).toBeInTheDocument();
  });

  it("animates dots over time", () => {
    vi.useFakeTimers();
    render(<LoadingScreen />);

    // Initially no dots
    const dotsEl = screen.getByText("_").previousElementSibling;
    expect(dotsEl?.textContent).toBe("");

    // After 500ms - one dot
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(dotsEl?.textContent).toBe(".");

    // After 1000ms - two dots
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(dotsEl?.textContent).toBe("..");

    // After 1500ms - three dots
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(dotsEl?.textContent).toBe("...");

    // After 2000ms - resets to empty
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(dotsEl?.textContent).toBe("");
  });
});
