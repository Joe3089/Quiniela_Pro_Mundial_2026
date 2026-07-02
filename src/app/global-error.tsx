"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0a0a0f", color: "#fff" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ textAlign: "center", maxWidth: 360 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚽</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Quiniela Pro · Mantenimiento</h2>
            <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 24 }}>
              Estamos realizando mejoras. Por favor intenta de nuevo en unos momentos.
            </p>
            <button
              onClick={reset}
              style={{
                background: "hsl(217 91% 60%)", color: "#fff", border: "none",
                padding: "10px 24px", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 600,
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
