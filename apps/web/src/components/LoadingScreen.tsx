import { useState, useEffect } from "react";
import styles from "./LoadingScreen.module.css";

interface LoadingScreenProps {
  /** Message displayed above the loading animation */
  message?: string;
}

/**
 * DOS-styled loading screen with blinking cursor and animated dots.
 */
export function LoadingScreen({
  message = "LOADING",
}: LoadingScreenProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container} data-testid="loading-screen">
      <div className={styles.row}>
        <span className={styles.text}>{message}</span>
        <span className={styles.dots}>{dots}</span>
        <span className={styles.cursor}>_</span>
      </div>
    </div>
  );
}
