import { expect, test, type Page } from "@playwright/test";

async function expectLoginFields(page: Page) {
  const username = page.locator('input[autocomplete="username"]');
  const password = page.locator('input[autocomplete="current-password"]');
  const submit = page.getByRole("button").first();

  await expect(username).toBeVisible();
  await expect(password).toBeVisible();
  await expect(submit).toBeDisabled();

  await username.fill("demo_user");
  await password.fill("password123");

  await expect(submit).toBeEnabled();
}

test.describe("login surfaces", () => {
  test("operation login renders and enables submit after input", async ({ page }) => {
    await page.goto("/login");

    await expectLoginFields(page);
  });

  test("customer booking login renders and enables submit after input", async ({
    page,
  }) => {
    await page.goto("/booking/login");

    await expectLoginFields(page);
  });

  test("customer station login renders without an active reservation", async ({
    page,
  }) => {
    await page.route("**/api/reservations/station-active**", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        status: 404,
        body: JSON.stringify({
          message: "No active reservation",
        }),
      });
    });

    await page.goto("/customer/login?machineId=1");

    await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
    await expect(
      page.locator('input[autocomplete="current-password"]')
    ).toBeVisible();
  });

  test("customer reservation station login renders reservation code field", async ({
    page,
  }) => {
    await page.route("**/api/reservations/station-active**", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        status: 200,
        body: JSON.stringify({
          reservationId: 123,
          reservationCode: "RSV-000123",
          machineId: 1,
          machineName: "PC-01",
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          status: "CONFIRMED",
        }),
      });
    });

    await page.goto("/customer/reservation-login?machineId=1");

    await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
    await expect(page.locator('input[autocomplete="current-password"]')).toBeVisible();
    await expect(page.locator('input[autocomplete="off"]')).toBeVisible();
  });
});
