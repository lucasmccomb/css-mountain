import type { RuleResult, ScoreBreakdown } from "./types";
import { calculateStars } from "./scoring";

/**
 * Safety net configuration - the game is designed so players always progress.
 */
export interface SafetyNet {
  /** Players can always skip any challenge */
  canSkipChallenge: true;
  /** The full solution is always available (as the 3rd hint tier) */
  solutionAlwaysAvailable: true;
  /** Maximum stars when solution is viewed */
  maxStarsWithSolution: 1;
  /** Partial credit is always enabled */
  partialCreditEnabled: true;
  /** Any CSS that changes output earns at least some credit */
  minPartialCreditThreshold: number;
}

/** Default safety net configuration */
export const SAFETY_NET: SafetyNet = {
  canSkipChallenge: true,
  solutionAlwaysAvailable: true,
  maxStarsWithSolution: 1,
  partialCreditEnabled: true,
  minPartialCreditThreshold: 50,
};

/**
 * Calculate partial credit from rule results.
 * Any passed rule earns proportional credit.
 * Returns a score from 0-600 (correctness dimension only).
 */
export function calculatePartialCredit(ruleResults: RuleResult[]): number {
  if (ruleResults.length === 0) return 0;

  const passed = ruleResults.filter((r) => r.passed).length;
  const ratio = passed / ruleResults.length;

  // Even 1 passed rule out of many gives meaningful credit
  return Math.round(600 * ratio);
}

/**
 * Apply the solution-viewed penalty to a score breakdown.
 * Caps total at 400 and stars at 1.
 */
export function applySolutionPenalty(score: ScoreBreakdown): ScoreBreakdown {
  const cappedTotal = Math.min(score.total, 400);
  const cappedStars = Math.min(calculateStars(cappedTotal), 1) as 0 | 1;

  return {
    ...score,
    total: cappedTotal,
    stars: cappedStars,
  };
}

/**
 * Encouragement messages based on score performance.
 * The game should always feel encouraging, never punishing.
 */
const ENCOURAGEMENT_MESSAGES: Array<{
  minScore: number;
  maxScore: number;
  messages: string[];
}> = [
  {
    minScore: 800,
    maxScore: 1000,
    messages: [
      "Outstanding work! You crushed that challenge!",
      "Perfect execution! The mountain trembles before your CSS skills!",
      "Flawless! You are a CSS master!",
    ],
  },
  {
    minScore: 600,
    maxScore: 799,
    messages: [
      "Great job! You're climbing strong!",
      "Solid work! Your CSS skills are sharp!",
      "Well done! Keep that momentum going!",
    ],
  },
  {
    minScore: 400,
    maxScore: 599,
    messages: [
      "Good progress! You're getting the hang of it!",
      "Nice! Every step up the mountain counts!",
      "You earned your star! Keep climbing!",
    ],
  },
  {
    minScore: 100,
    maxScore: 399,
    messages: [
      "You're making progress! Try again for more stars!",
      "Good effort! Each attempt makes you stronger!",
      "You're on the right track! Keep practicing!",
    ],
  },
  {
    minScore: 0,
    maxScore: 99,
    messages: [
      "Don't give up! CSS takes practice!",
      "Every expert was once a beginner. Try the hints!",
      "The journey of a thousand lines begins with a single property!",
    ],
  },
];

/**
 * Get an encouragement message based on the player's score.
 * Always returns a positive, encouraging message.
 */
export function getEncouragementMessage(score: ScoreBreakdown): string {
  const tier = ENCOURAGEMENT_MESSAGES.find(
    (t) => score.total >= t.minScore && score.total <= t.maxScore
  );

  if (!tier) {
    return "Keep going! You've got this!";
  }

  // Deterministic selection based on score for consistency
  const index = score.total % tier.messages.length;
  return tier.messages[index];
}
