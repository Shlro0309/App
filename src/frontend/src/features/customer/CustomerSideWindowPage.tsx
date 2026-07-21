import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import {
  BellRing,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  History,
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
import type { ApiError } from "@/types/api";
import { changePassword } from "@/features/auth/authApi";
import { createFoodOrder } from "@/features/food-service/foodServiceApi";
import type { FoodOrder, ServiceItem } from "@/features/food-service/types";
import type { Payment } from "@/features/payments/types";
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

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
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

function OrderList({ orders }: { orders: FoodOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="grid min-h-28 place-items-center rounded-md border border-dashed bg-muted/20 p-4 text-center">
        <PackageOpen className="mb-2 size-9 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Chưa gọi món nào</p>
      </div>
    );
  }

  return (
    <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
      {orders.map((order) => (
        <div className="rounded-md border bg-background p-3" key={order.id}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">Đơn #{order.id}</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {order.status} · {order.items.length} món
          </p>
        </div>
      ))}
    </div>
  );
}

function HistoryList({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return (
      <div className="grid min-h-28 place-items-center rounded-md border border-dashed bg-muted/20 p-4 text-center">
        <History className="mb-2 size-9 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Chưa có lịch sử thanh toán</p>
      </div>
    );
  }

  return (
    <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
      {payments.map((payment) => (
        <div className="rounded-md border bg-background p-3" key={payment.id}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">{transactionLabel(payment.transactionType)}</span>
            <span>{formatCurrency(payment.amount)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {payment.status} · {new Date(payment.transactionAt).toLocaleString("vi-VN")}
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

function ServiceOrderModal({
  activeSession,
  services,
  onClose,
  onCreated,
}: {
  activeSession: PlaySession | null;
  services: ServiceItem[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId) ?? null,
    [serviceId, services]
  );

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeSession || !serviceId) {
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await createFoodOrder({
        customerId: "",
        playSessionId: String(activeSession.id),
        items: [{ serviceId: String(serviceId), quantity }],
      });
      onCreated();
      onClose();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-black/60 p-4 backdrop-blur-sm sm:place-items-center">
      <form
        className="grid max-h-[86vh] w-full max-w-lg gap-4 overflow-hidden rounded-md border bg-background shadow-2xl"
        onSubmit={submitOrder}
      >
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
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
            className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-muted hover:text-foreground"
            title="Đóng"
            type="button"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid max-h-[48vh] gap-2 overflow-y-auto px-4">
          {services.length === 0 ? (
            <div className="grid min-h-32 place-items-center rounded-md border border-dashed bg-muted/20 text-sm text-muted-foreground">
              Chưa có món đang bán.
            </div>
          ) : null}
          {services.map((service) => {
            const selected = service.id === serviceId;
            const outOfStock = service.stockQuantity <= 0;
            return (
              <button
                className={[
                  "grid gap-2 rounded-md border p-3 text-left transition hover:border-primary",
                  selected ? "border-primary bg-primary/10 ring-1 ring-primary" : "",
                  outOfStock ? "cursor-not-allowed opacity-50" : "",
                ].join(" ")}
                disabled={outOfStock}
                key={service.id}
                type="button"
                onClick={() => setServiceId(service.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {service.serviceType ?? "Dịch vụ"} · Còn {service.stockQuantity}
                    </p>
                  </div>
                  <span className="font-semibold text-primary">
                    {formatCurrency(service.price)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 border-t px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
            <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
              {selectedService
                ? `${selectedService.name} · ${formatCurrency(selectedService.price)}`
                : "Chưa chọn món"}
            </div>
            <input
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary"
              disabled={!activeSession}
              min={1}
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </div>

          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            disabled={!activeSession || saving || !serviceId}
            type="submit"
          >
            <ShoppingBasket className="size-4" />
            {saving ? "Đang gửi" : "Gửi đơn"}
          </button>
          {message ? <p className="text-xs text-red-200">{message}</p> : null}
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
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<CustomerTab>("orders");
  const [serviceVisible, setServiceVisible] = useState(false);
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
    if (user?.role === "CUSTOMER" && (user.balance ?? 0) <= 0) {
      navigate("/customer/login", {
        replace: true,
        state: {
          message: "Số dư đã hết. Vui lòng nạp thêm tiền trước khi vào phiên chơi.",
        },
      });
    }
  }, [navigate, user?.balance, user?.role]);

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

  if (collapsed) {
    return (
      <main className="grid min-h-screen place-items-start bg-background p-4">
        <button
          className="inline-flex size-12 items-center justify-center rounded-full border bg-muted text-muted-foreground transition hover:text-foreground"
          title="Mở bảng khách hàng"
          type="button"
          onClick={() => setCollapsed(false)}
        >
          <ChevronRight className="size-5" />
        </button>
        <TimeWarningToast
          warning={timeWarning}
          onClose={() => setTimeWarning(null)}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="relative min-h-screen w-full max-w-[402px] border-r bg-[#111827] px-5 py-4 shadow-2xl">
        <button
          className="absolute left-5 top-4 inline-flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:text-foreground"
          title="Ẩn bảng khách hàng"
          type="button"
          onClick={() => setCollapsed(true)}
        >
          <ChevronLeft className="size-5" />
        </button>

        <div className="grid justify-items-center gap-3 pt-6">
          <div className="relative grid size-20 place-items-center rounded-full border bg-muted/30">
            <UserIcon />
            <span className="absolute bottom-1 right-1 size-5 rounded-full border-4 border-[#111827] bg-emerald-500" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold">{user?.username}</h1>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-4 py-1 text-sm">
              <Monitor className="size-4 text-primary" />
              {activeSession?.machineName ?? "Chưa vào máy"}
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-5">
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase">
              <WalletCards className="size-5 text-emerald-400" />
              Số dư hiện tại
            </div>
            <p className="text-3xl font-bold text-emerald-400">
              {formatCurrency(visibleBalance)}
            </p>
          </div>

          <div className="rounded-lg border border-purple-400/40 bg-purple-500/15 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase">
              <Clock3 className="size-5 text-purple-300" />
              Thời gian còn lại
            </div>
            <p className="font-mono text-3xl font-bold text-purple-200">
              {formatClock(remaining)}
            </p>
          </div>

          <div className="rounded-lg border bg-muted/20 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase">
              <Clock3 className="size-5 text-emerald-300" />
              Thời gian đã dùng
            </div>
            <p className="font-mono text-3xl font-bold text-emerald-200">
              {formatClock(elapsed)}
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-5 border-t pt-3">
          <div className="mb-2 grid grid-cols-2 rounded-md bg-background/50 p-1">
            <button
              className={`inline-flex h-9 items-center justify-center gap-2 rounded-md text-sm font-medium transition ${
                tab === "orders" ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}
              type="button"
              onClick={() => setTab("orders")}
            >
              <Utensils className="size-4" />
              Đơn hàng ({orders.length})
            </button>
            <button
              className={`inline-flex h-9 items-center justify-center gap-2 rounded-md text-sm font-medium transition ${
                tab === "history" ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}
              type="button"
              onClick={() => setTab("history")}
            >
              <History className="size-4" />
              Lịch sử
            </button>
          </div>
          {loading ? (
            <div className="grid min-h-28 place-items-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
              <RefreshCw className="mb-2 size-5 animate-spin" />
              Đang tải
            </div>
          ) : tab === "orders" ? (
            <OrderList orders={orders} />
          ) : (
            <HistoryList payments={payments} />
          )}
        </div>

        <div className="mt-7 grid grid-cols-2 gap-4">
          <button
            className="inline-flex h-20 flex-col items-center justify-center gap-2 rounded-lg border border-orange-500/40 bg-orange-500/10 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/15"
            type="button"
            onClick={() => setServiceVisible(true)}
          >
            <Utensils className="size-6" />
            Dịch vụ
          </button>
          <button
            className="inline-flex h-20 flex-col items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            disabled
            title="Nạp tiền được xử lý tại màn hình đăng nhập máy trạm khi số dư đã hết."
            type="button"
          >
            <CreditCard className="size-6" />
            Nạp tiền
          </button>
          <button
            className="inline-flex h-14 items-center justify-center gap-2 rounded-lg border bg-muted/30 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            type="button"
            onClick={() => setPasswordVisible((value) => !value)}
          >
            <KeyRound className="size-5" />
            Đổi MK
          </button>
          <button
            className="inline-flex h-14 items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 text-sm font-semibold text-red-300 transition hover:bg-red-500/15"
            type="button"
            onClick={() => void handleLogout()}
          >
            <LogOut className="size-5" />
            Đăng xuất
          </button>
        </div>

        {serviceVisible ? (
          <ServiceOrderModal
            activeSession={activeSession}
            services={services}
            onClose={() => setServiceVisible(false)}
            onCreated={() => void loadPanel()}
          />
        ) : null}

        {passwordVisible ? (
          <form className="mt-4 grid gap-3 rounded-md border bg-background p-3" onSubmit={submitPassword}>
            <input
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary"
              placeholder="Mật khẩu hiện tại"
              type="password"
              value={passwordValues.currentPassword}
              onChange={(event) =>
                setPasswordValues((current) => ({
                  ...current,
                  currentPassword: event.target.value,
                }))
              }
            />
            <input
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary"
              placeholder="Mật khẩu mới"
              type="password"
              value={passwordValues.newPassword}
              onChange={(event) =>
                setPasswordValues((current) => ({
                  ...current,
                  newPassword: event.target.value,
                }))
              }
            />
            <button
              className="h-10 rounded-md bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60"
              disabled={
                passwordValues.currentPassword.length === 0 ||
                passwordValues.newPassword.length < 6
              }
              type="submit"
            >
              Xác nhận đổi mật khẩu
            </button>
            {passwordMessage ? (
              <p className="text-xs text-muted-foreground">{passwordMessage}</p>
            ) : null}
          </form>
        ) : null}

        <p className="mt-7 text-center font-mono text-sm text-foreground">
          {now.toLocaleTimeString("vi-VN")} {now.toLocaleDateString("vi-VN")}
        </p>
      </section>
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
