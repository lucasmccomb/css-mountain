import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { ScoreBreakdown } from "@css-mountain/core";
import { ScoreDisplay } from "./ScoreDisplay";

const MOCK_SCORE_3_STARS: ScoreBreakdown = {
  correctness: 600,
  codeQuality: 180,
  efficiency: 90,
  speedBonus: 80,
  total: 950,
  stars: 3,
};

const MOCK_SCORE_1_STAR: ScoreBreakdown = {
  correctness: 300,
  codeQuality: 100,
  efficiency: 50,
  speedBonus: 0,
  total: 450,
  stars: 1,
};

const MOCK_SCORE_0_STARS: ScoreBreakdown = {
  correctness: 100,
  codeQuality: 50,
  efficiency: 20,
  speedBonus: 0,
  total: 170,
  stars: 0,
};

describe("ScoreDisplay", () => {
  it("renders total score", () => {
    render(<ScoreDisplay score={MOCK_SCORE_3_STARS} />);
    expect(screen.getByText("950")).toBeInTheDocument();
    expect(screen.getByText("/1000")).toBeInTheDocument();
  });

  it("renders 3 stars for high score", () => {
    render(<ScoreDisplay score={MOCK_SCORE_3_STARS} />);
    const starRating = screen.getByTestId("star-rating");
    expect(starRating).toHaveAttribute("aria-label", "3 of 3 stars");
  });

  it("renders 1 star for medium score", () => {
    render(<ScoreDisplay score={MOCK_SCORE_1_STAR} />);
    const starRating = screen.getByTestId("star-rating");
    expect(starRating).toHaveAttribute("aria-label", "1 of 3 stars");
  });

  it("renders 0 stars for low score", () => {
    render(<ScoreDisplay score={MOCK_SCORE_0_STARS} />);
    const starRating = screen.getByTestId("star-rating");
    expect(starRating).toHaveAttribute("aria-label", "0 of 3 stars");
  });

  it("shows category breakdowns", () => {
    render(<ScoreDisplay score={MOCK_SCORE_3_STARS} />);
    expect(screen.getByText("Correctness")).toBeInTheDocument();
    expect(screen.getByText("Code Quality")).toBeInTheDocument();
    expect(screen.getByText("Efficiency")).toBeInTheDocument();
    expect(screen.getByText("Speed Bonus")).toBeInTheDocument();
  });

  it("shows category values", () => {
    render(<ScoreDisplay score={MOCK_SCORE_3_STARS} />);
    expect(screen.getByText("600/600")).toBeInTheDocument();
    expect(screen.getByText("180/200")).toBeInTheDocument();
    expect(screen.getByText("90/100")).toBeInTheDocument();
    expect(screen.getByText("80/100")).toBeInTheDocument();
  });

  it("renders progress bars for each category", () => {
    render(<ScoreDisplay score={MOCK_SCORE_3_STARS} />);
    const progressBars = screen.getAllByRole("progressbar");
    expect(progressBars.length).toBe(4);
  });
});
