import { describe, it, expect } from "vitest";

// We need a fresh registry for each test, so we'll import the class pattern
// Since we only export a singleton, we test through it but reset between tests

// Actually the singleton approach means we need to test carefully.
// Let's test the exported singleton.
import { technologyRegistry } from "./technology-registry";
import type { ChallengeRunner } from "./types";

function mockRunnerFactory() {
  return Promise.resolve({
    technology: "test",
    initialize: () => Promise.resolve(),
    loadChallenge: () => Promise.resolve(),
    executeUserCode: () => Promise.resolve(),
    validate: () =>
      Promise.resolve({
        passed: false,
        score: {
          correctness: 0,
          codeQuality: 0,
          efficiency: 0,
          speedBonus: 0,
          total: 0,
          stars: 0 as const,
        },
        ruleResults: [],
        feedback: [],
      }),
    renderPreview: () => Promise.resolve(),
    destroy: () => {},
  } satisfies ChallengeRunner);
}

describe("TechnologyRegistry", () => {
  // Note: since technologyRegistry is a singleton, tests may interact.
  // We use unique names to avoid conflicts.

  it("returns false for unregistered technology", () => {
    expect(technologyRegistry.has("nonexistent-tech")).toBe(false);
  });

  it("returns undefined for unregistered technology get", () => {
    expect(technologyRegistry.get("nonexistent-tech-2")).toBeUndefined();
  });

  it("registers and retrieves a runner factory", () => {
    technologyRegistry.register("test-css", mockRunnerFactory);
    expect(technologyRegistry.has("test-css")).toBe(true);
    expect(technologyRegistry.get("test-css")).toBe(mockRunnerFactory);
  });

  it("lists registered technologies", () => {
    technologyRegistry.register("test-scss", mockRunnerFactory);
    const list = technologyRegistry.list();
    expect(list).toContain("test-scss");
  });

  it("overwrites existing factory on re-register", () => {
    const factory1 = mockRunnerFactory;
    const factory2 = () => mockRunnerFactory();

    technologyRegistry.register("test-overwrite", factory1);
    expect(technologyRegistry.get("test-overwrite")).toBe(factory1);

    technologyRegistry.register("test-overwrite", factory2);
    expect(technologyRegistry.get("test-overwrite")).toBe(factory2);
  });

  it("factory returns a valid ChallengeRunner", async () => {
    technologyRegistry.register("test-valid", mockRunnerFactory);
    const factory = technologyRegistry.get("test-valid");
    expect(factory).toBeDefined();

    const runner = await factory!();
    expect(runner.technology).toBe("test");
    expect(typeof runner.initialize).toBe("function");
    expect(typeof runner.loadChallenge).toBe("function");
    expect(typeof runner.executeUserCode).toBe("function");
    expect(typeof runner.validate).toBe("function");
    expect(typeof runner.renderPreview).toBe("function");
    expect(typeof runner.destroy).toBe("function");
  });
});
