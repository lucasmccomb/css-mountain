import { Hono } from "hono";
import type { Env, Variables } from "../types";
import { optionalAuthMiddleware } from "../middleware/auth";

const CHALLENGE_CACHE_TTL = 3600; // 1 hour
const CHALLENGE_LIST_CACHE_KEY = "challenges:list";

interface ChallengeMetadata {
  id: string;
  title: string;
  difficulty: string;
  category: string;
  order: number;
}

const challenges = new Hono<{ Bindings: Env; Variables: Variables }>();

// List all challenges (public, with optional auth for progress)
challenges.get("/", optionalAuthMiddleware, async (c) => {
  // Try KV cache first
  const cached = await c.env.KV.get(CHALLENGE_LIST_CACHE_KEY, "json");
  if (cached) {
    return c.json({ challenges: cached });
  }

  // Fetch challenge listing from R2
  const listObj = await c.env.ASSETS.get("challenges/index.json");
  if (!listObj) {
    return c.json({ challenges: [] });
  }

  const list = (await listObj.json()) as ChallengeMetadata[];

  // Cache in KV
  await c.env.KV.put(CHALLENGE_LIST_CACHE_KEY, JSON.stringify(list), {
    expirationTtl: CHALLENGE_CACHE_TTL,
  });

  return c.json({ challenges: list });
});

// Get a specific challenge by ID (public)
challenges.get("/:id", optionalAuthMiddleware, async (c) => {
  const id = c.req.param("id");
  const cacheKey = `challenges:${id}`;

  // Try KV cache first
  const cached = await c.env.KV.get(cacheKey, "json");
  if (cached) {
    return c.json({ challenge: cached });
  }

  // Fetch from R2
  const obj = await c.env.ASSETS.get(`challenges/${id}.json`);
  if (!obj) {
    return c.json({ error: "Challenge not found" }, 404);
  }

  const challenge = await obj.json();

  // Cache in KV
  await c.env.KV.put(cacheKey, JSON.stringify(challenge), {
    expirationTtl: CHALLENGE_CACHE_TTL,
  });

  return c.json({ challenge });
});

export { challenges };
