import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { TOURNAMENT_ID } from "@/constants";
import {
  fetchBroadcastVideos,
  detectVideoType,
  videoMatchesTeams,
  FIFA_CODE_ENGLISH,
  type YoutubeVideo,
} from "@/services/youtube";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// ── YouTube Data API search ────────────────────────────────────────────────────
interface YTSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    publishedAt: string;
    channelTitle: string;
    thumbnails: { high?: { url: string }; default?: { url: string } };
  };
}

const YT_CHANNELS_SCHEDULED = [
  "Telemundo Deportes",
  "FOX Soccer",
  "TSN Sports",
];

const YT_CHANNEL_IDS: Record<string, string> = {
  "Telemundo Deportes": "UCjZ7QPKb89R-4SxzBoceyOg",
  "FOX Soccer": "UCwNqHDsnBCKT-olwJwIFyfg",
  "TSN Sports": "UC--i2rV5NCxiEIPefr3l-zQ",
};

async function searchYouTube(
  query: string,
  apiKey: string,
  maxResults = 5
): Promise<YoutubeVideo[]> {
  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", query);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", String(maxResults));
    url.searchParams.set("order", "relevance");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];

    const data = await res.json() as { items?: YTSearchItem[] };
    if (!data.items) return [];

    return data.items.map((item, i) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      publishedAt: item.snippet.publishedAt,
      thumbnailUrl:
        item.snippet.thumbnails.high?.url ??
        item.snippet.thumbnails.default?.url ??
        `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
      channelSource: item.snippet.channelTitle,
      channelPriority: YT_CHANNELS_SCHEDULED.indexOf(item.snippet.channelTitle) >= 0
        ? YT_CHANNELS_SCHEDULED.indexOf(item.snippet.channelTitle) + 1
        : 10 + i,
    }));
  } catch {
    return [];
  }
}

// Build search query for a match based on status
function buildSearchQuery(
  homeEnName: string,
  awayEnName: string,
  status: string,
  hasPenalties: boolean
): string {
  if (status === "finished") {
    if (hasPenalties) {
      return `${homeEnName} vs ${awayEnName} highlights tanda penales World Cup 2026`;
    }
    return `${homeEnName} vs ${awayEnName} match highlights World Cup 2026`;
  }
  if (status === "scheduled" || status === "upcoming") {
    return `${homeEnName} vs ${awayEnName} match preview World Cup 2026`;
  }
  // live — return empty, keep existing preview
  return "";
}

// Get English name for a team
function getEnglishName(
  teamName: string | null,
  fifaCode: string | null
): string {
  if (fifaCode && FIFA_CODE_ENGLISH[fifaCode]?.length) {
    return FIFA_CODE_ENGLISH[fifaCode][0];
  }
  return teamName ?? "";
}

// ── Exported helper: sync videos for a single just-finished match ────────────
// Called from football sync route when a match transitions to "finished"
export async function syncVideosForMatch(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  matchId: string,
  homeTeamName: string | null,
  awayTeamName: string | null,
  homeTeamCode: string | null,
  awayTeamCode: string | null,
  hasPenalties: boolean
): Promise<{ added: number }> {
  const ytApiKey = process.env.YOUTUBE_API_KEY;
  let added = 0;

  // Delete any preview videos for this match now it's finished
  await supabase.from("match_videos").delete().eq("match_id", matchId).eq("type", "preview");

  // Phase 1: RSS-based
  try {
    const videos = await fetchBroadcastVideos();
    const sorted = [...videos].sort((a, b) => a.channelPriority - b.channelPriority);

    const homeNames = [
      homeTeamName,
      homeTeamCode,
      ...(homeTeamCode ? (FIFA_CODE_ENGLISH[homeTeamCode] ?? []) : []),
    ];
    const awayNames = [
      awayTeamName,
      awayTeamCode,
      ...(awayTeamCode ? (FIFA_CODE_ENGLISH[awayTeamCode] ?? []) : []),
    ];

    // Filter out bad video types (individual goals, Best Moments compilations)
    const goodVideos = sorted.filter((v) => {
      const t = v.title.toLowerCase();
      // Reject individual goal clips
      if (t.includes("gol de ") || t.startsWith("goal |") || t.startsWith("goal:")) return false;
      // Reject multi-match Best Moments compilations (they have "matchday" + "best moments")
      if (t.includes("best moments") && t.includes("matchday")) return false;
      if (t.includes("best moments") && !t.includes(" vs ") && !t.includes(" v ")) return false;
      return true;
    });

    let bestPriority = 99;
    for (const video of goodVideos) {
      const type = detectVideoType(video.title);
      if (type !== "highlights") continue;
      if (!videoMatchesTeams(video.title, homeNames, awayNames)) continue;
      if (video.channelPriority > bestPriority) continue;

      const { error } = await supabase.from("match_videos").upsert(
        {
          match_id: matchId,
          youtube_video_id: video.videoId,
          title: video.title,
          type: "highlights",
          thumbnail_url: video.thumbnailUrl,
          published_at: video.publishedAt,
          channel_source: video.channelSource,
          channel_priority: video.channelPriority,
        },
        { onConflict: "match_id,youtube_video_id" }
      );
      if (!error) {
        added++;
        bestPriority = Math.min(bestPriority, video.channelPriority);
      }
      break;
    }
  } catch { /* RSS failures are non-fatal */ }

  // Phase 2: YouTube Data API search (if key available and no priority-1 video yet)
  if (ytApiKey) {
    const homeEn = homeTeamCode ? (FIFA_CODE_ENGLISH[homeTeamCode]?.[0] ?? homeTeamName ?? "") : (homeTeamName ?? "");
    const awayEn = awayTeamCode ? (FIFA_CODE_ENGLISH[awayTeamCode]?.[0] ?? awayTeamName ?? "") : (awayTeamName ?? "");

    if (homeEn && awayEn) {
      const query = hasPenalties
        ? `${homeEn} vs ${awayEn} highlights tanda penales World Cup 2026`
        : `${homeEn} vs ${awayEn} extended highlights World Cup 2026`;

      const ytVideos = await searchYouTube(query, ytApiKey, 5);
      const homeNames = [homeTeamName, homeTeamCode, ...(homeTeamCode ? (FIFA_CODE_ENGLISH[homeTeamCode] ?? []) : [])];
      const awayNames = [awayTeamName, awayTeamCode, ...(awayTeamCode ? (FIFA_CODE_ENGLISH[awayTeamCode] ?? []) : [])];

      for (const video of ytVideos) {
        const t = video.title.toLowerCase();
        // Filter individual goals and multi-match compilations
        if (t.includes("gol de ") || (t.includes("best moments") && t.includes("matchday"))) continue;
        if (detectVideoType(video.title) !== "highlights") continue;
        if (!videoMatchesTeams(video.title, homeNames, awayNames)) continue;
        if (video.channelPriority > 4) continue; // only authorized channels

        const { error } = await supabase.from("match_videos").upsert(
          {
            match_id: matchId,
            youtube_video_id: video.videoId,
            title: video.title,
            type: "highlights",
            thumbnail_url: video.thumbnailUrl,
            published_at: video.publishedAt,
            channel_source: video.channelSource,
            channel_priority: video.channelPriority,
          },
          { onConflict: "match_id,youtube_video_id" }
        );
        if (!error) added++;
        break;
      }

      // Penalty shootout video
      if (hasPenalties) {
        const penQuery = `${homeEn} vs ${awayEn} penalty shootout tanda penales World Cup 2026`;
        const penVideos = await searchYouTube(penQuery, ytApiKey, 3);
        for (const video of penVideos) {
          const t = video.title.toLowerCase();
          if (!t.includes("tanda") && !t.includes("penalty") && !t.includes("penalties") && !t.includes("penales")) continue;
          const { error } = await supabase.from("match_videos").upsert(
            {
              match_id: matchId,
              youtube_video_id: video.videoId,
              title: video.title,
              type: "highlights",
              thumbnail_url: video.thumbnailUrl,
              published_at: video.publishedAt,
              channel_source: video.channelSource,
              channel_priority: video.channelPriority,
            },
            { onConflict: "match_id,youtube_video_id" }
          );
          if (!error) added++;
          break;
        }
      }
    }
  }

  return { added };
}

export async function GET(request: NextRequest) {
  const isVercelCron = request.headers.get("user-agent") === "vercel-cron/1.0";
  const secret = process.env.FOOTBALL_SYNC_SECRET;
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!isVercelCron && !(secret && bearer === secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const ytApiKey = process.env.YOUTUBE_API_KEY;

  // ── Fetch matches ──────────────────────────────────────────────────────────
  const { data: matches } = await supabase
    .from("matches")
    .select(`
      id, status, match_date,
      home_score_penalties, away_score_penalties,
      home_team:teams!matches_home_team_id_fkey(name, short_name, fifa_code),
      away_team:teams!matches_away_team_id_fkey(name, short_name, fifa_code)
    `)
    .eq("tournament_id", TOURNAMENT_ID)
    .not("home_team_id", "is", null)
    .not("away_team_id", "is", null);

  if (!matches?.length) return NextResponse.json({ synced: 0 });

  // ── Fetch existing videos metadata ─────────────────────────────────────────
  const { data: existing } = await supabase
    .from("match_videos")
    .select("match_id, type, channel_priority");

  const bestPriority: Record<string, number> = {};
  for (const ex of existing ?? []) {
    const key = `${ex.match_id}|${ex.type}`;
    if (!(key in bestPriority) || ex.channel_priority < bestPriority[key]) {
      bestPriority[key] = ex.channel_priority;
    }
  }

  let synced = 0;
  let ytSearched = 0;

  // ── Phase 1: RSS-based sync (existing logic) ───────────────────────────────
  const videos = await fetchBroadcastVideos();

  if (videos.length > 0) {
    const sorted = [...videos].sort((a, b) => a.channelPriority - b.channelPriority);

    for (const video of sorted) {
      const type = detectVideoType(video.title);
      if (!type) continue;

      for (const match of matches) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const home = match.home_team as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const away = match.away_team as any;
        const homeCode = home?.fifa_code;
        const awayCode = away?.fifa_code;

        const homeNames = [
          home?.name, home?.short_name, homeCode,
          ...(homeCode ? (FIFA_CODE_ENGLISH[homeCode] ?? []) : []),
        ];
        const awayNames = [
          away?.name, away?.short_name, awayCode,
          ...(awayCode ? (FIFA_CODE_ENGLISH[awayCode] ?? []) : []),
        ];

        if (!videoMatchesTeams(video.title, homeNames, awayNames)) continue;
        if (type === "highlights" && match.status !== "finished") continue;

        const key = `${match.id}|${type}`;
        const existingBest = bestPriority[key] ?? 99;
        if (video.channelPriority > existingBest) break;

        const { error } = await supabase.from("match_videos").upsert(
          {
            match_id: match.id,
            youtube_video_id: video.videoId,
            title: video.title,
            type,
            thumbnail_url: video.thumbnailUrl,
            published_at: video.publishedAt,
            channel_source: video.channelSource,
            channel_priority: video.channelPriority,
          },
          { onConflict: "match_id,youtube_video_id" }
        );

        if (!error) {
          synced++;
          bestPriority[key] = Math.min(existingBest, video.channelPriority);
        }
        break;
      }
    }
  }

  // ── Phase 2: YouTube Data API search by match status ──────────────────────
  if (ytApiKey) {
    // Only search for finished (highlights) or scheduled (previews) matches
    const actionableMatches = matches.filter(
      (m) => m.status === "finished" || m.status === "scheduled" || m.status === "upcoming"
    );

    for (const match of actionableMatches) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const home = match.home_team as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const away = match.away_team as any;

      const homeEn = getEnglishName(home?.name, home?.fifa_code);
      const awayEn = getEnglishName(away?.name, away?.fifa_code);
      if (!homeEn || !awayEn) continue;

      const hasPenalties =
        match.home_score_penalties != null && match.away_score_penalties != null;

      const query = buildSearchQuery(homeEn, awayEn, match.status, hasPenalties);
      if (!query) continue;

      const videoType: "highlights" | "preview" =
        match.status === "finished" ? "highlights" : "preview";

      // Don't re-search if we already have a priority 1 video for this type
      const key = `${match.id}|${videoType}`;
      if ((bestPriority[key] ?? 99) <= 1) continue;

      ytSearched++;
      const ytVideos = await searchYouTube(query, ytApiKey, 5);

      for (const video of ytVideos) {
        const detectedType = detectVideoType(video.title);
        if (detectedType !== videoType) continue;

        const homeNames = [
          home?.name, home?.short_name, home?.fifa_code,
          ...(home?.fifa_code ? (FIFA_CODE_ENGLISH[home.fifa_code] ?? []) : []),
        ];
        const awayNames = [
          away?.name, away?.short_name, away?.fifa_code,
          ...(away?.fifa_code ? (FIFA_CODE_ENGLISH[away.fifa_code] ?? []) : []),
        ];

        if (!videoMatchesTeams(video.title, homeNames, awayNames)) continue;
        if (video.channelPriority > 4) continue; // only authorized channels

        const existingBest = bestPriority[key] ?? 99;
        if (video.channelPriority >= existingBest) continue;

        const { error } = await supabase.from("match_videos").upsert(
          {
            match_id: match.id,
            youtube_video_id: video.videoId,
            title: video.title,
            type: videoType,
            thumbnail_url: video.thumbnailUrl,
            published_at: video.publishedAt,
            channel_source: video.channelSource,
            channel_priority: video.channelPriority,
          },
          { onConflict: "match_id,youtube_video_id" }
        );

        if (!error) {
          synced++;
          bestPriority[key] = video.channelPriority;
        }
        break;
      }

      // Penalty-specific search for finished matches with shootout
      if (match.status === "finished" && hasPenalties) {
        const penKey = `${match.id}|highlights_penalties`;
        if ((bestPriority[penKey] ?? 99) <= 1) continue;

        const penQuery = `${homeEn} vs ${awayEn} tanda penales penalty shootout World Cup 2026`;
        const penVideos = await searchYouTube(penQuery, ytApiKey, 3);

        for (const video of penVideos) {
          const t = video.title.toLowerCase();
          const isPenalty =
            t.includes("tanda") || t.includes("penalty") || t.includes("penalties") || t.includes("penales");
          if (!isPenalty) continue;

          const { error } = await supabase.from("match_videos").upsert(
            {
              match_id: match.id,
              youtube_video_id: video.videoId,
              title: video.title,
              type: "highlights",
              thumbnail_url: video.thumbnailUrl,
              published_at: video.publishedAt,
              channel_source: video.channelSource,
              channel_priority: video.channelPriority,
            },
            { onConflict: "match_id,youtube_video_id" }
          );

          if (!error) synced++;
          break;
        }
      }
    }
  }

  return NextResponse.json({
    synced,
    rss_videos: videos.length,
    yt_searches: ytSearched,
    has_yt_api: !!ytApiKey,
  });
}
