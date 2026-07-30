import { FormEvent, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  CreditCard,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import type { ApiError } from "@/types/api";
import { FormModal } from "@/components/FormModal";
import { useRealtimeEvents } from "@/features/realtime/useRealtimeEvents";
import {
  cancelReservation,
  createReservation,
  getAvailableReservationMachines,
  getReservations,
  getReservationStatuses,
  updateReservationStatus,
} from "./reservationApi";
import type {
  AvailableMachineFilters,
  PageResponse,
  Reservation,
  ReservationFilters,
  ReservationFormValues,
  ReservationMachine,
  ReservationStatus,
} from "./types";

const defaultFilters: ReservationFilters = {
  keyword: "",
  customerId: "",
  status: "",
  page: 0,
  size: 10,
};

const defaultMachineFilters: AvailableMachineFilters = {
  keyword: "",
  areaId: "",
  page: 0,
  size: 20,
};

const emptyForm: ReservationFormValues = {
  customerId: "",
  expiresAt: "",
  deposit: "0",
  machineIds: [],
};

const statusLabels: Record<ReservationStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  CANCELLED: "Đã hủy",
  EXPIRED: "Đã hết hạn",
  COMPLETED: "Hoàn tất",
};

const statusClassNames: Record<ReservationStatus, string> = {
  PENDING: "border-amber-400/35 bg-amber-400/10 text-amber-200",
  CONFIRMED: "border-sky-400/35 bg-sky-400/10 text-sky-200",
  CANCELLED: "border-red-400/35 bg-red-400/10 text-red-200",
  EXPIRED: "border-slate-500/50 bg-slate-500/10 text-slate-300",
  COMPLETED: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
};

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) {
      return data.message;
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      return "Phiên đăng nhập không có quyền truy cập module đặt máy.";
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

function formatDateTime(value: string) {
  if (!value) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function defaultExpirationValue() {
  const nextHour = new Date(Date.now() + 60 * 60 * 1000);
  nextHour.setSeconds(0, 0);
  const year = nextHour.getFullYear();
  const month = String(nextHour.getMonth() + 1).padStart(2, "0");
  const day = String(nextHour.getDate()).padStart(2, "0");
  const hour = String(nextHour.getHours()).padStart(2, "0");
  const minute = String(nextHour.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function StatusBadge({ status }: { status: ReservationStatus }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-md border px-2 text-xs font-medium ${statusClassNames[status]}`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

type ReservationFormProps = {
  machines: ReservationMachine[];
  values: ReservationFormValues;
  machineFilters: AvailableMachineFilters;
  machinePage: PageResponse<ReservationMachine> | null;
  loadingMachines: boolean;
  saving: boolean;
  onCancel: () => void;
  onChange: (values: ReservationFormValues) => void;
  onMachineFiltersChange: (filters: Partial<AvailableMachineFilters>) => void;
  onMachinePageChange: (page: number) => void;
  onMachineSearch: () => void;
  onSubmit: () => void;
};

function ReservationForm({
  machines,
  values,
  machineFilters,
  machinePage,
  loadingMachines,
  saving,
  onCancel,
  onChange,
  onMachineFiltersChange,
  onMachinePageChange,
  onMachineSearch,
  onSubmit,
}: ReservationFormProps) {
  const selectedMachines = new Set(values.machineIds);

  function updateField(field: keyof ReservationFormValues, value: string) {
    onChange({ ...values, [field]: value });
  }

  function toggleMachine(machineId: number) {
    const nextMachineIds = selectedMachines.has(machineId)
      ? values.machineIds.filter((id) => id !== machineId)
      : [...values.machineIds, machineId];
    onChange({ ...values, machineIds: nextMachineIds });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  function handleMachineSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onMachineSearch();
  }

  return (
    <div className="border-b bg-muted/20">
      <form className="grid gap-4 p-4 lg:grid-cols-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm">
          <span className="text-muted-foreground">Mã khách hàng</span>
          <input
            className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
            min={1}
            placeholder="Bỏ trống nếu là khách hiện tại"
            type="number"
            value={values.customerId}
            onChange={(event) => updateField("customerId", event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="text-muted-foreground">Giữ chỗ đến</span>
          <input
            className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
            required
            type="datetime-local"
            value={values.expiresAt}
            onChange={(event) => updateField("expiresAt", event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="text-muted-foreground">Tiền cọc</span>
          <input
            className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
            min={0}
            step="1000"
            type="number"
            value={values.deposit}
            onChange={(event) => updateField("deposit", event.target.value)}
          />
        </label>

        <div className="flex items-end gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            disabled={saving || values.machineIds.length === 0}
            type="submit"
          >
            <CheckCircle2 className="size-4" />
            {saving ? "Đang lưu" : "Tạo đặt máy"}
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
      </form>

      <form
        className="grid gap-3 border-t p-4 lg:grid-cols-[1fr_160px_auto]"
        onSubmit={handleMachineSearch}
      >
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-10 w-full rounded-md border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary"
            placeholder="Tìm máy còn trống"
            value={machineFilters.keyword}
            onChange={(event) =>
              onMachineFiltersChange({ keyword: event.target.value })
            }
          />
        </label>
        <input
          className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary"
          min={1}
          placeholder="Khu vực ID"
          type="number"
          value={machineFilters.areaId}
          onChange={(event) =>
            onMachineFiltersChange({ areaId: event.target.value })
          }
        />
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          type="submit"
        >
          <Search className="size-4" />
          Lọc máy
        </button>
      </form>

      <div className="grid gap-3 px-4 pb-4 md:grid-cols-2 xl:grid-cols-4">
        {loadingMachines && (
          <div className="rounded-md border p-4 text-sm text-muted-foreground md:col-span-2 xl:col-span-4">
            Đang tải máy còn trống
          </div>
        )}

        {!loadingMachines && machines.length === 0 && (
          <div className="rounded-md border p-4 text-sm text-muted-foreground md:col-span-2 xl:col-span-4">
            Không có máy trống phù hợp bộ lọc
          </div>
        )}

        {!loadingMachines &&
          machines.map((machine) => {
            const selected = selectedMachines.has(machine.id);
            return (
              <button
                className={[
                  "rounded-md border p-3 text-left text-sm transition",
                  selected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "bg-background text-muted-foreground hover:border-primary/60 hover:text-foreground",
                ].join(" ")}
                key={machine.id}
                type="button"
                onClick={() => toggleMachine(machine.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{machine.name}</span>
                  <span className="text-xs">#{machine.id}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                  <span>{machine.areaName}</span>
                  <span>{formatCurrency(machine.hourlyPrice)}</span>
                </div>
              </button>
            );
          })}
      </div>

      <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>Đã chọn {values.machineIds.length} máy</span>
        <div className="flex gap-2">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border px-3 transition hover:bg-muted disabled:opacity-50"
            disabled={loadingMachines || !machinePage || machinePage.first}
            type="button"
            onClick={() =>
              onMachinePageChange(Math.max((machinePage?.number ?? 0) - 1, 0))
            }
          >
            <ChevronLeft className="size-4" />
            Trước
          </button>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border px-3 transition hover:bg-muted disabled:opacity-50"
            disabled={loadingMachines || !machinePage || machinePage.last}
            type="button"
            onClick={() => onMachinePageChange((machinePage?.number ?? 0) + 1)}
          >
            Sau
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReservationManagementPage() {
  const [statuses, setStatuses] = useState<ReservationStatus[]>([
    "PENDING",
    "CONFIRMED",
    "CANCELLED",
    "EXPIRED",
    "COMPLETED",
  ]);
  const [filters, setFilters] = useState<ReservationFilters>(defaultFilters);
  const [machineFilters, setMachineFilters] =
    useState<AvailableMachineFilters>(defaultMachineFilters);
  const [page, setPage] = useState<PageResponse<Reservation> | null>(null);
  const [machinePage, setMachinePage] =
    useState<PageResponse<ReservationMachine> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMachines, setLoadingMachines] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [formValues, setFormValues] = useState<ReservationFormValues>(emptyForm);
  const [statusEditingReservation, setStatusEditingReservation] =
    useState<Reservation | null>(null);
  const [statusDraft, setStatusDraft] = useState<ReservationStatus>("PENDING");

  const reservations = useMemo(() => page?.content ?? [], [page]);
  const machines = useMemo(() => machinePage?.content ?? [], [machinePage]);
  const statusSummary = useMemo(() => {
    const counts = new Map<ReservationStatus, number>();
    reservations.forEach((reservation) => {
      counts.set(
        reservation.status,
        (counts.get(reservation.status) ?? 0) + 1
      );
    });
    return statuses.map((status) => ({
      status,
      count: counts.get(status) ?? 0,
    }));
  }, [reservations, statuses]);

  async function loadReservations(nextFilters = filters) {
    setLoading(true);
    setError(null);
    try {
      const data = await getReservations(nextFilters);
      setPage(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableMachines(nextFilters = machineFilters) {
    setLoadingMachines(true);
    setError(null);
    try {
      const data = await getAvailableReservationMachines(nextFilters);
      setMachinePage(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoadingMachines(false);
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setError(null);
      try {
        const [statusData, reservationData] = await Promise.all([
          getReservationStatuses(),
          getReservations(defaultFilters),
        ]);
        setStatuses(statusData);
        setPage(reservationData);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    }

    void loadInitialData();
  }, []);

  useRealtimeEvents(["RESERVATION_CHANGED", "MACHINE_STATUS_CHANGED"], () => {
    void loadReservations(filters);
    void loadAvailableMachines(machineFilters);
  });

  function updateFilters(nextFilters: Partial<ReservationFilters>) {
    setFilters((current) => ({
      ...current,
      ...nextFilters,
      page: nextFilters.page ?? 0,
    }));
  }

  function updateMachineFilters(nextFilters: Partial<AvailableMachineFilters>) {
    setMachineFilters((current) => ({
      ...current,
      ...nextFilters,
      page: nextFilters.page ?? 0,
    }));
  }

  async function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFilters = { ...filters, page: 0 };
    setFilters(nextFilters);
    await loadReservations(nextFilters);
  }

  async function openCreateForm() {
    const nextFilters = { ...defaultMachineFilters };
    setFormValues({ ...emptyForm, expiresAt: defaultExpirationValue() });
    setMachineFilters(nextFilters);
    setFormVisible(true);
    await loadAvailableMachines(nextFilters);
  }

  function closeForm() {
    setFormValues(emptyForm);
    setFormVisible(false);
  }

  function openStatusForm(reservation: Reservation) {
    setStatusEditingReservation(reservation);
    setStatusDraft(reservation.status);
    setError(null);
    setSuccess(null);
  }

  function closeStatusForm() {
    setStatusEditingReservation(null);
    setStatusDraft("PENDING");
  }

  async function submitForm() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await createReservation(formValues);
      setSuccess("Đã tạo đặt máy mới.");
      closeForm();
      await Promise.all([
        loadReservations(filters),
        loadAvailableMachines(machineFilters),
      ]);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(
    reservation: Reservation,
    status: ReservationStatus
  ) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateReservationStatus(reservation.id, status);
      closeStatusForm();
      setSuccess(`Đã cập nhật đặt máy #${reservation.id}.`);
      await Promise.all([
        loadReservations(filters),
        loadAvailableMachines(machineFilters),
      ]);
    } catch (statusError) {
      setError(getErrorMessage(statusError));
    } finally {
      setSaving(false);
    }
  }

  async function cancelCurrentReservation(reservation: Reservation) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await cancelReservation(reservation.id);
      setSuccess(`Đã hủy đặt máy #${reservation.id}.`);
      await Promise.all([
        loadReservations(filters),
        loadAvailableMachines(machineFilters),
      ]);
    } catch (cancelError) {
      setError(getErrorMessage(cancelError));
    } finally {
      setSaving(false);
    }
  }

  async function goToPage(pageNumber: number) {
    const nextFilters = { ...filters, page: pageNumber };
    setFilters(nextFilters);
    await loadReservations(nextFilters);
  }

  async function goToMachinePage(pageNumber: number) {
    const nextFilters = { ...machineFilters, page: pageNumber };
    setMachineFilters(nextFilters);
    await loadAvailableMachines(nextFilters);
  }

  async function applyMachineFilters() {
    const nextFilters = { ...machineFilters, page: 0 };
    setMachineFilters(nextFilters);
    await loadAvailableMachines(nextFilters);
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Quản lý đặt máy</p>
          <h2 className="mt-1 text-2xl font-semibold">Đặt máy</h2>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            type="button"
            onClick={() => loadReservations(filters)}
          >
            <RefreshCw className="size-4" />
            Tải lại
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            type="button"
            onClick={openCreateForm}
          >
            <CalendarClock className="size-4" />
            Tạo đặt máy
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-6">
        <div className="rounded-md border bg-background p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tổng đặt máy</span>
            <CalendarClock className="size-4 text-primary" />
          </div>
          <p className="text-2xl font-semibold">{page?.totalElements ?? 0}</p>
        </div>
        {statusSummary.map((item) => (
          <div className="rounded-md border bg-background p-4" key={item.status}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {statusLabels[item.status]}
              </span>
              <Clock3 className="size-4 text-primary" />
            </div>
            <p className="text-2xl font-semibold">{item.count}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-md border bg-background">
        <form
          className="grid gap-3 border-b bg-muted/20 p-4 lg:grid-cols-[1fr_160px_180px_auto]"
          onSubmit={applyFilters}
        >
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-md border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary"
              placeholder="Tìm khách hàng, số điện thoại, máy"
              value={filters.keyword}
              onChange={(event) =>
                updateFilters({ keyword: event.target.value })
              }
            />
          </label>

          <input
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary"
            min={1}
            placeholder="Khách hàng ID"
            type="number"
            value={filters.customerId}
            onChange={(event) =>
              updateFilters({ customerId: event.target.value })
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
          <FormModal title="Tạo đặt máy" onClose={closeForm}>
            <ReservationForm
              loadingMachines={loadingMachines}
              machineFilters={machineFilters}
              machinePage={machinePage}
              machines={machines}
              saving={saving}
              values={formValues}
              onCancel={closeForm}
              onChange={setFormValues}
              onMachineFiltersChange={updateMachineFilters}
              onMachinePageChange={goToMachinePage}
              onMachineSearch={applyMachineFilters}
              onSubmit={submitForm}
            />
          </FormModal>
        )}

        {statusEditingReservation && (
          <FormModal title="Cập nhật trạng thái đặt máy" onClose={closeStatusForm}>
            <form
              className="grid gap-4 bg-muted/20 p-4 sm:grid-cols-[minmax(0,1fr)_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                void changeStatus(statusEditingReservation, statusDraft);
              }}
            >
              <label className="grid gap-2 text-sm">
                <span className="text-muted-foreground">Trạng thái mới</span>
                <select
                  className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
                  value={statusDraft}
                  onChange={(event) =>
                    setStatusDraft(event.target.value as ReservationStatus)
                  }
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status] ?? status}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end gap-2">
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                  disabled={saving}
                  type="submit"
                >
                  <CheckCircle2 className="size-4" />
                  Lưu
                </button>
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  type="button"
                  onClick={closeStatusForm}
                >
                  <X className="size-4" />
                  Hủy
                </button>
              </div>
            </form>
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
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead className="bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Mã</th>
                <th className="px-4 py-3 font-medium">Khách hàng</th>
                <th className="px-4 py-3 font-medium">Máy đặt</th>
                <th className="px-4 py-3 font-medium">Thời gian</th>
                <th className="px-4 py-3 font-medium">Tiền cọc</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Cập nhật</th>
                <th className="px-4 py-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-muted-foreground"
                    colSpan={8}
                  >
                    Đang tải dữ liệu đặt máy
                  </td>
                </tr>
              )}

              {!loading && reservations.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-muted-foreground"
                    colSpan={8}
                  >
                    Không có đặt máy phù hợp bộ lọc
                  </td>
                </tr>
              )}

              {!loading &&
                reservations.map((reservation) => (
                  <tr className="border-t" key={reservation.id}>
                    <td className="px-4 py-4 font-medium">
                      #{reservation.id}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium">
                        {reservation.customerName}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        KH #{reservation.customerId}
                        {reservation.phoneNumber
                          ? ` - ${reservation.phoneNumber}`
                          : ""}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-[260px]">
                        {reservation.machines.map((machine) => (
                          <span
                            className="mb-1 mr-1 inline-flex rounded-md border px-2 py-1 text-xs text-muted-foreground"
                            key={machine.id}
                          >
                            {machine.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>{formatDateTime(reservation.reservedAt)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Giữ đến {formatDateTime(reservation.expiresAt)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="inline-flex items-center gap-2">
                        <CreditCard className="size-4 text-primary" />
                        {formatCurrency(reservation.deposit)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={reservation.status} />
                    </td>
                    <td className="px-4 py-4">
                      <button
                        className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-60"
                        disabled={saving}
                        type="button"
                        onClick={() => openStatusForm(reservation)}
                      >
                        <RefreshCw className="size-4" />
                        Cập nhật
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          className="inline-flex size-9 items-center justify-center rounded-md border border-destructive/40 text-red-200 transition hover:bg-destructive/10 disabled:opacity-50"
                          disabled={
                            saving ||
                            reservation.status === "CANCELLED" ||
                            reservation.status === "COMPLETED" ||
                            reservation.status === "EXPIRED"
                          }
                          title="Hủy đặt máy"
                          type="button"
                          onClick={() => cancelCurrentReservation(reservation)}
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
