import { describe, it, expect, beforeEach } from "vitest";
import { progressStore } from "./progress-store";
import type { ScoreBreakdown } from "../types";

function makeScore(total: number, stars: 0 | 1 | 2 | 3): ScoreBreakdown {
  return {
    correctness: Math.min(total, 600),
    codeQuality: 100,
    efficiency: 50,
    speedBonus: 50,
    total,
    stars,
  };
}

describe("progressStore", () => {
  beforeEach(() => {
    progressStore.getState().reset();
  });

  it("starts with empty progress", () => {
    const state = progressStore.getState();
    expect(state.totalStars).toBe(0);
    expect(state.totalScore).toBe(0);
    expect(Object.keys(state.challengeProgress)).toHaveLength(0);
    expect(state.currentZone).toBe("junior");
  });

  it("unlocks a challenge", () => {
    progressStore.getState().unlockChallenge("c-1");
    const progress = progressStore.getState().challengeProgress["c-1"];
    expect(progress).toBeDefined();
    expect(progress.status).toBe("unlocked");
  });

  it("does not re-lock an already progressed challenge", () => {
    const store = progressStore.getState();
    store.recordAttempt("c-1", makeScore(500, 1), "css", 30000, 0, false);
    store.unlockChallenge("c-1");

    const progress = progressStore.getState().challengeProgress["c-1"];
    // Should remain completed, not reset to unlocked
    expect(progress.status).toBe("completed");
  });

  it("records an attempt and marks completed for scores with stars", () => {
    progressStore
      .getState()
      .recordAttempt("c-1", makeScore(500, 1), ".box { color: red; }", 30000, 0, false);

    const progress = progressStore.getState().challengeProgress["c-1"];
    expect(progress.status).toBe("completed");
    expect(progress.bestScore).toBe(500);
    expect(progress.stars).toBe(1);
    expect(progress.attempts).toBe(1);
    expect(progress.bestSolution).toBe(".box { color: red; }");
  });

  it("marks as attempted for 0-star scores", () => {
    progressStore
      .getState()
      .recordAttempt("c-1", makeScore(200, 0), "css", 30000, 0, false);

    const progress = progressStore.getState().challengeProgress["c-1"];
    expect(progress.status).toBe("attempted");
    expect(progress.stars).toBe(0);
  });

  it("keeps the best score across multiple attempts", () => {
    const store = progressStore.getState();
    store.recordAttempt("c-1", makeScore(800, 3), "great css", 20000, 0, false);
    store.recordAttempt("c-1", makeScore(500, 1), "okay css", 30000, 0, false);

    const progress = progressStore.getState().challengeProgress["c-1"];
    expect(progress.bestScore).toBe(800);
    expect(progress.stars).toBe(3);
    expect(progress.bestSolution).toBe("great css");
    expect(progress.attempts).toBe(2);
  });

  it("upgrades stars when new attempt is better", () => {
    const store = progressStore.getState();
    store.recordAttempt("c-1", makeScore(500, 1), "css", 30000, 0, false);
    store.recordAttempt("c-1", makeScore(900, 3), "better", 10000, 0, false);

    const progress = progressStore.getState().challengeProgress["c-1"];
    expect(progress.stars).toBe(3);
    expect(progress.bestScore).toBe(900);
    expect(progress.bestSolution).toBe("better");
  });

  it("accumulates time spent", () => {
    const store = progressStore.getState();
    store.recordAttempt("c-1", makeScore(300, 0), "css", 10000, 0, false);
    store.recordAttempt("c-1", makeScore(400, 1), "css", 20000, 0, false);

    const progress = progressStore.getState().challengeProgress["c-1"];
    expect(progress.timeSpentMs).toBe(30000);
  });

  it("tracks hints used (max)", () => {
    const store = progressStore.getState();
    store.recordAttempt("c-1", makeScore(300, 0), "css", 10000, 1, false);
    store.recordAttempt("c-1", makeScore(400, 1), "css", 20000, 3, false);

    const progress = progressStore.getState().challengeProgress["c-1"];
    expect(progress.hintsUsed).toBe(3);
  });

  it("preserves solutionViewed once set", () => {
    const store = progressStore.getState();
    store.recordAttempt("c-1", makeScore(300, 0), "css", 10000, 0, true);
    store.recordAttempt("c-1", makeScore(400, 1), "css", 20000, 0, false);

    const progress = progressStore.getState().challengeProgress["c-1"];
    expect(progress.solutionViewed).toBe(true);
  });

  it("recalculates totals across all challenges", () => {
    const store = progressStore.getState();
    store.recordAttempt("c-1", makeScore(800, 3), "css", 10000, 0, false);
    store.recordAttempt("c-2", makeScore(600, 2), "css", 20000, 0, false);

    const state = progressStore.getState();
    expect(state.totalStars).toBe(5); // 3 + 2
    expect(state.totalScore).toBe(1400); // 800 + 600
  });

  it("sets current zone", () => {
    progressStore.getState().setCurrentZone("senior");
    expect(progressStore.getState().currentZone).toBe("senior");
  });

  it("adds achievements without duplicates", () => {
    const store = progressStore.getState();
    store.addAchievement("first-star");
    store.addAchievement("first-star");
    store.addAchievement("zone-complete");

    expect(progressStore.getState().achievements).toEqual([
      "first-star",
      "zone-complete",
    ]);
  });

  it("loads progress from external data", () => {
    progressStore.getState().loadProgress({
      "c-1": {
        challengeId: "c-1",
        status: "completed",
        bestScore: 900,
        stars: 3,
        attempts: 5,
        bestSolution: "loaded css",
        hintsUsed: 1,
        solutionViewed: false,
        timeSpentMs: 100000,
        completedAt: "2026-01-01T00:00:00Z",
      },
    });

    const state = progressStore.getState();
    expect(state.challengeProgress["c-1"].bestScore).toBe(900);
    expect(state.totalStars).toBe(3);
    expect(state.totalScore).toBe(900);
  });

  it("resets all progress", () => {
    const store = progressStore.getState();
    store.recordAttempt("c-1", makeScore(800, 3), "css", 10000, 0, false);
    store.addAchievement("test");
    store.setCurrentZone("staff");

    store.reset();

    const state = progressStore.getState();
    expect(state.totalStars).toBe(0);
    expect(state.totalScore).toBe(0);
    expect(state.currentZone).toBe("junior");
    expect(state.achievements).toEqual([]);
    expect(Object.keys(state.challengeProgress)).toHaveLength(0);
  });

  it("sets completedAt only on first completion", () => {
    const store = progressStore.getState();
    store.recordAttempt("c-1", makeScore(500, 1), "css", 10000, 0, false);
    const firstCompletedAt =
      progressStore.getState().challengeProgress["c-1"].completedAt;

    // Small delay to ensure timestamp would differ
    store.recordAttempt("c-1", makeScore(900, 3), "better", 10000, 0, false);
    const secondCompletedAt =
      progressStore.getState().challengeProgress["c-1"].completedAt;

    expect(firstCompletedAt).toBe(secondCompletedAt);
  });
});
