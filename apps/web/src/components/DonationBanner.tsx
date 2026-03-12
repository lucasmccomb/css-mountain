import { useState, useCallback } from "react";
import styles from "./DonationBanner.module.css";

/** localStorage key to track dismissal */
const DISMISSED_KEY = "css-mountain:donation-dismissed";

interface DonationBannerProps {
  /** GitHub Sponsors URL */
  sponsorUrl?: string;
  /** Ko-fi URL */
  kofiUrl?: string;
}

/**
 * Tasteful donation banner for the main menu.
 * Shown only on the main menu, not during gameplay.
 * Can be dismissed and remembers the dismissal.
 */
export function DonationBanner({
  sponsorUrl = "https://github.com/sponsors/cssmountain",
  kofiUrl = "https://ko-fi.com/cssmountain",
}: DonationBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // localStorage unavailable
    }
  }, []);

  if (dismissed) return null;

  return (
    <div className={styles.banner} data-testid="donation-banner" role="complementary">
      <span className={styles.icon} aria-hidden="true">
        {"<3"}
      </span>
      <span className={styles.text}>
        Enjoy CSS Mountain?{" "}
        <a
          href={sponsorUrl}
          className={styles.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          Sponsor
        </a>
        {" or "}
        <a
          href={kofiUrl}
          className={styles.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ko-fi
        </a>
      </span>
      <button
        className={styles.dismiss}
        onClick={handleDismiss}
        aria-label="Dismiss donation banner"
        type="button"
      >
        [x]
      </button>
    </div>
  );
}
