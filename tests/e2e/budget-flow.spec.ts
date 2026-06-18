import { expect, test } from "@playwright/test";

test("demo dashboard renders fiscal-year budget and proration labels", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email").fill("matt.mussoline@augustineinstitute.org");
  await page.getByLabel("Password").fill("playwright-password");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "FY26 Licensing Budget" })).toBeVisible();
  await expect(page.getByRole("link", { name: "FY26" })).toBeVisible();
  await expect(page.getByRole("button", { name: "New FY" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create Fiscal Year" })).toHaveCount(0);
  await expect(page.getByText("Local demo mode")).toBeVisible();
  await expect(page.getByText("Remaining", { exact: true })).toBeVisible();
  await expect(page.getByText("prorated").first()).toBeVisible();
});
