import { expect, test, type Page } from "@playwright/test";

async function startFresh(page: Page) {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.reload();
  await expect(page.getByRole("button", { name: /open profile joshua/i })).toBeVisible();
}

async function finishOnboardingIfPresent(page: Page) {
  const continueButton = page.getByRole("button", { name: "Continue" });
  const startButton = page.getByRole("button", { name: "Start", exact: true });

  await continueButton.waitFor({ state: "visible", timeout: 3000 }).catch(() => null);

  if (await continueButton.isVisible().catch(() => false)) {
    await continueButton.click();
    await continueButton.click();
    await startButton.click();
    await expect(startButton).not.toBeVisible();
  }
}

async function chooseProfile(page: Page, profileName: "Joshua" | "Natasha") {
  const profileButton = page.getByRole("button", { name: new RegExp(`open profile ${profileName}`, "i") }).first();
  await expect(profileButton).toBeVisible();
  await profileButton.evaluate((element: HTMLButtonElement) => element.click());
  await finishOnboardingIfPresent(page);
  await page.waitForTimeout(900);
  await expect(page.locator("h1").filter({ hasText: profileName }).first()).toBeVisible();
}

async function expectBottomNavVisible(page: Page) {
  await expect(page.getByRole("button", { name: "Home", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Workout", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Progress", exact: true })).toBeVisible();
}

async function startSessionFromWorkoutTab(page: Page) {
  await page.getByRole("button", { name: "Workout", exact: true }).click();
  await expect(page.getByRole("button", { name: "Start Session", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Start Session", exact: true }).click();
  await expect(page.getByRole("button", { name: "Log Set", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "All exercises", exact: true })).toBeVisible();
}

async function openWorkoutPreviewFromHome(page: Page) {
  await page.getByRole("button", { name: "Preview", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: /workout previews/i })).toBeVisible();
}

async function logOneSetAndSaveForLater(page: Page, weight: string, reps: string) {
  await page.locator('input[type="number"]').nth(0).fill(weight);
  await page.locator('input[type="number"]').nth(1).fill(reps);
  await page.getByRole("button", { name: "Log Set", exact: true }).click();
  await page.getByRole("button", { name: "Save and exit", exact: true }).click();
  await expect(page.getByText("Workout saved")).toBeVisible();
  const doneButton = page.getByRole("button", { name: "Done", exact: true });
  if (await doneButton.isVisible().catch(() => false)) {
    await doneButton.click();
  }
}

test("joshua mobile flow works across workout, progress, help, and settings", async ({ page }) => {
  await startFresh(page);
  await expect(page.getByRole("button", { name: /install from browser menu/i }).first()).toBeVisible();

  await chooseProfile(page, "Joshua");
  await expectBottomNavVisible(page);
  await openWorkoutPreviewFromHome(page);
  await expect(page.getByRole("heading", { name: /chest \+ triceps a/i })).toBeVisible();
  await page.getByRole("button", { name: /back \+ biceps a/i }).click();
  await expect(page.getByRole("heading", { name: /back \+ biceps a/i })).toBeVisible();
  const previewToggle = page.getByRole("button", { name: "Preview", exact: true });
  await previewToggle.click();
  await expect(previewToggle).toHaveAttribute("aria-expanded", "false");
  await previewToggle.click();
  await expect(previewToggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Workout previews")).toBeVisible();

  await startSessionFromWorkoutTab(page);
  await logOneSetAndSaveForLater(page, "22", "8");

  await page.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(page.getByText("Weekly status")).toBeVisible();
  await expect(page.getByText("Focus:").first()).toBeVisible();
  await expect(page.getByText("Body map")).toBeVisible();

  await page.getByRole("button", { name: "Explain this card" }).first().click();
  await expect(page.getByText("Card guide")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Weekly status" })).toBeVisible();
  await page.getByRole("button", { name: "Close explanation" }).click();

  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.locator("h2").filter({ hasText: "Joshua" })).toBeVisible();
  await expect(page.getByText("Haptic feedback")).toBeVisible();
  await expect(page.getByText("Phone lock")).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
});

test("preview still opens when a session is already active", async ({ page }) => {
  await startFresh(page);
  await chooseProfile(page, "Joshua");
  await expectBottomNavVisible(page);

  await startSessionFromWorkoutTab(page);
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.getByRole("button", { name: "Preview", exact: true }).first().click();

  await expect(page.getByRole("heading", { name: /workout previews/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /chest \+ triceps a/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Log Set", exact: true })).not.toBeVisible();
});

test("profile lock keeps Natasha as the default after reload", async ({ page }) => {
  await startFresh(page);
  await chooseProfile(page, "Natasha");
  await expectBottomNavVisible(page);

  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("button", { name: /lock this phone to natasha/i })).toBeVisible();
  await page.getByRole("button", { name: /lock this phone to natasha/i }).click();
  await expect(page.getByRole("button", { name: /unlock this phone from natasha/i })).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();

  await page.reload();

  await expect(page.locator("h1").filter({ hasText: "Natasha" }).first()).toBeVisible();
  await expectBottomNavVisible(page);
  await expect(page.getByRole("button", { name: /open profile joshua/i })).not.toBeVisible();
});

test("natasha progress edit flow works from the deeper reads layer", async ({ page }) => {
  await startFresh(page);
  await chooseProfile(page, "Natasha");
  await expectBottomNavVisible(page);

  await startSessionFromWorkoutTab(page);
  await logOneSetAndSaveForLater(page, "40", "10");

  await page.getByRole("button", { name: "Progress", exact: true }).click();
  await page.getByRole("button", { name: /dashboard numbers/i }).click();
  await expect(page.getByText("Saved workouts")).toBeVisible();

  await page.getByRole("button", { name: /Edit/ }).first().click();
  await expect(page.getByText("Edit workout")).toBeVisible();
  const dateTimeInput = page.locator('input[type="datetime-local"]').first();
  await dateTimeInput.fill("2026-03-10T09:15");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Workout changes saved to progress.")).toBeVisible();

  await page.getByRole("button", { name: /Edit/ }).first().click();
  await expect(page.locator('input[type="datetime-local"]').first()).toHaveValue("2026-03-10T09:15");
});
