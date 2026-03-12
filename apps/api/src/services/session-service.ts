import type { SessionData } from "../types";

const SESSION_PREFIX = "session:";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const REFRESH_THRESHOLD_SECONDS = 24 * 60 * 60; // Refresh if less than 1 day remaining

export function generateSessionId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSession(kv: KVNamespace, userId: string): Promise<string> {
  const sessionId = generateSessionId();
  const now = Date.now();
  const session: SessionData = {
    userId,
    createdAt: now,
    expiresAt: now + SESSION_TTL_SECONDS * 1000,
  };

  await kv.put(`${SESSION_PREFIX}${sessionId}`, JSON.stringify(session), {
    expirationTtl: SESSION_TTL_SECONDS,
  });

  return sessionId;
}

export async function getSession(kv: KVNamespace, sessionId: string): Promise<SessionData | null> {
  const raw = await kv.get(`${SESSION_PREFIX}${sessionId}`);
  if (!raw) return null;

  const session = JSON.parse(raw) as SessionData;

  if (session.expiresAt < Date.now()) {
    await deleteSession(kv, sessionId);
    return null;
  }

  return session;
}

export async function refreshSession(kv: KVNamespace, sessionId: string): Promise<void> {
  const session = await getSession(kv, sessionId);
  if (!session) return;

  const remainingMs = session.expiresAt - Date.now();
  const thresholdMs = REFRESH_THRESHOLD_SECONDS * 1000;

  if (remainingMs < thresholdMs) {
    session.expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
    await kv.put(`${SESSION_PREFIX}${sessionId}`, JSON.stringify(session), {
      expirationTtl: SESSION_TTL_SECONDS,
    });
  }
}

export async function deleteSession(kv: KVNamespace, sessionId: string): Promise<void> {
  await kv.delete(`${SESSION_PREFIX}${sessionId}`);
}
