import { describe, it, expect } from "vitest";
import {
  calculatePartialCredit,
  applySolutionPenalty,
  getEncouragementMessage,
  SAFETY_NET,
} from "./impossible-to-lose";
import type { RuleResult, ScoreBreakdown, ValidationRule } from "./types";

function makeRule(): ValidationRule {
  return {
    type: "computed-style",
    selector: ".test",
    property: "color",
    expected: "red",
    weight: 100,
    message: "color should be red",
  };
}

function makeRuleResult(passed: boolean): RuleResult {
  return {
    rule: makeRule(),
    passed,
    actual: passed ? "red" : "blue",
    message: passed ? "Passed" : "Failed",
  };
}

function makeScore(total: number): ScoreBreakdown {
  return {
    correctness: Math.min(total, 600),
    codeQuality: Math.min(Math.max(total - 600, 0), 200),
    efficiency: Math.min(Math.max(total - 800, 0), 100),
    speedBonus: Math.min(Math.max(total - 900, 0), 100),
    total,
    stars: total >= 800 ? 3 : total >= 600 ? 2 : total >= 400 ? 1 : 0,
  };
}

describe("SAFETY_NET", () => {
  it("has correct default values", () => {
    expect(SAFETY_NET.canSkipChallenge).toBe(true);
    expect(SAFETY_NET.solutionAlwaysAvailable).toBe(true);
    expect(SAFETY_NET.maxStarsWithSolution).toBe(1);
    expect(SAFETY_NET.partialCreditEnabled).toBe(true);
    expect(SAFETY_NET.minPartialCreditThreshold).toBe(50);
  });
});

describe("calculatePartialCredit", () => {
  it("returns 0 for empty rule results", () => {
    expect(calculatePartialCredit([])).toBe(0);
  });

  it("returns full credit when all rules pass", () => {
    const results = [makeRuleResult(true), makeRuleResult(true)];
    expect(calculatePartialCredit(results)).toBe(600);
  });

  it("returns 0 when no rules pass", () => {
    const results = [makeRuleResult(false), makeRuleResult(false)];
    expect(calculatePartialCredit(results)).toBe(0);
  });

  it("returns proportional credit for partial pass", () => {
    const results = [
      makeRuleResult(true),
      makeRuleResult(false),
      makeRuleResult(false),
    ];
    // 1/3 passed = 200
    expect(calculatePartialCredit(results)).toBe(200);
  });

  it("returns half credit for half passed", () => {
    const results = [
      makeRuleResult(true),
      makeRuleResult(false),
    ];
    expect(calculatePartialCredit(results)).toBe(300);
  });

  it("gives credit for even a single passed rule", () => {
    const results = [
      makeRuleResult(true),
      makeRuleResult(false),
      makeRuleResult(false),
      makeRuleResult(false),
      makeRuleResult(false),
    ];
    // 1/5 passed = 120
    expect(calculatePartialCredit(results)).toBe(120);
    expect(calculatePartialCredit(results)).toBeGreaterThan(0);
  });
});

describe("applySolutionPenalty", () => {
  it("caps score at 400", () => {
    const score = makeScore(900);
    const penalized = applySolutionPenalty(score);
    expect(penalized.total).toBe(400);
  });

  it("caps stars at 1", () => {
    const score = makeScore(900);
    const penalized = applySolutionPenalty(score);
    expect(penalized.stars).toBeLessThanOrEqual(1);
  });

  it("does not increase a score below 400", () => {
    const score = makeScore(200);
    const penalized = applySolutionPenalty(score);
    expect(penalized.total).toBe(200);
  });

  it("preserves original dimension scores", () => {
    const score = makeScore(900);
    const penalized = applySolutionPenalty(score);
    expect(penalized.correctness).toBe(score.correctness);
    expect(penalized.codeQuality).toBe(score.codeQuality);
    expect(penalized.efficiency).toBe(score.efficiency);
    expect(penalized.speedBonus).toBe(score.speedBonus);
  });

  it("gives 0 stars when total is below 400", () => {
    const score = makeScore(100);
    const penalized = applySolutionPenalty(score);
    expect(penalized.stars).toBe(0);
  });

  it("gives 1 star when total is exactly 400", () => {
    const score = makeScore(400);
    const penalized = applySolutionPenalty(score);
    expect(penalized.stars).toBe(1);
  });
});

describe("getEncouragementMessage", () => {
  it("returns a string for any score", () => {
    const testScores = [0, 50, 100, 300, 400, 500, 600, 700, 800, 900, 1000];
    for (const total of testScores) {
      const msg = getEncouragementMessage(makeScore(total));
      expect(typeof msg).toBe("string");
      expect(msg.length).toBeGreaterThan(0);
    }
  });

  it("returns positive messages for high scores", () => {
    const msg = getEncouragementMessage(makeScore(950));
    expect(msg).toBeTruthy();
    // Message should not contain discouraging words
    expect(msg.toLowerCase()).not.toContain("give up");
  });

  it("returns encouraging messages for low scores", () => {
    const msg = getEncouragementMessage(makeScore(50));
    expect(msg).toBeTruthy();
    // Low score messages should be encouraging
    expect(msg.length).toBeGreaterThan(10);
  });

  it("is deterministic for the same score", () => {
    const score = makeScore(750);
    const msg1 = getEncouragementMessage(score);
    const msg2 = getEncouragementMessage(score);
    expect(msg1).toBe(msg2);
  });
});
