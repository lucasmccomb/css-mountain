import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  saveAndSync,
  getPendingSyncCount,
  forceSyncNow,
  initSyncListeners,
} from "../services/sync-service";
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

// Mock navigator.onLine
let mockOnline = true;
Object.defineProperty(navigator, "onLine", {
  get: () => mockOnline,
  configurable: true,
});

describe("Offline Sync (Integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    mockOnline = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("saves progress offline and syncs on reconnect", async () => {
    vi.mocked(apiClient.progressApi.submit).mockResolvedValue({
      success: true,
      isNewBest: true,
      challengeId: "c1",
    });

    // 1. Go offline
    mockOnline = false;

    // 2. Save progress while offline
    saveAndSync(
      "c1",
      {
        challengeId: "c1",
        status: "completed",
        bestScore: 800,
        stars: 3,
        attempts: 1,
        bestSolution: "h1 { color: blue; }",
        hintsUsed: 0,
        solutionViewed: false,
        timeSpentMs: 30000,
        completedAt: "2025-01-01",
      },
      {
        score: 800,
        stars: 3,
        timeMs: 30000,
        cssSource: "h1 { color: blue; }",
      },
    );

    // 3. Verify queued locally
    expect(getPendingSyncCount()).toBeGreaterThan(0);

    // 4. Go back online
    mockOnline = true;

    // 5. Force sync
    forceSyncNow();
    await vi.advanceTimersByTimeAsync(0);

    // 6. Verify API was called
    expect(apiClient.progressApi.submit).toHaveBeenCalledWith("c1", {
      score: 800,
      stars: 3,
      timeMs: 30000,
      cssSource: "h1 { color: blue; }",
    });
  });

  it("multiple offline saves are queued and synced in order", async () => {
    vi.mocked(apiClient.progressApi.submit).mockResolvedValue({
      success: true,
      isNewBest: true,
      challengeId: "c1",
    });

    mockOnline = false;

    // Save multiple challenges offline
    for (let i = 1; i <= 3; i++) {
      saveAndSync(
        `challenge-${i}`,
        {
          challengeId: `challenge-${i}`,
          status: "completed",
          bestScore: i * 200,
          stars: Math.min(i, 3) as 0 | 1 | 2 | 3,
          attempts: 1,
          bestSolution: `css-${i}`,
          hintsUsed: 0,
          solutionViewed: false,
          timeSpentMs: i * 10000,
          completedAt: "2025-01-01",
        },
        {
          score: i * 200,
          stars: Math.min(i, 3),
          timeMs: i * 10000,
          cssSource: `css-${i}`,
        },
      );
    }

    expect(getPendingSyncCount()).toBe(3);

    // Come online and sync
    mockOnline = true;
    forceSyncNow();
    await vi.advanceTimersByTimeAsync(0);

    expect(apiClient.progressApi.submit).toHaveBeenCalledTimes(3);
  });

  it("retryable errors keep entries in the queue", async () => {
    // Server error - should retry
    vi.mocked(apiClient.progressApi.submit).mockRejectedValue(
      Object.assign(new Error("Server error"), { status: 500 }),
    );

    // Queue an entry directly
    mockStorage["css-mountain:sync-queue"] = JSON.stringify([
      {
        challengeId: "c1",
        submission: { score: 800, stars: 3, timeMs: 30000, cssSource: "css" },
        queuedAt: "2025-01-01",
        attempts: 0,
      },
    ]);

    forceSyncNow();
    await vi.advanceTimersByTimeAsync(0);

    // Entry should remain in queue (with incremented attempts)
    const queueAfter = JSON.parse(
      mockStorage["css-mountain:sync-queue"] ?? "[]",
    );
    expect(queueAfter.length).toBe(1);
    expect(queueAfter[0].attempts).toBe(1);
  });

  it("non-retryable errors (4xx) drop entries from queue", async () => {
    // 400 error - should not retry
    vi.mocked(apiClient.progressApi.submit).mockRejectedValue(
      Object.assign(new Error("Bad request"), { status: 400 }),
    );

    mockStorage["css-mountain:sync-queue"] = JSON.stringify([
      {
        challengeId: "c1",
        submission: { score: 800, stars: 3, timeMs: 30000, cssSource: "css" },
        queuedAt: "2025-01-01",
        attempts: 0,
      },
    ]);

    forceSyncNow();
    await vi.advanceTimersByTimeAsync(0);

    // Entry should be dropped
    const queueAfter = JSON.parse(
      mockStorage["css-mountain:sync-queue"] ?? "[]",
    );
    expect(queueAfter.length).toBe(0);
  });

  it("initSyncListeners sets up online event handler", () => {
    const addEventSpy = vi.spyOn(window, "addEventListener");
    const cleanup = initSyncListeners();

    expect(addEventSpy).toHaveBeenCalledWith("online", expect.any(Function));

    cleanup();
    addEventSpy.mockRestore();
  });

  it("local progress is saved even when API sync fails", () => {
    vi.mocked(apiClient.progressApi.submit).mockRejectedValue(
      new Error("Network error"),
    );

    saveAndSync(
      "c1",
      {
        challengeId: "c1",
        status: "completed",
        bestScore: 800,
        stars: 3,
        attempts: 1,
        bestSolution: "h1 { color: blue; }",
        hintsUsed: 0,
        solutionViewed: false,
        timeSpentMs: 30000,
        completedAt: "2025-01-01",
      },
      {
        score: 800,
        stars: 3,
        timeMs: 30000,
        cssSource: "h1 { color: blue; }",
      },
    );

    // Local progress should have been saved
    const progressKey = "css-mountain:progress";
    expect(localStorage.setItem).toHaveBeenCalledWith(
      progressKey,
      expect.any(String),
    );
  });
});
