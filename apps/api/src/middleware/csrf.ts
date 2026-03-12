import { createMiddleware } from "hono/factory";
import type { Env } from "../types";

const MUTATING_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);

export const csrfMiddleware = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  if (!MUTATING_METHODS.has(c.req.method)) {
    return next();
  }

  const origin = c.req.header("origin");
  const allowedOrigin = c.env.APP_URL || "https://cssmountain.com";

  // In development, allow localhost origins
  if (c.env.ENVIRONMENT === "development") {
    if (
      origin &&
      (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:"))
    ) {
      return next();
    }
  }

  if (!origin || origin !== allowedOrigin) {
    return c.json({ error: "Forbidden" }, 403);
  }

  return next();
});
