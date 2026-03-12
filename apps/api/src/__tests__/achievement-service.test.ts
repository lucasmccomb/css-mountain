import { describe, it, expect } from "vitest";
import { getAchievementDefinitions } from "../services/achievement-service";

describe("achievement-service", () => {
  describe("achievement definitions", () => {
    it("returns a non-empty list of definitions", () => {
      const defs = getAchievementDefinitions();
      expect(defs.length).toBeGreaterThan(0);
    });

    it("each definition has key, name, description, and check function", () => {
      const defs = getAchievementDefinitions();
      for (const def of defs) {
        expect(def.key).toBeTruthy();
        expect(def.name).toBeTruthy();
        expect(def.description).toBeTruthy();
        expect(typeof def.check).toBe("function");
      }
    });

    it("all keys are unique", () => {
      const defs = getAchievementDefinitions();
      const keys = defs.map((d) => d.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it("first_summit unlocks at 1 challenge completed", () => {
      const defs = getAchievementDefinitions();
      const firstSummit = defs.find((d) => d.key === "first_summit");
      expect(firstSummit).toBeDefined();

      expect(
        firstSummit!.check({
          totalScore: 100,
          totalStars: 1,
          challengesCompleted: 1,
          totalTimeMs: 10000,
          perfectChallenges: 0,
        }),
      ).toBe(true);

      expect(
        firstSummit!.check({
          totalScore: 0,
          totalStars: 0,
          challengesCompleted: 0,
          totalTimeMs: 0,
          perfectChallenges: 0,
        }),
      ).toBe(false);
    });

    it("perfectionist requires 10 perfect challenges", () => {
      const defs = getAchievementDefinitions();
      const perfectionist = defs.find((d) => d.key === "perfectionist");
      expect(perfectionist).toBeDefined();

      expect(
        perfectionist!.check({
          totalScore: 10000,
          totalStars: 30,
          challengesCompleted: 10,
          totalTimeMs: 100000,
          perfectChallenges: 10,
        }),
      ).toBe(true);

      expect(
        perfectionist!.check({
          totalScore: 10000,
          totalStars: 27,
          challengesCompleted: 10,
          totalTimeMs: 100000,
          perfectChallenges: 9,
        }),
      ).toBe(false);
    });

    it("high_scorer requires 5000 total score", () => {
      const defs = getAchievementDefinitions();
      const highScorer = defs.find((d) => d.key === "high_scorer");
      expect(highScorer).toBeDefined();

      expect(
        highScorer!.check({
          totalScore: 5000,
          totalStars: 15,
          challengesCompleted: 5,
          totalTimeMs: 50000,
          perfectChallenges: 0,
        }),
      ).toBe(true);

      expect(
        highScorer!.check({
          totalScore: 4999,
          totalStars: 15,
          challengesCompleted: 5,
          totalTimeMs: 50000,
          perfectChallenges: 0,
        }),
      ).toBe(false);
    });
  });
});
