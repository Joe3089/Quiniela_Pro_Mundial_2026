import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto">
          <WifiOff className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold">Sin conexión</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          Revisa tu conexión a internet. Los datos previamente cargados siguen disponibles.
        </p>
      </div>
    </div>
  );
}
