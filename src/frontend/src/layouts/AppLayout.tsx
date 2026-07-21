import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  CalendarClock,
  LayoutDashboard,
  LogOut,
  Monitor,
  Receipt,
  ScrollText,
  Timer,
  Utensils,
  UserCircle,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import type { UserRole } from "@/features/auth/types";

type NavigationItem = {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  roles?: UserRole[];
};

const navigationItems: NavigationItem[] = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["ADMIN", "EMPLOYEE"] },
  { label: "Tài khoản", path: "/users", icon: Users, roles: ["ADMIN"] },
  { label: "Máy trạm", path: "/machines", icon: Monitor, roles: ["ADMIN", "EMPLOYEE"] },
  { label: "Đặt máy", path: "/reservations", icon: CalendarClock },
  { label: "Phiên chơi", path: "/play-sessions", icon: Timer },
  { label: "Dịch vụ", path: "/food-services", icon: Utensils },
  { label: "Thanh toán", path: "/payments", icon: Receipt },
  { label: "Báo cáo", path: "/reports", icon: BarChart3, roles: ["ADMIN", "EMPLOYEE"] },
];

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Quản trị viên",
  EMPLOYEE: "Nhân viên",
  CUSTOMER: "Khách hàng",
};

export function AppLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const visibleNavigationItems = navigationItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-background/80 p-4 backdrop-blur xl:block">
        <div className="flex h-full flex-col">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-md border bg-muted">
              <ScrollText className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">Cyber Game</p>
              <h1 className="text-xl font-semibold">Management</h1>
            </div>
          </div>

          <nav className="space-y-1">
            {visibleNavigationItems.map((item) => (
              <NavLink
                key={item.label}
                className={({ isActive }) =>
                  [
                    "flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm transition",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  ].join(" ")
                }
                end={item.path === "/"}
                to={item.path}
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto grid gap-3 rounded-md border bg-background p-3">
            <div className="flex items-center gap-3">
              <UserCircle className="size-8 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {user?.fullName ?? user?.username}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user ? roleLabels[user.role] : ""}
                </p>
              </div>
            </div>
            <button
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              type="button"
              onClick={() => void handleLogout()}
            >
              <LogOut className="size-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur xl:hidden">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-md border bg-muted">
              <ScrollText className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">Cyber Game</p>
              <h1 className="text-lg font-semibold">Management</h1>
            </div>
          </div>
          <button
            className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-muted hover:text-foreground"
            title="Đăng xuất"
            type="button"
            onClick={() => void handleLogout()}
          >
            <LogOut className="size-4" />
          </button>
        </div>
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <UserCircle className="size-4 text-primary" />
          <span className="truncate">{user?.fullName ?? user?.username}</span>
          <span>·</span>
          <span>{user ? roleLabels[user.role] : ""}</span>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1">
          {visibleNavigationItems.map((item) => (
            <NavLink
              key={item.label}
              className={({ isActive }) =>
                [
                  "flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-sm transition",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground",
                ].join(" ")
              }
              end={item.path === "/"}
              to={item.path}
            >
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="min-h-screen px-4 py-5 xl:pl-72 xl:pr-6">
        <Outlet />
      </main>
    </div>
  );
}
