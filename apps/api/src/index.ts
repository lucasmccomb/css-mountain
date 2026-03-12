import { Hono } from "hono";
import type { Env, Variables } from "./types";
import { createCorsMiddleware } from "./middleware/cors";
import { csrfMiddleware } from "./middleware/csrf";
import { auth } from "./routes/auth";
import { users } from "./routes/users";
import { progress } from "./routes/progress";
import { challenges } from "./routes/challenges";
import { achievements } from "./routes/achievements";
import { leaderboard } from "./routes/leaderboard";
import { health } from "./routes/health";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Global middleware
app.use("/*", createCorsMiddleware());
app.use("/*", csrfMiddleware);

// Global error handler
app.onError((err, c) => {
  console.error(`[ERROR] ${c.req.method} ${c.req.url}:`, err.message, err.stack);
  return c.json({ error: "Internal server error" }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

// Root
app.get("/", (c) => {
  return c.json({
    name: "CSS Mountain API",
    version: "0.1.0",
    status: "ok",
  });
});

// Mount routes
app.route("/api/auth", auth);
app.route("/api/users", users);
app.route("/api/progress", progress);
app.route("/api/challenges", challenges);
app.route("/api/achievements", achievements);
app.route("/api/leaderboard", leaderboard);
app.route("/api/health", health);

export default app;
