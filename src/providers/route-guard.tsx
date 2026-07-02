"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";

const PROTECTED = [
  "/dashboard", "/fixtures", "/predictions", "/rankings",
  "/selecciones", "/estadisticas", "/profile", "/admin",
  "/en-vivo", "/noticias",
];

export function RouteGuard() {
  const { isAuthenticated, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;
    if (isAuthenticated) return;

    const pathname = window.location.pathname;
    if (PROTECTED.some((p) => pathname.startsWith(p))) {
      window.location.replace(
        `/auth/login?redirectTo=${encodeURIComponent(pathname)}`
      );
    }
  }, [isAuthenticated, isInitialized]);

  return null;
}
