"use client";

import { useState } from "react";
import { Globe2, Check, ChevronDown, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTimezone, TIMEZONE_OPTIONS } from "@/providers/timezone-provider";
import { cn } from "@/lib/utils";

export function TimezoneSelector({ compact = false }: { compact?: boolean }) {
  const { tz, option, setTz } = useTimezone();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors text-xs text-muted-foreground hover:text-white",
          compact ? "px-2 py-1" : "px-3 py-1.5"
        )}
        title="Cambiar zona horaria"
      >
        <Clock className="h-3 w-3 shrink-0" />
        <span className="hidden sm:inline">{option.flag}</span>
        <span className="font-medium">{option.label}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-60 glass-card rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
              <Globe2 className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">Zona horaria</span>
            </div>
            <div className="max-h-72 overflow-y-auto py-1">
              {TIMEZONE_OPTIONS.map((opt) => (
                <button
                  key={opt.tz}
                  onClick={() => { setTz(opt.tz); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-white/5",
                    tz === opt.tz ? "text-white" : "text-muted-foreground"
                  )}
                >
                  <span className="text-base leading-none w-5 shrink-0">{opt.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{opt.country}</div>
                    <div className="text-[10px] text-muted-foreground/70">{opt.label}</div>
                  </div>
                  {tz === opt.tz && <Check className="h-3 w-3 text-[hsl(var(--primary))] shrink-0" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
