import type { Challenge, ValidationRule } from "@css-mountain/core";

/**
 * Result of running a CSS challenge validation.
 */
export interface RunResult {
  /** Whether all validation rules passed */
  passed: boolean;
  /** Score as a percentage (0-100) */
  score: number;
  /** Per-rule results */
  ruleResults: RuleResult[];
}

/**
 * Result of a single validation rule check.
 */
export interface RuleResult {
  rule: ValidationRule;
  passed: boolean;
  message: string;
}

/**
 * Run CSS validation against a challenge's rules.
 * Placeholder implementation - will be built out in Epic 3.
 */
export function runChallenge(_challenge: Challenge, _submittedCss: string): RunResult {
  return {
    passed: false,
    score: 0,
    ruleResults: [],
  };
}
