import type { Challenge, ValidationRule } from "@css-mountain/core";

/**
 * Re-export core types used by the runner.
 */
export type { Challenge, ValidationRule };

/**
 * A quiz challenge with multiple-choice options.
 * Extends the base Challenge with quiz-specific fields.
 */
export interface QuizChallenge {
  /** Unique challenge identifier */
  id: string;
  /** Display title */
  title: string;
  /** Challenge type - always "quiz" for quiz challenges */
  type: "quiz";
  /** Difficulty tier */
  difficulty: string;
  /** The question text */
  description: string;
  /** Multiple choice options */
  options: string[];
  /** Index of the correct option (0-based) */
  correctOptionIndex: number;
  /** Explanation shown after answering */
  explanation?: string;
  /** Tags for filtering */
  tags: string[];
  /** Maximum points for this challenge */
  maxPoints: number;
}

/**
 * Result of a single validation rule check.
 */
export interface RuleResult {
  /** The validation rule that was checked */
  rule: ValidationRule;
  /** Whether this rule passed */
  passed: boolean;
  /** Human-readable message about the result */
  message: string;
}

/**
 * Result of running all validations for a challenge.
 */
export interface ValidationResult {
  /** Whether all rules passed */
  passed: boolean;
  /** Score from 0-1000 */
  score: number;
  /** Star rating (0-3) based on score */
  stars: number;
  /** Per-rule results */
  ruleResults: RuleResult[];
}

/**
 * Calculate a star rating from a score.
 * - 3 stars: 900-1000 (>= 90%)
 * - 2 stars: 700-899 (>= 70%)
 * - 1 star: 400-699 (>= 40%)
 * - 0 stars: 0-399 (< 40%)
 */
export function calculateStars(score: number): number {
  if (score >= 900) return 3;
  if (score >= 700) return 2;
  if (score >= 400) return 1;
  return 0;
}
