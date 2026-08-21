import { create } from "zustand";
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  refreshAccessToken,
} from "@/features/auth/authApi";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "@/features/auth/tokenStorage";
import type { CurrentUser, LoginValues } from "@/features/auth/types";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

type AuthState = {
  status: AuthStatus;
  user: CurrentUser | null;
  initialize: () => Promise<void>;
  login: (values: LoginValues) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<CurrentUser | null>;
  markUnauthenticated: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: "idle",
  user: null,

  initialize: async () => {
    if (!getAccessToken()) {
      clearAuthTokens();
      set({ status: "unauthenticated", user: null });
      return;
    }

    set({ status: "loading" });
    try {
      const user = await getCurrentUser();
      set({ status: "authenticated", user });
    } catch {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearAuthTokens();
        set({ status: "unauthenticated", user: null });
        return;
      }

      try {
        const token = await refreshAccessToken(refreshToken);
        setAuthTokens(token.accessToken);
        const user = await getCurrentUser();
        set({ status: "authenticated", user });
      } catch {
        clearAuthTokens();
        set({ status: "unauthenticated", user: null });
      }
    }
  },

  login: async (values) => {
    set({ status: "loading" });
    try {
      const response = await loginRequest(values);
      setAuthTokens(response.accessToken, response.refreshToken);
      set({ status: "authenticated", user: response.user });
      return response.user;
    } catch (error) {
      clearAuthTokens();
      set({ status: "unauthenticated", user: null });
      throw error;
    }
  },

  logout: async () => {
    try {
      await logoutRequest();
    } catch {
      // Logout is stateless on the backend; clearing local tokens is the source of truth.
    } finally {
      clearAuthTokens();
      set({ status: "unauthenticated", user: null });
    }
  },

  refreshCurrentUser: async () => {
    if (!getAccessToken()) {
      clearAuthTokens();
      set({ status: "unauthenticated", user: null });
      return null;
    }

    try {
      const user = await getCurrentUser();
      set({ status: "authenticated", user });
      return user;
    } catch {
      clearAuthTokens();
      set({ status: "unauthenticated", user: null });
      return null;
    }
  },

  markUnauthenticated: () => {
    clearAuthTokens();
    set({ status: "unauthenticated", user: null });
  },
}));
