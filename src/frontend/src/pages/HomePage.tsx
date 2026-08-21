import { Navigate } from "react-router-dom";
import { DashboardPage } from "@/pages/DashboardPage";
import { useAuthStore } from "@/stores/authStore";

export function HomePage() {
  const user = useAuthStore((state) => state.user);

  if (user?.role === "CUSTOMER") {
    return <Navigate replace to="/customer" />;
  }

  return <DashboardPage />;
}
