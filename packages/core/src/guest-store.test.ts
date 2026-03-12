import { describe, it, expect, beforeEach, vi } from "vitest";
import { createGuestProgressStore } from "./guest-store";
import type { ChallengeProgress } from "./types";

function makeProgress(
  challengeId: string,
  overrides: Partial<ChallengeProgress> = {}
): ChallengeProgress {
  return {
    challengeId,
    status: "completed",
    bestScore: 500,
    stars: 1,
    attempts: 1,
    bestSolution: ".test { color: red; }",
    hintsUsed: 0,
    solutionViewed: false,
    timeSpentMs: 30000,
    completedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("GuestProgressStore", () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    // Mock localStorage
    mockStorage = {};
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
    });
  });

  it("saves and loads a single challenge progress", () => {
    const store = createGuestProgressStore();
    const progress = makeProgress("challenge-1");

    store.save(progress);
    const loaded = store.load("challenge-1");

    expect(loaded).not.toBeNull();
    expect(loaded!.challengeId).toBe("challenge-1");
    expect(loaded!.bestScore).toBe(500);
  });

  it("returns null for unloaded challenge", () => {
    const store = createGuestProgressStore();
    expect(store.load("nonexistent")).toBeNull();
  });

  it("loads all progress entries", () => {
    const store = createGuestProgressStore();
    store.save(makeProgress("challenge-1"));
    store.save(makeProgress("challenge-2"));

    const all = store.loadAll();
    expect(Object.keys(all)).toHaveLength(2);
    expect(all["challenge-1"]).toBeDefined();
    expect(all["challenge-2"]).toBeDefined();
  });

  it("upserts keeping best score", () => {
    const store = createGuestProgressStore();

    store.save(makeProgress("challenge-1", { bestScore: 500, stars: 1 }));
    store.save(makeProgress("challenge-1", { bestScore: 800, stars: 3 }));

    const loaded = store.load("challenge-1");
    expect(loaded!.bestScore).toBe(800);
    expect(loaded!.stars).toBe(3);
  });

  it("keeps existing best score when new score is lower", () => {
    const store = createGuestProgressStore();

    store.save(makeProgress("challenge-1", { bestScore: 800, stars: 3 }));
    store.save(makeProgress("challenge-1", { bestScore: 400, stars: 1 }));

    const loaded = store.load("challenge-1");
    expect(loaded!.bestScore).toBe(800);
    expect(loaded!.stars).toBe(3);
  });

  it("increments attempts on upsert", () => {
    const store = createGuestProgressStore();

    store.save(makeProgress("challenge-1", { attempts: 1 }));
    store.save(makeProgress("challenge-1", { attempts: 1 }));

    const loaded = store.load("challenge-1");
    // First save sets attempts=1, second adds 1 more
    expect(loaded!.attempts).toBe(2);
  });

  it("accumulates time spent", () => {
    const store = createGuestProgressStore();

    store.save(makeProgress("challenge-1", { timeSpentMs: 10000 }));
    store.save(makeProgress("challenge-1", { timeSpentMs: 20000 }));

    const loaded = store.load("challenge-1");
    expect(loaded!.timeSpentMs).toBe(30000);
  });

  it("preserves solutionViewed once set", () => {
    const store = createGuestProgressStore();

    store.save(makeProgress("challenge-1", { solutionViewed: true }));
    store.save(makeProgress("challenge-1", { solutionViewed: false }));

    const loaded = store.load("challenge-1");
    expect(loaded!.solutionViewed).toBe(true);
  });

  it("preserves best solution when new score is lower", () => {
    const store = createGuestProgressStore();

    store.save(
      makeProgress("challenge-1", {
        bestScore: 800,
        bestSolution: "good solution",
      })
    );
    store.save(
      makeProgress("challenge-1", {
        bestScore: 400,
        bestSolution: "worse solution",
      })
    );

    const loaded = store.load("challenge-1");
    expect(loaded!.bestSolution).toBe("good solution");
  });

  it("updates best solution when new score is higher", () => {
    const store = createGuestProgressStore();

    store.save(
      makeProgress("challenge-1", {
        bestScore: 400,
        bestSolution: "okay solution",
      })
    );
    store.save(
      makeProgress("challenge-1", {
        bestScore: 800,
        bestSolution: "great solution",
      })
    );

    const loaded = store.load("challenge-1");
    expect(loaded!.bestSolution).toBe("great solution");
  });

  it("gets storage usage", () => {
    const store = createGuestProgressStore();
    // Stub Blob for node environment
    vi.stubGlobal(
      "Blob",
      class {
        content: string[];
        size: number;
        constructor(parts: string[]) {
          this.content = parts;
          this.size = parts.join("").length;
        }
      }
    );

    store.save(makeProgress("challenge-1"));

    const usage = store.getStorageUsage();
    expect(usage.budget).toBe(2 * 1024 * 1024);
    expect(usage.used).toBeGreaterThan(0);
    expect(usage.percentage).toBeGreaterThan(0);
    expect(usage.percentage).toBeLessThan(1);
  });

  it("showWarningIfNeeded returns false for small data", () => {
    const store = createGuestProgressStore();
    vi.stubGlobal(
      "Blob",
      class {
        content: string[];
        size: number;
        constructor(parts: string[]) {
          this.content = parts;
          this.size = parts.join("").length;
        }
      }
    );

    store.save(makeProgress("challenge-1"));
    expect(store.showWarningIfNeeded()).toBe(false);
  });

  it("getMergePayload returns all progress entries", () => {
    const store = createGuestProgressStore();
    store.save(makeProgress("challenge-1"));
    store.save(makeProgress("challenge-2"));

    const payload = store.getMergePayload();
    expect(payload.mergeStrategy).toBe("upsert-keep-best");
    expect(payload.progress).toHaveLength(2);
  });

  it("clearAfterMerge removes all guest data", () => {
    const store = createGuestProgressStore();
    store.save(makeProgress("challenge-1"));

    store.clearAfterMerge();

    expect(store.load("challenge-1")).toBeNull();
    expect(Object.keys(store.loadAll())).toHaveLength(0);
  });
});
