import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  saveAndSync,
  mergeGuestProgress,
  getPendingSyncCount,
  forceSyncNow,
} from "./sync-service";
import * as apiClient from "./api-client";

vi.mock("./api-client", () => ({
  progressApi: {
    submit: vi.fn(),
  },
}));

// Mock localStorage
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
};
vi.stubGlobal("localStorage", localStorageMock);

// Mock navigator.onLine
let mockOnline = true;
Object.defineProperty(navigator, "onLine", {
  get: () => mockOnline,
  configurable: true,
});

describe("sync-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    mockOnline = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("saveAndSync", () => {
    it("saves progress to localStorage", () => {
      saveAndSync(
        "c1",
        {
          challengeId: "c1",
          status: "completed",
          bestScore: 800,
          stars: 3,
          attempts: 1,
          bestSolution: "h1 { color: red; }",
          hintsUsed: 0,
          solutionViewed: false,
          timeSpentMs: 30000,
          completedAt: "2025-01-01",
        },
        {
          score: 800,
          stars: 3,
          timeMs: 30000,
          cssSource: "h1 { color: red; }",
        },
      );

      // Should have saved to progress localStorage
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it("adds entry to the sync queue", () => {
      saveAndSync(
        "c1",
        {
          challengeId: "c1",
          status: "completed",
          bestScore: 800,
          stars: 3,
          attempts: 1,
          bestSolution: "h1 { color: red; }",
          hintsUsed: 0,
          solutionViewed: false,
          timeSpentMs: 30000,
          completedAt: "2025-01-01",
        },
        {
          score: 800,
          stars: 3,
          timeMs: 30000,
          cssSource: "h1 { color: red; }",
        },
      );

      expect(getPendingSyncCount()).toBeGreaterThan(0);
    });

    it("attempts sync after debounce when online", async () => {
      vi.mocked(apiClient.progressApi.submit).mockResolvedValueOnce({
        success: true,
        isNewBest: true,
        challengeId: "c1",
      });

      saveAndSync(
        "c1",
        {
          challengeId: "c1",
          status: "completed",
          bestScore: 800,
          stars: 3,
          attempts: 1,
          bestSolution: "h1 { color: red; }",
          hintsUsed: 0,
          solutionViewed: false,
          timeSpentMs: 30000,
          completedAt: "2025-01-01",
        },
        {
          score: 800,
          stars: 3,
          timeMs: 30000,
          cssSource: "h1 { color: red; }",
        },
      );

      // Advance past debounce timer
      await vi.advanceTimersByTimeAsync(3000);

      expect(apiClient.progressApi.submit).toHaveBeenCalledWith("c1", {
        score: 800,
        stars: 3,
        timeMs: 30000,
        cssSource: "h1 { color: red; }",
      });
    });
  });

  describe("mergeGuestProgress", () => {
    it("submits each guest progress entry to the API", async () => {
      vi.mocked(apiClient.progressApi.submit).mockResolvedValue({
        success: true,
        isNewBest: true,
        challengeId: "c1",
      });

      await mergeGuestProgress({
        c1: {
          challengeId: "c1",
          status: "completed",
          bestScore: 800,
          stars: 3,
          attempts: 2,
          bestSolution: "h1 { color: red; }",
          hintsUsed: 1,
          solutionViewed: false,
          timeSpentMs: 60000,
          completedAt: "2025-01-01",
        },
        c2: {
          challengeId: "c2",
          status: "completed",
          bestScore: 600,
          stars: 2,
          attempts: 1,
          bestSolution: ".box { display: flex; }",
          hintsUsed: 0,
          solutionViewed: false,
          timeSpentMs: 45000,
          completedAt: "2025-01-02",
        },
      });

      expect(apiClient.progressApi.submit).toHaveBeenCalledTimes(2);
    });

    it("skips entries with zero score", async () => {
      await mergeGuestProgress({
        c1: {
          challengeId: "c1",
          status: "locked",
          bestScore: 0,
          stars: 0,
          attempts: 0,
          bestSolution: null,
          hintsUsed: 0,
          solutionViewed: false,
          timeSpentMs: 0,
          completedAt: null,
        },
      });

      expect(apiClient.progressApi.submit).not.toHaveBeenCalled();
    });

    it("continues if one entry fails", async () => {
      vi.mocked(apiClient.progressApi.submit)
        .mockRejectedValueOnce(new Error("Fail"))
        .mockResolvedValueOnce({
          success: true,
          isNewBest: true,
          challengeId: "c2",
        });

      await mergeGuestProgress({
        c1: {
          challengeId: "c1",
          status: "completed",
          bestScore: 800,
          stars: 3,
          attempts: 1,
          bestSolution: "css",
          hintsUsed: 0,
          solutionViewed: false,
          timeSpentMs: 30000,
          completedAt: "2025-01-01",
        },
        c2: {
          challengeId: "c2",
          status: "completed",
          bestScore: 600,
          stars: 2,
          attempts: 1,
          bestSolution: "css",
          hintsUsed: 0,
          solutionViewed: false,
          timeSpentMs: 30000,
          completedAt: "2025-01-02",
        },
      });

      expect(apiClient.progressApi.submit).toHaveBeenCalledTimes(2);
    });
  });

  describe("forceSyncNow", () => {
    it("processes queued entries immediately", async () => {
      vi.mocked(apiClient.progressApi.submit).mockResolvedValue({
        success: true,
        isNewBest: true,
        challengeId: "c1",
      });

      // Queue an entry by writing directly to localStorage
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

      expect(apiClient.progressApi.submit).toHaveBeenCalled();
    });
  });
});
