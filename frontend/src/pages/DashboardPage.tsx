import { Activity, Monitor, Receipt, Users } from "lucide-react";

const metrics = [
  { label: "Doanh thu hôm nay", value: "0đ", icon: Receipt },
  { label: "Khách đang chơi", value: "0", icon: Users },
  { label: "Máy hoạt động", value: "0", icon: Monitor },
  { label: "Sự kiện realtime", value: "0", icon: Activity },
];

export function DashboardPage() {
  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-2">
        <p className="text-sm font-medium text-primary">Dashboard</p>
        <h2 className="text-2xl font-semibold">Tổng quan hệ thống</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="rounded-lg border bg-background/75 p-5 shadow-sm backdrop-blur"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {metric.label}
                </span>
                <Icon className="size-5 text-primary" />
              </div>
              <p className="text-2xl font-semibold">{metric.value}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
