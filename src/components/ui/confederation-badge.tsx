"use client";

import type { Confederation } from "@/data/wc2026-teams";

const CONFIG: Record<Confederation, { color: string; bg: string; border: string; label: string }> = {
  UEFA:     { color: "#60A5FA", bg: "rgba(29,78,216,0.15)",    border: "rgba(29,78,216,0.35)",    label: "UEFA" },
  CONMEBOL: { color: "#FBBF24", bg: "rgba(245,165,0,0.15)",    border: "rgba(245,165,0,0.35)",    label: "CONMEBOL" },
  CONCACAF: { color: "#34D399", bg: "rgba(52,211,153,0.15)",   border: "rgba(52,211,153,0.35)",   label: "CONCACAF" },
  AFC:      { color: "#F87171", bg: "rgba(239,68,68,0.15)",    border: "rgba(239,68,68,0.35)",    label: "AFC" },
  CAF:      { color: "#FB923C", bg: "rgba(249,115,22,0.15)",   border: "rgba(249,115,22,0.35)",   label: "CAF" },
  OFC:      { color: "#2DD4BF", bg: "rgba(20,184,166,0.15)",   border: "rgba(20,184,166,0.35)",   label: "OFC" },
};

interface ConfederationBadgeProps {
  confederation: Confederation | string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ConfederationBadge({ confederation, size = "md", showLabel = true }: ConfederationBadgeProps) {
  const cfg = CONFIG[confederation as Confederation] ?? {
    color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.25)", label: confederation,
  };

  const sizeClasses = {
    sm: "text-[9px] px-1.5 py-0.5 rounded",
    md: "text-[10px] px-2 py-0.5 rounded-md",
    lg: "text-xs px-2.5 py-1 rounded-lg",
  };

  return (
    <span
      className={`inline-flex items-center font-bold tracking-wider uppercase ${sizeClasses[size]}`}
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      {showLabel ? cfg.label : confederation.slice(0, 3)}
    </span>
  );
}
