/**
 * Offline-first sync service.
 *
 * Strategy:
 * 1. Save progress to localStorage immediately (via core save-system)
 * 2. Queue API sync for when online
 * 3. On reconnect, replay queued operations
 * 4. Merge conflicts: server wins for timestamps, client wins for higher scores
 */

import {
  saveProgress as saveLocalProgress,
  loadProgress as loadLocalProgress,
  type ChallengeProgress,
} from "@css-mountain/core";
import { progressApi, type ProgressSubmission } from "./api-client";

/** localStorage key for the sync queue */
const SYNC_QUEUE_KEY = "css-mountain:sync-queue";

/** Maximum queue size to prevent unbounded growth */
const MAX_QUEUE_SIZE = 200;

/** Debounce interval for online sync attempts (ms) */
const SYNC_DEBOUNCE_MS = 2000;

// ── Sync queue types ────────────────────────────────────────────────────────

interface SyncQueueEntry {
  /** Challenge ID */
  challengeId: string;
  /** Submission data */
  submission: ProgressSubmission;
  /** ISO timestamp when the entry was queued */
  queuedAt: string;
  /** Number of sync attempts */
  attempts: number;
}

// ── Queue persistence ───────────────────────────────────────────────────────

function loadQueue(): SyncQueueEntry[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SyncQueueEntry[];
  } catch {
    return [];
  }
}

function saveQueue(queue: SyncQueueEntry[]): void {
  try {
    // Trim to max size (keep most recent)
    const trimmed = queue.slice(-MAX_QUEUE_SIZE);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage unavailable or full
  }
}

// ── Online detection ────────────────────────────────────────────────────────

function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

// ── Sync service ────────────────────────────────────────────────────────────

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let isSyncing = false;
let onSyncStatusChange: ((syncing: boolean) => void) | null = null;

/**
 * Save challenge progress locally and queue for API sync.
 *
 * This is the primary save function used after challenge completion.
 * Progress is immediately persisted to localStorage and queued for
 * server sync when online.
 */
export function saveAndSync(
  challengeId: string,
  progress: ChallengeProgress,
  submission: ProgressSubmission,
): void {
  // 1. Save to localStorage immediately
  const allProgress = loadLocalProgress();
  const existing = allProgress[challengeId];

  if (existing) {
    // Merge: keep best scores
    allProgress[challengeId] = {
      ...progress,
      bestScore: Math.max(existing.bestScore, progress.bestScore),
      stars: Math.max(existing.stars, progress.stars) as 0 | 1 | 2 | 3,
      attempts: existing.attempts + 1,
      bestSolution:
        progress.bestScore > existing.bestScore
          ? progress.bestSolution
          : existing.bestSolution,
      timeSpentMs: existing.timeSpentMs + progress.timeSpentMs,
      completedAt: progress.completedAt ?? existing.completedAt,
    };
  } else {
    allProgress[challengeId] = progress;
  }
  saveLocalProgress(allProgress);

  // 2. Queue for API sync
  const queue = loadQueue();
  queue.push({
    challengeId,
    submission,
    queuedAt: new Date().toISOString(),
    attempts: 0,
  });
  saveQueue(queue);

  // 3. Attempt sync if online
  scheduleSyncAttempt();
}

/**
 * Schedule a debounced sync attempt.
 * Prevents flooding the API with rapid saves.
 */
function scheduleSyncAttempt(): void {
  if (syncTimer) {
    clearTimeout(syncTimer);
  }
  syncTimer = setTimeout(() => {
    syncTimer = null;
    processQueue();
  }, SYNC_DEBOUNCE_MS);
}

/**
 * Process the sync queue, sending each entry to the API.
 * Entries that fail with non-retryable errors are dropped.
 * Entries that fail with retryable errors stay in the queue.
 */
async function processQueue(): Promise<void> {
  if (isSyncing || !isOnline()) return;

  const queue = loadQueue();
  if (queue.length === 0) return;

  isSyncing = true;
  onSyncStatusChange?.(true);

  const remaining: SyncQueueEntry[] = [];

  for (const entry of queue) {
    try {
      await progressApi.submit(entry.challengeId, entry.submission);
      // Success - entry is removed from queue
    } catch (err) {
      const status =
        err && typeof err === "object" && "status" in err
          ? (err as { status: number }).status
          : 0;

      // 4xx errors (except 429) are non-retryable - drop them
      if (status >= 400 && status < 500 && status !== 429) {
        continue;
      }

      // Retryable: keep in queue with incremented attempt count
      if (entry.attempts < 5) {
        remaining.push({ ...entry, attempts: entry.attempts + 1 });
      }
      // After 5 attempts, drop the entry
    }
  }

  saveQueue(remaining);
  isSyncing = false;
  onSyncStatusChange?.(false);
}

/**
 * Merge guest progress into an authenticated account's progress.
 * Uses the "upsert-keep-best" strategy:
 * - For each challenge, keep the higher score and more stars
 * - Submit all guest progress to the API
 */
export async function mergeGuestProgress(
  guestProgress: Record<string, ChallengeProgress>,
): Promise<void> {
  const entries = Object.values(guestProgress);
  if (entries.length === 0) return;

  for (const entry of entries) {
    if (entry.bestScore <= 0) continue;

    try {
      await progressApi.submit(entry.challengeId, {
        score: entry.bestScore,
        stars: entry.stars,
        timeMs: entry.timeSpentMs,
        cssSource: entry.bestSolution ?? "",
      });
    } catch {
      // If merge fails for one entry, continue with others.
      // Remaining entries are saved locally and can be synced later.
    }
  }
}

/**
 * Force an immediate sync attempt.
 * Used when the app comes back online.
 */
export function forceSyncNow(): void {
  processQueue();
}

/**
 * Get the number of entries waiting to sync.
 */
export function getPendingSyncCount(): number {
  return loadQueue().length;
}

/**
 * Set a callback for sync status changes.
 */
export function onSyncStatus(callback: (syncing: boolean) => void): void {
  onSyncStatusChange = callback;
}

/**
 * Initialize sync listeners for online/offline events.
 * Call once at app startup.
 */
export function initSyncListeners(): () => void {
  const handleOnline = () => {
    forceSyncNow();
  };

  window.addEventListener("online", handleOnline);

  // Attempt sync on startup if there are queued entries
  if (isOnline() && getPendingSyncCount() > 0) {
    scheduleSyncAttempt();
  }

  return () => {
    window.removeEventListener("online", handleOnline);
    if (syncTimer) {
      clearTimeout(syncTimer);
      syncTimer = null;
    }
  };
}
