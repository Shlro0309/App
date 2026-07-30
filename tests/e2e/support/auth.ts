import type { Page } from "@playwright/test";

export type TestUserRole = "ADMIN" | "EMPLOYEE" | "CUSTOMER";

export type TestCurrentUser = {
  userId: number;
  customerId: number | null;
  employeeId: number | null;
  username: string;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  role: TestUserRole;
  status: string;
  balance: number | null;
};

const roleDefaults: Record<TestUserRole, Partial<TestCurrentUser>> = {
  ADMIN: {
    userId: 1,
    customerId: null,
    employeeId: 1,
    username: "mock_admin",
    fullName: "Mock Admin",
    balance: null,
  },
  EMPLOYEE: {
    userId: 2,
    customerId: null,
    employeeId: 2,
    username: "mock_employee",
    fullName: "Mock Employee",
    balance: null,
  },
  CUSTOMER: {
    userId: 3,
    customerId: 3,
    employeeId: null,
    username: "mock_customer",
    fullName: "Mock Customer",
    balance: 120000,
  },
};

export function makeCurrentUser(
  role: TestUserRole,
  overrides: Partial<TestCurrentUser> = {}
): TestCurrentUser {
  return {
    userId: roleDefaults[role].userId ?? 999,
    customerId: roleDefaults[role].customerId ?? null,
    employeeId: roleDefaults[role].employeeId ?? null,
    username: roleDefaults[role].username ?? "test_user",
    fullName: roleDefaults[role].fullName ?? "Test User",
    email: null,
    phoneNumber: null,
    role,
    status: "ACTIVE",
    balance: roleDefaults[role].balance ?? null,
    ...overrides,
  };
}

export async function authenticateAs(
  page: Page,
  role: TestUserRole,
  overrides: Partial<TestCurrentUser> = {}
) {
  const user = makeCurrentUser(role, overrides);

  await page.addInitScript(() => {
    window.localStorage.setItem("accessToken", "e2e-access-token");
    window.localStorage.setItem("refreshToken", "e2e-refresh-token");
  });

  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      status: 200,
      body: JSON.stringify(user),
    });
  });

  return user;
}

export async function mockApiJson(
  page: Page,
  url: string,
  data: unknown,
  status = 200
) {
  await page.route(url, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      status,
      body: JSON.stringify(data),
    });
  });
}

export function pageResponse<T>(content: T[]) {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    number: 0,
    size: Math.max(content.length, 1),
    first: true,
    last: true,
  };
}
