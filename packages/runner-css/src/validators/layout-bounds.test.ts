import { describe, it, expect, vi } from "vitest";
import { validateLayoutBounds } from "./layout-bounds";
import type { IframeSandbox } from "../iframe-sandbox";

function createMockSandbox(
  rect: { top: number; left: number; width: number; height: number; bottom: number; right: number } | null,
): Pick<IframeSandbox, "getBoundingRect"> {
  return {
    getBoundingRect: vi.fn().mockResolvedValue(rect),
  };
}

describe("validateLayoutBounds", () => {
  it("passes when value is within min/max range", async () => {
    const sandbox = createMockSandbox({
      top: 0,
      left: 0,
      width: 200,
      height: 100,
      bottom: 100,
      right: 200,
    });

    const result = await validateLayoutBounds(sandbox as unknown as IframeSandbox, {
      selector: ".box",
      expected: { min: 150, max: 250, property: "width" },
    });

    expect(result.passed).toBe(true);
    expect(result.actual).toBe(200);
  });

  it("fails when value is below minimum", async () => {
    const sandbox = createMockSandbox({
      top: 0,
      left: 0,
      width: 50,
      height: 100,
      bottom: 100,
      right: 50,
    });

    const result = await validateLayoutBounds(sandbox as unknown as IframeSandbox, {
      selector: ".box",
      expected: { min: 100, property: "width" },
    });

    expect(result.passed).toBe(false);
    expect(result.actual).toBe(50);
    expect(result.message).toContain("expected");
  });

  it("fails when value exceeds maximum", async () => {
    const sandbox = createMockSandbox({
      top: 0,
      left: 0,
      width: 500,
      height: 100,
      bottom: 100,
      right: 500,
    });

    const result = await validateLayoutBounds(sandbox as unknown as IframeSandbox, {
      selector: ".box",
      expected: { max: 300, property: "width" },
    });

    expect(result.passed).toBe(false);
    expect(result.actual).toBe(500);
  });

  it("checks height property correctly", async () => {
    const sandbox = createMockSandbox({
      top: 0,
      left: 0,
      width: 200,
      height: 150,
      bottom: 150,
      right: 200,
    });

    const result = await validateLayoutBounds(sandbox as unknown as IframeSandbox, {
      selector: ".box",
      expected: { min: 100, max: 200, property: "height" },
    });

    expect(result.passed).toBe(true);
    expect(result.actual).toBe(150);
  });

  it("checks top position correctly", async () => {
    const sandbox = createMockSandbox({
      top: 50,
      left: 0,
      width: 200,
      height: 100,
      bottom: 150,
      right: 200,
    });

    const result = await validateLayoutBounds(sandbox as unknown as IframeSandbox, {
      selector: ".box",
      expected: { min: 40, max: 60, property: "top" },
    });

    expect(result.passed).toBe(true);
    expect(result.actual).toBe(50);
  });

  it("fails when element is not found", async () => {
    const sandbox = createMockSandbox(null);

    const result = await validateLayoutBounds(sandbox as unknown as IframeSandbox, {
      selector: ".missing",
      expected: { min: 0, property: "width" },
    });

    expect(result.passed).toBe(false);
    expect(result.actual).toBeNull();
    expect(result.message).toContain("not found");
  });

  it("handles sandbox errors gracefully", async () => {
    const sandbox = {
      getBoundingRect: vi.fn().mockRejectedValue(new Error("Timeout")),
    };

    const result = await validateLayoutBounds(sandbox as unknown as IframeSandbox, {
      selector: ".box",
      expected: { min: 0, property: "width" },
    });

    expect(result.passed).toBe(false);
    expect(result.actual).toBeNull();
    expect(result.message).toContain("Error");
  });

  it("passes with only min constraint when value is at minimum", async () => {
    const sandbox = createMockSandbox({
      top: 0,
      left: 0,
      width: 100,
      height: 100,
      bottom: 100,
      right: 100,
    });

    const result = await validateLayoutBounds(sandbox as unknown as IframeSandbox, {
      selector: ".box",
      expected: { min: 100, property: "width" },
    });

    expect(result.passed).toBe(true);
  });

  it("passes with only max constraint when value is at maximum", async () => {
    const sandbox = createMockSandbox({
      top: 0,
      left: 0,
      width: 300,
      height: 100,
      bottom: 100,
      right: 300,
    });

    const result = await validateLayoutBounds(sandbox as unknown as IframeSandbox, {
      selector: ".box",
      expected: { max: 300, property: "width" },
    });

    expect(result.passed).toBe(true);
  });
});
