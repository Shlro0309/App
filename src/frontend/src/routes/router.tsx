import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { DashboardPage } from "@/pages/DashboardPage";
import { FoodServiceManagementPage } from "@/features/food-service/FoodServiceManagementPage";
import { MachineManagementPage } from "@/features/machines/MachineManagementPage";
import { PaymentManagementPage } from "@/features/payments/PaymentManagementPage";
import { PlaySessionManagementPage } from "@/features/play-sessions/PlaySessionManagementPage";
import { ReservationManagementPage } from "@/features/reservations/ReservationManagementPage";
import { UserManagementPage } from "@/features/users/UserManagementPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "machines",
        element: <MachineManagementPage />,
      },
      {
        path: "users",
        element: <UserManagementPage />,
      },
      {
        path: "reservations",
        element: <ReservationManagementPage />,
      },
      {
        path: "play-sessions",
        element: <PlaySessionManagementPage />,
      },
      {
        path: "food-services",
        element: <FoodServiceManagementPage />,
      },
      {
        path: "payments",
        element: <PaymentManagementPage />,
      },
    ],
  },
]);
