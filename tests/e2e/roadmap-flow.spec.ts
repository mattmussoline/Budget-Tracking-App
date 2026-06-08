import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/roadmap");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email").fill("matt.mussoline@augustineinstitute.org");
  await page.getByLabel("Password").fill("playwright-password");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
  await page.goto("/roadmap");
}

test("roadmap hides past months and supports click-to-edit planning items", async ({ page }) => {
  await login(page);

  await expect(page.getByRole("heading", { name: "Roadmap Command Center" })).toBeVisible();
  await expect(page.getByText("Stats scoped to FY26")).toBeVisible();
  await expect(page.getByRole("heading", { name: "March 26" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "June 26" })).toBeVisible();

  await page.getByRole("button", { name: "Show 3 Past Months" }).click();
  await expect(page.getByRole("heading", { name: "March 26" })).toBeVisible();

  await page.getByRole("button", { name: /Fasting \| What Catholics Believe/ }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Fasting | What Catholics Believe" })).toBeVisible();
  await page.getByLabel("Title").fill("Fasting | What Catholics Believe Updated");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByRole("button", { name: /Fasting \| What Catholics Believe Updated/ })).toBeVisible();

  await page.getByRole("button", { name: "Add Release" }).click();
  await expect(page.getByRole("heading", { name: "Add Release" })).toBeVisible();
  await expect(page.getByLabel("Month")).toBeVisible();
  await expect(page.getByLabel("Title")).toHaveValue("New Release");
  await expect(page.getByLabel("Audience")).toBeVisible();
  await expect(page.getByLabel("Format")).toBeVisible();
  await expect(page.getByLabel("Release Date")).toBeVisible();
  await expect(page.getByLabel("Status")).toBeVisible();
  await expect(page.getByLabel("Genre")).toBeVisible();
  await expect(page.getByLabel("Series")).toBeVisible();
  await expect(page.getByLabel("Use Case")).toBeVisible();
  await expect(page.getByLabel("Feast")).toHaveCount(0);
  await expect(page.getByLabel("Notes")).toBeVisible();
  await page.getByLabel("Audience").fill("Teens/YA");
  await page.getByLabel("Format").fill("Small Group Study");
  await page.getByLabel("Status").fill("Finalized");
  await page.getByLabel("Genre").fill("Leader Formation");
  await page.getByLabel("Series").fill("New Series");
  await page.getByLabel("Use Case").fill("Parish");
  await page.getByLabel("Month").fill("September 26");
  await page.getByLabel("Title").fill("New July Roadmap Item");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByRole("button", { name: /New July Roadmap Item/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "September 26" })).toBeVisible();

  await page.getByRole("button", { name: /New July Roadmap Item/ }).click();
  await expect(page.getByLabel("Audience")).toHaveValue("Teens/YA");
  await expect(page.getByLabel("Format")).toHaveValue("Small Group Study");
  await expect(page.getByLabel("Status")).toHaveValue("Finalized");
  await expect(page.getByLabel("Genre")).toHaveValue("Leader Formation");
  await expect(page.getByLabel("Series")).toHaveValue("New Series");
  await expect(page.getByLabel("Use Case")).toHaveValue("Parish");
  await expect(page.getByLabel("Month")).toHaveValue("September 26");
  await page.getByRole("button", { name: "Save Changes" }).click();

  await page.getByRole("button", { name: "Timeline View" }).click();
  await expect(page.getByRole("heading", { name: "Timeline View" })).toBeVisible();
  await expect(page.getByText("New July Roadmap Item")).toBeVisible();
  await page.getByRole("button", { name: "Board View" }).click();
  await expect(page.getByRole("heading", { name: "Roadmap Months" })).toBeVisible();

  await page.getByRole("button", { name: "Add Release" }).click();
  await page.getByRole("button", { name: "Close editor" }).click();

  await page.getByRole("button", { name: /Practicing Catholic/ }).click();
  await expect(page.getByRole("heading", { name: "Practicing Catholic" })).toBeVisible();
  await page.getByLabel("Cadence").fill("2 per week");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByRole("cell", { name: "2 per week" })).toBeVisible();
});
