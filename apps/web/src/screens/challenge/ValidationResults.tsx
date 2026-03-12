import styles from "./ValidationResults.module.css";

/** Minimal rule result shape used by this component */
interface DisplayRuleResult {
  passed: boolean;
  message: string;
}

interface ValidationResultsProps {
  /** Per-rule results to display */
  ruleResults: DisplayRuleResult[];
  /** Whether all rules passed */
  allPassed: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * Displays pass/fail status for each validation rule after submission.
 * Uses DOS-style check/cross characters and VGA colors.
 */
export function ValidationResults({ ruleResults, allPassed, className }: ValidationResultsProps) {
  if (ruleResults.length === 0) {
    return null;
  }

  const passedCount = ruleResults.filter((r) => r.passed).length;

  return (
    <div
      className={`${styles.container} ${className ?? ""}`}
      data-testid="validation-results"
      role="list"
      aria-label="Validation results"
    >
      <div className={styles.header}>
        <span className={allPassed ? styles.passedHeader : styles.failedHeader}>
          {allPassed ? "ALL CHECKS PASSED" : "VALIDATION RESULTS"}
        </span>
        <span className={styles.count}>
          {passedCount}/{ruleResults.length}
        </span>
      </div>

      <div className={styles.rules}>
        {ruleResults.map((result, index) => (
          <div
            key={index}
            className={`${styles.rule} ${result.passed ? styles.passed : styles.failed}`}
            role="listitem"
          >
            <span className={styles.indicator}>
              {result.passed ? "\u2588" : "\u2591"}
            </span>
            <span className={styles.message}>{result.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
