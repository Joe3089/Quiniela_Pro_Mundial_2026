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

export function LogoIcon({ size = 40, useImage = false, animated = false }: { size?: number; useImage?: boolean; animated?: boolean }) {
  const s = size;
  const k = s / 120;

  if (useImage) {
    return (
      <Image
        src="/favicon.ico"
        alt="Quiniela FIFA WC 2026"
        width={s}
        height={s}
        className="rounded-sm"
        style={{ width: s, height: s, objectFit: "contain" }}
      />
    );
  }

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={animated ? "trophy-animate" : undefined}
    >
      <defs>
        <linearGradient id={`lg-gold-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF5C0" />
          <stop offset="40%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
        <linearGradient id={`lg-body-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE566" />
          <stop offset="50%" stopColor="#FFC200" />
          <stop offset="100%" stopColor="#CC9B00" />
        </linearGradient>
        <filter id={`lg-glow-${s}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={1.5 * k * (120 / s)} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Black background */}
      <rect width="120" height="120" fill="#000000" rx={s < 40 ? 4 : 0} />

      {/* "2" bold white */}
      <text x="8" y="95"
        fontFamily="Arial Black, Impact, 'Helvetica Neue', sans-serif"
        fontSize="90" fontWeight="900"
        fill="white"
      >2</text>

      {/* "6" bold white */}
      <text x="63" y="95"
        fontFamily="Arial Black, Impact, 'Helvetica Neue', sans-serif"
        fontSize="90" fontWeight="900"
        fill="white"
      >6</text>

      {/* Trophy cup body */}
      <path
        d="M44 22 h32 v10 h6 v12 a16 16 0 0 1-16 16 a16 16 0 0 1-16-16 V32 h6 z"
        fill={`url(#lg-body-${s})`}
        filter={`url(#lg-glow-${s})`}
      />
      {/* Handles */}
      <path d="M44 34 h-8 a8 8 0 0 0 0 16 h4" fill="none" stroke={`url(#lg-gold-${s})`} strokeWidth="3" strokeLinecap="round" />
      <path d="M76 34 h8 a8 8 0 0 1 0 16 h-4"  fill="none" stroke={`url(#lg-gold-${s})`} strokeWidth="3" strokeLinecap="round" />
      {/* Stem */}
      <rect x="56" y="60" width="8" height="12" rx="2" fill={`url(#lg-body-${s})`} />
      {/* Base */}
      <rect x="48" y="72" width="24" height="5"  rx="2.5" fill={`url(#lg-body-${s})`} />
      <rect x="43" y="77" width="34" height="6"  rx="3"   fill={`url(#lg-gold-${s})`} />

      {/* FIFA label */}
      <text x="60" y="113"
        fontFamily="Arial Black, Impact, 'Helvetica Neue', sans-serif"
        fontSize="11" fontWeight="900"
        fill="white" textAnchor="middle" letterSpacing="2"
      >FIFA</text>
    </svg>
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
