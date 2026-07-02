"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuthStore } from "@/store/auth.store";
import { createClient } from "@/lib/supabase/client";
import { markExplicitSignOut } from "@/lib/auth-flags";
import { cn } from "@/lib/utils";

// 24 h of inactivity → expiry warning
const INACTIVITY_MS = 24 * 60 * 60 * 1000;
// Warn 5 min before the inactivity deadline
const WARN_BEFORE_MS = 5 * 60 * 1000;
// Key for localStorage
const LAST_ACTIVITY_KEY = "quiniela_last_activity";

function updateActivity() {
  try { localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now())); } catch { /* noop */ }
}
function getLastActivity(): number {
  try { return parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) ?? "0", 10) || Date.now(); } catch { return Date.now(); }
}

export function SessionWatchdog({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARN_BEFORE_MS / 1000);
  const warnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearTimers() {
    if (warnRef.current) { clearTimeout(warnRef.current); warnRef.current = null; }
    if (autoRef.current) { clearTimeout(autoRef.current); autoRef.current = null; }
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  }

  function scheduleTimers() {
    clearTimers();
    const last = getLastActivity();
    const now = Date.now();
    const elapsed = now - last;
    const remaining = INACTIVITY_MS - elapsed;

    if (remaining <= 0) {
      // Already expired: auto-logout immediately
      doAutoLogout();
      return;
    }

    const warnIn = remaining - WARN_BEFORE_MS;
    if (warnIn > 0) {
      warnRef.current = setTimeout(() => {
        setCountdown(WARN_BEFORE_MS / 1000);
        setShowWarning(true);
        startCountdown();
      }, warnIn);
    } else {
      // Warning window already started
      const secsLeft = Math.max(0, Math.floor(remaining / 1000));
      setCountdown(secsLeft);
      setShowWarning(true);
      startCountdown();
    }

    autoRef.current = setTimeout(() => {
      doAutoLogout();
    }, remaining);
  }

  function startCountdown() {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(tickRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function doAutoLogout() {
    clearTimers();
    setShowWarning(false);
    const supabase = createClient();
    markExplicitSignOut();
    await supabase.auth.signOut();
    window.location.replace(
      "/auth/login?reason=inactivity"
    );
  }

  async function handleContinue() {
    clearTimers();
    setShowWarning(false);
    updateActivity();
    const supabase = createClient();
    await supabase.auth.refreshSession().catch(() => {});
    scheduleTimers();
  }

  async function handleLogout() {
    clearTimers();
    setShowWarning(false);
    const supabase = createClient();
    markExplicitSignOut();
    await supabase.auth.signOut();
    window.location.replace("/");
  }

  // Activity tracking
  useEffect(() => {
    if (!isAuthenticated) { clearTimers(); return; }

    updateActivity();
    scheduleTimers();

    const EVENTS = ["mousedown", "keydown", "touchstart", "scroll", "visibilitychange"] as const;
    function onActivity() {
      updateActivity();
      // Reschedule timers on activity (resets the inactivity clock)
      scheduleTimers();
    }
    EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    return () => {
      clearTimers();
      EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <>
      {children}
      {showWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          {/* Modal */}
          <div className={cn(
            "relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl",
            "animate-in fade-in-0 zoom-in-95 duration-200"
          )}>
            <div className="flex flex-col items-center gap-4 text-center">
              {/* Icon */}
              <div className="h-14 w-14 rounded-full bg-amber-500/15 flex items-center justify-center">
                <svg className="h-7 w-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              {/* Title */}
              <div>
                <h2 className="text-base font-bold text-white mb-1">Sesión por expirar</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tu sesión expirará pronto por inactividad. Guarda tus cambios e inicia sesión
                  nuevamente para continuar utilizando la aplicación.
                </p>
              </div>
              {/* Countdown */}
              <div className="rounded-xl bg-white/5 border border-white/8 px-6 py-3">
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mb-0.5">Tiempo restante</p>
                <p className="text-2xl font-black tabular-nums text-amber-400">{timeStr}</p>
              </div>
              {/* Actions */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleLogout}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Cerrar sesión
                </button>
                <button
                  onClick={handleContinue}
                  className="flex-1 rounded-xl bg-[hsl(var(--brand-blue-light))] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
