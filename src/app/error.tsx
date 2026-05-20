"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-destructive/20 flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Algo salió mal</h2>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button variant="gradient" onClick={reset}>
          Intentar de nuevo
        </Button>
      </div>
    </div>
  );
}
