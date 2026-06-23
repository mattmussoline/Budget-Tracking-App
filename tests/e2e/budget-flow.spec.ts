import { expect, test } from "@playwright/test";

test("password login opens the dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("Work email").fill("matt.mussoline@augustineinstitute.org");
  await page.getByLabel("Shared password").fill("playwright-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("matt.mussoline@augustineinstitute.org")).toBeVisible();
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  await expect(page.getByText("Internal Licensing")).toBeVisible();
  await expect(page.getByText("Remaining", { exact: true })).toBeVisible();
});
