import { createMiddleware } from "hono/factory";
import type { Env, Variables } from "../types";
import { getSession, refreshSession } from "../services/session-service";
import { getUserById } from "../db/queries";

const SESSION_COOKIE = "css_mountain_session";

export function getSessionCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    const [name, value] = cookie.split("=");
    if (name === SESSION_COOKIE && value) {
      return value;
    }
  }
  return null;
}

export function buildSessionCookie(sessionId: string, maxAge: number = 7 * 24 * 60 * 60): string {
  return `${SESSION_COOKIE}=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

export function buildClearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export const authMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const cookieHeader = c.req.header("cookie");
  const sessionId = getSessionCookie(cookieHeader);

  if (!sessionId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const session = await getSession(c.env.KV, sessionId);
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const user = await getUserById(c.env.DB, session.userId);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", session.userId);
  c.set("user", user);

  // Sliding window refresh
  await refreshSession(c.env.KV, sessionId);

  await next();
});

export const optionalAuthMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: Variables;
}>(async (c, next) => {
  const cookieHeader = c.req.header("cookie");
  const sessionId = getSessionCookie(cookieHeader);

  if (sessionId) {
    const session = await getSession(c.env.KV, sessionId);
    if (session) {
      const user = await getUserById(c.env.DB, session.userId);
      if (user) {
        c.set("userId", session.userId);
        c.set("user", user);
        await refreshSession(c.env.KV, sessionId);
      }
    }
  }

  await next();
});
