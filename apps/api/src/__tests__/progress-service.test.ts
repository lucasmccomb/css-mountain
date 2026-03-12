import { describe, it, expect } from "vitest";
import { validateSubmission } from "../services/progress-service";

describe("progress-service validation", () => {
  it("accepts valid submission", () => {
    const errors = validateSubmission({
      score: 850,
      stars: 3,
      timeMs: 30000,
      cssSource: ".box { color: red; }",
    });
    expect(errors).toHaveLength(0);
  });

  it("rejects score below 0", () => {
    const errors = validateSubmission({
      score: -1,
      stars: 1,
      timeMs: 10000,
      cssSource: ".box { }",
    });
    expect(errors.some((e) => e.field === "score")).toBe(true);
  });

  it("rejects score above 1000", () => {
    const errors = validateSubmission({
      score: 1001,
      stars: 1,
      timeMs: 10000,
      cssSource: ".box { }",
    });
    expect(errors.some((e) => e.field === "score")).toBe(true);
  });

  it("rejects stars above 3", () => {
    const errors = validateSubmission({
      score: 500,
      stars: 4,
      timeMs: 10000,
      cssSource: ".box { }",
    });
    expect(errors.some((e) => e.field === "stars")).toBe(true);
  });

  it("rejects stars below 0", () => {
    const errors = validateSubmission({
      score: 500,
      stars: -1,
      timeMs: 10000,
      cssSource: ".box { }",
    });
    expect(errors.some((e) => e.field === "stars")).toBe(true);
  });

  it("rejects non-integer stars", () => {
    const errors = validateSubmission({
      score: 500,
      stars: 1.5,
      timeMs: 10000,
      cssSource: ".box { }",
    });
    expect(errors.some((e) => e.field === "stars")).toBe(true);
  });

  it("rejects time below minimum threshold (5s)", () => {
    const errors = validateSubmission({
      score: 500,
      stars: 1,
      timeMs: 4999,
      cssSource: ".box { }",
    });
    expect(errors.some((e) => e.field === "timeMs")).toBe(true);
  });

  it("accepts time at exactly 5s", () => {
    const errors = validateSubmission({
      score: 500,
      stars: 1,
      timeMs: 5000,
      cssSource: ".box { }",
    });
    expect(errors.some((e) => e.field === "timeMs")).toBe(false);
  });

  it("rejects empty CSS source", () => {
    const errors = validateSubmission({
      score: 500,
      stars: 1,
      timeMs: 10000,
      cssSource: "",
    });
    expect(errors.some((e) => e.field === "cssSource")).toBe(true);
  });

  it("rejects whitespace-only CSS source", () => {
    const errors = validateSubmission({
      score: 500,
      stars: 1,
      timeMs: 10000,
      cssSource: "   ",
    });
    expect(errors.some((e) => e.field === "cssSource")).toBe(true);
  });

  it("reports multiple validation errors simultaneously", () => {
    const errors = validateSubmission({
      score: -5,
      stars: 10,
      timeMs: 100,
      cssSource: "",
    });
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });

  it("accepts score at boundary values 0 and 1000", () => {
    const errorsZero = validateSubmission({
      score: 0,
      stars: 0,
      timeMs: 5000,
      cssSource: ".x {}",
    });
    expect(errorsZero).toHaveLength(0);

    const errorsMax = validateSubmission({
      score: 1000,
      stars: 3,
      timeMs: 5000,
      cssSource: ".x {}",
    });
    expect(errorsMax).toHaveLength(0);
  });
});
