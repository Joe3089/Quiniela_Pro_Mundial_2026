import { LogoIcon } from "@/components/ui/logo";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        {/* Pulsing logo icon */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[hsl(var(--primary)/0.2)] blur-xl animate-pulse" />
          <div className="relative animate-[spin-slow_3s_linear_infinite]">
            <LogoIcon size={64} />
          </div>
        </div>

        {/* App name */}
        <div className="text-center">
          <p className="text-lg font-black tracking-tight text-gradient">QUINIELA PRO</p>
          <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase mt-0.5">Mundial 2026</p>
        </div>

        {/* Dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
