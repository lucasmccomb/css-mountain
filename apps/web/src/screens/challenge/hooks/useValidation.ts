import { useCallback, useRef, useEffect } from "react";
import type { Challenge } from "@css-mountain/core";
import { CSSRunner } from "@css-mountain/runner-css";
import type { RunnerValidationResult } from "./useChallenge";

/**
 * Hook that manages a CSSRunner instance for validating challenge submissions.
 *
 * Returns a validate function that can be passed to useChallenge.
 */
export function useValidation(): {
  /** Validate CSS code against a challenge. Suitable as the validateFn for useChallenge. */
  validate: (css: string, challenge: Challenge) => Promise<RunnerValidationResult>;
} {
  const runnerRef = useRef<CSSRunner | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Create a hidden container for the validation iframe
  useEffect(() => {
    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.left = "-9999px";
    div.style.top = "-9999px";
    div.style.width = "400px";
    div.style.height = "300px";
    div.style.overflow = "hidden";
    document.body.appendChild(div);
    containerRef.current = div;

    return () => {
      if (runnerRef.current) {
        runnerRef.current.destroy();
        runnerRef.current = null;
      }
      div.remove();
      containerRef.current = null;
    };
  }, []);

  const validate = useCallback(
    async (css: string, challenge: Challenge): Promise<RunnerValidationResult> => {
      // Destroy previous runner if exists
      if (runnerRef.current) {
        runnerRef.current.destroy();
      }

      const runner = new CSSRunner();
      runnerRef.current = runner;

      await runner.initialize();
      await runner.loadChallenge(challenge);

      // Render into the hidden container
      if (containerRef.current) {
        await runner.renderPreview(containerRef.current);
      }

      // Execute the user's CSS
      await runner.executeUserCode(css);

      // Wait a frame for the iframe to render
      await new Promise((resolve) => requestAnimationFrame(resolve));

      // Run validation
      const result = await runner.validate();
      return result;
    },
    [],
  );

  return { validate };
}
