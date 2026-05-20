import { LoginForm } from "@/features/auth/components/login-form";
import { Trophy } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="min-h-screen fifa-gradient flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Trophy className="h-5 w-5 text-white" />
            </div>
          </Link>
        </div>
        <div className="glass rounded-2xl border border-border/50 p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
