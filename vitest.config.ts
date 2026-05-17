import { defineConfig } from "vitest/config";

// The floor-plan kernel is pure logic, so a Node environment is sufficient —
// no DOM is needed. Coverage is scoped to `lib/kernel/` per v2-spec §8.
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/kernel/**/*.test.ts"],
    coverage: {
      include: ["lib/kernel/**/*.ts"],
      exclude: ["lib/kernel/**/*.test.ts"],
    },
  },
});
