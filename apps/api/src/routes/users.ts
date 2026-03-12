import { Hono } from "hono";
import type { Env, Variables } from "../types";
import { authMiddleware } from "../middleware/auth";
import { getUserById, updateUserProfile } from "../db/queries";

const users = new Hono<{ Bindings: Env; Variables: Variables }>();

users.use("/*", authMiddleware);

// Get current user profile
users.get("/me", async (c) => {
  const user = await getUserById(c.env.DB, c.var.userId);
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({
    id: user.id,
    displayName: user.display_name,
    email: user.email,
    avatarUrl: user.avatar_url,
    authProvider: user.auth_provider,
    settings: JSON.parse(user.settings_json),
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
  });
});

// Update current user profile
users.patch("/me", async (c) => {
  const body = await c.req.json<{
    displayName?: string;
    settings?: Record<string, unknown>;
  }>();

  const updates: { display_name?: string; settings_json?: string } = {};

  if (body.displayName !== undefined) {
    if (typeof body.displayName !== "string" || body.displayName.trim().length === 0) {
      return c.json({ error: "Display name must be a non-empty string" }, 400);
    }
    if (body.displayName.length > 50) {
      return c.json({ error: "Display name must be 50 characters or fewer" }, 400);
    }
    updates.display_name = body.displayName.trim();
  }

  if (body.settings !== undefined) {
    if (typeof body.settings !== "object" || body.settings === null) {
      return c.json({ error: "Settings must be an object" }, 400);
    }
    updates.settings_json = JSON.stringify(body.settings);
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No valid fields to update" }, 400);
  }

  await updateUserProfile(c.env.DB, c.var.userId, updates);

  const updated = await getUserById(c.env.DB, c.var.userId);
  if (!updated) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({
    id: updated.id,
    displayName: updated.display_name,
    email: updated.email,
    avatarUrl: updated.avatar_url,
    settings: JSON.parse(updated.settings_json),
  });
});

export { users };
