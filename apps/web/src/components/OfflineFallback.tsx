import { useState, useEffect } from "react";
import styles from "./OfflineFallback.module.css";

/**
 * Offline indicator banner shown at the bottom of the screen
 * when the network connection is lost.
 *
 * Progress is saved locally and syncs when back online.
 */
export function OfflineFallback() {
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      className={styles.banner}
      data-testid="offline-banner"
      role="status"
      aria-live="polite"
    >
      <span className={styles.icon} aria-hidden="true">
        [!]
      </span>
      <span className={styles.text}>
        OFFLINE - Progress saved locally. Will sync when connection returns.
      </span>
    </div>
  );
}
