import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import type { UserRole } from "./types";

export function RequireAuth({
  children,
  loginPath = "/login",
}: {
  children: ReactNode;
  loginPath?: string;
}) {
  const location = useLocation();
  const status = useAuthStore((state) => state.status);

  if (status !== "authenticated") {
    return <Navigate replace state={{ from: location }} to={loginPath} />;
  }

  return children;
}

export function RequireRole({
  allowedRoles,
  children,
  redirectTo = "/",
}: {
  allowedRoles: UserRole[];
  children: ReactNode;
  redirectTo?: string;
}) {
  const user = useAuthStore((state) => state.user);

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate replace to={redirectTo} />;
  }

  return children;
}

export function GuestOnly({
  children,
  redirectTo = "/",
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const user = useAuthStore((state) => state.user);

  if (user) {
    return <Navigate replace to={redirectTo} />;
  }

  return children;
}
