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

const RSS_SOURCES = [
  // FIFA oficial
  {
    name: "FIFA News",
    url: "https://www.fifa.com/rss/news_en.xml",
    color: "#044B96",
    category: "fifa",
  },
  // Mundial 2026
  {
    name: "BBC Sport",
    url: "https://feeds.bbci.co.uk/sport/football/rss.xml",
    color: "#BB1919",
    category: "mundial",
  },
  // Convocatorias
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
  // ESPN
  {
    name: "ESPN",
    url: "https://www.espn.com/espn/rss/soccer/news",
    color: "#FF6B00",
    category: "espn",
  },
  // FOX Sports — GNews fallback (curated soccer feed)
  {
    name: "FOX Sports",
    url: "https://gnews.io/api/v4/search?q=soccer+world+cup+2026&lang=en&country=us&max=10&apikey=pub_fallback",
    color: "#003DA5",
    category: "foxsports",
    gnews: true,
  },
  // SportsCenter (ESPN Latam)
  {
    name: "SportsCenter",
    url: "https://www.espn.com.mx/rss/news",
    color: "#CC0000",
    category: "sportscenter",
  },
  // DSPORTS
  {
    name: "DSPORTS",
    url: "https://dsports.com/feed",
    color: "#0057A8",
    category: "dsports",
  },
  // Diario AS
  {
    name: "Diario AS",
    url: "https://as.com/rss/futbol/mundial/",
    color: "#1E3A8A",
    category: "diarioas",
  },
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

async function fetchGNewsSource(
  source: { name: string; color: string; category: string },
  count = 8
): Promise<NewsItem[]> {
  try {
    const apiKey = process.env.GNEWS_API_KEY;
    if (!apiKey) return [];

    const url = `https://gnews.io/api/v4/search?q=soccer+world+cup+2026&lang=en&max=${count}&apikey=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];

    const data = await res.json() as { articles?: Array<{ title: string; url: string; description: string; publishedAt: string; image?: string }> };
    if (!data.articles) return [];

    return data.articles.map((a) => ({
      title: a.title ?? "",
      link: a.url ?? "#",
      description: (a.description ?? "").slice(0, 220),
      pubDate: a.publishedAt ?? "",
      source: source.name,
      sourceColor: source.color,
      category: source.category,
      image: a.image ?? null,
    }));
  } catch {
    return [];
  }
}

async function fetchSource(
  source: { name: string; url: string; color: string; category: string; gnews?: boolean },
  count = 8
): Promise<NewsItem[]> {
  if (source.gnews) {
    return fetchGNewsSource(source, count);
  }
  return fetchRssSource(source, count);
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

  const sources =
    category === "all"
      ? RSS_SOURCES
      : RSS_SOURCES.filter((s) => s.category === category);

  const results = await Promise.allSettled(sources.map((s) => fetchSource(s, 8)));

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
