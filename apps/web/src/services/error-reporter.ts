/**
 * Lightweight error tracking service.
 *
 * Catches unhandled errors and API failures, stores them in a local
 * ring buffer, and optionally syncs to the API's error_log endpoint
 * when the feature is available.
 *
 * No external error tracking service is used - all errors are logged
 * to the console and stored locally.
 */

/** Maximum number of error entries to store locally */
const MAX_ERRORS = 50;

/** localStorage key for the error log */
const ERROR_LOG_KEY = "css-mountain:error-log";

// ── Error entry type ────────────────────────────────────────────────────────

export interface ErrorEntry {
  /** ISO timestamp */
  timestamp: string;
  /** Error category */
  category: "unhandled" | "api" | "render" | "validation" | "network";
  /** Error message */
  message: string;
  /** Stack trace, if available */
  stack: string | null;
  /** Additional context (URL, component name, etc.) */
  context: Record<string, string>;
}

// ── Local error log ─────────────────────────────────────────────────────────

function loadErrorLog(): ErrorEntry[] {
  try {
    const raw = localStorage.getItem(ERROR_LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ErrorEntry[];
  } catch {
    return [];
  }
}

function saveErrorLog(log: ErrorEntry[]): void {
  try {
    // Ring buffer - keep only the most recent entries
    const trimmed = log.slice(-MAX_ERRORS);
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage unavailable or full - silently ignore
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Record an error in the local error log.
 * Also logs to the browser console.
 */
export function reportError(
  category: ErrorEntry["category"],
  error: Error | string,
  context: Record<string, string> = {},
): void {
  const entry: ErrorEntry = {
    timestamp: new Date().toISOString(),
    category,
    message: typeof error === "string" ? error : error.message,
    stack: typeof error === "string" ? null : (error.stack ?? null),
    context: {
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...context,
    },
  };

  // Log to console
  console.error(`[CSS Mountain ${category}]`, entry.message, context);

  // Persist to local ring buffer
  const log = loadErrorLog();
  log.push(entry);
  saveErrorLog(log);
}

/**
 * Get all stored error entries.
 * Useful for displaying in a debug/diagnostics panel.
 */
export function getErrorLog(): ErrorEntry[] {
  return loadErrorLog();
}

/**
 * Clear the error log.
 */
export function clearErrorLog(): void {
  try {
    localStorage.removeItem(ERROR_LOG_KEY);
  } catch {
    // Silently ignore
  }
}

/**
 * Initialize global error handlers.
 * Captures unhandled errors and unhandled promise rejections.
 *
 * Call once at app startup. Returns a cleanup function.
 */
export function initErrorReporter(): () => void {
  const handleError = (event: ErrorEvent) => {
    reportError("unhandled", event.error ?? event.message, {
      filename: event.filename ?? "unknown",
      line: String(event.lineno ?? 0),
      col: String(event.colno ?? 0),
    });
  };

  const handleRejection = (event: PromiseRejectionEvent) => {
    const error =
      event.reason instanceof Error
        ? event.reason
        : String(event.reason ?? "Unknown rejection");
    reportError("unhandled", error, { type: "promise-rejection" });
  };

  window.addEventListener("error", handleError);
  window.addEventListener("unhandledrejection", handleRejection);

  return () => {
    window.removeEventListener("error", handleError);
    window.removeEventListener("unhandledrejection", handleRejection);
  };
}
