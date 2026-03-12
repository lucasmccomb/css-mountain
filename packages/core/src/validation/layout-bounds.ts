import type { ValidationRule, RuleResult } from "../types";

/**
 * Layout properties we can extract from getBoundingClientRect().
 */
const LAYOUT_PROPERTIES = new Set([
  "width",
  "height",
  "top",
  "right",
  "bottom",
  "left",
  "x",
  "y",
]);

/**
 * Validate a layout-bounds rule by checking getBoundingClientRect() on the target element.
 */
export function validateLayoutBounds(
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
      message: `No property specified for layout-bounds rule on ${rule.selector}`,
    };
  }

  if (!LAYOUT_PROPERTIES.has(rule.property)) {
    return {
      rule,
      passed: false,
      actual: null,
      message: `Unknown layout property: ${rule.property}. Valid: ${Array.from(LAYOUT_PROPERTIES).join(", ")}`,
    };
  }

  const rect = element.getBoundingClientRect();
  const actual = rect[rule.property as keyof DOMRect] as number;

  const passed = matchesExpectedNumeric(actual, rule.expected);

  return {
    rule,
    passed,
    actual,
    message: passed
      ? `${rule.selector} ${rule.property} is ${actual}px (matches expected)`
      : rule.message,
  };
}

/**
 * Check if a numeric layout value matches the expected value or range.
 */
function matchesExpectedNumeric(
  actual: number,
  expected: string | number | { min: number; max: number }
): boolean {
  if (typeof expected === "string") {
    const numExpected = parseFloat(expected);
    if (isNaN(numExpected)) return false;
    return Math.abs(actual - numExpected) < 1;
  }

  if (typeof expected === "number") {
    // Allow 1px tolerance for layout calculations
    return Math.abs(actual - expected) < 1;
  }

  // Range check
  return actual >= expected.min && actual <= expected.max;
}
