import { useCallback } from "react";
import styles from "./MobileToolbar.module.css";

interface MobileToolbarProps {
  /** Callback to insert text at the current cursor position */
  onInsert: (text: string) => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * CSS-specific keyboard shortcut toolbar for mobile devices.
 * Provides one-tap access to common CSS characters and units.
 */
const TOOLBAR_KEYS = [
  { label: "{", insert: "{ " },
  { label: "}", insert: " }" },
  { label: ":", insert: ": " },
  { label: ";", insert: ";\n" },
  { label: ".", insert: "." },
  { label: "#", insert: "#" },
  { label: "px", insert: "px" },
  { label: "em", insert: "em" },
  { label: "%", insert: "%" },
  { label: "rem", insert: "rem" },
  { label: "flex", insert: "flex" },
  { label: "grid", insert: "grid" },
];

export function MobileToolbar({ onInsert, className }: MobileToolbarProps) {
  const handleKeyPress = useCallback(
    (text: string) => {
      onInsert(text);
    },
    [onInsert],
  );

  return (
    <div
      className={`${styles.toolbar} ${className ?? ""}`}
      data-testid="mobile-toolbar"
      role="toolbar"
      aria-label="CSS keyboard shortcuts"
    >
      {TOOLBAR_KEYS.map((key) => (
        <button
          key={key.label}
          type="button"
          className={styles.key}
          onClick={() => handleKeyPress(key.insert)}
          aria-label={`Insert ${key.label}`}
        >
          {key.label}
        </button>
      ))}
    </div>
  );
}
