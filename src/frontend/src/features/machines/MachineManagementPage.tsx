import { FormEvent, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Cpu,
  Edit3,
  Monitor,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import type { ApiError } from "@/types/api";
import {
  createMachine,
  getMachineAreas,
  getMachines,
  getMachineStatuses,
  setMachineOffline,
  updateMachine,
  updateMachineStatus,
} from "./machineApi";
import type {
  Area,
  Machine,
  MachineFilters,
  MachineFormValues,
  MachineStatus,
  PageResponse,
} from "./types";

const defaultFilters: MachineFilters = {
  keyword: "",
  areaId: "",
  status: "",
  page: 0,
  size: 10,
};

const emptyForm: MachineFormValues = {
  name: "",
  areaId: "",
  cpu: "",
  gpu: "",
  ram: "",
  fps: "",
  resolution: "",
  hourlyPrice: "0",
  status: "AVAILABLE",
};

const statusLabels: Record<MachineStatus, string> = {
  AVAILABLE: "San sang",
  RESERVED: "Da dat",
  PLAYING: "Dang choi",
  MAINTENANCE: "Bao tri",
  OFFLINE: "Ngoai tuyen",
};

const statusClassNames: Record<MachineStatus, string> = {
  AVAILABLE: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
  RESERVED: "border-sky-400/35 bg-sky-400/10 text-sky-200",
  PLAYING: "border-primary/35 bg-primary/10 text-primary",
  MAINTENANCE: "border-amber-400/35 bg-amber-400/10 text-amber-200",
  OFFLINE: "border-slate-500/50 bg-slate-500/10 text-slate-300",
};

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) {
      return data.message;
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      return "Phien dang nhap khong co quyen truy cap module may tram.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Khong the xu ly yeu cau hien tai.";
}

function toFormValues(machine: Machine): MachineFormValues {
  return {
    name: machine.name,
    areaId: String(machine.areaId),
    cpu: machine.cpu ?? "",
    gpu: machine.gpu ?? "",
    ram: machine.ram == null ? "" : String(machine.ram),
    fps: machine.fps == null ? "" : String(machine.fps),
    resolution: machine.resolution ?? "",
    hourlyPrice: String(machine.hourlyPrice),
    status: machine.status,
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function StatusBadge({ status }: { status: MachineStatus }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-md border px-2 text-xs font-medium ${statusClassNames[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

type MachineFormProps = {
  areas: Area[];
  statuses: MachineStatus[];
  values: MachineFormValues;
  mode: "create" | "edit";
  onCancel: () => void;
  onChange: (values: MachineFormValues) => void;
  onSubmit: () => void;
  saving: boolean;
};

function MachineForm({
  areas,
  statuses,
  values,
  mode,
  onCancel,
  onChange,
  onSubmit,
  saving,
}: MachineFormProps) {
  function updateField(field: keyof MachineFormValues, value: string) {
    onChange({ ...values, [field]: value });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      className="grid gap-4 border-b bg-muted/20 p-4 lg:grid-cols-4"
      onSubmit={handleSubmit}
    >
      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">Ten may</span>
        <input
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
          maxLength={20}
          required
          value={values.name}
          onChange={(event) => updateField("name", event.target.value)}
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">Khu vuc</span>
        <select
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
          required
          value={values.areaId}
          onChange={(event) => updateField("areaId", event.target.value)}
        >
          <option value="">Chon khu vuc</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">Gia theo gio</span>
        <input
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
          min={0}
          required
          step="1000"
          type="number"
          value={values.hourlyPrice}
          onChange={(event) => updateField("hourlyPrice", event.target.value)}
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">Trang thai</span>
        <select
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary disabled:opacity-60"
          disabled={mode === "edit"}
          value={values.status}
          onChange={(event) =>
            updateField("status", event.target.value as MachineStatus)
          }
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status] ?? status}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">CPU</span>
        <input
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
          maxLength={100}
          value={values.cpu}
          onChange={(event) => updateField("cpu", event.target.value)}
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">GPU</span>
        <input
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
          maxLength={100}
          value={values.gpu}
          onChange={(event) => updateField("gpu", event.target.value)}
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">RAM</span>
        <input
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
          min={0}
          type="number"
          value={values.ram}
          onChange={(event) => updateField("ram", event.target.value)}
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">FPS</span>
        <input
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
          min={0}
          type="number"
          value={values.fps}
          onChange={(event) => updateField("fps", event.target.value)}
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">Do phan giai</span>
        <input
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
          maxLength={20}
          value={values.resolution}
          onChange={(event) => updateField("resolution", event.target.value)}
        />
      </label>

      <div className="flex items-end gap-2 lg:col-span-3">
        <button
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          <CheckCircle2 className="size-4" />
          {saving ? "Dang luu" : mode === "create" ? "Them may" : "Luu may"}
        </button>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          type="button"
          onClick={onCancel}
        >
          <X className="size-4" />
          Huy
        </button>
      </div>
    </form>
  );
}

export function MachineManagementPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [statuses, setStatuses] = useState<MachineStatus[]>([
    "AVAILABLE",
    "RESERVED",
    "PLAYING",
    "MAINTENANCE",
    "OFFLINE",
  ]);
  const [filters, setFilters] = useState<MachineFilters>(defaultFilters);
  const [page, setPage] = useState<PageResponse<Machine> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"hidden" | "create" | "edit">(
    "hidden"
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<MachineFormValues>(emptyForm);

  const machines = useMemo(() => page?.content ?? [], [page]);
  const statusSummary = useMemo(() => {
    const counts = new Map<MachineStatus, number>();
    machines.forEach((machine) => {
      counts.set(machine.status, (counts.get(machine.status) ?? 0) + 1);
    });
    return statuses.map((status) => ({
      status,
      count: counts.get(status) ?? 0,
    }));
  }, [machines, statuses]);

  async function loadReferenceData() {
    const [areaData, statusData] = await Promise.all([
      getMachineAreas(),
      getMachineStatuses(),
    ]);
    setAreas(areaData);
    setStatuses(statusData);
  }

  async function loadMachines(nextFilters = filters) {
    setLoading(true);
    setError(null);
    try {
      const data = await getMachines(nextFilters);
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
        await loadReferenceData();
        const data = await getMachines(defaultFilters);
        setPage(data);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    }

    void loadInitialData();
  }, []);

  function updateFilters(nextFilters: Partial<MachineFilters>) {
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
    await loadMachines(nextFilters);
  }

  function openCreateForm() {
    setEditingId(null);
    setFormValues({
      ...emptyForm,
      areaId: areas[0] ? String(areas[0].id) : "",
    });
    setFormMode("create");
  }

  function openEditForm(machine: Machine) {
    setEditingId(machine.id);
    setFormValues(toFormValues(machine));
    setFormMode("edit");
  }

  function closeForm() {
    setEditingId(null);
    setFormValues(emptyForm);
    setFormMode("hidden");
  }

  async function submitForm() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (formMode === "create") {
        await createMachine(formValues);
        setSuccess("Da them may moi.");
      }
      if (formMode === "edit" && editingId != null) {
        await updateMachine(editingId, formValues);
        setSuccess("Da cap nhat may.");
      }
      closeForm();
      await loadMachines(filters);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(machine: Machine, status: MachineStatus) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateMachineStatus(machine.id, status);
      setSuccess(`Da cap nhat trang thai ${machine.name}.`);
      await loadMachines(filters);
    } catch (statusError) {
      setError(getErrorMessage(statusError));
    } finally {
      setSaving(false);
    }
  }

  async function markOffline(machine: Machine) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await setMachineOffline(machine.id);
      setSuccess(`Da chuyen ${machine.name} sang ngoai tuyen.`);
      await loadMachines(filters);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setSaving(false);
    }
  }

  async function goToPage(pageNumber: number) {
    const nextFilters = { ...filters, page: pageNumber };
    setFilters(nextFilters);
    await loadMachines(nextFilters);
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Machine Management</p>
          <h2 className="mt-1 text-2xl font-semibold">Quan ly may tram</h2>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            type="button"
            onClick={() => loadMachines(filters)}
          >
            <RefreshCw className="size-4" />
            Tai lai
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            type="button"
            onClick={openCreateForm}
          >
            <Plus className="size-4" />
            Them may
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <div className="rounded-md border bg-background p-4 md:col-span-1">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tong may</span>
            <Monitor className="size-4 text-primary" />
          </div>
          <p className="text-2xl font-semibold">{page?.totalElements ?? 0}</p>
        </div>
        {statusSummary.map((item) => (
          <div
            className="rounded-md border bg-background p-4"
            key={item.status}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {statusLabels[item.status]}
              </span>
              <Cpu className="size-4 text-primary" />
            </div>
            <p className="text-2xl font-semibold">{item.count}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-md border bg-background">
        <form
          className="grid gap-3 border-b bg-muted/20 p-4 lg:grid-cols-[1fr_180px_180px_auto]"
          onSubmit={applyFilters}
        >
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-md border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary"
              placeholder="Tim ten may, CPU, GPU, khu vuc"
              value={filters.keyword}
              onChange={(event) =>
                updateFilters({ keyword: event.target.value })
              }
            />
          </label>

          <select
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary"
            value={filters.areaId}
            onChange={(event) => updateFilters({ areaId: event.target.value })}
          >
            <option value="">Tat ca khu vuc</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>

          <select
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary"
            value={filters.status}
            onChange={(event) => updateFilters({ status: event.target.value })}
          >
            <option value="">Tat ca trang thai</option>
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
            Loc
          </button>
        </form>

        {formMode !== "hidden" && (
          <MachineForm
            areas={areas}
            mode={formMode}
            saving={saving}
            statuses={statuses}
            values={formValues}
            onCancel={closeForm}
            onChange={setFormValues}
            onSubmit={submitForm}
          />
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
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">May</th>
                <th className="px-4 py-3 font-medium">Khu vuc</th>
                <th className="px-4 py-3 font-medium">Cau hinh</th>
                <th className="px-4 py-3 font-medium">Gia</th>
                <th className="px-4 py-3 font-medium">Trang thai</th>
                <th className="px-4 py-3 font-medium">Cap nhat</th>
                <th className="px-4 py-3 text-right font-medium">Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-muted-foreground"
                    colSpan={7}
                  >
                    Dang tai du lieu may tram
                  </td>
                </tr>
              )}

              {!loading && machines.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-muted-foreground"
                    colSpan={7}
                  >
                    Khong co may phu hop bo loc
                  </td>
                </tr>
              )}

              {!loading &&
                machines.map((machine) => (
                  <tr className="border-t" key={machine.id}>
                    <td className="px-4 py-4">
                      <div className="font-medium">{machine.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        ID #{machine.id}
                      </div>
                    </td>
                    <td className="px-4 py-4">{machine.areaName}</td>
                    <td className="px-4 py-4">
                      <div>{machine.cpu ?? "Chua co CPU"}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {machine.gpu ?? "Chua co GPU"} -{" "}
                        {machine.ram == null ? "RAM N/A" : `${machine.ram}GB`} -{" "}
                        {machine.fps == null ? "FPS N/A" : `${machine.fps} FPS`} -{" "}
                        {machine.resolution ?? "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {formatCurrency(machine.hourlyPrice)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={machine.status} />
                    </td>
                    <td className="px-4 py-4">
                      <select
                        className="h-9 rounded-md border bg-background px-2 text-sm outline-none transition focus:border-primary disabled:opacity-60"
                        disabled={saving}
                        value={machine.status}
                        onChange={(event) =>
                          changeStatus(
                            machine,
                            event.target.value as MachineStatus
                          )
                        }
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status] ?? status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          title="Sua may"
                          type="button"
                          onClick={() => openEditForm(machine)}
                        >
                          <Edit3 className="size-4" />
                        </button>
                        <button
                          className="inline-flex size-9 items-center justify-center rounded-md border border-destructive/40 text-red-200 transition hover:bg-destructive/10"
                          title="Chuyen ngoai tuyen"
                          type="button"
                          onClick={() => markOffline(machine)}
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
              Truoc
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
