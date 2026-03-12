import styles from "./CRTOverlay.module.css";

interface CRTOverlayProps {
  /** Whether the CRT effect is enabled */
  enabled: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * Toggleable CRT scanline effect overlay.
 *
 * Uses CSS repeating-linear-gradient for performant scanlines.
 * pointer-events: none ensures it doesn't interfere with interaction.
 */
export function CRTOverlay({ enabled, className }: CRTOverlayProps) {
  return (
    <div
      className={`${styles.overlay} ${enabled ? "" : styles.hidden} ${className ?? ""}`}
      aria-hidden="true"
      data-testid="crt-overlay"
    />
  );
}
