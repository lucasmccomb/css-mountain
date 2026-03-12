import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import type { Env, Variables } from "../types";
import { createCorsMiddleware } from "../middleware/cors";
import { csrfMiddleware } from "../middleware/csrf";
import { authMiddleware } from "../middleware/auth";
import { createMockEnv, createSessionCookie } from "./helpers";
import { createSession } from "../services/session-service";

describe("CORS middleware", () => {
  let app: Hono<{ Bindings: Env; Variables: Variables }>;
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
    app = new Hono<{ Bindings: Env; Variables: Variables }>();
    app.use("/*", createCorsMiddleware());
    app.get("/test", (c) => c.json({ ok: true }));
  });

  it("allows requests from the configured origin", async () => {
    const res = await app.request("/test", { headers: { Origin: "http://localhost:5173" } }, env);
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
  });

  it("rejects requests from unauthorized origins in production", async () => {
    const prodEnv = createMockEnv({
      ENVIRONMENT: "production",
      APP_URL: "https://cssmountain.com",
    });
    const res = await app.request("/test", { headers: { Origin: "https://evil.com" } }, prodEnv);
    // CORS middleware does not reject but does not set the ACAO header to the evil origin
    const acao = res.headers.get("Access-Control-Allow-Origin");
    expect(acao).not.toBe("https://evil.com");
  });

  it("allows exact production origin", async () => {
    const prodEnv = createMockEnv({
      ENVIRONMENT: "production",
      APP_URL: "https://cssmountain.com",
    });
    const res = await app.request(
      "/test",
      { headers: { Origin: "https://cssmountain.com" } },
      prodEnv,
    );
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://cssmountain.com");
  });

  it("includes credentials support", async () => {
    const res = await app.request(
      "/test",
      {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:5173",
          "Access-Control-Request-Method": "GET",
        },
      },
      env,
    );
    expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });
});

describe("CSRF middleware", () => {
  let app: Hono<{ Bindings: Env }>;
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
    app = new Hono<{ Bindings: Env }>();
    app.use("/*", csrfMiddleware);
    app.get("/test", (c) => c.json({ ok: true }));
    app.post("/test", (c) => c.json({ ok: true }));
  });

  it("allows GET requests without Origin header", async () => {
    const res = await app.request("/test", { method: "GET" }, env);
    expect(res.status).toBe(200);
  });

  it("blocks POST requests without Origin header", async () => {
    const res = await app.request("/test", { method: "POST" }, env);
    expect(res.status).toBe(403);
  });

  it("blocks POST from wrong origin", async () => {
    const res = await app.request(
      "/test",
      {
        method: "POST",
        headers: { Origin: "https://evil.com" },
      },
      env,
    );
    expect(res.status).toBe(403);
  });

  it("allows POST from correct origin", async () => {
    const res = await app.request(
      "/test",
      {
        method: "POST",
        headers: { Origin: "http://localhost:5173" },
      },
      env,
    );
    expect(res.status).toBe(200);
  });

  it("allows localhost origins in development", async () => {
    const res = await app.request(
      "/test",
      {
        method: "POST",
        headers: { Origin: "http://localhost:3000" },
      },
      env,
    );
    expect(res.status).toBe(200);
  });
});

describe("Auth middleware", () => {
  let app: Hono<{ Bindings: Env; Variables: Variables }>;
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
    app = new Hono<{ Bindings: Env; Variables: Variables }>();
    app.use("/*", authMiddleware);
    app.get("/protected", (c) => c.json({ userId: c.var.userId }));
  });

  it("returns 401 when no session cookie is present", async () => {
    const res = await app.request("/protected", {}, env);
    expect(res.status).toBe(401);
  });

  it("returns 401 when session does not exist in KV", async () => {
    const res = await app.request(
      "/protected",
      { headers: { Cookie: createSessionCookie("nonexistent") } },
      env,
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 when session exists but user is not found", async () => {
    // Create a session pointing to a user that doesn't exist in the mock DB
    const sessionId = await createSession(env.KV, "nonexistent-user-id");
    const res = await app.request(
      "/protected",
      { headers: { Cookie: createSessionCookie(sessionId) } },
      env,
    );
    expect(res.status).toBe(401);
  });
});
