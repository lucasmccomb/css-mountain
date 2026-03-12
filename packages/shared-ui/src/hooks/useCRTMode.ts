import { useState, useCallback, useEffect } from "react";

const CRT_STORAGE_KEY = "css-mountain-crt-mode";

interface UseCRTModeResult {
  /** Whether CRT mode is currently enabled */
  enabled: boolean;
  /** Toggle CRT mode on/off */
  toggle: () => void;
  /** Explicitly set CRT mode */
  setEnabled: (value: boolean) => void;
}

/**
 * Hook for CRT scanline mode toggle.
 *
 * Persists preference to localStorage. Defaults to enabled.
 */
export function useCRTMode(defaultEnabled = true): UseCRTModeResult {
  const [enabled, setEnabledState] = useState<boolean>(() => {
    if (typeof window === "undefined") return defaultEnabled;
    try {
      const stored = localStorage.getItem(CRT_STORAGE_KEY);
      if (stored !== null) return stored === "true";
    } catch {
      // localStorage not available
    }
    return defaultEnabled;
  });

  useEffect(() => {
    try {
      localStorage.setItem(CRT_STORAGE_KEY, String(enabled));
    } catch {
      // localStorage not available
    }
  }, [enabled]);

  const toggle = useCallback(() => {
    setEnabledState((prev) => !prev);
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
  }, []);

  return { enabled, toggle, setEnabled };
}
