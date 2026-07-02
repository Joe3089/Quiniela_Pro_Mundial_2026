export interface YoutubeVideo {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
  channelSource: string;
  channelPriority: number;
}

export type VideoType = "highlights" | "preview";

// Official broadcast channels (priority order)
export const BROADCAST_CHANNELS = [
  { id: "UCjZ7QPKb89R-4SxzBoceyOg", name: "Telemundo Deportes", priority: 1 },
  { id: "UCwNqHDsnBCKT-olwJwIFyfg", name: "FOX Soccer",         priority: 2 },
  { id: "UC--i2rV5NCxiEIPefr3l-zQ", name: "TSN Sports",         priority: 3 },
  { id: "UCpcTrCXblq78GZrTUTLWeBw", name: "FIFA World Cup",     priority: 4 },
];

const SCORE_RE = /\(\d+\)\d+-\d+\(\d+\)|\d+-\d+/;

// Patterns that indicate an individual goal clip or short clip — never "highlights"
const GOAL_CLIP_RE = /^(gol de |golazo de |tremendo gol|¡gol|¡golazo|\bgoal:\s)/i;

export function detectVideoType(title: string): VideoType | null {
  const t = title.toLowerCase();
  // Reject individual goal clips before any other check
  if (GOAL_CLIP_RE.test(title)) return null;
  if (
    SCORE_RE.test(title) ||
    t.includes("highlight") ||
    t.includes("resumen") ||
    t.includes("revive") ||
    t.includes("tanda de penales") ||
    t.includes("full penalties") ||
    t.includes("eliminate") ||
    t.includes("recap") ||
    t.includes("penalty shootout") ||
    t.includes("full match") ||
    t.includes("goal |") ||
    t.includes("goals |") ||
    t.includes("best of") ||
    t.includes("best moments") ||
    t.includes("desde cancha")
  ) return "highlights";
  if (
    t.includes("watch live") ||
    t.includes("live |") ||
    t.includes("preview") ||
    t.includes("pre-game") ||
    t.includes("previa") ||
    t.includes("pre-partido") ||
    t.includes("first 10 minutes") ||
    t.includes("pre game")
  ) return "preview";
  return null;
}

// FIFA code → English names (for matching English-language channels)
export const FIFA_CODE_ENGLISH: Record<string, string[]> = {
  ARG: ["Argentina"], AUS: ["Australia"], BEL: ["Belgium"],
  BRA: ["Brazil"], CAN: ["Canada"], CHN: ["China", "PR China"],
  CMR: ["Cameroon"], COD: ["DR Congo", "Congo DR", "Congo"], COL: ["Colombia"],
  CRC: ["Costa Rica"], CRO: ["Croatia"], ECU: ["Ecuador"],
  EGY: ["Egypt"], ENG: ["England"], ESP: ["Spain"],
  FRA: ["France"], GER: ["Germany"], GHA: ["Ghana"],
  GRE: ["Greece"], HUN: ["Hungary"], IRN: ["Iran"],
  JAM: ["Jamaica"], JPN: ["Japan"], KAZ: ["Kazakhstan"],
  KOR: ["South Korea", "Korea Republic"], MAR: ["Morocco"],
  MEX: ["Mexico"], NED: ["Netherlands", "Holland"], NGA: ["Nigeria"],
  NOR: ["Norway"], NZL: ["New Zealand"], PAR: ["Paraguay"],
  PER: ["Peru"], POL: ["Poland"], POR: ["Portugal"],
  RSA: ["South Africa"], SAU: ["Saudi Arabia"], SEN: ["Senegal"],
  SRB: ["Serbia"], SUI: ["Switzerland"], SVK: ["Slovakia"],
  TAN: ["Tanzania"], TUN: ["Tunisia"], URU: ["Uruguay"],
  USA: ["USA", "United States"], VEN: ["Venezuela"],
  BIH: ["Bosnia", "Bosnia and Herzegovina"],
  CIV: ["Ivory Coast", "Cote d'Ivoire", "Côte d'Ivoire"],
  ALG: ["Algeria"], AUT: ["Austria"], CZE: ["Czech Republic", "Czechia"],
  DEN: ["Denmark"], ISL: ["Iceland"], IRL: ["Ireland", "Republic of Ireland"],
  ISR: ["Israel"], MNE: ["Montenegro"], MKD: ["North Macedonia"],
  QAT: ["Qatar"], ROM: ["Romania"], SCO: ["Scotland"],
  SVN: ["Slovenia"], SWE: ["Sweden"], TUR: ["Turkey", "Türkiye"],
  UKR: ["Ukraine"], WAL: ["Wales"], GEO: ["Georgia"],
  KSA: ["Saudi Arabia"], RDC: ["DR Congo", "Congo DR", "DRC", "Congo"],
  CPV: ["Cape Verde"], CUW: ["Curacao", "Curaçao"],
  HAI: ["Haiti"], IRQ: ["Iraq"], JOR: ["Jordan"],
  PAN: ["Panama"], UZB: ["Uzbekistan"],
};

function parseRss(xml: string, channelName: string, priority: number): YoutubeVideo[] {
  const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) ?? [];
  return entries.flatMap((entry) => {
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const rawTitle = entry.match(/<title>([^<]+)<\/title>/)?.[1];
    const published = entry.match(/<published>([^<]+)<\/published>/)?.[1];
    const thumbMatch = entry.match(/media:thumbnail[^>]+url="([^"]+)"/);
    if (!videoId || !rawTitle) return [];
    const title = rawTitle
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    return [{
      videoId,
      title,
      publishedAt: published ?? new Date().toISOString(),
      thumbnailUrl: thumbMatch?.[1] ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      channelSource: channelName,
      channelPriority: priority,
    }];
  });
}

export async function fetchBroadcastVideos(): Promise<YoutubeVideo[]> {
  const all: YoutubeVideo[] = [];
  await Promise.all(
    BROADCAST_CHANNELS.map(async (ch) => {
      try {
        const res = await fetch(
          `https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`,
          { cache: "no-store", signal: AbortSignal.timeout(10000) }
        );
        if (!res.ok) return;
        const xml = await res.text();
        all.push(...parseRss(xml, ch.name, ch.priority));
      } catch { /* ignore individual channel failures or timeouts */ }
    })
  );
  return all;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function nameMatchesTitle(title: string, name: string): boolean {
  try {
    // Word boundary match prevents "Nusa" matching "USA" or "para" matching "PAR"
    return new RegExp(`\\b${escapeRegex(name)}\\b`, "i").test(title);
  } catch {
    return title.toLowerCase().includes(name.toLowerCase());
  }
}

export function videoMatchesTeams(
  title: string,
  homeNames: (string | null)[],
  awayNames: (string | null)[]
): boolean {
  const homeMatch = homeNames.some((n) => n && n.length >= 3 && nameMatchesTitle(title, n));
  const awayMatch = awayNames.some((n) => n && n.length >= 3 && nameMatchesTitle(title, n));
  return homeMatch && awayMatch;
}
