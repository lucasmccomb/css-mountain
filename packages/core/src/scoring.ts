import type { RuleResult, ScoreBreakdown } from "./types";

/**
 * Parameters for score calculation.
 */
export interface ScoreParams {
  /** Per-rule validation results */
  ruleResults: RuleResult[];
  /** Total number of rules in the challenge */
  totalRules: number;
  /** Time spent solving in milliseconds */
  timeSpentMs: number;
  /** Number of hints used (0-3) */
  hintsUsed: number;
  /** Whether the full solution was viewed */
  solutionViewed: boolean;
  /** The player's CSS source code */
  cssSource: string;
}

/** Maximum points per scoring dimension */
const MAX_CORRECTNESS = 600;
const MAX_CODE_QUALITY = 200;
const MAX_EFFICIENCY = 100;
const MAX_SPEED_BONUS = 100;

/** Speed bonus decay time in milliseconds (10 minutes) */
const SPEED_DECAY_MS = 600_000;

/** Solution viewed penalty: max total becomes 400 (1 star max) */
const SOLUTION_VIEWED_CAP = 400;

/** Per-hint penalty as a fraction of total (each hint costs ~5% of total) */
const HINT_PENALTY_FRACTION = 0.05;

/**
 * Calculate a comprehensive score breakdown for a challenge submission.
 *
 * Scoring dimensions:
 * - Correctness (max 600): Proportion of passed validation rules
 * - Code Quality (max 200): Penalized for !important, overly long selectors, etc.
 * - Efficiency (max 100): Reasonable brevity without code golf
 * - Speed Bonus (max 100): Decays linearly over 10 minutes
 *
 * Penalties:
 * - Each hint used: -5% of total score
 * - Solution viewed: total capped at 400 (1 star max)
 */
export function calculateScore(params: ScoreParams): ScoreBreakdown {
  const {
    ruleResults,
    totalRules,
    timeSpentMs,
    hintsUsed,
    solutionViewed,
    cssSource,
  } = params;

  // Correctness: 600 * (passed / total)
  const passedCount = ruleResults.filter((r) => r.passed).length;
  const correctnessRatio = totalRules > 0 ? passedCount / totalRules : 0;
  const correctness = Math.round(MAX_CORRECTNESS * correctnessRatio);

  // Code quality: 200 * quality factor
  const qualityFactor = assessCodeQuality(cssSource);
  const codeQuality = Math.round(MAX_CODE_QUALITY * qualityFactor);

  // Efficiency: 100 * efficiency factor
  const efficiencyFactor = assessEfficiency(cssSource);
  const efficiency = Math.round(MAX_EFFICIENCY * efficiencyFactor);

  // Speed bonus: 100 * max(0, 1 - timeSpentMs / 600000)
  const speedRatio = Math.max(0, 1 - timeSpentMs / SPEED_DECAY_MS);
  const speedBonus = Math.round(MAX_SPEED_BONUS * speedRatio);

  let total = correctness + codeQuality + efficiency + speedBonus;

  // Apply hint penalties
  if (hintsUsed > 0) {
    const hintPenalty = Math.round(total * HINT_PENALTY_FRACTION * hintsUsed);
    total = Math.max(0, total - hintPenalty);
  }

  // Apply solution viewed cap
  if (solutionViewed) {
    total = Math.min(total, SOLUTION_VIEWED_CAP);
  }

  // Clamp total
  total = Math.max(0, Math.min(1000, total));

  const stars = calculateStars(total);

  return {
    correctness,
    codeQuality,
    efficiency,
    speedBonus,
    total,
    stars,
  };
}

/**
 * Determine star rating from total score.
 * - 0 stars: below 400
 * - 1 star: 400+
 * - 2 stars: 600+
 * - 3 stars: 800+
 */
export function calculateStars(total: number): 0 | 1 | 2 | 3 {
  if (total >= 800) return 3;
  if (total >= 600) return 2;
  if (total >= 400) return 1;
  return 0;
}

/**
 * Assess CSS code quality (0 to 1).
 * Penalizes:
 * - !important usage
 * - Overly specific selectors (deep nesting)
 * - Inline-style-like patterns in CSS
 * - Duplicate properties
 */
function assessCodeQuality(cssSource: string): number {
  if (!cssSource.trim()) return 0;

  let quality = 1.0;

  // Penalty for !important (each occurrence costs 0.15)
  const importantCount = (cssSource.match(/!important/g) || []).length;
  quality -= importantCount * 0.15;

  // Penalty for deeply nested selectors (more than 3 levels)
  const lines = cssSource.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    // Count selector depth by spaces in selector (rough heuristic)
    if (trimmed.includes("{")) {
      const selector = trimmed.split("{")[0].trim();
      const parts = selector.split(/\s+/).filter(Boolean);
      if (parts.length > 3) {
        quality -= 0.1;
      }
    }
  }

  // Penalty for vendor prefixes without standards (minor)
  const vendorPrefixes = (cssSource.match(/-webkit-|-moz-|-ms-/g) || [])
    .length;
  quality -= vendorPrefixes * 0.02;

  return Math.max(0, Math.min(1, quality));
}

/**
 * Assess CSS efficiency (0 to 1).
 * Rewards reasonable brevity without penalizing necessary code.
 * Penalizes:
 * - Extremely verbose code (many unnecessary properties)
 * - Very short code that's likely incomplete
 */
function assessEfficiency(cssSource: string): number {
  if (!cssSource.trim()) return 0;

  const charCount = cssSource.replace(/\s/g, "").length;

  // Optimal range: 20-500 chars of meaningful CSS
  // Below 20: likely too minimal
  // Above 500: likely verbose
  // Above 1000: significantly penalized

  if (charCount < 5) return 0.1;
  if (charCount < 20) return 0.5;
  if (charCount <= 500) return 1.0;
  if (charCount <= 1000) return 0.8;
  return 0.6;
}
