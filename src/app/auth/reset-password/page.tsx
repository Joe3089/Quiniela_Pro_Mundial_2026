"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LogoIcon } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Verify the user has an active recovery session
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasSession(true);
      else {
        // No session → invalid or expired link
        setStatus("error");
        setErrorMsg("El enlace de recuperación expiró o no es válido. Solicita uno nuevo.");
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMsg("La contraseña debe tener al menos 8 caracteres.");
      setStatus("error");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Las contraseñas no coinciden.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message ?? "Error al actualizar la contraseña.");
    } else {
      setStatus("success");
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 via-[hsl(var(--brand-blue))] to-red-500 opacity-60 z-50" />
      <div className="blob blob-blue  w-[550px] h-[550px] -top-24 -left-40 opacity-35" />
      <div className="blob blob-navy  w-[450px] h-[450px] bottom-0 -right-32 opacity-25" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[400px] flex flex-col items-center gap-5"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <LogoIcon size={48} />
          <h1 className="text-xl font-black text-white tracking-tight mt-2">
            Nueva contraseña
          </h1>
          <p className="text-xs text-muted-foreground">
            Ingresa tu nueva contraseña para acceder a la app
          </p>
        </div>

        {/* Card */}
        <div className="w-full glass-card rounded-2xl px-6 py-6 border border-white/8">
          {status === "success" ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <p className="text-sm font-bold text-white">¡Contraseña actualizada!</p>
              <p className="text-xs text-muted-foreground">Redirigiendo al dashboard…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Password field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-9 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-[hsl(var(--brand-blue)/0.6)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repite la contraseña"
                    required
                    className={cn(
                      "w-full bg-white/5 border rounded-xl px-9 py-2.5 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none transition-colors",
                      confirm && password !== confirm
                        ? "border-red-500/50 focus:border-red-500/70"
                        : "border-white/10 focus:border-[hsl(var(--brand-blue)/0.6)]"
                    )}
                  />
                </div>
                {confirm && password !== confirm && (
                  <p className="text-[11px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Las contraseñas no coinciden
                  </p>
                )}
              </div>

              {/* Error message */}
              {status === "error" && errorMsg && (
                <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-400">{errorMsg}</p>
                </div>
              )}

              {/* Password strength indicator */}
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[8, 12, 16].map((len) => (
                      <div
                        key={len}
                        className={cn(
                          "flex-1 h-1 rounded-full transition-colors",
                          password.length >= len
                            ? password.length >= 16 ? "bg-emerald-400" : password.length >= 12 ? "bg-yellow-400" : "bg-red-400"
                            : "bg-white/10"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {password.length < 8 ? "Muy corta" : password.length < 12 ? "Aceptable" : password.length < 16 ? "Buena" : "Excelente"}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={status === "loading" || !hasSession}
                className="w-full bg-[hsl(var(--brand-blue))] hover:bg-[hsl(var(--brand-blue-vivid))] text-white font-bold"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Actualizando…
                  </>
                ) : (
                  "Actualizar contraseña"
                )}
              </Button>
            </form>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          <a href="/auth/login" className="text-[hsl(var(--primary))] hover:text-[hsl(var(--brand-blue-light))] transition-colors font-semibold">
            Volver al inicio de sesión
          </a>
        </p>
      </motion.div>
    </div>
  );
}
