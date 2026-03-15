import { expect, test, type Page } from "@playwright/test";

async function startFresh(page: Page) {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.reload();
}

async function finishOnboardingIfPresent(page: Page) {
  const continueButton = page.getByRole("button", { name: "Continue" });
  const startButton = page.getByRole("button", { name: "Start" });

  await continueButton.waitFor({ state: "visible", timeout: 4000 }).catch(() => null);

  if (await continueButton.isVisible().catch(() => false)) {
    await continueButton.click();
    await continueButton.click();
    await startButton.click();
    await expect(startButton).not.toBeVisible();
  }
}

test("core app flow works across the main screens", async ({ page }) => {
  await startFresh(page);

  await expect(page.getByText("Choose your side.")).toBeVisible();
  await page.getByRole("button", { name: "Joshua" }).click();

  await expect(page.getByText("let's get hot")).toBeVisible();
  await expect(page.locator("h1").filter({ hasText: "Joshua" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /months .* days/i })).toBeVisible();

  await finishOnboardingIfPresent(page);

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
  await expect(page.getByText("Partial").first()).toBeVisible();
  await page.getByRole("button", { name: "Edit" }).first().click();
  await expect(page.getByText("Edit workout")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible();
  await page.getByRole("button", { name: "Mark this as a full workout" }).click();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Workout changes saved to progress.")).toBeVisible();
});

test("profile lock remembers the chosen profile after reload", async ({ page }) => {
  await startFresh(page);

  await page.getByRole("button", { name: "Natasha" }).click();
  await finishOnboardingIfPresent(page);
  await page.waitForTimeout(2500);

  await expect(page.locator("h1").filter({ hasText: "Natasha" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Settings" }).dispatchEvent("click");
  await expect(page.getByText("Saved on this device")).toBeVisible();
  await page.getByRole("button", { name: /Lock this phone to Natasha/i }).click();
  await page.reload();

  await expect(page.locator("h1").filter({ hasText: "Natasha" }).first()).toBeVisible();
  await expect(page.getByText("Choose your side.")).not.toBeVisible();
});

test("workout edit flow supports backdating and Natasha progress remains reachable", async ({ page }) => {
  await startFresh(page);

  await page.getByRole("button", { name: "Natasha" }).click();
  await finishOnboardingIfPresent(page);
  await page.waitForTimeout(2500);
  await expect(page.locator("h1").filter({ hasText: "Natasha" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Preview workout" }).click();
  await expect(page.getByText("Workout preview")).toBeVisible();
  await page.getByRole("button", { name: "Begin Session" }).click();
  await expect(page.getByText("Workout mode")).toBeVisible();
  await page.getByRole("button", { name: "Resume workout" }).click();

  await page.locator('input[type="number"]').nth(0).fill("40");
  await page.locator('input[type="number"]').nth(1).fill("10");
  await page.getByRole("button", { name: "Complete Set" }).click();
  await page.getByRole("button", { name: "Exit Session" }).click();
  await page.getByRole("button", { name: "Save progress and exit" }).click();
  await expect(page.getByText("Partial session saved")).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.waitForTimeout(2200);

  await page.getByRole("button", { name: "Progress" }).click();
  await expect(page.getByRole("heading", { name: "Natasha's summary" })).toBeVisible();
  await page.getByRole("button", { name: "Edit" }).first().click();
  const dateTimeInput = page.locator('input[type="datetime-local"]').first();
  await dateTimeInput.fill("2026-03-10T09:15");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Workout changes saved to progress.")).toBeVisible();
  await page.getByRole("button", { name: "Edit" }).first().click();
  await expect(page.locator('input[type="datetime-local"]').first()).toHaveValue("2026-03-10T09:15");
});
