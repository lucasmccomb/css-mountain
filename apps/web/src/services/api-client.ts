/**
 * Typed fetch wrapper for the CSS Mountain API.
 *
 * Handles auth headers (cookies), error responses, and automatic retries
 * for transient failures (network errors, 5xx, 429).
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

/** Maximum number of retry attempts for transient errors */
const MAX_RETRIES = 3;

/** Base delay in milliseconds for exponential backoff */
const BASE_DELAY_MS = 500;

// ── Response types ──────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  details?: string[];
  status: number;
}

export interface UserInfo {
  id: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  settings: Record<string, unknown>;
  createdAt: string;
}

export interface ProgressEntry {
  challengeId: string;
  bestScore: number;
  stars: number;
  attempts: number;
  totalTimeMs: number;
  completedAt: string | null;
  updatedAt: string;
}

export interface ProgressSubmission {
  score: number;
  stars: number;
  timeMs: number;
  cssSource: string;
}

export interface ProgressSubmitResult {
  success: boolean;
  isNewBest: boolean;
  challengeId: string;
}

export interface AchievementEntry {
  key: string;
  name: string;
  description: string;
  unlockedAt: string;
}

export interface AchievementsResponse {
  achievements: AchievementEntry[];
  total: number;
  unlocked: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalScore: number;
  totalStars: number;
  challengesCompleted: number;
}

export interface ChallengeListItem {
  id: string;
  title: string;
  difficulty: string;
  category: string;
  order: number;
}

// ── Error class ─────────────────────────────────────────────────────────────

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: string[],
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

// ── Internal helpers ────────────────────────────────────────────────────────

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retries: number = MAX_RETRIES,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include", // Send session cookie
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({
          error: response.statusText,
        }));

        if (isRetryable(response.status) && attempt < retries) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }

        throw new ApiRequestError(
          body.error ?? "Request failed",
          response.status,
          body.details,
        );
      }

      return (await response.json()) as T;
    } catch (err) {
      if (err instanceof ApiRequestError) throw err;

      // Network error - retry if attempts remain
      lastError = err as Error;
      if (attempt < retries) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }
    }
  }

  throw lastError ?? new Error("Request failed after retries");
}

// ── Auth endpoints ──────────────────────────────────────────────────────────

export const authApi = {
  /** Get the current authenticated user. Returns null if not authenticated. */
  async getMe(): Promise<UserInfo | null> {
    try {
      return await request<UserInfo>("/auth/me");
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        return null;
      }
      throw err;
    }
  },

  /** Get the Google OAuth redirect URL */
  getGoogleAuthUrl(): string {
    return `${API_BASE}/auth/google`;
  },

  /** Get the GitHub OAuth redirect URL */
  getGitHubAuthUrl(): string {
    return `${API_BASE}/auth/github`;
  },

  /** Log out the current user */
  async logout(): Promise<void> {
    await request<{ success: boolean }>("/auth/logout", { method: "POST" });
  },
};

// ── Challenge endpoints ─────────────────────────────────────────────────────

export const challengeApi = {
  /** List all challenges (public) */
  async list(): Promise<ChallengeListItem[]> {
    const data = await request<{ challenges: ChallengeListItem[] }>(
      "/challenges",
    );
    return data.challenges;
  },

  /** Get a specific challenge by ID */
  async get(id: string): Promise<unknown> {
    const data = await request<{ challenge: unknown }>(`/challenges/${id}`);
    return data.challenge;
  },
};

// ── Progress endpoints ──────────────────────────────────────────────────────

export const progressApi = {
  /** Get all progress for the current user */
  async getAll(): Promise<ProgressEntry[]> {
    const data = await request<{ progress: ProgressEntry[] }>("/progress");
    return data.progress;
  },

  /** Submit progress for a challenge */
  async submit(
    challengeId: string,
    submission: ProgressSubmission,
  ): Promise<ProgressSubmitResult> {
    return request<ProgressSubmitResult>(`/progress/${challengeId}`, {
      method: "POST",
      body: JSON.stringify(submission),
    });
  },
};

// ── Achievement endpoints ───────────────────────────────────────────────────

export const achievementApi = {
  /** Get all achievements for the current user */
  async getAll(): Promise<AchievementsResponse> {
    return request<AchievementsResponse>("/achievements");
  },

  /** Check for new achievements (called after progress save) */
  async check(): Promise<AchievementEntry[]> {
    const data = await request<{ newAchievements: AchievementEntry[] }>(
      "/achievements/check",
      { method: "POST" },
    );
    return data.newAchievements;
  },
};

// ── Leaderboard endpoints ───────────────────────────────────────────────────

export const leaderboardApi = {
  /** Get the top players leaderboard */
  async get(limit: number = 100): Promise<LeaderboardEntry[]> {
    const data = await request<{ leaderboard: LeaderboardEntry[] }>(
      `/leaderboard?limit=${limit}`,
    );
    return data.leaderboard;
  },
};
