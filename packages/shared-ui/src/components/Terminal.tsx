import { type ReactNode } from "react";
import styles from "./Terminal.module.css";

interface TerminalProps {
  /** Title displayed in the title bar */
  title: string;
  /** Content rendered inside the terminal panel */
  children: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Max height for scrollable content area */
  maxHeight?: string;
}

export function Terminal({ title, children, className, maxHeight }: TerminalProps) {
  return (
    <div className={`${styles.terminal} ${className ?? ""}`} role="region" aria-label={title}>
      {/* Top border with title */}
      <div className={styles.topBorder}>
        <span className={styles.corner}>{"\u2554"}</span>
        <span className={styles.fill} style={{ overflow: "hidden" }}>
          {"\u2550".repeat(200)}
        </span>
        <span className={styles.corner}>{"\u2557"}</span>
      </div>

      {/* Title bar */}
      <div className={styles.titleBar}>
        <span className={styles.side}>{"\u2551"}</span>
        <span className={styles.titleText}>{` ${title} `}</span>
        <span className={styles.side}>{"\u2551"}</span>
      </div>

      {/* Separator */}
      <div className={styles.topBorder}>
        <span className={styles.corner}>{"\u2560"}</span>
        <span className={styles.fill} style={{ overflow: "hidden" }}>
          {"\u2550".repeat(200)}
        </span>
        <span className={styles.corner}>{"\u2563"}</span>
      </div>

      {/* Content area */}
      <div className={styles.contentRow}>
        <span className={styles.side}>{"\u2551"}</span>
        <div className={styles.contentArea} style={maxHeight ? { maxHeight } : undefined}>
          {children}
        </div>
        <span className={styles.side}>{"\u2551"}</span>
      </div>

      {/* Bottom border */}
      <div className={styles.bottomBorder}>
        <span className={styles.corner}>{"\u255A"}</span>
        <span className={styles.fill} style={{ overflow: "hidden" }}>
          {"\u2550".repeat(200)}
        </span>
        <span className={styles.corner}>{"\u255D"}</span>
      </div>
    </div>
  );
}
