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

// Authorized channel names as they appear in YouTube API responses (no FIFA)
const YT_CHANNELS_SCHEDULED = [
  "Telemundo Deportes",
  "FOX Soccer",
  "FOX Sports",
];

const YT_CHANNEL_IDS: Record<string, string> = {
  "Telemundo Deportes": "UCjZ7QPKb89R-4SxzBoceyOg",
  "FOX Soccer": "UCwNqHDsnBCKT-olwJwIFyfg",
};

async function searchYouTube(
  query: string,
  apiKey: string,
  maxResults = 5,
  channelId?: string
): Promise<YoutubeVideo[]> {
  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", query);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", String(maxResults));
    url.searchParams.set("order", "relevance");
    url.searchParams.set("key", apiKey);
    if (channelId) url.searchParams.set("channelId", channelId);

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

// Search across all authorized channels in priority order, return first match
async function searchAuthorizedChannels(
  query: string,
  apiKey: string,
  validateFn: (title: string) => boolean
): Promise<YoutubeVideo | null> {
  for (const [name, chId] of Object.entries(YT_CHANNEL_IDS)) {
    const results = await searchYouTube(query, apiKey, 3, chId);
    const priority = YT_CHANNELS_SCHEDULED.indexOf(name) + 1;
    for (const v of results) {
      if (validateFn(v.title)) {
        return { ...v, channelSource: name, channelPriority: priority };
      }
    }
  }
  return null;
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

      const homeNames = [homeTeamName, homeTeamCode, ...(homeTeamCode ? (FIFA_CODE_ENGLISH[homeTeamCode] ?? []) : [])];
      const awayNames = [awayTeamName, awayTeamCode, ...(awayTeamCode ? (FIFA_CODE_ENGLISH[awayTeamCode] ?? []) : [])];

      const isHighlight = (title: string) => {
        const t = title.toLowerCase();
        if (t.includes("gol de ") || (t.includes("best moments") && t.includes("matchday"))) return false;
        return detectVideoType(title) === "highlights" && videoMatchesTeams(title, homeNames, awayNames);
      };

      const foundHighlight = await searchAuthorizedChannels(query, ytApiKey, isHighlight);
      if (foundHighlight) {
        const { error } = await supabase.from("match_videos").upsert(
          {
            match_id: matchId,
            youtube_video_id: foundHighlight.videoId,
            title: foundHighlight.title,
            type: "highlights",
            thumbnail_url: foundHighlight.thumbnailUrl,
            published_at: foundHighlight.publishedAt,
            channel_source: foundHighlight.channelSource,
            channel_priority: foundHighlight.channelPriority,
          },
          { onConflict: "match_id,youtube_video_id" }
        );
        if (!error) added++;
      }

      // Penalty shootout video
      if (hasPenalties) {
        const penQuery = `${homeEn} vs ${awayEn} penalty shootout tanda penales World Cup 2026`;
        const isPenVideo = (title: string) => {
          const t = title.toLowerCase();
          return (t.includes("tanda") || t.includes("penalty") || t.includes("penalties") || t.includes("penales")) &&
            videoMatchesTeams(title, homeNames, awayNames);
        };
        const foundPen = await searchAuthorizedChannels(penQuery, ytApiKey, isPenVideo);
        if (foundPen) {
          const { error } = await supabase.from("match_videos").upsert(
            {
              match_id: matchId,
              youtube_video_id: foundPen.videoId,
              title: foundPen.title,
              type: "highlights",
              thumbnail_url: foundPen.thumbnailUrl,
              published_at: foundPen.publishedAt,
              channel_source: foundPen.channelSource,
              channel_priority: foundPen.channelPriority,
            },
            { onConflict: "match_id,youtube_video_id" }
          );
          if (!error) added++;
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
  // Limit to 8 searches/run to stay within YouTube API quota (10k units/day, 100 units/search)
  const MAX_YT_SEARCHES = 8;

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

      // Only search matches with NO video at all (saves API quota)
      const key = `${match.id}|${videoType}`;
      if (bestPriority[key] !== undefined) continue;
      if (ytSearched >= MAX_YT_SEARCHES) break;

      ytSearched++;

      const homeNames = [
        home?.name, home?.short_name, home?.fifa_code,
        ...(home?.fifa_code ? (FIFA_CODE_ENGLISH[home.fifa_code] ?? []) : []),
      ];
      const awayNames = [
        away?.name, away?.short_name, away?.fifa_code,
        ...(away?.fifa_code ? (FIFA_CODE_ENGLISH[away.fifa_code] ?? []) : []),
      ];

      // Search within authorized channels first (channel-scoped), then fall back to general
      const matchesTeams = (title: string) =>
        detectVideoType(title) === videoType && videoMatchesTeams(title, homeNames, awayNames);

      let foundVideo: YoutubeVideo | null = await searchAuthorizedChannels(query, ytApiKey, matchesTeams);

      // Fallback: general search filtered to authorized channels
      if (!foundVideo) {
        const ytVideos = await searchYouTube(query, ytApiKey, 5);
        for (const video of ytVideos) {
          if (!matchesTeams(video.title)) continue;
          if (video.channelPriority > 7) continue;
          foundVideo = video;
          break;
        }
      }

      if (foundVideo) {
        const existingBest = bestPriority[key] ?? 99;
        if (foundVideo.channelPriority < existingBest) {
          const { error } = await supabase.from("match_videos").upsert(
            {
              match_id: match.id,
              youtube_video_id: foundVideo.videoId,
              title: foundVideo.title,
              type: videoType,
              thumbnail_url: foundVideo.thumbnailUrl,
              published_at: foundVideo.publishedAt,
              channel_source: foundVideo.channelSource,
              channel_priority: foundVideo.channelPriority,
            },
            { onConflict: "match_id,youtube_video_id" }
          );
          if (!error) {
            synced++;
            bestPriority[key] = foundVideo.channelPriority;
          }
        }
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
