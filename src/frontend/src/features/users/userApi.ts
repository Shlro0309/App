import { httpClient } from "@/api/httpClient";
import type {
  AccountStatus,
  PageResponse,
  Role,
  User,
  UserFilters,
  UserFormValues,
  UserRole,
} from "./types";

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toCreatePayload(values: UserFormValues) {
  return {
    username: values.username.trim(),
    password: values.password,
    fullName: optionalText(values.fullName),
    phoneNumber: optionalText(values.phoneNumber),
    email: optionalText(values.email),
    role: values.role,
  };
}

function toUpdatePayload(values: UserFormValues) {
  return {
    fullName: optionalText(values.fullName),
    phoneNumber: optionalText(values.phoneNumber),
    email: optionalText(values.email),
  };
}

export async function getUsers(filters: UserFilters) {
  const response = await httpClient.get<PageResponse<User>>("/users", {
    params: {
      keyword: filters.keyword || undefined,
      role: filters.role || undefined,
      status: filters.status || undefined,
      page: filters.page,
      size: filters.size,
      sort: "createdAt,desc",
    },
  });

  return response.data;
}

export async function getUserRoles() {
  const response = await httpClient.get<Role[]>("/users/roles");
  return response.data;
}

export async function createUser(values: UserFormValues) {
  const response = await httpClient.post<User>("/users", toCreatePayload(values));
  return response.data;
}

export async function updateUser(id: number, values: UserFormValues) {
  const response = await httpClient.put<User>(
    `/users/${id}`,
    toUpdatePayload(values)
  );
  return response.data;
}

export async function updateUserStatus(id: number, status: AccountStatus) {
  const response = await httpClient.patch<User>(`/users/${id}/status`, {
    status,
  });
  return response.data;
}

export async function updateUserRole(id: number, role: UserRole) {
  const response = await httpClient.patch<User>(`/users/${id}/role`, {
    role,
  });
  return response.data;
}

export async function lockUser(id: number) {
  await httpClient.delete(`/users/${id}`);
}
