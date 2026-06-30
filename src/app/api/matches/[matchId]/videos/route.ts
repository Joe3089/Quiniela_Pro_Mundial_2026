import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("match_videos")
    .select("id, match_id, youtube_video_id, title, type, thumbnail_url, published_at, channel_source, channel_priority, duration_seconds")
    .eq("match_id", matchId)
    .order("channel_priority", { ascending: true })
    .order("published_at", { ascending: false });

  // Best video per type (lowest channel_priority = highest priority)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byType: Record<string, any> = {};
  for (const v of data ?? []) {
    if (!byType[v.type]) byType[v.type] = v;
  }

  // highlights first, then preview — never duplicates
  const result = [byType["highlights"], byType["preview"]].filter(Boolean);

  return NextResponse.json(result);
}
