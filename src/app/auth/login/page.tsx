import { LoginForm } from "@/features/auth/components/login-form";
import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/ui/logo";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Blobs */}
      <div className="blob blob-red w-[500px] h-[500px] -top-20 -left-32 opacity-50" />
      <div className="blob blob-purple w-[400px] h-[400px] -bottom-20 -right-20 opacity-40" />

      <div className="relative w-full max-w-sm z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-2">
          <Logo size="lg" variant="full" href="/" />
          <p className="text-sm text-muted-foreground">Bienvenido de vuelta</p>
        </div>

        {/* Form card */}
        <div className="glass-card rounded-2xl p-8 border border-white/8">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿Sin cuenta?{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-[hsl(var(--primary))] hover:text-[hsl(var(--primary)/0.8)] transition-colors"
          >
            Crear una gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
