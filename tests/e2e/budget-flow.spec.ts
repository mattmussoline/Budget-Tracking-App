import { expect, test } from "@playwright/test";

test("demo dashboard renders fiscal-year budget and proration labels", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "FY26 Licensing Budget" })).toBeVisible();
  await expect(page.getByText("Local demo mode")).toBeVisible();
  await expect(page.getByText("Remaining", { exact: true })).toBeVisible();
  await expect(page.getByText("prorated").first()).toBeVisible();
});
