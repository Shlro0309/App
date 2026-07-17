import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3,
  CalendarClock,
  LayoutDashboard,
  Monitor,
  Receipt,
  ScrollText,
  Timer,
  Utensils,
} from "lucide-react";

const navigationItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Máy trạm", path: "/machines", icon: Monitor },
  { label: "Đặt máy", path: "/reservations", icon: CalendarClock },
  { label: "Phiên chơi", icon: Timer },
  { label: "Dịch vụ", icon: Utensils },
  { label: "Thanh toán", icon: Receipt },
  { label: "Báo cáo", icon: BarChart3 },
];

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-background/80 p-4 backdrop-blur xl:block">
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
          {navigationItems.map((item) => (
            item.path ? (
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
            ) : (
              <button
                className="flex h-10 w-full cursor-not-allowed items-center gap-3 rounded-md px-3 text-sm text-muted-foreground/55"
                disabled
                key={item.label}
                type="button"
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </button>
            )
          ))}
        </nav>
      </aside>

      <header className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur xl:hidden">
        <div className="mb-3 flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-md border bg-muted">
            <ScrollText className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Cyber Game</p>
            <h1 className="text-lg font-semibold">Management</h1>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1">
          {navigationItems.map((item) => (
            item.path ? (
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
            ) : (
              <button
                className="flex h-9 shrink-0 cursor-not-allowed items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground/55"
                disabled
                key={item.label}
                type="button"
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </button>
            )
          ))}
        </nav>
      </header>

      <main className="min-h-screen px-4 py-5 xl:pl-72 xl:pr-6">
        <Outlet />
      </main>
    </div>
  );
}
