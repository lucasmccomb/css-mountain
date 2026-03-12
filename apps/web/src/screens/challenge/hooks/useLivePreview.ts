import { useRef, useEffect, useCallback } from "react";
import { IframeSandbox, LivePreviewEngine } from "@css-mountain/runner-css";

/**
 * Debounced live preview hook that manages an IframeSandbox and LivePreviewEngine.
 *
 * Returns a ref callback for the preview container and methods to update/force-update.
 */
export function useLivePreview(
  html: string,
  css: string,
  debounceMs = 500,
): {
  /** Ref callback - attach to the preview container div */
  containerRef: (el: HTMLDivElement | null) => void;
  /** Force an immediate preview update */
  forceUpdate: () => void;
} {
  const sandboxRef = useRef<IframeSandbox | null>(null);
  const engineRef = useRef<LivePreviewEngine | null>(null);
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const htmlRef = useRef(html);
  const cssRef = useRef(css);

  htmlRef.current = html;
  cssRef.current = css;

  // Set up sandbox when container mounts
  const containerRef = useCallback(
    (el: HTMLDivElement | null) => {
      containerElRef.current = el;

      // Clean up previous sandbox
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      if (sandboxRef.current) {
        sandboxRef.current.destroy();
        sandboxRef.current = null;
      }

      if (el) {
        const sandbox = new IframeSandbox();
        sandbox.create(el);
        sandbox.updateContent(htmlRef.current, cssRef.current);

        const engine = new LivePreviewEngine(sandbox, debounceMs);

        sandboxRef.current = sandbox;
        engineRef.current = engine;
      }
    },
    [debounceMs],
  );

  // Debounced update whenever CSS changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.update(html, css);
    }
  }, [html, css]);

  // Force immediate update
  const forceUpdate = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.forceUpdate(htmlRef.current, cssRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      if (sandboxRef.current) {
        sandboxRef.current.destroy();
        sandboxRef.current = null;
      }
    };
  }, []);

  return { containerRef, forceUpdate };
}
