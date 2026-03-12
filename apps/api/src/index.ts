import { Hono } from "hono";
import { cors } from "hono/cors";

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ASSETS: R2Bucket;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors());

app.get("/", (c) => {
  return c.json({
    name: "CSS Mountain API",
    version: "0.0.0",
    status: "ok",
  });
});

app.get("/health", (c) => {
  return c.json({ status: "healthy" });
});

export default app;
