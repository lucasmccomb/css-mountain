import { useState, useCallback, useMemo } from "react";
import { Terminal, Button } from "@css-mountain/shared-ui";
import styles from "./TutorialChallenge.module.css";

const STARTER_CSS = `.box {
  padding: 16px;
  border: 2px solid #55ffff;
  background: #000000;
  color: #aaaaaa;
}`;

const SOLUTION_PROPERTY = "color";
const SOLUTION_VALUE = "#55ff55";

const TUTORIAL_STEPS = [
  {
    title: "Welcome to your first challenge!",
    text: "In CSS Mountain, you fix broken CSS to match a target design. The editor below has CSS that is almost correct - you just need to change one property.",
  },
  {
    title: "Change the text color",
    text: `The text should be bright green (#55ff55) instead of gray. Find the "color" property and change its value to #55ff55.`,
  },
];

interface TutorialChallengeProps {
  /** Called when the tutorial is completed */
  onComplete: () => void;
  /** Skip the tutorial */
  onSkip: () => void;
}

export function TutorialChallenge({ onComplete, onSkip }: TutorialChallengeProps) {
  const [css, setCss] = useState(STARTER_CSS);
  const [currentStep, setCurrentStep] = useState(0);
  const [solved, setSolved] = useState(false);

  const previewStyle = useMemo(() => {
    // Parse the CSS to apply inline - simple extraction for the tutorial
    const colorMatch = css.match(/color\s*:\s*([^;]+)/);
    const bgMatch = css.match(/background\s*:\s*([^;]+)/);
    const borderMatch = css.match(/border\s*:\s*([^;]+)/);
    const paddingMatch = css.match(/padding\s*:\s*([^;]+)/);

    return {
      color: colorMatch?.[1]?.trim() ?? "#aaaaaa",
      background: bgMatch?.[1]?.trim() ?? "#000000",
      border: borderMatch?.[1]?.trim() ?? "2px solid #55ffff",
      padding: paddingMatch?.[1]?.trim() ?? "16px",
    };
  }, [css]);

  const targetStyle = useMemo(
    () => ({
      color: SOLUTION_VALUE,
      background: "#000000",
      border: "2px solid #55ffff",
      padding: "16px",
    }),
    [],
  );

  const checkSolution = useCallback(() => {
    const colorMatch = css.match(/color\s*:\s*([^;]+)/);
    const currentColor = colorMatch?.[1]?.trim().toLowerCase();
    if (currentColor === SOLUTION_VALUE) {
      setSolved(true);
      // Auto-advance step
      setCurrentStep(TUTORIAL_STEPS.length - 1);
    }
  }, [css]);

  const handleCssChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCss(e.target.value);
    },
    [],
  );

  const step = TUTORIAL_STEPS[Math.min(currentStep, TUTORIAL_STEPS.length - 1)];

  return (
    <div className={styles.container} data-testid="tutorial-challenge">
      <div className={styles.content}>
        <Terminal title="Tutorial - First Challenge">
          {/* Tooltip / Instructions */}
          <div className={styles.tooltip}>
            <div className={styles.tooltipLabel}>{step.title}</div>
            <div>{step.text}</div>
          </div>

          {/* Target preview */}
          <div className={styles.targetArea}>
            <div className={styles.previewLabel}>Target (match this):</div>
            <div className={styles.preview}>
              <div style={targetStyle}>CSS Mountain</div>
            </div>
          </div>

          {/* Editor */}
          <div className={styles.editorArea}>
            <div className={styles.codeLabel}>
              Your CSS (change the{" "}
              <span className={styles.highlightProperty}>{SOLUTION_PROPERTY}</span> value):
            </div>
            <textarea
              className={styles.editor}
              value={css}
              onChange={handleCssChange}
              spellCheck={false}
              aria-label="CSS editor"
              data-testid="tutorial-editor"
            />
          </div>

          {/* Live preview */}
          <div className={styles.previewArea}>
            <div className={styles.previewLabel}>Your result:</div>
            <div className={styles.preview}>
              <div style={previewStyle}>CSS Mountain</div>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            {!solved && (
              <>
                <Button variant="primary" onClick={checkSolution}>
                  Submit
                </Button>
                {currentStep === 0 && (
                  <Button onClick={() => setCurrentStep(1)}>Show Hint</Button>
                )}
                <Button onClick={onSkip}>Skip Tutorial</Button>
              </>
            )}
            {solved && (
              <>
                <div className={styles.successMessage}>
                  Correct! You fixed the CSS. The mountain awaits...
                </div>
                <Button variant="primary" onClick={onComplete}>
                  Continue to Menu
                </Button>
              </>
            )}
          </div>
        </Terminal>
      </div>
    </div>
  );
}
