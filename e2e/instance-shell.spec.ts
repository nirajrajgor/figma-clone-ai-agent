import { expect, test } from "@playwright/test";

test.describe("Issue #002 — team instance shell", () => {
  test("home page shows entry flow", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Choose a workspace" })).toBeVisible();
    await expect(page.getByTestId("workspace-input")).toBeVisible();
  });

  test("health API returns ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    await expect(res.json()).resolves.toMatchObject({ status: "ok", database: "ok" });
  });
});
