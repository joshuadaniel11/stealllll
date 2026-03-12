import { expect, test } from "@playwright/test";

test("core app flow works across the main screens", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Choose your side.")).toBeVisible();
  await page.getByRole("button", { name: "Joshua" }).click();

  await expect(page.getByText("let's get hot")).toBeVisible();
  await expect(page.locator("h1").filter({ hasText: "Joshua" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /months .* days/i })).toBeVisible();

  const continueButton = page.getByRole("button", { name: "Continue" });
  const startButton = page.getByRole("button", { name: "Start" });
  if (await continueButton.isVisible().catch(() => false)) {
    await continueButton.click();
    await continueButton.click();
    await startButton.click();
  }

  await page.getByRole("button", { name: "Preview workout" }).click();
  await expect(page.getByText("Workout preview")).toBeVisible();
  await expect(page.getByRole("button", { name: "Begin Session" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "Begin" }).first().click();
  await expect(page.getByText("Workout mode")).toBeVisible();
  await expect(page.getByRole("button", { name: "Exit Session" })).toBeVisible();

  await page.getByRole("button", { name: "Exit Session" }).click();
  await expect(page.getByText("Leave without saving?")).toBeVisible();
  await expect(page.getByRole("button", { name: "No, keep session" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Yes, exit" })).toBeVisible();
  await page.getByRole("button", { name: "No, keep session" }).click();

  await expect(page.getByText("Workout mode")).toBeVisible();

  await page.getByRole("button", { name: "Exit Session" }).click();
  await page.getByRole("button", { name: "Yes, exit" }).click();
  await expect(page.locator("h1").filter({ hasText: "Joshua" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Settings" }).click({ force: true });
  await expect(page.getByText("Quiet, private, simple.")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "Progress" }).click();
  await expect(page.getByRole("heading", { name: "Joshua's summary" })).toBeVisible();
  await expect(page.getByText("Leading indicator")).toBeVisible();
});
