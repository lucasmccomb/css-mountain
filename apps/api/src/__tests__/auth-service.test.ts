import { describe, it, expect, beforeEach } from "vitest";
import { generateOAuthState, storeOAuthState, validateOAuthState } from "../services/auth-service";
import { createMockKV } from "./helpers";

describe("auth-service", () => {
  let kv: KVNamespace;

  beforeEach(() => {
    kv = createMockKV();
  });

  describe("OAuth state management", () => {
    it("generates a 32-character hex state string", () => {
      const state = generateOAuthState();
      expect(state).toMatch(/^[0-9a-f]{32}$/);
    });

    it("generates unique states", () => {
      const state1 = generateOAuthState();
      const state2 = generateOAuthState();
      expect(state1).not.toBe(state2);
    });

    it("stores and validates state successfully", async () => {
      const state = generateOAuthState();
      await storeOAuthState(kv, state);

      const valid = await validateOAuthState(kv, state);
      expect(valid).toBe(true);
    });

    it("invalidates state after first use (one-time use)", async () => {
      const state = generateOAuthState();
      await storeOAuthState(kv, state);

      const firstUse = await validateOAuthState(kv, state);
      expect(firstUse).toBe(true);

      const secondUse = await validateOAuthState(kv, state);
      expect(secondUse).toBe(false);
    });

    it("rejects unknown state", async () => {
      const valid = await validateOAuthState(kv, "unknown-state-value");
      expect(valid).toBe(false);
    });
  });
});
