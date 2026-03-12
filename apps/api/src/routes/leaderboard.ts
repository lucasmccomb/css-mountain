import { Hono } from "hono";
import type { Env, Variables } from "../types";
import { optionalAuthMiddleware } from "../middleware/auth";
import { getLeaderboard } from "../db/queries";

const leaderboard = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get top 100 leaderboard (public)
leaderboard.get("/", optionalAuthMiddleware, async (c) => {
  const limitParam = c.req.query("limit");
  const limit = Math.min(Math.max(parseInt(limitParam ?? "100", 10) || 100, 1), 100);

  const result = await getLeaderboard(c.env.DB, limit);

  return c.json({
    leaderboard: result.results.map((entry, index) => ({
      rank: index + 1,
      userId: entry.user_id,
      displayName: entry.display_name,
      avatarUrl: entry.avatar_url,
      totalScore: entry.total_score,
      totalStars: entry.total_stars,
      challengesCompleted: entry.challenges_completed,
    })),
  });
});

export { leaderboard };
