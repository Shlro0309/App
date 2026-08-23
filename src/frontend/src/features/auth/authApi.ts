import { httpClient } from "@/api/httpClient";
import type {
  AuthResponse,
  CurrentUser,
  LoginValues,
  TokenResponse,
} from "./types";

export async function login(values: LoginValues) {
  const response = await httpClient.post<AuthResponse>("/auth/login", {
    username: values.username.trim(),
    password: values.password,
    clientType: values.clientType,
  });

  return response.data;
}

export async function getCurrentUser() {
  const response = await httpClient.get<CurrentUser>("/auth/me");
  return response.data;
}

export async function refreshAccessToken(refreshToken: string) {
  const response = await httpClient.post<TokenResponse>("/auth/refresh", {
    refreshToken,
  });

  return response.data;
}

export async function logout() {
  await httpClient.post("/auth/logout");
}

export async function changePassword(values: {
  currentPassword: string;
  newPassword: string;
}) {
  await httpClient.post("/auth/change-password", values);
}
