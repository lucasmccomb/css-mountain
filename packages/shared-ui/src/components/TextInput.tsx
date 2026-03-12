import { type ChangeEvent, type KeyboardEvent, useRef, useState, useCallback } from "react";
import styles from "./TextInput.module.css";

interface TextInputProps {
  /** Current value */
  value: string;
  /** Called when value changes */
  onChange: (value: string) => void;
  /** Called when Enter is pressed */
  onSubmit?: (value: string) => void;
  /** DOS-style prompt prefix (e.g., "C:\>") */
  prompt?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS class */
  className?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
}

export function TextInput({
  value,
  onChange,
  onSubmit,
  prompt = "",
  placeholder,
  className,
  autoFocus = false,
}: TextInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && onSubmit) {
        e.preventDefault();
        onSubmit(value);
      }
    },
    [onSubmit, value],
  );

  const handleContainerClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className={`${styles.container} ${className ?? ""}`} onClick={handleContainerClick}>
      {prompt && <span className={styles.prompt}>{prompt}</span>}
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-label={prompt || "Text input"}
        />
        {focused && (
          <span
            className={styles.cursor}
            style={{ left: `${value.length}ch` }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}
