import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Tests default to a Node environment — the floor-plan kernel and the rest of
// `lib/` are pure logic. Component tests opt into jsdom per-file with a
// `// @vitest-environment jsdom` docblock. See docs/v2-spec.md §8.
export default defineConfig({
  // Transforms JSX/TSX for the component tests.
  plugins: [react()],
  resolve: {
    // Mirror the `@/*` path alias from tsconfig.json so tests import the same
    // way application code does.
    alias: { "@": resolve(__dirname, ".") },
  },
  test: {
    environment: "node",
    include: [
      "lib/**/*.test.{ts,tsx}",
      "app/**/*.test.{ts,tsx}",
      "components/**/*.test.{ts,tsx}",
    ],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "lib/**/*.{ts,tsx}",
        "app/api/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
      ],
      exclude: ["**/*.test.{ts,tsx}", "**/*.d.ts"],
      // The kernel is the spec-mandated coverage floor (v2-spec §8).
      thresholds: {
        "lib/kernel/**/*.ts": {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80,
        },
      },
    },
  },
});
