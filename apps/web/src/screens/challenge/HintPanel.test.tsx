import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import type { HintTier } from "@css-mountain/core";
import { HintPanel } from "./HintPanel";

const MOCK_HINTS: [HintTier, HintTier, HintTier] = [
  { level: "nudge", text: "Think about flexbox..." },
  { level: "clue", text: "Use display: flex with centering properties" },
  {
    level: "solution",
    text: "Here is the solution:",
    code: ".container {\n  display: flex;\n}",
  },
];

describe("HintPanel", () => {
  it("renders with 0 hints revealed", () => {
    render(
      <HintPanel
        hints={MOCK_HINTS}
        hintsRevealed={0}
        onRevealHint={vi.fn()}
      />,
    );
    expect(screen.getByText("HINTS (0/3)")).toBeInTheDocument();
    expect(screen.getByText("Reveal Hint 1")).toBeInTheDocument();
  });

  it("shows first hint when 1 is revealed", () => {
    render(
      <HintPanel
        hints={MOCK_HINTS}
        hintsRevealed={1}
        onRevealHint={vi.fn()}
      />,
    );
    expect(screen.getByText("HINTS (1/3)")).toBeInTheDocument();
    expect(screen.getByText("Think about flexbox...")).toBeInTheDocument();
    expect(screen.getByText("Reveal Hint 2")).toBeInTheDocument();
  });

  it("shows second hint when 2 are revealed", () => {
    render(
      <HintPanel
        hints={MOCK_HINTS}
        hintsRevealed={2}
        onRevealHint={vi.fn()}
      />,
    );
    expect(screen.getByText("HINTS (2/3)")).toBeInTheDocument();
    expect(screen.getByText("Think about flexbox...")).toBeInTheDocument();
    expect(screen.getByText("Use display: flex with centering properties")).toBeInTheDocument();
    expect(screen.getByText("Reveal Hint 3")).toBeInTheDocument();
  });

  it("shows all hints including code when 3 are revealed", () => {
    render(
      <HintPanel
        hints={MOCK_HINTS}
        hintsRevealed={3}
        onRevealHint={vi.fn()}
      />,
    );
    expect(screen.getByText("HINTS (3/3)")).toBeInTheDocument();
    expect(screen.getByText("Here is the solution:")).toBeInTheDocument();
    // The code snippet is inside a <pre><code> element
    const codeElements = document.querySelectorAll("pre.hintCode code");
    expect(codeElements.length).toBe(1);
    expect(codeElements[0].textContent).toContain("display: flex");
    // No more reveal button
    expect(screen.queryByText(/Reveal Hint/)).not.toBeInTheDocument();
  });

  it("calls onRevealHint when reveal button is clicked", async () => {
    const user = userEvent.setup();
    const onRevealHint = vi.fn();

    render(
      <HintPanel
        hints={MOCK_HINTS}
        hintsRevealed={0}
        onRevealHint={onRevealHint}
      />,
    );

    await user.click(screen.getByText("Reveal Hint 1"));
    expect(onRevealHint).toHaveBeenCalledTimes(1);
  });

  it("shows score penalty when hints are revealed", () => {
    render(
      <HintPanel
        hints={MOCK_HINTS}
        hintsRevealed={2}
        onRevealHint={vi.fn()}
      />,
    );
    expect(screen.getByText("-10% score")).toBeInTheDocument();
  });

  it("shows solution warning for third hint", () => {
    render(
      <HintPanel
        hints={MOCK_HINTS}
        hintsRevealed={2}
        onRevealHint={vi.fn()}
      />,
    );
    expect(screen.getByText("WARNING: Shows solution")).toBeInTheDocument();
  });

  it("shows locked indicator for unrevealed hints", () => {
    render(
      <HintPanel
        hints={MOCK_HINTS}
        hintsRevealed={1}
        onRevealHint={vi.fn()}
      />,
    );
    // The first hint should be visible, others locked with block chars
    const lockedHints = screen.getAllByText("\u2591".repeat(20));
    expect(lockedHints.length).toBe(2);
  });
});
