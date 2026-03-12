import styles from "./Preview.module.css";

interface PreviewProps {
  /** Challenge HTML template */
  html: string;
  /** User's CSS code */
  css: string;
  /** Ref callback for attaching the iframe sandbox */
  containerRef: (el: HTMLDivElement | null) => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * Live preview panel showing the user's CSS applied to the challenge HTML.
 * Delegates iframe rendering to the useLivePreview hook's containerRef.
 */
export function Preview({ containerRef, className }: PreviewProps) {
  return (
    <div className={`${styles.preview} ${className ?? ""}`} data-testid="preview-panel">
      <div className={styles.label}>YOUR OUTPUT</div>
      <div ref={containerRef} className={styles.iframeContainer} />
    </div>
  );
}
