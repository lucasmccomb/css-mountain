import { type ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: "default" | "primary" | "danger";
}

export function Button({ variant = "default", className, children, ...props }: ButtonProps) {
  const variantClass = variant !== "default" ? styles[variant] : "";

  return (
    <button
      className={`${styles.button} ${variantClass} ${className ?? ""}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
