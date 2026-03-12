import { Hono } from "hono";
import type { Env, Variables } from "../types";
import {
  generateOAuthState,
  storeOAuthState,
  validateOAuthState,
  getGoogleAuthUrl,
  exchangeGoogleCode,
  getGitHubAuthUrl,
  exchangeGitHubCode,
  upsertUser,
} from "../services/auth-service";
import { createSession, deleteSession } from "../services/session-service";
import {
  getSessionCookie,
  buildSessionCookie,
  buildClearSessionCookie,
  authMiddleware,
} from "../middleware/auth";
import { authRateLimiter } from "../middleware/rate-limit";
import { getUserById } from "../db/queries";

const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

// Google OAuth - redirect to Google
auth.get("/google", authRateLimiter, async (c) => {
  const state = generateOAuthState();
  await storeOAuthState(c.env.KV, state);

  const url = getGoogleAuthUrl(c.env, state);
  return c.redirect(url);
});

// Google OAuth callback
auth.get("/google/callback", authRateLimiter, async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  if (!code || !state) {
    return c.json({ error: "Missing code or state parameter" }, 400);
  }

  const validState = await validateOAuthState(c.env.KV, state);
  if (!validState) {
    return c.json({ error: "Invalid or expired state parameter" }, 400);
  }

  const userInfo = await exchangeGoogleCode(c.env, code);
  const userId = await upsertUser(c.env.DB, userInfo);
  const sessionId = await createSession(c.env.KV, userId);

  c.header("Set-Cookie", buildSessionCookie(sessionId));
  return c.redirect(c.env.APP_URL);
});

// GitHub OAuth - redirect to GitHub
auth.get("/github", authRateLimiter, async (c) => {
  const state = generateOAuthState();
  await storeOAuthState(c.env.KV, state);

  const url = getGitHubAuthUrl(c.env, state);
  return c.redirect(url);
});

// GitHub OAuth callback
auth.get("/github/callback", authRateLimiter, async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  if (!code || !state) {
    return c.json({ error: "Missing code or state parameter" }, 400);
  }

  const validState = await validateOAuthState(c.env.KV, state);
  if (!validState) {
    return c.json({ error: "Invalid or expired state parameter" }, 400);
  }

  const userInfo = await exchangeGitHubCode(c.env, code);
  const userId = await upsertUser(c.env.DB, userInfo);
  const sessionId = await createSession(c.env.KV, userId);

  c.header("Set-Cookie", buildSessionCookie(sessionId));
  return c.redirect(c.env.APP_URL);
});

// Logout
auth.post("/logout", async (c) => {
  const cookieHeader = c.req.header("cookie");
  const sessionId = getSessionCookie(cookieHeader);

  if (sessionId) {
    await deleteSession(c.env.KV, sessionId);
  }

  c.header("Set-Cookie", buildClearSessionCookie());
  return c.json({ success: true });
});

// Get current user
auth.get("/me", authMiddleware, async (c) => {
  const user = await getUserById(c.env.DB, c.var.userId);
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({
    id: user.id,
    displayName: user.display_name,
    email: user.email,
    avatarUrl: user.avatar_url,
    settings: JSON.parse(user.settings_json),
    createdAt: user.created_at,
  });
});

export { auth };
