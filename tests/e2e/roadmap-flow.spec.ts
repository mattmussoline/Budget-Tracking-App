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
  await expect(page.getByRole("combobox", { name: "Month" })).toBeVisible();
  await expect(page.getByLabel("Title")).toHaveValue("");
  await expect(page.getByRole("combobox", { name: "Audience" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Format" })).toBeVisible();
  await expect(page.getByLabel("Release Date")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Status" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Genre" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Series" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Use Case" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Color" })).toBeVisible();
  await expect(page.getByLabel("Feast")).toHaveCount(0);
  await expect(page.getByLabel("Notes")).toBeVisible();
  await page.getByRole("combobox", { name: "Audience" }).selectOption("Teens/YA");
  await page.getByRole("combobox", { name: "Format" }).selectOption("Small Group Study");
  await page.getByRole("combobox", { name: "Status" }).selectOption("Finalized");
  await page.getByRole("combobox", { name: "Genre" }).selectOption("Leader Formation");
  await page.getByRole("combobox", { name: "Series" }).selectOption("__custom__");
  await page.getByLabel("Custom Series").fill("New Series");
  await page.getByRole("combobox", { name: "Use Case" }).selectOption("Parish");
  await page.getByRole("combobox", { name: "Color" }).selectOption("purple");
  await page.getByRole("combobox", { name: "Month" }).selectOption("__custom__");
  await page.getByLabel("Custom Month").fill("September 26");
  await page.getByLabel("Title").fill("New July Roadmap Item");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByRole("button", { name: /New July Roadmap Item/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "September 26" })).toBeVisible();

  await page.getByRole("button", { name: /New July Roadmap Item/ }).click();
  await expect(page.getByRole("combobox", { name: "Audience" })).toHaveValue("Teens/YA");
  await expect(page.getByRole("combobox", { name: "Format" })).toHaveValue("Small Group Study");
  await expect(page.getByRole("combobox", { name: "Status" })).toHaveValue("Finalized");
  await expect(page.getByRole("combobox", { name: "Genre" })).toHaveValue("Leader Formation");
  await expect(page.getByRole("combobox", { name: "Series" })).toHaveValue("New Series");
  await expect(page.getByRole("combobox", { name: "Use Case" })).toHaveValue("Parish");
  await expect(page.getByRole("combobox", { name: "Color" })).toHaveValue("purple");
  await expect(page.getByRole("combobox", { name: "Month" })).toHaveValue("September 26");
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
