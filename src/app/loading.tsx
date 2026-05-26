import { LogoIcon } from "@/components/ui/logo";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">

        {/* Trophy with layered glow rings */}
        <div className="relative flex items-center justify-center w-32 h-32">
          {/* Outer soft glow */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(245,165,0,0.15) 0%, transparent 70%)",
              animation: "pulse-glow 2.4s ease-in-out infinite",
            }}
          />
          {/* Inner ring */}
          <div
            className="absolute inset-4 rounded-full border border-[hsl(var(--brand-gold)/0.25)]"
            style={{ animation: "pulse-glow 2.4s ease-in-out infinite 0.4s" }}
          />
          {/* Mid ring */}
          <div
            className="absolute inset-8 rounded-full border border-[hsl(var(--brand-gold)/0.15)]"
            style={{ animation: "pulse-glow 2.4s ease-in-out infinite 0.8s" }}
          />
          {/* Animated trophy icon */}
          <div className="relative z-10">
            <LogoIcon size={72} animated />
          </div>
        </div>

        {/* App name */}
        <div className="text-center">
          <p className="text-xl font-black tracking-[0.1em] text-white uppercase">Quiniela</p>
          <p
            className="text-[10px] font-bold tracking-[0.26em] uppercase mt-0.5"
            style={{ color: "hsl(var(--brand-gold))" }}
          >
            FIFA WORLD CUP 2026
          </p>
        </div>

        {/* Tricolor loading dots */}
        <div className="flex gap-2 items-center">
          {[
            { color: "#22C55E", delay: "0s" },
            { color: "#1D4ED8", delay: "0.18s" },
            { color: "#EF4444", delay: "0.36s" },
          ].map((d, i) => (
            <div
              key={i}
              className="h-1.5 w-1.5 rounded-full animate-bounce"
              style={{ background: d.color, animationDelay: d.delay }}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
