import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  LogOut,
  Monitor,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ApiError } from "@/types/api";
import type {
  Reservation,
  ReservationMachine,
} from "@/features/reservations/types";
import { useAuthStore } from "@/stores/authStore";
import {
  createCustomerReservation,
  getCustomerAvailableMachines,
  getCustomerReservations,
} from "./customerApi";

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

function defaultExpiresAt() {
  const date = new Date();
  date.setHours(date.getHours() + 2);
  date.setMinutes(0, 0, 0);
  return toDateTimeLocalValue(date);
}

function toDateTimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join("T");
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

const statusLabels: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  CANCELLED: "Đã hủy",
  EXPIRED: "Đã hết hạn",
  COMPLETED: "Hoàn tất",
};

function ReservationStatusBadge({ status }: { status: string }) {
  const className =
    status === "CONFIRMED"
      ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-200"
      : status === "PENDING"
        ? "border-amber-400/35 bg-amber-400/10 text-amber-200"
        : "border-muted bg-muted/20 text-muted-foreground";

  return (
    <span className={`inline-flex h-7 items-center rounded-md border px-2 text-xs font-medium ${className}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}

export function CustomerPrebookPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [keyword, setKeyword] = useState("");
  const [machines, setMachines] = useState<ReservationMachine[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedMachineIds, setSelectedMachineIds] = useState<number[]>([]);
  const [expiresAt, setExpiresAt] = useState(defaultExpiresAt);
  const [deposit, setDeposit] = useState("0");
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const customerId = user?.customerId;

  const loadData = useCallback(async (nextKeyword: string) => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [machineData, reservationData] = await Promise.all([
        getCustomerAvailableMachines(nextKeyword),
        getCustomerReservations(customerId),
      ]);
      setMachines(machineData);
      setReservations(reservationData);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void loadData("");
  }, [loadData]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const selectedMachines = useMemo(
    () => machines.filter((machine) => selectedMachineIds.includes(machine.id)),
    [machines, selectedMachineIds]
  );

  const estimatedHourlyTotal = selectedMachines.reduce(
    (total, machine) => total + machine.hourlyPrice,
    0
  );
  const customerBalance = user?.balance ?? 0;
  const hasEnoughBalance =
    selectedMachineIds.length === 0 || customerBalance >= estimatedHourlyTotal;

  function toggleMachine(machine: ReservationMachine) {
    setSelectedMachineIds((current) =>
      current.includes(machine.id)
        ? current.filter((id) => id !== machine.id)
        : [...current, machine.id]
    );
  }

  async function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadData(keyword);
  }

  async function submitReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await createCustomerReservation({
        expiresAt,
        deposit,
        machineIds: selectedMachineIds,
      });
      setSuccess("Đã đặt máy trước thành công. Dùng mã đặt trước trong lịch đặt để check-in tại máy.");
      setSelectedMachineIds([]);
      await loadData(keyword);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/booking/login", { replace: true });
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-background/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground">
              <Monitor className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">Cyber Game Booking</p>
              <h1 className="text-2xl font-semibold">Đặt máy trước</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border px-3 py-2 text-sm text-emerald-200">
              Số dư {formatCurrency(user?.balance ?? 0)}
            </span>
            <span className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
              {user?.fullName ?? user?.username}
            </span>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              type="button"
              onClick={() => void handleLogout()}
            >
              <LogOut className="size-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6">
        <form
          className="grid gap-3 rounded-md border bg-background p-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_160px_auto]"
          onSubmit={submitReservation}
        >
          <label className="grid gap-2 text-sm lg:col-span-2">
            <span className="text-muted-foreground">Máy đã chọn</span>
            <div className="min-h-10 rounded-md border bg-muted/20 px-3 py-2 text-sm">
              {selectedMachines.length > 0
                ? selectedMachines.map((machine) => machine.name).join(", ")
                : "Chưa chọn máy"}
            </div>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-muted-foreground">Giữ chỗ đến</span>
            <input
              className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-muted-foreground">Đặt cọc</span>
            <input
              className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
              min={0}
              type="number"
              value={deposit}
              onChange={(event) => setDeposit(event.target.value)}
            />
          </label>
          <div className="flex items-end">
            <button
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              disabled={saving || selectedMachineIds.length === 0 || !hasEnoughBalance}
              type="submit"
            >
              <CheckCircle2 className="size-4" />
              {saving ? "Đang đặt" : "Đặt máy"}
            </button>
          </div>
        </form>
        {!hasEnoughBalance ? (
          <div className="rounded-md border border-amber-400/40 bg-amber-500/15 px-4 py-3 text-sm text-amber-100">
            Số dư phải đủ ít nhất 1 giờ chơi của máy đã chọn. Cần{" "}
            {formatCurrency(estimatedHourlyTotal)}, hiện có{" "}
            {formatCurrency(customerBalance)}.
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-4">
            <form
              className="grid gap-3 rounded-md border bg-background p-4 md:grid-cols-[minmax(0,1fr)_auto]"
              onSubmit={applySearch}
            >
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-10 w-full rounded-md border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary"
                  placeholder="Tìm tên máy hoặc khu vực"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                />
              </label>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                type="submit"
              >
                <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
                Tải máy trống
              </button>
            </form>

            {error ? (
              <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">
                <ShieldAlert className="size-4" />
                <span>{error}</span>
              </div>
            ) : null}

            {success ? (
              <div className="flex items-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                <CheckCircle2 className="size-4" />
                <span>{success}</span>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {loading ? (
                <div className="col-span-full grid min-h-48 place-items-center rounded-md border bg-background text-muted-foreground">
                  <RefreshCw className="mb-2 size-5 animate-spin" />
                  Đang tải danh sách máy
                </div>
              ) : null}
              {!loading && machines.length === 0 ? (
                <div className="col-span-full grid min-h-48 place-items-center rounded-md border bg-background text-muted-foreground">
                  Không có máy trống phù hợp.
                </div>
              ) : null}
              {!loading &&
                machines.map((machine) => {
                  const selected = selectedMachineIds.includes(machine.id);
                  return (
                    <button
                      className={[
                        "rounded-md border bg-background p-4 text-left transition hover:border-primary",
                        selected ? "border-primary ring-1 ring-primary" : "",
                      ].join(" ")}
                      key={machine.id}
                      type="button"
                      onClick={() => toggleMachine(machine)}
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="grid size-10 place-items-center rounded-md bg-muted">
                          <Monitor className="size-5 text-primary" />
                        </div>
                        <span className="rounded-md border border-emerald-400/35 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-200">
                          Trống
                        </span>
                      </div>
                      <h3 className="font-semibold">{machine.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {machine.areaName}
                      </p>
                      <p className="mt-3 text-sm font-medium">
                        {formatCurrency(machine.hourlyPrice)} / giờ
                      </p>
                    </button>
                  );
                })}
            </div>
          </div>

          <aside className="grid gap-5 self-start">
            <div className="rounded-md border bg-background p-4">
              <div className="mb-3 flex items-center gap-2">
                <Clock3 className="size-5 text-primary" />
                <h2 className="font-semibold">Tóm tắt đặt máy</h2>
              </div>
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Số máy</span>
                  <span className="font-medium">{selectedMachineIds.length}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Tiền giờ dự kiến</span>
                  <span className="font-medium">
                    {formatCurrency(estimatedHourlyTotal)} / giờ
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Đặt cọc</span>
                  <span className="font-medium">
                    {formatCurrency(Number(deposit || 0))}
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-md border bg-background">
              <div className="flex items-center gap-2 border-b p-4">
                <CalendarClock className="size-5 text-primary" />
                <h2 className="font-semibold">Lịch đặt của tôi</h2>
              </div>
              <div className="divide-y">
                {reservations.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    Chưa có lịch đặt máy.
                  </p>
                ) : null}
                {reservations.map((reservation) => (
                  <div className="grid gap-2 p-4" key={reservation.id}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-sm font-semibold">
                        {reservation.reservationCode}
                      </span>
                      <ReservationStatusBadge status={reservation.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {reservation.machines.map((machine) => machine.name).join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Giữ đến {formatDateTime(reservation.expiresAt)}
                    </p>
                    {reservation.status === "CONFIRMED" ? (
                      <div className="inline-flex w-fit items-center gap-2 rounded-md border border-primary/35 bg-primary/10 px-2 py-1 text-xs text-emerald-200">
                        <Clock3 className="size-3.5" />
                        Còn {formatCountdown(remainingSeconds(reservation.expiresAt, now))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
