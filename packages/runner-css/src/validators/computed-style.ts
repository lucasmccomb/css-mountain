import type { IframeSandbox } from "../iframe-sandbox";

/**
 * Rule definition for computed style validation.
 */
export interface ComputedStyleRule {
  /** CSS selector to target the element */
  selector: string;
  /** CSS property to check (e.g., "color", "display") */
  property: string;
  /** Expected computed value (e.g., "rgb(255, 0, 0)", "flex") */
  expected: string;
}

/**
 * Result of a computed style validation check.
 */
export interface ComputedStyleResult {
  passed: boolean;
  actual: string | null;
  message: string;
}

/**
 * Validate that a computed CSS property value on a specific element
 * matches the expected value.
 *
 * Uses the iframe sandbox's postMessage bridge to retrieve the
 * computed style from the sandboxed document.
 */
export async function validateComputedStyle(
  sandbox: IframeSandbox,
  rule: ComputedStyleRule,
): Promise<ComputedStyleResult> {
  try {
    const actual = await sandbox.getComputedStyle(rule.selector, rule.property);

    if (actual === null) {
      return {
        passed: false,
        actual: null,
        message: `Element '${rule.selector}' not found or property '${rule.property}' could not be read`,
      };
    }

    // Normalize whitespace for comparison
    const normalizedActual = actual.trim().toLowerCase();
    const normalizedExpected = rule.expected.trim().toLowerCase();

    const passed = normalizedActual === normalizedExpected;

    return {
      passed,
      actual,
      message: passed
        ? `'${rule.property}' on '${rule.selector}' matches expected value '${rule.expected}'`
        : `'${rule.property}' on '${rule.selector}': expected '${rule.expected}', got '${actual}'`,
    };
  } catch (error) {
    return {
      passed: false,
      actual: null,
      message: `Error checking computed style: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
