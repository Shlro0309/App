import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Cpu,
  LogOut,
  MapPinned,
  Monitor,
  RefreshCw,
  Search,
  ShieldAlert,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import bookingGamingBackground from "@/assets/booking-gaming-bg.png";
import type { ApiError } from "@/types/api";
import { useRealtimeEvents } from "@/features/realtime/useRealtimeEvents";
import type {
  Reservation,
  ReservationMachine,
  ReservationMachineStatus,
} from "@/features/reservations/types";
import { useAuthStore } from "@/stores/authStore";
import {
  cancelCustomerReservation,
  createCustomerReservation,
  getCustomerReservationMachines,
  getCustomerReservations,
} from "./customerApi";

const CUSTOMER_CANCEL_WINDOW_MS = 5 * 60 * 1000;

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
  date.setMinutes(date.getMinutes() + 30);
  date.setSeconds(0, 0);
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

function canCancelCustomerReservation(reservation: Reservation, now: Date) {
  return (
    reservation.status === "CONFIRMED" &&
    now.getTime() <=
      new Date(reservation.reservedAt).getTime() + CUSTOMER_CANCEL_WINDOW_MS
  );
}

function formatConfig(machine: ReservationMachine) {
  return [
    machine.cpu ?? "CPU N/A",
    machine.gpu ?? "GPU N/A",
    machine.ram == null ? "RAM N/A" : `${machine.ram}GB RAM`,
    machine.fps == null ? "FPS N/A" : `${machine.fps} FPS`,
    machine.resolution ?? "N/A",
  ].join(" | ");
}

const statusLabels: Record<ReservationMachineStatus, string> = {
  AVAILABLE: "Sẵn sàng",
  RESERVED: "Đã đặt",
  PLAYING: "Đang chơi",
  MAINTENANCE: "Bảo trì",
};

const reservationStatusLabels: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  CANCELLED: "Đã hủy",
  EXPIRED: "Đã hết hạn",
  COMPLETED: "Hoàn tất",
};

const statusClassNames: Record<ReservationMachineStatus, string> = {
  AVAILABLE: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
  RESERVED: "border-sky-400/35 bg-sky-400/10 text-sky-200",
  PLAYING: "border-primary/35 bg-primary/10 text-primary",
  MAINTENANCE: "border-amber-400/35 bg-amber-400/10 text-amber-200",
};

const stationVisuals: Record<
  ReservationMachineStatus,
  { icon: LucideIcon; shell: string; tile: string }
> = {
  AVAILABLE: {
    icon: Monitor,
    shell: "border-slate-400/35 bg-slate-400/10 text-slate-200",
    tile: "station-available",
  },
  RESERVED: {
    icon: MapPinned,
    shell:
      "border-sky-300/45 bg-sky-300/10 text-sky-100 shadow-[0_0_18px_rgba(123,209,250,0.14)]",
    tile: "station-reserved",
  },
  PLAYING: {
    icon: Cpu,
    shell:
      "border-primary/50 bg-primary/10 text-primary shadow-[0_0_18px_rgba(78,222,163,0.18)]",
    tile: "station-playing",
  },
  MAINTENANCE: {
    icon: ShieldAlert,
    shell:
      "border-amber-300/50 bg-amber-300/10 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.16)]",
    tile: "station-maintenance",
  },
};

function MachineStatusBadge({ status }: { status: ReservationMachineStatus }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-md border px-2 text-xs font-medium ${statusClassNames[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

function ReservationStatusBadge({ status }: { status: string }) {
  const className =
    status === "CONFIRMED"
      ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-200"
      : status === "PENDING"
        ? "border-amber-400/35 bg-amber-400/10 text-amber-200"
        : "border-muted bg-muted/20 text-muted-foreground";

  return (
    <span
      className={`inline-flex h-7 items-center rounded-md border px-2 text-xs font-medium ${className}`}
    >
      {reservationStatusLabels[status] ?? status}
    </span>
  );
}

type ReservationMachineCardProps = {
  machine: ReservationMachine;
  selected: boolean;
  onSelect: (machine: ReservationMachine) => void;
};

function ReservationMachineCard({
  machine,
  selected,
  onSelect,
}: ReservationMachineCardProps) {
  const visual = stationVisuals[machine.status];
  const Icon = visual.icon;
  const reservable = machine.status === "AVAILABLE";

  return (
    <button
      aria-disabled={!reservable}
      className={[
        "station-tile relative grid min-h-[170px] gap-3 rounded-md p-3 text-left",
        visual.tile,
        selected ? "border-primary ring-2 ring-primary/70" : "",
        reservable ? "cursor-pointer" : "cursor-not-allowed opacity-80",
      ].join(" ")}
      type="button"
      onClick={() => {
        if (reservable) {
          onSelect(machine);
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="label-caps text-muted-foreground">Mã máy #{machine.id}</p>
          <h3 className="mt-1 truncate text-lg font-semibold">{machine.name}</h3>
        </div>
        <div
          className={`grid size-10 shrink-0 place-items-center rounded-md border ${visual.shell}`}
        >
          <Icon className="size-5" />
        </div>
      </div>

      <div className="grid gap-2 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Giá giờ</span>
          <span className="metric-number whitespace-nowrap font-semibold">
            {formatCurrency(machine.hourlyPrice)}
          </span>
        </div>
        <MachineStatusBadge status={machine.status} />
      </div>

      <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
        {machine.areaName} | {formatConfig(machine)}
      </p>
    </button>
  );
}

export function CustomerPrebookPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const refreshCurrentUser = useAuthStore((state) => state.refreshCurrentUser);
  const [keyword, setKeyword] = useState("");
  const [machines, setMachines] = useState<ReservationMachine[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedMachineIds, setSelectedMachineIds] = useState<number[]>([]);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const customerId = user?.customerId;

  const loadData = useCallback(
    async (nextKeyword: string, showLoading = true) => {
      if (!customerId) {
        setLoading(false);
        return;
      }

      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      try {
        const [machineData, reservationData] = await Promise.all([
          getCustomerReservationMachines(nextKeyword),
          getCustomerReservations(customerId),
        ]);
        setMachines(machineData);
        setReservations(reservationData);
        setSelectedMachineIds((current) =>
          current.filter((id) =>
            machineData.some(
              (machine) => machine.id === id && machine.status === "AVAILABLE"
            )
          )
        );
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [customerId]
  );

  useEffect(() => {
    void loadData("");
  }, [loadData]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadData(keyword, false);
    }, 30000);

    return () => window.clearInterval(interval);
  }, [keyword, loadData]);

  useRealtimeEvents(["RESERVATION_CHANGED", "MACHINE_STATUS_CHANGED"], () => {
    void loadData(keyword, false);
  });

  const selectedMachines = useMemo(
    () => machines.filter((machine) => selectedMachineIds.includes(machine.id)),
    [machines, selectedMachineIds]
  );

  const machineGroups = useMemo(() => {
    const groups = new Map<
      string,
      { areaName: string; machines: ReservationMachine[] }
    >();

    machines.forEach((machine) => {
      const key = String(machine.areaId ?? "unknown");
      const current = groups.get(key) ?? {
        areaName: machine.areaName ?? "Chưa phân khu",
        machines: [],
      };
      current.machines.push(machine);
      groups.set(key, current);
    });

    return Array.from(groups.values());
  }, [machines]);

  const availableCount = machines.filter(
    (machine) => machine.status === "AVAILABLE"
  ).length;
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
        expiresAt: defaultExpiresAt(),
        deposit: String(estimatedHourlyTotal),
        machineIds: selectedMachineIds,
      });
      await refreshCurrentUser();
      setSuccess(
        "Đã đặt máy trước thành công. Dùng mã đặt trước trong lịch đặt để check-in tại máy."
      );
      setSelectedMachineIds([]);
      await loadData(keyword);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function cancelReservationItem(reservation: Reservation) {
    setCancellingId(reservation.id);
    setError(null);
    setSuccess(null);
    try {
      await cancelCustomerReservation(reservation.id);
      await refreshCurrentUser();
      setSuccess(
        `Đã hủy đặt máy ${reservation.reservationCode}. Tiền cọc đã hoàn lại vào số dư.`
      );
      await loadData(keyword);
    } catch (cancelError) {
      setError(getErrorMessage(cancelError));
    } finally {
      setCancellingId(null);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/booking/login", { replace: true });
  }

  return (
    <main
      className="booking-shell min-h-screen bg-cover bg-center bg-fixed text-foreground"
      style={{ backgroundImage: `url(${bookingGamingBackground})` }}
    >
      <div className="min-h-screen bg-[#020713]/80 backdrop-blur-[2px]">
        <header className="border-b border-sky-200/10 bg-[#050b19]/70 px-4 py-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-md border border-primary/40 bg-primary/15 text-primary shadow-[0_0_26px_rgba(78,222,163,0.2)]">
                <Monitor className="size-5" />
              </div>
              <div>
                <p className="label-caps text-primary">Cyber Game Booking</p>
                <h1 className="text-3xl font-bold tracking-normal">
                  Đặt máy trước
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
                Số dư {formatCurrency(user?.balance ?? 0)}
              </span>
              <span className="rounded-md border border-sky-200/15 bg-white/[0.03] px-3 py-2 text-sm text-muted-foreground">
                {user?.fullName ?? user?.username}
              </span>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md border border-sky-200/15 bg-white/[0.03] px-4 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
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
          <div className="grid gap-3 md:grid-cols-4">
            <div className="glacier-card rounded-md p-4">
              <p className="label-caps text-muted-foreground">Tổng máy</p>
              <p className="metric-number mt-2 text-3xl font-semibold">
                {machines.length}
              </p>
            </div>
            <div className="glacier-card rounded-md p-4">
              <p className="label-caps text-muted-foreground">Sẵn sàng</p>
              <p className="metric-number mt-2 text-3xl font-semibold text-emerald-200">
                {availableCount}
              </p>
            </div>
            <div className="glacier-card rounded-md p-4">
              <p className="label-caps text-muted-foreground">Đã chọn</p>
              <p className="metric-number mt-2 text-3xl font-semibold">
                {selectedMachineIds.length}
              </p>
            </div>
            <div className="glacier-card rounded-md p-4">
              <p className="label-caps text-muted-foreground">Đặt cọc</p>
              <p className="metric-number mt-2 text-2xl font-semibold text-primary">
                {formatCurrency(estimatedHourlyTotal)}
              </p>
            </div>
          </div>

          <form
            className="glass-panel grid gap-3 rounded-md p-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]"
            onSubmit={submitReservation}
          >
            <label className="grid gap-2 text-sm lg:col-span-2">
              <span className="label-caps text-muted-foreground">Máy đã chọn</span>
              <div className="min-h-10 rounded-md border border-sky-200/15 bg-[#050b19]/80 px-3 py-2 text-sm">
                {selectedMachines.length > 0
                  ? selectedMachines.map((machine) => machine.name).join(", ")
                  : "Chưa chọn máy"}
              </div>
            </label>
            <div className="grid gap-2 text-sm">
              <span className="label-caps text-muted-foreground">Giữ chỗ</span>
              <div className="grid h-10 content-center rounded-md border border-sky-200/15 bg-[#050b19]/80 px-3">
                30 phút sau xác nhận
              </div>
            </div>
            <div className="grid gap-2 text-sm">
              <span className="label-caps text-muted-foreground">Cọc 1 giờ</span>
              <div className="grid h-10 content-center rounded-md border border-sky-200/15 bg-[#050b19]/80 px-3">
                {formatCurrency(estimatedHourlyTotal)}
              </div>
            </div>
            <div className="flex items-end">
              <button
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                disabled={
                  saving || selectedMachineIds.length === 0 || !hasEnoughBalance
                }
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
                className="glass-panel grid gap-3 rounded-md p-4 md:grid-cols-[minmax(0,1fr)_auto]"
                onSubmit={applySearch}
              >
                <label className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="h-10 w-full rounded-md border border-sky-200/15 bg-[#050b19]/80 pl-10 pr-3 text-sm outline-none transition focus:border-primary"
                    placeholder="Tìm tên máy, CPU, GPU hoặc khu vực"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                  />
                </label>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-sky-200/15 bg-white/[0.03] px-4 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  type="submit"
                >
                  <RefreshCw
                    className={`size-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Tải sơ đồ
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

              <div className="glass-panel overflow-hidden rounded-md">
                <div className="border-b border-sky-200/10 bg-muted/10 px-4 py-3">
                  <p className="label-caps text-primary">Sơ đồ máy</p>
                  <h2 className="mt-1 text-xl font-semibold">
                    Chọn máy sẵn sàng để đặt trước
                  </h2>
                </div>
                <div className="floor-map min-h-[520px] p-4">
                  {loading ? (
                    <div className="grid gap-4">
                      {Array.from({ length: 2 }).map((_, groupIndex) => (
                        <section className="grid gap-3" key={groupIndex}>
                          <div className="flex items-center justify-between border-b border-sky-200/10 pb-2">
                            <div className="grid gap-2">
                              <div className="skeleton-line h-5 w-32" />
                              <div className="skeleton-line h-4 w-44" />
                            </div>
                            <div className="skeleton-line h-8 w-28" />
                          </div>
                          <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3 rounded-lg border border-sky-200/10 bg-[#060e20]/45 p-3">
                            {Array.from({ length: 8 }).map((__, index) => (
                              <div
                                className="station-tile grid min-h-[170px] gap-3 rounded-md p-3"
                                key={index}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="grid gap-2">
                                    <div className="skeleton-line h-3 w-12" />
                                    <div className="skeleton-line h-5 w-20" />
                                  </div>
                                  <div className="skeleton-line size-10" />
                                </div>
                                <div className="skeleton-line h-4 w-full" />
                                <div className="skeleton-line h-8 w-full" />
                              </div>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  ) : null}

                  {!loading && machines.length === 0 ? (
                    <div className="grid min-h-[360px] place-items-center rounded-md border border-dashed text-muted-foreground">
                      Không có máy phù hợp bộ lọc.
                    </div>
                  ) : null}

                  {!loading && machines.length > 0 ? (
                    <div className="grid gap-6">
                      {machineGroups.map((group) => (
                        <section className="grid gap-3" key={group.areaName}>
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-200/10 pb-2">
                            <div>
                              <h3 className="text-lg font-semibold">
                                {group.areaName}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {group.machines.length} máy đang hiển thị
                              </p>
                            </div>
                            <span className="rounded-md border border-sky-200/15 bg-white/[0.03] px-3 py-1 text-sm text-muted-foreground">
                              {
                                group.machines.filter(
                                  (machine) => machine.status === "AVAILABLE"
                                ).length
                              }{" "}
                              máy sẵn sàng
                            </span>
                          </div>
                          <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3 rounded-lg border border-sky-200/10 bg-[#060e20]/45 p-3">
                            {group.machines.map((machine) => (
                              <ReservationMachineCard
                                key={machine.id}
                                machine={machine}
                                selected={selectedMachineIds.includes(machine.id)}
                                onSelect={toggleMachine}
                              />
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <aside className="grid gap-5 self-start">
              <div className="glacier-card rounded-md p-4">
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
                    <span className="text-muted-foreground">
                      Tiền giờ dự kiến
                    </span>
                    <span className="font-medium">
                      {formatCurrency(estimatedHourlyTotal)} / giờ
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Đặt cọc</span>
                    <span className="font-medium">
                      {formatCurrency(estimatedHourlyTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="glacier-card overflow-hidden rounded-md">
                <div className="flex items-center gap-2 border-b border-sky-200/10 p-4">
                  <CalendarClock className="size-5 text-primary" />
                  <h2 className="font-semibold">Lịch đặt của tôi</h2>
                </div>
                <div className="divide-y divide-sky-200/10">
                  {reservations.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">
                      Chưa có lịch đặt máy.
                    </p>
                  ) : null}
                  {reservations.map((reservation) => {
                    const canCancel = canCancelCustomerReservation(
                      reservation,
                      now
                    );

                    return (
                      <div className="grid gap-2 p-4" key={reservation.id}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-mono text-sm font-semibold">
                            {reservation.reservationCode}
                          </span>
                          <ReservationStatusBadge status={reservation.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {reservation.machines
                            .map((machine) => machine.name)
                            .join(", ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Giữ đến {formatDateTime(reservation.expiresAt)}
                        </p>
                        {reservation.status === "CONFIRMED" ? (
                          <div className="inline-flex w-fit items-center gap-2 rounded-md border border-primary/35 bg-primary/10 px-2 py-1 text-xs text-emerald-200">
                            <Clock3 className="size-3.5" />
                            Còn{" "}
                            {formatCountdown(
                              remainingSeconds(reservation.expiresAt, now)
                            )}
                          </div>
                        ) : null}
                        {canCancel ? (
                          <button
                            className="inline-flex h-9 w-fit items-center gap-2 rounded-md border border-red-400/40 px-3 text-xs text-red-200 transition hover:bg-red-400/10 disabled:opacity-60"
                            disabled={cancellingId === reservation.id}
                            type="button"
                            onClick={() => void cancelReservationItem(reservation)}
                          >
                            <XCircle className="size-3.5" />
                            {cancellingId === reservation.id
                              ? "Đang hủy"
                              : "Hủy đặt"}
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
