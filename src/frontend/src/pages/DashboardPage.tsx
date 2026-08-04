import { useCallback, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Monitor,
  Receipt,
  RefreshCw,
  ShoppingBasket,
  Timer,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ApiError } from "@/types/api";
import { getDashboardOverview } from "@/features/dashboard/dashboardApi";
import type {
  DashboardOverview,
  DashboardStatusCount,
} from "@/features/dashboard/types";
import { useRealtimeEvents } from "@/features/realtime/useRealtimeEvents";
import { CountUpValue } from "@/components/ui/CountUpValue";

const machineStatusLabels: Record<string, string> = {
  AVAILABLE: "Trống",
  RESERVED: "Đã đặt",
  PLAYING: "Đang chơi",
  MAINTENANCE: "Bảo trì",
};

const invoiceStatusLabels: Record<string, string> = {
  PENDING: "Chờ",
  PAID: "Đã thu",
  CANCELLED: "Hủy",
  REFUNDED: "Hoàn",
};

const methodLabels: Record<string, string> = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
  ACCOUNT_BALANCE: "Trừ số dư tài khoản",
};

const statusVisuals: Record<
  string,
  { icon: LucideIcon; meter: string; shell: string }
> = {
  AVAILABLE: {
    icon: Monitor,
    meter: "bg-slate-400",
    shell: "border-slate-400/35 bg-slate-400/10 text-slate-200",
  },
  RESERVED: {
    icon: CalendarClock,
    meter: "bg-sky-300",
    shell:
      "border-sky-300/45 bg-sky-300/10 text-sky-100 shadow-[0_0_18px_rgba(123,209,250,0.14)]",
  },
  PLAYING: {
    icon: Activity,
    meter: "bg-primary",
    shell:
      "border-primary/45 bg-primary/10 text-primary shadow-[0_0_18px_rgba(78,222,163,0.16)]",
  },
  MAINTENANCE: {
    icon: AlertTriangle,
    meter: "bg-amber-300",
    shell:
      "border-amber-300/45 bg-amber-300/10 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.16)]",
  },
};

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) {
      return data.message;
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      return "Phiên đăng nhập không có quyền truy cập tổng quan.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể tải dữ liệu tổng quan.";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatChartDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours <= 0) {
    return `${remainingMinutes} phút`;
  }
  return `${hours} giờ ${remainingMinutes} phút`;
}

function transactionLabel(value: string) {
  if (value === "PLAY_SESSION") {
    return "Phiên chơi";
  }
  if (value === "FOOD_ORDER") {
    return "Đơn gọi món";
  }
  if (value === "COMBINED") {
    return "Tổng hợp";
  }
  if (value === "WALLET_TOP_UP") {
    return "Nạp tiền";
  }
  return value;
}

function StatusMeter({
  items,
  labels,
}: {
  items: DashboardStatusCount[];
  labels: Record<string, string>;
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
        const visual = statusVisuals[item.status] ?? statusVisuals.AVAILABLE;
        const Icon = visual.icon;
        return (
          <div key={item.status} className="grid gap-2 rounded-md border border-white/5 bg-white/[0.025] p-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-md border ${visual.shell}`}
                >
                  <Icon className="size-4" />
                </span>
                <span className="truncate text-muted-foreground">
                  {labels[item.status] ?? item.status}
                </span>
              </div>
              <CountUpValue
                className="metric-number font-semibold"
                value={item.count}
                format={(value) => String(Math.round(value))}
              />
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${visual.meter}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  formatValue,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof Receipt;
  formatValue?: (value: number) => string;
}) {
  return (
    <div className="glacier-card rounded-lg p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="label-caps text-muted-foreground">{label}</span>
        <span className="grid size-9 shrink-0 place-items-center rounded-md border border-primary/30 bg-primary/10 text-primary shadow-[0_0_18px_rgba(78,222,163,0.14)]">
          <Icon className="size-5" />
        </span>
      </div>
      <p className="metric-number text-2xl font-semibold leading-tight">
        <CountUpValue
          value={value}
          format={formatValue ?? ((next) => String(Math.round(next)))}
        />
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <section className="mx-auto grid max-w-7xl gap-5">
      <div className="grid gap-2">
        <div className="skeleton-line h-4 w-28" />
        <div className="skeleton-line h-8 w-72 max-w-full" />
        <div className="skeleton-line h-4 w-48" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div className="glacier-card grid gap-4 rounded-lg p-4" key={index}>
            <div className="flex items-center justify-between">
              <div className="skeleton-line h-4 w-28" />
              <div className="skeleton-line size-9" />
            </div>
            <div className="skeleton-line h-8 w-36" />
            <div className="skeleton-line h-3 w-44 max-w-full" />
          </div>
        ))}
      </div>
      <div className="glass-panel grid min-h-[300px] gap-4 rounded-lg p-4">
        <div className="skeleton-line h-5 w-44" />
        <div className="skeleton-line h-full min-h-56" />
      </div>
    </section>
  );
}

export function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardOverview();
      setOverview(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useRealtimeEvents(
    [
      "MACHINE_STATUS_CHANGED",
      "RESERVATION_CHANGED",
      "PLAY_SESSION_CHANGED",
      "FOOD_ORDER_CHANGED",
      "PAYMENT_CHANGED",
    ],
    () => void loadOverview()
  );

  const chartData = useMemo(
    () =>
      overview?.revenueTrend.map((point) => ({
        date: formatChartDate(point.date),
        revenue: point.revenue,
        paidInvoiceCount: point.paidInvoiceCount,
      })) ?? [],
    [overview]
  );

  if (loading && !overview) {
    return <DashboardSkeleton />;
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-2">
          <p className="text-sm font-medium text-primary">Tổng quan</p>
          <h2 className="text-2xl font-semibold">Tổng quan hệ thống</h2>
          {overview ? (
            <p className="text-sm text-muted-foreground">
              Cập nhật lúc {formatDateTime(overview.generatedAt)}
            </p>
          ) : null}
        </div>
        <button
          className="inline-flex h-10 items-center gap-2 self-start rounded-md border px-4 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground lg:self-auto"
          type="button"
          onClick={() => void loadOverview()}
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {error ? (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          <AlertTriangle className="size-4" />
          <span>{error}</span>
        </div>
      ) : null}

      {overview ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              detail={`${overview.paidInvoicesToday} hóa đơn đã thu hôm nay`}
              formatValue={formatCurrency}
              icon={Receipt}
              label="Doanh thu hôm nay"
              value={overview.todayRevenue}
            />
            <MetricCard
              detail={`${overview.completedPlaySessionsToday} phiên hoàn tất hôm nay`}
              icon={Timer}
              label="Phiên đang chơi"
              value={overview.activePlaySessions}
            />
            <MetricCard
              detail={`${overview.availableMachines}/${overview.totalMachines} máy đang trống`}
              icon={Monitor}
              label="Máy hoạt động"
              value={overview.playingMachines}
            />
            <MetricCard
              detail={`${overview.confirmedReservationsToday} lịch đã xác nhận hôm nay`}
              icon={CalendarClock}
              label="Đặt máy hôm nay"
              value={overview.todayReservations}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              detail="Tổng doanh thu đã thanh toán trong 7 ngày"
              formatValue={formatCurrency}
              icon={WalletCards}
              label="Doanh thu 7 ngày"
              value={overview.weekRevenue}
            />
            <MetricCard
              detail="Hóa đơn đang chờ xử lý"
              icon={Clock3}
              label="Chờ thanh toán"
              value={overview.pendingInvoices}
            />
            <MetricCard
              detail={`${overview.completedOrdersToday} đơn hoàn tất hôm nay`}
              icon={ShoppingBasket}
              label="Đơn gọi món chờ"
              value={overview.pendingOrders}
            />
            <MetricCard
              detail={`${overview.lowStockServices} dịch vụ sắp hết hàng`}
              icon={CheckCircle2}
              label="Dịch vụ đang hoạt động"
              value={overview.activeServices}
            />
          </div>

          <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
            <div className="glass-panel rounded-lg p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Doanh thu 7 ngày</h3>
                  <p className="text-sm text-muted-foreground">
                    Chỉ tính hóa đơn đã thanh toán
                  </p>
                </div>
                <Activity className="size-5 text-primary" />
              </div>
              <div className="h-72">
                <ResponsiveContainer height="100%" width="100%">
                  <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.05)"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis dataKey="date" tickLine={false} />
                    <YAxis
                      tickFormatter={(value) =>
                        new Intl.NumberFormat("vi-VN", {
                          notation: "compact",
                        }).format(Number(value))
                      }
                      tickLine={false}
                      width={56}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(13, 22, 42, 0.94)",
                        border: "1px solid rgba(123, 209, 250, 0.35)",
                        borderRadius: 8,
                        color: "#dae2fd",
                      }}
                      cursor={{
                        stroke: "#7bd1fa",
                        strokeDasharray: "4 4",
                        strokeWidth: 1,
                      }}
                      formatter={(value, name) => [
                        name === "revenue"
                          ? formatCurrency(Number(value))
                          : Number(value),
                        name === "revenue" ? "Doanh thu" : "Hóa đơn",
                      ]}
                    />
                    <Area
                      dataKey="revenue"
                      fill="url(#revenueFill)"
                      stroke="#22c55e"
                      strokeWidth={2}
                      type="monotone"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-5">
              <div className="glass-panel rounded-lg p-4">
                <h3 className="mb-4 font-semibold">Trạng thái máy</h3>
                <StatusMeter
                  items={overview.machineStatuses}
                  labels={machineStatusLabels}
                />
              </div>
              <div className="glass-panel rounded-lg p-4">
                <h3 className="mb-4 font-semibold">Trạng thái hóa đơn</h3>
                <StatusMeter
                  items={overview.invoiceStatuses}
                  labels={invoiceStatusLabels}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <div className="glass-panel rounded-lg">
              <div className="border-b p-4">
                <h3 className="font-semibold">Phiên đang hoạt động</h3>
              </div>
              <div className="divide-y">
                {overview.activeSessions.length > 0 ? (
                  overview.activeSessions.map((session) => (
                    <div
                      className="grid gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_auto]"
                      key={session.id}
                    >
                      <div>
                        <p className="font-medium">{session.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.machineName} · {session.areaName}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-medium">
                          {formatDuration(session.durationMinutes)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(session.startedAt)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-sm text-muted-foreground">
                    Chưa có phiên chơi đang hoạt động.
                  </p>
                )}
              </div>
            </div>

            <div className="glass-panel rounded-lg">
              <div className="border-b p-4">
                <h3 className="font-semibold">Thanh toán gần đây</h3>
              </div>
              <div className="divide-y">
                {overview.recentPayments.length > 0 ? (
                  overview.recentPayments.map((payment) => (
                    <div
                      className="grid gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_auto]"
                      key={payment.id}
                    >
                      <div>
                        <p className="font-medium">{payment.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {transactionLabel(payment.transactionType)} ·{" "}
                          {payment.paymentMethod
                            ? methodLabels[payment.paymentMethod] ??
                              payment.paymentMethod
                            : "Chưa ghi nhận"}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-medium">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(payment.transactionAt)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-sm text-muted-foreground">
                    Chưa có hóa đơn đã thanh toán.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
