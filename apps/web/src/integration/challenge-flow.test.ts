import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { gameStore, progressStore, calculateScore } from "@css-mountain/core";
import type { Challenge, ScoreBreakdown } from "@css-mountain/core";
import { saveAndSync, getPendingSyncCount } from "../services/sync-service";
import * as apiClient from "../services/api-client";

vi.mock("../services/api-client", () => ({
  progressApi: {
    submit: vi.fn(),
  },
}));

// Mock localStorage
const mockStorage: Record<string, string> = {};
vi.stubGlobal("localStorage", {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
});

const testChallenge: Challenge = {
  id: "test-challenge-1",
  slug: "test-challenge",
  title: "Test Challenge",
  description: "A test challenge",
  type: "match",
  difficulty: "junior",
  zone: 1,
  isBoss: false,
  html: "<h1>Hello</h1>",
  starterCss: "/* Write CSS here */",
  referenceSolutions: ["h1 { color: blue; }"],
  validationRules: [
    {
      type: "computed-style",
      selector: "h1",
      property: "color",
      expected: "rgb(0, 0, 255)",
      weight: 500,
      message: "The heading should be blue",
    },
    {
      type: "computed-style",
      selector: "h1",
      property: "font-size",
      expected: "32px",
      weight: 500,
      message: "The heading font size should be 32px",
    },
  ],
  hints: [
    { level: "nudge", text: "Try targeting the h1 element" },
    { level: "clue", text: "Use color: blue and font-size: 32px" },
    { level: "solution", text: "h1 { color: blue; font-size: 32px; }" },
  ],
  maxScore: 1000,
  metadata: {
    topics: ["color", "font-size"],
    estimatedMinutes: 2,
    difficulty: 1,
  },
};

describe("Challenge Completion Flow (Integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    progressStore.getState().reset();
    gameStore.getState().clearChallenge();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("full flow: load challenge -> validate -> save progress -> sync", async () => {
    vi.mocked(apiClient.progressApi.submit).mockResolvedValueOnce({
      success: true,
      isNewBest: true,
      challengeId: testChallenge.id,
    });

    // 1. Load challenge into game store
    gameStore.getState().loadChallenge(testChallenge);
    expect(gameStore.getState().currentChallenge).toEqual(testChallenge);
    expect(gameStore.getState().challengeStartedAt).not.toBeNull();

    // 2. Simulate time passing
    vi.advanceTimersByTime(30000); // 30 seconds

    // 3. Calculate score (simulating validation results)
    const ruleResults = testChallenge.validationRules.map((rule) => ({
      rule,
      passed: true,
      actual: rule.expected as string,
      message: "Passed",
    }));

    const scoreBreakdown: ScoreBreakdown = calculateScore({
      ruleResults,
      totalRules: testChallenge.validationRules.length,
      timeSpentMs: 30000,
      hintsUsed: 0,
      solutionViewed: false,
      cssSource: "h1 { color: blue; font-size: 32px; }",
    });

    expect(scoreBreakdown.total).toBeGreaterThan(0);
    expect(scoreBreakdown.stars).toBeGreaterThan(0);

    // 4. Record attempt in progress store
    progressStore.getState().recordAttempt(
      testChallenge.id,
      scoreBreakdown,
      "h1 { color: blue; font-size: 32px; }",
      30000,
      0,
      false,
    );

    const progress = progressStore.getState().challengeProgress[testChallenge.id];
    expect(progress).toBeDefined();
    expect(progress.status).toBe("completed");
    expect(progress.bestScore).toBe(scoreBreakdown.total);
    expect(progress.stars).toBe(scoreBreakdown.stars);

    // 5. Save and queue for API sync
    saveAndSync(
      testChallenge.id,
      progress,
      {
        score: scoreBreakdown.total,
        stars: scoreBreakdown.stars,
        timeMs: 30000,
        cssSource: "h1 { color: blue; font-size: 32px; }",
      },
    );

    // 6. Verify sync queue has an entry
    expect(getPendingSyncCount()).toBeGreaterThan(0);

    // 7. Process sync
    await vi.advanceTimersByTimeAsync(3000);

    expect(apiClient.progressApi.submit).toHaveBeenCalledWith(
      testChallenge.id,
      expect.objectContaining({
        score: scoreBreakdown.total,
        stars: scoreBreakdown.stars,
      }),
    );
  });

  it("partial score: some rules pass, some fail", () => {
    gameStore.getState().loadChallenge(testChallenge);

    const ruleResults = [
      {
        rule: testChallenge.validationRules[0],
        passed: true,
        actual: "rgb(0, 0, 255)" as string | number | null,
        message: "Passed",
      },
      {
        rule: testChallenge.validationRules[1],
        passed: false,
        actual: "16px" as string | number | null,
        message: "Font size should be 32px, got 16px",
      },
    ];

    const scoreBreakdown = calculateScore({
      ruleResults,
      totalRules: 2,
      timeSpentMs: 60000,
      hintsUsed: 1,
      solutionViewed: false,
      cssSource: "h1 { color: blue; }",
    });

    // Correctness should be half (300 of 600) since 1 of 2 rules passed
    expect(scoreBreakdown.correctness).toBe(300);
    expect(scoreBreakdown.total).toBeLessThan(1000);
  });

  it("hint penalty reduces score", () => {
    const baseScore = calculateScore({
      ruleResults: testChallenge.validationRules.map((rule) => ({
        rule,
        passed: true,
        actual: null,
        message: "Passed",
      })),
      totalRules: 2,
      timeSpentMs: 30000,
      hintsUsed: 0,
      solutionViewed: false,
      cssSource: "h1 { color: blue; font-size: 32px; }",
    });

    const hintScore = calculateScore({
      ruleResults: testChallenge.validationRules.map((rule) => ({
        rule,
        passed: true,
        actual: null,
        message: "Passed",
      })),
      totalRules: 2,
      timeSpentMs: 30000,
      hintsUsed: 2,
      solutionViewed: false,
      cssSource: "h1 { color: blue; font-size: 32px; }",
    });

    expect(hintScore.total).toBeLessThan(baseScore.total);
  });

  it("solution viewed caps total at 400", () => {
    const score = calculateScore({
      ruleResults: testChallenge.validationRules.map((rule) => ({
        rule,
        passed: true,
        actual: null,
        message: "Passed",
      })),
      totalRules: 2,
      timeSpentMs: 1000,
      hintsUsed: 3,
      solutionViewed: true,
      cssSource: "h1 { color: blue; font-size: 32px; }",
    });

    expect(score.total).toBeLessThanOrEqual(400);
    expect(score.stars).toBeLessThanOrEqual(1);
  });
});
