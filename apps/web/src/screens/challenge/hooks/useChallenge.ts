import { useState, useCallback, useEffect } from "react";
import { useStore } from "zustand";
import type { Challenge, ScoreBreakdown, ValidationRule } from "@css-mountain/core";
import { gameStore, progressStore, calculateScore } from "@css-mountain/core";

/**
 * Minimal rule result interface that both core and runner-css RuleResult satisfy.
 */
export interface RunnerRuleResult {
  rule: ValidationRule;
  passed: boolean;
  message: string;
}

/**
 * Simplified validation result from the CSS runner.
 * This bridges the gap between the core and runner-css ValidationResult types.
 */
export interface RunnerValidationResult {
  passed: boolean;
  score: number;
  stars: number;
  ruleResults: RunnerRuleResult[];
}

/**
 * Challenge state managed by the useChallenge hook.
 */
interface ChallengeState {
  /** The loaded challenge data, null until loaded */
  challenge: Challenge | null;
  /** Current CSS code in the editor */
  cssCode: string;
  /** Whether the challenge is loading */
  isLoading: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** Validation result from the last submission */
  validationResult: RunnerValidationResult | null;
  /** Number of hints revealed (0-3) */
  hintsRevealed: number;
  /** Whether submission is in progress */
  isSubmitting: boolean;
}

/**
 * Hook actions returned alongside state.
 */
interface ChallengeActions {
  /** Update the CSS code in the editor */
  setCssCode: (code: string) => void;
  /** Submit the current code for validation */
  submit: () => Promise<void>;
  /** Reveal the next hint */
  revealHint: () => void;
  /** Reset the editor to starter CSS */
  resetCode: () => void;
}

/**
 * Manage challenge lifecycle: loading, code editing, submission, and hints.
 *
 * Accepts a challengeId (slug or ID) and an optional validate function.
 * If no validate function is provided, submission is a no-op.
 */
export function useChallenge(
  challengeId: string | undefined,
  validateFn?: (css: string, challenge: Challenge) => Promise<RunnerValidationResult>,
): ChallengeState & ChallengeActions {
  const currentChallenge = useStore(gameStore, (s) => s.currentChallenge);
  const isGameLoading = useStore(gameStore, (s) => s.isLoading);
  const gameError = useStore(gameStore, (s) => s.error);

  const [cssCode, setCssCode] = useState("");
  const [validationResult, setValidationResult] = useState<RunnerValidationResult | null>(null);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cast to Challenge (non-quiz) since this is the CSS challenge editor
  const challenge = currentChallenge && currentChallenge.type !== "quiz"
    ? (currentChallenge as Challenge)
    : null;

  // Initialize CSS code when challenge loads
  useEffect(() => {
    if (challenge) {
      setCssCode(challenge.starterCss || "");
      setValidationResult(null);
      setHintsRevealed(0);
    }
  }, [challenge]);

  // Load challenge by ID if not already loaded
  useEffect(() => {
    if (!challengeId) return;
    // If the current challenge matches, nothing to do
    if (challenge && challenge.id === challengeId) return;
    if (challenge && challenge.slug === challengeId) return;

    // In a full implementation, this would fetch from an API or content store.
    // For now, the challenge must be loaded into gameStore externally.
  }, [challengeId, challenge]);

  const submit = useCallback(async () => {
    if (!challenge || !validateFn || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await validateFn(cssCode, challenge);
      setValidationResult(result);

      // Calculate full score breakdown and record the attempt
      const elapsed = gameStore.getState().getElapsedMs();
      const scoreBreakdown: ScoreBreakdown = calculateScore({
        ruleResults: result.ruleResults.map((rr) => ({
          ...rr,
          actual: null,
        })),
        totalRules: challenge.validationRules.length,
        timeSpentMs: elapsed,
        hintsUsed: hintsRevealed,
        solutionViewed: hintsRevealed >= 3,
        cssSource: cssCode,
      });

      progressStore.getState().recordAttempt(
        challenge.id,
        scoreBreakdown,
        cssCode,
        elapsed,
        hintsRevealed,
        hintsRevealed >= 3,
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [challenge, validateFn, cssCode, hintsRevealed, isSubmitting]);

  const revealHint = useCallback(() => {
    setHintsRevealed((prev) => Math.min(prev + 1, 3));
  }, []);

  const resetCode = useCallback(() => {
    if (challenge) {
      setCssCode(challenge.starterCss || "");
      setValidationResult(null);
    }
  }, [challenge]);

  return {
    challenge,
    cssCode,
    isLoading: isGameLoading,
    error: gameError,
    validationResult,
    hintsRevealed,
    isSubmitting,
    setCssCode,
    submit,
    revealHint,
    resetCode,
  };
}
