import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { OfflineFallback } from "./OfflineFallback";

describe("OfflineFallback", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not render when online", () => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });

    render(<OfflineFallback />);
    expect(screen.queryByTestId("offline-banner")).not.toBeInTheDocument();
  });

  it("renders when offline", () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      writable: true,
      configurable: true,
    });

    render(<OfflineFallback />);
    expect(screen.getByTestId("offline-banner")).toBeInTheDocument();
    expect(screen.getByText(/OFFLINE/)).toBeInTheDocument();
  });

  it("shows when going offline", () => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });

    render(<OfflineFallback />);
    expect(screen.queryByTestId("offline-banner")).not.toBeInTheDocument();

    // Simulate going offline
    act(() => {
      Object.defineProperty(navigator, "onLine", {
        value: false,
        writable: true,
        configurable: true,
      });
      window.dispatchEvent(new Event("offline"));
    });

    expect(screen.getByTestId("offline-banner")).toBeInTheDocument();
  });

  it("hides when coming back online", () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      writable: true,
      configurable: true,
    });

    render(<OfflineFallback />);
    expect(screen.getByTestId("offline-banner")).toBeInTheDocument();

    // Simulate going online
    act(() => {
      Object.defineProperty(navigator, "onLine", {
        value: true,
        writable: true,
        configurable: true,
      });
      window.dispatchEvent(new Event("online"));
    });

    expect(screen.queryByTestId("offline-banner")).not.toBeInTheDocument();
  });

  it("has correct ARIA attributes", () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      writable: true,
      configurable: true,
    });

    render(<OfflineFallback />);
    const banner = screen.getByTestId("offline-banner");
    expect(banner).toHaveAttribute("role", "status");
    expect(banner).toHaveAttribute("aria-live", "polite");
  });
});
