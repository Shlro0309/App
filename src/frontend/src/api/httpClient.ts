import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "@/features/auth/tokenStorage";
import type { TokenResponse } from "@/features/auth/types";

const apiBaseURL = import.meta.env.VITE_API_BASE_URL ?? "/api";

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const httpClient = axios.create({
  baseURL: apiBaseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const url = String(error.config?.url ?? "");
    const isAuthRequest = url.includes("/auth/login") || url.includes("/auth/refresh");
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (status === 401 && !isAuthRequest && originalRequest && !originalRequest._retry) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        originalRequest._retry = true;
        try {
          const tokenResponse = await axios.post<TokenResponse>(
            `${apiBaseURL}/auth/refresh`,
            { refreshToken },
            { headers: { "Content-Type": "application/json" } }
          );
          setAuthTokens(tokenResponse.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${tokenResponse.data.accessToken}`;
          return httpClient(originalRequest);
        } catch {
          clearAuthTokens();
          window.dispatchEvent(new Event("auth:unauthorized"));
          return Promise.reject(error);
        }
      }
    }

    if (status === 401 && !isAuthRequest) {
      clearAuthTokens();
      window.dispatchEvent(new Event("auth:unauthorized"));
    }

    return Promise.reject(error);
  }
);
