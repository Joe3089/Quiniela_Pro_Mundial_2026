import { RegisterForm } from "@/features/auth/components/register-form";
import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/ui/logo";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden px-4 py-12">

      {/* Tricolor top strip */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 via-[hsl(var(--brand-blue))] to-red-500 opacity-60 z-50" />

      {/* Background blobs */}
      <div className="blob blob-navy  w-[600px] h-[600px] -top-24 -right-40 opacity-35" />
      <div className="blob blob-blue  w-[450px] h-[450px] bottom-0 -left-24 opacity-30" />
      <div className="blob blob-gold  w-[280px] h-[280px] top-1/3 right-1/3 opacity-10" />

      {/* Single centered card */}
      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center gap-6">

        {/* Logo */}
        <Logo size="md" variant="full" href="/" />

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-2xl font-black text-white tracking-tight">Únete a la quiniela</h1>
          <p className="text-sm text-muted-foreground mt-1">Crea tu cuenta y empieza a competir</p>
        </div>

        {/* Form card */}
        <div className="w-full glass-card rounded-2xl p-8" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
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
