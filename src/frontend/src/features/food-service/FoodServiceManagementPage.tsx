import { FormEvent, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Edit3,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Utensils,
  X,
} from "lucide-react";
import type { ApiError } from "@/types/api";
import { useRealtimeEvents } from "@/features/realtime/useRealtimeEvents";
import {
  cancelFoodOrder,
  createFoodOrder,
  createServiceItem,
  deactivateServiceItem,
  getFoodOrders,
  getFoodOrderStatuses,
  getServiceItems,
  getServiceStatuses,
  updateFoodOrderStatus,
  updateServiceItem,
  updateServiceItemStatus,
} from "./foodServiceApi";
import type {
  FoodOrder,
  FoodOrderFilters,
  FoodOrderFormValues,
  FoodOrderStatus,
  PageResponse,
  ServiceItem,
  ServiceItemFilters,
  ServiceItemFormValues,
  ServiceItemStatus,
} from "./types";

const defaultServiceFilters: ServiceItemFilters = {
  keyword: "",
  serviceType: "",
  status: "",
  page: 0,
  size: 10,
};

const defaultOrderFilters: FoodOrderFilters = {
  keyword: "",
  customerId: "",
  playSessionId: "",
  status: "",
  page: 0,
  size: 10,
};

const emptyServiceForm: ServiceItemFormValues = {
  name: "",
  price: "0",
  serviceType: "",
  imageUrl: "",
  stockQuantity: "0",
  status: "ACTIVE",
};

const emptyOrderForm: FoodOrderFormValues = {
  customerId: "",
  playSessionId: "",
  items: [{ serviceId: "", quantity: "1" }],
};

const serviceStatusLabels: Record<ServiceItemStatus, string> = {
  ACTIVE: "Đang bán",
  INACTIVE: "Tạm ẩn",
};

const orderStatusLabels: Record<FoodOrderStatus, string> = {
  PENDING: "Chờ xử lý",
  PREPARING: "Đang chuẩn bị",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

const serviceStatusClassNames: Record<ServiceItemStatus, string> = {
  ACTIVE: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
  INACTIVE: "border-slate-500/50 bg-slate-500/10 text-slate-300",
};

const orderStatusClassNames: Record<FoodOrderStatus, string> = {
  PENDING: "border-amber-400/35 bg-amber-400/10 text-amber-200",
  PREPARING: "border-sky-400/35 bg-sky-400/10 text-sky-200",
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
      return "Phiên đăng nhập không có quyền truy cập module dịch vụ.";
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
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function serviceToFormValues(serviceItem: ServiceItem): ServiceItemFormValues {
  return {
    name: serviceItem.name,
    price: String(serviceItem.price),
    serviceType: serviceItem.serviceType ?? "",
    imageUrl: serviceItem.imageUrl ?? "",
    stockQuantity: String(serviceItem.stockQuantity),
    status: serviceItem.status,
  };
}

function ServiceStatusBadge({ status }: { status: ServiceItemStatus }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-md border px-2 text-xs font-medium ${serviceStatusClassNames[status]}`}
    >
      {serviceStatusLabels[status]}
    </span>
  );
}

function OrderStatusBadge({ status }: { status: FoodOrderStatus }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-md border px-2 text-xs font-medium ${orderStatusClassNames[status]}`}
    >
      {orderStatusLabels[status]}
    </span>
  );
}

type ServiceFormProps = {
  mode: "create" | "edit";
  saving: boolean;
  statuses: ServiceItemStatus[];
  values: ServiceItemFormValues;
  onCancel: () => void;
  onChange: (values: ServiceItemFormValues) => void;
  onSubmit: () => void;
};

function ServiceForm({
  mode,
  saving,
  statuses,
  values,
  onCancel,
  onChange,
  onSubmit,
}: ServiceFormProps) {
  function updateField(field: keyof ServiceItemFormValues, value: string) {
    onChange({ ...values, [field]: value });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      className="grid gap-4 border-b bg-muted/20 p-4 lg:grid-cols-[1fr_160px_160px_150px_170px_auto]"
      onSubmit={handleSubmit}
    >
      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">Tên dịch vụ</span>
        <input
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
          maxLength={100}
          required
          value={values.name}
          onChange={(event) => updateField("name", event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">Giá</span>
        <input
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
          min={0}
          required
          step="1000"
          type="number"
          value={values.price}
          onChange={(event) => updateField("price", event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">Loại</span>
        <input
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
          maxLength={50}
          value={values.serviceType}
          onChange={(event) => updateField("serviceType", event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">Tồn kho</span>
        <input
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
          min={0}
          required
          type="number"
          value={values.stockQuantity}
          onChange={(event) => updateField("stockQuantity", event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">Trạng thái</span>
        <select
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
          value={values.status}
          onChange={(event) =>
            updateField("status", event.target.value as ServiceItemStatus)
          }
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {serviceStatusLabels[status] ?? status}
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
          {saving ? "Đang lưu" : mode === "create" ? "Thêm" : "Lưu"}
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
      <label className="grid gap-2 text-sm lg:col-span-6">
        <span className="text-muted-foreground">Ảnh</span>
        <input
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
          maxLength={255}
          placeholder="URL ảnh dịch vụ"
          value={values.imageUrl}
          onChange={(event) => updateField("imageUrl", event.target.value)}
        />
      </label>
    </form>
  );
}

type OrderFormProps = {
  saving: boolean;
  values: FoodOrderFormValues;
  onCancel: () => void;
  onChange: (values: FoodOrderFormValues) => void;
  onSubmit: () => void;
};

function OrderForm({
  saving,
  values,
  onCancel,
  onChange,
  onSubmit,
}: OrderFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  function updateItem(index: number, field: "serviceId" | "quantity", value: string) {
    const nextItems = values.items.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item
    );
    onChange({ ...values, items: nextItems });
  }

  function addItem() {
    onChange({
      ...values,
      items: [...values.items, { serviceId: "", quantity: "1" }],
    });
  }

  function removeItem(index: number) {
    onChange({
      ...values,
      items: values.items.filter((item, itemIndex) => itemIndex !== index),
    });
  }

  return (
    <form className="grid gap-4 border-b bg-muted/20 p-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 lg:grid-cols-[180px_180px_auto]">
        <label className="grid gap-2 text-sm">
          <span className="text-muted-foreground">Mã khách hàng</span>
          <input
            className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
            min={1}
            placeholder="Bỏ trống nếu là khách hiện tại"
            type="number"
            value={values.customerId}
            onChange={(event) =>
              onChange({ ...values, customerId: event.target.value })
            }
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="text-muted-foreground">Mã phiên chơi</span>
          <input
            className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
            min={1}
            placeholder="Không bắt buộc"
            type="number"
            value={values.playSessionId}
            onChange={(event) =>
              onChange({ ...values, playSessionId: event.target.value })
            }
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            disabled={saving || values.items.length === 0}
            type="submit"
          >
            <CheckCircle2 className="size-4" />
            {saving ? "Đang lưu" : "Tạo đơn"}
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
      </div>

      <div className="grid gap-3">
        {values.items.map((item, index) => (
          <div
            className="grid gap-3 rounded-md border bg-background p-3 lg:grid-cols-[1fr_140px_auto]"
            key={index}
          >
            <label className="grid gap-2 text-sm">
              <span className="text-muted-foreground">Mã dịch vụ</span>
              <input
                className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
                min={1}
                required
                type="number"
                value={item.serviceId}
                onChange={(event) =>
                  updateItem(index, "serviceId", event.target.value)
                }
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-muted-foreground">Số lượng</span>
              <input
                className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
                min={1}
                required
                type="number"
                value={item.quantity}
                onChange={(event) =>
                  updateItem(index, "quantity", event.target.value)
                }
              />
            </label>
            <div className="flex items-end">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md border border-destructive/40 px-3 text-sm text-red-200 transition hover:bg-destructive/10 disabled:opacity-50"
                disabled={values.items.length === 1}
                type="button"
                onClick={() => removeItem(index)}
              >
                <X className="size-4" />
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        className="inline-flex h-10 w-fit items-center gap-2 rounded-md border px-4 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
        type="button"
        onClick={addItem}
      >
        <Plus className="size-4" />
        Thêm dòng
      </button>
    </form>
  );
}

export function FoodServiceManagementPage() {
  const [activeTab, setActiveTab] = useState<"services" | "orders">("services");
  const [serviceStatuses, setServiceStatuses] = useState<ServiceItemStatus[]>([
    "ACTIVE",
    "INACTIVE",
  ]);
  const [orderStatuses, setOrderStatuses] = useState<FoodOrderStatus[]>([
    "PENDING",
    "PREPARING",
    "COMPLETED",
    "CANCELLED",
  ]);
  const [serviceFilters, setServiceFilters] =
    useState<ServiceItemFilters>(defaultServiceFilters);
  const [orderFilters, setOrderFilters] =
    useState<FoodOrderFilters>(defaultOrderFilters);
  const [servicePage, setServicePage] =
    useState<PageResponse<ServiceItem> | null>(null);
  const [orderPage, setOrderPage] = useState<PageResponse<FoodOrder> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [serviceFormMode, setServiceFormMode] = useState<
    "hidden" | "create" | "edit"
  >("hidden");
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [serviceFormValues, setServiceFormValues] =
    useState<ServiceItemFormValues>(emptyServiceForm);
  const [orderFormVisible, setOrderFormVisible] = useState(false);
  const [orderFormValues, setOrderFormValues] =
    useState<FoodOrderFormValues>(emptyOrderForm);

  const serviceItems = useMemo(
    () => servicePage?.content ?? [],
    [servicePage]
  );
  const foodOrders = useMemo(() => orderPage?.content ?? [], [orderPage]);

  async function loadServiceItems(nextFilters = serviceFilters) {
    setLoading(true);
    setError(null);
    try {
      const data = await getServiceItems(nextFilters);
      setServicePage(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  async function loadFoodOrders(nextFilters = orderFilters) {
    setLoading(true);
    setError(null);
    try {
      const data = await getFoodOrders(nextFilters);
      setOrderPage(data);
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
        const [serviceStatusData, orderStatusData, serviceData, orderData] =
          await Promise.all([
            getServiceStatuses(),
            getFoodOrderStatuses(),
            getServiceItems(defaultServiceFilters),
            getFoodOrders(defaultOrderFilters),
          ]);
        setServiceStatuses(serviceStatusData);
        setOrderStatuses(orderStatusData);
        setServicePage(serviceData);
        setOrderPage(orderData);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    }

    void loadInitialData();
  }, []);

  useRealtimeEvents(["FOOD_ORDER_CHANGED"], () => {
    void loadServiceItems(serviceFilters);
    void loadFoodOrders(orderFilters);
  });

  function updateServiceFilters(nextFilters: Partial<ServiceItemFilters>) {
    setServiceFilters((current) => ({
      ...current,
      ...nextFilters,
      page: nextFilters.page ?? 0,
    }));
  }

  function updateOrderFilters(nextFilters: Partial<FoodOrderFilters>) {
    setOrderFilters((current) => ({
      ...current,
      ...nextFilters,
      page: nextFilters.page ?? 0,
    }));
  }

  async function applyServiceFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFilters = { ...serviceFilters, page: 0 };
    setServiceFilters(nextFilters);
    await loadServiceItems(nextFilters);
  }

  async function applyOrderFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFilters = { ...orderFilters, page: 0 };
    setOrderFilters(nextFilters);
    await loadFoodOrders(nextFilters);
  }

  function openCreateServiceForm() {
    setEditingServiceId(null);
    setServiceFormValues(emptyServiceForm);
    setServiceFormMode("create");
  }

  function openEditServiceForm(serviceItem: ServiceItem) {
    setEditingServiceId(serviceItem.id);
    setServiceFormValues(serviceToFormValues(serviceItem));
    setServiceFormMode("edit");
  }

  function closeServiceForm() {
    setEditingServiceId(null);
    setServiceFormValues(emptyServiceForm);
    setServiceFormMode("hidden");
  }

  function openOrderForm() {
    setOrderFormValues(emptyOrderForm);
    setOrderFormVisible(true);
  }

  function closeOrderForm() {
    setOrderFormValues(emptyOrderForm);
    setOrderFormVisible(false);
  }

  async function submitServiceForm() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (serviceFormMode === "create") {
        await createServiceItem(serviceFormValues);
        setSuccess("Đã thêm dịch vụ.");
      }
      if (serviceFormMode === "edit" && editingServiceId != null) {
        await updateServiceItem(editingServiceId, serviceFormValues);
        setSuccess("Đã cập nhật dịch vụ.");
      }
      closeServiceForm();
      await loadServiceItems(serviceFilters);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function submitOrderForm() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await createFoodOrder(orderFormValues);
      setSuccess("Đã tạo đơn gọi món.");
      closeOrderForm();
      await Promise.all([
        loadFoodOrders(orderFilters),
        loadServiceItems(serviceFilters),
      ]);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function changeServiceStatus(
    serviceItem: ServiceItem,
    status: ServiceItemStatus
  ) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateServiceItemStatus(serviceItem.id, status);
      setSuccess(`Đã cập nhật ${serviceItem.name}.`);
      await loadServiceItems(serviceFilters);
    } catch (statusError) {
      setError(getErrorMessage(statusError));
    } finally {
      setSaving(false);
    }
  }

  async function deactivateCurrentService(serviceItem: ServiceItem) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await deactivateServiceItem(serviceItem.id);
      setSuccess(`Đã ẩn ${serviceItem.name}.`);
      await loadServiceItems(serviceFilters);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setSaving(false);
    }
  }

  async function changeOrderStatus(order: FoodOrder, status: FoodOrderStatus) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateFoodOrderStatus(order.id, status);
      setSuccess(`Đã cập nhật đơn #${order.id}.`);
      await Promise.all([
        loadFoodOrders(orderFilters),
        loadServiceItems(serviceFilters),
      ]);
    } catch (statusError) {
      setError(getErrorMessage(statusError));
    } finally {
      setSaving(false);
    }
  }

  async function cancelCurrentOrder(order: FoodOrder) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await cancelFoodOrder(order.id);
      setSuccess(`Đã hủy đơn #${order.id}.`);
      await Promise.all([
        loadFoodOrders(orderFilters),
        loadServiceItems(serviceFilters),
      ]);
    } catch (cancelError) {
      setError(getErrorMessage(cancelError));
    } finally {
      setSaving(false);
    }
  }

  async function goToServicePage(pageNumber: number) {
    const nextFilters = { ...serviceFilters, page: pageNumber };
    setServiceFilters(nextFilters);
    await loadServiceItems(nextFilters);
  }

  async function goToOrderPage(pageNumber: number) {
    const nextFilters = { ...orderFilters, page: pageNumber };
    setOrderFilters(nextFilters);
    await loadFoodOrders(nextFilters);
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Quản lý dịch vụ</p>
          <h2 className="mt-1 text-2xl font-semibold">Food Service</h2>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            type="button"
            onClick={() =>
              activeTab === "services"
                ? loadServiceItems(serviceFilters)
                : loadFoodOrders(orderFilters)
            }
          >
            <RefreshCw className="size-4" />
            Tải lại
          </button>
          {activeTab === "services" ? (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              type="button"
              onClick={openCreateServiceForm}
            >
              <Plus className="size-4" />
              Thêm dịch vụ
            </button>
          ) : (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              type="button"
              onClick={openOrderForm}
            >
              <ClipboardList className="size-4" />
              Tạo đơn
            </button>
          )}
        </div>
      </div>

      <div className="flex w-fit rounded-md border bg-background p-1">
        <button
          className={[
            "inline-flex h-9 items-center gap-2 rounded px-3 text-sm transition",
            activeTab === "services"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
          type="button"
          onClick={() => setActiveTab("services")}
        >
          <Utensils className="size-4" />
          Dịch vụ
        </button>
        <button
          className={[
            "inline-flex h-9 items-center gap-2 rounded px-3 text-sm transition",
            activeTab === "orders"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
          type="button"
          onClick={() => setActiveTab("orders")}
        >
          <ClipboardList className="size-4" />
          Đơn gọi món
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-md border bg-background p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Dịch vụ</span>
            <Utensils className="size-4 text-primary" />
          </div>
          <p className="text-2xl font-semibold">
            {servicePage?.totalElements ?? 0}
          </p>
        </div>
        <div className="rounded-md border bg-background p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Đơn gọi món</span>
            <ClipboardList className="size-4 text-primary" />
          </div>
          <p className="text-2xl font-semibold">
            {orderPage?.totalElements ?? 0}
          </p>
        </div>
        <div className="rounded-md border bg-background p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tồn kho hiển thị</span>
            <PackageCheck className="size-4 text-primary" />
          </div>
          <p className="text-2xl font-semibold">
            {serviceItems.reduce(
              (total, serviceItem) => total + serviceItem.stockQuantity,
              0
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-200">
          <ShieldAlert className="size-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="size-4" />
          <span>{success}</span>
        </div>
      )}

      {activeTab === "services" ? (
        <div className="overflow-hidden rounded-md border bg-background">
          <form
            className="grid gap-3 border-b bg-muted/20 p-4 lg:grid-cols-[1fr_180px_180px_auto]"
            onSubmit={applyServiceFilters}
          >
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-10 w-full rounded-md border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary"
                placeholder="Tìm tên dịch vụ, loại"
                value={serviceFilters.keyword}
                onChange={(event) =>
                  updateServiceFilters({ keyword: event.target.value })
                }
              />
            </label>
            <input
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary"
              placeholder="Loại dịch vụ"
              value={serviceFilters.serviceType}
              onChange={(event) =>
                updateServiceFilters({ serviceType: event.target.value })
              }
            />
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary"
              value={serviceFilters.status}
              onChange={(event) =>
                updateServiceFilters({ status: event.target.value })
              }
            >
              <option value="">Tất cả trạng thái</option>
              {serviceStatuses.map((status) => (
                <option key={status} value={status}>
                  {serviceStatusLabels[status] ?? status}
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

          {serviceFormMode !== "hidden" && (
            <ServiceForm
              mode={serviceFormMode}
              saving={saving}
              statuses={serviceStatuses}
              values={serviceFormValues}
              onCancel={closeServiceForm}
              onChange={setServiceFormValues}
              onSubmit={submitServiceForm}
            />
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead className="bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Dịch vụ</th>
                  <th className="px-4 py-3 font-medium">Loại</th>
                  <th className="px-4 py-3 font-medium">Giá</th>
                  <th className="px-4 py-3 font-medium">Tồn kho</th>
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
                      colSpan={7}
                    >
                      Đang tải dịch vụ
                    </td>
                  </tr>
                )}
                {!loading && serviceItems.length === 0 && (
                  <tr>
                    <td
                      className="px-4 py-10 text-center text-muted-foreground"
                      colSpan={7}
                    >
                      Không có dịch vụ phù hợp bộ lọc
                    </td>
                  </tr>
                )}
                {!loading &&
                  serviceItems.map((serviceItem) => (
                    <tr className="border-t" key={serviceItem.id}>
                      <td className="px-4 py-4">
                        <div className="font-medium">{serviceItem.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          ID #{serviceItem.id}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {serviceItem.serviceType ?? "Chưa phân loại"}
                      </td>
                      <td className="px-4 py-4">
                        {formatCurrency(serviceItem.price)}
                      </td>
                      <td className="px-4 py-4">{serviceItem.stockQuantity}</td>
                      <td className="px-4 py-4">
                        <ServiceStatusBadge status={serviceItem.status} />
                      </td>
                      <td className="px-4 py-4">
                        <select
                          className="h-9 rounded-md border bg-background px-2 text-sm outline-none transition focus:border-primary disabled:opacity-60"
                          disabled={saving}
                          value={serviceItem.status}
                          onChange={(event) =>
                            changeServiceStatus(
                              serviceItem,
                              event.target.value as ServiceItemStatus
                            )
                          }
                        >
                          {serviceStatuses.map((status) => (
                            <option key={status} value={status}>
                              {serviceStatusLabels[status] ?? status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            title="Sửa dịch vụ"
                            type="button"
                            onClick={() => openEditServiceForm(serviceItem)}
                          >
                            <Edit3 className="size-4" />
                          </button>
                          <button
                            className="inline-flex size-9 items-center justify-center rounded-md border border-destructive/40 text-red-200 transition hover:bg-destructive/10"
                            title="Ẩn dịch vụ"
                            type="button"
                            onClick={() => deactivateCurrentService(serviceItem)}
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
          <Pagination
            loading={loading}
            page={servicePage}
            onPageChange={goToServicePage}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border bg-background">
          <form
            className="grid gap-3 border-b bg-muted/20 p-4 lg:grid-cols-[1fr_150px_160px_170px_auto]"
            onSubmit={applyOrderFilters}
          >
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-10 w-full rounded-md border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary"
                placeholder="Tìm khách hàng, dịch vụ"
                value={orderFilters.keyword}
                onChange={(event) =>
                  updateOrderFilters({ keyword: event.target.value })
                }
              />
            </label>
            <input
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary"
              min={1}
              placeholder="Khách ID"
              type="number"
              value={orderFilters.customerId}
              onChange={(event) =>
                updateOrderFilters({ customerId: event.target.value })
              }
            />
            <input
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary"
              min={1}
              placeholder="Phiên ID"
              type="number"
              value={orderFilters.playSessionId}
              onChange={(event) =>
                updateOrderFilters({ playSessionId: event.target.value })
              }
            />
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary"
              value={orderFilters.status}
              onChange={(event) =>
                updateOrderFilters({ status: event.target.value })
              }
            >
              <option value="">Tất cả trạng thái</option>
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {orderStatusLabels[status] ?? status}
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

          {orderFormVisible && (
            <OrderForm
              saving={saving}
              values={orderFormValues}
              onCancel={closeOrderForm}
              onChange={setOrderFormValues}
              onSubmit={submitOrderForm}
            />
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-sm">
              <thead className="bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Mã</th>
                  <th className="px-4 py-3 font-medium">Khách hàng</th>
                  <th className="px-4 py-3 font-medium">Dịch vụ</th>
                  <th className="px-4 py-3 font-medium">Liên kết</th>
                  <th className="px-4 py-3 font-medium">Tổng tiền</th>
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
                      Đang tải đơn gọi món
                    </td>
                  </tr>
                )}
                {!loading && foodOrders.length === 0 && (
                  <tr>
                    <td
                      className="px-4 py-10 text-center text-muted-foreground"
                      colSpan={8}
                    >
                      Không có đơn phù hợp bộ lọc
                    </td>
                  </tr>
                )}
                {!loading &&
                  foodOrders.map((order) => (
                    <tr className="border-t" key={order.id}>
                      <td className="px-4 py-4">
                        <div className="font-medium">#{order.id}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(order.orderedAt)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium">{order.customerName}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          KH #{order.customerId}
                          {order.phoneNumber ? ` - ${order.phoneNumber}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="grid max-w-[300px] gap-1">
                          {order.items.map((item) => (
                            <span
                              className="inline-flex w-fit rounded-md border px-2 py-1 text-xs text-muted-foreground"
                              key={item.id}
                            >
                              {item.serviceName} x{item.quantity}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          {order.playSessionId
                            ? `Phiên #${order.playSessionId}`
                            : "Không gắn phiên"}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {order.machineName ?? order.employeeName ?? "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-4 py-4">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-4">
                        <select
                          className="h-9 rounded-md border bg-background px-2 text-sm outline-none transition focus:border-primary disabled:opacity-60"
                          disabled={
                            saving ||
                            order.status === "COMPLETED" ||
                            order.status === "CANCELLED"
                          }
                          value={order.status}
                          onChange={(event) =>
                            changeOrderStatus(
                              order,
                              event.target.value as FoodOrderStatus
                            )
                          }
                        >
                          {orderStatuses.map((status) => (
                            <option key={status} value={status}>
                              {orderStatusLabels[status] ?? status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            className="inline-flex size-9 items-center justify-center rounded-md border border-destructive/40 text-red-200 transition hover:bg-destructive/10 disabled:opacity-50"
                            disabled={
                              saving ||
                              order.status === "COMPLETED" ||
                              order.status === "CANCELLED"
                            }
                            title="Hủy đơn"
                            type="button"
                            onClick={() => cancelCurrentOrder(order)}
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
          <Pagination
            loading={loading}
            page={orderPage}
            onPageChange={goToOrderPage}
          />
        </div>
      )}
    </section>
  );
}

type PaginationProps<T> = {
  loading: boolean;
  page: PageResponse<T> | null;
  onPageChange: (page: number) => void;
};

function Pagination<T>({ loading, page, onPageChange }: PaginationProps<T>) {
  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>
        Trang {(page?.number ?? 0) + 1} / {Math.max(page?.totalPages ?? 1, 1)}
      </span>
      <div className="flex gap-2">
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md border px-3 transition hover:bg-muted disabled:opacity-50"
          disabled={loading || !page || page.first}
          type="button"
          onClick={() => onPageChange(Math.max((page?.number ?? 0) - 1, 0))}
        >
          <ChevronLeft className="size-4" />
          Trước
        </button>
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md border px-3 transition hover:bg-muted disabled:opacity-50"
          disabled={loading || !page || page.last}
          type="button"
          onClick={() => onPageChange((page?.number ?? 0) + 1)}
        >
          Sau
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
