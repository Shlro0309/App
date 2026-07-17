import axios from "axios";

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
