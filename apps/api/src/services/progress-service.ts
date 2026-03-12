import { upsertProgress, recalculateStats, getProgressByChallenge } from "../db/queries";

interface ProgressSubmission {
  score: number;
  stars: number;
  timeMs: number;
  cssSource: string;
}

interface ValidationError {
  field: string;
  message: string;
}

const MIN_TIME_MS = 5000; // 5 seconds minimum

export function validateSubmission(submission: ProgressSubmission): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof submission.score !== "number" || submission.score < 0 || submission.score > 1000) {
    errors.push({ field: "score", message: "Score must be between 0 and 1000" });
  }

  if (
    typeof submission.stars !== "number" ||
    !Number.isInteger(submission.stars) ||
    submission.stars < 0 ||
    submission.stars > 3
  ) {
    errors.push({ field: "stars", message: "Stars must be an integer between 0 and 3" });
  }

  if (typeof submission.timeMs !== "number" || submission.timeMs < MIN_TIME_MS) {
    errors.push({
      field: "timeMs",
      message: `Time must be at least ${MIN_TIME_MS}ms`,
    });
  }

  if (typeof submission.cssSource !== "string" || submission.cssSource.trim().length === 0) {
    errors.push({ field: "cssSource", message: "CSS source is required" });
  }

  return errors;
}

export async function saveProgress(
  db: D1Database,
  userId: string,
  challengeId: string,
  submission: ProgressSubmission,
): Promise<{ isNewBest: boolean }> {
  const existing = await getProgressByChallenge(db, userId, challengeId);
  const isNewBest = !existing || submission.score > existing.best_score;

  const id = existing?.id ?? crypto.randomUUID();

  await upsertProgress(
    db,
    id,
    userId,
    challengeId,
    submission.score,
    submission.stars,
    submission.timeMs,
    submission.cssSource,
  );

  await recalculateStats(db, userId);

  return { isNewBest };
}
