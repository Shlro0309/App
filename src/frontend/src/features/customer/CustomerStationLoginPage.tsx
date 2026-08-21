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
import bookingGamingBackground from "@/assets/booking-gaming-bg.png";
import { topUpCustomerBalance } from "@/features/payments/paymentApi";
import type { CustomerTopUpValues } from "@/features/payments/types";
import {
  startPlaySession,
  startPlaySessionFromReservation,
} from "@/features/play-sessions/playSessionApi";
import {
  getStationActiveReservation,
  getStationMachine,
} from "@/features/reservations/reservationApi";
import type {
  StationMachine,
  StationReservation,
} from "@/features/reservations/types";
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
    if (error.response?.status === 401 || error.response?.status === 403) {
      return "Tên đăng nhập hoặc mật khẩu không hợp lệ.";
    }

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
  return storedMachineId && Number(storedMachineId) > 0
    ? Number(storedMachineId)
    : null;
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
  const [stationMachine, setStationMachine] = useState<StationMachine | null>(
    null
  );
  const [now, setNow] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(() =>
    getStateMessage(location.state)
  );
  const [submitting, setSubmitting] = useState(false);
  const [topUpSubmitting, setTopUpSubmitting] = useState(false);

  const balance = user?.balance ?? 0;
  const mustTopUp = user?.role === "CUSTOMER" && balance <= 0;
  const zeroBalanceWarning =
    mustTopUp && !reservationMode
      ? "Số dư của bạn đang bằng 0 nên chưa thể vào phiên chơi. Vui lòng nạp thêm tiền và chờ nhân viên/admin xác nhận."
      : null;
  const requiresReservationCode =
    reservationMode && stationReservation !== null && stationMachineId !== null;
  const topUpAmount = useMemo(
    () => Number(topUpValues.amount.replace(/[^\d.]/g, "")) || 0,
    [topUpValues.amount]
  );
  const transferContent = bankTransferContent(user?.username, topUpAmount);
  const transferQrUrl = bankTransferQrUrl(topUpAmount, user?.username);
  const stationMachineName =
    stationMachine?.name ??
    stationReservation?.machineName ??
    (stationMachineId ? `Máy #${stationMachineId}` : "Máy trạm");
  const stationAreaName = stationMachine?.areaName ?? "Chưa xác định khu";
  const reservationCountdown = stationReservation
    ? formatCountdown(remainingSeconds(stationReservation.expiresAt, now))
    : null;

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
      setStationMachine(null);
      return;
    }

    const machineId = stationMachineId;
    let cancelled = false;
    async function loadStationReservation() {
      try {
        const [machine, reservation] = await Promise.all([
          getStationMachine(machineId),
          getStationActiveReservation(machineId),
        ]);
        if (!cancelled) {
          setStationMachine(machine);
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
          setStationMachine(null);
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
    <main
      className="booking-shell h-screen overflow-hidden bg-cover bg-center bg-fixed text-foreground"
      style={{ backgroundImage: `url(${bookingGamingBackground})` }}
    >
      <section className="grid h-screen grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-[#020713]/78 p-4 backdrop-blur-[2px]">
        <header className="glass-panel mx-auto grid w-full max-w-7xl gap-3 rounded-md p-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 place-items-center rounded-md border border-primary/40 bg-primary/15 text-primary shadow-[0_0_26px_rgba(78,222,163,0.2)]">
              <Monitor className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="label-caps text-cyan-100">Tên máy</p>
              <h1 className="truncate text-2xl font-bold text-slate-50">
                {stationMachineName}
              </h1>
            </div>
          </div>

          <div className="rounded-md border border-primary/35 bg-primary/10 px-5 py-2 text-center shadow-[0_0_24px_rgba(78,222,163,0.12)]">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase text-cyan-100">
              <Clock3 className="size-4" />
              {stationReservation ? "Giữ chỗ còn lại" : "Trạng thái máy"}
            </div>
            <p className="metric-number mt-1 text-xl font-bold text-primary">
              {reservationCountdown ?? "Sẵn sàng đăng nhập"}
            </p>
          </div>

          <div className="min-w-0 text-left md:text-right">
            <p className="label-caps text-cyan-100">Khu máy</p>
            <p className="truncate text-2xl font-bold text-slate-50">
              {stationAreaName}
            </p>
          </div>
        </header>

        <div className="mx-auto grid min-h-0 w-full max-w-7xl place-items-center px-0 py-3">
          <div
            className={`grid w-full gap-3 ${
              mustTopUp ? "max-w-5xl" : "max-w-[460px]"
            }`}
          >
            <div className="text-center">
              <div className="mx-auto mb-2 grid size-12 place-items-center rounded-md border border-primary/40 bg-primary/15 text-primary shadow-[0_0_34px_rgba(78,222,163,0.18)]">
                <Gamepad2 className="size-6" />
              </div>
              <p className="label-caps text-cyan-100">Cyber Game</p>
              <h2 className="mt-1 text-3xl font-bold text-slate-50">
                {reservationMode ? "Check-in đặt trước" : "Đăng nhập phiên chơi"}
              </h2>
            </div>

            {mustTopUp ? (
              <form
                className="glass-panel relative grid gap-4 rounded-lg p-4 shadow-2xl shadow-black/40 lg:grid-cols-[minmax(240px,0.9fr)_minmax(280px,1fr)_minmax(280px,1.1fr)] lg:items-start"
                onSubmit={handleTopUp}
              >
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-md border border-primary/40 bg-primary/15 text-primary">
                      <WalletCards className="size-5" />
                    </div>
                    <div>
                      <p className="label-caps text-primary">Cần nạp tiền</p>
                      <h3 className="text-xl font-bold text-slate-50">
                        {user?.username}
                      </h3>
                    </div>
                  </div>

                  <div className="rounded-md border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-sm font-semibold text-amber-100">
                    Số dư hiện tại là {formatCurrency(balance)}. Vui lòng nạp thêm
                    tiền trước khi vào phiên chơi.
                  </div>

                  {message || zeroBalanceWarning ? (
                    <div
                      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm font-semibold ${
                        message
                          ? "border-primary/35 bg-primary/10 text-emerald-100"
                          : "border-destructive/40 bg-destructive/10 text-red-100"
                      }`}
                    >
                      <ShieldAlert className="mt-0.5 size-4" />
                      <span>{message ?? zeroBalanceWarning}</span>
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-3">
                  <div className="grid grid-cols-3 gap-2">
                    {TOP_UP_AMOUNTS.map((amount) => (
                      <button
                        className={`h-10 rounded-md border text-sm font-bold transition hover:border-primary ${
                          topUpValues.amount === amount
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-sky-200/15 bg-[#050b19]/80 text-slate-100"
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
                    <span className="label-caps text-slate-100">Số tiền nạp</span>
                    <input
                      className="h-11 rounded-md border border-sky-200/15 bg-[#050b19]/85 px-3 font-semibold text-slate-50 outline-none transition focus:border-primary"
                      min={1000}
                      type="number"
                      value={topUpValues.amount}
                      onChange={(event) =>
                        updateTopUpField("amount", event.target.value)
                      }
                    />
                  </label>

                  <label className="grid gap-2 text-sm">
                    <span className="label-caps text-slate-100">Phương thức</span>
                    <select
                      className="h-11 rounded-md border border-sky-200/15 bg-[#050b19]/85 px-3 font-semibold text-slate-50 outline-none transition focus:border-primary"
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

                </div>

                <div className="grid h-[245px] content-start gap-3 overflow-hidden">
                  {topUpValues.paymentMethod === "BANK_TRANSFER" ? (
                    <div className="grid h-full justify-items-center gap-2 rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-slate-100">
                      {transferQrUrl ? (
                        <img
                          alt="QR chuyển khoản nạp tiền"
                          className="aspect-square w-44 rounded-md bg-white p-2"
                          src={transferQrUrl}
                        />
                      ) : null}
                      <div className="grid w-full gap-1 rounded-md border border-sky-200/15 bg-[#050b19]/80 p-2 text-xs">
                        <span>Số tiền: {formatCurrency(topUpAmount)}</span>
                        <span>
                          Nội dung:{" "}
                          <strong className="font-mono">{transferContent}</strong>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid h-full place-items-center gap-3 rounded-md border border-emerald-400/30 bg-emerald-500/10 p-3 text-center text-sm font-medium text-emerald-100">
                      <p>Yêu cầu tiền mặt sẽ được gửi đến nhân viên/admin để xác nhận thủ công.</p>
                    </div>
                  )}

                </div>

                {error ? (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-3 text-sm font-semibold text-red-100 lg:absolute lg:bottom-20 lg:right-4 lg:w-[320px]">
                    <ShieldAlert className="size-4" />
                    <span>{error}</span>
                  </div>
                ) : null}

                <div className="grid gap-3 lg:col-span-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <button
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground shadow-[0_0_28px_rgba(78,222,163,0.2)] transition hover:opacity-90 disabled:opacity-60"
                    disabled={topUpSubmitting || topUpAmount < 1000}
                    type="submit"
                  >
                    <CreditCard className="size-4" />
                    {topUpSubmitting ? "Đang gửi" : "Gửi yêu cầu nạp tiền"}
                  </button>

                  <button
                    className="h-11 rounded-md border border-sky-200/15 bg-white/[0.03] text-sm font-semibold text-slate-100 transition hover:bg-muted"
                    type="button"
                    onClick={() => void handleDifferentAccount()}
                  >
                    Đăng nhập tài khoản khác
                  </button>
                </div>
              </form>
            ) : (
              <form
                className="glass-panel grid gap-5 rounded-lg p-6 shadow-2xl shadow-black/40"
                onSubmit={handleSubmit}
              >
                {requiresReservationCode ? (
                  <div className="rounded-md border border-amber-400/40 bg-amber-500/15 px-3 py-3 text-sm text-amber-100">
                    <div className="mb-2 flex items-center gap-2 font-bold">
                      <Clock3 className="size-4" />
                      {stationReservation.machineName} đã được đặt trước
                    </div>
                    <p className="metric-number text-xl font-bold">
                      {reservationCountdown}
                    </p>
                  </div>
                ) : null}

                {message ? (
                  <div className="rounded-md border border-primary/35 bg-primary/10 px-3 py-2 text-sm font-medium text-emerald-100">
                    {message}
                  </div>
                ) : null}

                {error ? (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-red-100">
                    <ShieldAlert className="size-4" />
                    <span>{error}</span>
                  </div>
                ) : null}

                <label className="grid gap-2 text-sm">
                  <span className="label-caps text-slate-100">Tên đăng nhập</span>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cyan-100" />
                    <input
                      autoComplete="username"
                      className="h-11 w-full rounded-md border border-sky-200/15 bg-[#050b19]/85 pl-10 pr-3 font-semibold text-slate-50 outline-none transition focus:border-primary"
                      required
                      value={values.username}
                      onChange={(event) =>
                        updateField("username", event.target.value)
                      }
                    />
                  </div>
                </label>

                {requiresReservationCode ? (
                  <label className="grid gap-2 text-sm">
                    <span className="label-caps text-slate-100">
                      Mã đặt trước
                    </span>
                    <div className="relative">
                      <CalendarClock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cyan-100" />
                      <input
                        autoComplete="off"
                        className="h-11 w-full rounded-md border border-sky-200/15 bg-[#050b19]/85 pl-10 pr-3 font-mono font-bold uppercase text-slate-50 outline-none transition focus:border-primary"
                        placeholder="RSV-000123"
                        required
                        value={reservationCode}
                        onChange={(event) => setReservationCode(event.target.value)}
                      />
                    </div>
                  </label>
                ) : null}

                <label className="grid gap-2 text-sm">
                  <span className="label-caps text-slate-100">Mật khẩu</span>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cyan-100" />
                    <input
                      autoComplete="current-password"
                      className="h-11 w-full rounded-md border border-sky-200/15 bg-[#050b19]/85 pl-10 pr-3 font-semibold text-slate-50 outline-none transition focus:border-primary"
                      required
                      type="password"
                      value={values.password}
                      onChange={(event) =>
                        updateField("password", event.target.value)
                      }
                    />
                  </div>
                </label>

                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground shadow-[0_0_28px_rgba(78,222,163,0.2)] transition hover:opacity-90 disabled:opacity-60"
                  disabled={
                    submitting ||
                    status === "loading" ||
                    values.username.trim().length === 0 ||
                    values.password.length === 0 ||
                    (requiresReservationCode &&
                      reservationCode.trim().length === 0)
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
          </div>
        </div>

        <footer className="glass-panel mx-auto flex min-h-14 w-full max-w-7xl items-center justify-between gap-3 rounded-md px-4 py-3 text-sm font-semibold text-slate-100">
          <span>
            {reservationMode ? "Chế độ check-in đặt trước" : "Đăng nhập máy trạm"}
          </span>
          <span className="metric-number">
            {now.toLocaleTimeString("vi-VN")} {now.toLocaleDateString("vi-VN")}
          </span>
        </footer>
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
