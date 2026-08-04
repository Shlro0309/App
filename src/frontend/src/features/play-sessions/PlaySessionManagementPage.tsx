import { FormEvent, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  CreditCard,
  Play,
  RefreshCw,
  Search,
  ShieldAlert,
  Timer,
  X,
} from "lucide-react";
import type { ApiError } from "@/types/api";
import { FormModal } from "@/components/FormModal";
import { CountUpValue } from "@/components/ui/CountUpValue";
import { useRealtimeEvents } from "@/features/realtime/useRealtimeEvents";
import {
  cancelPlaySession,
  endPlaySession,
  getPlaySessions,
  getPlaySessionStatuses,
  startPlaySession,
  startPlaySessionFromReservation,
} from "./playSessionApi";
import type {
  DirectStartValues,
  PageResponse,
  PlaySession,
  PlaySessionFilters,
  PlaySessionStatus,
  ReservationStartValues,
} from "./types";

const defaultFilters: PlaySessionFilters = {
  keyword: "",
  customerId: "",
  machineId: "",
  status: "",
  page: 0,
  size: 10,
};

const emptyDirectForm: DirectStartValues = {
  customerId: "",
  machineId: "",
};

const emptyReservationForm: ReservationStartValues = {
  reservationId: "",
  machineIds: "",
};

const statusLabels: Record<PlaySessionStatus, string> = {
  ACTIVE: "Đang chơi",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

const statusClassNames: Record<PlaySessionStatus, string> = {
  ACTIVE: "border-sky-400/35 bg-sky-400/10 text-sky-200",
  COMPLETED: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
  CANCELLED: "border-red-400/35 bg-red-400/10 text-red-200",
};

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) {
      return data.message;
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      return "Phiên đăng nhập không có quyền truy cập module phiên chơi.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể xử lý yêu cầu hiện tại.";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) {
    return `${remainingMinutes} phút`;
  }
  return `${hours} giờ ${remainingMinutes} phút`;
}

function hasMachineIds(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .every((item) => Number.isInteger(Number(item)) && Number(item) > 0);
}

function StatusBadge({ status }: { status: PlaySessionStatus }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-md border px-2 text-xs font-medium ${statusClassNames[status]}`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

type StartFormProps = {
  directValues: DirectStartValues;
  reservationValues: ReservationStartValues;
  mode: "direct" | "reservation";
  saving: boolean;
  onCancel: () => void;
  onDirectChange: (values: DirectStartValues) => void;
  onModeChange: (mode: "direct" | "reservation") => void;
  onReservationChange: (values: ReservationStartValues) => void;
  onSubmit: () => void;
};

function StartForm({
  directValues,
  reservationValues,
  mode,
  saving,
  onCancel,
  onDirectChange,
  onModeChange,
  onReservationChange,
  onSubmit,
}: StartFormProps) {
  const canSubmit =
    mode === "direct"
      ? directValues.machineId.trim().length > 0
      : reservationValues.reservationId.trim().length > 0 &&
        reservationValues.machineIds.trim().length > 0 &&
        hasMachineIds(reservationValues.machineIds);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="grid gap-4 border-b border-sky-200/10 bg-muted/20 p-4" onSubmit={handleSubmit}>
      <div className="glass-panel flex w-fit rounded-md p-1">
        <button
          className={[
            "inline-flex h-9 items-center gap-2 rounded px-3 text-sm transition",
            mode === "direct"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
          type="button"
          onClick={() => onModeChange("direct")}
        >
          <Play className="size-4" />
          Trực tiếp
        </button>
        <button
          className={[
            "inline-flex h-9 items-center gap-2 rounded px-3 text-sm transition",
            mode === "reservation"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
          type="button"
          onClick={() => onModeChange("reservation")}
        >
          <Clock3 className="size-4" />
          Từ đặt máy
        </button>
      </div>

      {mode === "direct" ? (
        <div className="grid gap-4 lg:grid-cols-[180px_180px_auto]">
          <label className="grid gap-2 text-sm">
            <span className="text-muted-foreground">Mã khách hàng</span>
            <input
              className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
              min={1}
              placeholder="Bỏ trống nếu là khách hiện tại"
              type="number"
              value={directValues.customerId}
              onChange={(event) =>
                onDirectChange({
                  ...directValues,
                  customerId: event.target.value,
                })
              }
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-muted-foreground">Mã máy</span>
            <input
              className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
              min={1}
              required
              type="number"
              value={directValues.machineId}
              onChange={(event) =>
                onDirectChange({
                  ...directValues,
                  machineId: event.target.value,
                })
              }
            />
          </label>
          <FormActions
            canSubmit={canSubmit}
            saving={saving}
            submitLabel="Bắt đầu phiên"
            onCancel={onCancel}
          />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[180px_1fr_auto]">
          <label className="grid gap-2 text-sm">
            <span className="text-muted-foreground">Mã đặt máy</span>
            <input
              className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
              min={1}
              required
              type="number"
              value={reservationValues.reservationId}
              onChange={(event) =>
                onReservationChange({
                  ...reservationValues,
                  reservationId: event.target.value,
                })
              }
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-muted-foreground">Mã máy check-in</span>
            <input
              className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
              placeholder="Ví dụ: 1,2,3"
              required
              value={reservationValues.machineIds}
              onChange={(event) =>
                onReservationChange({
                  ...reservationValues,
                  machineIds: event.target.value,
                })
              }
            />
          </label>
          <FormActions
            canSubmit={canSubmit}
            saving={saving}
            submitLabel="Check-in"
            onCancel={onCancel}
          />
        </div>
      )}
    </form>
  );
}

type FormActionsProps = {
  canSubmit: boolean;
  saving: boolean;
  submitLabel: string;
  onCancel: () => void;
};

function FormActions({
  canSubmit,
  saving,
  submitLabel,
  onCancel,
}: FormActionsProps) {
  return (
    <div className="flex items-end gap-2">
      <button
        className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        disabled={saving || !canSubmit}
        type="submit"
      >
        <CheckCircle2 className="size-4" />
        {saving ? "Đang lưu" : submitLabel}
      </button>
      <button
        className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
        type="button"
        onClick={onCancel}
      >
        <X className="size-4" />
        Hủy
      </button>
    </div>
  );
}

export function PlaySessionManagementPage() {
  const [statuses, setStatuses] = useState<PlaySessionStatus[]>([
    "ACTIVE",
    "COMPLETED",
    "CANCELLED",
  ]);
  const [filters, setFilters] = useState<PlaySessionFilters>(defaultFilters);
  const [page, setPage] = useState<PageResponse<PlaySession> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<"direct" | "reservation">("direct");
  const [directValues, setDirectValues] =
    useState<DirectStartValues>(emptyDirectForm);
  const [reservationValues, setReservationValues] =
    useState<ReservationStartValues>(emptyReservationForm);

  const playSessions = useMemo(() => page?.content ?? [], [page]);
  const statusSummary = useMemo(() => {
    const counts = new Map<PlaySessionStatus, number>();
    playSessions.forEach((playSession) => {
      counts.set(
        playSession.status,
        (counts.get(playSession.status) ?? 0) + 1
      );
    });
    return statuses.map((status) => ({
      status,
      count: counts.get(status) ?? 0,
    }));
  }, [playSessions, statuses]);

  async function loadPlaySessions(nextFilters = filters) {
    setLoading(true);
    setError(null);
    try {
      const data = await getPlaySessions(nextFilters);
      setPage(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setError(null);
      try {
        const [statusData, playSessionData] = await Promise.all([
          getPlaySessionStatuses(),
          getPlaySessions(defaultFilters),
        ]);
        setStatuses(statusData);
        setPage(playSessionData);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    }

    void loadInitialData();
  }, []);

  useRealtimeEvents(["PLAY_SESSION_CHANGED", "MACHINE_STATUS_CHANGED"], () => {
    void loadPlaySessions(filters);
  });

  function updateFilters(nextFilters: Partial<PlaySessionFilters>) {
    setFilters((current) => ({
      ...current,
      ...nextFilters,
      page: nextFilters.page ?? 0,
    }));
  }

  async function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFilters = { ...filters, page: 0 };
    setFilters(nextFilters);
    await loadPlaySessions(nextFilters);
  }

  function openStartForm() {
    setDirectValues(emptyDirectForm);
    setReservationValues(emptyReservationForm);
    setFormMode("direct");
    setFormVisible(true);
  }

  function closeForm() {
    setDirectValues(emptyDirectForm);
    setReservationValues(emptyReservationForm);
    setFormVisible(false);
  }

  async function submitForm() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (formMode === "direct") {
        await startPlaySession(directValues);
        setSuccess("Đã bắt đầu phiên chơi.");
      } else {
        const sessions = await startPlaySessionFromReservation(
          reservationValues
        );
        setSuccess(`Đã check-in ${sessions.length} phiên chơi từ đặt máy.`);
      }
      closeForm();
      await loadPlaySessions(filters);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function endCurrentSession(playSession: PlaySession) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await endPlaySession(playSession.id);
      setSuccess(`Đã kết thúc phiên #${playSession.id}.`);
      await loadPlaySessions(filters);
    } catch (endError) {
      setError(getErrorMessage(endError));
    } finally {
      setSaving(false);
    }
  }

  async function cancelCurrentSession(playSession: PlaySession) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await cancelPlaySession(playSession.id);
      setSuccess(`Đã hủy phiên #${playSession.id}.`);
      await loadPlaySessions(filters);
    } catch (cancelError) {
      setError(getErrorMessage(cancelError));
    } finally {
      setSaving(false);
    }
  }

  async function goToPage(pageNumber: number) {
    const nextFilters = { ...filters, page: pageNumber };
    setFilters(nextFilters);
    await loadPlaySessions(nextFilters);
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Quản lý phiên chơi</p>
          <h2 className="mt-1 text-2xl font-semibold">Phiên chơi</h2>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            type="button"
            onClick={() => loadPlaySessions(filters)}
          >
            <RefreshCw className="size-4" />
            Tải lại
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            type="button"
            onClick={openStartForm}
          >
            <Play className="size-4" />
            Bắt đầu phiên
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="glacier-card rounded-md p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="label-caps text-muted-foreground">Tổng phiên</span>
            <Timer className="size-4 text-primary" />
          </div>
          <p className="metric-number text-2xl font-semibold">
            <CountUpValue value={page?.totalElements ?? 0} format={(value) => String(Math.round(value))} />
          </p>
        </div>
        {statusSummary.map((item) => (
          <div className="glacier-card rounded-md p-4" key={item.status}>
            <div className="mb-2 flex items-center justify-between">
              <span className="label-caps text-muted-foreground">
                {statusLabels[item.status]}
              </span>
              <Clock3 className="size-4 text-primary" />
            </div>
            <p className="metric-number text-2xl font-semibold">
              <CountUpValue value={item.count} format={(value) => String(Math.round(value))} />
            </p>
          </div>
        ))}
      </div>

      <div className="glass-panel overflow-hidden rounded-md">
        <form
          className="grid gap-3 border-b border-sky-200/10 bg-muted/20 p-4 lg:grid-cols-[1fr_150px_150px_170px_auto]"
          onSubmit={applyFilters}
        >
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-md border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary"
              placeholder="Tìm khách hàng, số điện thoại, máy, khu vực"
              value={filters.keyword}
              onChange={(event) =>
                updateFilters({ keyword: event.target.value })
              }
            />
          </label>

          <input
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary"
            min={1}
            placeholder="Khách ID"
            type="number"
            value={filters.customerId}
            onChange={(event) =>
              updateFilters({ customerId: event.target.value })
            }
          />

          <input
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary"
            min={1}
            placeholder="Máy ID"
            type="number"
            value={filters.machineId}
            onChange={(event) =>
              updateFilters({ machineId: event.target.value })
            }
          />

          <select
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary"
            value={filters.status}
            onChange={(event) => updateFilters({ status: event.target.value })}
          >
            <option value="">Tất cả trạng thái</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status] ?? status}
              </option>
            ))}
          </select>

          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            type="submit"
          >
            <Search className="size-4" />
            Lọc
          </button>
        </form>

        {formVisible && (
          <FormModal title="Mở phiên chơi" onClose={closeForm}>
            <StartForm
              directValues={directValues}
              mode={formMode}
              reservationValues={reservationValues}
              saving={saving}
              onCancel={closeForm}
              onDirectChange={setDirectValues}
              onModeChange={setFormMode}
              onReservationChange={setReservationValues}
              onSubmit={submitForm}
            />
          </FormModal>
        )}

        {error && (
          <div className="flex items-center gap-2 border-b border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">
            <ShieldAlert className="size-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 border-b border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="size-4" />
            <span>{success}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-sm">
            <thead className="bg-white/[0.04] text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Mã</th>
                <th className="px-4 py-3 font-medium">Khách hàng</th>
                <th className="px-4 py-3 font-medium">Máy</th>
                <th className="px-4 py-3 font-medium">Thời gian</th>
                <th className="px-4 py-3 font-medium">Tiền giờ</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-muted-foreground"
                    colSpan={7}
                  >
                    Đang tải dữ liệu phiên chơi
                  </td>
                </tr>
              )}

              {!loading && playSessions.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-muted-foreground"
                    colSpan={7}
                  >
                    Không có phiên chơi phù hợp bộ lọc
                  </td>
                </tr>
              )}

              {!loading &&
                playSessions.map((playSession) => (
                  <tr className="border-t border-white/10 transition hover:bg-white/[0.03]" key={playSession.id}>
                    <td className="px-4 py-4 font-medium">
                      #{playSession.id}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium">
                        {playSession.customerName}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        KH #{playSession.customerId}
                        {playSession.phoneNumber
                          ? ` - ${playSession.phoneNumber}`
                          : ""}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium">
                        {playSession.machineName}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Máy #{playSession.machineId} - {playSession.areaName} -{" "}
                        {formatCurrency(playSession.hourlyPrice)}/giờ
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>{formatDateTime(playSession.startedAt)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Kết thúc {formatDateTime(playSession.endedAt)} -{" "}
                        {formatDuration(playSession.durationMinutes)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="inline-flex items-center gap-2">
                        <CreditCard className="size-4 text-primary" />
                        {formatCurrency(playSession.totalHourlyAmount)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={playSession.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                          disabled={saving || playSession.status !== "ACTIVE"}
                          title="Kết thúc phiên"
                          type="button"
                          onClick={() => endCurrentSession(playSession)}
                        >
                          <CheckCircle2 className="size-4" />
                        </button>
                        <button
                          className="inline-flex size-9 items-center justify-center rounded-md border border-destructive/40 text-red-200 transition hover:bg-destructive/10 disabled:opacity-50"
                          disabled={saving || playSession.status !== "ACTIVE"}
                          title="Hủy phiên"
                          type="button"
                          onClick={() => cancelCurrentSession(playSession)}
                        >
                          <CircleAlert className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Trang {(page?.number ?? 0) + 1} / {Math.max(page?.totalPages ?? 1, 1)}
          </span>
          <div className="flex gap-2">
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md border px-3 transition hover:bg-muted disabled:opacity-50"
              disabled={loading || !page || page.first}
              type="button"
              onClick={() => goToPage(Math.max((page?.number ?? 0) - 1, 0))}
            >
              <ChevronLeft className="size-4" />
              Trước
            </button>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md border px-3 transition hover:bg-muted disabled:opacity-50"
              disabled={loading || !page || page.last}
              type="button"
              onClick={() => goToPage((page?.number ?? 0) + 1)}
            >
              Sau
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
