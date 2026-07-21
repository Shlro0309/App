import { FormEvent, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  CreditCard,
  Gamepad2,
  LockKeyhole,
  LogIn,
  ShieldAlert,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { topUpCustomerBalance } from "@/features/payments/paymentApi";
import type { CustomerTopUpValues } from "@/features/payments/types";
import { useAuthStore } from "@/stores/authStore";
import type { ApiError } from "@/types/api";
import type { LoginValues } from "@/features/auth/types";

const TOP_UP_AMOUNTS = ["20000", "50000", "100000"];
const PAYMENT_METHODS = [
  { value: "CASH", label: "Tiền mặt" },
  { value: "CARD", label: "Thẻ" },
  { value: "BANK_TRANSFER", label: "Chuyển khoản" },
  { value: "E_WALLET", label: "Ví điện tử" },
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

export function CustomerStationLoginPage() {
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
  const [topUpValues, setTopUpValues] = useState<CustomerTopUpValues>({
    amount: "50000",
    paymentMethod: "CASH",
  });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(() =>
    getStateMessage(location.state)
  );
  const [submitting, setSubmitting] = useState(false);
  const [topUpSubmitting, setTopUpSubmitting] = useState(false);

  const balance = user?.balance ?? 0;
  const mustTopUp = user?.role === "CUSTOMER" && balance <= 0;
  const topUpAmount = useMemo(
    () => Number(topUpValues.amount.replace(/[^\d.]/g, "")) || 0,
    [topUpValues.amount]
  );

  useEffect(() => {
    if (user?.role === "CUSTOMER" && balance > 0) {
      navigate("/customer", { replace: true });
    }
  }, [balance, navigate, user?.role]);

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

    try {
      const loggedInUser = await login(values);
      if (loggedInUser.role !== "CUSTOMER") {
        await logout();
        setError("Màn hình máy trạm chỉ dành cho tài khoản khách hàng.");
        return;
      }

      if ((loggedInUser.balance ?? 0) <= 0) {
        setMessage("Số dư của bạn đã hết. Vui lòng nạp thêm tiền trước khi vào phiên chơi.");
        return;
      }

      navigate("/customer", { replace: true });
    } catch (loginError) {
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
      await topUpCustomerBalance({
        amount: String(topUpAmount),
        paymentMethod: topUpValues.paymentMethod,
      });
      await refreshCurrentUser();
      navigate("/customer", { replace: true });
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

          <div className="max-w-xl">
            <p className="text-sm font-medium text-primary">Phiên chơi tại quán</p>
            <h2 className="mt-2 text-4xl font-semibold leading-tight">
              Đăng nhập để mở side window phiên chơi
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

            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              disabled={topUpSubmitting || topUpAmount < 1000}
              type="submit"
            >
              <CreditCard className="size-4" />
              {topUpSubmitting ? "Đang nạp" : "Nạp tiền và vào phiên chơi"}
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
              <h2 className="mt-1 text-2xl font-semibold">Đăng nhập phiên chơi</h2>
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
                values.password.length === 0
              }
              type="submit"
            >
              <LogIn className="size-4" />
              {submitting ? "Đang đăng nhập" : "Vào phiên chơi"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
