import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { router } from "./router";
import "./i18n";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <RouterProvider router={router} />
    <Toaster position="bottom-right" theme="dark" richColors closeButton duration={3500} />
  </ErrorBoundary>
);
