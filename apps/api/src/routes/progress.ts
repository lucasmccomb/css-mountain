import { Hono } from "hono";
import type { Env, Variables } from "../types";
import { authMiddleware } from "../middleware/auth";
import { progressRateLimiter } from "../middleware/rate-limit";
import { getProgressByUser } from "../db/queries";
import { validateSubmission, saveProgress } from "../services/progress-service";

const progress = new Hono<{ Bindings: Env; Variables: Variables }>();

progress.use("/*", authMiddleware);

// Get all progress for current user
progress.get("/", async (c) => {
  const result = await getProgressByUser(c.env.DB, c.var.userId);

  return c.json({
    progress: result.results.map((p) => ({
      challengeId: p.challenge_id,
      bestScore: p.best_score,
      stars: p.stars,
      attempts: p.attempts,
      totalTimeMs: p.total_time_ms,
      completedAt: p.completed_at,
      updatedAt: p.updated_at,
    })),
  });
});

// Submit progress for a challenge
progress.post("/:challengeId", progressRateLimiter, async (c) => {
  const challengeId = c.req.param("challengeId");

  if (!challengeId || challengeId.trim().length === 0) {
    return c.json({ error: "Challenge ID is required" }, 400);
  }

  const body = await c.req.json<{
    score: number;
    stars: number;
    timeMs: number;
    cssSource: string;
  }>();

  const errors = validateSubmission(body);
  if (errors.length > 0) {
    return c.json({ error: "Validation failed", details: errors }, 400);
  }

  const result = await saveProgress(c.env.DB, c.var.userId, challengeId, {
    score: body.score,
    stars: body.stars,
    timeMs: body.timeMs,
    cssSource: body.cssSource,
  });

  return c.json({
    success: true,
    isNewBest: result.isNewBest,
    challengeId,
  });
});

export { progress };
