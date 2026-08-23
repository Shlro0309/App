import { FormEvent, useState } from "react";
import { AxiosError } from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Gamepad2,
  LockKeyhole,
  LogIn,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import type { ApiError } from "@/types/api";
import { useAuthStore } from "@/stores/authStore";
import type { LoginValues } from "./types";

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return "TĂªn Ä‘Äƒng nháº­p hoáº·c máº­t kháº©u khĂ´ng há»£p lá»‡.";
    }

    const data = error.response?.data as ApiError | undefined;
    if (data?.message) {
      return data.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "KhĂ´ng thá»ƒ Ä‘Äƒng nháº­p.";
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

  return "/";
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
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
      await login({...values, clientType: "operator"});
      navigate(getRedirectPath(location.state), { replace: true });
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-background px-4 py-8">
      <section className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="hidden lg:block">
          <div className="mb-8 inline-flex items-center gap-3 rounded-md border bg-background/70 px-4 py-3">
            <div className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground">
              <Gamepad2 className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">Cyber Game</p>
              <h1 className="text-2xl font-semibold">Quáº£n lĂ½</h1>
            </div>
          </div>
          <div className="grid max-w-xl gap-4">
            <p className="text-sm font-medium text-primary">Khu vá»±c váº­n hĂ nh</p>
            <h2 className="text-4xl font-semibold leading-tight">
              VĂ o há»‡ thá»‘ng váº­n hĂ nh phĂ²ng mĂ¡y
            </h2>
            <p className="text-base leading-7 text-muted-foreground">
              Quáº£n lĂ½ mĂ¡y tráº¡m, Ä‘áº·t mĂ¡y, phiĂªn chÆ¡i, dá»‹ch vá»¥, thanh toĂ¡n vĂ  bĂ¡o
              cĂ¡o trong cĂ¹ng má»™t giao diá»‡n.
            </p>
          </div>
        </div>

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
              <h1 className="text-xl font-semibold">Quáº£n lĂ½</h1>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-primary">ÄÄƒng nháº­p</p>
            <h2 className="mt-1 text-2xl font-semibold">TĂ i khoáº£n há»‡ thá»‘ng</h2>
          </div>

          {error ? (
            <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-red-200">
              <ShieldAlert className="size-4" />
              <span>{error}</span>
            </div>
          ) : null}

          <label className="grid gap-2 text-sm">
            <span className="text-muted-foreground">TĂªn Ä‘Äƒng nháº­p</span>
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
            <span className="text-muted-foreground">Máº­t kháº©u</span>
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
            {submitting ? "Äang Ä‘Äƒng nháº­p" : "ÄÄƒng nháº­p"}
          </button>
        </form>
      </section>
    </main>
  );
}
