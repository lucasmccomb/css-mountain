import { type ReactNode, useEffect, useRef, useCallback } from "react";
import { Button } from "./Button";
import styles from "./Dialog.module.css";

interface DialogProps {
  /** Dialog title shown in the title bar */
  title: string;
  /** Dialog body content */
  children: ReactNode;
  /** Whether the dialog is visible */
  open: boolean;
  /** Called when OK is clicked */
  onConfirm?: () => void;
  /** Called when Cancel is clicked or Escape pressed */
  onCancel?: () => void;
  /** Label for the confirm button */
  confirmLabel?: string;
  /** Label for the cancel button */
  cancelLabel?: string;
  /** Hide the cancel button (for alert-style dialogs) */
  hideCancel?: boolean;
}

export function Dialog({
  title,
  children,
  open,
  onConfirm,
  onCancel,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  hideCancel = false,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel?.();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onConfirm?.();
      }
    },
    [onCancel, onConfirm],
  );

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onCancel} role="presentation">
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-label={title}
        aria-modal="true"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top border */}
        <div className={styles.topBorder}>
          <span className={styles.corner}>{"\u2554"}</span>
          <span className={styles.fill}>{"\u2550".repeat(200)}</span>
          <span className={styles.corner}>{"\u2557"}</span>
        </div>

        {/* Title bar */}
        <div className={styles.titleBar}>
          <span className={styles.side}>{"\u2551"}</span>
          <span className={styles.titleText}>{` ${title} `}</span>
          <span className={styles.side}>{"\u2551"}</span>
        </div>

        {/* Separator */}
        <div className={styles.separatorBorder}>
          <span className={styles.corner}>{"\u2560"}</span>
          <span className={styles.fill}>{"\u2550".repeat(200)}</span>
          <span className={styles.corner}>{"\u2563"}</span>
        </div>

        {/* Content */}
        <div className={styles.contentRow}>
          <span className={styles.side}>{"\u2551"}</span>
          <div className={styles.content}>{children}</div>
          <span className={styles.side}>{"\u2551"}</span>
        </div>

        {/* Separator before actions */}
        <div className={styles.separatorBorder}>
          <span className={styles.corner}>{"\u2560"}</span>
          <span className={styles.fill}>{"\u2550".repeat(200)}</span>
          <span className={styles.corner}>{"\u2563"}</span>
        </div>

        {/* Actions */}
        <div className={styles.actionsRow}>
          <span className={styles.side}>{"\u2551"}</span>
          <div className={styles.actions}>
            <Button variant="primary" onClick={onConfirm}>
              {confirmLabel}
            </Button>
            {!hideCancel && <Button onClick={onCancel}>{cancelLabel}</Button>}
          </div>
          <span className={styles.side}>{"\u2551"}</span>
        </div>

        {/* Bottom border */}
        <div className={styles.bottomBorder}>
          <span className={styles.corner}>{"\u255A"}</span>
          <span className={styles.fill}>{"\u2550".repeat(200)}</span>
          <span className={styles.corner}>{"\u255D"}</span>
        </div>
      </div>
    </div>
  );
}
