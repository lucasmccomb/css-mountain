import { createStore } from "zustand/vanilla";
import type { ChallengeProgress, Difficulty, ScoreBreakdown } from "../types";

/**
 * Player progress state: challenge completions, stars, scores.
 */
export interface ProgressState {
  /** Per-challenge progress keyed by challenge ID */
  challengeProgress: Record<string, ChallengeProgress>;
  /** Total stars earned */
  totalStars: number;
  /** Total score earned */
  totalScore: number;
  /** Current zone the player is in */
  currentZone: Difficulty;
  /** Achievement IDs earned */
  achievements: string[];

  // Actions
  updateChallengeProgress: (
    challengeId: string,
    update: Partial<ChallengeProgress>
  ) => void;
  recordAttempt: (
    challengeId: string,
    score: ScoreBreakdown,
    solution: string,
    timeSpentMs: number,
    hintsUsed: number,
    solutionViewed: boolean
  ) => void;
  unlockChallenge: (challengeId: string) => void;
  setCurrentZone: (zone: Difficulty) => void;
  addAchievement: (achievementId: string) => void;
  loadProgress: (progress: Record<string, ChallengeProgress>) => void;
  reset: () => void;
}

function createDefaultProgress(challengeId: string): ChallengeProgress {
  return {
    challengeId,
    status: "locked",
    bestScore: 0,
    stars: 0,
    attempts: 0,
    bestSolution: null,
    hintsUsed: 0,
    solutionViewed: false,
    timeSpentMs: 0,
    completedAt: null,
  };
}

/**
 * Recalculate totals from all challenge progress entries.
 */
function recalculateTotals(progress: Record<string, ChallengeProgress>): {
  totalStars: number;
  totalScore: number;
} {
  let totalStars = 0;
  let totalScore = 0;
  for (const cp of Object.values(progress)) {
    totalStars += cp.stars;
    totalScore += cp.bestScore;
  }
  return { totalStars, totalScore };
}

/**
 * Create the progress store.
 */
export const progressStore = createStore<ProgressState>()((set, get) => ({
  challengeProgress: {},
  totalStars: 0,
  totalScore: 0,
  currentZone: "junior",
  achievements: [],

  updateChallengeProgress: (challengeId, update) => {
    const current = get().challengeProgress;
    const existing = current[challengeId] || createDefaultProgress(challengeId);
    const updated = { ...existing, ...update };
    const newProgress = { ...current, [challengeId]: updated };
    const totals = recalculateTotals(newProgress);

    set({
      challengeProgress: newProgress,
      ...totals,
    });
  },

  recordAttempt: (
    challengeId,
    score,
    solution,
    timeSpentMs,
    hintsUsed,
    solutionViewed
  ) => {
    const current = get().challengeProgress;
    const existing = current[challengeId] || createDefaultProgress(challengeId);

    const isNewBest = score.total > existing.bestScore;
    const completed = score.stars > 0;

    const updated: ChallengeProgress = {
      challengeId,
      status: completed ? "completed" : "attempted",
      bestScore: isNewBest ? score.total : existing.bestScore,
      stars: Math.max(existing.stars, score.stars) as 0 | 1 | 2 | 3,
      attempts: existing.attempts + 1,
      bestSolution: isNewBest ? solution : existing.bestSolution,
      hintsUsed: Math.max(existing.hintsUsed, hintsUsed),
      solutionViewed: existing.solutionViewed || solutionViewed,
      timeSpentMs: existing.timeSpentMs + timeSpentMs,
      completedAt: completed
        ? existing.completedAt || new Date().toISOString()
        : existing.completedAt,
    };

    const newProgress = { ...current, [challengeId]: updated };
    const totals = recalculateTotals(newProgress);

    set({
      challengeProgress: newProgress,
      ...totals,
    });
  },

  unlockChallenge: (challengeId) => {
    const current = get().challengeProgress;
    const existing = current[challengeId] || createDefaultProgress(challengeId);

    if (existing.status === "locked") {
      const updated = { ...existing, status: "unlocked" as const };
      set({
        challengeProgress: { ...current, [challengeId]: updated },
      });
    }
  },

  setCurrentZone: (zone) => set({ currentZone: zone }),

  addAchievement: (achievementId) => {
    const current = get().achievements;
    if (!current.includes(achievementId)) {
      set({ achievements: [...current, achievementId] });
    }
  },

  loadProgress: (progress) => {
    const totals = recalculateTotals(progress);
    set({
      challengeProgress: progress,
      ...totals,
    });
  },

  reset: () =>
    set({
      challengeProgress: {},
      totalStars: 0,
      totalScore: 0,
      currentZone: "junior",
      achievements: [],
    }),
}));
