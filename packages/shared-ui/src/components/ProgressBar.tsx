import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
  /** Value between 0 and 100 */
  value: number;
  /** Width in character columns */
  width?: number;
  /** Show percentage label */
  showLabel?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Color for the filled portion */
  filledColor?: string;
}

/**
 * DOS-style block character progress bar.
 *
 * Uses block characters: \u2588 (full), \u2593 (dark), \u2592 (medium), \u2591 (light)
 */
export function ProgressBar({
  value,
  width = 20,
  showLabel = true,
  className,
  filledColor,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const filledCount = Math.round((clamped / 100) * width);
  const emptyCount = width - filledCount;

  const filled = "\u2588".repeat(filledCount);
  const empty = "\u2591".repeat(emptyCount);

  return (
    <div
      className={`${styles.container} ${className ?? ""}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span className={styles.bar}>
        <span className={styles.filled} style={filledColor ? { color: filledColor } : undefined}>
          {filled}
        </span>
        <span className={styles.empty}>{empty}</span>
      </span>
      {showLabel && <span className={styles.label}>{Math.round(clamped)}%</span>}
    </div>
  );
}
