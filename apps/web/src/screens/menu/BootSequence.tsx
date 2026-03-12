import { useState, useEffect, useCallback, useRef } from "react";
import { ProgressBar } from "@css-mountain/shared-ui";
import styles from "./BootSequence.module.css";

const BOOT_LINES = [
  { text: "CSS MOUNTAIN v1.0", delay: 300, className: "header" },
  { text: "Initializing display adapter... OK", delay: 200 },
  { text: "Loading VGA 16-color palette... OK", delay: 150 },
  { text: "Mounting filesystem C:\\CSS_MOUNTAIN\\...", delay: 250 },
  { text: "Checking challenge database... 50 challenges found", delay: 200 },
  { text: "Scanning for saved progress...", delay: 300 },
  { text: "", delay: 100 },
  { text: "The mountain's CSS has been corrupted", delay: 400, className: "narrative" },
  { text: "by the Master of Mischief...", delay: 400, className: "narrative" },
  { text: "Only you can restore the styles.", delay: 400, className: "narrative" },
];

const STORAGE_KEY = "css-mountain-boot-seen";
const TOTAL_BOOT_TIME = BOOT_LINES.reduce((sum, l) => sum + l.delay, 0);

interface BootSequenceProps {
  /** Called when boot sequence completes or is skipped */
  onComplete: () => void;
}

export function BootSequence({ onComplete }: BootSequenceProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [showSkipHint, setShowSkipHint] = useState(false);
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(Date.now());

  // Check if returning user - skip immediately
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") {
        onComplete();
        return;
      }
    } catch {
      // localStorage unavailable
    }
  }, [onComplete]);

  // Show skip hint after a brief delay
  useEffect(() => {
    const t = setTimeout(() => setShowSkipHint(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Animate lines appearing
  useEffect(() => {
    if (completed) return;
    if (visibleLines >= BOOT_LINES.length) {
      // All lines shown, wait a moment then complete
      timerRef.current = setTimeout(() => {
        markComplete();
      }, 1000);
      return;
    }

    const line = BOOT_LINES[visibleLines];
    timerRef.current = setTimeout(() => {
      setVisibleLines((v) => v + 1);
    }, line.delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleLines, completed]);

  // Animate progress bar
  useEffect(() => {
    if (completed) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, Math.round((elapsed / TOTAL_BOOT_TIME) * 100));
      setProgress(pct);
    }, 50);
    return () => clearInterval(interval);
  }, [completed]);

  const markComplete = useCallback(() => {
    if (completed) return;
    setCompleted(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // localStorage unavailable
    }
    onComplete();
  }, [completed, onComplete]);

  const handleSkip = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    markComplete();
  }, [markComplete]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Any key skips
      if (e.key) {
        handleSkip();
      }
    },
    [handleSkip],
  );

  return (
    <div
      className={styles.container}
      onClick={handleSkip}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Boot sequence - press any key to skip"
      data-testid="boot-sequence"
    >
      <div className={styles.content}>
        {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            className={`${styles.line} ${line.className ? styles[line.className] : ""}`}
          >
            {line.text}
          </div>
        ))}

        {visibleLines > 0 && (
          <div className={styles.progressSection}>
            <ProgressBar value={progress} width={30} showLabel />
          </div>
        )}

        {showSkipHint && !completed && (
          <div className={styles.skipHint} data-testid="skip-hint">
            Press any key or click to skip...
          </div>
        )}
      </div>
    </div>
  );
}
