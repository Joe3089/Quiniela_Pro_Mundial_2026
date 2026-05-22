import { RegisterForm } from "@/features/auth/components/register-form";
import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/ui/logo";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Blobs */}
      <div className="blob blob-purple w-[500px] h-[500px] -top-20 -right-32 opacity-50" />
      <div className="blob blob-red w-[400px] h-[400px] -bottom-20 -left-20 opacity-40" />

      <div className="relative w-full max-w-sm z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-2">
          <Logo size="lg" variant="full" href="/" />
          <p className="text-sm text-muted-foreground">Únete a la quiniela del Mundial</p>
        </div>

        {/* Form card */}
        <div className="glass-card rounded-2xl p-8 border border-white/8">
          <RegisterForm />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-[hsl(var(--primary))] hover:text-[hsl(var(--primary)/0.8)] transition-colors"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
