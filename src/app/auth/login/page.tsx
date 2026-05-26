import { LoginForm } from "@/features/auth/components/login-form";
import Link from "next/link";
import type { Metadata } from "next";
import { LogoIcon, Logo } from "@/components/ui/logo";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="min-h-screen relative flex overflow-hidden">
      {/* Tricolor top strip */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 via-[hsl(var(--brand-blue))] to-red-500 opacity-60 z-50" />

      {/* Background blobs */}
      <div className="blob blob-blue  w-[600px] h-[600px] -top-24 -left-40 opacity-40" />
      <div className="blob blob-navy  w-[500px] h-[500px] bottom-0 -right-32 opacity-30" />
      <div className="blob blob-gold  w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-12" />

      {/* ── Left decorative panel (md+) ── */}
      <div className="hidden md:flex flex-col justify-center items-center flex-1 relative px-12 py-16 border-r border-white/5">
        <div className="relative flex flex-col items-center gap-6 max-w-xs text-center">
          {/* Animated trophy */}
          <div className="relative">
            <div className="absolute inset-0 blur-3xl rounded-full bg-[hsl(var(--brand-gold)/0.12)] scale-[1.8]" />
            <LogoIcon size={96} animated />
          </div>

          {/* 2026 hero text */}
          <div className="leading-none">
            <div
              className="font-black text-[7rem] leading-none tracking-tighter select-none"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #e2e8f0 25%, #F5A500 60%, #FFD000 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 30px rgba(245,165,0,0.25))",
              }}
            >
              2026
            </div>
            <p className="text-xs font-bold tracking-[0.3em] text-muted-foreground uppercase mt-1">FIFA WORLD CUP</p>
          </div>

          {/* Host nations */}
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest">
            <span className="text-green-400">🇲🇽 MÉXICO</span>
            <span className="text-white/30">·</span>
            <span className="text-blue-400">🇺🇸 USA</span>
            <span className="text-white/30">·</span>
            <span className="text-red-400">🇨🇦 CANADÁ</span>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            La quiniela más premium del Mundial. Compite, pronostica y sube en el ranking global.
          </p>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="flex flex-col items-center justify-center w-full md:w-auto md:min-w-[420px] md:max-w-[480px] px-6 py-16 relative z-10">

        {/* Mobile logo */}
        <div className="md:hidden flex flex-col items-center mb-10 gap-2">
          <Logo size="lg" variant="full" href="/" />
          <div className="flex items-center gap-1.5 text-xs font-bold tracking-widest mt-1">
            <span className="text-green-400">🇲🇽</span>
            <span className="text-blue-400">🇺🇸</span>
            <span className="text-red-400">🇨🇦</span>
          </div>
        </div>

        {/* Desktop logo (above form in right panel) */}
        <div className="hidden md:flex flex-col items-center mb-8 gap-1">
          <p className="text-2xl font-black text-white tracking-tight">Bienvenido de vuelta</p>
          <p className="text-sm text-muted-foreground">Inicia sesión para ver tus predicciones</p>
        </div>
        <div className="md:hidden flex flex-col items-center mb-6">
          <p className="text-sm text-muted-foreground">Bienvenido de vuelta</p>
        </div>

        {/* Form card */}
        <div className="w-full glass-card rounded-2xl p-8" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿Sin cuenta?{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-[hsl(var(--primary))] hover:text-[hsl(var(--brand-blue-light))] transition-colors"
          >
            Crear una gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
