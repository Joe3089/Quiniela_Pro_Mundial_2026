// Official FIFA YouTube channel
const FIFA_CHANNEL_ID = "UCpcTrCXblq78GZrTUTLWeBw";

export interface YoutubeVideo {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
}

export type VideoType = "highlights" | "preview";

export function detectVideoType(title: string): VideoType | null {
  const t = title.toLowerCase();
  if (t.includes("highlight")) return "highlights";
  if (t.includes("preview") || t.includes("match preview")) return "preview";
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
