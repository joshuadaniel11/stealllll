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
  await expect(page.getByRole("button", { name: "Resume workout" })).toBeVisible();
  await page.getByRole("button", { name: "Resume workout" }).click();
  await expect(page.getByRole("button", { name: "Exit Session" })).toBeVisible();

  await page.getByRole("button", { name: "Exit Session" }).click();
  await expect(page.getByText("Leave this workout?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Keep session" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Exit without saving" })).toBeVisible();
  await page.getByRole("button", { name: "Keep session" }).click();
  await expect(page.getByText("Leave this workout?")).not.toBeVisible();

  await expect(page.getByText("Workout mode")).toBeVisible();

  await page.locator('input[type="number"]').nth(0).fill("22");
  await page.locator('input[type="number"]').nth(1).fill("8");
  await page.getByRole("button", { name: "Complete Set" }).click();
  await page.getByRole("button", { name: "Exit Session" }).click();
  await page.getByRole("button", { name: "Save progress and exit" }).click();
  await expect(page.getByText("Partial session saved")).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.locator("h1").filter({ hasText: "Joshua" }).first()).toBeVisible();
  await page.waitForTimeout(2200);

  await page.getByRole("button", { name: "Progress" }).click();
  await expect(page.getByRole("heading", { name: "Joshua's summary" })).toBeVisible();
  await expect(page.getByText("Leading indicator")).toBeVisible();
  await page.getByRole("button", { name: "Edit" }).first().click();
  await expect(page.getByText("Edit workout")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible();
  await page.getByRole("button", { name: "Mark this as a full workout" }).click();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Workout changes saved to progress.")).toBeVisible();
});
