"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon";
  className?: string;
  href?: string;
}

const iconSizes = { xs: 24, sm: 28, md: 36, lg: 44, xl: 56 };
const textSizes = {
  xs: "text-sm",
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-3xl",
};
const subSizes = {
  xs: "text-[7px]",
  sm: "text-[8px]",
  md: "text-[9px]",
  lg: "text-[11px]",
  xl: "text-[13px]",
};

function LogoIcon({ size = 36 }: { size?: number }) {
  const s = size;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="qp-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E0001B" />
          <stop offset="100%" stopColor="#6B21A8" />
        </linearGradient>
        <linearGradient id="qp-trophy" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFC93C" />
          <stop offset="100%" stopColor="#F5A500" />
        </linearGradient>
        <filter id="qp-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer ring */}
      <circle cx="22" cy="22" r="21.5" fill="url(#qp-bg)" />
      <circle cx="22" cy="22" r="20.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />

      {/* Trophy cup */}
      <path
        d="M16 10h12v3h2.5V18a8.5 8.5 0 01-8.5 8.5A8.5 8.5 0 0113.5 18v-5H16V10z"
        fill="url(#qp-trophy)"
        filter="url(#qp-glow)"
      />
      {/* Stem */}
      <rect x="20.5" y="23.5" width="3" height="4.5" rx="0.5" fill="url(#qp-trophy)" />
      {/* Base */}
      <rect x="17" y="28" width="10" height="2.2" rx="1" fill="url(#qp-trophy)" />
      <rect x="15" y="30" width="14" height="2.5" rx="1.2" fill="url(#qp-trophy)" />

      {/* Lime accent stars */}
      <circle cx="12.5" cy="16" r="2" fill="#B5E317" opacity="0.9" />
      <circle cx="31.5" cy="16" r="2" fill="#B5E317" opacity="0.9" />

      {/* Small bottom star */}
      <circle cx="22" cy="34.5" r="1.5" fill="#FFC93C" opacity="0.8" />
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
          <span
            className={cn(
              "font-black tracking-tight text-gradient",
              textSizes[size]
            )}
          >
            QUINIELA
          </span>
          <span
            className={cn(
              "font-bold tracking-[0.2em] uppercase text-[hsl(var(--accent))]",
              subSizes[size]
            )}
          >
            PRO · MUNDIAL 2026
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

export { LogoIcon };
