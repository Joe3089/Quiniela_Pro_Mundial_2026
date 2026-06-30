import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { TOURNAMENT_ID } from "@/constants";
import { fetchFifaYoutubeVideos, detectVideoType, videoMatchesTeams, FIFA_CODE_ENGLISH } from "@/services/youtube";

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
    .select(`id, status, match_date,
      home_team:teams!matches_home_team_id_fkey(name, short_name, fifa_code),
      away_team:teams!matches_away_team_id_fkey(name, short_name, fifa_code)`)
    .eq("tournament_id", TOURNAMENT_ID)
    .not("home_team_id", "is", null)
    .not("away_team_id", "is", null);

  if (!matches?.length) return NextResponse.json({ synced: 0 });

  const videos = await fetchFifaYoutubeVideos();
  if (!videos.length) return NextResponse.json({ synced: 0, reason: "no_videos_from_rss" });

  let synced = 0;

  for (const video of videos) {
    const type = detectVideoType(video.title);
    if (!type) continue;

    for (const match of matches) {
      const home = match.home_team as any;
      const away = match.away_team as any;
      const homeCode = home?.fifa_code as string | undefined;
      const awayCode = away?.fifa_code as string | undefined;
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

      const { error } = await supabase.from("match_videos").upsert(
        {
          match_id: match.id,
          youtube_video_id: video.videoId,
          title: video.title,
          type,
          thumbnail_url: video.thumbnailUrl,
          published_at: video.publishedAt,
        },
        { onConflict: "match_id,youtube_video_id", ignoreDuplicates: true }
      );

      if (!error) synced++;
      break;
    }
  }

  return NextResponse.json({ synced, total: videos.length });
}
