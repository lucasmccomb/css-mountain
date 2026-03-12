import { describe, it, expect, vi } from "vitest";
import { validateComputedStyle } from "./computed-style";
import type { IframeSandbox } from "../iframe-sandbox";

function createMockSandbox(
  computedStyleValue: string | null,
): Pick<IframeSandbox, "getComputedStyle"> {
  return {
    getComputedStyle: vi.fn().mockResolvedValue(computedStyleValue),
  };
}

describe("validateComputedStyle", () => {
  it("passes when computed value matches expected", async () => {
    const sandbox = createMockSandbox("rgb(255, 0, 0)");
    const result = await validateComputedStyle(sandbox as unknown as IframeSandbox, {
      selector: ".box",
      property: "color",
      expected: "rgb(255, 0, 0)",
    });

    expect(result.passed).toBe(true);
    expect(result.actual).toBe("rgb(255, 0, 0)");
    expect(result.message).toContain("matches");
  });

  it("fails when computed value differs from expected", async () => {
    const sandbox = createMockSandbox("rgb(0, 0, 255)");
    const result = await validateComputedStyle(sandbox as unknown as IframeSandbox, {
      selector: ".box",
      property: "color",
      expected: "rgb(255, 0, 0)",
    });

    expect(result.passed).toBe(false);
    expect(result.actual).toBe("rgb(0, 0, 255)");
    expect(result.message).toContain("expected");
    expect(result.message).toContain("got");
  });

  it("fails when element is not found (null returned)", async () => {
    const sandbox = createMockSandbox(null);
    const result = await validateComputedStyle(sandbox as unknown as IframeSandbox, {
      selector: ".missing",
      property: "color",
      expected: "red",
    });

    expect(result.passed).toBe(false);
    expect(result.actual).toBeNull();
    expect(result.message).toContain("not found");
  });

  it("comparison is case-insensitive", async () => {
    const sandbox = createMockSandbox("FLEX");
    const result = await validateComputedStyle(sandbox as unknown as IframeSandbox, {
      selector: ".container",
      property: "display",
      expected: "flex",
    });

    expect(result.passed).toBe(true);
  });

  it("comparison trims whitespace", async () => {
    const sandbox = createMockSandbox("  block  ");
    const result = await validateComputedStyle(sandbox as unknown as IframeSandbox, {
      selector: "div",
      property: "display",
      expected: "block",
    });

    expect(result.passed).toBe(true);
  });

  it("handles sandbox errors gracefully", async () => {
    const sandbox = {
      getComputedStyle: vi.fn().mockRejectedValue(new Error("Sandbox destroyed")),
    };
    const result = await validateComputedStyle(sandbox as unknown as IframeSandbox, {
      selector: ".box",
      property: "color",
      expected: "red",
    });

    expect(result.passed).toBe(false);
    expect(result.actual).toBeNull();
    expect(result.message).toContain("Error");
  });
});
