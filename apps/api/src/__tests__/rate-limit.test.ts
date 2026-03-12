import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import type { Env, Variables } from "../types";
import { createRateLimiter } from "../middleware/rate-limit";
import { createMockEnv } from "./helpers";

describe("rate-limit middleware", () => {
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
  });

  it("allows requests under the limit", async () => {
    const app = new Hono<{ Bindings: Env; Variables: Variables }>();
    app.use(
      "/*",
      createRateLimiter({
        maxRequests: 5,
        windowSeconds: 60,
        keyFn: () => "test-key",
      }),
    );
    app.get("/test", (c) => c.json({ ok: true }));

    for (let i = 0; i < 5; i++) {
      const res = await app.request("/test", {}, env);
      expect(res.status).toBe(200);
    }
  });

  it("blocks requests over the limit", async () => {
    const app = new Hono<{ Bindings: Env; Variables: Variables }>();
    app.use(
      "/*",
      createRateLimiter({
        maxRequests: 3,
        windowSeconds: 60,
        keyFn: () => "test-limit",
      }),
    );
    app.get("/test", (c) => c.json({ ok: true }));

    // Use up all requests
    for (let i = 0; i < 3; i++) {
      const res = await app.request("/test", {}, env);
      expect(res.status).toBe(200);
    }

    // This one should be rate limited
    const res = await app.request("/test", {}, env);
    expect(res.status).toBe(429);

    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Too many requests");
  });

  it("sets rate limit headers", async () => {
    const app = new Hono<{ Bindings: Env; Variables: Variables }>();
    app.use(
      "/*",
      createRateLimiter({
        maxRequests: 10,
        windowSeconds: 60,
        keyFn: () => "header-test",
      }),
    );
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test", {}, env);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("9");
    expect(res.headers.get("X-RateLimit-Reset")).toBeTruthy();
  });

  it("tracks different keys independently", async () => {
    let currentKey = "user-1";
    const app = new Hono<{ Bindings: Env; Variables: Variables }>();
    app.use(
      "/*",
      createRateLimiter({
        maxRequests: 2,
        windowSeconds: 60,
        keyFn: () => currentKey,
      }),
    );
    app.get("/test", (c) => c.json({ ok: true }));

    // Exhaust user-1's limit
    await app.request("/test", {}, env);
    await app.request("/test", {}, env);
    const blocked = await app.request("/test", {}, env);
    expect(blocked.status).toBe(429);

    // user-2 should still be allowed
    currentKey = "user-2";
    const res = await app.request("/test", {}, env);
    expect(res.status).toBe(200);
  });
});
