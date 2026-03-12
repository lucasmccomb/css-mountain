import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TutorialChallenge } from "./TutorialChallenge";

describe("TutorialChallenge", () => {
  it("should render the tutorial challenge", () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();
    render(<TutorialChallenge onComplete={onComplete} onSkip={onSkip} />);

    expect(screen.getByTestId("tutorial-challenge")).toBeInTheDocument();
  });

  it("should show the editor with starter CSS", () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();
    render(<TutorialChallenge onComplete={onComplete} onSkip={onSkip} />);

    const editor = screen.getByTestId("tutorial-editor") as HTMLTextAreaElement;
    expect(editor.value).toContain("color: #aaaaaa");
  });

  it("should show target preview", () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();
    render(<TutorialChallenge onComplete={onComplete} onSkip={onSkip} />);

    expect(screen.getByText("Target (match this):")).toBeInTheDocument();
  });

  it("should show Submit button", () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();
    render(<TutorialChallenge onComplete={onComplete} onSkip={onSkip} />);

    expect(screen.getByText("Submit")).toBeInTheDocument();
  });

  it("should not complete when wrong CSS is submitted", () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();
    render(<TutorialChallenge onComplete={onComplete} onSkip={onSkip} />);

    // Click submit without changing the CSS
    fireEvent.click(screen.getByText("Submit"));

    // Should not show success message
    expect(screen.queryByText(/Correct!/)).not.toBeInTheDocument();
  });

  it("should complete when correct CSS is entered and submitted", () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();
    render(<TutorialChallenge onComplete={onComplete} onSkip={onSkip} />);

    const editor = screen.getByTestId("tutorial-editor") as HTMLTextAreaElement;

    // Change the color to the solution value
    fireEvent.change(editor, {
      target: {
        value: `.box {
  padding: 16px;
  border: 2px solid #55ffff;
  background: #000000;
  color: #55ff55;
}`,
      },
    });

    fireEvent.click(screen.getByText("Submit"));

    // Should show success message
    expect(screen.getByText(/Correct!/)).toBeInTheDocument();
  });

  it("should call onSkip when Skip Tutorial is clicked", () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();
    render(<TutorialChallenge onComplete={onComplete} onSkip={onSkip} />);

    fireEvent.click(screen.getByText("Skip Tutorial"));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
