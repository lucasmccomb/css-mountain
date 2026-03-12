import { Hono } from "hono";
import type { Env } from "../types";

const health = new Hono<{ Bindings: Env }>();

health.get("/", async (c) => {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};

  // Check D1
  const d1Start = Date.now();
  try {
    await c.env.DB.prepare("SELECT 1").first();
    checks.d1 = { status: "healthy", latencyMs: Date.now() - d1Start };
  } catch (err) {
    checks.d1 = {
      status: "unhealthy",
      latencyMs: Date.now() - d1Start,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }

  // Check KV
  const kvStart = Date.now();
  try {
    const testKey = "__health_check__";
    await c.env.KV.put(testKey, "ok", { expirationTtl: 60 });
    const val = await c.env.KV.get(testKey);
    if (val !== "ok") throw new Error("KV read mismatch");
    await c.env.KV.delete(testKey);
    checks.kv = { status: "healthy", latencyMs: Date.now() - kvStart };
  } catch (err) {
    checks.kv = {
      status: "unhealthy",
      latencyMs: Date.now() - kvStart,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }

  // Check R2
  const r2Start = Date.now();
  try {
    // Just list with limit 1 to confirm connectivity
    await c.env.ASSETS.list({ limit: 1 });
    checks.r2 = { status: "healthy", latencyMs: Date.now() - r2Start };
  } catch (err) {
    checks.r2 = {
      status: "unhealthy",
      latencyMs: Date.now() - r2Start,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }

  const allHealthy = Object.values(checks).every((ch) => ch.status === "healthy");

  return c.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    },
    allHealthy ? 200 : 503,
  );
});

export { health };
