import { FormEvent, useState } from "react";
import { AxiosError } from "axios";
import {
  CalendarCheck2,
  LockKeyhole,
  LogIn,
  MonitorCheck,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import type { ApiError } from "@/types/api";
import type { LoginValues } from "@/features/auth/types";

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

  return "Không thể đăng nhập.";
}

function getRedirectPath(state: unknown) {
  if (
    typeof state === "object" &&
    state !== null &&
    "from" in state &&
    typeof state.from === "object" &&
    state.from !== null &&
    "pathname" in state.from &&
    typeof state.from.pathname === "string"
  ) {
    return state.from.pathname;
  }

  return "/booking";
}

export function CustomerBookingLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const [values, setValues] = useState<LoginValues>({
    username: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField(field: keyof LoginValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const user = await login(values);
      if (user.role !== "CUSTOMER") {
        await logout();
        setError("Trang đặt máy trước chỉ dành cho tài khoản khách hàng.");
        return;
      }

      navigate(getRedirectPath(location.state), { replace: true });
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_410px]">
        <div className="grid gap-6">
          <div className="inline-flex w-fit items-center gap-3 rounded-md border bg-background px-3 py-2">
            <div className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground">
              <MonitorCheck className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">Cyber Game</p>
              <p className="text-lg font-semibold">Đặt máy trước</p>
            </div>
          </div>

          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
              Chọn máy trước khi đến quán
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Đăng nhập bằng tài khoản khách hàng để xem máy còn trống, giữ chỗ
              và theo dõi lịch đặt từ laptop hoặc điện thoại cá nhân.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              "Xem máy trống",
              "Giữ chỗ theo giờ",
              "Theo dõi lịch đặt",
            ].map((item) => (
              <div className="rounded-md border bg-muted/20 p-3 text-sm" key={item}>
                <CalendarCheck2 className="mb-2 size-5 text-primary" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <form
          className="grid gap-5 rounded-md border bg-background p-5 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div>
            <p className="text-sm font-medium text-primary">Khách hàng</p>
            <h2 className="mt-1 text-2xl font-semibold">Đăng nhập đặt máy</h2>
          </div>

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
              values.username.trim().length === 0 ||
              values.password.length === 0
            }
            type="submit"
          >
            <LogIn className="size-4" />
            {submitting ? "Đang đăng nhập" : "Vào trang đặt máy"}
          </button>
        </form>
      </section>
    </main>
  );
}
