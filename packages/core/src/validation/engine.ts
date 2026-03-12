import type { ValidationRule, RuleResult, ValidationResult } from "../types";
import { calculateScore } from "../scoring";
import { validateComputedStyle } from "./computed-style";
import { validateLayoutBounds } from "./layout-bounds";

/**
 * Parameters for running validation.
 */
export interface ValidationParams {
  /** Rules to validate against */
  rules: ValidationRule[];
  /** Document to validate (typically from an iframe) */
  document: Document;
  /** User's CSS source code */
  cssSource: string;
  /** Time spent solving in milliseconds */
  timeSpentMs: number;
  /** Number of hints the player used (0-3) */
  hintsUsed: number;
  /** Whether the player viewed the full solution */
  solutionViewed: boolean;
}

/**
 * Validate a single rule by dispatching to the appropriate validator.
 */
function validateRule(rule: ValidationRule, doc: Document): RuleResult {
  switch (rule.type) {
    case "computed-style":
      return validateComputedStyle(rule, doc);
    case "layout-bounds":
      return validateLayoutBounds(rule, doc);
    case "property-check":
      // property-check is a simpler variant of computed-style
      return validateComputedStyle(rule, doc);
    default:
      return {
        rule,
        passed: false,
        actual: null,
        message: `Unknown rule type: ${rule.type}`,
      };
  }
}

/**
 * Run all validation rules against a document and produce a full result.
 * This is the main entry point for the validation engine.
 */
export function runValidation(params: ValidationParams): ValidationResult {
  const { rules, document: doc, cssSource, timeSpentMs, hintsUsed, solutionViewed } = params;

  const ruleResults = rules.map((rule) => validateRule(rule, doc));

  const score = calculateScore({
    ruleResults,
    totalRules: rules.length,
    timeSpentMs,
    hintsUsed,
    solutionViewed,
    cssSource,
  });

  const passed = ruleResults.every((r) => r.passed);

  const feedback: string[] = [];
  if (passed) {
    feedback.push("All checks passed!");
  } else {
    const failedResults = ruleResults.filter((r) => !r.passed);
    for (const result of failedResults) {
      feedback.push(result.message);
    }
  }

  if (solutionViewed) {
    feedback.push(
      "Solution was viewed - maximum score capped at 400 (1 star)."
    );
  } else if (hintsUsed > 0) {
    feedback.push(`${hintsUsed} hint(s) used - slight score reduction.`);
  }

  return {
    passed,
    score,
    ruleResults,
    feedback,
  };
}
