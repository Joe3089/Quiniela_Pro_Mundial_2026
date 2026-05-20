"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/use-pwa";

export function InstallPrompt() {
  const { isInstallable, install } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50"
      >
        <div className="glass-strong rounded-2xl border border-primary/30 p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Instala la app</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Acceso rápido desde tu pantalla de inicio
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Button variant="gradient" size="sm" onClick={install}>
                  Instalar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
                  Ahora no
                </Button>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded-lg hover:bg-muted/30 transition-colors shrink-0"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
