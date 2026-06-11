"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";
import { AuthProvider } from "./auth-provider";
import { TimezoneProvider } from "./timezone-provider";
import { InstallPrompt } from "@/components/shared/install-prompt";
import { TournamentProvider } from "./tournament-provider";
import { Toaster } from "sonner";

function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <TimezoneProvider>
      <QueryProvider>
        <AuthProvider>
          <TournamentProvider>
            <ServiceWorkerRegistrar />
            {children}
          </TournamentProvider>
          <InstallPrompt />
          <Toaster
            position="top-right"
            richColors
            expand
            toastOptions={{
              classNames: {
                toast: "glass border-border",
              },
            }}
          />
        </AuthProvider>
      </QueryProvider>
      </TimezoneProvider>
    </ThemeProvider>
  );
}
