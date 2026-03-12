import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CRTOverlay } from "./CRTOverlay";

describe("CRTOverlay", () => {
  it("renders visible when enabled", () => {
    render(<CRTOverlay enabled={true} />);
    const overlay = screen.getByTestId("crt-overlay");
    expect(overlay).toBeInTheDocument();
    expect(overlay.className).not.toContain("hidden");
  });

  it("applies hidden class when disabled", () => {
    render(<CRTOverlay enabled={false} />);
    const overlay = screen.getByTestId("crt-overlay");
    expect(overlay.className).toContain("hidden");
  });

  it("has aria-hidden for accessibility", () => {
    render(<CRTOverlay enabled={true} />);
    const overlay = screen.getByTestId("crt-overlay");
    expect(overlay).toHaveAttribute("aria-hidden", "true");
  });

  it("applies custom className", () => {
    render(<CRTOverlay enabled={true} className="my-class" />);
    const overlay = screen.getByTestId("crt-overlay");
    expect(overlay.className).toContain("my-class");
  });
});
