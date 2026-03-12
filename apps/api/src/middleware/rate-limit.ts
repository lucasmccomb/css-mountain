import { createMiddleware } from "hono/factory";
import type { Env, Variables } from "../types";

const RATE_LIMIT_PREFIX = "rate:";

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  keyFn: (c: { req: { header: (name: string) => string | undefined }; var: Variables }) => string;
}

async function checkRateLimit(
  kv: KVNamespace,
  key: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);
  const rateLimitKey = `${RATE_LIMIT_PREFIX}${key}:${windowStart}`;

  const current = await kv.get(rateLimitKey);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: windowStart + windowSeconds,
    };
  }

  await kv.put(rateLimitKey, String(count + 1), {
    expirationTtl: windowSeconds * 2, // Keep slightly longer than window to handle edge cases
  });

  return {
    allowed: true,
    remaining: maxRequests - count - 1,
    resetAt: windowStart + windowSeconds,
  };
}

function getClientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  return c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for") ?? "unknown";
}

export function createRateLimiter(config: RateLimitConfig) {
  return createMiddleware<{ Bindings: Env; Variables: Variables }>(async (c, next) => {
    const key = config.keyFn(c);
    const result = await checkRateLimit(c.env.KV, key, config.maxRequests, config.windowSeconds);

    c.header("X-RateLimit-Limit", String(config.maxRequests));
    c.header("X-RateLimit-Remaining", String(result.remaining));
    c.header("X-RateLimit-Reset", String(result.resetAt));

    if (!result.allowed) {
      return c.json({ error: "Too many requests" }, 429);
    }

    return next();
  });
}

// Auth endpoints: 10 requests per minute per IP
export const authRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowSeconds: 60,
  keyFn: (c) => `auth:${getClientIp(c)}`,
});

// Progress endpoints: 30 requests per minute per user
export const progressRateLimiter = createRateLimiter({
  maxRequests: 30,
  windowSeconds: 60,
  keyFn: (c) => `progress:${c.var.userId ?? "anon"}`,
});
