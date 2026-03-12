import { useState, useEffect } from "react";
import { Terminal, Button } from "@css-mountain/shared-ui";
import styles from "./NarrativeIntro.module.css";

const STORY_LINES = [
  "INCOMING TRANSMISSION...",
  "",
  "The CSS Mountain once stood as a beacon of beautiful design.",
  "Every element was perfectly styled, every layout immaculate.",
  "",
  'Then the Master of Mischief arrived.',
  "",
  "He corrupted the stylesheets, broke the layouts, and",
  "scattered CSS chaos across the mountain's five zones.",
  "",
  "You are a developer. Your mission: climb the mountain,",
  "fix the broken CSS, and restore order to every zone.",
  "",
  "Your journey begins at Base Camp.",
];

interface NarrativeIntroProps {
  /** Navigate to tutorial challenge */
  onStartTutorial: () => void;
  /** Skip to main menu (for impatient users) */
  onSkip: () => void;
}

export function NarrativeIntro({ onStartTutorial, onSkip }: NarrativeIntroProps) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    if (visibleLines >= STORY_LINES.length) {
      const t = setTimeout(() => setShowActions(true), 500);
      return () => clearTimeout(t);
    }

    const delay = STORY_LINES[visibleLines] === "" ? 200 : 400;
    const t = setTimeout(() => {
      setVisibleLines((v) => v + 1);
    }, delay);

    return () => clearTimeout(t);
  }, [visibleLines]);

  return (
    <div className={styles.container}>
      <div className={styles.terminalWrapper}>
        <Terminal title="Incoming Transmission">
          {STORY_LINES.slice(0, visibleLines).map((line, i) => (
            <div
              key={i}
              className={`${styles.paragraph} ${
                i === visibleLines - 1 && visibleLines < STORY_LINES.length
                  ? styles.typingLine
                  : styles.typingComplete
              }`}
            >
              {line === "" ? "\u00A0" : formatLine(line)}
            </div>
          ))}

          {showActions && (
            <div className={styles.actions}>
              <Button variant="primary" onClick={onStartTutorial}>
                Begin Tutorial
              </Button>
              <Button onClick={onSkip}>Skip to Menu</Button>
            </div>
          )}
        </Terminal>
      </div>
    </div>
  );
}

function formatLine(text: string): React.ReactNode {
  // Highlight the villain name
  if (text.includes("Master of Mischief")) {
    const parts = text.split("Master of Mischief");
    return (
      <>
        {parts[0]}
        <span style={{ color: "var(--dos-light-red)" }}>Master of Mischief</span>
        {parts[1]}
      </>
    );
  }
  // Highlight mission line
  if (text.startsWith("You are a developer")) {
    return <span style={{ color: "var(--dos-light-green)" }}>{text}</span>;
  }
  return text;
}
