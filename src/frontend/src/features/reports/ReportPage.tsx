import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Monitor,
  RefreshCw,
  Search,
  ShieldAlert,
  ShoppingBasket,
  Trophy,
  WalletCards,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ApiError } from "@/types/api";
import { useRealtimeEvents } from "@/features/realtime/useRealtimeEvents";
import { getReportOverview } from "./reportApi";
import type {
  ReportBreakdown,
  ReportFilters,
  ReportMachineUsage,
  ReportOverview,
  ReportServiceSales,
  ReportTopCustomer,
} from "./types";

const transactionLabels: Record<string, string> = {
  PLAY_SESSION: "Phiên chơi",
  FOOD_ORDER: "Đơn gọi món",
  COMBINED: "Tổng hợp",
  WALLET_TOP_UP: "Nạp tiền",
};

const methodLabels: Record<string, string> = {
  CASH: "Tiền mặt",
  CARD: "Thẻ",
  BANK_TRANSFER: "Chuyển khoản",
  E_WALLET: "Ví điện tử",
  UNKNOWN: "Chưa ghi nhận",
};

function defaultFilters(): ReportFilters {
  const today = new Date();
  const fromDate = new Date(today);
  fromDate.setDate(today.getDate() - 29);

  return {
    fromDate: toInputDate(fromDate),
    toDate: toInputDate(today),
  };
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) {
      return data.message;
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      return "Phiên đăng nhập không có quyền truy cập báo cáo.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể tải dữ liệu báo cáo.";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
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

function displayLabel(value: string, labels: Record<string, string>) {
  return labels[value] ?? value;
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof CircleDollarSign;
}) {
  return (
    <div className="rounded-md border bg-background p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="size-5 shrink-0 text-primary" />
      </div>
      <p className="text-2xl font-semibold leading-tight">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function BreakdownList({
  items,
  labels,
}: {
  items: ReportBreakdown[];
  labels: Record<string, string>;
}) {
  const total = items.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
      ) : null}
      {items.map((item) => {
        const percent = total > 0 ? Math.round((item.revenue / total) * 100) : 0;
        return (
          <div key={item.label} className="grid gap-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                {displayLabel(item.label, labels)}
              </span>
              <span className="font-medium">{formatCurrency(item.revenue)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {item.count} giao dịch
            </p>
          </div>
        );
      })}
    </div>
  );
}

function MachineUsageTable({ items }: { items: ReportMachineUsage[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead className="bg-muted/30 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Máy</th>
            <th className="px-4 py-3 font-medium">Khu vực</th>
            <th className="px-4 py-3 font-medium">Phiên</th>
            <th className="px-4 py-3 font-medium">Thời lượng</th>
            <th className="px-4 py-3 text-right font-medium">Doanh thu</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                Chưa có dữ liệu sử dụng máy trong khoảng này.
              </td>
            </tr>
          ) : null}
          {items.map((item) => (
            <tr className="border-t" key={item.machineId}>
              <td className="px-4 py-3 font-medium">{item.machineName}</td>
              <td className="px-4 py-3 text-muted-foreground">{item.areaName}</td>
              <td className="px-4 py-3">{item.sessionCount}</td>
              <td className="px-4 py-3">{formatDuration(item.totalMinutes)}</td>
              <td className="px-4 py-3 text-right font-medium">
                {formatCurrency(item.revenue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ServiceSalesTable({ items }: { items: ReportServiceSales[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-sm">
        <thead className="bg-muted/30 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Dịch vụ</th>
            <th className="px-4 py-3 font-medium">Loại</th>
            <th className="px-4 py-3 font-medium">Số lượng</th>
            <th className="px-4 py-3 text-right font-medium">Doanh thu</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td className="px-4 py-8 text-center text-muted-foreground" colSpan={4}>
                Chưa có dịch vụ hoàn tất trong khoảng này.
              </td>
            </tr>
          ) : null}
          {items.map((item) => (
            <tr className="border-t" key={item.serviceId}>
              <td className="px-4 py-3 font-medium">{item.serviceName}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {item.serviceType ?? "Chưa phân loại"}
              </td>
              <td className="px-4 py-3">{item.quantity}</td>
              <td className="px-4 py-3 text-right font-medium">
                {formatCurrency(item.revenue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopCustomerTable({ items }: { items: ReportTopCustomer[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-sm">
        <thead className="bg-muted/30 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Khách hàng</th>
            <th className="px-4 py-3 font-medium">Số điện thoại</th>
            <th className="px-4 py-3 font-medium">Hóa đơn</th>
            <th className="px-4 py-3 text-right font-medium">Doanh thu</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td className="px-4 py-8 text-center text-muted-foreground" colSpan={4}>
                Chưa có khách hàng phát sinh doanh thu trong khoảng này.
              </td>
            </tr>
          ) : null}
          {items.map((item) => (
            <tr className="border-t" key={item.customerId}>
              <td className="px-4 py-3">
                <div className="font-medium">
                  {item.customerName ?? `Khách #${item.customerId}`}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  KH #{item.customerId}
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {item.phoneNumber ?? "Chưa có"}
              </td>
              <td className="px-4 py-3">{item.paidInvoiceCount}</td>
              <td className="px-4 py-3 text-right font-medium">
                {formatCurrency(item.revenue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReportPage() {
  const initialFilters = useMemo(() => defaultFilters(), []);
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [overview, setOverview] = useState<ReportOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async (nextFilters: ReportFilters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReportOverview(nextFilters);
      setOverview(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReport(initialFilters);
  }, [initialFilters, loadReport]);

  useRealtimeEvents(
    ["PLAY_SESSION_CHANGED", "FOOD_ORDER_CHANGED", "PAYMENT_CHANGED"],
    () => void loadReport(filters)
  );

  const chartData = useMemo(
    () =>
      overview?.revenueTrend.map((point) => ({
        date: formatDate(point.date),
        revenue: point.revenue,
        paidInvoiceCount: point.paidInvoiceCount,
      })) ?? [],
    [overview]
  );

  const serviceChartData = useMemo(
    () =>
      overview?.serviceSales.slice(0, 6).map((item) => ({
        name: item.serviceName,
        revenue: item.revenue,
      })) ?? [],
    [overview]
  );

  function updateFilters(nextFilters: Partial<ReportFilters>) {
    setFilters((current) => ({ ...current, ...nextFilters }));
  }

  async function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadReport(filters);
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Báo cáo</p>
          <h2 className="mt-1 text-2xl font-semibold">Reports</h2>
          {overview ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Kỳ {overview.fromDate} đến {overview.toDate} · cập nhật{" "}
              {formatDateTime(overview.generatedAt)}
            </p>
          ) : null}
        </div>
        <button
          className="inline-flex h-10 items-center gap-2 self-start rounded-md border px-4 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground lg:self-auto"
          type="button"
          onClick={() => void loadReport(filters)}
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Tải lại
        </button>
      </div>

      <form
        className="grid gap-3 rounded-md border bg-background p-4 md:grid-cols-[180px_180px_auto]"
        onSubmit={applyFilters}
      >
        <label className="grid gap-2 text-sm">
          <span className="text-muted-foreground">Từ ngày</span>
          <input
            className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
            type="date"
            value={filters.fromDate}
            onChange={(event) => updateFilters({ fromDate: event.target.value })}
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="text-muted-foreground">Đến ngày</span>
          <input
            className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
            type="date"
            value={filters.toDate}
            onChange={(event) => updateFilters({ toDate: event.target.value })}
          />
        </label>
        <div className="flex items-end">
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            type="submit"
          >
            <Search className="size-4" />
            Xem báo cáo
          </button>
        </div>
      </form>

      {error ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">
          <ShieldAlert className="size-4" />
          <span>{error}</span>
        </div>
      ) : null}

      {loading && !overview ? (
        <div className="grid min-h-[36vh] place-items-center rounded-md border bg-background text-muted-foreground">
          <div className="flex items-center gap-3">
            <RefreshCw className="size-5 animate-spin" />
            <span>Đang tải báo cáo</span>
          </div>
        </div>
      ) : null}

      {overview ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              detail={`${overview.paidInvoiceCount} hóa đơn đã thanh toán`}
              icon={CircleDollarSign}
              label="Tổng doanh thu"
              value={formatCurrency(overview.totalRevenue)}
            />
            <MetricCard
              detail={`${overview.completedPlaySessionCount} phiên hoàn tất`}
              icon={Clock3}
              label="Doanh thu giờ chơi"
              value={formatCurrency(overview.playSessionRevenue)}
            />
            <MetricCard
              detail={`${overview.completedOrderCount} đơn hoàn tất`}
              icon={ShoppingBasket}
              label="Doanh thu dịch vụ"
              value={formatCurrency(overview.serviceRevenue)}
            />
            <MetricCard
              detail={formatDuration(overview.totalPlayMinutes)}
              icon={WalletCards}
              label="Trung bình hóa đơn"
              value={formatCurrency(overview.averageInvoiceAmount)}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
            <div className="rounded-md border bg-background p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Doanh thu theo ngày</h3>
                  <p className="text-sm text-muted-foreground">
                    Chỉ tính hóa đơn đã thanh toán
                  </p>
                </div>
                <CalendarDays className="size-5 text-primary" />
              </div>
              <div className="h-72">
                <ResponsiveContainer height="100%" width="100%">
                  <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
                    <defs>
                      <linearGradient id="reportRevenueFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
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
                      formatter={(value, name) => [
                        name === "revenue"
                          ? formatCurrency(Number(value))
                          : Number(value),
                        name === "revenue" ? "Doanh thu" : "Hóa đơn",
                      ]}
                    />
                    <Area
                      dataKey="revenue"
                      fill="url(#reportRevenueFill)"
                      stroke="#22c55e"
                      strokeWidth={2}
                      type="monotone"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-5">
              <div className="rounded-md border bg-background p-4">
                <h3 className="mb-4 font-semibold">Nguồn giao dịch</h3>
                <BreakdownList
                  items={overview.revenueByTransactionType}
                  labels={transactionLabels}
                />
              </div>
              <div className="rounded-md border bg-background p-4">
                <h3 className="mb-4 font-semibold">Phương thức thanh toán</h3>
                <BreakdownList
                  items={overview.revenueByPaymentMethod}
                  labels={methodLabels}
                />
              </div>
            </div>
          </div>

          <div className="rounded-md border bg-background p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">Top dịch vụ</h3>
                <p className="text-sm text-muted-foreground">
                  Xếp theo doanh thu đơn gọi món hoàn tất
                </p>
              </div>
              <BarChart3 className="size-5 text-primary" />
            </div>
            <div className="h-64">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={serviceChartData} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} />
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
                    formatter={(value) => [formatCurrency(Number(value)), "Doanh thu"]}
                  />
                  <Bar dataKey="revenue" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="overflow-hidden rounded-md border bg-background">
              <div className="flex items-center gap-2 border-b p-4">
                <Monitor className="size-5 text-primary" />
                <h3 className="font-semibold">Sử dụng máy</h3>
              </div>
              <MachineUsageTable items={overview.machineUsage} />
            </div>
            <div className="overflow-hidden rounded-md border bg-background">
              <div className="flex items-center gap-2 border-b p-4">
                <ShoppingBasket className="size-5 text-primary" />
                <h3 className="font-semibold">Dịch vụ bán ra</h3>
              </div>
              <ServiceSalesTable items={overview.serviceSales} />
            </div>
          </div>

          <div className="overflow-hidden rounded-md border bg-background">
            <div className="flex items-center gap-2 border-b p-4">
              <Trophy className="size-5 text-primary" />
              <h3 className="font-semibold">Top khách hàng</h3>
            </div>
            <TopCustomerTable items={overview.topCustomers} />
          </div>
        </>
      ) : null}
    </section>
  );
}
