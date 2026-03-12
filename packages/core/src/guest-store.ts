import type { ChallengeProgress } from "./types";

/** localStorage key for guest progress */
const GUEST_STORAGE_KEY = "css-mountain:guest-progress";

/** Storage budget in bytes (2MB) */
const STORAGE_BUDGET_BYTES = 2 * 1024 * 1024;

/** Warning threshold (80% of budget) */
const WARNING_THRESHOLD = 0.8;

/**
 * Payload for merging guest progress into an authenticated account.
 */
export interface MergePayload {
  /** All guest challenge progress entries */
  progress: ChallengeProgress[];
  /** Merge strategy: always keep the best scores */
  mergeStrategy: "upsert-keep-best";
}

/**
 * Guest progress store that mirrors the D1 schema subset in localStorage.
 * Used for unauthenticated players to persist progress locally.
 */
export interface GuestProgressStore {
  save(progress: ChallengeProgress): void;
  load(challengeId: string): ChallengeProgress | null;
  loadAll(): Record<string, ChallengeProgress>;
  getStorageUsage(): { used: number; budget: number; percentage: number };
  showWarningIfNeeded(): boolean;
  getMergePayload(): MergePayload;
  clearAfterMerge(): void;
}

/**
 * Safely read guest progress from localStorage.
 */
function readStore(): Record<string, ChallengeProgress> {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ChallengeProgress>;
  } catch {
    return {};
  }
}

/**
 * Safely write guest progress to localStorage.
 * Returns true on success, false on quota error.
 */
function writeStore(data: Record<string, ChallengeProgress>): boolean {
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the byte size of a string (approximate, using UTF-16).
 */
function getByteSize(str: string): number {
  return new Blob([str]).size;
}

/**
 * Create a guest progress store instance.
 */
export function createGuestProgressStore(): GuestProgressStore {
  return {
    save(progress: ChallengeProgress): void {
      const store = readStore();
      const existing = store[progress.challengeId];

      if (existing) {
        // Upsert: keep best scores
        store[progress.challengeId] = {
          ...progress,
          bestScore: Math.max(existing.bestScore, progress.bestScore),
          stars: Math.max(existing.stars, progress.stars) as 0 | 1 | 2 | 3,
          attempts: existing.attempts + 1,
          bestSolution:
            progress.bestScore > existing.bestScore
              ? progress.bestSolution
              : existing.bestSolution,
          hintsUsed: Math.max(existing.hintsUsed, progress.hintsUsed),
          solutionViewed: existing.solutionViewed || progress.solutionViewed,
          timeSpentMs: existing.timeSpentMs + progress.timeSpentMs,
          completedAt: progress.completedAt || existing.completedAt,
        };
      } else {
        store[progress.challengeId] = progress;
      }

      writeStore(store);
    },

    load(challengeId: string): ChallengeProgress | null {
      const store = readStore();
      return store[challengeId] || null;
    },

    loadAll(): Record<string, ChallengeProgress> {
      return readStore();
    },

    getStorageUsage(): { used: number; budget: number; percentage: number } {
      try {
        const raw = localStorage.getItem(GUEST_STORAGE_KEY) || "";
        const used = getByteSize(raw);
        return {
          used,
          budget: STORAGE_BUDGET_BYTES,
          percentage: used / STORAGE_BUDGET_BYTES,
        };
      } catch {
        return { used: 0, budget: STORAGE_BUDGET_BYTES, percentage: 0 };
      }
    },

    showWarningIfNeeded(): boolean {
      const usage = this.getStorageUsage();
      return usage.percentage > WARNING_THRESHOLD;
    },

    getMergePayload(): MergePayload {
      const store = readStore();
      return {
        progress: Object.values(store),
        mergeStrategy: "upsert-keep-best",
      };
    },

    clearAfterMerge(): void {
      try {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      } catch {
        // Silently ignore
      }
    },
  };
}
