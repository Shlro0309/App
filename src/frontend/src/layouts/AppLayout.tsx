import { Outlet } from "react-router-dom";

const navigationItems = [
  "Dashboard",
  "Máy trạm",
  "Đặt máy",
  "Phiên chơi",
  "Dịch vụ",
  "Thanh toán",
  "Báo cáo",
];

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.16),transparent_32%),hsl(var(--background))]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-background/80 p-4 backdrop-blur xl:block">
        <div className="mb-8">
          <p className="text-sm font-medium text-primary">Cyber Game</p>
          <h1 className="text-xl font-semibold">Management</h1>
        </div>
        <nav className="space-y-1">
          {navigationItems.map((item) => (
            <button
              key={item}
              className="w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              type="button"
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <main className="min-h-screen px-4 py-5 xl:pl-72">
        <Outlet />
      </main>
    </div>
  );
}
