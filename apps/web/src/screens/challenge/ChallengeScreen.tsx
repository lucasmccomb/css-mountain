import { useState, useCallback, useMemo } from "react";
import type { ScoreBreakdown } from "@css-mountain/core";
import { calculateScore } from "@css-mountain/core";
import { Button, Terminal } from "@css-mountain/shared-ui";
import { Editor } from "./Editor";
import { Preview } from "./Preview";
import { Target } from "./Target";
import { ValidationResults } from "./ValidationResults";
import { HintPanel } from "./HintPanel";
import { ScoreDisplay } from "./ScoreDisplay";
import { MobileToolbar } from "./MobileToolbar";
import { useChallenge } from "./hooks/useChallenge";
import { useLivePreview } from "./hooks/useLivePreview";
import { useValidation } from "./hooks/useValidation";
import styles from "./ChallengeScreen.module.css";

type MobileTab = "editor" | "preview" | "info";

interface ChallengeScreenProps {
  /** Challenge ID or slug to load */
  challengeId?: string;
}

/**
 * Main challenge editor screen - the core gameplay experience.
 *
 * Layout:
 * - Desktop (>1024px): Split pane with editor on left, target+preview on right
 * - Tablet (640-1024px): Stacked layout with smaller preview
 * - Mobile (<640px): Tabbed layout with Editor/Preview/Info tabs
 */
export function ChallengeScreen({ challengeId }: ChallengeScreenProps) {
  const { validate } = useValidation();
  const {
    challenge,
    cssCode,
    isLoading,
    error,
    validationResult,
    hintsRevealed,
    isSubmitting,
    setCssCode,
    submit,
    revealHint,
    resetCode,
  } = useChallenge(challengeId, validate);

  const [mobileTab, setMobileTab] = useState<MobileTab>("editor");

  // Live preview updates as the user types
  const challengeHtml = challenge?.html ?? "";
  const { containerRef: previewContainerRef, forceUpdate } = useLivePreview(
    challengeHtml,
    cssCode,
    500,
  );

  // Handle mobile toolbar inserts
  const handleMobileInsert = useCallback(
    (text: string) => {
      setCssCode(cssCode + text);
    },
    [cssCode, setCssCode],
  );

  // Handle submit with force-update before validation
  const handleSubmit = useCallback(async () => {
    forceUpdate();
    await submit();
  }, [forceUpdate, submit]);

  // Calculate a score breakdown for display if we have a validation result
  const scoreBreakdown: ScoreBreakdown | null = useMemo(() => {
    if (!validationResult || !challenge) return null;
    return calculateScore({
      ruleResults: validationResult.ruleResults.map((rr) => ({
        ...rr,
        actual: null,
      })),
      totalRules: challenge.validationRules.length,
      timeSpentMs: 0, // Already recorded in store
      hintsUsed: hintsRevealed,
      solutionViewed: hintsRevealed >= 3,
      cssSource: cssCode,
    });
  }, [validationResult, challenge, hintsRevealed, cssCode]);

  // The first reference solution is used as the target display
  const referenceCss = challenge?.referenceSolutions?.[0] ?? "";

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.screen}>
        <div className={styles.loading}>
          LOADING CHALLENGE...
          <span className={styles.blink}>_</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.screen}>
        <Terminal title="Error">
          <div style={{ color: "var(--dos-error)" }}>{error}</div>
        </Terminal>
      </div>
    );
  }

  // No challenge loaded
  if (!challenge) {
    return (
      <div className={styles.screen}>
        <Terminal title="Challenge">
          <div>No challenge loaded. Select a challenge from the zone map.</div>
        </Terminal>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      {/* Header bar with challenge info */}
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.challengeType}>[{challenge.type.toUpperCase()}]</span>
          <h1 className={styles.challengeTitle}>{challenge.title}</h1>
          <span className={styles.difficulty}>{challenge.difficulty.toUpperCase()}</span>
        </div>
        <p className={styles.description}>{challenge.description}</p>
      </header>

      {/* Mobile tab bar */}
      <nav className={styles.mobileTabBar} role="tablist" aria-label="Challenge tabs">
        {(["editor", "preview", "info"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={mobileTab === tab}
            className={`${styles.mobileTab} ${mobileTab === tab ? styles.activeTab : ""}`}
            onClick={() => setMobileTab(tab)}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </nav>

      {/* Main content area */}
      <div className={styles.content}>
        {/* Left panel: Editor */}
        <div
          className={`${styles.editorPanel} ${mobileTab !== "editor" ? styles.mobileHidden : ""}`}
        >
          <Editor value={cssCode} onChange={setCssCode} />
          <MobileToolbar onInsert={handleMobileInsert} />
          <div className={styles.editorActions}>
            <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "CHECKING..." : "SUBMIT"}
            </Button>
            <Button onClick={resetCode}>RESET</Button>
          </div>
        </div>

        {/* Right panel: Target + Preview */}
        <div
          className={`${styles.previewPanel} ${mobileTab !== "preview" ? styles.mobileHidden : ""}`}
        >
          <Target html={challengeHtml} referenceCss={referenceCss} />
          <Preview
            html={challengeHtml}
            css={cssCode}
            containerRef={previewContainerRef}
          />
        </div>

        {/* Info panel (mobile only as separate tab, always visible on desktop as sidebar) */}
        <div
          className={`${styles.infoPanel} ${mobileTab !== "info" ? styles.mobileHidden : ""}`}
        >
          {/* Score display */}
          {scoreBreakdown && <ScoreDisplay score={scoreBreakdown} />}

          {/* Validation results */}
          {validationResult && (
            <ValidationResults
              ruleResults={validationResult.ruleResults}
              allPassed={validationResult.passed}
            />
          )}

          {/* Hint panel */}
          <HintPanel
            hints={challenge.hints}
            hintsRevealed={hintsRevealed}
            onRevealHint={revealHint}
          />

          {/* Challenge metadata */}
          <div className={styles.metadata}>
            <div className={styles.metaItem}>
              Topics: {challenge.metadata.topics.join(", ")}
            </div>
            <div className={styles.metaItem}>
              Est. time: {challenge.metadata.estimatedMinutes} min
            </div>
            <div className={styles.metaItem}>
              Zone: {challenge.zone} ({challenge.difficulty})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
