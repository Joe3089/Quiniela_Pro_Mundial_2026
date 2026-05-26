"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, LayoutGrid, Target, BarChart3, Globe2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

const navItems = [
  { href: "/dashboard",   label: "Inicio",       icon: LayoutGrid },
  { href: "/fixtures",    label: "Partidos",      icon: Trophy },
  { href: "/predictions", label: "Predecir",      icon: Target },
  { href: "/rankings",    label: "Ranking",       icon: BarChart3 },
  { href: "/selecciones", label: "Selecciones",   icon: Globe2 },
];

export function BottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass border-t border-border/50 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div className={cn(
                "flex flex-col items-center justify-center h-full gap-0.5 transition-all",
                isActive
                  ? "text-[hsl(var(--brand-blue-light))]"
                  : "text-muted-foreground"
              )}>
                <item.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 w-6 h-0.5 rounded-t-full bg-[hsl(var(--brand-blue-light))]" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
