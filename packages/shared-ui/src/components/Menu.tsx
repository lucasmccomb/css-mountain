import { useRef, useEffect, useCallback } from "react";
import { useKeyboardNav } from "../hooks/useKeyboardNav";
import styles from "./Menu.module.css";

interface MenuItem {
  id: string;
  label: string;
  disabled?: boolean;
}

interface MenuProps {
  items: MenuItem[];
  /** Called when a menu item is selected (Enter or click) */
  onSelect: (id: string) => void;
  /** Called when Escape is pressed */
  onClose?: () => void;
  /** Additional CSS class */
  className?: string;
  /** Initially active item index */
  initialIndex?: number;
}

export function Menu({ items, onSelect, onClose, className, initialIndex = 0 }: MenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const enabledIndices = items.reduce<number[]>((acc, item, i) => {
    if (!item.disabled) acc.push(i);
    return acc;
  }, []);

  const { activeIndex } = useKeyboardNav({
    itemCount: items.length,
    enabledIndices,
    onSelect: (index) => {
      const item = items[index];
      if (item && !item.disabled) {
        onSelect(item.id);
      }
    },
    onClose,
    initialIndex,
    containerRef,
  });

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const handleClick = useCallback(
    (item: MenuItem) => {
      if (!item.disabled) {
        onSelect(item.id);
      }
    },
    [onSelect],
  );

  return (
    <div
      ref={containerRef}
      className={`${styles.menu} ${className ?? ""}`}
      role="listbox"
      tabIndex={0}
      aria-label="Menu"
    >
      {items.map((item, index) => {
        const isActive = index === activeIndex;
        const itemClasses = [
          styles.item,
          isActive ? styles.itemActive : "",
          item.disabled ? styles.itemDisabled : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div
            key={item.id}
            className={itemClasses}
            role="option"
            aria-selected={isActive}
            aria-disabled={item.disabled}
            onClick={() => handleClick(item)}
          >
            {isActive ? "\u25B8 " : "  "}
            {item.label}
          </div>
        );
      })}
    </div>
  );
}
