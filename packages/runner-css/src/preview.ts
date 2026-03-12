import type { IframeSandbox } from "./iframe-sandbox";

/**
 * Default debounce delay for live preview updates (milliseconds).
 */
const DEFAULT_DEBOUNCE_MS = 500;

/**
 * Debounced live preview engine that updates the iframe as the user types.
 *
 * Provides both debounced (for typing) and immediate (for explicit actions)
 * update methods.
 */
export class LivePreviewEngine {
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private sandbox: IframeSandbox;
  private debounceMs: number;

  constructor(sandbox: IframeSandbox, debounceMs?: number) {
    this.sandbox = sandbox;
    this.debounceMs = debounceMs ?? DEFAULT_DEBOUNCE_MS;
  }

  /**
   * Update the preview with a debounce delay.
   * Subsequent calls within the debounce window cancel the previous update.
   * Use this for live typing updates.
   */
  update(html: string, css: string): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.sandbox.updateContent(html, css);
    }, this.debounceMs);
  }

  /**
   * Immediately update the preview without debouncing.
   * Cancels any pending debounced update.
   * Use this for explicit "run" actions.
   */
  forceUpdate(html: string, css: string): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.sandbox.updateContent(html, css);
  }

  /**
   * Clean up timers.
   */
  destroy(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}
