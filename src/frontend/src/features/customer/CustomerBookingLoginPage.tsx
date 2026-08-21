import { FormEvent, useState } from "react";
import { AxiosError } from "axios";
import {
  CalendarCheck2,
  Clock3,
  Cpu,
  LockKeyhole,
  LogIn,
  MonitorCheck,
  ShieldAlert,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import bookingGamingBackground from "@/assets/booking-gaming-bg.png";
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
    <main
      className="booking-shell min-h-screen bg-cover bg-center bg-fixed text-foreground"
      style={{ backgroundImage: `url(${bookingGamingBackground})` }}
    >
      <section className="grid min-h-screen bg-[#020713]/78 px-4 py-8 backdrop-blur-[2px]">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_430px]">
          <div className="grid gap-6">
            <div className="inline-flex w-fit items-center gap-3 rounded-md border border-primary/35 bg-[#050b19]/70 px-3 py-2 shadow-[0_0_34px_rgba(78,222,163,0.16)] backdrop-blur-xl">
              <div className="grid size-11 place-items-center rounded-md border border-primary/40 bg-primary/15 text-primary">
                <MonitorCheck className="size-5" />
              </div>
              <div>
                <p className="label-caps text-primary">Cyber Game</p>
                <p className="text-xl font-bold">Tên Cyber</p>
              </div>
            </div>

            <div className="max-w-2xl">
              <p className="label-caps mb-3 text-cyan-100">Prebook Arena</p>
              <h1 className="text-4xl font-bold leading-tight md:text-6xl">
                Đặt máy trước
              </h1>
              <p className="mt-4 max-w-xl text-base font-bold leading-7 text-slate-50">
                Xem sơ đồ máy, giữ chỗ và theo dõi lịch đặt từ laptop hoặc điện thoại cá nhân mà không cần phải đến nơi để tìm máy.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Xem sơ đồ máy", icon: Cpu },
                { label: "Giữ chỗ 30 phút", icon: Clock3 },
                { label: "Theo dõi lịch đặt", icon: CalendarCheck2 },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div className="glacier-card rounded-md p-3 text-sm" key={item.label}>
                    <Icon className="mb-2 size-5 text-primary" />
                    <span className="font-semibold">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <form
            className="glass-panel grid gap-5 rounded-lg p-6 shadow-2xl shadow-black/40"
            onSubmit={handleSubmit}
          >
            <div>
              <p className="label-caps text-primary">Khách hàng</p>
              <h2 className="mt-1 text-3xl font-bold">Đăng nhập đặt máy</h2>
            </div>

            {error ? (
              <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-red-200">
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
                  className="h-11 w-full rounded-md border border-sky-200/15 bg-[#050b19]/85 pl-10 pr-3 font-semibold text-slate-50 outline-none transition placeholder:text-slate-300/70 focus:border-primary"
                  required
                  value={values.username}
                  onChange={(event) => updateField("username", event.target.value)}
                />
              </div>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="label-caps text-slate-100">Mật khẩu</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cyan-100" />
                <input
                  autoComplete="current-password"
                  className="h-11 w-full rounded-md border border-sky-200/15 bg-[#050b19]/85 pl-10 pr-3 font-semibold text-slate-50 outline-none transition placeholder:text-slate-300/70 focus:border-primary"
                  required
                  type="password"
                  value={values.password}
                  onChange={(event) => updateField("password", event.target.value)}
                />
              </div>
            </label>

            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground shadow-[0_0_28px_rgba(78,222,163,0.2)] transition hover:opacity-90 disabled:opacity-60"
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

            <div className="flex items-center gap-2 rounded-md border border-sky-200/15 bg-white/[0.05] px-3 py-2 text-xs font-medium text-slate-100/85">
              <Sparkles className="size-4 text-primary" />
              <span>Giao diện đặt trước được tối ưu cho laptop và di động.</span>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
