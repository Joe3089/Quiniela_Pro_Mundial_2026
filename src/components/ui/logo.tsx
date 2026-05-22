"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon";
  className?: string;
  href?: string;
}

const iconSizes = { xs: 24, sm: 28, md: 36, lg: 44, xl: 60 };
const textSizes = { xs: "text-sm", sm: "text-base", md: "text-lg", lg: "text-2xl", xl: "text-3xl" };
const subSizes = { xs: "text-[7px]", sm: "text-[8px]", md: "text-[9px]", lg: "text-[11px]", xl: "text-[13px]" };

function LogoIcon({ size = 36 }: { size?: number }) {
  const s = size;
  // Scale factor relative to 60px design
  const k = s / 60;
  const r = 29 * k;
  const cx = s / 2;
  const cy = s / 2;

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        {/* FIFA 2026 inspired: black badge with gradient ring */}
        <linearGradient id="qp-ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E0001B" />
          <stop offset="50%" stopColor="#7B2FBE" />
          <stop offset="100%" stopColor="#B5E317" />
        </linearGradient>
        <linearGradient id="qp-gold-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE082" />
          <stop offset="60%" stopColor="#FFC93C" />
          <stop offset="100%" stopColor="#E6920A" />
        </linearGradient>
        <linearGradient id="qp-gold2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF0A0" />
          <stop offset="100%" stopColor="#F5A500" />
        </linearGradient>
        <filter id="qp-glow-gold" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={1.2 * k} result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer gradient ring */}
      <circle cx={cx} cy={cy} r={r + 1.5 * k} stroke="url(#qp-ring-grad)" strokeWidth={2 * k} fill="none" />

      {/* Black background circle */}
      <circle cx={cx} cy={cy} r={r} fill="#070710" />

      {/* Inner subtle glow ring */}
      <circle cx={cx} cy={cy} r={r - 1 * k} stroke="rgba(255,255,255,0.06)" strokeWidth={0.8 * k} fill="none" />

      {/* "2" - left side, bold white */}
      <text
        x={cx - 10 * k}
        y={cy + 10 * k}
        textAnchor="middle"
        fontSize={22 * k}
        fontWeight="900"
        fontFamily="Arial Black, Impact, sans-serif"
        fill="white"
        opacity="0.92"
      >
        2
      </text>

      {/* "6" - right side, bold white */}
      <text
        x={cx + 10 * k}
        y={cy + 10 * k}
        textAnchor="middle"
        fontSize={22 * k}
        fontWeight="900"
        fontFamily="Arial Black, Impact, sans-serif"
        fill="white"
        opacity="0.92"
      >
        6
      </text>

      {/* Trophy overlaid in center */}
      {/* Cup body */}
      <path
        d={`M${cx - 7*k} ${cy - 10*k} h${14*k} v${4*k} h${3*k} V${cy - 2*k} a${7*k} ${7*k} 0 0 1 -${7*k} ${7*k} a${7*k} ${7*k} 0 0 1 -${7*k} -${7*k} V${cy - 6*k} h${3*k} z`}
        fill="url(#qp-gold-grad)"
        filter="url(#qp-glow-gold)"
      />
      {/* Stem */}
      <rect
        x={cx - 2 * k} y={cy + 5 * k}
        width={4 * k} height={4.5 * k}
        rx={0.8 * k}
        fill="url(#qp-gold2)"
      />
      {/* Base */}
      <rect
        x={cx - 5.5 * k} y={cy + 9.5 * k}
        width={11 * k} height={2.2 * k}
        rx={1 * k}
        fill="url(#qp-gold2)"
      />
      <rect
        x={cx - 7 * k} y={cy + 11.5 * k}
        width={14 * k} height={2.5 * k}
        rx={1.2 * k}
        fill="url(#qp-gold-grad)"
      />

      {/* Bottom accent dot */}
      <circle cx={cx} cy={cy + 16 * k} r={1.5 * k} fill="#FFC93C" opacity="0.7" />
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
          <span className={cn("font-black tracking-tight text-gradient", textSizes[size])}>
            QUINIELA
          </span>
          <span className={cn("font-bold tracking-[0.18em] uppercase text-[hsl(var(--accent))]", subSizes[size])}>
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
