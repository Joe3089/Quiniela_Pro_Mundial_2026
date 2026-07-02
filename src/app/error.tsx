"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const TECH_ERROR_RE =
  /sql|postgres|supabase|database|fetch|network|chunk|webpack|hydrat|module|syntax|reference|type error|cannot read|undefined is not/i;

function safeMessage(error: Error): string {
  if (!error.message || TECH_ERROR_RE.test(error.message)) return null!;
  // Truncate very long messages
  return error.message.length > 120 ? error.message.slice(0, 120) + "…" : error.message;
}

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

  const msg = safeMessage(error);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="h-16 w-16 rounded-2xl bg-destructive/20 flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Algo salió mal</h2>
        <p className="text-sm text-muted-foreground">
          {msg ?? "Ocurrió un error inesperado. Por favor intenta de nuevo."}
        </p>
        <Button variant="gradient" onClick={reset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Intentar de nuevo
        </Button>
      </div>
    </div>
  );
}
