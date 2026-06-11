"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TeamCrestProps {
  team: {
    name?: string;
    short_name?: string;
    fifa_code?: string;
    flag_url?: string;
    escudo_url?: string;
    logo_url?: string;
  } | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  /** If true, shows the team shield/crest; if false shows the flag */
  showCrest?: boolean;
}

const SIZES = {
  xs: { px: 20, cls: "w-5 h-5"  },
  sm: { px: 28, cls: "w-7 h-7"  },
  md: { px: 36, cls: "w-9 h-9"  },
  lg: { px: 48, cls: "w-12 h-12"},
};

export function TeamCrest({ team, size = "sm", className, showCrest = true }: TeamCrestProps) {
  const { px, cls } = SIZES[size];
  const [crestFailed, setCrestFailed] = useState(false);

  if (!team) return <div className={cn("rounded bg-white/5", cls, className)} />;

  const crestSrc = team.escudo_url ?? team.logo_url ?? null;
  const flagSrc = team.flag_url ?? null;

  // Decide which source to use
  const src = showCrest && crestSrc && !crestFailed ? crestSrc : flagSrc;

  if (!src) {
    // Text fallback
    return (
      <div className={cn(
        "rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10",
        cls, className
      )}>
        <span className="text-[8px] font-black text-white/60 uppercase">
          {team.short_name?.slice(0, 3) ?? team.fifa_code?.slice(0, 3) ?? "?"}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("shrink-0 flex items-center justify-center", cls, className)}>
      <Image
        src={src}
        alt={team.name ?? team.short_name ?? ""}
        width={px}
        height={px}
        className="object-contain w-full h-full"
        unoptimized
        onError={() => {
          if (showCrest && crestSrc && !crestFailed) {
            setCrestFailed(true); // falls back to flag
          }
        }}
      />
    </div>
  );
}
