import { Hono } from "hono";
import type { Env, Variables } from "../types";
import { authMiddleware } from "../middleware/auth";
import {
  getAchievementsByUser,
  checkAndUnlockAchievements,
  getAchievementDefinitions,
} from "../services/achievement-service";

const achievements = new Hono<{ Bindings: Env; Variables: Variables }>();

achievements.use("/*", authMiddleware);

// Get all achievements for current user
achievements.get("/", async (c) => {
  const result = await getAchievementsByUser(c.env.DB, c.var.userId);
  const definitions = getAchievementDefinitions();

  const userAchievements = result.results.map((a) => {
    const def = definitions.find((d) => d.key === a.achievement_key);
    return {
      key: a.achievement_key,
      name: def?.name ?? a.achievement_key,
      description: def?.description ?? "",
      unlockedAt: a.unlocked_at,
    };
  });

  return c.json({
    achievements: userAchievements,
    total: definitions.length,
    unlocked: userAchievements.length,
  });
});

// Check and unlock new achievements
achievements.post("/check", async (c) => {
  const newAchievements = await checkAndUnlockAchievements(c.env.DB, c.var.userId);
  const definitions = getAchievementDefinitions();

  return c.json({
    newAchievements: newAchievements.map((a) => {
      const def = definitions.find((d) => d.key === a.achievement_key);
      return {
        key: a.achievement_key,
        name: def?.name ?? a.achievement_key,
        description: def?.description ?? "",
        unlockedAt: a.unlocked_at,
      };
    }),
  });
});

export { achievements };
