import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Edit3,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Unlock,
  UserCog,
  Users,
  X,
} from "lucide-react";
import type { ApiError } from "@/types/api";
import {
  createUser,
  deleteUser,
  getUserRoles,
  getUsers,
  updateUser,
  updateUserBalance,
  updateUserRole,
  updateUserStatus,
} from "./userApi";
import { useRealtimeEvents } from "@/features/realtime/useRealtimeEvents";
import { useAuthStore } from "@/stores/authStore";
import type {
  AccountStatus,
  PageResponse,
  Role,
  User,
  UserFilters,
  UserFormValues,
  UserRole,
} from "./types";

const defaultFilters: UserFilters = {
  keyword: "",
  role: "",
  status: "",
  page: 0,
  size: 10,
};

const emptyForm: UserFormValues = {
  username: "",
  password: "",
  fullName: "",
  phoneNumber: "",
  email: "",
  role: "CUSTOMER",
};

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Quản trị",
  EMPLOYEE: "Nhân viên",
  CUSTOMER: "Khách hàng",
};

const statusLabels: Record<AccountStatus, string> = {
  ACTIVE: "Hoạt động",
  LOCKED: "Đã khóa",
};

const statusClassNames: Record<AccountStatus, string> = {
  ACTIVE: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
  LOCKED: "border-red-400/35 bg-red-400/10 text-red-200",
};

const roleClassNames: Record<UserRole, string> = {
  ADMIN: "border-purple-400/35 bg-purple-400/10 text-purple-200",
  EMPLOYEE: "border-sky-400/35 bg-sky-400/10 text-sky-200",
  CUSTOMER: "border-primary/35 bg-primary/10 text-primary",
};

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) {
      return data.message;
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      return "Phiên đăng nhập không có quyền truy cập module tài khoản.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể xử lý yêu cầu hiện tại.";
}

function toFormValues(user: User): UserFormValues {
  return {
    username: user.username,
    password: "",
    fullName: user.fullName ?? "",
    phoneNumber: user.phoneNumber ?? "",
    email: user.email ?? "",
    role: user.role,
  };
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: AccountStatus }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-md border px-2 text-xs font-medium ${statusClassNames[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-md border px-2 text-xs font-medium ${roleClassNames[role]}`}
    >
      {roleLabels[role]}
    </span>
  );
}

type UserFormProps = {
  canManageRoles: boolean;
  mode: "create" | "edit";
  roles: Role[];
  saving: boolean;
  values: UserFormValues;
  onCancel: () => void;
  onChange: (values: UserFormValues) => void;
  onSubmit: () => void;
};

function UserForm({
  canManageRoles,
  mode,
  roles,
  saving,
  values,
  onCancel,
  onChange,
  onSubmit,
}: UserFormProps) {
  function updateField(field: keyof UserFormValues, value: string) {
    onChange({ ...values, [field]: value });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      className="grid gap-4 border-b bg-muted/20 p-4 lg:grid-cols-3"
      onSubmit={handleSubmit}
    >
      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">Tên đăng nhập</span>
        <input
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary disabled:opacity-60"
          maxLength={50}
          required
          value={values.username}
          onChange={(event) => updateField("username", event.target.value)}
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">
          {mode === "create" ? "Mật khẩu" : "Mật khẩu mới"}
        </span>
        <input
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary disabled:opacity-60"
          maxLength={100}
          minLength={8}
          required={mode === "create"}
          type="password"
          value={values.password}
          onChange={(event) => updateField("password", event.target.value)}
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">Vai trò</span>
        <select
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
          disabled={!canManageRoles}
          value={values.role}
          onChange={(event) =>
            updateField("role", event.target.value as UserRole)
          }
        >
          {roles.map((role) => (
            <option key={role.id} value={role.name}>
              {roleLabels[role.name] ?? role.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">Họ tên</span>
        <input
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
          maxLength={100}
          value={values.fullName}
          onChange={(event) => updateField("fullName", event.target.value)}
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">Số điện thoại</span>
        <input
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
          maxLength={15}
          value={values.phoneNumber}
          onChange={(event) => updateField("phoneNumber", event.target.value)}
        />
      </label>

      <label className="grid gap-2 text-sm">
        <span className="text-muted-foreground">Email</span>
        <input
          className="h-10 rounded-md border bg-background px-3 outline-none transition focus:border-primary"
          maxLength={100}
          type="email"
          value={values.email}
          onChange={(event) => updateField("email", event.target.value)}
        />
      </label>

      <div className="flex items-end gap-2 lg:col-span-3">
        <button
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          <CheckCircle2 className="size-4" />
          {saving
            ? "Đang lưu"
            : mode === "create"
              ? "Tạo tài khoản"
              : "Lưu thay đổi"}
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

export function UserManagementPage() {
  const currentUser = useAuthStore((state) => state.user);
  const canManageRoles = currentUser?.role === "ADMIN";
  const canDeleteUsers = currentUser?.role === "ADMIN";
  const customerAccountsOnly = currentUser?.role === "EMPLOYEE";
  const showRoleColumn = canManageRoles;
  const tableColumnCount = showRoleColumn ? 8 : 7;
  const [roles, setRoles] = useState<Role[]>([
    { id: 1, name: "ADMIN", description: null },
    { id: 2, name: "EMPLOYEE", description: null },
    { id: 3, name: "CUSTOMER", description: null },
  ]);
  const [filters, setFilters] = useState<UserFilters>(defaultFilters);
  const [page, setPage] = useState<PageResponse<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<UserFormValues>(emptyForm);
  const [balanceDrafts, setBalanceDrafts] = useState<Record<number, string>>({});

  const users = useMemo(() => page?.content ?? [], [page]);
  const summary = useMemo(() => {
    const counts = new Map<UserRole | AccountStatus, number>();
    users.forEach((user) => {
      counts.set(user.role, (counts.get(user.role) ?? 0) + 1);
      counts.set(user.status, (counts.get(user.status) ?? 0) + 1);
    });
    return {
      total: page?.totalElements ?? 0,
      customers: counts.get("CUSTOMER") ?? 0,
      employees: counts.get("EMPLOYEE") ?? 0,
      locked: counts.get("LOCKED") ?? 0,
    };
  }, [page, users]);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const initialFilters = customerAccountsOnly
      ? { ...defaultFilters, role: "CUSTOMER" }
      : defaultFilters;
    try {
      const [roleData, userData] = await Promise.all([
        getUserRoles(),
        getUsers(initialFilters),
      ]);
      setRoles(roleData);
      setPage(userData);
      setFilters(initialFilters);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [customerAccountsOnly]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const nextDrafts: Record<number, string> = {};
    users.forEach((user) => {
      if (user.customerId) {
        nextDrafts[user.id] = String(Math.round(user.customerBalance ?? 0));
      }
    });
    setBalanceDrafts(nextDrafts);
  }, [users]);

  const loadUsers = useCallback(async (nextFilters = filters, showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    const scopedFilters = customerAccountsOnly
      ? { ...nextFilters, role: "CUSTOMER" }
      : nextFilters;
    try {
      const data = await getUsers(scopedFilters);
      setPage(data);
      setFilters(scopedFilters);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [customerAccountsOnly, filters]);

  useRealtimeEvents(["PLAY_SESSION_CHANGED", "PAYMENT_CHANGED", "RESERVATION_CHANGED"], () => {
    void loadUsers(filters, false);
  });

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadUsers(filters, false);
    }, 30000);

    return () => window.clearInterval(interval);
  }, [filters, loadUsers]);

  function updateFilters(nextFilters: Partial<UserFilters>) {
    setFilters((current) => ({
      ...current,
      ...nextFilters,
      role: customerAccountsOnly ? "CUSTOMER" : (nextFilters.role ?? current.role),
      page: 0,
    }));
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadUsers({ ...filters, page: 0 });
  }

  function openCreateForm() {
    setEditingId(null);
    setFormValues({ ...emptyForm, role: customerAccountsOnly ? "CUSTOMER" : emptyForm.role });
    setFormVisible(true);
    setError(null);
    setSuccess(null);
  }

  function openEditForm(user: User) {
    setEditingId(user.id);
    setFormValues(toFormValues(user));
    setFormVisible(true);
    setError(null);
    setSuccess(null);
  }

  function closeForm() {
    setFormVisible(false);
    setEditingId(null);
    setFormValues(emptyForm);
  }

  async function submitForm() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (editingId == null) {
        await createUser(formValues);
        setSuccess("Đã tạo tài khoản.");
      } else {
        await updateUser(editingId, formValues);
        if (canManageRoles) {
          await updateUserRole(editingId, formValues.role);
        }
        setSuccess("Đã cập nhật tài khoản.");
      }
      closeForm();
      await loadUsers(filters);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(user: User, status: AccountStatus) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateUserStatus(user.id, status);
      setSuccess("Đã cập nhật trạng thái tài khoản.");
      await loadUsers(filters);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function lockAccount(user: User) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateUserStatus(user.id, "LOCKED");
      setSuccess("Đã khóa tài khoản.");
      await loadUsers(filters);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function removeAccount(user: User) {
    if (!canDeleteUsers) {
      return;
    }

    const confirmed = window.confirm(
      `Xóa vĩnh viễn tài khoản ${user.username}? Dữ liệu liên quan sẽ bị xóa khỏi database.`
    );
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteUser(user.id);
      setSuccess("Đã xóa tài khoản.");
      await loadUsers(filters);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setSaving(false);
    }
  }

  async function changeRole(user: User, role: UserRole) {
    if (!canManageRoles) {
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateUserRole(user.id, role);
      setSuccess("Đã cập nhật vai trò tài khoản.");
      await loadUsers(filters);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function changePage(nextPage: number) {
    await loadUsers({ ...filters, page: nextPage });
  }

  function updateBalanceDraft(userId: number, value: string) {
    setBalanceDrafts((current) => ({ ...current, [userId]: value }));
  }

  async function saveBalance(user: User) {
    const nextBalance = Number(balanceDrafts[user.id]);
    if (!Number.isFinite(nextBalance) || nextBalance < 0) {
      setError("Số dư khách hàng không hợp lệ.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateUserBalance(user.id, nextBalance);
      setSuccess("Đã cập nhật số dư khách hàng.");
      await loadUsers(filters);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-2">
          <p className="text-sm font-medium text-primary">User Management</p>
          <h2 className="text-2xl font-semibold">Quản lý tài khoản</h2>
          <p className="text-sm text-muted-foreground">
            {customerAccountsOnly
              ? "Nhân viên chỉ được xem và thao tác với tài khoản khách hàng."
              : "Tạo và quản trị tài khoản khách hàng, nhân viên, quản trị viên."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            type="button"
            onClick={() => void loadUsers(filters)}
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            type="button"
            onClick={openCreateForm}
          >
            <Plus className="size-4" />
            Thêm tài khoản
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border bg-background/75 p-4 shadow-sm backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tổng tài khoản</span>
            <Users className="size-5 text-primary" />
          </div>
          <p className="text-2xl font-semibold">{summary.total}</p>
        </div>
        <div className="rounded-lg border bg-background/75 p-4 shadow-sm backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Khách hàng</span>
            <UserCog className="size-5 text-primary" />
          </div>
          <p className="text-2xl font-semibold">{summary.customers}</p>
        </div>
        <div className="rounded-lg border bg-background/75 p-4 shadow-sm backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Nhân viên</span>
            <ShieldAlert className="size-5 text-primary" />
          </div>
          <p className="text-2xl font-semibold">{summary.employees}</p>
        </div>
        <div className="rounded-lg border bg-background/75 p-4 shadow-sm backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Đã khóa</span>
            <Lock className="size-5 text-primary" />
          </div>
          <p className="text-2xl font-semibold">{summary.locked}</p>
        </div>
      </div>

      {error ? (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          <CircleAlert className="size-4" />
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="size-4" />
          <span>{success}</span>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border bg-background/75 shadow-sm backdrop-blur">
        {formVisible ? (
          <UserForm
            canManageRoles={canManageRoles}
            mode={editingId == null ? "create" : "edit"}
            roles={roles}
            saving={saving}
            values={formValues}
            onCancel={closeForm}
            onChange={setFormValues}
            onSubmit={submitForm}
          />
        ) : null}

        <form
          className="grid gap-3 border-b p-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]"
          onSubmit={handleSearch}
        >
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary"
              placeholder="Tìm username, họ tên, email, số điện thoại"
              value={filters.keyword}
              onChange={(event) => updateFilters({ keyword: event.target.value })}
            />
          </label>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary"
            disabled={customerAccountsOnly}
            value={filters.role}
            onChange={(event) => updateFilters({ role: event.target.value })}
          >
            <option value="">Tất cả vai trò</option>
            {roles.map((role) => (
              <option key={role.id} value={role.name}>
                {roleLabels[role.name] ?? role.name}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary"
            value={filters.status}
            onChange={(event) => updateFilters({ status: event.target.value })}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="LOCKED">Đã khóa</option>
          </select>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            type="submit"
          >
            <Search className="size-4" />
            Tìm
          </button>
        </form>

        <div className="overflow-x-auto">
          <table
            className={[
              "w-full text-left text-sm",
              showRoleColumn ? "min-w-[980px]" : "min-w-[860px]",
            ].join(" ")}
          >
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Tài khoản</th>
                <th className="px-4 py-3 font-medium">Liên hệ</th>
                {showRoleColumn ? (
                  <th className="px-4 py-3 font-medium">Vai trò</th>
                ) : null}
                <th className="px-4 py-3 font-medium">Hồ sơ</th>
                <th className="px-4 py-3 font-medium">Số dư</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Ngày tạo</th>
                <th className="px-4 py-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={tableColumnCount}>
                    Đang tải dữ liệu
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={tableColumnCount}>
                    Chưa có tài khoản phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium">{user.username}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.fullName ?? "Chưa có họ tên"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{user.phoneNumber ?? "Chưa có SĐT"}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.email ?? "Chưa có email"}
                      </div>
                    </td>
                    {showRoleColumn ? (
                      <td className="px-4 py-3">
                        <div className="grid gap-2">
                          <RoleBadge role={user.role} />
                          <select
                            className="h-8 rounded-md border bg-background px-2 text-xs outline-none transition focus:border-primary"
                            disabled={saving}
                            value={user.role}
                            onChange={(event) =>
                              void changeRole(user, event.target.value as UserRole)
                            }
                          >
                            {roles.map((role) => (
                              <option key={role.id} value={role.name}>
                                {roleLabels[role.name] ?? role.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    ) : null}
                    <td className="px-4 py-3">
                      <div className="text-xs text-muted-foreground">
                        User #{user.id}
                      </div>
                      {user.customerId ? (
                        <div>KH #{user.customerId}</div>
                      ) : user.employeeId ? (
                        <div>NV #{user.employeeId}</div>
                      ) : (
                        <div>Admin</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.customerId ? (
                        <div className="flex items-center gap-2">
                          <input
                            className="h-9 w-32 rounded-md border bg-background px-2 text-sm outline-none transition focus:border-primary"
                            min={0}
                            step={1000}
                            type="number"
                            value={balanceDrafts[user.id] ?? ""}
                            onChange={(event) =>
                              updateBalanceDraft(user.id, event.target.value)
                            }
                          />
                          <button
                            className="inline-flex h-9 items-center rounded-md border px-3 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                            disabled={saving}
                            type="button"
                            onClick={() => void saveBalance(user)}
                          >
                            Lưu
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Không áp dụng</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-4 py-3">{formatDateTime(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          title="Sửa tài khoản"
                          type="button"
                          onClick={() => openEditForm(user)}
                        >
                          <Edit3 className="size-4" />
                        </button>
                        {user.status === "ACTIVE" ? (
                          <button
                            className="inline-flex size-9 items-center justify-center rounded-md border text-red-200 transition hover:bg-red-400/10"
                            disabled={saving}
                            title="Khóa tài khoản"
                            type="button"
                            onClick={() => void lockAccount(user)}
                          >
                            <Lock className="size-4" />
                          </button>
                        ) : (
                          <button
                            className="inline-flex size-9 items-center justify-center rounded-md border text-emerald-200 transition hover:bg-emerald-400/10"
                            disabled={saving}
                            title="Mở khóa tài khoản"
                            type="button"
                            onClick={() => void changeStatus(user, "ACTIVE")}
                          >
                            <Unlock className="size-4" />
                          </button>
                        )}
                        {canDeleteUsers && currentUser?.userId !== user.id ? (
                          <button
                            className="inline-flex size-9 items-center justify-center rounded-md border border-red-400/40 text-red-200 transition hover:bg-red-400/10"
                            disabled={saving}
                            title="Xóa tài khoản"
                            type="button"
                            onClick={() => void removeAccount(user)}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Trang {(page?.number ?? 0) + 1}/{Math.max(page?.totalPages ?? 1, 1)} ·{" "}
            {page?.totalElements ?? 0} tài khoản
          </span>
          <div className="flex gap-2">
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md border px-3 transition hover:bg-muted disabled:opacity-50"
              disabled={page?.first ?? true}
              type="button"
              onClick={() => void changePage(Math.max((page?.number ?? 0) - 1, 0))}
            >
              <ChevronLeft className="size-4" />
              Trước
            </button>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md border px-3 transition hover:bg-muted disabled:opacity-50"
              disabled={page?.last ?? true}
              type="button"
              onClick={() => void changePage((page?.number ?? 0) + 1)}
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
