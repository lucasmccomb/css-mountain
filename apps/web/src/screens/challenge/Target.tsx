import { useRef, useEffect } from "react";
import { IframeSandbox } from "@css-mountain/runner-css";
import styles from "./Target.module.css";

interface TargetProps {
  /** Challenge HTML template */
  html: string;
  /** Reference CSS solution to display as the target */
  referenceCss: string;
  /** Additional CSS class */
  className?: string;
}

/**
 * Target design panel showing what the player needs to match.
 * Renders the challenge HTML with a reference solution CSS in a sandboxed iframe.
 */
export function Target({ html, referenceCss, className }: TargetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sandboxRef = useRef<IframeSandbox | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const sandbox = new IframeSandbox();
    sandbox.create(containerRef.current);
    sandbox.updateContent(html, referenceCss);
    sandboxRef.current = sandbox;

    return () => {
      sandbox.destroy();
      sandboxRef.current = null;
    };
  }, [html, referenceCss]);

  return (
    <div className={`${styles.target} ${className ?? ""}`} data-testid="target-panel">
      <div className={styles.label}>TARGET</div>
      <div ref={containerRef} className={styles.iframeContainer} />
    </div>
  );
}
