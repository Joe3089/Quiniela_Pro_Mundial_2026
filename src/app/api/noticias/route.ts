import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 900; // 15 minutes

interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  sourceColor: string;
}

const RSS_SOURCES = [
  {
    name: "BBC Sport",
    url: "https://feeds.bbci.co.uk/sport/football/rss.xml",
    color: "#BB1919",
  },
  {
    name: "ESPN FC",
    url: "https://www.espn.com/espn/rss/soccer/news",
    color: "#FF6B00",
  },
  {
    name: "Goal.com",
    url: "https://www.goal.com/feeds/en/news",
    color: "#00B04B",
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
    .slice(0, 200);
}

function extractLink(itemXml: string): string {
  // Try <link> tag (may have CDATA or self-closing)
  const linkTag = itemXml.match(/<link>([^<]+)<\/link>/i);
  if (linkTag) return linkTag[1].trim();
  // Try <link href="...">
  const linkHref = itemXml.match(/<link[^>]+href="([^"]+)"/i);
  if (linkHref) return linkHref[1].trim();
  // Try <guid>
  const guid = itemXml.match(/<guid[^>]*>([^<]+)<\/guid>/i);
  if (guid && guid[1].startsWith("http")) return guid[1].trim();
  return "#";
}

async function fetchSource(
  source: { name: string; url: string; color: string },
  count = 6
): Promise<NewsItem[]> {
  try {
    const res = await fetch(source.url, {
      headers: { "User-Agent": "QuinielaPro/1.0 RSS Reader" },
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
    }));
  } catch {
    return [];
  }
}

export async function GET() {
  const results = await Promise.allSettled(RSS_SOURCES.map((s) => fetchSource(s, 6)));

  const allItems: NewsItem[] = results.flatMap((r) =>
    r.status === "fulfilled" ? r.value : []
  );

  // Sort by pubDate descending (most recent first), fallback to original order
  allItems.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });

  return NextResponse.json(
    { items: allItems.filter((i) => i.title && i.link !== "#") },
    { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=120" } }
  );
}
