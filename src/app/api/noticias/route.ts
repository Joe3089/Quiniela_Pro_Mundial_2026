import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 900;

interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  sourceColor: string;
  category: string;
  image?: string | null;
}

// Mundial 2026 (BBC) and Convocatorias (Sky Sports, Marca) publish real,
// bot-friendly RSS feeds we can hit directly.
const RSS_SOURCES = [
  {
    name: "BBC Sport",
    url: "https://feeds.bbci.co.uk/sport/football/rss.xml",
    color: "#BB1919",
    category: "mundial",
  },
  {
    name: "Sky Sports",
    url: "https://www.skysports.com/rss/12040",
    color: "#00A0E2",
    category: "convocatorias",
  },
  {
    name: "Marca",
    url: "https://www.marca.com/rss/futbol.xml",
    color: "#E31E24",
    category: "convocatorias",
  },
];

// FIFA, ESPN, FOX Sports, SportsCenter, DSPORTS and Diario AS either don't
// publish a public RSS feed at all (FIFA's site is a JS SPA now, DSPORTS has
// no working feed, SportsCenter is a TV segment brand with no site of its
// own) or block server-side/bot requests (AS returns 403). Google News' RSS
// search proxy indexes their real published headlines and links straight
// back to the source article, so it works uniformly for all six without
// needing per-site scraping or API keys.
const GOOGLE_NEWS_SOURCES = [
  { name: "FIFA News",   query: "site:fifa.com mundial 2026",           color: "#044B96", category: "fifa" },
  { name: "ESPN",        query: "site:espndeportes.espn.com mundial",   color: "#FF6B00", category: "espn" },
  { name: "FOX Sports",  query: "site:foxdeportes.com mundial",         color: "#003DA5", category: "foxsports" },
  { name: "SportsCenter",query: "SportsCenter mundial 2026",            color: "#CC0000", category: "sportscenter" },
  { name: "DSPORTS",     query: "DSPORTS mundial 2026",                 color: "#0057A8", category: "dsports" },
  { name: "Diario AS",   query: "site:as.com mundial 2026",             color: "#1E3A8A", category: "diarioas" },
];

function extractTag(xml: string, tag: string): string {
  const m =
    xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i")) ??
    xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

function stripHTML(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

function extractLink(itemXml: string): string {
  const linkTag = itemXml.match(/<link>([^<]+)<\/link>/i);
  if (linkTag) return linkTag[1].trim();
  const linkHref = itemXml.match(/<link[^>]+href="([^"]+)"/i);
  if (linkHref) return linkHref[1].trim();
  const guid = itemXml.match(/<guid[^>]*>([^<]+)<\/guid>/i);
  if (guid && guid[1].startsWith("http")) return guid[1].trim();
  return "#";
}

function extractImage(itemXml: string): string | null {
  const media = itemXml.match(/<media:content[^>]+url="([^"]+)"/i);
  if (media) return media[1];
  const enclosure = itemXml.match(/<enclosure[^>]+url="([^"]+)"[^>]+type="image/i);
  if (enclosure) return enclosure[1];
  const imgTag = itemXml.match(/<img[^>]+src="([^"]+)"/i);
  if (imgTag) return imgTag[1];
  return null;
}

async function fetchRssSource(
  source: { name: string; url: string; color: string; category: string },
  count = 8
): Promise<NewsItem[]> {
  try {
    const res = await fetch(source.url, {
      headers: { "User-Agent": "QuinielaPro/1.0 RSS Reader (+https://quiniela-pro-mundial-2026.vercel.app)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const items = xml.match(/<item[^>]*>([\s\S]*?)<\/item>/gi) ?? [];

    return items.slice(0, count).map((item) => ({
      title: stripHTML(extractTag(item, "title")),
      link: extractLink(item),
      description: stripHTML(extractTag(item, "description")),
      pubDate: extractTag(item, "pubDate"),
      source: source.name,
      sourceColor: source.color,
      category: source.category,
      image: extractImage(item) ?? null,
    })) as NewsItem[];
  } catch {
    return [];
  }
}

// Google News' RSS search always appends " - <Source Name>" to the title;
// strip it since we already show the source as a separate badge.
function stripSourceSuffix(title: string, sourceName: string): string {
  const suffix = ` - ${sourceName}`;
  return title.endsWith(suffix) ? title.slice(0, -suffix.length) : title;
}

async function fetchGoogleNewsSource(
  source: { name: string; query: string; color: string; category: string },
  count = 8
): Promise<NewsItem[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(source.query)}&hl=es-419&gl=MX&ceid=MX:es-419`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; QuinielaPro/1.0)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const items = xml.match(/<item>([\s\S]*?)<\/item>/gi) ?? [];

    return items.slice(0, count).map((item) => {
      const itemSource = stripHTML(extractTag(item, "source")) || source.name;
      return {
        title: stripSourceSuffix(stripHTML(extractTag(item, "title")), itemSource),
        link: extractLink(item),
        description: "",
        pubDate: extractTag(item, "pubDate"),
        source: source.name,
        sourceColor: source.color,
        category: source.category,
        image: null,
      };
    }) as NewsItem[];
  } catch {
    return [];
  }
}

// Deduplicate by link
function deduplicate(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category") ?? "all";

  const rssSources =
    category === "all" ? RSS_SOURCES : RSS_SOURCES.filter((s) => s.category === category);
  const googleSources =
    category === "all" ? GOOGLE_NEWS_SOURCES : GOOGLE_NEWS_SOURCES.filter((s) => s.category === category);

  const results = await Promise.allSettled([
    ...rssSources.map((s) => fetchRssSource(s, 8)),
    ...googleSources.map((s) => fetchGoogleNewsSource(s, 8)),
  ]);

  const allItems: NewsItem[] = results.flatMap((r) =>
    r.status === "fulfilled" ? r.value : []
  );

  allItems.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });

  const unique = deduplicate(allItems.filter((i) => i.title && i.link !== "#"));

  return NextResponse.json(
    { items: unique },
    { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=120" } }
  );
}
