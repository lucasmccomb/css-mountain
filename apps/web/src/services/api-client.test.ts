import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  authApi,
  challengeApi,
  progressApi,
  achievementApi,
  leaderboardApi,
  ApiRequestError,
} from "./api-client";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("api-client", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── authApi ─────────────────────────────────────────────────────────────

  describe("authApi.getMe", () => {
    it("returns user info when authenticated", async () => {
      const user = {
        id: "user-1",
        displayName: "Test User",
        email: "test@example.com",
        avatarUrl: null,
        settings: {},
        createdAt: "2025-01-01T00:00:00Z",
      };
      mockFetch.mockResolvedValueOnce(jsonResponse(user));

      const result = await authApi.getMe();
      expect(result).toEqual(user);
    });

    it("returns null when not authenticated (401)", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ error: "Unauthorized" }, 401),
      );

      const result = await authApi.getMe();
      expect(result).toBeNull();
    });

    it("throws on server errors", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ error: "Server error" }, 500),
      );
      // With retries it will try 4 times (initial + 3 retries)
      mockFetch.mockResolvedValue(
        jsonResponse({ error: "Server error" }, 500),
      );

      await expect(authApi.getMe()).rejects.toThrow(ApiRequestError);
    });
  });

  describe("authApi.getGoogleAuthUrl", () => {
    it("returns the correct URL", () => {
      expect(authApi.getGoogleAuthUrl()).toBe("/api/auth/google");
    });
  });

  describe("authApi.getGitHubAuthUrl", () => {
    it("returns the correct URL", () => {
      expect(authApi.getGitHubAuthUrl()).toBe("/api/auth/github");
    });
  });

  describe("authApi.logout", () => {
    it("sends POST to logout", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));

      await authApi.logout();
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/auth/logout",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  // ── challengeApi ────────────────────────────────────────────────────────

  describe("challengeApi.list", () => {
    it("returns challenge list", async () => {
      const challenges = [
        { id: "c1", title: "Test", difficulty: "junior", category: "basics", order: 1 },
      ];
      mockFetch.mockResolvedValueOnce(jsonResponse({ challenges }));

      const result = await challengeApi.list();
      expect(result).toEqual(challenges);
    });
  });

  describe("challengeApi.get", () => {
    it("returns a specific challenge", async () => {
      const challenge = { id: "c1", title: "Test" };
      mockFetch.mockResolvedValueOnce(jsonResponse({ challenge }));

      const result = await challengeApi.get("c1");
      expect(result).toEqual(challenge);
    });
  });

  // ── progressApi ─────────────────────────────────────────────────────────

  describe("progressApi.getAll", () => {
    it("returns progress entries", async () => {
      const progress = [
        {
          challengeId: "c1",
          bestScore: 800,
          stars: 3,
          attempts: 2,
          totalTimeMs: 60000,
          completedAt: "2025-01-01",
          updatedAt: "2025-01-01",
        },
      ];
      mockFetch.mockResolvedValueOnce(jsonResponse({ progress }));

      const result = await progressApi.getAll();
      expect(result).toEqual(progress);
    });
  });

  describe("progressApi.submit", () => {
    it("submits progress for a challenge", async () => {
      const response = { success: true, isNewBest: true, challengeId: "c1" };
      mockFetch.mockResolvedValueOnce(jsonResponse(response));

      const result = await progressApi.submit("c1", {
        score: 800,
        stars: 3,
        timeMs: 60000,
        cssSource: "h1 { color: red; }",
      });
      expect(result).toEqual(response);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/progress/c1",
        expect.objectContaining({
          method: "POST",
          body: expect.any(String),
        }),
      );
    });
  });

  // ── achievementApi ──────────────────────────────────────────────────────

  describe("achievementApi.getAll", () => {
    it("returns achievements", async () => {
      const data = { achievements: [], total: 10, unlocked: 0 };
      mockFetch.mockResolvedValueOnce(jsonResponse(data));

      const result = await achievementApi.getAll();
      expect(result).toEqual(data);
    });
  });

  describe("achievementApi.check", () => {
    it("returns new achievements", async () => {
      const newAchievements = [
        { key: "first-solve", name: "First Solve", description: "Solved first challenge", unlockedAt: "2025-01-01" },
      ];
      mockFetch.mockResolvedValueOnce(jsonResponse({ newAchievements }));

      const result = await achievementApi.check();
      expect(result).toEqual(newAchievements);
    });
  });

  // ── leaderboardApi ──────────────────────────────────────────────────────

  describe("leaderboardApi.get", () => {
    it("returns leaderboard entries", async () => {
      const leaderboard = [
        {
          rank: 1,
          userId: "u1",
          displayName: "Player 1",
          avatarUrl: null,
          totalScore: 9000,
          totalStars: 30,
          challengesCompleted: 10,
        },
      ];
      mockFetch.mockResolvedValueOnce(jsonResponse({ leaderboard }));

      const result = await leaderboardApi.get(10);
      expect(result).toEqual(leaderboard);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/leaderboard?limit=10",
        expect.any(Object),
      );
    });
  });

  // ── Retry logic ─────────────────────────────────────────────────────────

  describe("retry logic", () => {
    it("retries on 500 errors and eventually succeeds", async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ error: "Fail" }, 500))
        .mockResolvedValueOnce(jsonResponse({ challenges: [] }));

      const result = await challengeApi.list();
      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("retries on 429 and eventually succeeds", async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ error: "Rate limited" }, 429))
        .mockResolvedValueOnce(jsonResponse({ challenges: [] }));

      const result = await challengeApi.list();
      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("does not retry on 400 errors", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({ error: "Bad request" }, 400),
      );

      await expect(challengeApi.list()).rejects.toThrow(ApiRequestError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("retries on network errors", async () => {
      mockFetch
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockResolvedValueOnce(jsonResponse({ challenges: [] }));

      const result = await challengeApi.list();
      expect(result).toEqual([]);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
