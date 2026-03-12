import type { IframeSandbox } from "../iframe-sandbox";

/**
 * Rule definition for property existence check.
 */
export interface PropertyCheckRule {
  /** CSS selector to target the element */
  selector: string;
  /** CSS property to check for (e.g., "display", "flex-direction") */
  property: string;
}

/**
 * Result of a property existence check.
 */
export interface PropertyCheckResult {
  passed: boolean;
  message: string;
}

/**
 * Check if a specific CSS property is applied to an element.
 *
 * A property is considered "applied" if getComputedStyle returns
 * a non-empty, non-null value for it. This checks that the property
 * has been explicitly set or inherited with a meaningful value.
 *
 * Uses the iframe sandbox's postMessage bridge to retrieve the
 * computed style from the sandboxed document.
 */
export async function validatePropertyExists(
  sandbox: IframeSandbox,
  rule: PropertyCheckRule,
): Promise<PropertyCheckResult> {
  try {
    const value = await sandbox.getComputedStyle(rule.selector, rule.property);

    if (value === null) {
      return {
        passed: false,
        message: `Element '${rule.selector}' not found or property '${rule.property}' could not be read`,
      };
    }

    // A property "exists" if it has a non-empty computed value
    const passed = value.trim() !== "";

    return {
      passed,
      message: passed
        ? `Property '${rule.property}' is applied to '${rule.selector}' (value: '${value}')`
        : `Property '${rule.property}' is not applied to '${rule.selector}'`,
    };
  } catch (error) {
    return {
      passed: false,
      message: `Error checking property: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
