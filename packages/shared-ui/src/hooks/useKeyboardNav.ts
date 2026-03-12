import { useState, useEffect, useCallback, type RefObject } from "react";

interface UseKeyboardNavOptions {
  /** Total number of items */
  itemCount: number;
  /** Indices of enabled (selectable) items. If omitted, all items are enabled. */
  enabledIndices?: number[];
  /** Called when Enter is pressed on the active item */
  onSelect?: (index: number) => void;
  /** Called when Escape is pressed */
  onClose?: () => void;
  /** Initial active index */
  initialIndex?: number;
  /** Container element ref for attaching keyboard listeners */
  containerRef?: RefObject<HTMLElement | null>;
}

interface UseKeyboardNavResult {
  /** Currently highlighted index */
  activeIndex: number;
  /** Manually set the active index */
  setActiveIndex: (index: number) => void;
}

/**
 * Hook for keyboard navigation in menus and lists.
 *
 * Handles ArrowUp, ArrowDown, Home, End, Enter, and Escape.
 * Skips disabled items when navigating.
 */
export function useKeyboardNav({
  itemCount,
  enabledIndices,
  onSelect,
  onClose,
  initialIndex = 0,
  containerRef,
}: UseKeyboardNavOptions): UseKeyboardNavResult {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const findNextEnabled = useCallback(
    (current: number, direction: 1 | -1): number => {
      if (!enabledIndices || enabledIndices.length === 0) {
        const next = current + direction;
        if (next < 0) return 0;
        if (next >= itemCount) return itemCount - 1;
        return next;
      }

      const currentPos = enabledIndices.indexOf(current);
      if (currentPos === -1) {
        // Current not in enabled list, find nearest
        return enabledIndices[0] ?? 0;
      }

      const nextPos = currentPos + direction;
      if (nextPos < 0) return enabledIndices[0] ?? 0;
      if (nextPos >= enabledIndices.length) return enabledIndices[enabledIndices.length - 1] ?? 0;
      return enabledIndices[nextPos] ?? current;
    },
    [enabledIndices, itemCount],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
        case "j": {
          e.preventDefault();
          setActiveIndex((prev) => findNextEnabled(prev, 1));
          break;
        }
        case "ArrowUp":
        case "k": {
          e.preventDefault();
          setActiveIndex((prev) => findNextEnabled(prev, -1));
          break;
        }
        case "Home": {
          e.preventDefault();
          const first = enabledIndices?.[0] ?? 0;
          setActiveIndex(first);
          break;
        }
        case "End": {
          e.preventDefault();
          const last = enabledIndices?.[enabledIndices.length - 1] ?? itemCount - 1;
          setActiveIndex(last);
          break;
        }
        case "Enter": {
          e.preventDefault();
          onSelect?.(activeIndex);
          break;
        }
        case "Escape": {
          e.preventDefault();
          onClose?.();
          break;
        }
      }
    },
    [activeIndex, findNextEnabled, enabledIndices, itemCount, onSelect, onClose],
  );

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;

    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [containerRef, handleKeyDown]);

  return { activeIndex, setActiveIndex };
}
