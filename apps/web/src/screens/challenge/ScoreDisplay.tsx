import type { ScoreBreakdown } from "@css-mountain/core";
import { ProgressBar } from "@css-mountain/shared-ui";
import styles from "./ScoreDisplay.module.css";

interface ScoreDisplayProps {
  /** Score breakdown from validation */
  score: ScoreBreakdown;
  /** Additional CSS class */
  className?: string;
}

/**
 * ASCII star characters for the 0-3 star rating display.
 */
function StarRating({ stars }: { stars: 0 | 1 | 2 | 3 }) {
  const filled = "\u2605"; // filled star
  const empty = "\u2606";  // empty star

  return (
    <div className={styles.stars} data-testid="star-rating" aria-label={`${stars} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={i < stars ? styles.starFilled : styles.starEmpty}
        >
          {i < stars ? filled : empty}
        </span>
      ))}
    </div>
  );
}

/**
 * Score breakdown display with star rating and category bars.
 * Shows correctness, code quality, efficiency, and speed bonus.
 */
export function ScoreDisplay({ score, className }: ScoreDisplayProps) {
  const categories = [
    { label: "Correctness", value: score.correctness, max: 600, color: "var(--dos-success)" },
    { label: "Code Quality", value: score.codeQuality, max: 200, color: "var(--dos-accent)" },
    { label: "Efficiency", value: score.efficiency, max: 100, color: "var(--dos-light-magenta)" },
    { label: "Speed Bonus", value: score.speedBonus, max: 100, color: "var(--dos-yellow)" },
  ];

  return (
    <div className={`${styles.container} ${className ?? ""}`} data-testid="score-display">
      <div className={styles.header}>
        <StarRating stars={score.stars} />
        <div className={styles.totalScore}>
          <span className={styles.totalValue}>{score.total}</span>
          <span className={styles.totalMax}>/1000</span>
        </div>
      </div>

      <div className={styles.breakdown}>
        {categories.map((cat) => (
          <div key={cat.label} className={styles.category}>
            <div className={styles.categoryHeader}>
              <span className={styles.categoryLabel}>{cat.label}</span>
              <span className={styles.categoryValue}>
                {cat.value}/{cat.max}
              </span>
            </div>
            <ProgressBar
              value={cat.max > 0 ? (cat.value / cat.max) * 100 : 0}
              width={20}
              showLabel={false}
              filledColor={cat.color}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
