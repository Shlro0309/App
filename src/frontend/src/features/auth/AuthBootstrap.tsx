import { ReactNode, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const initialize = useAuthStore((state) => state.initialize);
  const markUnauthenticated = useAuthStore((state) => state.markUnauthenticated);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    window.addEventListener("auth:unauthorized", markUnauthenticated);
    return () => {
      window.removeEventListener("auth:unauthorized", markUnauthenticated);
    };
  }, [markUnauthenticated]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">
        <div className="flex items-center gap-3">
          <RefreshCw className="size-5 animate-spin" />
          <span>Đang khởi tạo phiên đăng nhập</span>
        </div>
      </div>
    );
  }

  return children;
}
