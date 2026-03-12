import type { HintTier } from "@css-mountain/core";
import { Button } from "@css-mountain/shared-ui";
import styles from "./HintPanel.module.css";

interface HintPanelProps {
  /** All three hint tiers from the challenge */
  hints: [HintTier, HintTier, HintTier];
  /** Number of hints currently revealed (0-3) */
  hintsRevealed: number;
  /** Callback to reveal the next hint */
  onRevealHint: () => void;
  /** Additional CSS class */
  className?: string;
}

const TIER_LABELS: Record<string, string> = {
  nudge: "HINT 1 - Nudge",
  clue: "HINT 2 - Clue",
  solution: "HINT 3 - Solution",
};

const TIER_COLORS: Record<string, string> = {
  nudge: "var(--dos-yellow)",
  clue: "var(--dos-light-cyan)",
  solution: "var(--dos-light-red)",
};

/**
 * Progressive hint panel with three tiers: nudge, clue, and solution.
 * Each tier costs a score penalty when revealed.
 */
export function HintPanel({ hints, hintsRevealed, onRevealHint, className }: HintPanelProps) {
  const canReveal = hintsRevealed < 3;

  return (
    <div className={`${styles.container} ${className ?? ""}`} data-testid="hint-panel">
      <div className={styles.header}>
        HINTS ({hintsRevealed}/3)
        {hintsRevealed > 0 && (
          <span className={styles.penalty}>
            {" "}-{hintsRevealed * 5}% score
          </span>
        )}
      </div>

      <div className={styles.hints}>
        {hints.map((hint, index) => {
          const isRevealed = index < hintsRevealed;

          return (
            <div
              key={hint.level}
              className={`${styles.hint} ${isRevealed ? styles.revealed : styles.locked}`}
            >
              <div
                className={styles.tierLabel}
                style={{ color: isRevealed ? TIER_COLORS[hint.level] : undefined }}
              >
                {TIER_LABELS[hint.level] || `HINT ${index + 1}`}
              </div>

              {isRevealed ? (
                <div className={styles.hintContent}>
                  <div className={styles.hintText}>{hint.text}</div>
                  {hint.code && (
                    <pre className={styles.hintCode}>
                      <code>{hint.code}</code>
                    </pre>
                  )}
                </div>
              ) : (
                <div className={styles.lockedText}>
                  {"\u2591".repeat(20)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {canReveal && (
        <div className={styles.revealAction}>
          <Button onClick={onRevealHint} variant="default">
            Reveal Hint {hintsRevealed + 1}
          </Button>
          <span className={styles.warningText}>
            {hintsRevealed < 2
              ? "(-5% score penalty)"
              : "WARNING: Shows solution"}
          </span>
        </div>
      )}
    </div>
  );
}
