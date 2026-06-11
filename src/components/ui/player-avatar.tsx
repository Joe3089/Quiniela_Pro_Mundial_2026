"use client";

import { useState } from "react";
import { getPlayerPhotoUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PlayerAvatarProps {
  player: { name: string; photo?: string; apiFootballId?: number };
  kitColor?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  xs: { px: 24, cls: "w-6 h-6 text-[8px]" },
  sm: { px: 32, cls: "w-8 h-8 text-[9px]" },
  md: { px: 48, cls: "w-12 h-12 text-xs" },
  lg: { px: 64, cls: "w-16 h-16 text-sm" },
};

export function PlayerAvatar({ player, kitColor = "1D4ED8", size = "md", className }: PlayerAvatarProps) {
  const { cls } = SIZE_MAP[size];
  const [errored, setErrored] = useState(false);

  const src = errored
    ? getPlayerPhotoUrl({ name: player.name, apiFootballId: undefined }, kitColor)
    : getPlayerPhotoUrl(player, kitColor);

  const initials = player.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn("relative rounded-full overflow-hidden shrink-0 bg-white/5", cls, className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={player.name}
        className="w-full h-full object-cover"
        onError={() => setErrored(true)}
        loading="lazy"
      />
      {/* Ring */}
      <div className="absolute inset-0 rounded-full ring-1 ring-white/10" />
    </div>
  );
}
