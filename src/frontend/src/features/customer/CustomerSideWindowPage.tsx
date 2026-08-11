import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import {
  BellRing,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  History,
  ImageIcon,
  KeyRound,
  LogOut,
  Monitor,
  PackageOpen,
  RefreshCw,
  ShoppingBasket,
  Utensils,
  WalletCards,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import bookingGamingBackground from "@/assets/booking-gaming-bg.png";
import type { ApiError } from "@/types/api";
import { changePassword } from "@/features/auth/authApi";
import { createFoodOrder } from "@/features/food-service/foodServiceApi";
import type { FoodOrder, ServiceItem } from "@/features/food-service/types";
import { topUpCustomerBalance } from "@/features/payments/paymentApi";
import type { Payment } from "@/features/payments/types";
import type { CustomerTopUpValues } from "@/features/payments/types";
import { endPlaySession } from "@/features/play-sessions/playSessionApi";
import type { PlaySession } from "@/features/play-sessions/types";
import { useRealtimeEvents } from "@/features/realtime/useRealtimeEvents";
import { useAuthStore } from "@/stores/authStore";
import {
  getCustomerActiveSession,
  getCustomerFoodOrders,
  getCustomerPayments,
  getCustomerServices,
} from "./customerApi";

type CustomerTab = "orders" | "history";

const BALANCE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const TIME_WARNING_THRESHOLDS_MINUTES = [30, 10, 5];
const TOP_UP_AMOUNTS = ["20000", "50000", "100000"];
const BANK_ACCOUNT = {
  bankCode: import.meta.env.VITE_CYBERGAME_BANK_CODE ?? "970436",
  bankName: import.meta.env.VITE_CYBERGAME_BANK_NAME ?? "Vietcombank",
  accountNumber:
    import.meta.env.VITE_CYBERGAME_BANK_ACCOUNT_NUMBER ?? "0123456789",
  accountName:
    import.meta.env.VITE_CYBERGAME_BANK_ACCOUNT_NAME ?? "CYBER GAME OWNER",
};
const PAYMENT_METHODS = [
  { value: "CASH", label: "Tiền mặt" },
  { value: "BANK_TRANSFER", label: "Chuyển khoản" },
];
const SERVICE_PAYMENT_METHODS = [
  { value: "CASH", label: "Tiền mặt" },
  { value: "BANK_TRANSFER", label: "Chuyển khoản" },
  { value: "ACCOUNT_BALANCE", label: "Trừ số dư tài khoản" },
];

type TimeWarning = {
  threshold: number;
  message: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) {
      return data.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể xử lý yêu cầu.";
}

function isAlreadyClosedSessionError(error: unknown) {
  if (!(error instanceof AxiosError)) {
    return false;
  }

  const data = error.response?.data as ApiError | undefined;
  return (
    error.response?.status === 409 &&
    Boolean(
      data?.message?.toLowerCase().includes("already closed") ||
        data?.message?.toLowerCase().includes("đã đóng")
    )
  );
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function bankTransferContent(username: string | undefined, amount: number) {
  const normalizedUser =
    username?.trim().replace(/\s+/g, "").toUpperCase() || "KHACH";
  return `NAPTIEN ${normalizedUser} ${Math.floor(amount)}`;
}

function bankTransferQrUrl(amount: number, username: string | undefined) {
  if (!BANK_ACCOUNT.bankCode || !BANK_ACCOUNT.accountNumber || amount <= 0) {
    return null;
  }

  const params = new URLSearchParams({
    amount: String(Math.floor(amount)),
    addInfo: bankTransferContent(username, amount),
    accountName: BANK_ACCOUNT.accountName,
  });

  return `https://img.vietqr.io/image/${BANK_ACCOUNT.bankCode}-${BANK_ACCOUNT.accountNumber}-compact2.png?${params.toString()}`;
}

function formatClock(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((item) => String(item).padStart(2, "0"))
    .join(":");
}

function elapsedSeconds(session: PlaySession | null, now: Date) {
  if (!session) {
    return 0;
  }

  return Math.max(0, (now.getTime() - new Date(session.startedAt).getTime()) / 1000);
}

function remainingSeconds(
  session: PlaySession | null,
  balance: number | null | undefined,
  now: Date
) {
  if (!session || !session.hourlyPrice || !balance) {
    return 0;
  }

  const playableSeconds = (balance / session.hourlyPrice) * 3600;
  return playableSeconds - elapsedSeconds(session, now);
}

function estimatedBalance(
  session: PlaySession | null,
  balance: number | null | undefined,
  now: Date
) {
  if (!session || !session.hourlyPrice || !balance) {
    return balance ?? 0;
  }

  const spentAmount = (elapsedSeconds(session, now) / 3600) * session.hourlyPrice;
  return Math.max(0, balance - spentAmount);
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

function orderStatusLabel(value: string) {
  const labels: Record<string, string> = {
    PENDING: "Chờ xử lý",
    PREPARING: "Đang chuẩn bị",
    COMPLETED: "Hoàn tất",
    CANCELLED: "Đã hủy",
  };
  return labels[value] ?? value;
}

function paymentStatusLabel(value: string) {
  const labels: Record<string, string> = {
    PENDING: "Chờ thanh toán",
    PAID: "Đã thanh toán",
    CANCELLED: "Đã hủy",
    REFUNDED: "Đã hoàn tiền",
  };
  return labels[value] ?? value;
}

function OrderList({ orders }: { orders: FoodOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="grid min-h-24 place-items-center rounded-md border border-dashed bg-muted/20 p-3 text-center">
        <PackageOpen className="mb-2 size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Chưa gọi món nào</p>
      </div>
    );
  }

  return (
    <div className="max-h-32 space-y-2 overflow-y-auto pr-1">
      {orders.map((order) => (
        <div className="rounded-md border bg-background/80 p-2.5" key={order.id}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">Đơn #{order.id}</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {orderStatusLabel(order.status)} · {order.items.length} món
          </p>
        </div>
      ))}
    </div>
  );
}

function HistoryList({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return (
      <div className="grid min-h-24 place-items-center rounded-md border border-dashed bg-muted/20 p-3 text-center">
        <History className="mb-2 size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Chưa có lịch sử thanh toán</p>
      </div>
    );
  }

  return (
    <div className="max-h-32 space-y-2 overflow-y-auto pr-1">
      {payments.map((payment) => (
        <div className="rounded-md border bg-background/80 p-2.5" key={payment.id}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">{transactionLabel(payment.transactionType)}</span>
            <span>{formatCurrency(payment.amount)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {paymentStatusLabel(payment.status)} ·{" "}
            {new Date(payment.transactionAt).toLocaleString("vi-VN")}
          </p>
        </div>
      ))}
    </div>
  );
}

function TimeWarningToast({
  warning,
  onClose,
}: {
  warning: TimeWarning | null;
  onClose: () => void;
}) {
  if (!warning) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-[320px] rounded-md border border-amber-400/40 bg-amber-500/15 p-4 text-amber-50 shadow-2xl backdrop-blur">
      <div className="flex items-start gap-3">
        <BellRing className="mt-0.5 size-5 text-amber-300" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Sắp hết thời gian</p>
          <p className="mt-1 text-sm text-amber-100">{warning.message}</p>
        </div>
        <button
          className="inline-flex size-7 items-center justify-center rounded-md text-amber-100 transition hover:bg-amber-400/20"
          title="Đóng thông báo"
          type="button"
          onClick={onClose}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

function CustomerServiceImage({
  imageUrl,
  alt,
}: {
  imageUrl: string | null;
  alt: string;
}) {
  const normalizedImageUrl = imageUrl?.trim() || null;

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-white/10 bg-slate-950">
      <div className="absolute inset-0 grid place-items-center text-muted-foreground">
        <ImageIcon className="size-6" />
      </div>
      {normalizedImageUrl ? (
        <img
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          src={normalizedImageUrl}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}
    </div>
  );
}

function ServiceOrderModal({
  activeSession,
  accountBalance,
  services,
  onClose,
  onCreated,
}: {
  activeSession: PlaySession | null;
  accountBalance: number;
  services: ServiceItem[];
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [selectedQuantities, setSelectedQuantities] = useState<
    Record<number, number>
  >({});
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const availableServices = useMemo(
    () => services.filter((service) => service.stockQuantity > 0),
    [services]
  );

  const selectedItems = useMemo(
    () =>
      availableServices
        .map((service) => ({
          service,
          quantity: selectedQuantities[service.id] ?? 0,
        }))
        .filter((item) => item.quantity > 0),
    [availableServices, selectedQuantities]
  );

  const orderTotal = useMemo(
    () =>
      selectedItems.reduce(
        (total, item) => total + item.service.price * item.quantity,
        0
      ),
    [selectedItems]
  );

  const cannotUseBalance =
    paymentMethod === "ACCOUNT_BALANCE" && orderTotal > accountBalance;

  function updateSelectedQuantity(service: ServiceItem, quantity: number) {
    const safeQuantity = Math.max(
      0,
      Math.min(service.stockQuantity, Math.floor(quantity) || 0)
    );
    setSelectedQuantities((current) => {
      const next = { ...current };
      if (safeQuantity <= 0) {
        delete next[service.id];
      } else {
        next[service.id] = safeQuantity;
      }
      return next;
    });
  }

  function addService(service: ServiceItem) {
    updateSelectedQuantity(service, (selectedQuantities[service.id] ?? 0) + 1);
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !activeSession ||
      selectedItems.length === 0 ||
      orderTotal <= 0 ||
      cannotUseBalance
    ) {
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await createFoodOrder({
        customerId: "",
        playSessionId: String(activeSession.id),
        paymentMethod,
        items: selectedItems.map((item) => ({
          serviceId: String(item.service.id),
          quantity: String(item.quantity),
        })),
      });
      await onCreated();
      onClose();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pointer-events-none fixed inset-y-4 left-4 right-[376px] z-40 grid items-center justify-items-end max-lg:right-4">
      <form
        className="pointer-events-auto grid h-[86vh] max-h-[86vh] w-full max-w-4xl grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden rounded-md border border-primary/25 bg-[#050b19]/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
        onSubmit={submitOrder}
      >
        <div className="flex items-center justify-between gap-3 border-b border-sky-200/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <Utensils className="size-5 text-primary" />
            <div>
              <h2 className="font-semibold">Chọn dịch vụ</h2>
              <p className="text-xs text-muted-foreground">
                {activeSession
                  ? `Gửi món đến ${activeSession.machineName}`
                  : "Chưa có phiên chơi đang hoạt động"}
              </p>
            </div>
          </div>
          <button
            className="inline-flex size-9 items-center justify-center rounded-md border border-sky-200/15 text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground"
            title="Đóng"
            type="button"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid min-h-0 gap-4 px-4 pb-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-h-0 overflow-y-auto pr-1">
            {availableServices.length === 0 ? (
              <div className="grid min-h-32 place-items-center rounded-md border border-dashed bg-muted/20 text-sm text-muted-foreground">
                Chưa có món đang bán.
              </div>
            ) : null}
            {availableServices.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {availableServices.map((service) => {
                  const quantity = selectedQuantities[service.id] ?? 0;
                  return (
                    <button
                      aria-label={`${service.name} ${formatCurrency(service.price)}`}
                      className={[
                        "grid gap-2 rounded-md border bg-muted/10 p-2 text-left transition hover:border-primary",
                        quantity > 0 ? "border-primary bg-primary/10 ring-1 ring-primary" : "",
                      ].join(" ")}
                      key={service.id}
                      type="button"
                      onClick={() => addService(service)}
                    >
                      <CustomerServiceImage
                        alt={service.name}
                        imageUrl={service.imageUrl}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">
                          {service.name}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-primary">
                          {formatCurrency(service.price)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <aside className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 rounded-md border bg-muted/10 p-3">
            <div>
              <h3 className="text-sm font-semibold">Món đã chọn</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Chỉnh số lượng trước khi gửi đơn.
              </p>
            </div>

            <div className="min-h-0 space-y-2 overflow-y-auto pr-1">
              {selectedItems.length === 0 ? (
                <div className="grid min-h-24 place-items-center rounded-md border border-dashed bg-background/40 text-center text-xs text-muted-foreground">
                  Chưa chọn món
                </div>
              ) : null}
              {selectedItems.map(({ service, quantity }) => (
                <div
                  className="grid gap-2 rounded-md border bg-background/70 p-2"
                  key={service.id}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {service.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(service.price)}
                      </p>
                    </div>
                    <button
                      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      title="Bỏ món"
                      type="button"
                      onClick={() => updateSelectedQuantity(service, 0)}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-[32px_1fr_32px] items-center gap-2">
                    <button
                      className="inline-flex size-8 items-center justify-center rounded-md border text-sm transition hover:bg-muted"
                      type="button"
                      onClick={() => updateSelectedQuantity(service, quantity - 1)}
                    >
                      -
                    </button>
                    <input
                      className="h-8 rounded-md border bg-background px-2 text-center text-sm outline-none transition focus:border-primary"
                      min={1}
                      type="number"
                      value={quantity}
                      onChange={(event) =>
                        updateSelectedQuantity(service, Number(event.target.value))
                      }
                    />
                    <button
                      className="inline-flex size-8 items-center justify-center rounded-md border text-sm transition hover:bg-muted"
                      type="button"
                      onClick={() => updateSelectedQuantity(service, quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 border-t pt-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Tổng tiền</span>
                <strong className="text-lg text-primary">
                  {formatCurrency(orderTotal)}
                </strong>
              </div>

              <div className="grid gap-2">
                {SERVICE_PAYMENT_METHODS.map((method) => (
                  <button
                    className={[
                      "h-9 rounded-md border px-3 text-left text-xs font-medium transition hover:border-primary",
                      paymentMethod === method.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground",
                    ].join(" ")}
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value)}
                  >
                    {method.label}
                  </button>
                ))}
              </div>

              {cannotUseBalance ? (
                <p className="rounded-md border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  Số dư hiện tại không đủ để thanh toán đơn này.
                </p>
              ) : null}

              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                disabled={
                  !activeSession ||
                  saving ||
                  selectedItems.length === 0 ||
                  cannotUseBalance
                }
                type="submit"
              >
                <ShoppingBasket className="size-4" />
                {saving ? "Đang gửi" : "Gửi đơn"}
              </button>
              {message ? <p className="text-xs text-red-200">{message}</p> : null}
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}

function TopUpModal({
  username,
  onClose,
  onCreated,
}: {
  username: string | undefined;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [values, setValues] = useState<CustomerTopUpValues>({
    amount: "50000",
    paymentMethod: "CASH",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const topUpAmount = useMemo(
    () => Number(values.amount.replace(/[^\d.]/g, "")) || 0,
    [values.amount]
  );
  const transferContent = bankTransferContent(username, topUpAmount);
  const transferQrUrl = bankTransferQrUrl(topUpAmount, username);

  function updateField(field: keyof CustomerTopUpValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function submitTopUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (topUpAmount < 1000) {
      setMessage("Số tiền nạp tối thiểu là 1.000đ.");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const payment = await topUpCustomerBalance({
        amount: String(topUpAmount),
        paymentMethod: values.paymentMethod,
      });
      setMessage(
        `Đã gửi yêu cầu nạp tiền #${payment.id}. Vui lòng chờ nhân viên/admin xác nhận.`
      );
      onCreated();
    } catch (topUpError) {
      setMessage(getErrorMessage(topUpError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pointer-events-none fixed right-[376px] top-4 z-50 w-[min(460px,calc(100vw-392px))] max-lg:right-4 max-lg:w-[min(460px,calc(100vw-2rem))]">
      <form
        className="pointer-events-auto grid max-h-[calc(100vh-2rem)] w-full gap-4 overflow-y-auto rounded-md border border-primary/25 bg-[#050b19]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl"
        onSubmit={submitTopUp}
      >
        <div className="flex items-center justify-between gap-3 border-b border-sky-200/10 pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-primary" />
            <div>
              <h2 className="font-semibold">Nạp tiền</h2>
              <p className="text-xs text-muted-foreground">
                Gửi yêu cầu nạp tiền để nhân viên/admin xác nhận thủ công.
              </p>
            </div>
          </div>
          <button
            className="inline-flex size-9 items-center justify-center rounded-md border border-sky-200/15 text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground"
            title="Đóng"
            type="button"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {TOP_UP_AMOUNTS.map((amount) => (
            <button
              className={`h-10 rounded-md border text-sm font-medium transition hover:border-primary ${
                values.amount === amount ? "border-primary bg-primary/10 text-primary" : ""
              }`}
              key={amount}
              type="button"
              onClick={() => updateField("amount", amount)}
            >
              {formatCurrency(Number(amount))}
            </button>
          ))}
        </div>

        <label className="grid gap-2 text-sm">
          <span className="text-muted-foreground">Số tiền nạp</span>
          <input
            className="h-11 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
            min={1000}
            type="number"
            value={values.amount}
            onChange={(event) => updateField("amount", event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="text-muted-foreground">Phương thức</span>
          <select
            className="h-11 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
            value={values.paymentMethod}
            onChange={(event) => updateField("paymentMethod", event.target.value)}
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </label>

        {values.paymentMethod === "BANK_TRANSFER" ? (
          <div className="grid gap-3 rounded-md border border-primary/30 bg-primary/10 p-3 text-sm">
            <div className="grid gap-1">
              <span className="text-xs uppercase text-muted-foreground">
                Tài khoản nhận chuyển khoản
              </span>
              <strong>{BANK_ACCOUNT.accountName}</strong>
              <span>{BANK_ACCOUNT.bankName}</span>
              <span className="font-mono text-base">
                {BANK_ACCOUNT.accountNumber}
              </span>
            </div>
            {transferQrUrl ? (
              <img
                alt="QR chuyển khoản nạp tiền"
                className="mx-auto aspect-square w-44 rounded-md bg-white p-2"
                src={transferQrUrl}
              />
            ) : null}
            <div className="grid gap-1 rounded-md border bg-background/70 p-3">
              <span>Số tiền: {formatCurrency(topUpAmount)}</span>
              <span>
                Nội dung: <strong className="font-mono">{transferContent}</strong>
              </span>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Sau khi khách chuyển khoản, yêu cầu sẽ ở trạng thái chờ. Nhân
              viên/admin đối chiếu hệ thống bên ngoài rồi xác nhận trong màn
              hình thanh toán.
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            Yêu cầu tiền mặt sẽ xuất hiện ở màn hình thanh toán để nhân viên
            thu tiền và xác nhận.
          </div>
        )}

        {message ? (
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            {message}
          </div>
        ) : null}

        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          disabled={saving || topUpAmount < 1000}
          type="submit"
        >
          <CreditCard className="size-4" />
          {saving ? "Đang gửi" : "Gửi yêu cầu nạp tiền"}
        </button>
      </form>
    </div>
  );
}

function PasswordChangeModal({
  values,
  message,
  onClose,
  onSubmit,
  onChange,
}: {
  values: {
    currentPassword: string;
    newPassword: string;
  };
  message: string | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (
    field: "currentPassword" | "newPassword",
    value: string
  ) => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-[376px] z-50 w-[min(384px,calc(100vw-392px))] max-lg:right-4 max-lg:w-[min(384px,calc(100vw-2rem))]">
      <form
        className="glass-panel pointer-events-auto grid w-full gap-4 rounded-lg bg-[#050b19]/95 p-5 shadow-2xl shadow-black/50"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-md border border-primary/35 bg-primary/10 text-primary">
              <KeyRound className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-50">Đổi mật khẩu</h2>
              <p className="text-sm font-semibold text-slate-300">
                Cập nhật mật khẩu phiên chơi.
              </p>
            </div>
          </div>
          <button
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-sky-200/15 text-slate-300 transition hover:bg-white/[0.06] hover:text-slate-50"
            title="Đóng"
            type="button"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        <label className="grid gap-2 text-sm">
          <span className="label-caps text-slate-300">Mật khẩu hiện tại</span>
          <input
            className="h-11 rounded-md border border-sky-200/15 bg-[#020713]/80 px-3 font-semibold text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-primary"
            placeholder="Nhập mật khẩu hiện tại"
            type="password"
            value={values.currentPassword}
            onChange={(event) => onChange("currentPassword", event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="label-caps text-slate-300">Mật khẩu mới</span>
          <input
            className="h-11 rounded-md border border-sky-200/15 bg-[#020713]/80 px-3 font-semibold text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-primary"
            placeholder="Tối thiểu 6 ký tự"
            type="password"
            value={values.newPassword}
            onChange={(event) => onChange("newPassword", event.target.value)}
          />
        </label>

        {message ? (
          <div className="rounded-md border border-sky-200/15 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-slate-200">
            {message}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            className="inline-flex h-11 items-center justify-center rounded-md border border-sky-200/15 bg-white/[0.04] text-sm font-bold text-slate-200 transition hover:bg-white/[0.08]"
            type="button"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            disabled={
              values.currentPassword.length === 0 || values.newPassword.length < 6
            }
            type="submit"
          >
            Cập nhật
          </button>
        </div>
      </form>
    </div>
  );
}

export function CustomerSideWindowPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const refreshCurrentUser = useAuthStore((state) => state.refreshCurrentUser);
  const autoEndingSessionIdRef = useRef<number | null>(null);
  const knownActiveSessionIdRef = useRef<number | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<CustomerTab>("orders");
  const [serviceVisible, setServiceVisible] = useState(false);
  const [topUpVisible, setTopUpVisible] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [activeSession, setActiveSession] = useState<PlaySession | null>(null);
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifiedThresholds, setNotifiedThresholds] = useState<number[]>([]);
  const [timeWarning, setTimeWarning] = useState<TimeWarning | null>(null);
  const [passwordValues, setPasswordValues] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const customerId = user?.customerId;

  useEffect(() => {
    if (
      user?.role === "CUSTOMER" &&
      (user.balance ?? 0) <= 0 &&
      !activeSession &&
      !loading
    ) {
      navigate("/customer/login", {
        replace: true,
        state: {
          message: "Số dư đã hết. Vui lòng nạp thêm tiền trước khi vào phiên chơi.",
        },
      });
    }
  }, [activeSession, loading, navigate, user?.balance, user?.role]);

  const loadPanel = useCallback(async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const session = await getCustomerActiveSession(customerId);
      const [orderData, paymentData, serviceData] = await Promise.all([
        getCustomerFoodOrders(customerId, session?.id),
        getCustomerPayments(customerId),
        getCustomerServices(),
      ]);
      setActiveSession(session);
      setOrders(orderData);
      setPayments(paymentData);
      setServices(serviceData);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void loadPanel();
  }, [loadPanel]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshCurrentUser();
      void loadPanel();
    }, BALANCE_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [loadPanel, refreshCurrentUser]);

  useRealtimeEvents(
    ["PLAY_SESSION_CHANGED", "FOOD_ORDER_CHANGED", "PAYMENT_CHANGED"],
    () => {
      void refreshCurrentUser();
      void loadPanel();
    }
  );

  const elapsed = useMemo(() => elapsedSeconds(activeSession, now), [activeSession, now]);
  const visibleBalance = useMemo(
    () => estimatedBalance(activeSession, user?.balance, now),
    [activeSession, now, user?.balance]
  );
  const remaining = useMemo(
    () => remainingSeconds(activeSession, user?.balance, now),
    [activeSession, now, user?.balance]
  );

  useEffect(() => {
    if (activeSession?.id) {
      knownActiveSessionIdRef.current = activeSession.id;
    }
  }, [activeSession?.id]);

  useEffect(() => {
    if (loading || activeSession || user?.role !== "CUSTOMER") {
      return;
    }

    const endedSessionId = knownActiveSessionIdRef.current;
    if (
      endedSessionId == null ||
      autoEndingSessionIdRef.current === endedSessionId
    ) {
      return;
    }

    knownActiveSessionIdRef.current = null;
    void (async () => {
      await logout();
      navigate("/customer/login", {
        replace: true,
        state: {
          message: "Phiên chơi đã kết thúc.",
        },
      });
    })();
  }, [activeSession, loading, logout, navigate, user?.role]);

  useEffect(() => {
    setNotifiedThresholds([]);
    setTimeWarning(null);
    autoEndingSessionIdRef.current = null;
  }, [activeSession?.id]);

  useEffect(() => {
    if (!activeSession || visibleBalance > 0) {
      return;
    }

    if (autoEndingSessionIdRef.current === activeSession.id) {
      return;
    }

    autoEndingSessionIdRef.current = activeSession.id;
    setTimeWarning({
      threshold: 0,
      message: "Số dư đã hết. Phiên chơi sẽ tự động kết thúc.",
    });

    void (async () => {
      try {
        await endPlaySession(activeSession.id);
      } catch {
        // The backend scheduler may have already closed this session.
      } finally {
        await logout();
        navigate("/customer/login", {
          replace: true,
          state: {
            message: "Phiên chơi đã kết thúc vì số dư đã hết.",
          },
        });
      }
    })();
  }, [activeSession, logout, navigate, visibleBalance]);

  useEffect(() => {
    if (!activeSession || remaining <= 0) {
      return;
    }

    const pendingThresholds = TIME_WARNING_THRESHOLDS_MINUTES.filter(
      (threshold) =>
        remaining <= threshold * 60 && !notifiedThresholds.includes(threshold)
    );

    if (pendingThresholds.length === 0) {
      return;
    }

    const threshold = pendingThresholds[pendingThresholds.length - 1];
    setNotifiedThresholds((current) =>
      Array.from(new Set([...current, ...pendingThresholds]))
    );
    setTimeWarning({
      threshold,
      message: `Bạn còn khoảng ${threshold} phút sử dụng máy.`,
    });
  }, [activeSession, notifiedThresholds, remaining]);

  useEffect(() => {
    if (!timeWarning) {
      return;
    }

    const timeout = window.setTimeout(() => setTimeWarning(null), 8000);
    return () => window.clearTimeout(timeout);
  }, [timeWarning]);

  async function handleLogout() {
    setError(null);
    if (activeSession) {
      try {
        await endPlaySession(activeSession.id);
      } catch (logoutError) {
        if (!isAlreadyClosedSessionError(logoutError)) {
          setError(getErrorMessage(logoutError));
          return;
        }
      }
    }

    await logout();
    navigate("/customer/login", { replace: true });
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);
    try {
      await changePassword(passwordValues);
      setPasswordValues({ currentPassword: "", newPassword: "" });
      setPasswordMessage("Đã đổi mật khẩu.");
    } catch (changeError) {
      setPasswordMessage(getErrorMessage(changeError));
    }
  }

  function updatePasswordField(
    field: "currentPassword" | "newPassword",
    value: string
  ) {
    setPasswordValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  if (collapsed) {
    return (
      <main
        className="booking-shell grid min-h-screen justify-items-end bg-cover bg-center p-4"
        style={{ backgroundImage: `url(${bookingGamingBackground})` }}
      >
        <button
          className="inline-flex size-12 items-center justify-center rounded-full border border-primary/35 bg-[#050b19]/85 text-primary shadow-[0_0_24px_rgba(78,222,163,0.18)] transition hover:bg-primary/10 hover:text-slate-50"
          title="Mở bảng khách hàng"
          type="button"
          onClick={() => setCollapsed(false)}
        >
          <ChevronLeft className="size-5" />
        </button>
        <TimeWarningToast
          warning={timeWarning}
          onClose={() => setTimeWarning(null)}
        />
      </main>
    );
  }

  return (
    <main
      className="booking-shell min-h-screen overflow-hidden bg-cover bg-center text-foreground"
      style={{ backgroundImage: `url(${bookingGamingBackground})` }}
    >
      <section className="glass-panel fixed inset-y-0 right-0 grid h-screen w-[360px] max-w-[calc(100vw-1rem)] grid-rows-[auto_auto_minmax(0,1fr)_auto_auto] overflow-hidden border-l border-primary/20 bg-[#050b19]/90 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <button
          className="absolute left-4 top-3 inline-flex size-10 items-center justify-center rounded-full border border-primary/25 bg-white/[0.04] text-cyan-100 transition hover:bg-primary/10 hover:text-primary"
          title="Ẩn bảng khách hàng"
          type="button"
          onClick={() => setCollapsed(true)}
        >
          <ChevronRight className="size-5" />
        </button>

        <div className="grid justify-items-center gap-2 pt-5">
          <div className="relative grid size-16 place-items-center rounded-full border border-primary/35 bg-primary/10 shadow-[0_0_28px_rgba(78,222,163,0.16)]">
            <UserIcon />
            <span className="absolute bottom-1 right-1 size-5 rounded-full border-4 border-[#050b19] bg-emerald-500" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-50">{user?.username}</h1>
            <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-sky-200/15 bg-white/[0.05] px-3 py-1 text-sm font-semibold text-slate-100">
              <Monitor className="size-4 text-primary" />
              {activeSession?.machineName ?? "Chưa vào máy"}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <div className="rounded-lg border border-emerald-400/45 bg-emerald-400/10 p-3 shadow-[0_0_22px_rgba(52,211,153,0.1)]">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase">
              <WalletCards className="size-4 text-emerald-400" />
              Số dư hiện tại
            </div>
            <p className="metric-number text-2xl font-bold text-emerald-300">
              {formatCurrency(visibleBalance)}
            </p>
          </div>

          <div className="rounded-lg border border-fuchsia-300/40 bg-fuchsia-500/15 p-3 shadow-[0_0_22px_rgba(217,70,239,0.1)]">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase">
              <Clock3 className="size-4 text-fuchsia-200" />
              Thời gian còn lại
            </div>
            <p className="metric-number text-2xl font-bold text-fuchsia-100">
              {formatClock(remaining)}
            </p>
          </div>

          <div className="rounded-lg border border-sky-200/15 bg-white/[0.04] p-3">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase">
              <Clock3 className="size-4 text-cyan-100" />
              Thời gian đã dùng
            </div>
            <p className="metric-number text-2xl font-bold text-cyan-100">
              {formatClock(elapsed)}
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-3 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-3 min-h-0 border-t border-sky-200/10 pt-3">
          <div className="mb-2 grid grid-cols-2 rounded-md bg-[#020713]/60 p-1">
            <button
              className={`inline-flex h-9 items-center justify-center gap-2 rounded-md text-sm font-medium transition ${
                tab === "orders" ? "bg-primary/15 text-primary" : "text-slate-300"
              }`}
              type="button"
              onClick={() => setTab("orders")}
            >
              <Utensils className="size-4" />
              Đơn hàng ({orders.length})
            </button>
            <button
              className={`inline-flex h-9 items-center justify-center gap-2 rounded-md text-sm font-medium transition ${
                tab === "history" ? "bg-primary/15 text-primary" : "text-slate-300"
              }`}
              type="button"
              onClick={() => setTab("history")}
            >
              <History className="size-4" />
              Lịch sử
            </button>
          </div>
          {loading ? (
            <div className="grid min-h-24 place-items-center rounded-md border border-sky-200/15 bg-white/[0.04] text-sm text-slate-300">
              <RefreshCw className="mb-2 size-5 animate-spin" />
              Đang tải
            </div>
          ) : tab === "orders" ? (
            <OrderList orders={orders} />
          ) : (
            <HistoryList payments={payments} />
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            className="inline-flex h-16 flex-col items-center justify-center gap-1.5 rounded-lg border border-orange-400/40 bg-orange-500/10 text-sm font-bold text-orange-200 transition hover:bg-orange-500/15"
            type="button"
            onClick={() => setServiceVisible(true)}
          >
            <Utensils className="size-5" />
            Dịch vụ
          </button>
          <button
            className="inline-flex h-16 flex-col items-center justify-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-500/10 text-sm font-bold text-emerald-200 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            title="Gửi yêu cầu nạp tiền"
            type="button"
            onClick={() => setTopUpVisible(true)}
          >
            <CreditCard className="size-5" />
            Nạp tiền
          </button>
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-sky-200/15 bg-white/[0.04] text-sm font-bold text-slate-200 transition hover:bg-muted hover:text-slate-50"
            type="button"
            onClick={() => {
              setPasswordMessage(null);
              setPasswordVisible(true);
            }}
          >
            <KeyRound className="size-5" />
            Đổi MK
          </button>
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-red-400/40 bg-red-500/10 text-sm font-bold text-red-200 transition hover:bg-red-500/15"
            type="button"
            onClick={() => void handleLogout()}
          >
            <LogOut className="size-5" />
            Đăng xuất
          </button>
        </div>

        <p className="mt-3 text-center font-mono text-sm text-foreground">
          {now.toLocaleTimeString("vi-VN")} {now.toLocaleDateString("vi-VN")}
        </p>
      </section>

      {serviceVisible ? (
        <ServiceOrderModal
          activeSession={activeSession}
          accountBalance={visibleBalance}
          services={services}
          onClose={() => setServiceVisible(false)}
          onCreated={() => {
            void refreshCurrentUser();
            void loadPanel();
          }}
        />
      ) : null}

      {topUpVisible ? (
        <TopUpModal
          username={user?.username}
          onClose={() => setTopUpVisible(false)}
          onCreated={() => {
            void refreshCurrentUser();
            void loadPanel();
          }}
        />
      ) : null}

      {passwordVisible ? (
        <PasswordChangeModal
          message={passwordMessage}
          values={passwordValues}
          onChange={updatePasswordField}
          onClose={() => {
            setPasswordVisible(false);
            setPasswordMessage(null);
          }}
          onSubmit={submitPassword}
        />
      ) : null}

      <TimeWarningToast
        warning={timeWarning}
        onClose={() => setTimeWarning(null)}
      />
    </main>
  );
}

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-11 text-primary"
      fill="none"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24 24c5 0 8-3.5 8-8s-3-8-8-8-8 3.5-8 8 3 8 8 8Z"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M12 40v-5c0-5 4-9 9-9h6c5 0 9 4 9 9v5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}
