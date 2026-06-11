"use client";

import { useTimezone, formatTimeInTz, formatDateShortInTz, formatDateFullInTz } from "@/providers/timezone-provider";

/** Returns timezone-aware date formatters using the user's selected timezone */
export function useFormatDate() {
  const { tz, option } = useTimezone();

  return {
    tz,
    tzLabel: option.label,
    formatTime: (dateStr: string) => formatTimeInTz(dateStr, tz),
    formatDateShort: (dateStr: string) => formatDateShortInTz(dateStr, tz),
    formatDateFull: (dateStr: string) => formatDateFullInTz(dateStr, tz),
  };
}
