import { describe, it, expect, vi } from "vitest";
import { validatePropertyExists } from "./property-check";
import type { IframeSandbox } from "../iframe-sandbox";

function createMockSandbox(
  computedStyleValue: string | null,
): Pick<IframeSandbox, "getComputedStyle"> {
  return {
    getComputedStyle: vi.fn().mockResolvedValue(computedStyleValue),
  };
}

describe("validatePropertyExists", () => {
  it("passes when property has a non-empty computed value", async () => {
    const sandbox = createMockSandbox("flex");
    const result = await validatePropertyExists(sandbox as unknown as IframeSandbox, {
      selector: ".container",
      property: "display",
    });

    expect(result.passed).toBe(true);
    expect(result.message).toContain("applied");
  });

  it("fails when element is not found", async () => {
    const sandbox = createMockSandbox(null);
    const result = await validatePropertyExists(sandbox as unknown as IframeSandbox, {
      selector: ".missing",
      property: "display",
    });

    expect(result.passed).toBe(false);
    expect(result.message).toContain("not found");
  });

  it("fails when computed value is empty string", async () => {
    const sandbox = createMockSandbox("");
    const result = await validatePropertyExists(sandbox as unknown as IframeSandbox, {
      selector: ".box",
      property: "flex-direction",
    });

    expect(result.passed).toBe(false);
    expect(result.message).toContain("not applied");
  });

  it("passes when computed value has whitespace but is non-empty", async () => {
    const sandbox = createMockSandbox("  block  ");
    const result = await validatePropertyExists(sandbox as unknown as IframeSandbox, {
      selector: "div",
      property: "display",
    });

    expect(result.passed).toBe(true);
  });

  it("handles sandbox errors gracefully", async () => {
    const sandbox = {
      getComputedStyle: vi.fn().mockRejectedValue(new Error("Connection lost")),
    };
    const result = await validatePropertyExists(sandbox as unknown as IframeSandbox, {
      selector: ".box",
      property: "color",
    });

    expect(result.passed).toBe(false);
    expect(result.message).toContain("Error");
  });
});
