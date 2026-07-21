import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthBootstrap } from "@/features/auth/AuthBootstrap";
import { router } from "@/routes/router";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthBootstrap>
      <RouterProvider router={router} />
    </AuthBootstrap>
  </StrictMode>
);
