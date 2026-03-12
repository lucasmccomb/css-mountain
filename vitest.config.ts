import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@/": path.resolve(__dirname, "apps/web/src") + "/",
      "@css-mountain/shared-ui": path.resolve(__dirname, "packages/shared-ui/src"),
      "@css-mountain/core": path.resolve(__dirname, "packages/core/src"),
      "@css-mountain/runner-css": path.resolve(__dirname, "packages/runner-css/src"),
      "@css-mountain/schemas": path.resolve(__dirname, "packages/schemas/src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: {
      modules: {
        classNameStrategy: "non-scoped",
      },
    },
    include: ["packages/**/*.test.{ts,tsx}", "apps/**/*.test.{ts,tsx}"],
  },
});
