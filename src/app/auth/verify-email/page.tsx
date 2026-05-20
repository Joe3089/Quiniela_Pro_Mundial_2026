import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Verifica tu email" };

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen fifa-gradient flex items-center justify-center px-4">
      <div className="glass rounded-2xl border border-border/50 p-10 max-w-md w-full text-center space-y-6">
        <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Revisa tu email</h1>
          <p className="text-muted-foreground text-sm">
            Te enviamos un enlace de confirmación. Por favor revisa tu bandeja de entrada.
          </p>
        </div>
        <Button variant="glass" asChild>
          <Link href="/auth/login">Volver al login</Link>
        </Button>
      </div>
    </div>
  );
}
