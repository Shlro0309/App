import { FormEvent, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CreditCard,
  Receipt,
  RefreshCw,
  Search,
  ShieldAlert,
  WalletCards,
} from "lucide-react";
import type { ApiError } from "@/types/api";
import { useRealtimeEvents } from "@/features/realtime/useRealtimeEvents";
import {
  cancelPayment,
  getPayments,
  getPaymentStatuses,
  payPayment,
  updatePaymentStatus,
} from "./paymentApi";
import type {
  PageResponse,
  Payment,
  PaymentFilters,
  PaymentStatus,
} from "./types";

const defaultFilters: PaymentFilters = {
  keyword: "",
  customerId: "",
  playSessionId: "",
  orderId: "",
  status: "",
  page: 0,
  size: 10,
};

const statusLabels: Record<PaymentStatus, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã hủy",
  REFUNDED: "Đã hoàn tiền",
};

const statusClassNames: Record<PaymentStatus, string> = {
  PENDING: "border-amber-400/35 bg-amber-400/10 text-amber-200",
  PAID: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
  CANCELLED: "border-red-400/35 bg-red-400/10 text-red-200",
  REFUNDED: "border-sky-400/35 bg-sky-400/10 text-sky-200",
};

const methodLabels: Record<string, string> = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản",
  ACCOUNT_BALANCE: "Trừ số dư tài khoản",
};

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) {
      return data.message;
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      return "Phiên đăng nhập không có quyền truy cập module thanh toán.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể xử lý yêu cầu hiện tại.";
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

function StatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-md border px-2 text-xs font-medium ${statusClassNames[status]}`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

export function PaymentManagementPage() {
  const [statuses, setStatuses] = useState<PaymentStatus[]>([
    "PENDING",
    "PAID",
    "CANCELLED",
    "REFUNDED",
  ]);
  const [filters, setFilters] = useState<PaymentFilters>(defaultFilters);
  const [page, setPage] = useState<PageResponse<Payment> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const payments = useMemo(() => page?.content ?? [], [page]);
  const summary = useMemo(() => {
    const paidAmount = payments
      .filter((payment) => payment.status === "PAID")
      .reduce((total, payment) => total + payment.amount, 0);
    const pendingAmount = payments
      .filter((payment) => payment.status === "PENDING")
      .reduce((total, payment) => total + payment.amount, 0);
    return { paidAmount, pendingAmount };
  }, [payments]);

  async function loadPayments(nextFilters = filters) {
    setLoading(true);
    setError(null);
    try {
      const data = await getPayments(nextFilters);
      setPage(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setError(null);
      try {
        const [statusData, paymentData] = await Promise.all([
          getPaymentStatuses(),
          getPayments(defaultFilters),
        ]);
        setStatuses(statusData);
        setPage(paymentData);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    }

    void loadInitialData();
  }, []);

  useRealtimeEvents(["PAYMENT_CHANGED"], () => {
    void loadPayments(filters);
  });

  function updateFilters(nextFilters: Partial<PaymentFilters>) {
    setFilters((current) => ({
      ...current,
      ...nextFilters,
      page: nextFilters.page ?? 0,
    }));
  }

  async function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFilters = { ...filters, page: 0 };
    setFilters(nextFilters);
    await loadPayments(nextFilters);
  }

  async function payCurrentPayment(payment: Payment) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await payPayment(payment.id, payment.paymentMethod ?? "CASH");
      setSuccess(`Đã thanh toán hóa đơn #${payment.id}.`);
      await loadPayments(filters);
    } catch (payError) {
      setError(getErrorMessage(payError));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(payment: Payment, status: PaymentStatus) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updatePaymentStatus(
        payment.id,
        status,
        payment.paymentMethod ?? "CASH"
      );
      setSuccess(`Đã cập nhật hóa đơn #${payment.id}.`);
      await loadPayments(filters);
    } catch (statusError) {
      setError(getErrorMessage(statusError));
    } finally {
      setSaving(false);
    }
  }

  async function cancelCurrentPayment(payment: Payment) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await cancelPayment(payment.id);
      setSuccess(`Đã hủy hóa đơn #${payment.id}.`);
      await loadPayments(filters);
    } catch (cancelError) {
      setError(getErrorMessage(cancelError));
    } finally {
      setSaving(false);
    }
  }

  async function goToPage(pageNumber: number) {
    const nextFilters = { ...filters, page: pageNumber };
    setFilters(nextFilters);
    await loadPayments(nextFilters);
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Quản lý thanh toán</p>
          <h2 className="mt-1 text-2xl font-semibold">Thanh toán</h2>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            type="button"
            onClick={() => loadPayments(filters)}
          >
            <RefreshCw className="size-4" />
            Tải lại
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-md border bg-background p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tổng hóa đơn</span>
            <Receipt className="size-4 text-primary" />
          </div>
          <p className="text-2xl font-semibold">{page?.totalElements ?? 0}</p>
        </div>
        <div className="rounded-md border bg-background p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Đã thu</span>
            <CreditCard className="size-4 text-primary" />
          </div>
          <p className="text-2xl font-semibold">
            {formatCurrency(summary.paidAmount)}
          </p>
        </div>
        <div className="rounded-md border bg-background p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Chờ thu</span>
            <WalletCards className="size-4 text-primary" />
          </div>
          <p className="text-2xl font-semibold">
            {formatCurrency(summary.pendingAmount)}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border bg-background">
        <form
          className="grid gap-3 border-b bg-muted/20 p-4 lg:grid-cols-[1fr_140px_150px_140px_170px_auto]"
          onSubmit={applyFilters}
        >
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-md border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary"
              placeholder="Tìm khách hàng, phương thức, máy"
              value={filters.keyword}
              onChange={(event) =>
                updateFilters({ keyword: event.target.value })
              }
            />
          </label>
          <input
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary"
            min={1}
            placeholder="Khách ID"
            type="number"
            value={filters.customerId}
            onChange={(event) =>
              updateFilters({ customerId: event.target.value })
            }
          />
          <input
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary"
            min={1}
            placeholder="Phiên ID"
            type="number"
            value={filters.playSessionId}
            onChange={(event) =>
              updateFilters({ playSessionId: event.target.value })
            }
          />
          <input
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary"
            min={1}
            placeholder="Đơn ID"
            type="number"
            value={filters.orderId}
            onChange={(event) => updateFilters({ orderId: event.target.value })}
          />
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary"
            value={filters.status}
            onChange={(event) => updateFilters({ status: event.target.value })}
          >
            <option value="">Tất cả trạng thái</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status] ?? status}
              </option>
            ))}
          </select>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            type="submit"
          >
            <Search className="size-4" />
            Lọc
          </button>
        </form>

        {error && (
          <div className="flex items-center gap-2 border-b border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">
            <ShieldAlert className="size-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 border-b border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="size-4" />
            <span>{success}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1160px] border-collapse text-sm">
            <thead className="bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Mã</th>
                <th className="px-4 py-3 font-medium">Khách hàng</th>
                <th className="px-4 py-3 font-medium">Nguồn</th>
                <th className="px-4 py-3 font-medium">Số tiền</th>
                <th className="px-4 py-3 font-medium">Phương thức</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-muted-foreground"
                    colSpan={7}
                  >
                    Đang tải hóa đơn
                  </td>
                </tr>
              )}
              {!loading && payments.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-muted-foreground"
                    colSpan={7}
                  >
                    Không có hóa đơn phù hợp bộ lọc
                  </td>
                </tr>
              )}
              {!loading &&
                payments.map((payment) => (
                  <tr className="border-t" key={payment.id}>
                    <td className="px-4 py-4">
                      <div className="font-medium">#{payment.id}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(payment.transactionAt)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium">{payment.customerName}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        KH #{payment.customerId}
                        {payment.phoneNumber ? ` - ${payment.phoneNumber}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>{transactionLabel(payment.transactionType)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {payment.playSessionId
                          ? `Phiên #${payment.playSessionId}`
                          : "Không có phiên"}{" "}
                        {payment.orderId ? `- Đơn #${payment.orderId}` : ""}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {payment.machineName ?? payment.employeeName ?? "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium">
                        {formatCurrency(payment.amount)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Giờ {formatCurrency(payment.playSessionAmount)} - Dịch vụ{" "}
                        {formatCurrency(payment.orderAmount)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {methodLabels[payment.paymentMethod ?? ""] ??
                        payment.paymentMethod ??
                        "Chưa chọn"}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        {payment.status === "PENDING" ? (
                          <>
                            <button
                              className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                              disabled={saving}
                              title="Thanh toán"
                              type="button"
                              onClick={() => payCurrentPayment(payment)}
                            >
                              <CheckCircle2 className="size-4" />
                            </button>
                            <button
                              className="inline-flex size-9 items-center justify-center rounded-md border border-destructive/40 text-red-200 transition hover:bg-destructive/10 disabled:opacity-50"
                              disabled={saving}
                              title="Hủy hóa đơn"
                              type="button"
                              onClick={() => cancelCurrentPayment(payment)}
                            >
                              <CircleAlert className="size-4" />
                            </button>
                          </>
                        ) : null}
                        {payment.status === "PAID" ? (
                          <button
                            className="inline-flex size-9 items-center justify-center rounded-md border border-sky-400/40 text-sky-200 transition hover:bg-sky-400/10 disabled:opacity-50"
                            disabled={saving}
                            title="Hoàn tiền"
                            type="button"
                            onClick={() => changeStatus(payment, "REFUNDED")}
                          >
                            <RefreshCw className="size-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Trang {(page?.number ?? 0) + 1} / {Math.max(page?.totalPages ?? 1, 1)}
          </span>
          <div className="flex gap-2">
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md border px-3 transition hover:bg-muted disabled:opacity-50"
              disabled={loading || !page || page.first}
              type="button"
              onClick={() => goToPage(Math.max((page?.number ?? 0) - 1, 0))}
            >
              <ChevronLeft className="size-4" />
              Trước
            </button>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md border px-3 transition hover:bg-muted disabled:opacity-50"
              disabled={loading || !page || page.last}
              type="button"
              onClick={() => goToPage((page?.number ?? 0) + 1)}
            >
              Sau
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
