export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ASSETS: R2Bucket;
  ENVIRONMENT: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  APP_URL: string;
}

export interface SessionData {
  userId: string;
  createdAt: number;
  expiresAt: number;
}

export interface UserRow {
  id: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  auth_provider: string;
  auth_id: string;
  settings_json: string;
  last_login_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserProgressRow {
  id: string;
  user_id: string;
  challenge_id: string;
  best_score: number;
  stars: number;
  attempts: number;
  total_time_ms: number;
  css_source: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AchievementRow {
  id: string;
  user_id: string;
  achievement_key: string;
  unlocked_at: string;
}

export interface UserStatsRow {
  user_id: string;
  total_score: number;
  total_stars: number;
  challenges_completed: number;
  total_time_ms: number;
  updated_at: string;
}

export interface OAuthUserInfo {
  provider: string;
  authId: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
}

export type Variables = {
  userId: string;
  user: UserRow;
};
