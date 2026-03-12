import { type ReactNode } from "react";
import styles from "./ASCIIBorder.module.css";

interface ASCIIBorderProps {
  children: ReactNode;
  /** Use double-line box drawing characters */
  double?: boolean;
  /** Additional CSS class for the outer container */
  className?: string;
  /** Border color override */
  borderColor?: string;
  /** Number of character-width columns for the content area */
  width?: number;
}

const SINGLE = {
  tl: "\u250C", // ┌
  tr: "\u2510", // ┐
  bl: "\u2514", // └
  br: "\u2518", // ┘
  h: "\u2500", // ─
  v: "\u2502", // │
} as const;

const DOUBLE = {
  tl: "\u2554", // ╔
  tr: "\u2557", // ╗
  bl: "\u255A", // ╚
  br: "\u255D", // ╝
  h: "\u2550", // ═
  v: "\u2551", // ║
} as const;

export function ASCIIBorder({
  children,
  double = false,
  className,
  borderColor,
  width,
}: ASCIIBorderProps) {
  const chars = double ? DOUBLE : SINGLE;
  const colorStyle = borderColor ? { color: borderColor } : undefined;
  const widthStyle = width ? { width: `${width}ch` } : undefined;

  return (
    <div className={`${styles.border} ${className ?? ""}`} style={{ ...colorStyle, ...widthStyle }}>
      <div className={styles.row}>
        <span className={styles.topLeft}>{chars.tl}</span>
        <span className={styles.content} style={{ overflow: "hidden" }}>
          {chars.h.repeat(200)}
        </span>
        <span className={styles.topRight}>{chars.tr}</span>
      </div>
      <div className={styles.middleRow}>
        <span className={styles.vertical}>{chars.v}</span>
        <div className={styles.innerContent}>{children}</div>
        <span className={styles.vertical}>{chars.v}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.bottomLeft}>{chars.bl}</span>
        <span className={styles.content} style={{ overflow: "hidden" }}>
          {chars.h.repeat(200)}
        </span>
        <span className={styles.bottomRight}>{chars.br}</span>
      </div>
    </div>
  );
}
