import type { ValidationRule, RuleResult } from "../types";

/**
 * Validate a computed-style rule by checking getComputedStyle() on the target element.
 */
export function validateComputedStyle(
  rule: ValidationRule,
  doc: Document
): RuleResult {
  const element = doc.querySelector(rule.selector);
  if (!element) {
    return {
      rule,
      passed: false,
      actual: null,
      message: `Element not found: ${rule.selector}`,
    };
  }

  if (!rule.property) {
    return {
      rule,
      passed: false,
      actual: null,
      message: `No property specified for computed-style rule on ${rule.selector}`,
    };
  }

  const computed = getComputedStyle(element);
  const actual = computed.getPropertyValue(rule.property).trim();

  const passed = matchesExpected(actual, rule.expected);

  return {
    rule,
    passed,
    actual,
    message: passed
      ? `${rule.selector} { ${rule.property} } matches expected value`
      : rule.message,
  };
}

/**
 * Check if an actual CSS value matches the expected value.
 * Supports string comparison, numeric comparison, and numeric range.
 */
function matchesExpected(
  actual: string,
  expected: string | number | { min: number; max: number }
): boolean {
  if (typeof expected === "string") {
    // Normalize whitespace and compare case-insensitively
    return normalizeValue(actual) === normalizeValue(expected);
  }

  const numActual = parseFloat(actual);
  if (isNaN(numActual)) return false;

  if (typeof expected === "number") {
    return Math.abs(numActual - expected) < 0.5;
  }

  // Range check
  return numActual >= expected.min && numActual <= expected.max;
}

/**
 * Normalize a CSS value for comparison:
 * - Lowercase
 * - Collapse whitespace
 * - Trim
 */
function normalizeValue(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}
