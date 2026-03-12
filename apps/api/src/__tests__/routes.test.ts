import { describe, it, expect, beforeEach } from "vitest";
import app from "../index";
import { createMockEnv } from "./helpers";
import type { Env } from "../types";

describe("API routes", () => {
  let env: Env;

  beforeEach(() => {
    env = createMockEnv();
  });

  describe("GET /", () => {
    it("returns API info", async () => {
      const res = await app.request("/", {}, env);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toEqual({
        name: "CSS Mountain API",
        version: "0.1.0",
        status: "ok",
      });
    });
  });

  describe("GET /api/health", () => {
    it("returns health status", async () => {
      const res = await app.request("/api/health", {}, env);
      // With mock bindings, health checks should pass
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.status).toBeDefined();
      expect(body.checks).toBeDefined();
      expect(body.timestamp).toBeDefined();
    });
  });

  describe("GET /api/challenges", () => {
    it("returns empty challenges list when R2 has no data", async () => {
      const res = await app.request("/api/challenges", {}, env);
      expect(res.status).toBe(200);

      const body = (await res.json()) as { challenges: unknown[] };
      expect(body.challenges).toEqual([]);
    });
  });

  describe("GET /api/challenges/:id", () => {
    it("returns 404 for nonexistent challenge", async () => {
      const res = await app.request("/api/challenges/nonexistent", {}, env);
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/leaderboard", () => {
    it("returns empty leaderboard", async () => {
      const res = await app.request("/api/leaderboard", {}, env);
      expect(res.status).toBe(200);

      const body = (await res.json()) as { leaderboard: unknown[] };
      expect(body.leaderboard).toEqual([]);
    });
  });

  describe("Protected routes without auth", () => {
    it("GET /api/users/me returns 401", async () => {
      const res = await app.request("/api/users/me", {}, env);
      expect(res.status).toBe(401);
    });

    it("GET /api/progress returns 401", async () => {
      const res = await app.request("/api/progress", {}, env);
      expect(res.status).toBe(401);
    });

    it("GET /api/achievements returns 401", async () => {
      const res = await app.request("/api/achievements", {}, env);
      expect(res.status).toBe(401);
    });
  });

  describe("Auth routes", () => {
    it("GET /api/auth/google redirects to Google", async () => {
      const res = await app.request("/api/auth/google", { redirect: "manual" }, env);
      expect(res.status).toBe(302);

      const location = res.headers.get("Location");
      expect(location).toContain("accounts.google.com");
      expect(location).toContain("client_id=test-google-client-id");
      expect(location).toContain("state=");
    });

    it("GET /api/auth/github redirects to GitHub", async () => {
      const res = await app.request("/api/auth/github", { redirect: "manual" }, env);
      expect(res.status).toBe(302);

      const location = res.headers.get("Location");
      expect(location).toContain("github.com/login/oauth/authorize");
      expect(location).toContain("client_id=test-github-client-id");
      expect(location).toContain("state=");
    });

    it("GET /api/auth/google/callback fails without code/state", async () => {
      const res = await app.request("/api/auth/google/callback", {}, env);
      expect(res.status).toBe(400);
    });

    it("GET /api/auth/github/callback fails without code/state", async () => {
      const res = await app.request("/api/auth/github/callback", {}, env);
      expect(res.status).toBe(400);
    });

    it("GET /api/auth/me returns 401 without session", async () => {
      const res = await app.request("/api/auth/me", {}, env);
      expect(res.status).toBe(401);
    });

    it("POST /api/auth/logout clears session cookie", async () => {
      const res = await app.request(
        "/api/auth/logout",
        {
          method: "POST",
          headers: { Origin: "http://localhost:5173" },
        },
        env,
      );
      expect(res.status).toBe(200);

      const setCookie = res.headers.get("Set-Cookie");
      expect(setCookie).toContain("Max-Age=0");
    });
  });

  describe("CSRF protection on mutating routes", () => {
    it("POST /api/auth/logout is blocked without origin", async () => {
      const res = await app.request("/api/auth/logout", { method: "POST" }, env);
      expect(res.status).toBe(403);
    });

    it("POST /api/progress/:id is blocked without origin", async () => {
      const res = await app.request(
        "/api/progress/challenge-1",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score: 100,
            stars: 1,
            timeMs: 10000,
            cssSource: ".box {}",
          }),
        },
        env,
      );
      expect(res.status).toBe(403);
    });
  });

  describe("404 handling", () => {
    it("returns 404 for unknown routes", async () => {
      const res = await app.request("/api/nonexistent", {}, env);
      expect(res.status).toBe(404);
    });
  });
});
