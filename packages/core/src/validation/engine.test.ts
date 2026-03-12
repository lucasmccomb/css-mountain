import { describe, it, expect, vi } from "vitest";
import { runValidation } from "./engine";
import type { ValidationRule } from "../types";

/**
 * Create a mock Document with elements that return specific computed styles
 * and bounding rects.
 */
function createMockDocument(
  elements: Record<
    string,
    { styles?: Record<string, string>; rect?: Partial<DOMRect> }
  >
): Document {
  return {
    querySelector: vi.fn((selector: string) => {
      const config = elements[selector];
      if (!config) return null;

      return {
        getBoundingClientRect: () => ({
          width: 0,
          height: 0,
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
          ...config.rect,
        }),
      };
    }),
  } as unknown as Document;
}

// Mock getComputedStyle globally
vi.stubGlobal("getComputedStyle", (element: unknown) => {
  // The element will have a _styles property from our mock
  const el = element as { _styles?: Record<string, string> };
  const styles = el._styles || {};
  return {
    getPropertyValue: (prop: string) => styles[prop] || "",
  };
});

describe("runValidation", () => {
  it("returns passed=true when all rules pass", () => {
    const rules: ValidationRule[] = [
      {
        type: "layout-bounds",
        selector: ".box",
        property: "width",
        expected: { min: 95, max: 105 },
        weight: 100,
        message: "Width should be ~100px",
      },
    ];

    const doc = createMockDocument({
      ".box": { rect: { width: 100 } },
    });

    const result = runValidation({
      rules,
      document: doc,
      cssSource: ".box { width: 100px; }",
      timeSpentMs: 30000,
      hintsUsed: 0,
      solutionViewed: false,
    });

    expect(result.passed).toBe(true);
    expect(result.ruleResults).toHaveLength(1);
    expect(result.ruleResults[0].passed).toBe(true);
  });

  it("returns passed=false when a rule fails", () => {
    const rules: ValidationRule[] = [
      {
        type: "layout-bounds",
        selector: ".box",
        property: "width",
        expected: 200,
        weight: 100,
        message: "Width should be 200px",
      },
    ];

    const doc = createMockDocument({
      ".box": { rect: { width: 100 } },
    });

    const result = runValidation({
      rules,
      document: doc,
      cssSource: ".box { width: 100px; }",
      timeSpentMs: 30000,
      hintsUsed: 0,
      solutionViewed: false,
    });

    expect(result.passed).toBe(false);
    expect(result.feedback).toContain("Width should be 200px");
  });

  it("handles missing elements gracefully", () => {
    const rules: ValidationRule[] = [
      {
        type: "computed-style",
        selector: ".nonexistent",
        property: "color",
        expected: "red",
        weight: 100,
        message: "Color should be red",
      },
    ];

    const doc = createMockDocument({});

    const result = runValidation({
      rules,
      document: doc,
      cssSource: ".test { color: red; }",
      timeSpentMs: 30000,
      hintsUsed: 0,
      solutionViewed: false,
    });

    expect(result.passed).toBe(false);
    expect(result.ruleResults[0].actual).toBeNull();
  });

  it("includes solution viewed feedback", () => {
    const rules: ValidationRule[] = [
      {
        type: "layout-bounds",
        selector: ".box",
        property: "width",
        expected: { min: 95, max: 105 },
        weight: 100,
        message: "Width ok",
      },
    ];

    const doc = createMockDocument({
      ".box": { rect: { width: 100 } },
    });

    const result = runValidation({
      rules,
      document: doc,
      cssSource: ".box { width: 100px; }",
      timeSpentMs: 30000,
      hintsUsed: 0,
      solutionViewed: true,
    });

    expect(result.feedback.some((f) => f.includes("Solution was viewed"))).toBe(
      true
    );
  });

  it("includes hint usage feedback", () => {
    const rules: ValidationRule[] = [
      {
        type: "layout-bounds",
        selector: ".box",
        property: "width",
        expected: { min: 95, max: 105 },
        weight: 100,
        message: "Width ok",
      },
    ];

    const doc = createMockDocument({
      ".box": { rect: { width: 100 } },
    });

    const result = runValidation({
      rules,
      document: doc,
      cssSource: ".box { width: 100px; }",
      timeSpentMs: 30000,
      hintsUsed: 2,
      solutionViewed: false,
    });

    expect(result.feedback.some((f) => f.includes("2 hint(s) used"))).toBe(
      true
    );
  });

  it("runs multiple rules and aggregates results", () => {
    const rules: ValidationRule[] = [
      {
        type: "layout-bounds",
        selector: ".box",
        property: "width",
        expected: { min: 95, max: 105 },
        weight: 50,
        message: "Width check",
      },
      {
        type: "layout-bounds",
        selector: ".box",
        property: "height",
        expected: 200,
        weight: 50,
        message: "Height should be 200px",
      },
    ];

    const doc = createMockDocument({
      ".box": { rect: { width: 100, height: 50 } },
    });

    const result = runValidation({
      rules,
      document: doc,
      cssSource: ".box { width: 100px; height: 50px; }",
      timeSpentMs: 30000,
      hintsUsed: 0,
      solutionViewed: false,
    });

    expect(result.passed).toBe(false);
    expect(result.ruleResults).toHaveLength(2);
    expect(result.ruleResults[0].passed).toBe(true);
    expect(result.ruleResults[1].passed).toBe(false);
  });

  it("produces a valid ScoreBreakdown", () => {
    const rules: ValidationRule[] = [
      {
        type: "layout-bounds",
        selector: ".box",
        property: "width",
        expected: { min: 95, max: 105 },
        weight: 100,
        message: "Width ok",
      },
    ];

    const doc = createMockDocument({
      ".box": { rect: { width: 100 } },
    });

    const result = runValidation({
      rules,
      document: doc,
      cssSource: ".box { width: 100px; }",
      timeSpentMs: 30000,
      hintsUsed: 0,
      solutionViewed: false,
    });

    expect(result.score).toBeDefined();
    expect(result.score.correctness).toBeGreaterThanOrEqual(0);
    expect(result.score.codeQuality).toBeGreaterThanOrEqual(0);
    expect(result.score.efficiency).toBeGreaterThanOrEqual(0);
    expect(result.score.speedBonus).toBeGreaterThanOrEqual(0);
    expect(result.score.total).toBeGreaterThanOrEqual(0);
    expect(result.score.total).toBeLessThanOrEqual(1000);
    expect([0, 1, 2, 3]).toContain(result.score.stars);
  });
});
