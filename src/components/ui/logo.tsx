"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon";
  className?: string;
  href?: string;
}

const iconSizes = { xs: 24, sm: 32, md: 40, lg: 52, xl: 68 };
const textSizes = { xs: "text-xs", sm: "text-sm", md: "text-base", lg: "text-xl", xl: "text-2xl" };
const subSizes  = { xs: "text-[6px]", sm: "text-[7px]", md: "text-[8px]", lg: "text-[10px]", xl: "text-[12px]" };

export function LogoIcon({ size = 40 }: { size?: number; useImage?: boolean; animated?: boolean }) {
  return (
    <Image
      src="/logo-icon.png"
      alt="Quiniela FIFA WC 2026"
      width={size}
      height={size}
      className="rounded-sm"
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}

export function Logo({ size = "md", variant = "full", className, href = "/" }: LogoProps) {
  const iconSize = iconSizes[size];

  const content = (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <LogoIcon size={iconSize} />
      {variant === "full" && (
        <div className="flex flex-col leading-none">
          <span className={cn("font-black tracking-tight text-white", textSizes[size])}>
            QUINIELA
          </span>
          <span className={cn("font-bold tracking-widest uppercase text-[hsl(var(--brand-gold))]", subSizes[size])}>
            FIFA WORLD CUP 2026
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
        {content}
      </Link>
    );
  }
  return content;
}
