import { FormEvent, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  CalendarClock,
  Clock3,
  CreditCard,
  Gamepad2,
  LockKeyhole,
  LogIn,
  Monitor,
  ShieldAlert,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { topUpCustomerBalance } from "@/features/payments/paymentApi";
import type { CustomerTopUpValues } from "@/features/payments/types";
import {
  startPlaySession,
  startPlaySessionFromReservation,
} from "@/features/play-sessions/playSessionApi";
import { getStationActiveReservation } from "@/features/reservations/reservationApi";
import type { StationReservation } from "@/features/reservations/types";
import { useRealtimeEvents } from "@/features/realtime/useRealtimeEvents";
import { useAuthStore } from "@/stores/authStore";
import type { ApiError } from "@/types/api";
import type { LoginValues } from "@/features/auth/types";

const STATION_MACHINE_ID_KEY = "cybergame_station_machine_id";
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

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) {
      return data.message;
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      return "Tên đăng nhập hoặc mật khẩu không hợp lệ.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể xử lý yêu cầu.";
}

function getStateMessage(state: unknown) {
  if (
    typeof state === "object" &&
    state !== null &&
    "message" in state &&
    typeof state.message === "string"
  ) {
    return state.message;
  }

  return null;
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function normalizeReservationCode(value: string) {
  const trimmed = value.trim().toUpperCase();
  const numericPart = trimmed.replace(/^RSV-?/, "").replace(/\D/g, "");
  if (!numericPart) {
    return trimmed;
  }
  return `RSV-${numericPart.padStart(6, "0")}`;
}

function remainingSeconds(expiresAt: string, now: Date) {
  return Math.max(0, (new Date(expiresAt).getTime() - now.getTime()) / 1000);
}

function formatCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((item) => String(item).padStart(2, "0"))
    .join(":");
}

function resolveStationMachineId(search: string) {
  const params = new URLSearchParams(search);
  const queryMachineId = params.get("machineId");
  if (queryMachineId && Number(queryMachineId) > 0) {
    localStorage.setItem(STATION_MACHINE_ID_KEY, queryMachineId);
    return Number(queryMachineId);
  }

  const storedMachineId = localStorage.getItem(STATION_MACHINE_ID_KEY);
  return storedMachineId && Number(storedMachineId) > 0 ? Number(storedMachineId) : null;
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

type CustomerStationLoginSurfaceProps = {
  reservationMode: boolean;
};

function CustomerStationLoginSurface({
  reservationMode,
}: CustomerStationLoginSurfaceProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const refreshCurrentUser = useAuthStore((state) => state.refreshCurrentUser);
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const [values, setValues] = useState<LoginValues>({
    username: "",
    password: "",
  });
  const [reservationCode, setReservationCode] = useState("");
  const [topUpValues, setTopUpValues] = useState<CustomerTopUpValues>({
    amount: "50000",
    paymentMethod: "CASH",
  });
  const [stationMachineId, setStationMachineId] = useState<number | null>(() =>
    resolveStationMachineId(location.search)
  );
  const [stationReservation, setStationReservation] =
    useState<StationReservation | null>(null);
  const [now, setNow] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(() =>
    getStateMessage(location.state)
  );
  const [submitting, setSubmitting] = useState(false);
  const [topUpSubmitting, setTopUpSubmitting] = useState(false);

  const balance = user?.balance ?? 0;
  const mustTopUp = user?.role === "CUSTOMER" && balance <= 0;
  const requiresReservationCode =
    reservationMode && stationReservation !== null && stationMachineId !== null;
  const topUpAmount = useMemo(
    () => Number(topUpValues.amount.replace(/[^\d.]/g, "")) || 0,
    [topUpValues.amount]
  );
  const transferContent = bankTransferContent(user?.username, topUpAmount);
  const transferQrUrl = bankTransferQrUrl(topUpAmount, user?.username);

  useRealtimeEvents(["PAYMENT_CHANGED"], () => {
    if (user?.role === "CUSTOMER") {
      void refreshCurrentUser();
    }
  });

  useEffect(() => {
    const nextMachineId = resolveStationMachineId(location.search);
    setStationMachineId(nextMachineId);
  }, [location.search]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!stationMachineId) {
      setStationReservation(null);
      return;
    }

    const machineId = stationMachineId;
    let cancelled = false;
    async function loadStationReservation() {
      try {
        const reservation = await getStationActiveReservation(machineId);
        if (!cancelled) {
          setStationReservation(reservation);
          if (reservation && !reservationMode) {
            navigate(`/customer/reservation-login?machineId=${machineId}`, {
              replace: true,
            });
          }
          if (!reservation && reservationMode) {
            navigate(`/customer/login?machineId=${machineId}`, {
              replace: true,
            });
          }
        }
      } catch {
        if (!cancelled) {
          setStationReservation(null);
          if (reservationMode) {
            navigate(`/customer/login?machineId=${machineId}`, {
              replace: true,
            });
          }
        }
      }
    }

    void loadStationReservation();
    const interval = window.setInterval(() => void loadStationReservation(), 30000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [navigate, reservationMode, stationMachineId]);

  function updateField(field: keyof LoginValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function updateTopUpField(field: keyof CustomerTopUpValues, value: string) {
    setTopUpValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    let loggedIn = false;

    try {
      const loggedInUser = await login(values);
      loggedIn = true;
      if (loggedInUser.role !== "CUSTOMER") {
        await logout();
        setError("Màn hình máy trạm chỉ dành cho tài khoản khách hàng.");
        return;
      }

      if (!reservationMode && (loggedInUser.balance ?? 0) <= 0) {
        setMessage("Số dư của bạn đã hết. Vui lòng nạp thêm tiền trước khi vào phiên chơi.");
        return;
      }

      if (!stationMachineId) {
        await logout();
        setError("Không xác định được máy trạm. Vui lòng mở đường dẫn có machineId.");
        return;
      }

      if (reservationMode) {
        if (!stationReservation) {
          await logout();
          setError("Máy trạm này không có đơn đặt trước còn hạn.");
          return;
        }

        if (
          normalizeReservationCode(reservationCode) !==
          normalizeReservationCode(stationReservation.reservationCode)
        ) {
          await logout();
          setError("Mã đặt trước không đúng với máy trạm này.");
          return;
        }

        await startPlaySessionFromReservation({
          reservationId: String(stationReservation.reservationId),
          machineIds: String(stationMachineId),
        });
      } else {
        await startPlaySession({
          customerId: "",
          machineId: String(stationMachineId),
        });
      }

      await refreshCurrentUser();
      navigate("/customer", { replace: true });
    } catch (loginError) {
      if (loggedIn) {
        await logout();
      }
      setError(getErrorMessage(loginError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTopUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (topUpAmount < 1000) {
      setError("Số tiền nạp tối thiểu là 1.000đ.");
      return;
    }

    setTopUpSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const payment = await topUpCustomerBalance({
        amount: String(topUpAmount),
        paymentMethod: topUpValues.paymentMethod,
      });
      setMessage(
        `Đã gửi yêu cầu nạp tiền #${payment.id}. Vui lòng chờ nhân viên/admin xác nhận, sau đó hệ thống sẽ tự cập nhật số dư.`
      );
    } catch (topUpError) {
      setError(getErrorMessage(topUpError));
    } finally {
      setTopUpSubmitting(false);
    }
  }

  async function handleDifferentAccount() {
    await logout();
    setValues({ username: "", password: "" });
    setError(null);
    setMessage(null);
  }

  return (
    <main className="grid min-h-screen bg-[#111827] px-4 py-8">
      <section className="mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_410px]">
        <div className="hidden lg:grid lg:gap-6">
          <div className="inline-flex w-fit items-center gap-3 rounded-md border bg-background/70 px-4 py-3">
            <div className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground">
              <Gamepad2 className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">Cyber Game</p>
              <h1 className="text-2xl font-semibold">Máy trạm khách hàng</h1>
            </div>
          </div>

          {stationMachineId ? (
            <div className="grid w-fit gap-2 rounded-md border bg-background/70 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Monitor className="size-4 text-primary" />
                Máy trạm #{stationMachineId}
              </div>
              {stationReservation ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-amber-100">
                    <CalendarClock className="size-4 text-amber-300" />
                    Máy đang được đặt trước
                  </div>
                  <p className="font-mono text-2xl font-semibold text-primary">
                    {formatCountdown(remainingSeconds(stationReservation.expiresAt, now))}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Không có lịch đặt còn hạn cho máy này.
                </p>
              )}
            </div>
          ) : null}

          <div className="max-w-xl">
            <p className="text-sm font-medium text-primary">Phiên chơi tại quán</p>
            <h2 className="mt-2 text-4xl font-semibold leading-tight">
              {reservationMode
                ? "Check-in máy đã đặt trước"
                : "Đăng nhập để bắt đầu phiên chơi"}
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Tài khoản hết số dư sẽ được giữ ở màn hình này để nạp tiền trước khi
              vào máy. Phần đặt máy trước vẫn nằm riêng ở trang đặt máy cho thiết bị cá nhân.
            </p>
          </div>
        </div>

        {mustTopUp ? (
          <form
            className="mx-auto grid w-full max-w-md gap-5 rounded-md border bg-background p-5 shadow-sm"
            onSubmit={handleTopUp}
          >
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground">
                <WalletCards className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary">Cần nạp tiền</p>
                <h2 className="text-xl font-semibold">{user?.username}</h2>
              </div>
            </div>

            <div className="rounded-md border border-amber-400/40 bg-amber-500/15 px-3 py-3 text-sm text-amber-100">
              Số dư hiện tại là {formatCurrency(balance)}. Vui lòng nạp thêm tiền
              trước khi vào phiên chơi.
            </div>

            {message ? (
              <div className="rounded-md border border-primary/35 bg-primary/10 px-3 py-2 text-sm text-emerald-200">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-red-200">
                <ShieldAlert className="size-4" />
                <span>{error}</span>
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-2">
              {TOP_UP_AMOUNTS.map((amount) => (
                <button
                  className={`h-10 rounded-md border text-sm font-medium transition hover:border-primary ${
                    topUpValues.amount === amount ? "border-primary bg-primary/10 text-primary" : ""
                  }`}
                  key={amount}
                  type="button"
                  onClick={() => updateTopUpField("amount", amount)}
                >
                  {formatCurrency(amount)}
                </button>
              ))}
            </div>

            <label className="grid gap-2 text-sm">
              <span className="text-muted-foreground">Số tiền nạp</span>
              <input
                className="h-11 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
                min={1000}
                type="number"
                value={topUpValues.amount}
                onChange={(event) => updateTopUpField("amount", event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-muted-foreground">Phương thức</span>
              <select
                className="h-11 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
                value={topUpValues.paymentMethod}
                onChange={(event) =>
                  updateTopUpField("paymentMethod", event.target.value)
                }
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </label>

            {topUpValues.paymentMethod === "BANK_TRANSFER" ? (
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
                    Nội dung:{" "}
                    <strong className="font-mono">{transferContent}</strong>
                  </span>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  Sau khi chuyển khoản, yêu cầu này sẽ ở trạng thái chờ.
                  Nhân viên/admin đối chiếu giao dịch bên ngoài rồi xác nhận
                  thủ công trong màn hình thanh toán.
                </p>
              </div>
            ) : null}

            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              disabled={topUpSubmitting || topUpAmount < 1000}
              type="submit"
            >
              <CreditCard className="size-4" />
              {topUpSubmitting ? "Đang gửi" : "Gửi yêu cầu nạp tiền"}
            </button>

            <button
              className="h-10 rounded-md border text-sm text-muted-foreground transition hover:text-foreground"
              type="button"
              onClick={() => void handleDifferentAccount()}
            >
              Đăng nhập tài khoản khác
            </button>
          </form>
        ) : (
          <form
            className="mx-auto grid w-full max-w-md gap-5 rounded-md border bg-background p-5 shadow-sm"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center gap-3 lg:hidden">
              <div className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground">
                <Gamepad2 className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary">Cyber Game</p>
                <h1 className="text-xl font-semibold">Máy trạm</h1>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-primary">Khách hàng</p>
              <h2 className="mt-1 text-2xl font-semibold">
                {reservationMode ? "Check-in đặt máy" : "Đăng nhập phiên chơi"}
              </h2>
            </div>

            {requiresReservationCode ? (
              <div className="rounded-md border border-amber-400/40 bg-amber-500/15 px-3 py-3 text-sm text-amber-100">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <Clock3 className="size-4" />
                  {stationReservation.machineName} đã được đặt trước
                </div>
                <p className="font-mono text-xl font-semibold">
                  {formatCountdown(remainingSeconds(stationReservation.expiresAt, now))}
                </p>
              </div>
            ) : null}

            {message ? (
              <div className="rounded-md border border-primary/35 bg-primary/10 px-3 py-2 text-sm text-emerald-200">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-red-200">
                <ShieldAlert className="size-4" />
                <span>{error}</span>
              </div>
            ) : null}

            <label className="grid gap-2 text-sm">
              <span className="text-muted-foreground">Tên đăng nhập</span>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoComplete="username"
                  className="h-11 w-full rounded-md border bg-background pl-10 pr-3 outline-none transition focus:border-primary"
                  required
                  value={values.username}
                  onChange={(event) => updateField("username", event.target.value)}
                />
              </div>
            </label>

            {requiresReservationCode ? (
              <label className="grid gap-2 text-sm">
                <span className="text-muted-foreground">Mã đặt trước</span>
                <div className="relative">
                  <CalendarClock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    autoComplete="off"
                    className="h-11 w-full rounded-md border bg-background pl-10 pr-3 font-mono uppercase outline-none transition focus:border-primary"
                    placeholder="RSV-000123"
                    required
                    value={reservationCode}
                    onChange={(event) => setReservationCode(event.target.value)}
                  />
                </div>
              </label>
            ) : null}

            <label className="grid gap-2 text-sm">
              <span className="text-muted-foreground">Mật khẩu</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoComplete="current-password"
                  className="h-11 w-full rounded-md border bg-background pl-10 pr-3 outline-none transition focus:border-primary"
                  required
                  type="password"
                  value={values.password}
                  onChange={(event) => updateField("password", event.target.value)}
                />
              </div>
            </label>

            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              disabled={
                submitting ||
                status === "loading" ||
                values.username.trim().length === 0 ||
                values.password.length === 0 ||
                (requiresReservationCode && reservationCode.trim().length === 0)
              }
              type="submit"
            >
              <LogIn className="size-4" />
              {submitting
                ? "Đang đăng nhập"
                : requiresReservationCode
                  ? "Check-in và vào máy"
                  : "Vào phiên chơi"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export function CustomerStationLoginPage() {
  return <CustomerStationLoginSurface reservationMode={false} />;
}

export function CustomerReservedStationLoginPage() {
  return <CustomerStationLoginSurface reservationMode />;
}
