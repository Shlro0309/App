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

  test("customer station login shows invalid credential message", async ({
    page,
  }) => {
    await page.route("**/api/reservations/station-active**", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        status: 404,
        body: JSON.stringify({ message: "No active reservation" }),
      });
    });
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        status: 401,
        body: JSON.stringify({
          status: 401,
          error: "Unauthorized",
          message: "Invalid username or password",
          path: "/api/auth/login",
          fieldErrors: [],
        }),
      });
    });

    await page.goto("/customer/login?machineId=1");
    await page.locator('input[autocomplete="username"]').fill("wrong_user");
    await page.locator('input[autocomplete="current-password"]').fill("wrong_password");
    await page.locator('button[type="submit"]').click();

    await expect(
      page.getByText("Tên đăng nhập hoặc mật khẩu không hợp lệ.")
    ).toBeVisible();
  });

  test("customer station login with zero balance shows top-up warning", async ({
    page,
  }) => {
    await page.route("**/api/reservations/station-active**", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        status: 404,
        body: JSON.stringify({ message: "No active reservation" }),
      });
    });
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        status: 200,
        body: JSON.stringify({
          accessToken: "test-access-token",
          refreshToken: "test-refresh-token",
          tokenType: "Bearer",
          expiresInMinutes: 30,
          user: {
            userId: 10,
            customerId: 20,
            employeeId: null,
            username: "zero_customer",
            fullName: "Zero Customer",
            email: null,
            phoneNumber: null,
            role: "CUSTOMER",
            status: "ACTIVE",
            balance: 0,
          },
        }),
      });
    });

    await page.goto("/customer/login?machineId=1");
    await page.locator('input[autocomplete="username"]').fill("zero_customer");
    await page.locator('input[autocomplete="current-password"]').fill("password123");
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText("Cần nạp tiền")).toBeVisible();
    await expect(
      page.getByText("Số dư của bạn đang bằng 0 nên chưa thể vào phiên chơi.")
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
