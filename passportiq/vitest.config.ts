import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/integration/**/*.test.ts"],
    // Integration tests read DATABASE_URL from the environment (see tests/integration/README note)
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
