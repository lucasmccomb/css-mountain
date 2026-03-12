import { describe, it, expect, beforeEach, vi } from "vitest";
import { gameStore } from "./game-state";
import type { Challenge, ValidationResult } from "../types";

function makeChallenge(id: string): Challenge {
  return {
    id,
    slug: id,
    title: `Challenge ${id}`,
    description: "A test challenge for testing",
    type: "match",
    difficulty: "junior",
    zone: 1,
    isBoss: false,
    html: "<div class='box'></div>",
    starterCss: ".box { }",
    referenceSolutions: ["solution 1", "solution 2"],
    validationRules: [],
    hints: [
      { level: "nudge", text: "Think about it" },
      { level: "clue", text: "Use color property" },
      { level: "solution", text: ".box { color: red; }" },
    ],
    maxScore: 1000,
    metadata: { topics: ["basics"], estimatedMinutes: 5, difficulty: 1 },
  };
}

describe("gameStore", () => {
  beforeEach(() => {
    // Reset to initial state
    gameStore.setState({
      currentScreen: "boot",
      currentChallenge: null,
      isLoading: false,
      error: null,
      lastResult: null,
      challengeStartedAt: null,
    });
  });

  it("starts with boot screen", () => {
    expect(gameStore.getState().currentScreen).toBe("boot");
  });

  it("sets screen", () => {
    gameStore.getState().setScreen("menu");
    expect(gameStore.getState().currentScreen).toBe("menu");
  });

  it("loads a challenge", () => {
    const challenge = makeChallenge("c-1");
    gameStore.getState().loadChallenge(challenge);

    const state = gameStore.getState();
    expect(state.currentChallenge).toBe(challenge);
    expect(state.lastResult).toBeNull();
    expect(state.error).toBeNull();
    expect(state.challengeStartedAt).not.toBeNull();
  });

  it("clears challenge state", () => {
    gameStore.getState().loadChallenge(makeChallenge("c-1"));
    gameStore.getState().clearChallenge();

    const state = gameStore.getState();
    expect(state.currentChallenge).toBeNull();
    expect(state.lastResult).toBeNull();
    expect(state.challengeStartedAt).toBeNull();
  });

  it("sets loading state", () => {
    gameStore.getState().setLoading(true);
    expect(gameStore.getState().isLoading).toBe(true);

    gameStore.getState().setLoading(false);
    expect(gameStore.getState().isLoading).toBe(false);
  });

  it("sets error", () => {
    gameStore.getState().setError("Something went wrong");
    expect(gameStore.getState().error).toBe("Something went wrong");

    gameStore.getState().setError(null);
    expect(gameStore.getState().error).toBeNull();
  });

  it("sets last result", () => {
    const result: ValidationResult = {
      passed: true,
      score: {
        correctness: 600,
        codeQuality: 200,
        efficiency: 100,
        speedBonus: 100,
        total: 1000,
        stars: 3,
      },
      ruleResults: [],
      feedback: ["All checks passed!"],
    };

    gameStore.getState().setLastResult(result);
    expect(gameStore.getState().lastResult).toBe(result);
  });

  it("starts challenge timer", () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    gameStore.getState().startChallengeTimer();
    expect(gameStore.getState().challengeStartedAt).toBe(now);

    vi.useRealTimers();
  });

  it("gets elapsed time", () => {
    vi.useFakeTimers();
    const start = Date.now();
    vi.setSystemTime(start);

    gameStore.getState().startChallengeTimer();

    vi.setSystemTime(start + 5000);
    expect(gameStore.getState().getElapsedMs()).toBe(5000);

    vi.useRealTimers();
  });

  it("returns 0 elapsed when no timer started", () => {
    expect(gameStore.getState().getElapsedMs()).toBe(0);
  });
});
