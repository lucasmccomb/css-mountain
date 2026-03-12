import { describe, it, expect, beforeEach } from "vitest";
import { createSession, getSession, deleteSession } from "../services/session-service";
import { createMockKV } from "./helpers";

describe("session-service", () => {
  let kv: KVNamespace;

  beforeEach(() => {
    kv = createMockKV();
  });

  it("creates a session and retrieves it", async () => {
    const sessionId = await createSession(kv, "user-123");
    expect(sessionId).toBeTruthy();
    expect(sessionId.length).toBe(64); // 32 bytes hex

    const session = await getSession(kv, sessionId);
    expect(session).not.toBeNull();
    expect(session!.userId).toBe("user-123");
    expect(session!.expiresAt).toBeGreaterThan(Date.now());
  });

  it("returns null for nonexistent session", async () => {
    const session = await getSession(kv, "nonexistent");
    expect(session).toBeNull();
  });

  it("deletes a session", async () => {
    const sessionId = await createSession(kv, "user-456");
    await deleteSession(kv, sessionId);

    const session = await getSession(kv, sessionId);
    expect(session).toBeNull();
  });

  it("generates unique session IDs", async () => {
    const id1 = await createSession(kv, "user-1");
    const id2 = await createSession(kv, "user-2");
    expect(id1).not.toBe(id2);
  });
});
