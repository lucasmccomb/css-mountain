import { describe, it, expect } from "vitest";
import { calculateScore, calculateStars } from "./scoring";
import type { RuleResult, ValidationRule } from "./types";

function makeRule(overrides: Partial<ValidationRule> = {}): ValidationRule {
  return {
    type: "computed-style",
    selector: ".test",
    property: "color",
    expected: "red",
    weight: 100,
    message: "color should be red",
    ...overrides,
  };
}

function makeRuleResult(
  passed: boolean,
  rule?: Partial<ValidationRule>
): RuleResult {
  return {
    rule: makeRule(rule),
    passed,
    actual: passed ? "red" : "blue",
    message: passed ? "Passed" : "Failed",
  };
}

describe("calculateStars", () => {
  it("returns 0 stars for scores below 400", () => {
    expect(calculateStars(0)).toBe(0);
    expect(calculateStars(100)).toBe(0);
    expect(calculateStars(399)).toBe(0);
  });

  it("returns 1 star for scores 400-599", () => {
    expect(calculateStars(400)).toBe(1);
    expect(calculateStars(500)).toBe(1);
    expect(calculateStars(599)).toBe(1);
  });

  it("returns 2 stars for scores 600-799", () => {
    expect(calculateStars(600)).toBe(2);
    expect(calculateStars(700)).toBe(2);
    expect(calculateStars(799)).toBe(2);
  });

  it("returns 3 stars for scores 800+", () => {
    expect(calculateStars(800)).toBe(3);
    expect(calculateStars(900)).toBe(3);
    expect(calculateStars(1000)).toBe(3);
  });
});

describe("calculateScore", () => {
  it("returns perfect score for all rules passed with good CSS and fast time", () => {
    const ruleResults = [makeRuleResult(true), makeRuleResult(true)];
    const score = calculateScore({
      ruleResults,
      totalRules: 2,
      timeSpentMs: 0,
      hintsUsed: 0,
      solutionViewed: false,
      cssSource: ".test { color: red; display: flex; }",
    });

    expect(score.correctness).toBe(600);
    expect(score.codeQuality).toBe(200);
    expect(score.efficiency).toBe(100);
    expect(score.speedBonus).toBe(100);
    expect(score.total).toBe(1000);
    expect(score.stars).toBe(3);
  });

  it("returns 0 correctness when no rules pass", () => {
    const ruleResults = [makeRuleResult(false), makeRuleResult(false)];
    const score = calculateScore({
      ruleResults,
      totalRules: 2,
      timeSpentMs: 60000,
      hintsUsed: 0,
      solutionViewed: false,
      cssSource: ".test { color: blue; }",
    });

    expect(score.correctness).toBe(0);
  });

  it("gives partial correctness for some rules passing", () => {
    const ruleResults = [makeRuleResult(true), makeRuleResult(false)];
    const score = calculateScore({
      ruleResults,
      totalRules: 2,
      timeSpentMs: 60000,
      hintsUsed: 0,
      solutionViewed: false,
      cssSource: ".test { color: red; }",
    });

    expect(score.correctness).toBe(300); // 600 * 0.5
  });

  it("handles 0 total rules gracefully", () => {
    const score = calculateScore({
      ruleResults: [],
      totalRules: 0,
      timeSpentMs: 0,
      hintsUsed: 0,
      solutionViewed: false,
      cssSource: "",
    });

    expect(score.correctness).toBe(0);
    expect(score.codeQuality).toBe(0);
    expect(score.efficiency).toBe(0);
    // Speed bonus is still 100 at t=0 (time-based, not rule-based)
    expect(score.speedBonus).toBe(100);
    expect(score.total).toBe(100);
    expect(score.stars).toBe(0); // 100 < 400, so 0 stars
  });

  it("applies hint penalties (5% per hint)", () => {
    const ruleResults = [makeRuleResult(true), makeRuleResult(true)];
    const scoreNoHints = calculateScore({
      ruleResults,
      totalRules: 2,
      timeSpentMs: 30000,
      hintsUsed: 0,
      solutionViewed: false,
      cssSource: ".test { color: red; display: flex; }",
    });

    const scoreOneHint = calculateScore({
      ruleResults,
      totalRules: 2,
      timeSpentMs: 30000,
      hintsUsed: 1,
      solutionViewed: false,
      cssSource: ".test { color: red; display: flex; }",
    });

    expect(scoreOneHint.total).toBeLessThan(scoreNoHints.total);
  });

  it("applies 3 hint penalties cumulatively", () => {
    const ruleResults = [makeRuleResult(true), makeRuleResult(true)];
    const scoreThreeHints = calculateScore({
      ruleResults,
      totalRules: 2,
      timeSpentMs: 30000,
      hintsUsed: 3,
      solutionViewed: false,
      cssSource: ".test { color: red; display: flex; }",
    });

    const scoreNoHints = calculateScore({
      ruleResults,
      totalRules: 2,
      timeSpentMs: 30000,
      hintsUsed: 0,
      solutionViewed: false,
      cssSource: ".test { color: red; display: flex; }",
    });

    // 3 hints at 5% each = 15% penalty
    expect(scoreThreeHints.total).toBeLessThan(scoreNoHints.total);
    const expectedPenalty = Math.round(scoreNoHints.total * 0.15);
    expect(scoreThreeHints.total).toBe(scoreNoHints.total - expectedPenalty);
  });

  it("caps score at 400 when solution is viewed", () => {
    const ruleResults = [makeRuleResult(true), makeRuleResult(true)];
    const score = calculateScore({
      ruleResults,
      totalRules: 2,
      timeSpentMs: 0,
      hintsUsed: 0,
      solutionViewed: true,
      cssSource: ".test { color: red; display: flex; }",
    });

    expect(score.total).toBeLessThanOrEqual(400);
    expect(score.stars).toBeLessThanOrEqual(1);
  });

  it("solution viewed gives max 1 star", () => {
    const ruleResults = [makeRuleResult(true), makeRuleResult(true)];
    const score = calculateScore({
      ruleResults,
      totalRules: 2,
      timeSpentMs: 0,
      hintsUsed: 0,
      solutionViewed: true,
      cssSource: ".test { color: red; display: flex; }",
    });

    expect(score.stars).toBe(1);
  });

  it("speed bonus decays over 10 minutes", () => {
    const ruleResults = [makeRuleResult(true)];
    const fastScore = calculateScore({
      ruleResults,
      totalRules: 1,
      timeSpentMs: 0,
      hintsUsed: 0,
      solutionViewed: false,
      cssSource: ".test { color: red; }",
    });

    const slowScore = calculateScore({
      ruleResults,
      totalRules: 1,
      timeSpentMs: 600000, // 10 minutes
      hintsUsed: 0,
      solutionViewed: false,
      cssSource: ".test { color: red; }",
    });

    expect(fastScore.speedBonus).toBe(100);
    expect(slowScore.speedBonus).toBe(0);
  });

  it("speed bonus is 0 after 10 minutes", () => {
    const ruleResults = [makeRuleResult(true)];
    const score = calculateScore({
      ruleResults,
      totalRules: 1,
      timeSpentMs: 700000, // Over 10 minutes
      hintsUsed: 0,
      solutionViewed: false,
      cssSource: ".test { color: red; }",
    });

    expect(score.speedBonus).toBe(0);
  });

  it("penalizes !important usage in code quality", () => {
    const ruleResults = [makeRuleResult(true)];
    const cleanScore = calculateScore({
      ruleResults,
      totalRules: 1,
      timeSpentMs: 60000,
      hintsUsed: 0,
      solutionViewed: false,
      cssSource: ".test { color: red; }",
    });

    const importantScore = calculateScore({
      ruleResults,
      totalRules: 1,
      timeSpentMs: 60000,
      hintsUsed: 0,
      solutionViewed: false,
      cssSource: ".test { color: red !important; }",
    });

    expect(importantScore.codeQuality).toBeLessThan(cleanScore.codeQuality);
  });

  it("penalizes empty CSS", () => {
    const score = calculateScore({
      ruleResults: [makeRuleResult(false)],
      totalRules: 1,
      timeSpentMs: 0,
      hintsUsed: 0,
      solutionViewed: false,
      cssSource: "",
    });

    expect(score.codeQuality).toBe(0);
    expect(score.efficiency).toBe(0);
  });

  it("total score never exceeds 1000", () => {
    const ruleResults = [makeRuleResult(true), makeRuleResult(true)];
    const score = calculateScore({
      ruleResults,
      totalRules: 2,
      timeSpentMs: 0,
      hintsUsed: 0,
      solutionViewed: false,
      cssSource: ".test { color: red; display: flex; }",
    });

    expect(score.total).toBeLessThanOrEqual(1000);
  });

  it("total score never goes below 0", () => {
    const score = calculateScore({
      ruleResults: [],
      totalRules: 0,
      timeSpentMs: 999999,
      hintsUsed: 3,
      solutionViewed: false,
      cssSource: "",
    });

    expect(score.total).toBeGreaterThanOrEqual(0);
  });
});
