import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_TZ = "America/Caracas"; // Venezuela — default timezone

export function formatDate(dateStr: string, locale = "es-VE", tz = DEFAULT_TZ) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
    timeZone: tz,
  }).format(new Date(dateStr));
}

export function formatDateShort(dateStr: string, locale = "es-VE", tz = DEFAULT_TZ) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric", month: "short",
    timeZone: tz,
  }).format(new Date(dateStr));
}

export function formatTime(dateStr: string, locale = "es-VE", tz = DEFAULT_TZ) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit", minute: "2-digit", hour12: true,
    timeZone: tz,
  }).format(new Date(dateStr));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

/**
 * Returns a player photo URL.
 * Priority: 1) explicit photo URL  2) API-Football CDN (if apiFootballId)  3) ui-avatars fallback
 */
export function getPlayerPhotoUrl(
  player: { name: string; photo?: string; apiFootballId?: number },
  kitColor = "1D4ED8"
): string {
  if (player.photo) return player.photo;
  if (player.apiFootballId) {
    return `https://media.api-sports.io/football/players/${player.apiFootballId}.png`;
  }
  const initials = encodeURIComponent(
    player.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
  );
  const bg = kitColor.replace("#", "");
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=${bg}&color=fff&size=128&bold=true&format=png`;
}
