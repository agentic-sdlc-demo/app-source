import { expect, test } from "@playwright/test";

// Exercises the SPEC-001 acceptance criteria end to end against a running
// deployment. Requires `npx playwright install` for browser binaries — not
// run in the sandbox that produced this PR; run it against a real deploy.
test("captures, completes, and deletes a task", async ({ page }) => {
  await page.goto("/");

  const input = page.getByLabel("New task title");
  await input.fill("Write the demo script");
  await input.press("Enter");
  await expect(page.getByText("Write the demo script")).toBeVisible();

  await page.getByLabel("Complete Write the demo script").check();
  await expect(page.getByText(/^Done \(\d+\)$/)).toBeVisible();

  await page.getByRole("button", { name: "Write the demo script" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page.getByText("Write the demo script")).toHaveCount(0);
});
