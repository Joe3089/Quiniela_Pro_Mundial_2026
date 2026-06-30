// Official FIFA YouTube channel
const FIFA_CHANNEL_ID = "UCpcTrCXblq78GZrTUTLWeBw";

// FIFA code → English name (for matching YouTube titles which use English)
export const FIFA_CODE_ENGLISH: Record<string, string[]> = {
  ARG: ["Argentina"], AUS: ["Australia"], BEL: ["Belgium"],
  BRA: ["Brazil"], CAN: ["Canada"], CHN: ["China", "PR China"],
  CMR: ["Cameroon"], COD: ["DR Congo", "Congo DR"], COL: ["Colombia"],
  CRC: ["Costa Rica"], CRO: ["Croatia"], ECU: ["Ecuador"],
  EGY: ["Egypt"], ENG: ["England"], ESP: ["Spain"],
  FRA: ["France"], GER: ["Germany"], GHA: ["Ghana"],
  GRE: ["Greece"], HUN: ["Hungary"], IRN: ["Iran"],
  JAM: ["Jamaica"], JPN: ["Japan"], KAZ: ["Kazakhstan"],
  KOR: ["South Korea", "Korea Republic"], MAR: ["Morocco"],
  MEX: ["Mexico"], MOR: ["Morocco"], NED: ["Netherlands", "Holland"],
  NGA: ["Nigeria"], NOR: ["Norway"], NZL: ["New Zealand"],
  PAR: ["Paraguay"], PER: ["Peru"], POL: ["Poland"],
  POR: ["Portugal"], RSA: ["South Africa"], RUS: ["Russia"],
  SAU: ["Saudi Arabia"], SEN: ["Senegal"], SRB: ["Serbia"],
  SUI: ["Switzerland"], SVK: ["Slovakia"], TAN: ["Tanzania"],
  THA: ["Thailand"], TUN: ["Tunisia"], URU: ["Uruguay"],
  USA: ["USA", "United States"], VEN: ["Venezuela"],
  BIH: ["Bosnia", "Bosnia and Herzegovina"], CIV: ["Ivory Coast", "Côte d'Ivoire"],
  ALB: ["Albania"], AUT: ["Austria"], BLR: ["Belarus"],
  CZE: ["Czech Republic", "Czechia"], DEN: ["Denmark"],
  FIN: ["Finland"], IRL: ["Republic of Ireland", "Ireland"],
  ISL: ["Iceland"], ISR: ["Israel"], MNE: ["Montenegro"],
  MKD: ["North Macedonia"], QAT: ["Qatar"], ROM: ["Romania"],
  SCO: ["Scotland"], SVN: ["Slovenia"], SWE: ["Sweden"],
  TUR: ["Turkey"], UKR: ["Ukraine"], WAL: ["Wales"],
  LUX: ["Luxembourg"], GEO: ["Georgia"], KWT: ["Kuwait"],
  BHR: ["Bahrain"], OMN: ["Oman"],
};

export interface YoutubeVideo {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
}

export type VideoType = "highlights" | "preview";

// Score pattern like "1-0", "(2)1-1(3)"
const SCORE_RE = /\(\d+\)\d+-\d+\(\d+\)|\d+-\d+/;

export function detectVideoType(title: string): VideoType | null {
  const t = title.toLowerCase();
  // Highlights: score in title, or match result/recap keywords
  if (
    SCORE_RE.test(title) ||
    t.includes("highlight") ||
    t.includes("eliminate") ||
    t.includes("recap") ||
    t.includes("penalty shootout") ||
    t.includes("full match") ||
    t.includes("goal |") ||
    t.includes("goals |")
  ) return "highlights";
  // Preview: live stream or preview keywords
  if (
    t.includes("watch live") ||
    t.includes("preview") ||
    t.includes("live |")
  ) return "preview";
  return null;
}

export function videoMatchesTeams(
  title: string,
  homeNames: (string | null)[],
  awayNames: (string | null)[]
): boolean {
  const t = title.toLowerCase();
  const homeMatch = homeNames.some((n) => n && t.includes(n.toLowerCase()));
  const awayMatch = awayNames.some((n) => n && t.includes(n.toLowerCase()));
  return homeMatch && awayMatch;
}

function parseRss(xml: string): YoutubeVideo[] {
  const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) ?? [];
  return entries.flatMap((entry) => {
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const rawTitle = entry.match(/<title>([^<]+)<\/title>/)?.[1];
    const published = entry.match(/<published>([^<]+)<\/published>/)?.[1];
    const thumbMatch = entry.match(/media:thumbnail[^>]+url="([^"]+)"/);
    if (!videoId || !rawTitle) return [];
    const title = rawTitle
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    return [{
      videoId,
      title,
      publishedAt: published ?? new Date().toISOString(),
      thumbnailUrl: thumbMatch?.[1] ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    }];
  });
}

export async function fetchFifaYoutubeVideos(): Promise<YoutubeVideo[]> {
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${FIFA_CHANNEL_ID}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRss(xml);
  } catch {
    return [];
  }
}
