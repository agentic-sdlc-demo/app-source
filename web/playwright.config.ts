import { defineConfig } from "@playwright/test";

// Runs against a deployed instance — start one first, e.g.:
//   docker compose -f ../deploy/docker-compose.yml up -d tasklist-staging
// then: BASE_URL=http://localhost:8090 npx playwright test
export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: process.env.BASE_URL ?? "http://localhost:8090" },
});
