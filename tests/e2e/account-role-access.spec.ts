import { expect, test, type Page } from "@playwright/test";
import { authenticateAs, mockApiJson, pageResponse } from "./support/auth";

const roles = [
  { id: 1, name: "ADMIN", description: null },
  { id: 2, name: "EMPLOYEE", description: null },
  { id: 3, name: "CUSTOMER", description: null },
];

const customerUsers = pageResponse([
  {
    id: 101,
    username: "customer_alpha",
    fullName: "Customer Alpha",
    phoneNumber: "0900000001",
    email: "alpha@example.test",
    role: "CUSTOMER",
    status: "ACTIVE",
    customerId: 201,
    customerBalance: 50000,
    employeeId: null,
    createdAt: "2026-07-28T08:00:00",
  },
]);

async function mockUserManagementApi(page: Page) {
  await mockApiJson(page, "**/api/users/roles", roles);
  await page.route(/\/api\/users(?:\?|$)/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      status: 200,
      body: JSON.stringify(customerUsers),
    });
  });
}

test.describe("account management role access", () => {
  test("employee account table does not render the role column", async ({
    page,
  }) => {
    await authenticateAs(page, "EMPLOYEE");
    await mockUserManagementApi(page);

    await page.goto("/users");

    await expect(page.getByRole("heading", { name: "Quản lý tài khoản" })).toBeVisible();
    await expect(page.locator("thead").getByText("Vai trò")).toHaveCount(0);
    await expect(page.getByText("customer_alpha")).toBeVisible();
    await expect(page.locator("tbody").getByText("Khách hàng")).toHaveCount(0);
  });

  test("admin account table keeps the role column and role controls", async ({
    page,
  }) => {
    await authenticateAs(page, "ADMIN");
    await mockUserManagementApi(page);

    await page.goto("/users");

    await expect(page.locator("thead").getByText("Vai trò")).toBeVisible();
    await expect(page.locator("tbody span").getByText("Khách hàng")).toBeVisible();
    await page.getByRole("button", { name: "Sửa tài khoản" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Vai trò" })).toBeVisible();
  });

  test("employee cannot open reports route", async ({ page }) => {
    await authenticateAs(page, "EMPLOYEE");
    await mockApiJson(page, "**/api/dashboard/overview", {
      activeSessions: 0,
      availableMachines: 0,
      reservedMachines: 0,
      todayRevenue: 0,
      pendingPayments: 0,
      pendingFoodOrders: 0,
      upcomingReservations: 0,
      recentActivities: [],
    });

    await page.goto("/reports");

    await expect(page).not.toHaveURL(/\/reports$/);
    await expect(page.getByText("Báo cáo")).toHaveCount(0);
  });
});
