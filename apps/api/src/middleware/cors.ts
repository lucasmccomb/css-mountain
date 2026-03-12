import { cors } from "hono/cors";
import type { Env } from "../types";

export function createCorsMiddleware() {
  return cors({
    origin: (origin, c) => {
      const env = c.env as Env;
      const allowedOrigin = env.APP_URL || "https://cssmountain.com";

      // In development, allow localhost
      if (env.ENVIRONMENT === "development") {
        if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
          return origin;
        }
      }

      if (origin === allowedOrigin) {
        return origin;
      }

      return "";
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["X-Request-Id"],
    credentials: true,
    maxAge: 86400,
  });
}
