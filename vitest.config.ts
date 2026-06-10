import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/dist/**", "**/.palari/**"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
