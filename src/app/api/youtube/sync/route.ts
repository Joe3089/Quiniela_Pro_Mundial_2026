import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { TOURNAMENT_ID } from "@/constants";
import {
  fetchBroadcastVideos,
  detectVideoType,
  videoMatchesTeams,
  FIFA_CODE_ENGLISH,
} from "@/services/youtube";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const isVercelCron = request.headers.get("user-agent") === "vercel-cron/1.0";
  const secret = process.env.FOOTBALL_SYNC_SECRET;
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!isVercelCron && !(secret && bearer === secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();

  const { data: matches } = await supabase
    .from("matches")
    .select(`
      id, status, match_date,
      home_team:teams!matches_home_team_id_fkey(name, short_name, fifa_code),
      away_team:teams!matches_away_team_id_fkey(name, short_name, fifa_code)
    `)
    .eq("tournament_id", TOURNAMENT_ID)
    .not("home_team_id", "is", null)
    .not("away_team_id", "is", null);

  if (!matches?.length) return NextResponse.json({ synced: 0 });

  const videos = await fetchBroadcastVideos();
  if (!videos.length) return NextResponse.json({ synced: 0, reason: "no_videos_from_rss" });

  let synced = 0;

  // Existing videos: track which (match_id, type) already have a given priority
  const { data: existing } = await supabase
    .from("match_videos")
    .select("match_id, type, channel_priority");

  // Map: "match_id|type" → best priority already stored
  const bestPriority: Record<string, number> = {};
  for (const ex of existing ?? []) {
    const key = `${ex.match_id}|${ex.type}`;
    if (!(key in bestPriority) || ex.channel_priority < bestPriority[key]) {
      bestPriority[key] = ex.channel_priority;
    }
  }

  // Sort videos: higher priority channels first
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

      // Only upsert if this channel has equal or better priority
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

  return NextResponse.json({ synced, total: videos.length, channels: 3 });
}
