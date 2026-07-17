import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { DashboardPage } from "@/pages/DashboardPage";
import { MachineManagementPage } from "@/features/machines/MachineManagementPage";
import { ReservationManagementPage } from "@/features/reservations/ReservationManagementPage";

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
        path: "reservations",
        element: <ReservationManagementPage />,
      },
    ],
  },
]);
