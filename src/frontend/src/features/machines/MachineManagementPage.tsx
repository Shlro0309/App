import { FormEvent, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  CheckCircle2,
  Cpu,
  Edit3,
  Layers3,
  MapPinned,
  Monitor,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import type { ApiError } from "@/types/api";
import { useRealtimeEvents } from "@/features/realtime/useRealtimeEvents";
import { useAuthStore } from "@/stores/authStore";
import {
  createMachine,
  createMachineArea,
  deleteMachine,
  deleteMachineArea,
  getMachineAreas,
  getMachines,
  getMachineStatuses,
  updateMachine,
  updateMachineArea,
  updateMachineStatus,
} from "./machineApi";
import type {
  Area,
  AreaFormValues,
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
  size: 1000,
};

const emptyMachineForm: MachineFormValues = {
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

const emptyAreaForm: AreaFormValues = {
  name: "",
  description: "",
};

const statusLabels: Record<MachineStatus, string> = {
  AVAILABLE: "Sẵn sàng",
  RESERVED: "Đã đặt",
  PLAYING: "Đang chơi",
  MAINTENANCE: "Bảo trì",
};

const statusClassNames: Record<MachineStatus, string> = {
  AVAILABLE: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
  RESERVED: "border-sky-400/35 bg-sky-400/10 text-sky-200",
  PLAYING: "border-primary/35 bg-primary/10 text-primary",
  MAINTENANCE: "border-amber-400/35 bg-amber-400/10 text-amber-200",
};

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) {
      return data.message;
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      return "Phiên đăng nhập không có quyền truy cập module máy trạm.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể xử lý yêu cầu hiện tại.";
}

function toMachineFormValues(machine: Machine): MachineFormValues {
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

function toAreaFormValues(area: Area): AreaFormValues {
  return {
    name: area.name,
    description: area.description ?? "",
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatConfig(machine: Machine) {
  return [
    machine.cpu ?? "CPU N/A",
    machine.gpu ?? "GPU N/A",
    machine.ram == null ? "RAM N/A" : `${machine.ram}GB RAM`,
    machine.fps == null ? "FPS N/A" : `${machine.fps} FPS`,
    machine.resolution ?? "N/A",
  ].join(" | ");
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

type AreaFormProps = {
  mode: "create" | "edit";
  saving: boolean;
  values: AreaFormValues;
  onCancel: () => void;
  onChange: (values: AreaFormValues) => void;
  onSubmit: () => void;
};

function AreaForm({
  mode,
  saving,
  values,
  onCancel,
  onChange,
  onSubmit,
}: AreaFormProps) {
  function updateField(field: keyof AreaFormValues, value: string) {
    onChange({ ...values, [field]: value });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      className="grid gap-3 border-b bg-muted/20 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]"
      onSubmit={handleSubmit}
    >
      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">Tên khu vực</span>
        <input
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
          maxLength={50}
          required
          value={values.name}
          onChange={(event) => updateField("name", event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">Mô tả</span>
        <input
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
          maxLength={255}
          value={values.description}
          onChange={(event) => updateField("description", event.target.value)}
        />
      </label>
      <div className="flex items-end gap-2">
        <button
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          <CheckCircle2 className="size-4" />
          {saving ? "Đang lưu" : mode === "create" ? "Thêm khu" : "Lưu khu"}
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
        <span className="text-muted-foreground">Tên máy</span>
        <input
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
          maxLength={20}
          required
          value={values.name}
          onChange={(event) => updateField("name", event.target.value)}
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">Khu vực</span>
        <select
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
          required
          value={values.areaId}
          onChange={(event) => updateField("areaId", event.target.value)}
        >
          <option value="">Chọn khu vực</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">Giá theo giờ</span>
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
        <span className="text-muted-foreground">Trạng thái</span>
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
        <span className="text-muted-foreground">Độ phân giải</span>
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
          {saving ? "Đang lưu" : mode === "create" ? "Thêm máy" : "Lưu máy"}
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
  );
}

type MachineCardProps = {
  canManageMachines: boolean;
  machine: Machine;
  saving: boolean;
  statuses: MachineStatus[];
  onDelete: (machine: Machine) => void;
  onEdit: (machine: Machine) => void;
  onStatusChange: (machine: Machine, status: MachineStatus) => void;
};

function MachineCard({
  canManageMachines,
  machine,
  saving,
  statuses,
  onDelete,
  onEdit,
  onStatusChange,
}: MachineCardProps) {
  return (
    <article className="grid min-h-[220px] gap-4 rounded-md border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-md bg-muted">
            <Monitor className="size-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{machine.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">ID #{machine.id}</p>
          </div>
        </div>
        <StatusBadge status={machine.status} />
      </div>

      <div className="grid gap-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Giá giờ</span>
          <span className="font-medium">{formatCurrency(machine.hourlyPrice)}</span>
        </div>
        <div className="rounded-md border bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
          {formatConfig(machine)}
        </div>
      </div>

      {canManageMachines ? (
        <div className="mt-auto flex items-center justify-between gap-2">
          <select
            className="h-9 min-w-0 rounded-md border bg-background px-2 text-xs outline-none transition focus:border-primary disabled:opacity-60"
            disabled={saving}
            value={machine.status}
            onChange={(event) =>
              onStatusChange(machine, event.target.value as MachineStatus)
            }
          >
            {statuses.map((status) => (
              <option
                disabled={
                  machine.status === "PLAYING" &&
                  (status === "RESERVED" || status === "MAINTENANCE")
                }
                key={status}
                value={status}
              >
                {statusLabels[status] ?? status}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-muted hover:text-foreground"
              title="Sửa máy"
              type="button"
              onClick={() => onEdit(machine)}
            >
              <Edit3 className="size-4" />
            </button>
            <button
              className="inline-flex size-9 items-center justify-center rounded-md border border-red-400/40 text-red-200 transition hover:bg-red-400/10 disabled:opacity-50"
              disabled={saving}
              title="Xóa máy"
              type="button"
              onClick={() => onDelete(machine)}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function MachineManagementPage() {
  const currentUser = useAuthStore((state) => state.user);
  const canManageMachines = currentUser?.role === "ADMIN";
  const [areas, setAreas] = useState<Area[]>([]);
  const [statuses, setStatuses] = useState<MachineStatus[]>([
    "AVAILABLE",
    "RESERVED",
    "PLAYING",
    "MAINTENANCE",
  ]);
  const [filters, setFilters] = useState<MachineFilters>(defaultFilters);
  const [page, setPage] = useState<PageResponse<Machine> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [machineFormMode, setMachineFormMode] = useState<"hidden" | "create" | "edit">("hidden");
  const [areaFormMode, setAreaFormMode] = useState<"hidden" | "create" | "edit">("hidden");
  const [editingMachineId, setEditingMachineId] = useState<number | null>(null);
  const [editingAreaId, setEditingAreaId] = useState<number | null>(null);
  const [machineFormValues, setMachineFormValues] = useState<MachineFormValues>(emptyMachineForm);
  const [areaFormValues, setAreaFormValues] = useState<AreaFormValues>(emptyAreaForm);

  const machines = useMemo(() => page?.content ?? [], [page]);
  const selectedArea = useMemo(
    () => areas.find((area) => String(area.id) === filters.areaId) ?? null,
    [areas, filters.areaId]
  );
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
  const machineGroups = useMemo(() => {
    return areas
      .map((area) => ({
        area,
        machines: machines.filter((machine) => machine.areaId === area.id),
      }))
      .filter((group) => filters.areaId || group.machines.length > 0);
  }, [areas, filters.areaId, machines]);

  async function loadReferenceData() {
    const [areaData, statusData] = await Promise.all([
      getMachineAreas(),
      getMachineStatuses(),
    ]);
    setAreas(areaData);
    setStatuses(statusData);
  }

  async function loadMachines(nextFilters = filters, showLoading = true) {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await getMachines(nextFilters);
      setPage(data);
      setFilters(nextFilters);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  async function reloadWorkspace(nextFilters = filters, showLoading = true) {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      await loadReferenceData();
      const data = await getMachines(nextFilters);
      setPage(data);
      setFilters(nextFilters);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setError(null);
      try {
        const [areaData, statusData, machineData] = await Promise.all([
          getMachineAreas(),
          getMachineStatuses(),
          getMachines(defaultFilters),
        ]);
        setAreas(areaData);
        setStatuses(statusData);
        setPage(machineData);
        setFilters(defaultFilters);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    }

    void loadInitialData();
  }, []);

  useRealtimeEvents(["MACHINE_STATUS_CHANGED", "MACHINE_AREA_CHANGED"], () => {
    void reloadWorkspace(filters, false);
  });

  function updateFilters(nextFilters: Partial<MachineFilters>) {
    setFilters((current) => ({
      ...current,
      ...nextFilters,
      page: 0,
      size: defaultFilters.size,
    }));
  }

  async function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadMachines({ ...filters, page: 0, size: defaultFilters.size });
  }

  async function selectArea(areaId: string) {
    const nextFilters = { ...filters, areaId, page: 0, size: defaultFilters.size };
    await loadMachines(nextFilters);
  }

  function openCreateMachineForm() {
    setEditingMachineId(null);
    setMachineFormValues({
      ...emptyMachineForm,
      areaId: filters.areaId || (areas[0] ? String(areas[0].id) : ""),
    });
    setMachineFormMode("create");
    setAreaFormMode("hidden");
  }

  function openEditMachineForm(machine: Machine) {
    setEditingMachineId(machine.id);
    setMachineFormValues(toMachineFormValues(machine));
    setMachineFormMode("edit");
    setAreaFormMode("hidden");
  }

  function closeMachineForm() {
    setEditingMachineId(null);
    setMachineFormValues(emptyMachineForm);
    setMachineFormMode("hidden");
  }

  function openCreateAreaForm() {
    setEditingAreaId(null);
    setAreaFormValues(emptyAreaForm);
    setAreaFormMode("create");
    setMachineFormMode("hidden");
  }

  function openEditAreaForm(area: Area) {
    setEditingAreaId(area.id);
    setAreaFormValues(toAreaFormValues(area));
    setAreaFormMode("edit");
    setMachineFormMode("hidden");
  }

  function closeAreaForm() {
    setEditingAreaId(null);
    setAreaFormValues(emptyAreaForm);
    setAreaFormMode("hidden");
  }

  async function submitMachineForm() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (machineFormMode === "create") {
        await createMachine(machineFormValues);
        setSuccess("Đã thêm máy mới.");
      }
      if (machineFormMode === "edit" && editingMachineId != null) {
        await updateMachine(editingMachineId, machineFormValues);
        setSuccess("Đã cập nhật máy.");
      }
      closeMachineForm();
      await reloadWorkspace(filters);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function submitAreaForm() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (areaFormMode === "create") {
        const area = await createMachineArea(areaFormValues);
        setSuccess("Đã thêm khu vực mới.");
        await reloadWorkspace({ ...filters, areaId: String(area.id), page: 0, size: defaultFilters.size });
      }
      if (areaFormMode === "edit" && editingAreaId != null) {
        await updateMachineArea(editingAreaId, areaFormValues);
        setSuccess("Đã cập nhật khu vực.");
        await reloadWorkspace(filters);
      }
      closeAreaForm();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function removeArea(area: Area) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteMachineArea(area.id);
      const nextFilters = {
        ...filters,
        areaId: filters.areaId === String(area.id) ? "" : filters.areaId,
        page: 0,
        size: defaultFilters.size,
      };
      setSuccess(`Đã xóa khu vực ${area.name}. Máy trong khu đã được chuyển sang Chưa phân khu.`);
      await reloadWorkspace(nextFilters);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
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
      setSuccess(`Đã cập nhật trạng thái ${machine.name}.`);
      await reloadWorkspace(filters);
    } catch (statusError) {
      setError(getErrorMessage(statusError));
    } finally {
      setSaving(false);
    }
  }

  async function removeMachine(machine: Machine) {
    const confirmed = window.confirm(
      `Xóa vĩnh viễn máy ${machine.name}? Dữ liệu liên quan sẽ bị xóa khỏi database.`
    );
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteMachine(machine.id);
      setSuccess(`Đã xóa máy ${machine.name}.`);
      await reloadWorkspace(filters);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Quản lý máy</p>
          <h2 className="mt-1 text-2xl font-semibold">Sơ đồ máy trạm theo khu vực</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            type="button"
            onClick={() => void reloadWorkspace(filters)}
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Tải lại
          </button>
          {canManageMachines ? (
            <>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                type="button"
                onClick={openCreateAreaForm}
              >
                <MapPinned className="size-4" />
                Thêm khu vực
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                type="button"
                onClick={openCreateMachineForm}
              >
                <Plus className="size-4" />
                Thêm máy
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <div className="rounded-md border bg-background p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Máy đang hiển thị</span>
            <Monitor className="size-4 text-primary" />
          </div>
          <p className="text-2xl font-semibold">{machines.length}</p>
        </div>
        {statusSummary.map((item) => (
          <div className="rounded-md border bg-background p-4" key={item.status}>
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
          className="grid gap-3 border-b bg-muted/20 p-4 lg:grid-cols-[minmax(0,1fr)_180px_auto]"
          onSubmit={applyFilters}
        >
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-md border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary"
              placeholder="Tìm tên máy, CPU, GPU, khu vực"
              value={filters.keyword}
              onChange={(event) => updateFilters({ keyword: event.target.value })}
            />
          </label>

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

        {areaFormMode !== "hidden" ? (
          <AreaForm
            mode={areaFormMode}
            saving={saving}
            values={areaFormValues}
            onCancel={closeAreaForm}
            onChange={setAreaFormValues}
            onSubmit={submitAreaForm}
          />
        ) : null}

        {machineFormMode !== "hidden" ? (
          <MachineForm
            areas={areas}
            mode={machineFormMode}
            saving={saving}
            statuses={statuses}
            values={machineFormValues}
            onCancel={closeMachineForm}
            onChange={setMachineFormValues}
            onSubmit={submitMachineForm}
          />
        ) : null}

        {error ? (
          <div className="flex items-center gap-2 border-b border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">
            <ShieldAlert className="size-4" />
            <span>{error}</span>
          </div>
        ) : null}

        {success ? (
          <div className="flex items-center gap-2 border-b border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="size-4" />
            <span>{success}</span>
          </div>
        ) : null}

        <div className="grid gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-b bg-muted/10 p-4 lg:border-b-0 lg:border-r">
            <div className="mb-3 flex items-center gap-2">
              <Layers3 className="size-4 text-primary" />
              <h3 className="font-semibold">Khu vực</h3>
            </div>
            <div className="grid gap-2">
              <button
                className={[
                  "flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition hover:bg-muted",
                  filters.areaId === "" ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground",
                ].join(" ")}
                type="button"
                onClick={() => void selectArea("")}
              >
                <span>Tất cả khu vực</span>
                <span className="rounded-md border px-2 py-0.5 text-xs">
                  {areas.reduce((total, area) => total + area.machineCount, 0)}
                </span>
              </button>

              {areas.map((area) => (
                <div className="grid gap-2 rounded-md border bg-background p-2" key={area.id}>
                  <button
                    className={[
                      "flex items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm transition hover:bg-muted",
                      filters.areaId === String(area.id) ? "bg-primary/10 text-primary" : "",
                    ].join(" ")}
                    type="button"
                    onClick={() => void selectArea(String(area.id))}
                  >
                    <span className="truncate font-medium">{area.name}</span>
                    <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                      {area.machineCount}
                    </span>
                  </button>
                  {area.description ? (
                    <p className="px-2 text-xs text-muted-foreground">{area.description}</p>
                  ) : null}
                  {canManageMachines ? (
                    <div className="flex gap-2 px-2 pb-1">
                      <button
                        className="inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-md border text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        type="button"
                        onClick={() => openEditAreaForm(area)}
                      >
                        <Edit3 className="size-3.5" />
                        Đổi tên
                      </button>
                      <button
                        className="inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-md border border-red-400/40 text-xs text-red-200 transition hover:bg-red-400/10 disabled:opacity-50"
                        disabled={saving}
                        type="button"
                        onClick={() => void removeArea(area)}
                      >
                        <Trash2 className="size-3.5" />
                        Xóa
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </aside>

          <div className="min-h-[520px] p-4">
            {loading ? (
              <div className="grid min-h-[360px] place-items-center text-muted-foreground">
                <div className="grid justify-items-center gap-3">
                  <RefreshCw className="size-6 animate-spin" />
                  <span>Đang tải sơ đồ máy</span>
                </div>
              </div>
            ) : null}

            {!loading && machines.length === 0 ? (
              <div className="grid min-h-[360px] place-items-center rounded-md border border-dashed text-muted-foreground">
                Không có máy phù hợp bộ lọc.
              </div>
            ) : null}

            {!loading && machines.length > 0 ? (
              <div className="grid gap-6">
                {filters.areaId && selectedArea ? (
                  <section className="grid gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">{selectedArea.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {machines.length} máy đang hiển thị trong khu vực này
                        </p>
                      </div>
                      <span className="rounded-md border px-3 py-1 text-sm text-muted-foreground">
                        {selectedArea.description ?? "Chưa có mô tả"}
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {machines.map((machine) => (
                        <MachineCard
                          canManageMachines={canManageMachines}
                          key={machine.id}
                          machine={machine}
                          saving={saving}
                          statuses={statuses}
                          onDelete={removeMachine}
                          onEdit={openEditMachineForm}
                          onStatusChange={changeStatus}
                        />
                      ))}
                    </div>
                  </section>
                ) : (
                  machineGroups.map((group) => (
                    <section className="grid gap-3" key={group.area.id}>
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-2">
                        <div>
                          <h3 className="text-lg font-semibold">{group.area.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {group.machines.length} máy đang hiển thị
                          </p>
                        </div>
                        <span className="rounded-md border px-3 py-1 text-sm text-muted-foreground">
                          {group.area.description ?? "Chưa có mô tả"}
                        </span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {group.machines.map((machine) => (
                          <MachineCard
                            canManageMachines={canManageMachines}
                            key={machine.id}
                            machine={machine}
                            saving={saving}
                            statuses={statuses}
                            onDelete={removeMachine}
                            onEdit={openEditMachineForm}
                            onStatusChange={changeStatus}
                          />
                        ))}
                      </div>
                    </section>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
