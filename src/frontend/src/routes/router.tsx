import { createBrowserRouter, Navigate } from "react-router-dom";
import { GuestOnly, RequireAuth, RequireRole } from "@/features/auth/RequireAuth";
import { LoginPage } from "@/features/auth/LoginPage";
import { CustomerBookingLoginPage } from "@/features/customer/CustomerBookingLoginPage";
import { CustomerPrebookPage } from "@/features/customer/CustomerPrebookPage";
import { CustomerSideWindowPage } from "@/features/customer/CustomerSideWindowPage";
import {
  CustomerReservedStationLoginPage,
  CustomerStationLoginPage,
} from "@/features/customer/CustomerStationLoginPage";
import { AppLayout } from "@/layouts/AppLayout";
import { FoodServiceManagementPage } from "@/features/food-service/FoodServiceManagementPage";
import { MachineManagementPage } from "@/features/machines/MachineManagementPage";
import { PaymentManagementPage } from "@/features/payments/PaymentManagementPage";
import { PlaySessionManagementPage } from "@/features/play-sessions/PlaySessionManagementPage";
import { ReservationManagementPage } from "@/features/reservations/ReservationManagementPage";
import { ReportPage } from "@/features/reports/ReportPage";
import { UserManagementPage } from "@/features/users/UserManagementPage";
import { HomePage } from "@/pages/HomePage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <GuestOnly>
        <LoginPage />
      </GuestOnly>
    ),
  },
  {
    path: "/booking/login",
    element: (
      <GuestOnly redirectTo="/booking">
        <CustomerBookingLoginPage />
      </GuestOnly>
    ),
  },
  {
    path: "/customer/login",
    element: <CustomerStationLoginPage />,
  },
  {
    path: "/customer/reservation-login",
    element: <CustomerReservedStationLoginPage />,
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <RequireRole allowedRoles={["ADMIN", "EMPLOYEE"]} redirectTo="/customer">
          <AppLayout />
        </RequireRole>
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "machines",
        element: (
          <RequireRole allowedRoles={["ADMIN", "EMPLOYEE"]}>
            <MachineManagementPage />
          </RequireRole>
        ),
      },
      {
        path: "users",
        element: (
          <RequireRole allowedRoles={["ADMIN", "EMPLOYEE"]}>
            <UserManagementPage />
          </RequireRole>
        ),
      },
      {
        path: "reservations",
        element: (
          <RequireRole allowedRoles={["ADMIN", "EMPLOYEE"]}>
            <ReservationManagementPage />
          </RequireRole>
        ),
      },
      {
        path: "play-sessions",
        element: (
          <RequireRole allowedRoles={["ADMIN", "EMPLOYEE"]}>
            <PlaySessionManagementPage />
          </RequireRole>
        ),
      },
      {
        path: "food-services",
        element: (
          <RequireRole allowedRoles={["ADMIN", "EMPLOYEE"]}>
            <FoodServiceManagementPage />
          </RequireRole>
        ),
      },
      {
        path: "payments",
        element: (
          <RequireRole allowedRoles={["ADMIN", "EMPLOYEE"]}>
            <PaymentManagementPage />
          </RequireRole>
        ),
      },
      {
        path: "reports",
        element: (
          <RequireRole allowedRoles={["ADMIN"]}>
            <ReportPage />
          </RequireRole>
        ),
      },
    ],
  },
  {
    path: "/customer",
    element: (
      <RequireAuth loginPath="/customer/login">
        <RequireRole allowedRoles={["CUSTOMER"]}>
          <CustomerSideWindowPage />
        </RequireRole>
      </RequireAuth>
    ),
  },
  {
    path: "/booking",
    element: (
      <RequireAuth loginPath="/booking/login">
        <RequireRole allowedRoles={["CUSTOMER"]}>
          <CustomerPrebookPage />
        </RequireRole>
      </RequireAuth>
    ),
  },
  {
    path: "/prebook",
    element: <Navigate replace to="/booking" />,
  },
]);
