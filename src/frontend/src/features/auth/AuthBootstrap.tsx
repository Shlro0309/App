import { ReactNode, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const markUnauthenticated = useAuthStore((state) => state.markUnauthenticated);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    void initialize().finally(() => setInitialized(true));
  }, [initialize]);

  useEffect(() => {
    window.addEventListener("auth:unauthorized", markUnauthenticated);
    return () => {
      window.removeEventListener("auth:unauthorized", markUnauthenticated);
    };
  }, [markUnauthenticated]);

  if (!initialized) {
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
