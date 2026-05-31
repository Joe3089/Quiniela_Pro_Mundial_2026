import { RegisterForm } from "@/features/auth/components/register-form";
import Link from "next/link";
import type { Metadata } from "next";
import { LogoIcon } from "@/components/ui/logo";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden px-4 py-10">

      {/* Tricolor top strip */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 via-[hsl(var(--brand-blue))] to-red-500 opacity-60 z-50" />

      {/* Background blobs */}
      <div className="blob blob-navy  w-[600px] h-[600px] -top-24 -right-40 opacity-35" />
      <div className="blob blob-blue  w-[450px] h-[450px] bottom-0 -left-24 opacity-30" />
      <div className="blob blob-gold  w-[280px] h-[280px] top-1/3 right-1/3 opacity-8" />

      {/* Single centered column */}
      <div className="relative z-10 w-full max-w-[400px] flex flex-col items-center gap-5">

        {/* ── FIFA 2026 branding ── */}
        <div className="flex flex-col items-center gap-2 text-center">
          <LogoIcon size={56} />

          <span
            className="text-[52px] font-black tracking-tight leading-none mt-1"
            style={{
              background: "linear-gradient(135deg, #f5c842 0%, #e89c1a 40%, #fff8d6 70%, #d4a017 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            2026
          </span>

          <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-muted-foreground -mt-1">
            FIFA World Cup
          </p>

          <div className="flex items-center gap-2 mt-1 text-[11px] font-bold">
            <span className="flex items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://flagcdn.com/20x15/mx.png" width={18} height={13} alt="MX" className="rounded-sm" />
              <span className="text-green-400">MÉXICO</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="flex items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://flagcdn.com/20x15/us.png" width={18} height={13} alt="US" className="rounded-sm" />
              <span className="text-white">USA</span>
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="flex items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://flagcdn.com/20x15/ca.png" width={18} height={13} alt="CA" className="rounded-sm" />
              <span className="text-red-400">CANADÁ</span>
            </span>
          </div>
        </div>

        {/* Gold divider */}
        <div className="w-12 h-px bg-gradient-to-r from-transparent via-[hsl(var(--brand-gold))] to-transparent" />

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-xl font-black text-white tracking-tight">Únete a la quiniela</h1>
          <p className="text-xs text-muted-foreground mt-1">Crea tu cuenta y empieza a competir</p>
        </div>

        {/* Form card */}
        <div className="w-full glass-card rounded-2xl px-7 py-6" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <RegisterForm />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-[hsl(var(--primary))] hover:text-[hsl(var(--brand-blue-light))] transition-colors"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
