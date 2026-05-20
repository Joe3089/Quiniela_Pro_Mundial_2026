import Link from "next/link";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        <div className="text-8xl font-black text-gradient opacity-50">404</div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Página no encontrada</h1>
          <p className="text-muted-foreground text-sm">
            Esta página no existe o fue movida.
          </p>
        </div>
        <Button variant="gradient" asChild>
          <Link href="/">
            <Trophy className="h-4 w-4" />
            Ir al inicio
          </Link>
        </Button>
      </div>
    </div>
  );
}
