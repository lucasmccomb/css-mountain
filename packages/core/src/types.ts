/**
 * Challenge types supported by CSS Mountain.
 *
 * - match: Reproduce a target visual using CSS
 * - fix: Fix broken CSS to match the expected output
 * - optimize: Reduce CSS while maintaining the same visual
 * - build: Build a component from scratch with CSS
 * - quiz: Multiple-choice CSS knowledge questions
 */
export type ChallengeType = "match" | "fix" | "optimize" | "build" | "quiz";

/**
 * Difficulty tiers on the mountain.
 */
export type Difficulty = "base-camp" | "trail" | "ridge" | "summit" | "peak";

/**
 * A single validation rule applied to a challenge submission.
 */
export interface ValidationRule {
  /** Rule type identifier */
  type: string;
  /** CSS property to validate, if applicable */
  property?: string;
  /** Expected value for the property */
  expected?: string;
  /** Human-readable description of what this rule checks */
  description: string;
}

/**
 * A CSS challenge definition.
 */
export interface Challenge {
  /** Unique challenge identifier (e.g., "match-001") */
  id: string;
  /** Display title */
  title: string;
  /** Challenge type */
  type: ChallengeType;
  /** Difficulty tier */
  difficulty: Difficulty;
  /** Brief description shown to the player */
  description: string;
  /** Starting CSS code provided to the player */
  starterCss: string;
  /** Target CSS (hidden from player, used for validation) */
  targetCss?: string;
  /** HTML template the CSS applies to */
  html: string;
  /** Validation rules for grading */
  validationRules: ValidationRule[];
  /** Hint text, revealed on request (costs points) */
  hints: string[];
  /** Maximum points for this challenge */
  maxPoints: number;
  /** Tags for filtering (e.g., ["flexbox", "grid", "colors"]) */
  tags: string[];
}

/**
 * A player's progress on a single challenge.
 */
export interface ChallengeProgress {
  challengeId: string;
  /** Whether the challenge has been completed */
  completed: boolean;
  /** Points earned (0 if not completed) */
  pointsEarned: number;
  /** Number of attempts made */
  attempts: number;
  /** Number of hints revealed */
  hintsUsed: number;
  /** The player's last submitted CSS */
  lastSubmission?: string;
  /** Timestamp of completion */
  completedAt?: string;
}

/**
 * Player profile and overall progress.
 */
export interface PlayerProfile {
  id: string;
  displayName: string;
  /** Current altitude (total points) */
  altitude: number;
  /** Current difficulty tier reached */
  currentTier: Difficulty;
  /** Per-challenge progress */
  progress: Record<string, ChallengeProgress>;
  /** Account creation timestamp */
  createdAt: string;
  /** Last activity timestamp */
  lastActiveAt: string;
}
