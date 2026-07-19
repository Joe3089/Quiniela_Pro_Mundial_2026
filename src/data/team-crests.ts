// Local official crest assets — not sourced from any external API.
// Files live in public/crests/{FIFA_CODE}.png (48 teams).
export function localCrestUrl(fifaCode?: string | null): string | null {
  if (!fifaCode) return null;
  return `/crests/${fifaCode.toUpperCase()}.png`;
}

// Special post-3rd-place-match crests (only exist for the teams that actually
// played that match this tournament).
const THIRD_PLACE_CRESTS: Record<string, string> = {
  ENG: "/crests/special/ENG-3rd.png",
  FRA: "/crests/special/FRA-4th.png",
};

export function podiumCrestUrl(fifaCode?: string | null): string | null {
  if (!fifaCode) return null;
  return THIRD_PLACE_CRESTS[fifaCode.toUpperCase()] ?? localCrestUrl(fifaCode);
}

// Special "campeón" crest variants, one per Final finalist.
const CHAMPION_CRESTS: Record<string, string> = {
  ARG: "/crests/special/ARG-champion.png",
  ESP: "/crests/special/ESP-champion.png",
};

export function championCrestUrl(fifaCode?: string | null): string | null {
  if (!fifaCode) return null;
  return CHAMPION_CRESTS[fifaCode.toUpperCase()] ?? localCrestUrl(fifaCode);
}
