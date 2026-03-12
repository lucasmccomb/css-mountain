import type { UserRow, UserProgressRow, AchievementRow, UserStatsRow } from "../types";

// ---- Users ----

export function getUserById(db: D1Database, id: string) {
  return db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<UserRow>();
}

export function getUserByAuth(db: D1Database, provider: string, authId: string) {
  return db
    .prepare("SELECT * FROM users WHERE auth_provider = ? AND auth_id = ?")
    .bind(provider, authId)
    .first<UserRow>();
}

export function createUser(
  db: D1Database,
  id: string,
  displayName: string,
  email: string | null,
  avatarUrl: string | null,
  authProvider: string,
  authId: string,
) {
  return db
    .prepare(
      `INSERT INTO users (id, display_name, email, avatar_url, auth_provider, auth_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, displayName, email, avatarUrl, authProvider, authId)
    .run();
}

export function updateUser(
  db: D1Database,
  id: string,
  displayName: string,
  email: string | null,
  avatarUrl: string | null,
) {
  return db
    .prepare(
      `UPDATE users SET display_name = ?, email = ?, avatar_url = ?,
       last_login_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(displayName, email, avatarUrl, id)
    .run();
}

export function updateUserProfile(
  db: D1Database,
  id: string,
  updates: { display_name?: string; settings_json?: string },
) {
  const setClauses: string[] = ["updated_at = datetime('now')"];
  const bindings: (string | null)[] = [];

  if (updates.display_name !== undefined) {
    setClauses.push("display_name = ?");
    bindings.push(updates.display_name);
  }
  if (updates.settings_json !== undefined) {
    setClauses.push("settings_json = ?");
    bindings.push(updates.settings_json);
  }

  bindings.push(id);

  return db
    .prepare(`UPDATE users SET ${setClauses.join(", ")} WHERE id = ?`)
    .bind(...bindings)
    .run();
}

// ---- User Progress ----

export function getProgressByUser(db: D1Database, userId: string) {
  return db
    .prepare("SELECT * FROM user_progress WHERE user_id = ? ORDER BY updated_at DESC")
    .bind(userId)
    .all<UserProgressRow>();
}

export function getProgressByChallenge(db: D1Database, userId: string, challengeId: string) {
  return db
    .prepare("SELECT * FROM user_progress WHERE user_id = ? AND challenge_id = ?")
    .bind(userId, challengeId)
    .first<UserProgressRow>();
}

export function upsertProgress(
  db: D1Database,
  id: string,
  userId: string,
  challengeId: string,
  score: number,
  stars: number,
  timeMs: number,
  cssSource: string,
) {
  return db
    .prepare(
      `INSERT INTO user_progress (id, user_id, challenge_id, best_score, stars, attempts, total_time_ms, css_source, completed_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, datetime('now'))
       ON CONFLICT(user_id, challenge_id) DO UPDATE SET
         best_score = MAX(user_progress.best_score, excluded.best_score),
         stars = MAX(user_progress.stars, excluded.stars),
         attempts = user_progress.attempts + 1,
         total_time_ms = user_progress.total_time_ms + excluded.total_time_ms,
         css_source = CASE WHEN excluded.best_score > user_progress.best_score THEN excluded.css_source ELSE user_progress.css_source END,
         completed_at = COALESCE(user_progress.completed_at, excluded.completed_at),
         updated_at = datetime('now')`,
    )
    .bind(id, userId, challengeId, score, stars, timeMs, cssSource)
    .run();
}

// ---- Achievements ----

export function getAchievementsByUser(db: D1Database, userId: string) {
  return db
    .prepare("SELECT * FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC")
    .bind(userId)
    .all<AchievementRow>();
}

export function hasAchievement(db: D1Database, userId: string, achievementKey: string) {
  return db
    .prepare("SELECT 1 FROM achievements WHERE user_id = ? AND achievement_key = ?")
    .bind(userId, achievementKey)
    .first();
}

export function createAchievement(
  db: D1Database,
  id: string,
  userId: string,
  achievementKey: string,
) {
  return db
    .prepare(
      `INSERT OR IGNORE INTO achievements (id, user_id, achievement_key)
       VALUES (?, ?, ?)`,
    )
    .bind(id, userId, achievementKey)
    .run();
}

// ---- User Stats ----

export function getUserStats(db: D1Database, userId: string) {
  return db
    .prepare("SELECT * FROM user_stats WHERE user_id = ?")
    .bind(userId)
    .first<UserStatsRow>();
}

export function recalculateStats(db: D1Database, userId: string) {
  return db
    .prepare(
      `INSERT INTO user_stats (user_id, total_score, total_stars, challenges_completed, total_time_ms, updated_at)
       SELECT
         ? as user_id,
         COALESCE(SUM(best_score), 0),
         COALESCE(SUM(stars), 0),
         COUNT(*),
         COALESCE(SUM(total_time_ms), 0),
         datetime('now')
       FROM user_progress
       WHERE user_id = ? AND completed_at IS NOT NULL
       ON CONFLICT(user_id) DO UPDATE SET
         total_score = excluded.total_score,
         total_stars = excluded.total_stars,
         challenges_completed = excluded.challenges_completed,
         total_time_ms = excluded.total_time_ms,
         updated_at = datetime('now')`,
    )
    .bind(userId, userId)
    .run();
}

// ---- Leaderboard ----

export function getLeaderboard(db: D1Database, limit: number = 100) {
  return db
    .prepare(
      `SELECT us.*, u.display_name, u.avatar_url
       FROM user_stats us
       JOIN users u ON u.id = us.user_id
       ORDER BY us.total_score DESC
       LIMIT ?`,
    )
    .bind(limit)
    .all<UserStatsRow & Pick<UserRow, "display_name" | "avatar_url">>();
}

// ---- Stats initialization ----

export function initializeUserStats(db: D1Database, userId: string) {
  return db
    .prepare(
      `INSERT OR IGNORE INTO user_stats (user_id, total_score, total_stars, challenges_completed, total_time_ms)
       VALUES (?, 0, 0, 0, 0)`,
    )
    .bind(userId)
    .run();
}
