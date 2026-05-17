import { defineConfig } from "vitest/config";

// The design kernels are pure logic, so a Node environment is sufficient —
// no DOM is needed.
//
// DECISION: `include`/coverage broadened from `lib/kernel/**` to `lib/**` so
// the new `lib/hardscape/` kernel's Vitest suites are discovered by the
// `npm test` quality gate. The hardscape kernel mirrors `lib/kernel/`'s pure,
// dependency-free, deterministic structure, so the same Node config applies.
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
    coverage: {
      include: ["lib/kernel/**/*.ts", "lib/hardscape/**/*.ts"],
      exclude: ["lib/**/*.test.ts"],
    },
  },
});
