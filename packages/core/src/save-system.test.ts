import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveProfile,
  loadProfile,
  saveSettings,
  loadSettings,
  saveProgress,
  loadProgress,
  hasSavedData,
  clearAllData,
  createDefaultProfile,
} from "./save-system";
import type { ChallengeProgress, PlayerSettings } from "./types";

describe("Save System", () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
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

  describe("createDefaultProfile", () => {
    it("creates a default guest profile", () => {
      const profile = createDefaultProfile();
      expect(profile.userId).toBeNull();
      expect(profile.displayName).toBe("Guest");
      expect(profile.avatarUrl).toBeNull();
      expect(profile.currentZone).toBe("junior");
      expect(profile.totalStars).toBe(0);
      expect(profile.totalScore).toBe(0);
      expect(profile.challengeProgress).toEqual({});
      expect(profile.achievements).toEqual([]);
      expect(profile.settings.crtMode).toBe(true);
    });
  });

  describe("saveProfile / loadProfile", () => {
    it("saves and loads a profile", () => {
      const profile = createDefaultProfile();
      profile.displayName = "TestUser";
      profile.totalStars = 10;

      const saved = saveProfile(profile);
      expect(saved).toBe(true);

      const loaded = loadProfile();
      expect(loaded.displayName).toBe("TestUser");
      expect(loaded.totalStars).toBe(10);
    });

    it("returns default profile when nothing is saved", () => {
      const loaded = loadProfile();
      expect(loaded.userId).toBeNull();
      expect(loaded.displayName).toBe("Guest");
    });

    it("returns default profile on corrupt data", () => {
      mockStorage["css-mountain:profile"] = "not json{{{";
      const loaded = loadProfile();
      expect(loaded.userId).toBeNull();
      expect(loaded.displayName).toBe("Guest");
    });

    it("merges with defaults for forward compatibility", () => {
      // Simulate old profile without new fields
      mockStorage["css-mountain:profile"] = JSON.stringify({
        userId: "user-1",
        displayName: "OldUser",
      });

      const loaded = loadProfile();
      expect(loaded.displayName).toBe("OldUser");
      // New fields should be filled with defaults
      expect(loaded.settings.crtMode).toBe(true);
      expect(loaded.challengeProgress).toEqual({});
    });
  });

  describe("saveSettings / loadSettings", () => {
    it("saves and loads settings", () => {
      const settings: PlayerSettings = {
        crtMode: false,
        audioEnabled: false,
        audioVolume: 0.5,
        showBootSequence: false,
        theme: "cga",
      };

      saveSettings(settings);
      const loaded = loadSettings();

      expect(loaded.crtMode).toBe(false);
      expect(loaded.theme).toBe("cga");
      expect(loaded.audioVolume).toBe(0.5);
    });

    it("returns defaults when nothing is saved", () => {
      const loaded = loadSettings();
      expect(loaded.crtMode).toBe(true);
      expect(loaded.audioEnabled).toBe(true);
      expect(loaded.theme).toBe("vga");
    });

    it("handles corrupt data gracefully", () => {
      mockStorage["css-mountain:settings"] = "corrupt!!";
      const loaded = loadSettings();
      expect(loaded.crtMode).toBe(true);
    });
  });

  describe("saveProgress / loadProgress", () => {
    it("saves and loads progress", () => {
      const progress: Record<string, ChallengeProgress> = {
        "challenge-1": {
          challengeId: "challenge-1",
          status: "completed",
          bestScore: 800,
          stars: 3,
          attempts: 2,
          bestSolution: ".test { color: red; }",
          hintsUsed: 0,
          solutionViewed: false,
          timeSpentMs: 45000,
          completedAt: "2026-03-11T00:00:00Z",
        },
      };

      saveProgress(progress);
      const loaded = loadProgress();

      expect(loaded["challenge-1"]).toBeDefined();
      expect(loaded["challenge-1"].bestScore).toBe(800);
      expect(loaded["challenge-1"].stars).toBe(3);
    });

    it("returns empty object when nothing is saved", () => {
      const loaded = loadProgress();
      expect(loaded).toEqual({});
    });
  });

  describe("hasSavedData", () => {
    it("returns false when no data exists", () => {
      expect(hasSavedData()).toBe(false);
    });

    it("returns true when profile exists", () => {
      saveProfile(createDefaultProfile());
      expect(hasSavedData()).toBe(true);
    });
  });

  describe("clearAllData", () => {
    it("removes all saved data", () => {
      saveProfile(createDefaultProfile());
      saveSettings({ crtMode: false, audioEnabled: true, audioVolume: 1, showBootSequence: true, theme: "vga" });
      saveProgress({ "c-1": { challengeId: "c-1", status: "completed", bestScore: 100, stars: 1, attempts: 1, bestSolution: null, hintsUsed: 0, solutionViewed: false, timeSpentMs: 0, completedAt: null } });

      clearAllData();

      expect(hasSavedData()).toBe(false);
      expect(Object.keys(loadProgress())).toHaveLength(0);
    });
  });

  describe("localStorage quota error handling", () => {
    it("returns false when setItem throws", () => {
      vi.stubGlobal("localStorage", {
        getItem: () => null,
        setItem: () => {
          throw new DOMException("QuotaExceededError");
        },
        removeItem: () => {},
      });

      const result = saveProfile(createDefaultProfile());
      expect(result).toBe(false);
    });
  });
});
