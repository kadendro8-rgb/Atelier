import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// The hardscape design kernel is pure logic, so a Node environment is
// sufficient — no DOM is needed. The `@/` path alias mirrors `tsconfig.json`.
export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
    coverage: {
      include: ["lib/hardscape/**/*.ts"],
      exclude: ["lib/**/*.test.ts"],
    },
  },
});
