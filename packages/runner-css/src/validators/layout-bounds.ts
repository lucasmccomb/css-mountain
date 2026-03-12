import type { IframeSandbox } from "../iframe-sandbox";

/**
 * Rule definition for layout bounds validation.
 */
export interface LayoutBoundsRule {
  /** CSS selector to target the element */
  selector: string;
  /** Expected bounds constraints */
  expected: {
    /** Minimum value (inclusive) */
    min?: number;
    /** Maximum value (inclusive) */
    max?: number;
    /** Which dimension to check */
    property: "width" | "height" | "top" | "left";
  };
}

/**
 * Result of a layout bounds validation check.
 */
export interface LayoutBoundsResult {
  passed: boolean;
  actual: number | null;
  message: string;
}

/**
 * Validate that an element's bounding rect dimension falls within
 * the specified range.
 *
 * Uses the iframe sandbox's postMessage bridge to retrieve the
 * bounding client rect from the sandboxed document.
 */
export async function validateLayoutBounds(
  sandbox: IframeSandbox,
  rule: LayoutBoundsRule,
): Promise<LayoutBoundsResult> {
  try {
    const rect = await sandbox.getBoundingRect(rule.selector);

    if (rect === null) {
      return {
        passed: false,
        actual: null,
        message: `Element '${rule.selector}' not found`,
      };
    }

    const actual = rect[rule.expected.property];

    let passed = true;
    const constraints: string[] = [];

    if (rule.expected.min !== undefined) {
      if (actual < rule.expected.min) {
        passed = false;
      }
      constraints.push(`min ${rule.expected.min}`);
    }

    if (rule.expected.max !== undefined) {
      if (actual > rule.expected.max) {
        passed = false;
      }
      constraints.push(`max ${rule.expected.max}`);
    }

    const constraintStr = constraints.join(", ");

    return {
      passed,
      actual,
      message: passed
        ? `'${rule.expected.property}' of '${rule.selector}' is ${actual}px (within ${constraintStr})`
        : `'${rule.expected.property}' of '${rule.selector}' is ${actual}px (expected ${constraintStr})`,
    };
  } catch (error) {
    return {
      passed: false,
      actual: null,
      message: `Error checking layout bounds: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
