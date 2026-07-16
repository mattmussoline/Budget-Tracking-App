import { expect, type Page, test } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("Work email").fill("matt.mussoline@augustineinstitute.org");
  await page.getByLabel("Shared password").fill(process.env.APP_PASSWORD ?? "playwright-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/roadmap$/);
}

test("password login opens the roadmap", async ({ page }) => {
  await login(page);

  await expect(page.locator("header").getByText("matt.mussoline@augustineinstitute.org")).toBeVisible();
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  await expect(page.getByText("Internal Licensing")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Roadmap" })).toBeVisible();
});

test("mobile dashboard does not horizontally overflow", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile-only layout regression check.");

  await login(page);
  await page.goto("/dashboard");

  const widths = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));

  expect(widths.scrollWidth).toBeLessThanOrEqual(widths.clientWidth);
});
