import {
  getAchievementsByUser,
  hasAchievement,
  createAchievement,
  getUserStats,
  getProgressByUser,
} from "../db/queries";
import type { AchievementRow } from "../types";

export interface AchievementDefinition {
  key: string;
  name: string;
  description: string;
  check: (stats: AchievementCheckContext) => boolean;
}

export interface AchievementCheckContext {
  totalScore: number;
  totalStars: number;
  challengesCompleted: number;
  totalTimeMs: number;
  perfectChallenges: number;
}

const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    key: "first_summit",
    name: "First Summit",
    description: "Complete your first challenge",
    check: (ctx) => ctx.challengesCompleted >= 1,
  },
  {
    key: "trailblazer",
    name: "Trailblazer",
    description: "Complete 10 challenges",
    check: (ctx) => ctx.challengesCompleted >= 10,
  },
  {
    key: "mountaineer",
    name: "Mountaineer",
    description: "Complete 25 challenges",
    check: (ctx) => ctx.challengesCompleted >= 25,
  },
  {
    key: "summit_master",
    name: "Summit Master",
    description: "Complete 50 challenges",
    check: (ctx) => ctx.challengesCompleted >= 50,
  },
  {
    key: "star_collector",
    name: "Star Collector",
    description: "Earn 30 stars",
    check: (ctx) => ctx.totalStars >= 30,
  },
  {
    key: "star_hoarder",
    name: "Star Hoarder",
    description: "Earn 100 stars",
    check: (ctx) => ctx.totalStars >= 100,
  },
  {
    key: "perfectionist",
    name: "Perfectionist",
    description: "Get a perfect 3-star rating on 10 challenges",
    check: (ctx) => ctx.perfectChallenges >= 10,
  },
  {
    key: "high_scorer",
    name: "High Scorer",
    description: "Accumulate 5000 total points",
    check: (ctx) => ctx.totalScore >= 5000,
  },
  {
    key: "speed_climber",
    name: "Speed Climber",
    description: "Complete 10 challenges in under 5 minutes total",
    check: (ctx) => ctx.challengesCompleted >= 10 && ctx.totalTimeMs < 300000,
  },
];

export function getAchievementDefinitions(): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS;
}

export async function checkAndUnlockAchievements(
  db: D1Database,
  userId: string,
): Promise<AchievementRow[]> {
  const stats = await getUserStats(db, userId);
  if (!stats) return [];

  const progress = await getProgressByUser(db, userId);
  const perfectChallenges = progress.results.filter((p) => p.stars === 3).length;

  const context: AchievementCheckContext = {
    totalScore: stats.total_score,
    totalStars: stats.total_stars,
    challengesCompleted: stats.challenges_completed,
    totalTimeMs: stats.total_time_ms,
    perfectChallenges,
  };

  const newAchievements: AchievementRow[] = [];

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (!def.check(context)) continue;

    const already = await hasAchievement(db, userId, def.key);
    if (already) continue;

    const id = crypto.randomUUID();
    await createAchievement(db, id, userId, def.key);

    newAchievements.push({
      id,
      user_id: userId,
      achievement_key: def.key,
      unlocked_at: new Date().toISOString(),
    });
  }

  return newAchievements;
}

export { getAchievementsByUser };
